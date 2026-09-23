process.env.NODE_ENV = 'test';
process.env.PORT = '5000';
process.env.HOST = '127.0.0.1';
process.env.MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017';
process.env.MONGODB_DB_NAME = process.env.MONGODB_DB_NAME ?? 'warung_nafisah_test';
process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
process.env.LOG_LEVEL = 'silent';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.LOYALTY_POS_UI_ENABLED = 'false';
process.env.LOYALTY_RECEIPT_QR_ENABLED = 'false';
process.env.LOYALTY_REDEMPTION_ENABLED = 'false';
process.env.LOYALTY_ADMIN_ADJUSTMENT_ENABLED = 'false';

import { resetEnvCache } from '../src/config/env.js';
resetEnvCache();
