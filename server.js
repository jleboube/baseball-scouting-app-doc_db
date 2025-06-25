const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Database connection - using individual parameters to avoid connection string issues
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'baseball_scouting',
    user: process.env.DB_USER || 'scout_user',
    password: process.env.DB_PASSWORD || 'scout_pass',
});

// Test database connection on startup
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Database connected successfully');
        release();
    }
});

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Trust proxy for proper IP forwarding
app.set('trust proxy', 1);

// Session configuration
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || 'baseball-scouting-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Will be set to true in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(express.static(path.join(__dirname, 'public')));

// Define all database columns for scouting reports
const DB_FIELDS = [
    'scout_name', 'scout_date', 'event', 'league_organization',
    'player_name', 'primary_position', 'jersey_number', 'date_of_birth', 
    'age', 'height', 'weight', 'bats', 'throws', 'team', 'parent_guardian', 
    'contact', 'build', 'coordination', 'athleticism', 'motor_skills', 
    'growth_projection', 'stance_setup', 'swing_mechanics', 'contact_ability', 
    'power_potential', 'plate_discipline', 'bat_speed', 'approach', 'bunting',
    'speed', 'base_running_iq', 'stealing_ability', 'first_step', 'turns',
    'fielding_readiness', 'glove_work', 'footwork', 'arm_strength', 
    'arm_accuracy', 'range_field', 'game_awareness', 'positions_played',
    'fastball_mph', 'control_pitching', 'breaking_ball', 'changeup', 
    'delivery', 'mound_presence', 'strikes', 'game_understanding', 
    'coachability', 'effort_level', 'competitiveness', 'teamwork',
    'focus_attention', 'leadership', 'biggest_strengths', 'improvement_areas',
    'recommended_focus', 'current_level', 'development_potential', 
    'recommended_next_steps', 'playing_time_recommendation', 'position_projection',
    'additional_training', 'work_at_home', 'positive_reinforcement',
    'notes_observations', 'next_evaluation_date', 'followup_items'
];

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    } else {
        return res.status(401).json({ error: 'Authentication required' });
    }
};

// Authentication Routes

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const userQuery = `
            SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, 
                   u.group_id, g.name as group_name
            FROM users u 
            LEFT JOIN groups g ON u.group_id = g.id 
            WHERE u.email = $1 AND u.is_active = true
        `;
        
        const result = await pool.query(userQuery, [email.toLowerCase()]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const user = result.rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Set session
        req.session.userId = user.id;
        req.session.userEmail = user.email;
        req.session.groupId = user.group_id;
        req.session.groupName = user.group_name;
        
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                groupId: user.group_id,
                groupName: user.group_name
            }
        });
        
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Register with team code validation
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, groupId, registrationCode } = req.body;
        
        if (!email || !password || !firstName || !lastName || !groupId || !registrationCode) {
            return res.status(400).json({ error: 'All fields including registration code are required' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        // Check if user already exists
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Validate team and registration code
        const groupQuery = `
            SELECT id, name, registration_code 
            FROM groups WHERE id = $1
        `;
        const groupResult = await pool.query(groupQuery, [groupId]);
        
        if (groupResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid team selected' });
        }
        
        const group = groupResult.rows[0];
        
        // Check registration code
        if (group.registration_code !== registrationCode) {
            return res.status(400).json({ 
                error: 'Invalid registration code for this team'
            });
        }
        
        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Insert user
        const insertQuery = `
            INSERT INTO users (email, password_hash, first_name, last_name, group_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, email, first_name, last_name, group_id
        `;
        
        const result = await pool.query(insertQuery, [
            email.toLowerCase(), passwordHash, firstName, lastName, groupId
        ]);
        
        const user = result.rows[0];
        
        res.json({
            message: 'Registration successful! You can now login.',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                groupId: user.group_id,
                groupName: group.name
            }
        });
        
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logout successful' });
    });
});

// Check authentication status
app.get('/api/auth/me', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
        const userQuery = `
            SELECT u.id, u.email, u.first_name, u.last_name, u.group_id, g.name as group_name
            FROM users u 
            LEFT JOIN groups g ON u.group_id = g.id 
            WHERE u.id = $1 AND u.is_active = true
        `;
        
        const result = await pool.query(userQuery, [req.session.userId]);
        
        if (result.rows.length === 0) {
            req.session.destroy();
            return res.status(401).json({ error: 'User not found' });
        }
        
        const user = result.rows[0];
        res.json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                groupId: user.group_id,
                groupName: user.group_name
            }
        });
        
    } catch (err) {
        console.error('Auth check error:', err);
        res.status(500).json({ error: 'Authentication check failed' });
    }
});

// Get available groups
app.get('/api/groups', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, description FROM groups ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error('Groups fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});

// Protected Routes (require authentication)

// Get all scouting reports (filtered by user's group)
app.get('/api/reports', requireAuth, async (req, res) => {
    try {
        const query = `
            SELECT sr.id, sr.player_name, sr.primary_position, sr.team, sr.scout_date, sr.created_at,
                   u.first_name, u.last_name
            FROM scouting_reports sr
            LEFT JOIN users u ON sr.user_id = u.id
            WHERE sr.group_id = $1 OR sr.group_id IS NULL
            ORDER BY sr.created_at DESC
        `;
        
        const result = await pool.query(query, [req.session.groupId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

// Get single scouting report (must be in same group)
app.get('/api/reports/:id', requireAuth, async (req, res) => {
    try {
        const query = `
            SELECT * FROM scouting_reports 
            WHERE id = $1 AND (group_id = $2 OR group_id IS NULL)
        `;
        
        const result = await pool.query(query, [req.params.id, req.session.groupId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch report' });
    }
});

// Create new scouting report
app.post('/api/reports', requireAuth, async (req, res) => {
    const data = req.body;
    
    try {
        console.log('Creating report with fields:', DB_FIELDS.length);
        
        // Add user_id and group_id to the fields and data
        const fieldsWithUser = ['user_id', 'group_id', ...DB_FIELDS];
        const placeholders = fieldsWithUser.map((_, index) => `$${index + 1}`).join(', ');
        
        const query = `
            INSERT INTO scouting_reports (${fieldsWithUser.join(', ')}) 
            VALUES (${placeholders}) 
            RETURNING id
        `;
        
        // Extract values, prepending user_id and group_id
        const values = [
            req.session.userId,
            req.session.groupId,
            ...DB_FIELDS.map(field => {
                const value = data[field];
                return (value !== undefined && value !== '') ? value : null;
            })
        ];
        
        console.log('Query has', fieldsWithUser.length, 'columns and', values.length, 'values');
        
        const result = await pool.query(query, values);
        res.json({ id: result.rows[0].id, message: 'Report created successfully' });
        
    } catch (err) {
        console.error('Database error:', err.message);
        console.error('Full error:', err);
        res.status(500).json({ 
            error: 'Failed to create report', 
            details: err.message 
        });
    }
});

// Update scouting report (must be in same group)
app.put('/api/reports/:id', requireAuth, async (req, res) => {
    const data = req.body;
    const reportId = req.params.id;
    
    try {
        // First check if report exists and user has access
        const checkQuery = `
            SELECT id FROM scouting_reports 
            WHERE id = $1 AND (group_id = $2 OR group_id IS NULL)
        `;
        
        const checkResult = await pool.query(checkQuery, [reportId, req.session.groupId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found or access denied' });
        }
        
        console.log('Updating report with fields:', DB_FIELDS.length);
        
        const setClause = DB_FIELDS.map((field, index) => `${field} = $${index + 1}`).join(', ');
        
        const query = `
            UPDATE scouting_reports SET
                ${setClause},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $${DB_FIELDS.length + 1}
        `;
        
        const values = DB_FIELDS.map(field => {
            const value = data[field];
            return (value !== undefined && value !== '') ? value : null;
        });
        
        values.push(reportId);
        
        console.log('Update query has', DB_FIELDS.length, 'columns and', values.length, 'values');
        
        const result = await pool.query(query, values);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        
        res.json({ message: 'Report updated successfully' });
        
    } catch (err) {
        console.error('Database error:', err.message);
        console.error('Full error:', err);
        res.status(500).json({ 
            error: 'Failed to update report', 
            details: err.message 
        });
    }
});

// Delete scouting report (must be in same group)
app.delete('/api/reports/:id', requireAuth, async (req, res) => {
    try {
        const query = `
            DELETE FROM scouting_reports 
            WHERE id = $1 AND (group_id = $2 OR group_id IS NULL)
        `;
        
        const result = await pool.query(query, [req.params.id, req.session.groupId]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Report not found or access denied' });
        }
        
        res.json({ message: 'Report deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete report' });
    }
});

// Serve index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});