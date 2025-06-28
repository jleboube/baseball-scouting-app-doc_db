// MongoDB initialization script for Baseball Scouting App

// Switch to the baseball_scouting database
db = db.getSiblingDB('baseball_scouting');

// Create collections with validation
db.createCollection('groups', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'registration_code'],
            properties: {
                name: { bsonType: 'string' },
                description: { bsonType: 'string' },
                registration_code: { bsonType: 'string' },
                created_at: { bsonType: 'date' }
            }
        }
    }
});

db.createCollection('users', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['email', 'password_hash'],
            properties: {
                email: { bsonType: 'string' },
                password_hash: { bsonType: 'string' },
                first_name: { bsonType: 'string' },
                last_name: { bsonType: 'string' },
                group_id: { bsonType: 'objectId' },
                is_active: { bsonType: 'bool' },
                created_at: { bsonType: 'date' },
                updated_at: { bsonType: 'date' }
            }
        }
    }
});

db.createCollection('scouting_reports', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['player_name'],
            properties: {
                user_id: { bsonType: 'objectId' },
                group_id: { bsonType: 'objectId' },
                created_at: { bsonType: 'date' },
                updated_at: { bsonType: 'date' },
                player_name: { bsonType: 'string' }
            }
        }
    }
});

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.groups.createIndex({ name: 1 }, { unique: true });
db.groups.createIndex({ registration_code: 1 }, { unique: true });
db.scouting_reports.createIndex({ player_name: 1 });
db.scouting_reports.createIndex({ created_at: -1 });
db.scouting_reports.createIndex({ user_id: 1 });
db.scouting_reports.createIndex({ group_id: 1 });

// Insert sample groups
const groups = [
    {
        name: 'Demo Team',
        description: 'Demo team for testing',
        registration_code: 'DEMO2025',
        created_at: new Date()
    },
    {
        name: 'Rampage 12U Baseball',
        description: 'MTown Rampage 12U youth baseball team',
        registration_code: 'RAMPAGE2025',
        created_at: new Date()
    },
    {
        name: 'Venom 11U Baseball',
        description: 'MTown Venom 11U youth baseball team',
        registration_code: 'VENOM2025',
        created_at: new Date()
    }
];

db.groups.insertMany(groups);

// Get the Demo Team ID for the admin user
const demoTeam = db.groups.findOne({ name: 'Demo Team' });

// Insert sample admin user (password is 'admin123')
db.users.insertOne({
    email: 'admin@demo.com',
    password_hash: '$2b$10$rOzJsm7UzGkVxwjN7j4xZe5fv8v6w.Ac0xCEe5HdF3/1FHi3q9KJO',
    first_name: 'Admin',
    last_name: 'User',
    group_id: demoTeam._id,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
});

print('MongoDB initialization completed successfully');