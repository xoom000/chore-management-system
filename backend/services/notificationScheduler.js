const schedule = require('node-schedule');
const Chore = require('../models/Chore');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmailNotification } = require('../controllers/notificationController');

// Schedule job to run every hour to check for chores due soon
const checkUpcomingChores = schedule.scheduleJob('0 * * * *', async () => {
  try {
    console.log('Running scheduled check for upcoming chores');
    
    // Find chores due in the next 24 hours that are still pending
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const upcomingChores = await Chore.find({
      status: 'pending',
      dueDate: { $gte: new Date(), $lte: tomorrow }
    }).populate('assignedTo');
    
    // Create notifications for each upcoming chore
    for (const chore of upcomingChores) {
      // Skip if user has no email preferences
      if (!chore.assignedTo || !chore.assignedTo.notifications.email) {
        continue;
      }
      
      // Calculate hours until due
      const hoursUntilDue = Math.round((chore.dueDate - new Date()) / (60 * 60 * 1000));
      
      // Only notify if due in 24, 12, or 4 hours
      if (![24, 12, 4].includes(hoursUntilDue)) {
        continue;
      }
      
      // Check if a reminder notification already exists for this hour
      const existingNotification = await Notification.findOne({
        chore: chore._id,
        type: 'reminder',
        message: new RegExp(`${hoursUntilDue} hours`)
      });
      
      if (existingNotification) {
        continue;
      }
      
      // Create notification
      const notification = new Notification({
        user: chore.assignedTo._id,
        chore: chore._id,
        title: 'Upcoming Chore Reminder',
        message: `Your chore "${chore.title}" is due in ${hoursUntilDue} hours`,
        type: 'reminder',
        deliveryMethod: 'both',
        scheduledFor: new Date()
      });
      
      await notification.save();
      
      // Send email notification
      await sendEmailNotification(notification, chore.assignedTo);
    }
  } catch (error) {
    console.error('Error in upcoming chores check:', error);
  }
});

// Schedule job to run daily at midnight to check for overdue chores
const checkOverdueChores = schedule.scheduleJob('0 0 * * *', async () => {
  try {
    console.log('Running scheduled check for overdue chores');
    
    // Find chores that are past due and still pending
    const overdueChores = await Chore.find({
      status: 'pending',
      dueDate: { $lt: new Date() }
    });
    
    // Update status to overdue
    for (const chore of overdueChores) {
      chore.status = 'overdue';
      await chore.save();
      
      // Get assigned user
      const user = await User.findById(chore.assignedTo);
      
      // Create notification
      const notification = new Notification({
        user: chore.assignedTo,
        chore: chore._id,
        title: 'Chore Overdue',
        message: `Your chore "${chore.title}" is now overdue. Complete it as soon as possible.`,
        type: 'system',
        deliveryMethod: 'both',
        scheduledFor: new Date()
      });
      
      await notification.save();
      
      // Send email notification
      await sendEmailNotification(notification, user);
      
      // Revoke internet access
      if (user.internetAccess) {
        user.internetAccess = false;
        await user.save();
        
        // Also update router via router service
        const routerService = require('./routerService');
        await routerService.updateUserInternetAccess(user.deviceMacAddress, false);
      }
    }
  } catch (error) {
    console.error('Error in overdue chores check:', error);
  }
});

// Schedule job to run weekly to create recurring chores
const createRecurringChores = schedule.scheduleJob('0 1 * * 1', async () => {
  try {
    console.log('Running scheduled creation of recurring chores');
    
    // Get all recurring chores
    const recurringChores = await Chore.find({
      recurring: true
    });
    
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentDayOfMonth = today.getDate();
    
    for (const chore of recurringChores) {
      let shouldCreateNewChore = false;
      
      // Check if we should create a new instance based on pattern
      switch (chore.recurrencePattern) {
        case 'daily':
          shouldCreateNewChore = true;
          break;
          
        case 'weekly':
          // If the original chore is due on this day of the week
          const originalDueDay = new Date(chore.dueDate).getDay();
          shouldCreateNewChore = originalDueDay === currentDayOfWeek;
          break;
          
        case 'monthly':
          // If the original chore is due on this day of the month
          const originalDueDate = new Date(chore.dueDate).getDate();
          shouldCreateNewChore = originalDueDate === currentDayOfMonth;
          break;
          
        case 'custom':
          // Check if today matches any of the custom recurrence patterns
          if (chore.customRecurrence.daysOfWeek && chore.customRecurrence.daysOfWeek.includes(currentDayOfWeek)) {
            shouldCreateNewChore = true;
          } else if (chore.customRecurrence.daysOfMonth && chore.customRecurrence.daysOfMonth.includes(currentDayOfMonth)) {
            shouldCreateNewChore = true;
          }
          break;
      }
      
      if (shouldCreateNewChore) {
        // Calculate new due date based on the original due date's time
        const newDueDate = new Date();
        const originalDueDate = new Date(chore.dueDate);
        
        newDueDate.setHours(originalDueDate.getHours());
        newDueDate.setMinutes(originalDueDate.getMinutes());
        
        // For weekly and monthly, add appropriate days
        if (chore.recurrencePattern === 'weekly') {
          newDueDate.setDate(newDueDate.getDate() + 7);
        } else if (chore.recurrencePattern === 'monthly') {
          newDueDate.setMonth(newDueDate.getMonth() + 1);
        } else {
          // For daily and custom, add 1 day
          newDueDate.setDate(newDueDate.getDate() + 1);
        }
        
        // Create new chore
        const newChore = new Chore({
          title: chore.title,
          description: chore.description,
          assignedTo: chore.assignedTo,
          dueDate: newDueDate,
          recurring: chore.recurring,
          recurrencePattern: chore.recurrencePattern,
          customRecurrence: chore.customRecurrence,
          points: chore.points,
          requiresVerification: chore.requiresVerification,
          createdBy: chore.createdBy
        });
        
        await newChore.save();
        
        // Create notification for assigned user
        const notification = new Notification({
          user: chore.assignedTo,
          chore: newChore._id,
          title: 'New Recurring Chore',
          message: `Your recurring chore "${chore.title}" has been added to your list.`,
          type: 'system',
          deliveryMethod: 'both',
          scheduledFor: new Date()
        });
        
        await notification.save();
      }
    }
  } catch (error) {
    console.error('Error in recurring chores creation:', error);
  }
});

module.exports = {
  checkUpcomingChores,
  checkOverdueChores,
  createRecurringChores
};