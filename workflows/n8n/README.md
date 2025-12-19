# NEXUS n8n Workflow Templates

This directory contains production-ready n8n workflow templates for the NEXUS UGC Content Creation Platform.

## Overview

These workflows automate critical business processes across lead management, content production, distribution, e-commerce, billing, analytics, and compliance.

## Directory Structure

```
workflows/n8n/
├── lead-capture/          # Lead intake, nurturing, and revival workflows
├── content-automation/    # AI content generation and UGC management
├── distribution/          # Multi-platform publishing and syndication
├── ecommerce/            # Cart abandonment, conversions, upsells
├── billing/              # Payment recovery and subscription lifecycle
├── analytics/            # Performance tracking and attribution
├── compliance/           # GDPR and FTC compliance automation
└── README.md            # This file
```

## Prerequisites

### Required Software
- **n8n** (v1.0.0 or higher)
  ```bash
  npm install -g n8n
  ```

### Required Accounts & API Keys

1. **n8n Cloud or Self-hosted Instance**
   - Sign up: https://n8n.io/

2. **OpenAI API** (for AI content generation)
   - Get API key: https://platform.openai.com/api-keys

3. **Social Media Platform APIs**
   - Instagram Graph API
   - Facebook Graph API
   - Twitter API v2
   - LinkedIn API
   - TikTok API

4. **Communication Services**
   - SMTP (email sending)
   - Twilio (SMS)
   - WhatsApp Business API

5. **Payment Processing**
   - Stripe API

6. **Data Enrichment** (optional)
   - Clearbit API

7. **Analytics & CRM**
   - Your NEXUS API endpoints

## Installation

### 1. Import Workflows to n8n

**Option A: Via n8n UI**
1. Open n8n web interface
2. Click "Workflows" → "Import from File"
3. Select the desired `.json` workflow file
4. Click "Import"

**Option B: Via CLI**
```bash
# If using n8n self-hosted
n8n import:workflow --input=./lead-capture/smart-lead-intake.json
```

### 2. Configure Environment Variables

Create a `.env` file in your n8n instance:

```bash
# NEXUS API
API_URL=https://api.nexus.example.com
NEXUS_API_KEY=your_nexus_api_key

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Social Media
IG_ACCOUNT_ID=your_instagram_account_id
IG_ACCESS_TOKEN=your_instagram_access_token
FB_PAGE_ID=your_facebook_page_id
FB_ACCESS_TOKEN=your_facebook_access_token
FB_AD_ACCOUNT_ID=act_your_ad_account_id
TWITTER_USER_ID=your_twitter_user_id
TWITTER_API_KEY=your_twitter_api_key
LINKEDIN_PERSON_ID=your_linkedin_person_id
LINKEDIN_ORG_ID=your_linkedin_org_id
TIKTOK_ACCESS_TOKEN=your_tiktok_token
WHATSAPP_PHONE_ID=your_whatsapp_phone_id

# Email & SMS
SMTP_FROM_EMAIL=noreply@nexus.example.com
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
TWILIO_API_URL=https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token

# Stripe
STRIPE_API_URL=https://api.stripe.com/v1
STRIPE_API_KEY=sk_live_your_stripe_key

# CRM
CRM_API_URL=https://crm.nexus.example.com/api
CRM_URL=https://crm.nexus.example.com

# Clearbit (optional)
CLEARBIT_API_KEY=your_clearbit_key

# Slack Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Google Sheets (for lead logging)
LEADS_SHEET_ID=your_google_sheet_id

# Google Ads
GOOGLE_ADS_CUSTOMER_ID=your_google_ads_customer_id

# Application URLs
APP_URL=https://app.nexus.example.com
SHOP_URL=https://shop.nexus.example.com
BRAND_NAME=NEXUS
TARGET_NICHE=marketing,ugc,content

# Compliance
DPO_EMAIL=dpo@nexus.example.com
COMPLIANCE_EMAIL=compliance@nexus.example.com
```

### 3. Configure Credentials in n8n

For each workflow, you'll need to set up credentials:

1. **HTTP Header Auth** (for APIs)
   - Name: NEXUS API, OpenAI API, Stripe API, etc.
   - Header Name: `Authorization`
   - Header Value: `Bearer YOUR_API_KEY`

2. **OAuth2** (for social platforms)
   - Follow n8n's OAuth2 setup wizard for each platform

3. **SMTP Account**
   - Host, Port, Username, Password from your email provider

4. **Google Sheets OAuth2**
   - Connect your Google account

### 4. Test Each Workflow

Before activating:
1. Open workflow in n8n
2. Click "Execute Workflow" to test
3. Check for errors in node execution
4. Verify API connections
5. Activate workflow once confirmed working

## Workflow Catalog

### Lead Capture (3 workflows)

#### 1. Smart Lead Intake
- **Trigger**: Webhook (form submissions, API calls)
- **Purpose**: Captures, enriches, scores, and routes leads
- **Key Features**:
  - Clearbit data enrichment
  - Automated lead scoring (0-100)
  - Grade-based routing (A/B/C/D)
  - Slack notifications for hot leads
- **Webhook Path**: `/lead-intake`

#### 2. Lead Nurture Journey
- **Trigger**: Schedule (every 6 hours)
- **Purpose**: Multi-step email nurture campaign with branching
- **Key Features**:
  - 5 touchpoint sequence
  - Personalized content per touchpoint
  - Automated graduation to sales or cold pool
- **Touchpoints**:
  1. Welcome email
  2. Value proposition
  3. Case study
  4. Demo invitation
  5. Final offer

#### 3. Cold Lead Revival
- **Trigger**: Daily at 9 AM
- **Purpose**: Re-engages inactive leads with escalating outreach
- **Key Features**:
  - Email → SMS → WhatsApp escalation
  - Special offers for re-engagement
  - Automatic archival after 3 attempts
  - Response tracking

### Content Automation (3 workflows)

#### 4. AI Content Production
- **Trigger**: Webhook (content requests)
- **Purpose**: Generates multi-platform content variants using AI
- **Key Features**:
  - GPT-4 content generation
  - DALL-E 3 image generation
  - Brand voice matching
  - Sentiment & compliance analysis
- **Webhook Path**: `/content-production`

#### 5. UGC Review & Publish
- **Trigger**: Webhook (new UGC submissions)
- **Purpose**: Moderates, requests rights, and publishes UGC
- **Key Features**:
  - AI content moderation
  - Automated rights requests
  - Multi-platform publishing
  - Compliance tracking
- **Webhook Path**: `/ugc-submitted`

#### 6. Influencer Outreach
- **Trigger**: Weekly schedule
- **Purpose**: Discovers and contacts potential influencers
- **Key Features**:
  - AI-powered influencer discovery
  - Personalized outreach emails
  - Follow-up automation
  - Response tracking

### Distribution (3 workflows)

#### 7. Omnichannel Publishing
- **Trigger**: Webhook (publish requests)
- **Purpose**: Publishes content to all social platforms simultaneously
- **Platforms**: Instagram, Facebook, Twitter, LinkedIn, TikTok
- **Key Features**:
  - Platform-specific formatting
  - Aggregated results reporting
  - Analytics logging
- **Webhook Path**: `/publish-omnichannel`

#### 8. Blog Syndication
- **Trigger**: Webhook (new blog posts)
- **Purpose**: Creates social snippets and distributes blog content
- **Key Features**:
  - AI-generated social snippets
  - Multi-platform sharing
  - Newsletter queuing
- **Webhook Path**: `/blog-published`

#### 9. Retargeting Audience Sync
- **Trigger**: Every 6 hours
- **Purpose**: Syncs audience segments to ad platforms
- **Platforms**: Facebook Ads, Google Ads
- **Key Features**:
  - Custom audience creation
  - Automatic updates
  - Sync logging

### E-commerce (3 workflows)

#### 10. Cart Abandonment Recovery
- **Trigger**: Webhook (cart abandoned events)
- **Purpose**: Multi-channel cart recovery sequence
- **Channels**: Email (1h) → SMS (7h) → WhatsApp (25h)
- **Key Features**:
  - Progressive discount offers
  - Multi-channel escalation
  - Conversion tracking
- **Webhook Path**: `/cart-abandoned`

#### 11. Shoppable UGC Conversion
- **Trigger**: Webhook (UGC gallery interactions)
- **Purpose**: Converts UGC engagement into sales
- **Key Features**:
  - Product interest tracking
  - Personalized offers
  - CRM enrichment
  - Attribution tracking
- **Webhook Path**: `/ugc-interaction`

#### 12. Post-Purchase Upsell
- **Trigger**: Webhook (purchase complete)
- **Purpose**: AI-powered product recommendations post-purchase
- **Key Features**:
  - Collaborative filtering
  - Timed follow-up (2 days)
  - Exclusive discount codes
- **Webhook Path**: `/purchase-complete`

### Billing (3 workflows)

#### 13. Failed Payment Recovery
- **Trigger**: Webhook (payment failures)
- **Purpose**: Automatic payment retry and customer notification
- **Sequence**:
  1. Wait 1h → Retry
  2. Email notification
  3. Wait 24h → Retry
  4. Suspend with grace period
- **Webhook Path**: `/payment-failed`

#### 14. Subscription Lifecycle
- **Trigger**: Daily at 8 AM
- **Purpose**: Manages renewal reminders and win-back campaigns
- **Key Features**:
  - 7-day renewal reminders
  - Cancellation win-back offers
  - Automated communications

#### 15. Usage-Based Billing
- **Trigger**: Monthly on 1st
- **Purpose**: Calculates and invoices overage charges
- **Key Features**:
  - Usage tracking
  - Overage calculation
  - Stripe invoice creation
  - Detailed billing emails

### Analytics (3 workflows)

#### 16. Performance Aggregation
- **Trigger**: Every 4 hours
- **Purpose**: Collects and aggregates metrics from all platforms
- **Key Features**:
  - Multi-platform data collection
  - Metric aggregation
  - Slack reporting
  - Time-series storage

#### 17. Content Performance Scoring
- **Trigger**: Every 12 hours
- **Purpose**: Scores content and takes automated actions
- **Actions**:
  - Promote (score ≥80): Auto-boost
  - Monitor (50-79): Track
  - Suppress (<20): Hide
- **Key Features**:
  - Engagement rate calculation
  - Automated optimization

#### 18. Marketing Attribution
- **Trigger**: Webhook (conversion events)
- **Purpose**: Calculates multi-touch attribution
- **Model**: U-shaped (40% first / 20% middle / 40% last)
- **Key Features**:
  - Touchpoint tracking
  - Revenue attribution
  - Channel ROI analysis
- **Webhook Path**: `/conversion-event`

### Compliance (3 workflows)

#### 19. GDPR Data Export
- **Trigger**: Webhook (export requests)
- **Purpose**: Generates and delivers GDPR data exports
- **Compliance**: Article 15 (Right of Access)
- **Key Features**:
  - Complete data aggregation
  - Secure storage with expiring links
  - Audit trail logging
- **Webhook Path**: `/gdpr-export-request`

#### 20. GDPR Data Deletion
- **Trigger**: Webhook (deletion requests)
- **Purpose**: Permanently deletes user data across all systems
- **Compliance**: Article 17 (Right to Erasure)
- **Key Features**:
  - Multi-system deletion
  - Confirmation emails
  - Compliance logging
- **Webhook Path**: `/gdpr-delete-request`

#### 21. FTC Disclosure Check
- **Trigger**: Webhook (content submissions)
- **Purpose**: Validates FTC compliance for sponsored content
- **Compliance**: 16 CFR Part 255
- **Key Features**:
  - AI-powered analysis
  - Disclosure validation
  - Creator notifications
  - Auto-flagging
- **Webhook Path**: `/content-compliance-check`

## Error Handling

All workflows include error handling nodes that:
1. Catch workflow errors
2. Log error details
3. Send notifications to ops team (Slack)
4. Return appropriate error responses

## Monitoring & Logs

### View Execution Logs
1. Open workflow in n8n
2. Click "Executions" tab
3. Review execution history, errors, and data flow

### Enable Debug Mode
Add to workflow settings:
```json
{
  "settings": {
    "saveExecutionProgress": true,
    "saveDataSuccessExecution": "all"
  }
}
```

## Scaling & Performance

### Rate Limiting
Some workflows include built-in rate limiting to comply with API limits:
- Social media APIs: 200 req/hour
- Email sending: 100 emails/min
- SMS: 10 messages/sec

### Optimization Tips
1. **Batch Processing**: Use SplitInBatches node for large datasets
2. **Caching**: Enable workflow caching for frequently accessed data
3. **Parallel Execution**: Run independent API calls in parallel
4. **Queue Mode**: Use n8n queue mode for high-volume workflows

## Security Best Practices

1. **Never commit credentials** - Use n8n's credential system
2. **Use environment variables** for all secrets
3. **Enable webhook authentication** for public endpoints
4. **Implement rate limiting** on webhooks
5. **Rotate API keys** regularly
6. **Monitor for suspicious activity**
7. **Use HTTPS only** for webhook endpoints

## Troubleshooting

### Common Issues

**Workflow not triggering**
- Check webhook URL is correct
- Verify workflow is activated
- Check firewall/network settings

**API authentication errors**
- Verify API keys are current
- Check credential configuration in n8n
- Ensure OAuth tokens are not expired

**Rate limit errors**
- Implement exponential backoff
- Reduce execution frequency
- Use batch processing

**Data not flowing between nodes**
- Check node connections
- Verify data structure matches expectations
- Use Function nodes to debug data

### Debug Commands

```bash
# View n8n logs (self-hosted)
docker logs n8n

# Test webhook locally
curl -X POST http://localhost:5678/webhook/lead-intake \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "firstName": "Test"}'

# Export workflow
n8n export:workflow --id=1 --output=./backup.json
```

## Support & Resources

- **n8n Documentation**: https://docs.n8n.io/
- **Community Forum**: https://community.n8n.io/
- **Workflow Templates**: https://n8n.io/workflows/
- **API Documentation**: See respective service docs
- **NEXUS Support**: support@nexus.example.com

## License

These workflow templates are proprietary to the NEXUS platform. Unauthorized distribution or modification is prohibited.

## Changelog

### v1.0.0 (2025-01-15)
- Initial release
- 21 production workflows across 7 categories
- Full GDPR and FTC compliance
- Multi-platform integration

---

**Questions?** Contact the NEXUS DevOps team at devops@nexus.example.com
