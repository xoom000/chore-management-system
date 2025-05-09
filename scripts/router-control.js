#!/usr/bin/env node

const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const ROUTER_API_URL = process.env.ROUTER_API_URL;
const ROUTER_USERNAME = process.env.ROUTER_USERNAME;
const ROUTER_PASSWORD = process.env.ROUTER_PASSWORD;

// This script demonstrates how to interact with a home router
// You'll need to adjust it based on your specific router's API

async function getRouterToken() {
  try {
    const response = await axios.post(`${ROUTER_API_URL}/auth`, {
      username: ROUTER_USERNAME,
      password: ROUTER_PASSWORD
    });
    
    return response.data.token;
  } catch (error) {
    console.error('Failed to authenticate with router:', error.message);
    return null;
  }
}

async function setDeviceAccess(macAddress, allow) {
  const token = await getRouterToken();
  
  if (!token) {
    console.error('Authentication failed. Cannot continue.');
    return false;
  }
  
  try {
    // Example: For a router using REST API
    const response = await axios.post(
      `${ROUTER_API_URL}/access-control`,
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
    
    if (response.status === 200) {
      console.log(`Successfully ${allow ? 'enabled' : 'disabled'} internet access for device ${macAddress}`);
      return true;
    } else {
      console.error('Failed to update access control:', response.data);
      return false;
    }
  } catch (error) {
    console.error('Error updating device access:', error.message);
    return false;
  }
}

async function getAllDevices() {
  const token = await getRouterToken();
  
  if (!token) {
    console.error('Authentication failed. Cannot continue.');
    return [];
  }
  
  try {
    // Example: For a router using REST API
    const response = await axios.get(
      `${ROUTER_API_URL}/devices`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error getting devices:', error.message);
    return [];
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log(`
Router Control Script
Usage:
  list                     - List all devices
  enable <mac-address>     - Enable internet for device
  disable <mac-address>    - Disable internet for device
    `);
    return;
  }
  
  switch (command) {
    case 'list':
      const devices = await getAllDevices();
      console.table(devices.map(d => ({
        Name: d.name || 'Unknown',
        MAC: d.macAddress,
        IP: d.ipAddress,
        Connected: d.connected ? 'Yes' : 'No',
        Blocked: d.blocked ? 'Yes' : 'No'
      })));
      break;
      
    case 'enable':
      const enableMac = args[1];
      if (!enableMac) {
        console.error('MAC address required');
        return;
      }
      await setDeviceAccess(enableMac, true);
      break;
      
    case 'disable':
      const disableMac = args[1];
      if (!disableMac) {
        console.error('MAC address required');
        return;
      }
      await setDeviceAccess(disableMac, false);
      break;
      
    default:
      console.error('Unknown command:', command);
      break;
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});