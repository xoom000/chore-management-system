const express = require('express');
const router = express.Router();
const choreController = require('../controllers/choreController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Chore routes
router.post('/', choreController.createChore);
router.get('/', choreController.getAllChores);
router.get('/:id', choreController.getChoreById);
router.put('/:id', choreController.updateChore);
router.put('/:id/complete', choreController.completeChore);
router.put('/:id/verify', choreController.verifyChore);
router.delete('/:id', choreController.deleteChore);

module.exports = router;