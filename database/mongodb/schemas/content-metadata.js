/**
 * NEXUS Platform - MongoDB Schema: Content Metadata
 * Flexible schema for storing rich content metadata
 * Database: MongoDB (for flexible, schema-less data)
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Content Metadata Schema
 * Stores detailed metadata about content that doesn't fit well in SQL
 */
const ContentMetadataSchema = new Schema(
  {
    // Reference to PostgreSQL content ID
    contentId: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },

    // Creator reference
    creatorId: {
      type: String,
      required: true,
      index: true,
    },

    // Rich metadata
    metadata: {
      // Video-specific metadata
      video: {
        codec: String,
        bitrate: Number,
        fps: Number,
        resolution: String,
        aspectRatio: String,
        hasAudio: Boolean,
        audioCodec: String,
        audioBitrate: Number,
        audioChannels: Number,
        subtitles: [
          {
            language: String,
            url: String,
            format: String,
          },
        ],
        chapters: [
          {
            title: String,
            startTime: Number,
            endTime: Number,
            thumbnail: String,
          },
        ],
      },

      // Image-specific metadata
      image: {
        format: String,
        colorSpace: String,
        hasAlpha: Boolean,
        orientation: Number,
        exif: Schema.Types.Mixed,
        iptc: Schema.Types.Mixed,
        dominantColors: [String],
        faces: [
          {
            boundingBox: {
              x: Number,
              y: Number,
              width: Number,
              height: Number,
            },
            confidence: Number,
            landmarks: Schema.Types.Mixed,
          },
        ],
        objects: [
          {
            name: String,
            confidence: Number,
            boundingBox: {
              x: Number,
              y: Number,
              width: Number,
              height: Number,
            },
          },
        ],
      },

      // AI-generated insights
      ai: {
        // Content analysis
        labels: [
          {
            name: String,
            confidence: Number,
            category: String,
          },
        ],
        sentiment: {
          score: Number,
          magnitude: Number,
          label: String, // positive, negative, neutral
        },
        moderation: {
          isApproved: Boolean,
          flags: [
            {
              type: String,
              severity: String,
              confidence: Number,
              description: String,
            },
          ],
          categories: Schema.Types.Mixed,
        },
        transcription: {
          text: String,
          language: String,
          confidence: Number,
          segments: [
            {
              text: String,
              startTime: Number,
              endTime: Number,
              speaker: String,
            },
          ],
        },
        translation: [
          {
            language: String,
            text: String,
          },
        ],
      },

      // Social media metadata
      social: {
        platforms: [
          {
            platform: String,
            postId: String,
            url: String,
            publishedAt: Date,
            metrics: {
              views: Number,
              likes: Number,
              comments: Number,
              shares: Number,
              saves: Number,
              engagement: Number,
            },
            hashtags: [String],
            mentions: [String],
          },
        ],
        viralityScore: Number,
        trendingStatus: String,
      },

      // Performance metrics
      performance: {
        viewCount: Number,
        uniqueViews: Number,
        avgWatchTime: Number,
        completionRate: Number,
        clickThroughRate: Number,
        conversionRate: Number,
        engagement: {
          likes: Number,
          comments: Number,
          shares: Number,
          saves: Number,
          downloads: Number,
        },
        reachMetrics: {
          impressions: Number,
          reach: Number,
          frequency: Number,
        },
        audienceDemographics: {
          age: Schema.Types.Mixed,
          gender: Schema.Types.Mixed,
          location: Schema.Types.Mixed,
          interests: [String],
        },
      },

      // Brand safety & compliance
      brandSafety: {
        score: Number,
        isBrandSafe: Boolean,
        risks: [
          {
            type: String,
            severity: String,
            description: String,
          },
        ],
        compliance: {
          hasDisclosure: Boolean,
          hasCopyright: Boolean,
          hasModelRelease: Boolean,
          hasLocationPermit: Boolean,
        },
      },

      // Attribution & tracking
      attribution: {
        sourceUrl: String,
        referrer: String,
        campaign: String,
        utmParams: Schema.Types.Mixed,
        trackingPixels: [String],
        affiliateLinks: [
          {
            url: String,
            provider: String,
            code: String,
          },
        ],
      },

      // Technical metadata
      technical: {
        uploadedFrom: {
          device: String,
          os: String,
          browser: String,
          ip: String,
          location: {
            country: String,
            city: String,
            coordinates: {
              lat: Number,
              lng: Number,
            },
          },
        },
        processingSteps: [
          {
            step: String,
            status: String,
            startedAt: Date,
            completedAt: Date,
            duration: Number,
            error: String,
          },
        ],
        versions: [
          {
            versionId: String,
            size: String,
            format: String,
            url: String,
            createdAt: Date,
          },
        ],
      },

      // Custom fields (flexible for future expansion)
      custom: Schema.Types.Mixed,
    },

    // Search optimization
    searchableText: {
      type: String,
      index: 'text',
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    lastAccessedAt: Date,
  },
  {
    collection: 'content_metadata',
    timestamps: true,
    strict: false, // Allow flexible schema
  }
);

// Indexes for performance
ContentMetadataSchema.index({ contentId: 1 });
ContentMetadataSchema.index({ creatorId: 1 });
ContentMetadataSchema.index({ 'metadata.social.viralityScore': -1 });
ContentMetadataSchema.index({ 'metadata.performance.viewCount': -1 });
ContentMetadataSchema.index({ 'metadata.ai.labels.name': 1 });
ContentMetadataSchema.index({ createdAt: -1 });

// Text search index
ContentMetadataSchema.index({
  searchableText: 'text',
  'metadata.ai.labels.name': 'text',
});

// Compound indexes for common queries
ContentMetadataSchema.index({ creatorId: 1, createdAt: -1 });
ContentMetadataSchema.index({
  'metadata.brandSafety.isBrandSafe': 1,
  'metadata.performance.viewCount': -1
});

// Update searchableText before save
ContentMetadataSchema.pre('save', function (next) {
  const metadata = this.metadata;
  const searchParts = [];

  // Add AI labels
  if (metadata.ai?.labels) {
    searchParts.push(...metadata.ai.labels.map(l => l.name));
  }

  // Add transcription
  if (metadata.ai?.transcription?.text) {
    searchParts.push(metadata.ai.transcription.text);
  }

  // Add hashtags
  if (metadata.social?.platforms) {
    metadata.social.platforms.forEach(p => {
      if (p.hashtags) {
        searchParts.push(...p.hashtags);
      }
    });
  }

  this.searchableText = searchParts.join(' ');
  this.updatedAt = new Date();
  next();
});

// Methods
ContentMetadataSchema.methods.updatePerformanceMetrics = function(metrics) {
  if (!this.metadata.performance) {
    this.metadata.performance = {};
  }
  Object.assign(this.metadata.performance, metrics);
  return this.save();
};

ContentMetadataSchema.methods.addAILabel = function(label) {
  if (!this.metadata.ai) {
    this.metadata.ai = {};
  }
  if (!this.metadata.ai.labels) {
    this.metadata.ai.labels = [];
  }
  this.metadata.ai.labels.push(label);
  return this.save();
};

ContentMetadataSchema.methods.markAccessed = function() {
  this.lastAccessedAt = new Date();
  return this.save();
};

// Statics
ContentMetadataSchema.statics.findByCreator = function(creatorId, options = {}) {
  return this.find({ creatorId })
    .sort({ createdAt: -1 })
    .limit(options.limit || 100)
    .exec();
};

ContentMetadataSchema.statics.findTrending = function(options = {}) {
  return this.find({
    'metadata.social.viralityScore': { $gte: options.minScore || 70 },
  })
    .sort({ 'metadata.social.viralityScore': -1 })
    .limit(options.limit || 50)
    .exec();
};

ContentMetadataSchema.statics.findBrandSafe = function(options = {}) {
  return this.find({
    'metadata.brandSafety.isBrandSafe': true,
    'metadata.brandSafety.score': { $gte: options.minScore || 80 },
  })
    .sort({ 'metadata.performance.viewCount': -1 })
    .limit(options.limit || 100)
    .exec();
};

const ContentMetadata = mongoose.model('ContentMetadata', ContentMetadataSchema);

module.exports = ContentMetadata;
