const express = require('express');
const router = express.Router();
const userController = require('../controllers/userControllerSequelize');
const auth = require('../middleware/authSequelize');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.get('/all', auth, userController.getAllUsers);
router.put('/internet-access', auth, userController.updateInternetAccess);

module.exports = router;