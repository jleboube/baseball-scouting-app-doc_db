const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

// Helper function to safely create ObjectId
const safeObjectId = (id) => {
    if (!id || typeof id !== 'string' || id.length !== 24 || !/^[0-9a-fA-F]+$/.test(id)) {
        return null;
    }
    try {
        return new ObjectId(id);
    } catch (error) {
        return null;
    }
};
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
const mongoUrl = `mongodb://${process.env.DB_USER || 'scout_user'}:${process.env.DB_PASSWORD || 'scout_pass'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 27017}/${process.env.DB_NAME || 'baseball_scouting'}?authSource=admin`;
let db;

// Connect to MongoDB
MongoClient.connect(mongoUrl)
    .then(client => {
        console.log('Database connected successfully');
        db = client.db(process.env.DB_NAME || 'baseball_scouting');
        initializeDatabase();
    })
    .catch(err => {
        console.error('Error connecting to database:', err);
        process.exit(1);
    });

// Initialize database with sample data
async function initializeDatabase() {
    try {
        // Create indexes
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('groups').createIndex({ name: 1 }, { unique: true });
        await db.collection('groups').createIndex({ registration_code: 1 }, { unique: true });
        await db.collection('scouting_reports').createIndex({ player_name: 1 });
        await db.collection('scouting_reports').createIndex({ created_at: -1 });
        
        // Insert sample groups if they don't exist
        const groups = [
            { name: 'Demo Team', description: 'Demo team for testing', registration_code: 'DEMO2025' },
            { name: 'Rampage 12U Baseball', description: 'MTown Rampage 12U youth baseball team', registration_code: 'RAMPAGE2025' },
            { name: 'Venom 11U Baseball', description: 'MTown Venom 11U youth baseball team', registration_code: 'VENOM2025' }
        ];
        
        for (const group of groups) {
            await db.collection('groups').updateOne(
                { name: group.name },
                { $setOnInsert: { ...group, created_at: new Date() } },
                { upsert: true }
            );
        }
        
        // Insert sample admin user if doesn't exist
        const demoGroup = await db.collection('groups').findOne({ name: 'Demo Team' });
        if (demoGroup) {
            await db.collection('users').updateOne(
                { email: 'admin@demo.com' },
                { 
                    $setOnInsert: {
                        email: 'admin@demo.com',
                        password_hash: '$2b$10$rOzJsm7UzGkVxwjN7j4xZe5fv8v6w.Ac0xCEe5HdF3/1FHi3q9KJO',
                        first_name: 'Admin',
                        last_name: 'User',
                        group_id: demoGroup._id,
                        is_active: true,
                        created_at: new Date(),
                        updated_at: new Date()
                    }
                },
                { upsert: true }
            );
        }
    } catch (err) {
        console.error('Database initialization error:', err);
    }
}

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
    store: MongoStore.create({
        mongoUrl: mongoUrl,
        touchAfter: 24 * 3600 // lazy session update
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'spray-chart-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

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
    'notes_observations', 'next_evaluation_date', 'followup_items', 'spray_chart_image'
];

// Authentication middleware
const requireAuth = (req, res, next) => {
    console.log('Auth check - Session:', {
        hasSession: !!req.session,
        userId: req.session?.userId,
        groupId: req.session?.groupId
    });
    
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
        
        const user = await db.collection('users').findOne({
            email: email.toLowerCase(),
            is_active: true
        });
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Get group info
        const group = await db.collection('groups').findOne({ _id: user.group_id });
        
        // Set session (convert ObjectIds to strings)
        req.session.userId = user._id.toString();
        req.session.userEmail = user.email;
        req.session.groupId = user.group_id.toString();
        req.session.groupName = group?.name;
        
        res.json({
            message: 'Login successful',
            user: {
                id: user._id.toString(),
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                groupId: user.group_id.toString(),
                groupName: group?.name
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
        const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Validate team and registration code
        const groupObjectId = safeObjectId(groupId);
        if (!groupObjectId) {
            return res.status(400).json({ error: 'Invalid group ID' });
        }
        
        const group = await db.collection('groups').findOne({ _id: groupObjectId });
        
        if (!group) {
            return res.status(400).json({ error: 'Invalid team selected' });
        }
        
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
        const newUser = {
            email: email.toLowerCase(),
            password_hash: passwordHash,
            first_name: firstName,
            last_name: lastName,
            group_id: group._id,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        };
        
        const result = await db.collection('users').insertOne(newUser);
        
        res.json({
            message: 'Registration successful! You can now login.',
            user: {
                id: result.insertedId.toString(),
                email: newUser.email,
                firstName: newUser.first_name,
                lastName: newUser.last_name,
                groupId: newUser.group_id.toString(),
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

// Debug endpoint to check session
app.get('/api/debug/session', (req, res) => {
    res.json({
        hasSession: !!req.session,
        sessionId: req.sessionID,
        userId: req.session?.userId,
        groupId: req.session?.groupId,
        sessionKeys: req.session ? Object.keys(req.session) : []
    });
});

// Check authentication status
app.get('/api/auth/me', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
        const userId = safeObjectId(req.session.userId);
        if (!userId) {
            req.session.destroy();
            return res.status(401).json({ error: 'Invalid session' });
        }
        
        const user = await db.collection('users').findOne({
            _id: userId,
            is_active: true
        });
        
        if (!user) {
            req.session.destroy();
            return res.status(401).json({ error: 'User not found' });
        }
        
        const group = await db.collection('groups').findOne({ _id: user.group_id });
        
        res.json({
            user: {
                id: user._id.toString(),
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                groupId: user.group_id.toString(),
                groupName: group?.name
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
        const groups = await db.collection('groups')
            .find({}, { projection: { _id: 1, name: 1, description: 1 } })
            .sort({ name: 1 })
            .toArray();
        
        // Convert _id to id for frontend compatibility
        const formattedGroups = groups.map(group => ({
            id: group._id,
            name: group.name,
            description: group.description
        }));
        
        res.json(formattedGroups);
    } catch (err) {
        console.error('Groups fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});

// Protected Routes (require authentication)

// Get all scouting reports (filtered by user's group)
app.get('/api/reports', requireAuth, async (req, res) => {
    try {
        const groupId = safeObjectId(req.session.groupId);
        if (!groupId) {
            return res.status(400).json({ error: 'Invalid group ID' });
        }
        
        const reports = await db.collection('scouting_reports')
            .aggregate([
                {
                    $match: {
                        $or: [
                            { group_id: groupId },
                            { group_id: null }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user_id',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {
                    $unwind: {
                        path: '$user',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $addFields: {
                        id: { $toString: '$_id' }
                    }
                },
                {
                    $project: {
                        id: 1,
                        player_name: 1,
                        primary_position: 1,
                        team: 1,
                        scout_date: 1,
                        created_at: 1,
                        first_name: '$user.first_name',
                        last_name: '$user.last_name'
                    }
                },
                { $sort: { created_at: -1 } }
            ])
            .toArray();
        
        res.json(reports);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

// Get single scouting report (must be in same group)
app.get('/api/reports/:id', requireAuth, async (req, res) => {
    try {
        const reportId = safeObjectId(req.params.id);
        const groupId = safeObjectId(req.session.groupId);
        
        if (!reportId) {
            return res.status(400).json({ error: 'Invalid report ID' });
        }
        
        if (!groupId) {
            return res.status(400).json({ error: 'Invalid group ID' });
        }
        
        const report = await db.collection('scouting_reports').findOne({
            _id: reportId,
            $or: [
                { group_id: groupId },
                { group_id: null }
            ]
        });
        
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        
        // Convert _id to id for frontend compatibility
        const formattedReport = { ...report, id: report._id.toString() };
        delete formattedReport._id;
        
        res.json(formattedReport);
    } catch (err) {
        console.error('Error fetching report:', err);
        console.error('Report ID received:', req.params.id);
        console.error('Group ID from session:', req.session.groupId);
        res.status(500).json({ error: 'Failed to fetch report' });
    }
});

// Create new scouting report
app.post('/api/reports', requireAuth, async (req, res) => {
    const data = req.body;
    
    try {
        const userId = safeObjectId(req.session.userId);
        const groupId = safeObjectId(req.session.groupId);
        
        if (!userId || !groupId) {
            return res.status(400).json({ error: 'Invalid user or group ID' });
        }
        
        console.log('Creating report with fields:', DB_FIELDS.length);
        
        // Build report document
        const reportDoc = {
            user_id: userId,
            group_id: groupId,
            created_at: new Date(),
            updated_at: new Date()
        };
        
        // Add all DB fields
        DB_FIELDS.forEach(field => {
            const value = data[field];
            reportDoc[field] = (value !== undefined && value !== '') ? value : null;
        });
        
        const result = await db.collection('scouting_reports').insertOne(reportDoc);
        res.json({ id: result.insertedId.toString(), message: 'Report created successfully' });
        
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
    
    try {
        const reportId = safeObjectId(req.params.id);
        const groupId = safeObjectId(req.session.groupId);
        
        if (!reportId) {
            return res.status(400).json({ error: 'Invalid report ID' });
        }
        
        if (!groupId) {
            return res.status(400).json({ error: 'Invalid group ID' });
        }
        
        console.log('Updating report with fields:', DB_FIELDS.length);
        
        // Build update document
        const updateDoc = {
            updated_at: new Date()
        };
        
        // Add all DB fields
        DB_FIELDS.forEach(field => {
            const value = data[field];
            updateDoc[field] = (value !== undefined && value !== '') ? value : null;
        });
        
        const result = await db.collection('scouting_reports').updateOne(
            {
                _id: reportId,
                $or: [
                    { group_id: groupId },
                    { group_id: null }
                ]
            },
            { $set: updateDoc }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Report not found or access denied' });
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

// Upload spray chart image
app.post('/api/reports/:id/spray-chart', requireAuth, upload.single('sprayChart'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const reportId = safeObjectId(req.params.id);
        const groupId = safeObjectId(req.session.groupId);
        const imagePath = req.file.filename;
        
        if (!reportId || !groupId) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Invalid report or group ID' });
        }
        
        // Check if report exists and user has access
        const report = await db.collection('scouting_reports').findOne({
            _id: reportId,
            $or: [
                { group_id: groupId },
                { group_id: null }
            ]
        });
        
        if (!report) {
            // Delete uploaded file if report not found
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'Report not found or access denied' });
        }
        
        // Delete old image if exists
        const oldImage = report.spray_chart_image;
        if (oldImage) {
            const oldImagePath = path.join(uploadsDir, oldImage);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }
        
        // Update database with new image path
        await db.collection('scouting_reports').updateOne(
            { _id: reportId },
            { 
                $set: { 
                    spray_chart_image: imagePath,
                    updated_at: new Date()
                }
            }
        );
        
        res.json({ 
            message: 'Spray chart uploaded successfully',
            imagePath: `/uploads/${imagePath}`
        });
        
    } catch (err) {
        console.error('Upload error:', err);
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// Delete spray chart image
app.delete('/api/reports/:id/spray-chart', requireAuth, async (req, res) => {
    try {
        const reportId = safeObjectId(req.params.id);
        const groupId = safeObjectId(req.session.groupId);
        
        if (!reportId || !groupId) {
            return res.status(400).json({ error: 'Invalid report or group ID' });
        }
        
        // Get current image path
        const report = await db.collection('scouting_reports').findOne({
            _id: reportId,
            $or: [
                { group_id: groupId },
                { group_id: null }
            ]
        });
        
        if (!report) {
            return res.status(404).json({ error: 'Report not found or access denied' });
        }
        
        const imagePath = report.spray_chart_image;
        if (!imagePath) {
            return res.status(404).json({ error: 'No spray chart image found' });
        }
        
        // Delete file from filesystem
        const fullImagePath = path.join(uploadsDir, imagePath);
        if (fs.existsSync(fullImagePath)) {
            fs.unlinkSync(fullImagePath);
        }
        
        // Update database
        await db.collection('scouting_reports').updateOne(
            { _id: reportId },
            { 
                $set: { 
                    spray_chart_image: null,
                    updated_at: new Date()
                }
            }
        );
        
        res.json({ message: 'Spray chart deleted successfully' });
        
    } catch (err) {
        console.error('Delete image error:', err);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});

// Delete scouting report (must be in same group)
app.delete('/api/reports/:id', requireAuth, async (req, res) => {
    try {
        const reportId = safeObjectId(req.params.id);
        const groupId = safeObjectId(req.session.groupId);
        
        if (!reportId || !groupId) {
            return res.status(400).json({ error: 'Invalid report or group ID' });
        }
        
        // Get spray chart image path before deleting
        const report = await db.collection('scouting_reports').findOne({
            _id: reportId,
            $or: [
                { group_id: groupId },
                { group_id: null }
            ]
        });
        
        if (!report) {
            return res.status(404).json({ error: 'Report not found or access denied' });
        }
        
        const imagePath = report.spray_chart_image;
        
        // Delete the report
        await db.collection('scouting_reports').deleteOne({
            _id: reportId,
            $or: [
                { group_id: groupId },
                { group_id: null }
            ]
        });
        
        // Delete associated image file if exists
        if (imagePath) {
            const fullImagePath = path.join(uploadsDir, imagePath);
            if (fs.existsSync(fullImagePath)) {
                fs.unlinkSync(fullImagePath);
            }
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