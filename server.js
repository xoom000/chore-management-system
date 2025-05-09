const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const schedule = require('node-schedule');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import routes
const userRoutes = require('./backend/routes/users');
const choreRoutes = require('./backend/routes/chores');
const notificationRoutes = require('./backend/routes/notifications');
const routerControlRoutes = require('./backend/routes/routerControl');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/chores', choreRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/router', routerControlRoutes);

// Schedule notification job
require('./backend/services/notificationScheduler');

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});