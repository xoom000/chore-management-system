#!/usr/bin/env node

const { exec } = require('child_process');
const dotenv = require('dotenv');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Router credentials
const ROUTER_IP = process.env.ROUTER_IP || '192.168.1.1';
const ROUTER_SSH_USER = process.env.ROUTER_SSH_USER || 'admin';
const ROUTER_SSH_PASSWORD = process.env.ROUTER_SSH_PASSWORD;
const SSH_PORT = process.env.ROUTER_SSH_PORT || '22';

// SSH into the router and execute a command
async function executeRouterCommand(command) {
  try {
    // Using sshpass to provide password non-interactively
    // You may need to install sshpass: sudo apt-get install sshpass
    const sshCommand = `sshpass -p "${ROUTER_SSH_PASSWORD}" ssh -o StrictHostKeyChecking=no -p ${SSH_PORT} ${ROUTER_SSH_USER}@${ROUTER_IP} '${command}'`;
    
    const { stdout, stderr } = await execPromise(sshCommand);
    
    if (stderr) {
      console.error('SSH Error:', stderr);
    }
    
    return stdout.trim();
  } catch (error) {
    console.error('Error executing router command:', error.message);
    return null;
  }
}

// Get a list of all connected devices
async function listDevices() {
  // For Asus routers, we can get the connected clients
  const output = await executeRouterCommand('cat /proc/net/arp');
  
  if (!output) return [];
  
  // Parse the output - typical format is:
  // IP address       HW type     Flags       HW address            Mask     Device
  // 192.168.1.123    0x1         0x2         aa:bb:cc:dd:ee:ff     *        br0
  const devices = [];
  const lines = output.split('\n');
  
  // Skip the header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(/\s+/);
    if (parts.length >= 4) {
      const ip = parts[0];
      const mac = parts[3];
      
      // Get the device name if available
      const hostname = await executeRouterCommand(`nvram get dhcp_staticlist | grep -i ${mac}`);
      const name = hostname ? hostname.split('=')[0].trim() : 'Unknown';
      
      devices.push({
        ip,
        mac,
        name,
        connected: true
      });
    }
  }
  
  return devices;
}

// Enable or disable internet for a device by MAC address
async function setDeviceAccess(macAddress, allow) {
  try {
    macAddress = macAddress.toLowerCase();
    
    // Check current block list
    const currentRules = await executeRouterCommand('iptables -L FORWARD -v -n');
    const isCurrentlyBlocked = currentRules.includes(macAddress);
    
    if (allow && isCurrentlyBlocked) {
      // Remove block rule if it exists
      await executeRouterCommand(`iptables -D FORWARD -m mac --mac-source ${macAddress} -j DROP`);
      console.log(`Enabled internet access for device ${macAddress}`);
      return true;
    } else if (!allow && !isCurrentlyBlocked) {
      // Add block rule if it doesn't exist
      await executeRouterCommand(`iptables -I FORWARD -m mac --mac-source ${macAddress} -j DROP`);
      console.log(`Disabled internet access for device ${macAddress}`);
      return true;
    } else {
      console.log(`Device ${macAddress} is already ${allow ? 'enabled' : 'disabled'}`);
      return true;
    }
  } catch (error) {
    console.error('Error updating device access:', error.message);
    return false;
  }
}

// Save the rules to persist across reboots
async function saveRules() {
  await executeRouterCommand('nvram commit');
  console.log('Saved firewall rules to persist across reboots');
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log(`
Asus Router Control Script
Usage:
  list                     - List all connected devices
  enable <mac-address>     - Enable internet for device
  disable <mac-address>    - Disable internet for device
  save                     - Save rules to persist across reboots
    `);
    return;
  }
  
  switch (command) {
    case 'list':
      const devices = await listDevices();
      console.table(devices.map(d => ({
        Name: d.name || 'Unknown',
        MAC: d.mac,
        IP: d.ip,
        Connected: d.connected ? 'Yes' : 'No'
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
      
    case 'save':
      await saveRules();
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