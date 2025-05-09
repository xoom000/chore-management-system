const Chore = require('../models/Chore');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { updateUserInternetAccess } = require('../services/asusRouterService');

// Create a new chore
exports.createChore = async (req, res) => {
  try {
    // Only parents can create chores
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Only parents can create chores' });
    }
    
    const {
      title,
      description,
      assignedTo,
      dueDate,
      recurring,
      recurrencePattern,
      customRecurrence,
      points,
      requiresVerification
    } = req.body;
    
    // Validate assigned user exists
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(404).json({ error: 'Assigned user not found' });
    }
    
    const chore = new Chore({
      title,
      description,
      assignedTo,
      dueDate: new Date(dueDate),
      recurring,
      recurrencePattern: recurring ? recurrencePattern : null,
      customRecurrence: recurring && recurrencePattern === 'custom' ? customRecurrence : null,
      points: points || 1,
      requiresVerification,
      createdBy: req.user.id
    });
    
    await chore.save();
    
    // Create notification for assigned user
    const notification = new Notification({
      user: assignedTo,
      chore: chore._id,
      title: 'New Chore Assigned',
      message: `You've been assigned a new chore: ${title}`,
      type: 'system',
      deliveryMethod: 'both',
      scheduledFor: new Date()
    });
    
    await notification.save();
    
    res.status(201).json({
      message: 'Chore created successfully',
      chore
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all chores
exports.getAllChores = async (req, res) => {
  try {
    let query = {};
    
    // If user is a child, only show their chores
    if (req.user.role === 'child') {
      query.assignedTo = req.user.id;
    }
    
    // Handle query parameters for filtering
    const { status, assignedTo } = req.query;
    if (status) query.status = status;
    if (assignedTo && req.user.role === 'parent') query.assignedTo = assignedTo;
    
    const chores = await Chore.find(query)
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name')
      .populate('verifiedBy', 'name')
      .sort({ dueDate: 1 });
    
    res.json(chores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a specific chore
exports.getChoreById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const chore = await Chore.findById(id)
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name')
      .populate('verifiedBy', 'name');
    
    if (!chore) {
      return res.status(404).json({ error: 'Chore not found' });
    }
    
    // Check if user has access to this chore
    if (req.user.role === 'child' && String(chore.assignedTo._id) !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(chore);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a chore
exports.updateChore = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Only parents can update chore details
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Only parents can update chores' });
    }
    
    const chore = await Chore.findById(id);
    if (!chore) {
      return res.status(404).json({ error: 'Chore not found' });
    }
    
    const {
      title,
      description,
      assignedTo,
      dueDate,
      recurring,
      recurrencePattern,
      customRecurrence,
      points,
      requiresVerification
    } = req.body;
    
    // Update chore
    if (title) chore.title = title;
    if (description) chore.description = description;
    if (assignedTo) {
      // Check if new assigned user exists
      const assignedUser = await User.findById(assignedTo);
      if (!assignedUser) {
        return res.status(404).json({ error: 'Assigned user not found' });
      }
      chore.assignedTo = assignedTo;
    }
    if (dueDate) chore.dueDate = new Date(dueDate);
    if (recurring !== undefined) chore.recurring = recurring;
    if (recurrencePattern) chore.recurrencePattern = recurring ? recurrencePattern : null;
    if (customRecurrence) chore.customRecurrence = recurring && recurrencePattern === 'custom' ? customRecurrence : null;
    if (points) chore.points = points;
    if (requiresVerification !== undefined) chore.requiresVerification = requiresVerification;
    
    await chore.save();
    
    // Create notification for assigned user if it changed
    if (assignedTo && String(chore.assignedTo) !== assignedTo) {
      const notification = new Notification({
        user: assignedTo,
        chore: chore._id,
        title: 'Chore Assigned',
        message: `You've been assigned a chore: ${chore.title}`,
        type: 'system',
        deliveryMethod: 'both',
        scheduledFor: new Date()
      });
      
      await notification.save();
    }
    
    res.json({
      message: 'Chore updated successfully',
      chore
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark chore as completed
exports.completeChore = async (req, res) => {
  try {
    const { id } = req.params;
    
    const chore = await Chore.findById(id);
    if (!chore) {
      return res.status(404).json({ error: 'Chore not found' });
    }
    
    // Verify the chore is assigned to the user or user is a parent
    if (req.user.role === 'child' && String(chore.assignedTo) !== req.user.id) {
      return res.status(403).json({ error: 'You can only complete your own chores' });
    }
    
    // Update status
    chore.status = 'completed';
    chore.completedAt = new Date();
    
    // If verification is not required, check if internet should be granted
    if (!chore.requiresVerification) {
      const user = await User.findById(chore.assignedTo);
      // Logic to determine if internet should be granted
      // This is simplified - you may want more complex logic based on completed chores
      user.internetAccess = true;
      await user.save();
      
      // Update router for internet access
      await updateUserInternetAccess(user.deviceMacAddress, true);
      
      // Create notification for user
      const notification = new Notification({
        user: user._id,
        chore: chore._id,
        title: 'Internet Access Granted',
        message: 'You have completed your chores and now have internet access!',
        type: 'system',
        deliveryMethod: 'both',
        scheduledFor: new Date()
      });
      
      await notification.save();
    } else {
      // Create notification for parents to verify
      const parents = await User.find({ role: 'parent' });
      
      for (const parent of parents) {
        const notification = new Notification({
          user: parent._id,
          chore: chore._id,
          title: 'Chore Verification Needed',
          message: `${await User.findById(chore.assignedTo).then(u => u.name)} has completed the chore "${chore.title}" and needs verification.`,
          type: 'verification',
          deliveryMethod: 'both',
          scheduledFor: new Date()
        });
        
        await notification.save();
      }
    }
    
    await chore.save();
    
    res.json({
      message: 'Chore marked as completed',
      requiresVerification: chore.requiresVerification,
      chore
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verify completed chore (parents only)
exports.verifyChore = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;
    
    // Only parents can verify chores
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Only parents can verify chores' });
    }
    
    const chore = await Chore.findById(id);
    if (!chore) {
      return res.status(404).json({ error: 'Chore not found' });
    }
    
    // Ensure chore is completed and requires verification
    if (chore.status !== 'completed' || !chore.requiresVerification) {
      return res.status(400).json({ error: 'This chore is not eligible for verification' });
    }
    
    if (approved) {
      // Mark as verified
      chore.verifiedBy = req.user.id;
      chore.verifiedAt = new Date();
      
      // Grant internet access to assigned user
      const user = await User.findById(chore.assignedTo);
      user.internetAccess = true;
      await user.save();
      
      // Update router for internet access
      await updateUserInternetAccess(user.deviceMacAddress, true);
      
      // Create notification for user
      const notification = new Notification({
        user: user._id,
        chore: chore._id,
        title: 'Chore Verified - Internet Access Granted',
        message: `Your chore "${chore.title}" has been verified and you now have internet access!`,
        type: 'system',
        deliveryMethod: 'both',
        scheduledFor: new Date()
      });
      
      await notification.save();
    } else {
      // Reset to pending if not approved
      chore.status = 'pending';
      chore.completedAt = null;
      
      // Create notification for user
      const notification = new Notification({
        user: chore.assignedTo,
        chore: chore._id,
        title: 'Chore Needs Improvement',
        message: `Your chore "${chore.title}" was not verified. Please complete it properly.`,
        type: 'system',
        deliveryMethod: 'both',
        scheduledFor: new Date()
      });
      
      await notification.save();
    }
    
    await chore.save();
    
    res.json({
      message: approved ? 'Chore verified successfully' : 'Chore returned for completion',
      chore
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a chore
exports.deleteChore = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Only parents can delete chores
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Only parents can delete chores' });
    }
    
    const chore = await Chore.findById(id);
    if (!chore) {
      return res.status(404).json({ error: 'Chore not found' });
    }
    
    await Chore.findByIdAndDelete(id);
    
    // Delete related notifications
    await Notification.deleteMany({ chore: id });
    
    res.json({
      message: 'Chore deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};