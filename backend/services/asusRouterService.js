const { exec } = require('child_process');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

// Path to the router control script
const ROUTER_SCRIPT = path.resolve(__dirname, '../../scripts/asus-router-control.js');

// Update user internet access on the Asus router
exports.updateUserInternetAccess = async (macAddress, allow) => {
  try {
    if (!macAddress) {
      console.error('No MAC address provided');
      return false;
    }
    
    // Call the dedicated script with the appropriate command
    const command = allow ? 'enable' : 'disable';
    const { stdout, stderr } = await execPromise(`node ${ROUTER_SCRIPT} ${command} ${macAddress}`);
    
    if (stderr) {
      console.error('Router control error:', stderr);
      return false;
    }
    
    console.log(`Router control output: ${stdout}`);
    
    // Save the rules to make them persist
    await execPromise(`node ${ROUTER_SCRIPT} save`);
    
    return true;
  } catch (error) {
    console.error('Router access control error:', error.message);
    return false;
  }
};

// Get all device status from router
exports.getAllDeviceStatus = async () => {
  try {
    const { stdout, stderr } = await execPromise(`node ${ROUTER_SCRIPT} list`);
    
    if (stderr) {
      console.error('Router device listing error:', stderr);
      return null;
    }
    
    // The output is a formatted table, which is hard to parse
    // For actual implementation, we'd need to parse this or modify
    // the script to output JSON
    console.log('Retrieved device list from router');
    
    // For demonstration, return the raw output
    return stdout;
  } catch (error) {
    console.error('Router device status error:', error.message);
    return null;
  }
};