#!/bin/bash

echo "🚀 Quick UniConnect Deployment"

# Set variables
VPS_IP="130.185.118.28"
DOMAIN="egertonrentals.online"

# Upload files
echo "📤 Uploading files..."
scp -r $(ls -A | grep -v "node_modules") root@$VPS_IP:/uniconnect-backend

# Connect and deploy
ssh root@$VPS_IP << 'EOF'
cd uniconnect-backend

# Install dependencies if not installed
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    npm install -g pm2
fi

if ! command -v nginx &> /dev/null; then
    apt install -y nginx
fi

# Start database
docker-compose up -d postgres
sleep 10

# Build and start app
npm ci --only=production
npm run build
pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js

# Configure Nginx if not configured
if [ ! -f /etc/nginx/sites-enabled/uniconnect ]; then
    cat > /etc/nginx/sites-available/uniconnect << 'NGINX_EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF
    
    ln -sf /etc/nginx/sites-available/uniconnect /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl restart nginx
fi

echo "✅ Deployment complete!"
echo "🌐 Your API is available at: http://$(curl -s ifconfig.me)"
echo "📚 API Documentation: http://$(curl -s ifconfig.me)/api"
EOF
