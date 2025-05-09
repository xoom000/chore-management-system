const Notification = require('../models/Notification');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Get all notifications for the current user
exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      user: req.user.id 
    })
    .populate('chore', 'title')
    .sort({ createdAt: -1 });
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    // Ensure notification belongs to the current user
    if (String(notification.user) !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.json({
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new notification
exports.createNotification = async (req, res) => {
  try {
    // Only parents can create notifications
    if (req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Only parents can create notifications' });
    }
    
    const {
      userId,
      choreId,
      title,
      message,
      type,
      deliveryMethod,
      scheduledFor
    } = req.body;
    
    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const notification = new Notification({
      user: userId,
      chore: choreId || null,
      title,
      message,
      type: type || 'system',
      deliveryMethod: deliveryMethod || 'both',
      scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date()
    });
    
    await notification.save();
    
    // Send email if delivery method includes email
    if (deliveryMethod === 'email' || deliveryMethod === 'both') {
      await sendEmailNotification(notification, user);
    }
    
    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    // Ensure notification belongs to the current user or user is a parent
    if (String(notification.user) !== req.user.id && req.user.role !== 'parent') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await Notification.findByIdAndDelete(id);
    
    res.json({
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper function to send email notifications
const sendEmailNotification = async (notification, user) => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    // Send mail
    await transporter.sendMail({
      from: `"Chore Manager" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: notification.title,
      text: notification.message,
      html: `<div>
        <h2>${notification.title}</h2>
        <p>${notification.message}</p>
        <p>Log in to the Chore Manager app to see more details.</p>
      </div>`
    });
    
    // Update notification as sent
    notification.sentAt = new Date();
    await notification.save();
    
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

// Export the email function for use in scheduler
exports.sendEmailNotification = sendEmailNotification;