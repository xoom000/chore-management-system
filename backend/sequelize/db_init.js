const { sequelize } = require('./index');

async function initializeDatabase() {
  try {
    // Authenticate to test connection
    await sequelize.authenticate();
    console.log('Connection to SQLite database has been established successfully.');
    
    // Sync all models with database
    await sequelize.sync();
    console.log('All models were synchronized successfully.');
    
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
}

module.exports = { initializeDatabase };