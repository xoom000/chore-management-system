import api from './api';

const routerService = {
  // Get all users' internet access status (parent only)
  getAllInternetStatus: async () => {
    const response = await api.get('/router/status');
    return response.data;
  },
  
  // Update a user's internet access (parent only)
  updateInternetAccess: async (userId, allow) => {
    const response = await api.put('/router/access', { userId, allow });
    return response.data;
  },
  
  // Get current user's internet access status
  getMyInternetStatus: async () => {
    const response = await api.get('/router/my-status');
    return response.data;
  }
};

export default routerService;