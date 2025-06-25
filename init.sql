-- Create groups (teams) table with registration codes
CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    registration_code VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    group_id INTEGER REFERENCES groups(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create session table for connect-pg-simple
CREATE TABLE IF NOT EXISTS session (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
) WITH (OIDS=FALSE);

ALTER TABLE session DROP CONSTRAINT IF EXISTS session_pkey;
ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX IF NOT EXISTS IDX_session_expire ON session(expire);

-- Create scouting_reports table (including user_id and group_id from the start)
CREATE TABLE IF NOT EXISTS scouting_reports (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER REFERENCES users(id),
    group_id INTEGER REFERENCES groups(id),
    
    -- Scout Information
    scout_name VARCHAR(255),
    scout_date DATE,
    event VARCHAR(255),
    league_organization VARCHAR(255),
    
    -- Player Information
    player_name VARCHAR(255) NOT NULL,
    primary_position VARCHAR(50),
    jersey_number VARCHAR(10),
    date_of_birth DATE,
    age INTEGER,
    height VARCHAR(20),
    weight VARCHAR(20),
    bats VARCHAR(10),
    throws VARCHAR(10),
    team VARCHAR(255),
    parent_guardian VARCHAR(255),
    contact VARCHAR(255),
    
    -- Physical Development
    build VARCHAR(50),
    coordination VARCHAR(50),
    athleticism VARCHAR(50),
    motor_skills VARCHAR(50),
    growth_projection VARCHAR(50),
    
    -- Hitting Fundamentals
    stance_setup VARCHAR(50),
    swing_mechanics VARCHAR(50),
    contact_ability VARCHAR(50),
    power_potential VARCHAR(50),
    plate_discipline VARCHAR(50),
    bat_speed VARCHAR(50),
    approach VARCHAR(50),
    bunting VARCHAR(50),
    
    -- Running & Base Running
    speed VARCHAR(50),
    base_running_iq VARCHAR(50),
    stealing_ability VARCHAR(50),
    first_step VARCHAR(50),
    turns VARCHAR(50),
    
    -- Fielding Skills
    fielding_readiness VARCHAR(50),
    glove_work VARCHAR(50),
    footwork VARCHAR(50),
    arm_strength VARCHAR(50),
    arm_accuracy VARCHAR(50),
    range_field VARCHAR(50),
    game_awareness VARCHAR(50),
    positions_played TEXT,
    
    -- Pitching
    fastball_mph VARCHAR(20),
    control_pitching VARCHAR(50),
    breaking_ball VARCHAR(50),
    changeup VARCHAR(50),
    delivery VARCHAR(50),
    mound_presence VARCHAR(50),
    strikes VARCHAR(50),
    
    -- Baseball IQ & Intangibles
    game_understanding VARCHAR(50),
    coachability VARCHAR(50),
    effort_level VARCHAR(50),
    competitiveness VARCHAR(50),
    teamwork VARCHAR(50),
    focus_attention VARCHAR(50),
    leadership VARCHAR(50),
    
    -- Development Areas
    biggest_strengths TEXT,
    improvement_areas TEXT,
    recommended_focus TEXT,
    
    -- Projection & Recommendations
    current_level VARCHAR(50),
    development_potential VARCHAR(50),
    recommended_next_steps TEXT,
    playing_time_recommendation VARCHAR(50),
    position_projection TEXT,
    additional_training TEXT,
    
    -- Coach/Parent Feedback
    work_at_home TEXT,
    positive_reinforcement TEXT,
    
    -- Notes
    notes_observations TEXT,
    next_evaluation_date DATE,
    followup_items TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_player_name ON scouting_reports(player_name);
CREATE INDEX IF NOT EXISTS idx_created_at ON scouting_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_user_id ON scouting_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_group_id ON scouting_reports(group_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_group ON users(group_id);

-- Insert sample teams with registration codes
INSERT INTO groups (name, description, registration_code) VALUES 
    ('Demo Team', 'Demo team for testing', 'DEMO2025'),
    ('Rampage 12U Baseball', 'MTown Rampage 12U youth baseball team', 'RAMPAGE2025'),
    ('Venom 11U Baseball', 'MTown Venom 11U youth baseball team', 'VENOM2025')
ON CONFLICT (name) DO NOTHING;

-- Insert a sample admin user (password is 'admin123')
-- Password hash for 'admin123' using bcrypt with 10 rounds
INSERT INTO users (email, password_hash, first_name, last_name, group_id) VALUES 
    ('admin@demo.com', '$2b$10$rOzJsm7UzGkVxwjN7j4xZe5fv8v6w.Ac0xCEe5HdF3/1FHi3q9KJO', 'Admin', 'User', 1)
ON CONFLICT (email) DO NOTHING;