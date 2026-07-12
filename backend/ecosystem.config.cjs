/** @type {import('pm2').StartOptions} */
module.exports = {
  apps: [
    {
      name: 'warung-nafisah-api',
      cwd: __dirname,
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      kill_timeout: 10_000,
      wait_ready: true,
      listen_timeout: 30_000,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
