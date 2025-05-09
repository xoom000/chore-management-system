const express = require('express');
const dotenv = require('dotenv');
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

// Use routes
app.use('/api/users', userRoutes);

// Add a test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Chore Management System API (SQLite Version)',
    status: 'Running',
    documentation: 'Access the /api/users endpoints to test user functionality'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = server;