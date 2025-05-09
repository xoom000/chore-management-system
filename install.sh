#!/bin/bash

# Chore Management System Installer
# This script will set up the entire Chore Management System including:
# - Dependencies installation (Node.js, MongoDB, required packages)
# - Configuration setup
# - Database initialization
# - Service creation for automatic startup
# - Router integration

# Text formatting
BOLD="\033[1m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
RESET="\033[0m"

# Initialize variables
INSTALL_DIR=""
ROUTER_MODEL=""
ROUTER_IP=""
ROUTER_USER=""
ROUTER_PASSWORD=""
ROUTER_SSH_PORT="22"
MONGODB_URI="mongodb://localhost:27017/chores"
JWT_SECRET=$(openssl rand -hex 32)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
PORT="3000"
SYSTEM_USER=$(whoami)

# Display banner
echo -e "${BOLD}${BLUE}"
echo "======================================================"
echo "      Chore Management System Installer               "
echo "======================================================"
echo -e "${RESET}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}NOTE: Not running as root. Some operations might require sudo privileges.${RESET}\n"
fi

# Function to prompt for user input with default value
prompt_with_default() {
  local prompt=$1
  local default=$2
  local var_name=$3
  local is_password=$4
  
  if [ "$is_password" = true ]; then
    read -sp "${prompt} [hidden]: " input
    echo ""
  else
    read -p "${prompt} [${default}]: " input
  fi
  
  input=${input:-$default}
  eval $var_name=\$input
}

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to add MongoDB GPG key properly (handling apt-key deprecation)
add_mongodb_gpg_key() {
  local version=$1
  local key_url="https://www.mongodb.org/static/pgp/server-${version}.asc"

  # Create keyrings directory if it doesn't exist
  sudo mkdir -p /etc/apt/keyrings

  # Download key and add to keyrings
  wget -qO- $key_url | sudo gpg --dearmor -o /etc/apt/keyrings/mongodb-${version}.gpg

  # Add proper permissions
  sudo chmod 644 /etc/apt/keyrings/mongodb-${version}.gpg

  echo "Added MongoDB $version GPG key to system keyring"
}

# Function to install system dependencies
install_dependencies() {
  echo -e "\n${BOLD}Installing system dependencies...${RESET}"
  
  # Detect OS
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
  else
    echo -e "${RED}Unable to detect operating system. Please install dependencies manually.${RESET}"
    return 1
  fi
  
  # Install for Debian/Ubuntu
  if [[ $OS == *"Ubuntu"* ]] || [[ $OS == *"Debian"* ]] || [[ $OS == *"Raspbian"* ]]; then
    echo "Detected $OS $VER"
    
    echo "Updating package lists..."
    sudo apt-get update
    
    # Install Node.js if not already installed
    if ! command_exists node; then
      echo "Installing Node.js..."
      sudo apt-get install -y curl
      curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
      sudo apt-get install -y nodejs
    else
      echo "Node.js is already installed."
    fi
    
    # Install MongoDB if not already installed
    if ! command_exists mongod; then
      echo "Installing MongoDB..."
      
      # Install MongoDB based on architecture
      # Different steps for Raspberry Pi (ARM) vs regular systems
      if [[ $(uname -m) == *"arm"* ]]; then
        # ARM architecture (Raspberry Pi)
        echo "Detected ARM architecture, installing MongoDB for ARM..."
        sudo apt-get install -y mongodb
      else
        # x86/x64 architecture
        # Add MongoDB GPG key using the new keyring approach
        add_mongodb_gpg_key "7.0"

        # Create MongoDB repository file
        echo "deb [signed-by=/etc/apt/keyrings/mongodb-7.0.gpg] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
        sudo apt-get update

        # Try to install MongoDB 7.0
        if ! sudo apt-get install -y mongodb-org; then
          echo "Failed to install MongoDB 7.0. Trying MongoDB Community Edition..."
          # Fall back to regular MongoDB for Ubuntu
          sudo apt-get install -y mongodb

          # Check if installation was successful
          if ! command_exists mongod; then
            echo "Please install MongoDB manually. Visit https://www.mongodb.com/docs/manual/administration/install-on-linux/"
            return 1
          fi
        fi
      fi
      
      echo "Starting MongoDB service..."
      sudo systemctl start mongod
      sudo systemctl enable mongod
    else
      echo "MongoDB is already installed."
    fi
    
    # Install other dependencies
    echo "Installing other required packages..."
    sudo apt-get install -y sshpass build-essential
    
  # Install for RHEL/CentOS/Fedora
  elif [[ $OS == *"CentOS"* ]] || [[ $OS == *"Red Hat"* ]] || [[ $OS == *"Fedora"* ]]; then
    echo "Detected $OS $VER"
    
    # Install Node.js if not already installed
    if ! command_exists node; then
      echo "Installing Node.js..."
      curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
      sudo yum install -y nodejs
    else
      echo "Node.js is already installed."
    fi
    
    # Install MongoDB if not already installed
    if ! command_exists mongod; then
      echo "Installing MongoDB..."
      
      # Create MongoDB repo file
      sudo tee /etc/yum.repos.d/mongodb-org-7.0.repo << EOF
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/\$releasever/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
EOF
      
      # Try to install MongoDB 7.0
      if ! sudo yum install -y mongodb-org; then
        echo "Failed to install MongoDB 7.0. Trying alternative approach..."

        # Check if mongodb package is available in base repos
        if sudo yum list mongodb &>/dev/null; then
          sudo yum install -y mongodb
        else
          echo "Please install MongoDB manually. Visit https://www.mongodb.com/docs/manual/administration/install-on-linux/"
          return 1
        fi
      fi
      
      echo "Starting MongoDB service..."
      sudo systemctl start mongod
      sudo systemctl enable mongod
    else
      echo "MongoDB is already installed."
    fi
    
    # Install other dependencies
    echo "Installing other required packages..."
    sudo yum install -y sshpass gcc-c++ make
    
  else
    echo -e "${YELLOW}Unsupported OS: $OS. Please install Node.js, MongoDB, and sshpass manually.${RESET}"
    return 1
  fi
  
  # Verify installations
  if command_exists node && command_exists npm && command_exists mongod && command_exists sshpass; then
    echo -e "${GREEN}All dependencies installed successfully!${RESET}"
    # Get versions
    NODE_VERSION=$(node -v)
    NPM_VERSION=$(npm -v)
    echo "Node.js version: $NODE_VERSION"
    echo "npm version: $NPM_VERSION"
    echo "MongoDB installed: Yes"
    echo "sshpass installed: Yes"
    return 0
  else
    echo -e "${RED}Some dependencies failed to install. Please install them manually.${RESET}"
    return 1
  fi
}

# Function to check if MongoDB is running
check_mongodb() {
  echo -e "\n${BOLD}Checking MongoDB status...${RESET}"
  
  if systemctl is-active --quiet mongod; then
    echo -e "${GREEN}MongoDB is running.${RESET}"
    return 0
  else
    echo -e "${YELLOW}MongoDB is not running. Attempting to start...${RESET}"
    sudo systemctl start mongod
    
    if systemctl is-active --quiet mongod; then
      echo -e "${GREEN}MongoDB started successfully.${RESET}"
      return 0
    else
      echo -e "${RED}Failed to start MongoDB. Please check MongoDB installation.${RESET}"
      echo "You can try starting it manually with: sudo systemctl start mongod"
      return 1
    fi
  fi
}

# Function to get installation directory
get_install_directory() {
  echo -e "\n${BOLD}Setting up installation directory...${RESET}"
  
  prompt_with_default "Where would you like to install the Chore Management System?" "/opt/chores" "INSTALL_DIR"
  
  # Create directory if it doesn't exist
  if [ ! -d "$INSTALL_DIR" ]; then
    echo "Creating directory $INSTALL_DIR..."
    sudo mkdir -p "$INSTALL_DIR"
    sudo chown $SYSTEM_USER:$SYSTEM_USER "$INSTALL_DIR"
  fi
  
  echo -e "${GREEN}Installation directory set to: $INSTALL_DIR${RESET}"
}

# Function to gather router information
gather_router_info() {
  echo -e "\n${BOLD}Router Configuration${RESET}"
  echo -e "The system needs to communicate with your router to control internet access."
  
  PS3="Select your router type: "
  options=("Asus Router" "DD-WRT Router" "TP-Link Router" "Other/Skip")
  select opt in "${options[@]}"
  do
    case $opt in
      "Asus Router")
        ROUTER_MODEL="asus"
        break
        ;;
      "DD-WRT Router")
        ROUTER_MODEL="ddwrt"
        break
        ;;
      "TP-Link Router")
        ROUTER_MODEL="tplink"
        break
        ;;
      "Other/Skip")
        ROUTER_MODEL="other"
        echo -e "${YELLOW}Skipping router integration. You'll need to configure it manually later.${RESET}"
        return 0
        ;;
      *) 
        echo "Invalid option"
        ;;
    esac
  done
  
  # Get router access information
  prompt_with_default "Enter router IP address" "192.168.1.1" "ROUTER_IP"
  prompt_with_default "Enter router SSH/admin username" "admin" "ROUTER_USER"
  prompt_with_default "Enter router SSH port" "22" "ROUTER_SSH_PORT"
  prompt_with_default "Enter router password" "" "ROUTER_PASSWORD" true
  
  echo -e "${GREEN}Router information collected.${RESET}"
}

# Function to gather email notification settings
gather_email_settings() {
  echo -e "\n${BOLD}Email Notification Settings${RESET}"
  echo -e "The system can send email notifications for chores and reminders."
  
  read -p "Do you want to configure email notifications? (y/n) [y]: " setup_email
  setup_email=${setup_email:-y}
  
  if [[ $setup_email == "y" || $setup_email == "Y" ]]; then
    prompt_with_default "SMTP Server (e.g. smtp.gmail.com)" "smtp.gmail.com" "SMTP_HOST"
    prompt_with_default "SMTP Port (usually 587 for TLS, 465 for SSL)" "587" "SMTP_PORT"
    prompt_with_default "SMTP Username (your email address)" "" "SMTP_USER"
    prompt_with_default "SMTP Password" "" "SMTP_PASS" true
    
    echo -e "${GREEN}Email settings configured.${RESET}"
  else
    echo -e "${YELLOW}Skipping email configuration. You can set it up later in the .env file.${RESET}"
  fi
}

# Function to copy files to installation directory
copy_files() {
  echo -e "\n${BOLD}Copying files to installation directory...${RESET}"
  
  # Copy all files from current directory to install directory
  cp -r ./* "$INSTALL_DIR/"
  
  echo -e "${GREEN}Files copied successfully.${RESET}"
}

# Function to create .env file
create_env_file() {
  echo -e "\n${BOLD}Creating configuration file...${RESET}"
  
  # Create .env file
  cat > "$INSTALL_DIR/.env" << EOF
# Chore Management System Configuration
PORT=$PORT
MONGODB_URI=$MONGODB_URI
JWT_SECRET=$JWT_SECRET

# Email Settings
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS

# Router Settings
ROUTER_MODEL=$ROUTER_MODEL
ROUTER_IP=$ROUTER_IP
ROUTER_SSH_USER=$ROUTER_USER
ROUTER_SSH_PASSWORD=$ROUTER_PASSWORD
ROUTER_SSH_PORT=$ROUTER_SSH_PORT
EOF
  
  echo -e "${GREEN}Configuration file created successfully.${RESET}"
}

# Function to install Node.js dependencies
install_node_dependencies() {
  echo -e "\n${BOLD}Installing Node.js dependencies...${RESET}"
  
  cd "$INSTALL_DIR"
  npm install
  
  echo -e "${GREEN}Dependencies installed successfully.${RESET}"
}

# Function to create systemd service
create_service() {
  echo -e "\n${BOLD}Creating systemd service for automatic startup...${RESET}"
  
  read -p "Do you want to create a system service to start the app automatically? (y/n) [y]: " create_svc
  create_svc=${create_svc:-y}
  
  if [[ $create_svc == "y" || $create_svc == "Y" ]]; then
    # Create service file
    sudo tee /etc/systemd/system/chores.service > /dev/null << EOF
[Unit]
Description=Household Chore Management System
After=network.target mongod.service

[Service]
Type=simple
User=$SYSTEM_USER
WorkingDirectory=$INSTALL_DIR
ExecStart=$(which node) --max-old-space-size=4096 $INSTALL_DIR/server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
    
    # Enable and start service
    sudo systemctl daemon-reload
    sudo systemctl enable chores
    sudo systemctl start chores
    
    # Check if service started successfully
    if systemctl is-active --quiet chores; then
      echo -e "${GREEN}Service created and started successfully.${RESET}"
    else
      echo -e "${RED}Failed to start service. Check logs with: sudo journalctl -u chores${RESET}"
    fi
  else
    echo -e "${YELLOW}Skipping service creation. You can start the app manually with: node $INSTALL_DIR/server.js${RESET}"
  fi
}

# Function to display final instructions
show_final_instructions() {
  local ip_address=$(hostname -I | awk '{print $1}')
  
  echo -e "\n${BOLD}${GREEN}Installation Complete!${RESET}\n"
  echo -e "${BOLD}Your Chore Management System is now installed and running.${RESET}"
  echo -e "\n${BOLD}Access Information:${RESET}"
  echo -e "Web Interface: http://$ip_address:$PORT"
  echo -e "Installation Directory: $INSTALL_DIR"
  echo -e "Configuration File: $INSTALL_DIR/.env"
  
  echo -e "\n${BOLD}Next Steps:${RESET}"
  echo "1. Access the web interface to create your parent account"
  echo "2. Add your children's accounts"
  echo "3. Set up chores and assign them to your children"
  
  echo -e "\n${BOLD}Troubleshooting:${RESET}"
  echo "- View logs with: sudo journalctl -u chores"
  echo "- Restart the service with: sudo systemctl restart chores"
  echo "- Edit configuration: nano $INSTALL_DIR/.env"
  
  echo -e "\n${BOLD}Thank you for installing the Chore Management System!${RESET}"
}

# Main installation process
main() {
  # Welcome message
  echo -e "Welcome to the Chore Management System installer!"
  echo -e "This script will guide you through the installation process.\n"
  
  # Check if script is run from the correct directory
  if [ ! -f "server.js" ] || [ ! -d "backend" ]; then
    echo -e "${RED}Error: This script must be run from the chores application directory.${RESET}"
    exit 1
  fi
  
  # Confirm installation
  read -p "Continue with installation? (y/n) [y]: " confirm
  confirm=${confirm:-y}
  
  if [[ $confirm != "y" && $confirm != "Y" ]]; then
    echo "Installation cancelled."
    exit 0
  fi
  
  # Run installation steps
  install_dependencies || { echo -e "${RED}Failed to install dependencies. Exiting.${RESET}"; exit 1; }
  check_mongodb || { echo -e "${RED}MongoDB check failed. Exiting.${RESET}"; exit 1; }
  get_install_directory
  gather_router_info
  gather_email_settings
  copy_files
  create_env_file
  install_node_dependencies
  create_service
  show_final_instructions
}

# Run main function
main