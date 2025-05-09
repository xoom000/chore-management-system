# Complete Setup Guide for Chore Management System

This guide will walk you through setting up the entire household chore management system on a home server (like a Raspberry Pi or any computer that can stay on).

## 1. Hardware Requirements

- A computer/server to host the application (Raspberry Pi 4 or better recommended)
- At least 4GB of RAM for Node.js memory requirements
- Always-on internet connection
- Router with API access for internet control

## 2. Install Required Software

### Install Node.js
```bash
# On Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm

# Check installation
node --version  # Should be v14.x or higher
npm --version   # Should be 6.x or higher
```

### Install MongoDB
```bash
# On Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB and enable on boot
sudo systemctl start mongod
sudo systemctl enable mongod

# Check MongoDB status
sudo systemctl status mongod
```

## 3. Set Up the Application

### Clone or Copy the Code
```bash
# Create a directory for the application
mkdir -p /home/pi/chores
cd /home/pi/chores

# Copy all the application files to this directory
# Either use git clone or copy files manually
```

### Install Dependencies
```bash
cd /home/pi/chores
npm install
```

### Configure Environment Variables
```bash
# Copy the example .env file
cp .env.example .env

# Edit the .env file with your specific settings
nano .env
```

Edit the following in your .env file:
- Set a strong JWT_SECRET (random string)
- Update MONGODB_URI if needed
- Configure SMTP settings for email notifications
- Set your router's API details

## 4. Configure Router Access

For the router control feature to work, you need to:

1. Find your router model and check if it has an API
2. Most routers have a web interface at 192.168.1.1 or 192.168.0.1
3. Look for API documentation for your specific router model
4. Update the router control script in `/scripts/router-control.js` to match your router's API

Common router APIs:
- DD-WRT: Uses HTTP requests
- OpenWRT: Uses UBUS API
- Asus: Uses HTTP requests
- TP-Link: Uses HTTP requests

## 5. Start the Application

### Run Manually
```bash
cd /home/pi/chores
npm start
```

### Set Up as a Service (Recommended)
```bash
# Create a systemd service file
sudo nano /etc/systemd/system/chores.service
```

Add the following content:
```
[Unit]
Description=Household Chore Management App
After=network.target mongod.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/chores
ExecStart=/usr/bin/node --max-old-space-size=4096 server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl enable chores
sudo systemctl start chores
sudo systemctl status chores
```

## 6. Access the Application

Once running, you can access the application from any device on your home network:

1. Find your server's IP address:
```bash
hostname -I
```

2. Open a web browser on any device connected to your home network
3. Enter `http://YOUR_SERVER_IP:3000` in the address bar
4. The login page should appear

## 7. Create User Accounts

1. Register as a parent first
2. Create accounts for your children
3. Set up device MAC addresses for internet control

## 8. Router Configuration

To make the internet control work:

1. Log into your router's admin panel
2. Find the MAC filtering or access control section
3. Enable MAC filtering
4. Set it to "deny" mode for devices that should be controlled
5. Make sure your server's MAC address is always allowed

## 9. Testing the System

1. Create some test chores
2. Try completing a chore
3. Check if internet access is properly controlled
4. Test the notification system by setting due dates

## Troubleshooting

### If the application doesn't start:
- Check MongoDB is running: `sudo systemctl status mongod`
- Check log files: `journalctl -u chores`
- Verify .env configuration is correct
- Check for memory errors: If you see "JavaScript heap out of memory" errors, make sure the Node.js memory limit is properly set with `--max-old-space-size=4096` in your startup command

### If internet control doesn't work:
- Run the test script: `node scripts/router-control.js list`
- Check if your router API credentials are correct
- You may need to modify the router service for your specific router model

### If email notifications don't work:
- Verify SMTP settings in .env
- Check if your email provider allows app passwords/less secure apps
- Try a different email provider

## Regular Maintenance

1. Back up the MongoDB database:
```bash
mongodump --out /backup/mongo/$(date +"%Y-%m-%d")
```

2. Update the application when needed:
```bash
cd /home/pi/chores
git pull  # If using git
npm install
sudo systemctl restart chores
```