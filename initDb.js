require('dotenv').config();
const db = require('./backend/sequelize');

async function initializeDatabase() {
  try {
    console.log('Initializing SQLite database...');
    
    // Initialize database structure
    await db.initializeDatabase();
    console.log('Database structure initialized');
    
    // Create a default parent user
    const User = db.models.User;
    const adminExists = await User.findOne({ where: { email: 'admin@example.com' } });
    
    if (!adminExists) {
      console.log('Creating default admin user...');
      await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123', // This will be hashed by the model hook
        role: 'parent'
      });
      console.log('Default admin user created (email: admin@example.com, password: admin123)');
    } else {
      console.log('Default admin user already exists');
    }
    
    console.log('Database initialization complete');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

// Run the initialization
initializeDatabase()
  .then(success => {
    console.log(`Database initialization ${success ? 'succeeded' : 'failed'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error during initialization:', err);
    process.exit(1);
  });