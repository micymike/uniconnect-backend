# UniConnect Backend: Subdomain Deployment Guide

## Goal
Expose the backend service at `api.uniconnect-learninghub.co.ke` using nginx.

## Steps

1. **Ensure backend is running on port 3001**  
   (Edit your backend's `.env` or config to set PORT=3001 if needed.)

2. **Create nginx config for the subdomain**  
   Add the following to `/etc/nginx/sites-available/uniconnect-backend` on your VPS:

   ```
   server {
       listen 80;
       server_name api.uniconnect-learninghub.co.ke;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Enable the site and reload nginx**  
   ```
   ln -sf /etc/nginx/sites-available/uniconnect-backend /etc/nginx/sites-enabled/
   nginx -t && systemctl reload nginx
   ```

4. **Update DNS**  
   Make sure `api.uniconnect-learninghub.co.ke` points to your VPS IP.

5. **Verify**  
   Visit `https://api.uniconnect-learninghub.co.ke` in your browser. You should see your backend service.

## Troubleshooting
- If you see the old site, clear your browser cache or wait for DNS propagation.
- Check backend logs and nginx error logs for issues.
