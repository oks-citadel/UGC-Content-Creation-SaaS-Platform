/**
 * NEXUS Platform - MongoDB Schema: Analytics Events
 * High-volume event tracking and analytics
 * Database: MongoDB (optimized for write-heavy workloads)
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Analytics Event Schema
 * Stores high-volume tracking events for analytics
 */
const AnalyticsEventSchema = new Schema(
  {
    // Event identification
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Event type
    eventType: {
      type: String,
      required: true,
      enum: [
        // User events
        'user.signup',
        'user.login',
        'user.logout',
        'user.profile_update',

        // Campaign events
        'campaign.created',
        'campaign.published',
        'campaign.updated',
        'campaign.completed',
        'campaign.viewed',

        // Creator events
        'creator.application_submitted',
        'creator.application_accepted',
        'creator.application_rejected',
        'creator.profile_viewed',

        // Content events
        'content.uploaded',
        'content.viewed',
        'content.downloaded',
        'content.shared',
        'content.liked',
        'content.commented',
        'content.approved',
        'content.rejected',

        // Engagement events
        'engagement.click',
        'engagement.scroll',
        'engagement.video_play',
        'engagement.video_pause',
        'engagement.video_complete',

        // Commerce events
        'commerce.product_viewed',
        'commerce.product_clicked',
        'commerce.add_to_cart',
        'commerce.purchase',
        'commerce.refund',

        // Attribution events
        'attribution.impression',
        'attribution.click',
        'attribution.conversion',

        // System events
        'system.api_call',
        'system.webhook_triggered',
        'system.error',
      ],
      index: true,
    },

    // Event category
    category: {
      type: String,
      enum: ['user', 'campaign', 'creator', 'content', 'engagement', 'commerce', 'attribution', 'system'],
      index: true,
    },

    // Entity references
    entities: {
      userId: { type: String, index: true },
      organizationId: { type: String, index: true },
      creatorId: { type: String, index: true },
      campaignId: { type: String, index: true },
      contentId: { type: String, index: true },
      productId: { type: String, index: true },
    },

    // Event properties
    properties: {
      // Generic properties
      action: String,
      label: String,
      value: Number,

      // User properties
      user: {
        role: String,
        accountAge: Number,
        subscriptionTier: String,
      },

      // Campaign properties
      campaign: {
        type: String,
        status: String,
        budget: Number,
      },

      // Content properties
      content: {
        type: String,
        duration: Number,
        fileSize: Number,
        format: String,
      },

      // Engagement properties
      engagement: {
        duration: Number,
        percentage: Number,
        source: String,
      },

      // Commerce properties
      commerce: {
        sku: String,
        price: Number,
        currency: String,
        quantity: Number,
      },

      // Custom properties
      custom: Schema.Types.Mixed,
    },

    // Session information
    session: {
      sessionId: String,
      isNewSession: Boolean,
      sessionDuration: Number,
      pageViewCount: Number,
    },

    // Device & browser information
    device: {
      type: String, // desktop, mobile, tablet
      os: String,
      osVersion: String,
      browser: String,
      browserVersion: String,
      screenResolution: String,
      language: String,
      timezone: String,
    },

    // Location information
    location: {
      ip: String,
      country: String,
      region: String,
      city: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
      timezone: String,
    },

    // Page information
    page: {
      url: String,
      path: String,
      title: String,
      referrer: String,
      searchParams: Schema.Types.Mixed,
    },

    // UTM parameters
    utm: {
      source: String,
      medium: String,
      campaign: String,
      term: String,
      content: String,
    },

    // Attribution data
    attribution: {
      model: String, // first-click, last-click, linear, etc.
      touchpoint: Number,
      channel: String,
      revenue: Number,
    },

    // Metrics
    metrics: {
      duration: Number,
      value: Number,
      revenue: Number,
      count: Number,
      custom: Schema.Types.Mixed,
    },

    // Timestamp
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Server timestamp (for clock skew)
    serverTimestamp: {
      type: Date,
      default: Date.now,
    },

    // Processing metadata
    processed: {
      type: Boolean,
      default: false,
      index: true,
    },
    processedAt: Date,

    // Data retention
    expiresAt: {
      type: Date,
      index: true,
    },
  },
  {
    collection: 'analytics_events',
    timestamps: false,
    strict: false,
  }
);

// Indexes for performance
AnalyticsEventSchema.index({ eventType: 1, timestamp: -1 });
AnalyticsEventSchema.index({ category: 1, timestamp: -1 });
AnalyticsEventSchema.index({ 'entities.userId': 1, timestamp: -1 });
AnalyticsEventSchema.index({ 'entities.organizationId': 1, timestamp: -1 });
AnalyticsEventSchema.index({ 'entities.campaignId': 1, timestamp: -1 });
AnalyticsEventSchema.index({ 'entities.contentId': 1, timestamp: -1 });
AnalyticsEventSchema.index({ 'session.sessionId': 1 });
AnalyticsEventSchema.index({ processed: 1, timestamp: 1 });

// Compound indexes for common queries
AnalyticsEventSchema.index({
  'entities.organizationId': 1,
  eventType: 1,
  timestamp: -1
});

AnalyticsEventSchema.index({
  category: 1,
  'entities.campaignId': 1,
  timestamp: -1
});

// TTL index for automatic data cleanup (90 days)
AnalyticsEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware
AnalyticsEventSchema.pre('save', function (next) {
  // Set category from eventType if not set
  if (!this.category && this.eventType) {
    this.category = this.eventType.split('.')[0];
  }

  // Set expiration date (90 days from now)
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  }

  next();
});

// Methods
AnalyticsEventSchema.methods.markProcessed = function() {
  this.processed = true;
  this.processedAt = new Date();
  return this.save();
};

// Statics
AnalyticsEventSchema.statics.trackEvent = async function(eventData) {
  const event = new this({
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...eventData,
  });
  return event.save();
};

AnalyticsEventSchema.statics.getEventsByUser = function(userId, options = {}) {
  const query = { 'entities.userId': userId };

  if (options.eventType) {
    query.eventType = options.eventType;
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

AnalyticsEventSchema.statics.getEventsByCampaign = function(campaignId, options = {}) {
  const query = { 'entities.campaignId': campaignId };

  if (options.eventType) {
    query.eventType = options.eventType;
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

AnalyticsEventSchema.statics.aggregateMetrics = function(query, groupBy, metrics) {
  const pipeline = [
    { $match: query },
    {
      $group: {
        _id: groupBy,
        count: { $sum: 1 },
        ...metrics,
      },
    },
    { $sort: { count: -1 } },
  ];

  return this.aggregate(pipeline).exec();
};

AnalyticsEventSchema.statics.getUnprocessedEvents = function(limit = 1000) {
  return this.find({ processed: false })
    .sort({ timestamp: 1 })
    .limit(limit)
    .exec();
};

AnalyticsEventSchema.statics.getTopEvents = function(eventType, days = 7, limit = 10) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return this.aggregate([
    {
      $match: {
        eventType,
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$entities.contentId',
        count: { $sum: 1 },
        totalValue: { $sum: '$metrics.value' },
      },
    },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]).exec();
};

AnalyticsEventSchema.statics.getUserJourney = function(userId, sessionId) {
  return this.find({
    'entities.userId': userId,
    'session.sessionId': sessionId,
  })
    .sort({ timestamp: 1 })
    .exec();
};

AnalyticsEventSchema.statics.getFunnelAnalysis = function(campaignId, steps) {
  const pipeline = steps.map((step, index) => ({
    [`step${index + 1}`]: {
      $sum: {
        $cond: [{ $eq: ['$eventType', step] }, 1, 0],
      },
    },
  }));

  return this.aggregate([
    {
      $match: {
        'entities.campaignId': campaignId,
        eventType: { $in: steps },
      },
    },
    {
      $group: {
        _id: null,
        ...Object.assign({}, ...pipeline),
      },
    },
  ]).exec();
};

const AnalyticsEvent = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);

module.exports = AnalyticsEvent;
