import api from './api';

const userService = {
  // Get all users (parent only)
  getAllUsers: async () => {
    const response = await api.get('/users/all');
    return response.data;
  },
  
  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },
  
  // Update current user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },
  
  // Update a user's internet access (parent only)
  updateInternetAccess: async (userId, internetAccess) => {
    const response = await api.put('/users/internet-access', { userId, internetAccess });
    return response.data;
  }
};

export default userService;