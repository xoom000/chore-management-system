const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// SQLite database path
const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'database.sqlite');

// Create Sequelize instance
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true
  }
});

// Import models
const User = require('./models/User')(sequelize);
const Chore = require('./models/Chore')(sequelize);
const Notification = require('./models/Notification')(sequelize);

// Define relationships
User.hasMany(Chore, { 
  foreignKey: 'assignedTo',
  as: 'assignedChores'
});
Chore.belongsTo(User, { 
  foreignKey: 'assignedTo',
  as: 'assignee'
});

User.hasMany(Chore, { 
  foreignKey: 'createdBy',
  as: 'createdChores'
});
Chore.belongsTo(User, { 
  foreignKey: 'createdBy',
  as: 'creator'
});

User.hasMany(Notification, { 
  foreignKey: 'userId',
  as: 'notifications'
});
Notification.belongsTo(User, { 
  foreignKey: 'userId',
  as: 'user'
});

Chore.hasMany(Notification, { 
  foreignKey: 'choreId',
  as: 'notifications'
});
Notification.belongsTo(Chore, { 
  foreignKey: 'choreId',
  as: 'chore'
});

// Initialize database
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    await sequelize.sync();
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

module.exports = {
  sequelize,
  models: {
    User,
    Chore,
    Notification
  },
  initializeDatabase
};