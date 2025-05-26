module.exports = {
  apps: [
    {
      name: 'binance-api-node',
      script: 'dist/server.js',
      instances: 1, // Or 'max' to scale to all available CPUs
      autorestart: true,
      watch: false, // Set to true to restart on file changes (dev only)
      max_memory_restart: '1G', // Restart if it exceeds 1GB memory
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        // PORT, LOG_LEVEL, API keys should be set in the environment or .env file
      },
      // Log files configuration
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z', // Z for UTC timezone
      out_file: './logs/out.log',       // Standard output log
      error_file: './logs/error.log',   // Standard error log
      merge_logs: true,                 // Merge logs from different instances
      // combine_logs: true,            // Deprecated, use merge_logs

      // Advanced features
      // exec_mode: 'cluster', // Enable cluster mode
      // cron_restart: '0 0 * * *', // Cron pattern to restart application
      // post_update: ['npm install'], // Execute commands after `pm2 pull` or `pm2 update`
    },
  ],

  // Deploy configuration (optional, for remote deployment with PM2)
  /*
  deploy: {
    production: {
      user: 'your_ssh_user',
      host: ['your_server_ip'],
      ref: 'origin/main', // Git branch
      repo: 'your_git_repository_url',
      path: '/var/www/production/binance-api-node',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
  */
};