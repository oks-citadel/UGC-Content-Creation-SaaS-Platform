#!/usr/bin/env node

/**
 * NEXUS Platform - Database Setup Verification Script
 * Verifies that all databases are properly configured and accessible
 */

const { PrismaClient } = require('@prisma/client');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  postgres: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/nexus',
  },
  mongodb: {
    url: process.env.MONGODB_URL || 'mongodb://localhost:27017/nexus',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function section(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(message, 'cyan');
  log('='.repeat(60), 'cyan');
}

// Check if files exist
function checkFiles() {
  section('Checking Database Files');

  const files = [
    'postgres/schema.prisma',
    'postgres/migrations/001_initial_schema.sql',
    'postgres/migrations/002_add_indexes.sql',
    'postgres/migrations/003_add_triggers.sql',
    'postgres/seeds/plans.ts',
    'postgres/seeds/admin.ts',
    'postgres/seeds/index.ts',
    'mongodb/schemas/content-metadata.js',
    'mongodb/schemas/analytics-events.js',
    'mongodb/schemas/audit-logs.js',
    'mongodb/create-indexes.js',
    'redis/redis.conf',
    'redis/README.md',
    '.env.example',
    'package.json',
    'README.md',
  ];

  let allFilesExist = true;

  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      success(`Found: ${file}`);
    } else {
      error(`Missing: ${file}`);
      allFilesExist = false;
    }
  });

  return allFilesExist;
}

// Test PostgreSQL connection
async function testPostgreSQL() {
  section('Testing PostgreSQL Connection');

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    success('Connected to PostgreSQL');

    // Test query
    const result = await prisma.$queryRaw`SELECT version()`;
    info(`PostgreSQL Version: ${result[0].version.split(' ')[1]}`);

    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;

    if (tables.length > 0) {
      success(`Found ${tables.length} tables in database`);
      info('Sample tables:');
      tables.slice(0, 5).forEach(table => {
        info(`  - ${table.table_name}`);
      });
      if (tables.length > 5) {
        info(`  ... and ${tables.length - 5} more`);
      }
    } else {
      warning('No tables found. Run migrations first: pnpm db:migrate');
    }

    return true;
  } catch (err) {
    error(`PostgreSQL connection failed: ${err.message}`);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Test MongoDB connection
async function testMongoDB() {
  section('Testing MongoDB Connection');

  try {
    await mongoose.connect(config.mongodb.url, {
      serverSelectionTimeoutMS: 5000,
    });
    success('Connected to MongoDB');

    // Get database stats
    const admin = mongoose.connection.db.admin();
    const info = await admin.serverStatus();
    info(`MongoDB Version: ${info.version}`);

    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    if (collections.length > 0) {
      success(`Found ${collections.length} collections`);
      info('Collections:');
      collections.forEach(coll => {
        info(`  - ${coll.name}`);
      });
    } else {
      warning('No collections found yet');
    }

    return true;
  } catch (err) {
    error(`MongoDB connection failed: ${err.message}`);
    return false;
  } finally {
    await mongoose.disconnect();
  }
}

// Test Redis connection
async function testRedis() {
  section('Testing Redis Connection');

  const redis = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  try {
    await redis.connect();
    success('Connected to Redis');

    // Get Redis info
    const info = await redis.info('server');
    const version = info.match(/redis_version:([^\r\n]+)/)[1];
    info(`Redis Version: ${version}`);

    // Test basic operations
    await redis.set('test_key', 'test_value', 'EX', 10);
    const value = await redis.get('test_key');

    if (value === 'test_value') {
      success('Redis read/write operations working');
    }

    // Get database size
    const dbsize = await redis.dbsize();
    info(`Keys in database: ${dbsize}`);

    // Clean up
    await redis.del('test_key');

    return true;
  } catch (err) {
    error(`Redis connection failed: ${err.message}`);
    return false;
  } finally {
    await redis.quit();
  }
}

// Check environment variables
function checkEnvironment() {
  section('Checking Environment Variables');

  const requiredVars = [
    'DATABASE_URL',
    'MONGODB_URL',
    'REDIS_URL',
  ];

  const optionalVars = [
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD',
    'NODE_ENV',
  ];

  let allRequired = true;

  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      success(`${varName} is set`);
    } else {
      error(`${varName} is not set`);
      allRequired = false;
    }
  });

  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      success(`${varName} is set`);
    } else {
      warning(`${varName} is not set (optional)`);
    }
  });

  return allRequired;
}

// Main verification function
async function verify() {
  log('\n🚀 NEXUS Platform - Database Setup Verification\n', 'cyan');

  const results = {
    files: false,
    environment: false,
    postgres: false,
    mongodb: false,
    redis: false,
  };

  // Check files
  results.files = checkFiles();

  // Check environment
  results.environment = checkEnvironment();

  // Test database connections
  results.postgres = await testPostgreSQL();
  results.mongodb = await testMongoDB();
  results.redis = await testRedis();

  // Summary
  section('Verification Summary');

  const checks = [
    { name: 'Database Files', status: results.files },
    { name: 'Environment Variables', status: results.environment },
    { name: 'PostgreSQL Connection', status: results.postgres },
    { name: 'MongoDB Connection', status: results.mongodb },
    { name: 'Redis Connection', status: results.redis },
  ];

  checks.forEach(check => {
    if (check.status) {
      success(`${check.name}: PASSED`);
    } else {
      error(`${check.name}: FAILED`);
    }
  });

  const allPassed = Object.values(results).every(r => r === true);

  if (allPassed) {
    log('\n🎉 All checks passed! Your database setup is ready.', 'green');
    log('\n📝 Next steps:', 'cyan');
    log('   1. Run migrations: pnpm db:migrate', 'cyan');
    log('   2. Seed database: pnpm db:seed', 'cyan');
    log('   3. Start developing!', 'cyan');
    return 0;
  } else {
    log('\n⚠️  Some checks failed. Please fix the issues above.', 'yellow');
    log('\n📝 Troubleshooting:', 'cyan');
    log('   1. Check your .env file exists and has correct values', 'cyan');
    log('   2. Ensure all database services are running', 'cyan');
    log('   3. Verify network connectivity to databases', 'cyan');
    log('   4. Check database credentials and permissions', 'cyan');
    return 1;
  }
}

// Run verification
if (require.main === module) {
  verify()
    .then(exitCode => process.exit(exitCode))
    .catch(err => {
      error(`Verification failed: ${err.message}`);
      console.error(err);
      process.exit(1);
    });
}

module.exports = { verify };
