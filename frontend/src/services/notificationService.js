import api from './api';

const notificationService = {
  // Get all notifications for the current user
  getUserNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },
  
  // Mark a notification as read
  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },
  
  // Create a new notification (parent only)
  createNotification: async (notificationData) => {
    const response = await api.post('/notifications', notificationData);
    return response.data;
  },
  
  // Delete a notification
  deleteNotification: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  }
};

export default notificationService;