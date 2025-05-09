const User = require('../models/User');
const { updateUserInternetAccess } = require('../services/asusRouterService');

// Get all users' internet access status
exports.getAllInternetStatus = async (req, res) => {
  try {
    // Only parents can view all internet statuses
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const users = await User.find().select('name role internetAccess deviceMacAddress');
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a user's internet access
exports.updateInternetAccess = async (req, res) => {
  try {
    const { userId, allow } = req.body;
    
    // Only parents can update internet access
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Only parents can update internet access' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.deviceMacAddress) {
      return res.status(400).json({ error: 'User does not have a registered device' });
    }
    
    // Update database
    user.internetAccess = allow;
    await user.save();
    
    // Update router using the Asus router service
    const success = await updateUserInternetAccess(user.deviceMacAddress, allow);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to update router settings' });
    }
    
    res.json({
      message: `Internet access ${allow ? 'granted' : 'revoked'} for ${user.name}`,
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get current user's internet access status
exports.getMyInternetStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('internetAccess');
    
    res.json({
      internetAccess: user.internetAccess
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};