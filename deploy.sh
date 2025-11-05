#!/bin/bash

# UniConnect Backend Deployment Script for Contabo VPS

echo "🚀 Starting UniConnect Backend Deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Install Docker Compose if not installed
if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Install Node.js and npm if not installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Create application directory
APP_DIR="/opt/uniconnect-backend"
echo "📁 Creating application directory: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Copy application files (assuming you're running this from the project directory)
echo "📋 Copying application files..."
cp -r . $APP_DIR/
cd $APP_DIR

# Create .env file
echo "⚙️ Creating environment file..."
cat > .env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=uniconnect
DB_PASSWORD=$(openssl rand -base64 32)
DB_NAME=uniconnect_db

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 64)
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=production
FRONTEND_URL=*

# Rate Limiting
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=100
EOF

echo "🔐 Generated secure passwords and JWT secret"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Build the application
echo "🔨 Building application..."
npm run build

# Setup PostgreSQL using Docker
echo "🐘 Setting up PostgreSQL..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 30

# Start the application with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Setup Nginx reverse proxy
echo "🌐 Setting up Nginx..."
sudo apt install -y nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/uniconnect << EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/uniconnect /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# Setup firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Setup SSL with Let's Encrypt (optional)
read -p "Do you want to setup SSL with Let's Encrypt? (y/n): " setup_ssl
if [[ $setup_ssl == "y" ]]; then
    read -p "Enter your domain name: " domain_name
    sudo apt install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d $domain_name
fi

echo "✅ Deployment completed successfully!"
echo ""
echo "🎉 Your UniConnect backend is now running!"
echo "📍 API URL: http://$(curl -s ifconfig.me)"
echo "📚 API Documentation: http://$(curl -s ifconfig.me)/api"
echo ""
echo "🔧 Useful commands:"
echo "  - Check logs: pm2 logs"
echo "  - Restart app: pm2 restart uniconnect-nestjs-backend"
echo "  - Check status: pm2 status"
echo "  - Check database: docker-compose logs postgres"
echo ""
echo "📝 Environment file location: $APP_DIR/.env"
echo "🔐 Database password and JWT secret have been generated automatically"