const express = require('express');
const router = express.Router();
const routerController = require('../controllers/routerController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Router control routes
router.get('/status', routerController.getAllInternetStatus);
router.put('/access', routerController.updateInternetAccess);
router.get('/my-status', routerController.getMyInternetStatus);

module.exports = router;