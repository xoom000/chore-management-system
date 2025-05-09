# Household Chore Management System

A comprehensive application to manage household chores between parents and children, with internet access control based on chore completion.

## Features

- User management with parent and child roles
- Chore assignment and tracking
- Recurring chores with various scheduling patterns
- Notification system (in-app and email)
- Internet access control linked to chore completion
- Chore verification system for parents
- Dashboard with statistics and recent activities

## System Architecture

The application is built with the following technologies:

- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Frontend**: React with Material-UI
- **Authentication**: JWT (JSON Web Tokens)
- **Notifications**: Email via Nodemailer and in-app
- **Scheduling**: Node-schedule for recurring tasks

## Setup Instructions

### Prerequisites

- Linux-based system (Ubuntu, Debian, Raspbian, CentOS, etc.)
- Access to a router with SSH capabilities for internet control
- A computer that can remain powered on (Raspberry Pi is ideal)

### Automated Installation (Recommended)

We provide an automated installer that handles all dependencies and configuration:

1. Clone the repository
   ```
   git clone <repository-url>
   cd chores
   ```

2. Make the installer executable and run it
   ```
   chmod +x install.sh
   ./install.sh
   ```

3. Follow the interactive prompts to configure:
   - Installation directory
   - Router settings
   - Email notification settings
   - System service setup

The installer will:
- Install Node.js and MongoDB if needed
- Configure the application with your settings
- Set up a system service for automatic startup
- Provide a web URL to access the application

### Manual Installation (Alternative)

If you prefer to set up manually:

1. Install prerequisites:
   - Node.js (v14 or higher)
   - MongoDB
   - sshpass (for router control)

2. Clone the repository
   ```
   git clone <repository-url>
   cd chores
   ```

3. Install dependencies
   ```
   npm install
   ```

4. Configure environment variables
   - Copy `.env.example` to `.env`
   - Update the variables with your specific configuration:
     - MongoDB connection string
     - JWT secret
     - SMTP settings for email notifications
     - Router configuration

5. Start the server
   ```
   node server.js
   ```

## Router Configuration

The system interacts with your home router to control internet access using SSH commands and iptables rules.

### Supported Routers

The system includes built-in support for:
- **Asus Routers** (including RT-BE92U and others) with SSH access
- DD-WRT routers
- OpenWRT-based routers
- Most routers with SSH access and iptables support

### Setup Process

The installer will guide you through router configuration by asking for:
1. Router type
2. Router IP address
3. SSH username and password
4. SSH port (usually 22)

### Manual Configuration

If your router isn't automatically detected:
1. Update the router settings in your `.env` file
2. Modify the appropriate router service file in `/backend/services/` to match your router's command structure
3. Test the connection with the standalone script:
   ```
   node scripts/asus-router-control.js list  # For Asus routers
   # or
   node scripts/router-control.js list       # For generic routers
   ```

## User Guide

### For Parents

1. **Register** as a parent user
2. **Add children** to the system and set up their accounts
3. **Create chores** and assign them to children
4. **Monitor progress** from the dashboard
5. **Verify completed chores** that require verification
6. **Manage internet access** manually if needed

### For Children

1. **Register** or use the account created by your parent
2. **View assigned chores** from the dashboard
3. **Mark chores as complete** when you finish them
4. **Check internet access status** from the dashboard

## Internet Access Control

The system automatically manages internet access based on chore completion:

- When all required chores are completed, internet access is granted
- When chores become overdue, internet access is revoked
- Parents can manually override internet access if needed

## Router Script

A standalone script is provided in `/scripts/router-control.js` that can be used to test and manually control internet access for devices. Run it with:

```
node scripts/router-control.js list         # List all devices
node scripts/router-control.js enable MAC   # Enable internet for device with MAC address
node scripts/router-control.js disable MAC  # Disable internet for device with MAC address
```

## Customization

- Modify the notification schedules in `notificationScheduler.js`
- Adjust the chore recurrence patterns in the database or UI
- Customize the router control logic in `routerService.js`

## Troubleshooting

- **Internet control not working**: Check that your router API configuration is correct
- **Emails not sending**: Verify your SMTP settings in the `.env` file
- **Recurring chores not creating**: Check that the scheduler is running properly

## License

This project is licensed under the MIT License - see the LICENSE file for details.