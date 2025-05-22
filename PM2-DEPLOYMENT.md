# PM2 Deployment Guide for Pomodoro Timer

This guide explains how to deploy the Pomodoro Timer application using PM2 for process management.

## Prerequisites

- Node.js (v16+)
- npm
- Docker (for MongoDB)
- PM2 (`npm install -g pm2`)
- serve (`npm install -g serve`)

## Initial Setup

1. Clone the repository:
   ```bash
   git clone <your-repository-url>
   cd pomodoro-timer
   ```

2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd server
   npm install --production
   cd ..

   # Install frontend dependencies
   cd pomodoro-timer
   npm install
   npm run build
   cd ..
   ```

3. Start MongoDB using Docker:
   ```bash
   docker compose -f docker-compose-pm2.yml up -d
   ```

4. Start the application with PM2:
   ```bash
   pm2 start ecosystem.config.js
   ```

5. Save the PM2 process list and set up startup:
   ```bash
   pm2 save
   pm2 startup
   ```

## Deployment Script

For easier deployment, use the provided `deploy-pm2.sh` script:

```bash
# Make the script executable (on Linux/macOS)
chmod +x deploy-pm2.sh

# Run the deployment script
./deploy-pm2.sh
```

On Windows, you can run:
```powershell
# Run the deployment script
bash deploy-pm2.sh
```

## Caddy Configuration

If you're using Caddy as a reverse proxy, use the provided `Caddyfile-pm2` configuration:

```bash
# Copy the Caddy configuration
sudo cp Caddyfile-pm2 /etc/caddy/Caddyfile

# Reload Caddy
sudo systemctl reload caddy
```

## PM2 Commands

Here are some useful PM2 commands:

- Start applications: `pm2 start ecosystem.config.js`
- Restart applications: `pm2 restart ecosystem.config.js`
- Stop applications: `pm2 stop ecosystem.config.js`
- View logs: `pm2 logs`
- Monitor applications: `pm2 monit`
- List running applications: `pm2 list`
- View application details: `pm2 show <app-name>`

## Troubleshooting

If you encounter issues:

1. Check the logs:
   ```bash
   pm2 logs
   ```

2. Restart the applications:
   ```bash
   pm2 restart all
   ```

3. Check MongoDB connection:
   ```bash
   docker ps
   ```

4. Verify the Caddy configuration:
   ```bash
   caddy validate --config /etc/caddy/Caddyfile
   ```

5. For serving the frontend, use PM2's built-in static file server:

   ### Best Solution: Use PM2's built-in serve functionality

   PM2 has a built-in static file server that works perfectly for serving React applications:

   ```bash
   # Command-line approach
   pm2 serve ./pomodoro-timer/build 3000 --name pomodoro-frontend --spa
   ```

   Or in ecosystem.config.js:

   ```javascript
   {
     name: "pomodoro-frontend",
     script: "serve",
     env: {
       PM2_SERVE_PATH: "./pomodoro-timer/build",
       PM2_SERVE_PORT: 3000,
       PM2_SERVE_SPA: "true",
       PM2_SERVE_HOMEPAGE: "/index.html",
       NODE_ENV: "production"
     }
   }
   ```

   The `PM2_SERVE_SPA: "true"` setting is crucial for React applications as it ensures all routes are directed to index.html.

   Then reload the configuration:
   ```bash
   pm2 reload ecosystem.config.js --update-env
   ```

   This approach is recommended by PM2 and is the most reliable way to serve static files.

## Updating the Application

To update the application:

1. Pull the latest changes:
   ```bash
   git pull origin master
   ```

2. Rebuild the frontend:
   ```bash
   cd pomodoro-timer
   npm install
   npm run build
   cd ..
   ```

3. Restart the applications:
   ```bash
   pm2 reload ecosystem.config.js --update-env
   ```

Or simply run the deployment script:
```bash
./deploy-pm2.sh
```
