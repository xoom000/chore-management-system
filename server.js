const express = require('express');
const dotenv = require('dotenv');
const schedule = require('node-schedule');
const path = require('path');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(express.json());

// Initialize SQLite database with Sequelize
const db = require('./backend/sequelize');

// Connect to SQLite database
db.initializeDatabase()
  .then(() => console.log('Connected to SQLite database'))
  .catch(err => console.error('Database connection error:', err));

// Import routes
const userRoutes = require('./backend/routes/usersSequelize');
// Note: The following routes would need to be updated to use Sequelize as well
// For now, keeping the imports but commenting that they need updates
const choreRoutes = require('./backend/routes/chores'); // Needs Sequelize update
const notificationRoutes = require('./backend/routes/notifications'); // Needs Sequelize update
const routerControlRoutes = require('./backend/routes/routerControl'); // Needs Sequelize update

// Use routes
app.use('/api/users', userRoutes);
// Temporarily comment out routes that need to be updated to Sequelize
// app.use('/api/chores', choreRoutes);
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/router', routerControlRoutes);

// Add a test route
app.get('/', (req, res) => {
  res.json({ message: 'Chore Management System API (SQLite Version)' });
});

// Temporarily comment out the notification scheduler
// as it depends on MongoDB models
// require('./backend/services/notificationScheduler');

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});