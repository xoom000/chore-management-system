const axios = require('axios');

// Function to authenticate with router
const getRouterAuthToken = async () => {
  try {
    const response = await axios.post(`${process.env.ROUTER_API_URL}/auth`, {
      username: process.env.ROUTER_USERNAME,
      password: process.env.ROUTER_PASSWORD
    });
    
    return response.data.token;
  } catch (error) {
    console.error('Router authentication error:', error.message);
    return null;
  }
};

// Update user internet access on router
exports.updateUserInternetAccess = async (macAddress, allow) => {
  try {
    if (!macAddress) {
      console.error('No MAC address provided');
      return false;
    }
    
    // Get auth token
    const token = await getRouterAuthToken();
    if (!token) {
      console.error('Failed to authenticate with router');
      return false;
    }
    
    // Update access control on router
    // Note: This is a generic implementation that will need to be adjusted for the specific router API
    const response = await axios.post(
      `${process.env.ROUTER_API_URL}/access-control`, 
      {
        macAddress,
        allow
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.status === 200;
  } catch (error) {
    console.error('Router access control error:', error.message);
    return false;
  }
};

// Get all device status from router
exports.getAllDeviceStatus = async () => {
  try {
    // Get auth token
    const token = await getRouterAuthToken();
    if (!token) {
      console.error('Failed to authenticate with router');
      return null;
    }
    
    // Get device list from router
    const response = await axios.get(
      `${process.env.ROUTER_API_URL}/devices`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Router device status error:', error.message);
    return null;
  }
};