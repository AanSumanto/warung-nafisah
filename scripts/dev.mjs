#!/usr/bin/env node
console.log('Warung Nafisah ERP — development servers');
console.log('');
console.log('Run each workspace in a separate terminal:');
console.log('');
console.log('  Backend API (port 5000):');
console.log('    npm run dev --workspace=@warung-nafisah/backend');
console.log('');
console.log('  Frontend (port 3000):');
console.log('    npm run dev --workspace=@warung-nafisah/frontend');
console.log('');
console.log('Local infrastructure (MongoDB + Redis):');
console.log('  docker compose -f deployment/docker-compose.yml up -d');
console.log('');
console.log('Repository verification:');
console.log('  npm run verify:repo');
