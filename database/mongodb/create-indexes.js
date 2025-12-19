/**
 * NEXUS Platform - MongoDB Index Creation Script
 * Creates all required indexes for MongoDB collections
 */

const mongoose = require('mongoose');

// Import schemas
const ContentMetadata = require('./schemas/content-metadata');
const AnalyticsEvent = require('./schemas/analytics-events');
const AuditLog = require('./schemas/audit-logs');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/nexus';

async function createIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL);
    console.log('✅ Connected to MongoDB\n');

    // Content Metadata Indexes
    console.log('📊 Creating indexes for content_metadata...');
    await ContentMetadata.createIndexes();
    console.log('✅ content_metadata indexes created');

    // Analytics Events Indexes
    console.log('📊 Creating indexes for analytics_events...');
    await AnalyticsEvent.createIndexes();
    console.log('✅ analytics_events indexes created');

    // Audit Logs Indexes
    console.log('📊 Creating indexes for audit_logs...');
    await AuditLog.createIndexes();
    console.log('✅ audit_logs indexes created');

    console.log('\n✨ All MongoDB indexes created successfully!');

    // List all indexes
    console.log('\n📋 Index Summary:');

    const contentIndexes = await ContentMetadata.collection.getIndexes();
    console.log(`\nContent Metadata (${Object.keys(contentIndexes).length} indexes):`);
    Object.keys(contentIndexes).forEach(idx => {
      console.log(`  - ${idx}`);
    });

    const analyticsIndexes = await AnalyticsEvent.collection.getIndexes();
    console.log(`\nAnalytics Events (${Object.keys(analyticsIndexes).length} indexes):`);
    Object.keys(analyticsIndexes).forEach(idx => {
      console.log(`  - ${idx}`);
    });

    const auditIndexes = await AuditLog.collection.getIndexes();
    console.log(`\nAudit Logs (${Object.keys(auditIndexes).length} indexes):`);
    Object.keys(auditIndexes).forEach(idx => {
      console.log(`  - ${idx}`);
    });

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run if executed directly
if (require.main === module) {
  createIndexes()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { createIndexes };
