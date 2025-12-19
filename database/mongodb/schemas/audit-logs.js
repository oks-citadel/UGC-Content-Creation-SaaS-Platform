/**
 * NEXUS Platform - MongoDB Schema: Audit Logs
 * Comprehensive audit trail for compliance and security
 * Database: MongoDB (for high-volume, immutable logs)
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Audit Log Schema
 * Immutable logs for all system actions
 */
const AuditLogSchema = new Schema(
  {
    // Log identification
    logId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Actor information
    actor: {
      userId: { type: String, index: true },
      userEmail: String,
      userName: String,
      userRole: String,
      impersonatedBy: String, // For admin impersonation
    },

    // Organization context
    organizationId: {
      type: String,
      index: true,
    },
    organizationName: String,

    // Action details
    action: {
      type: String,
      required: true,
      enum: [
        // User actions
        'user.create',
        'user.update',
        'user.delete',
        'user.login',
        'user.logout',
        'user.password_change',
        'user.mfa_enable',
        'user.mfa_disable',

        // Organization actions
        'organization.create',
        'organization.update',
        'organization.delete',
        'organization.member_add',
        'organization.member_remove',
        'organization.member_role_change',

        // Campaign actions
        'campaign.create',
        'campaign.update',
        'campaign.delete',
        'campaign.publish',
        'campaign.pause',
        'campaign.complete',

        // Content actions
        'content.upload',
        'content.update',
        'content.delete',
        'content.approve',
        'content.reject',
        'content.download',

        // Financial actions
        'payment.create',
        'payment.process',
        'payment.refund',
        'payout.create',
        'payout.approve',
        'payout.reject',
        'invoice.create',
        'invoice.pay',

        // Security actions
        'security.api_key_create',
        'security.api_key_delete',
        'security.permission_grant',
        'security.permission_revoke',
        'security.login_failed',
        'security.account_locked',

        // Integration actions
        'integration.connect',
        'integration.disconnect',
        'integration.sync',

        // Data actions
        'data.export',
        'data.import',
        'data.delete',

        // System actions
        'system.config_change',
        'system.backup_create',
        'system.restore',
      ],
      index: true,
    },

    // Action category
    category: {
      type: String,
      enum: ['user', 'organization', 'campaign', 'content', 'financial', 'security', 'integration', 'data', 'system'],
      index: true,
    },

    // Resource information
    resource: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
      index: true,
    },
    resourceName: String,

    // Change details
    changes: {
      before: Schema.Types.Mixed,
      after: Schema.Types.Mixed,
      diff: Schema.Types.Mixed,
    },

    // Request information
    request: {
      method: String,
      path: String,
      params: Schema.Types.Mixed,
      query: Schema.Types.Mixed,
      body: Schema.Types.Mixed, // Sanitized
      headers: Schema.Types.Mixed, // Selected headers
    },

    // Response information
    response: {
      statusCode: Number,
      success: Boolean,
      error: String,
      duration: Number, // milliseconds
    },

    // Context information
    context: {
      ipAddress: String,
      userAgent: String,
      location: {
        country: String,
        region: String,
        city: String,
        coordinates: {
          lat: Number,
          lng: Number,
        },
      },
      device: {
        type: String,
        os: String,
        browser: String,
      },
    },

    // Security metadata
    security: {
      riskScore: Number,
      isSuspicious: Boolean,
      flags: [String],
      requiresReview: Boolean,
      reviewedBy: String,
      reviewedAt: Date,
      reviewNotes: String,
    },

    // Compliance metadata
    compliance: {
      regulationCompliance: [String], // GDPR, CCPA, etc.
      dataClassification: String, // public, internal, confidential, restricted
      retentionPolicy: String,
      legalHold: Boolean,
    },

    // Session information
    sessionId: String,
    requestId: String,

    // Timestamp
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },

    // Server information
    server: {
      hostname: String,
      environment: String, // production, staging, development
      version: String,
    },

    // Metadata
    metadata: Schema.Types.Mixed,

    // Data retention
    expiresAt: {
      type: Date,
      index: true,
    },
  },
  {
    collection: 'audit_logs',
    timestamps: false,
    strict: false,
  }
);

// Indexes for performance
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ category: 1, timestamp: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 });
AuditLogSchema.index({ 'actor.userId': 1, timestamp: -1 });
AuditLogSchema.index({ organizationId: 1, timestamp: -1 });
AuditLogSchema.index({ sessionId: 1 });
AuditLogSchema.index({ requestId: 1 });

// Compound indexes for common queries
AuditLogSchema.index({
  organizationId: 1,
  category: 1,
  timestamp: -1
});

AuditLogSchema.index({
  'actor.userId': 1,
  action: 1,
  timestamp: -1
});

AuditLogSchema.index({
  resource: 1,
  resourceId: 1,
  action: 1,
  timestamp: -1
});

// Security-related indexes
AuditLogSchema.index({ 'security.isSuspicious': 1, timestamp: -1 });
AuditLogSchema.index({ 'security.requiresReview': 1, timestamp: -1 });

// TTL index for automatic data cleanup based on retention policy
AuditLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Make logs immutable
AuditLogSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error('Audit logs are immutable and cannot be updated'));
  }

  // Set category from action if not set
  if (!this.category && this.action) {
    this.category = this.action.split('.')[0];
  }

  // Set default retention (7 years for compliance)
  if (!this.expiresAt) {
    const retentionDays = this.compliance?.legalHold ? 3650 : 2555; // 10 years if legal hold, else 7 years
    this.expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);
  }

  next();
});

// Prevent updates and deletes
AuditLogSchema.pre('findOneAndUpdate', function (next) {
  next(new Error('Audit logs are immutable and cannot be updated'));
});

AuditLogSchema.pre('findOneAndDelete', function (next) {
  next(new Error('Audit logs are immutable and cannot be deleted'));
});

AuditLogSchema.pre('remove', function (next) {
  next(new Error('Audit logs are immutable and cannot be deleted'));
});

// Methods
AuditLogSchema.methods.flagAsSuspicious = function(flags, riskScore) {
  // This is read-only, create a new log instead
  throw new Error('Cannot modify audit log. Create a new log entry instead.');
};

// Statics
AuditLogSchema.statics.createLog = async function(logData) {
  const log = new this({
    logId: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    ...logData,
  });
  return log.save();
};

AuditLogSchema.statics.getUserActivity = function(userId, options = {}) {
  const query = { 'actor.userId': userId };

  if (options.action) {
    query.action = options.action;
  }

  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate) query.timestamp.$gte = options.startDate;
    if (options.endDate) query.timestamp.$lte = options.endDate;
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 100)
    .exec();
};

AuditLogSchema.statics.getResourceHistory = function(resource, resourceId, options = {}) {
  const query = { resource, resourceId };

  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate) query.timestamp.$gte = options.startDate;
    if (options.endDate) query.timestamp.$lte = options.endDate;
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 100)
    .exec();
};

AuditLogSchema.statics.getOrganizationActivity = function(organizationId, options = {}) {
  const query = { organizationId };

  if (options.category) {
    query.category = options.category;
  }

  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate) query.timestamp.$gte = options.startDate;
    if (options.endDate) query.timestamp.$lte = options.endDate;
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 1000)
    .exec();
};

AuditLogSchema.statics.getSuspiciousActivity = function(options = {}) {
  const query = { 'security.isSuspicious': true };

  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate) query.timestamp.$gte = options.startDate;
    if (options.endDate) query.timestamp.$lte = options.endDate;
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 100)
    .exec();
};

AuditLogSchema.statics.getFailedLogins = function(options = {}) {
  const query = { action: 'security.login_failed' };

  if (options.userId) {
    query['actor.userId'] = options.userId;
  }

  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate) query.timestamp.$gte = options.startDate;
    if (options.endDate) query.timestamp.$lte = options.endDate;
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 100)
    .exec();
};

AuditLogSchema.statics.getActionsByCategory = function(category, days = 7) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return this.aggregate([
    {
      $match: {
        category,
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]).exec();
};

AuditLogSchema.statics.getComplianceReport = function(startDate, endDate, regulations = []) {
  const query = { timestamp: { $gte: startDate, $lte: endDate } };

  if (regulations.length > 0) {
    query['compliance.regulationCompliance'] = { $in: regulations };
  }

  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          category: '$category',
          action: '$action',
        },
        count: { $sum: 1 },
        users: { $addToSet: '$actor.userId' },
      },
    },
    {
      $project: {
        category: '$_id.category',
        action: '$_id.action',
        count: 1,
        uniqueUsers: { $size: '$users' },
      },
    },
    { $sort: { count: -1 } },
  ]).exec();
};

AuditLogSchema.statics.getSessionActivity = function(sessionId) {
  return this.find({ sessionId })
    .sort({ timestamp: 1 })
    .exec();
};

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

module.exports = AuditLog;
