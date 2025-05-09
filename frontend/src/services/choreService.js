import api from './api';

const choreService = {
  // Get all chores
  getAllChores: async (filters = {}) => {
    const params = new URLSearchParams();
    
    // Add any filters to the query params
    if (filters.status) params.append('status', filters.status);
    if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
    
    const response = await api.get(`/chores?${params.toString()}`);
    return response.data;
  },
  
  // Get a specific chore by ID
  getChoreById: async (id) => {
    const response = await api.get(`/chores/${id}`);
    return response.data;
  },
  
  // Create a new chore
  createChore: async (choreData) => {
    const response = await api.post('/chores', choreData);
    return response.data;
  },
  
  // Update a chore
  updateChore: async (id, choreData) => {
    const response = await api.put(`/chores/${id}`, choreData);
    return response.data;
  },
  
  // Mark a chore as completed
  completeChore: async (id) => {
    const response = await api.put(`/chores/${id}/complete`);
    return response.data;
  },
  
  // Verify a chore (parent only)
  verifyChore: async (id, approved) => {
    const response = await api.put(`/chores/${id}/verify`, { approved });
    return response.data;
  },
  
  // Delete a chore
  deleteChore: async (id) => {
    const response = await api.delete(`/chores/${id}`);
    return response.data;
  }
};

export default choreService;