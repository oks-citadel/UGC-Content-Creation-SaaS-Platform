# NEXUS

### World-Class UGC & Marketing SaaS Platform

[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

---

## 🚀 Overview

**NEXUS** is a unified AI-powered platform that transforms how brands create, manage, and monetize user-generated content. By combining intelligent content creation, a sophisticated creator marketplace, shoppable commerce experiences, and enterprise-grade analytics into a single ecosystem, NEXUS eliminates the fragmentation that costs modern marketing teams time, money, and competitive advantage.

### Why NEXUS?

| Problem | NEXUS Solution |
|---------|----------------|
| **8-15 separate tools** for content, creators, scheduling, analytics | **One unified platform** with all capabilities integrated |
| **Manual creator discovery** taking weeks | **AI-powered matching** in seconds |
| **70% of UGC underperforms** benchmarks | **Predictive AI** optimizes before publishing |
| **No attribution** from content to sales | **True commerce attribution** with direct checkout |
| **Compliance risks** from manual rights management | **Blockchain-based rights ledger** with automated contracts |

---

## 🎯 Production Status

| Component | Status | Details |
|-----------|--------|---------|
| **Backend Services** | ✅ Ready | 17 microservices, 28/28 tests passing |
| **AI Services** | ✅ Ready | 11 Python/FastAPI services |
| **Frontend Apps** | ⚠️ 90% | Windows symlink issue on local build |
| **Infrastructure** | ✅ Ready | 21 Azure resources deployed |
| **Container Images** | ⚠️ 46% | 13/28 images built to ACR |
| **Kubernetes** | ✅ Ready | 44 manifests with health probes |
| **CI/CD** | ✅ Ready | 6 GitHub Actions workflows |
| **Documentation** | ✅ Ready | 50+ documentation files |

**GitHub Repository**: [oks-citadel/UGC-Content-Creation-SaaS-Platform](https://github.com/oks-citadel/UGC-Content-Creation-SaaS-Platform)

---

## ✨ Core Features

### 🤖 AI Creation & Automation Suite
- **AI Video Generator** — Create UGC-style videos from product images and scripts
- **AI Script Generator** — Platform-optimized scripts for TikTok, Reels, YouTube Shorts
- **AI Voiceovers** — 50+ voice profiles, 20+ languages, emotion control
- **AI Auto-Captioning** — 98%+ accuracy with 40+ language translations
- **Performance Prediction** — Pre-publish scoring with optimization recommendations
- **Hook Generator** — 10+ variations per concept with A/B testing

### 🎨 Creator Marketplace
- **Smart Matching** — AI-powered brand-creator pairing based on audience, style, and values
- **Reputation System** — Trust scoring from delivery, quality, and satisfaction metrics
- **Automated Payments** — Milestone-based payouts with multi-currency support
- **Ambassador Programs** — Long-term relationship management with tiered benefits

### 📊 Campaign Management
- **Brief Builder** — Guided creation with templates and AI suggestions
- **Workflow Automation** — Customizable approvals, deadline tracking, escalation rules
- **Content Calendar** — Visual planning with drag-and-drop scheduling
- **Compliance Automation** — FTC disclosure checking and contract validation

### 🛒 Shoppable Commerce
- **Shoppable Galleries** — Embeddable UGC with product hotspots
- **Video Product Tagging** — Frame-level tagging with auto-detection
- **Direct Checkout** — Native purchase without redirects
- **Revenue Attribution** — First-touch, last-touch, and multi-touch models

### 📈 Analytics & Insights
- **Unified Dashboard** — Single view across platforms, campaigns, creators, commerce
- **Real-Time Monitoring** — Live performance with anomaly detection
- **Creative Analytics** — Per-asset breakdown with fatigue detection
- **Custom Reporting** — Report builder with white-labeling and scheduling

---

## ⚡ Workflow Automation Engine

NEXUS provides 200+ pre-built automation workflows designed for seamless integration with n8n.io, Make, Zapier, HubSpot, Salesforce, and any automation hub. These workflows transform manual marketing operations into intelligent, self-optimizing systems.

---

### 1. Lead Capture & Qualification Workflows

#### Smart Lead Intake
- Trigger on new signup, form entry, chat inquiry, or UGC submission
- Auto-enrich email + social profile
- Score based on engagement, intent, referral source
- Route to the right campaign or persona segment

#### Lead Nurture Journey
- Multi-step drip emails
- AI-personalized content blocks
- Behavioral branching (click, open, ignore)
- Auto-assign to sales or support based on score thresholds

#### Cold Lead Revival
- Trigger after inactivity for X days
- Sequence of helpful reminders, guides, or offers
- Escalate to SMS or WhatsApp if email is ignored

---

### 2. Content & UGC Automation Workflows

#### AI Content Production Pipeline
- User submits topic → AI generates multiple variants → auto-schedule to channels
- Canva/Figma template auto-fill
- n8n pushes final assets to social media, CMS, YouTube, etc.

#### UGC Review & Publishing
- New UGC detected → moderation → rights request → approval → publish to galleries
- Auto-tag products, sentiment, and keywords
- Auto-notify creators or influencers

#### Influencer Outreach Workflow
- Identify influencers → auto-generate message → log response → contract workflow
- n8n triggers Stripe/Paystack payout on completion

---

### 3. Multi-Channel Distribution Workflows

#### Email + Social + SMS Sync
- Publish content once → distribute across all channels
- Sync comments or replies back to your platform
- Auto-create unified analytics report

#### New Blog Post Trigger
- Auto-create social snippets
- Auto-create Pinterest pins
- Auto-distribute to Medium, LinkedIn, Reddit, YouTube community, TikTok captions

#### Omnichannel Retargeting
- Trigger retargeting ads when a user views a product, abandons cart, or engages with UGC
- Sync custom audiences to Meta, Google Ads, TikTok Ads

---

### 4. E-Commerce & Conversion Workflows

#### Cart Abandonment
- Detect abandonment event
- Trigger drip reminders (email → SMS → WhatsApp)
- Auto-generate incentive at final step

#### Shoppable UGC Conversion Workflow
- User interacts with a gallery → track → push event to CRM
- Trigger instant personalized offer or product video

#### Post-Purchase Upsell / Cross-sell
- Trigger product-specific follow-up
- Dynamic recommendation engine
- Auto-create next order discount

---

### 5. CRM, Segmentation & Personalization Workflows

#### Dynamic Segmentation Engine
Real-time updates based on:
- Geography
- Browsing history
- Purchase stage
- Engagement level
- Creator interactions

#### Customer Lifecycle Triggers
- New → Active → Engaged → VIP → Dormant
- Automation changes campaign types and channel preferences

#### Predictive Churn Workflow
- AI identifies high-risk users
- Auto-trigger save campaigns
- Push reminders, offers, or onboarding assistance

---

### 6. Community, Referral & Engagement Workflows

#### Referral Program Automation
- User shares referral link → n8n tracks → reward triggers
- Auto-credit coins, points, or discounts

#### Gamified Engagement Loop
- Points for likes, shares, UGC posts
- Level-up messages
- Seasonal campaigns auto-trigger

#### Community Moderation
- Auto-flag toxicity
- Send warnings or soft bans
- Auto-escalate to a human reviewer

---

### 7. Sales & Customer Success Workflows

#### Sales CRM Sync
- Auto-create deals
- Sync lead stages
- Trigger sales alerts

#### Meeting Booking Workflow
- Trigger when lead reaches certain score
- Auto-send calendar options
- Auto-log meeting summary into CRM

#### Customer Health Score
- Combine product usage + support tickets + payments
- Auto-notify account manager for risks

---

### 8. Analytics & Reporting Workflows

#### Cross-Platform Performance Dashboard
Aggregate data from:
- TikTok
- Meta
- Google Ads
- Shopify / WooCommerce
- UGC performance
- Auto-generate weekly digest

#### Content Scoring Workflow
- Compare click rates, shares, retention
- Auto-promote winners
- Suppress underperforming campaigns

#### Attribution Workflow
- Multi-touch attribution model
- Auto-adjust ad spend recommendations

---

### 9. Payment, Subscription & Billing Workflows

#### Failed Payment Recovery
- Trigger retries automatically
- Send reminders
- Switch to alternate payment method (Stripe → Paystack → Flutterwave)

#### Subscription Lifecycle
- New activation → renewal → churn
- Auto-trigger onboarding sequence
- Auto-generate invoice or receipt

#### Usage-Based Billing Workflow
- Track API calls, views, downloads
- Auto-calculate overage fees

---

### 10. AI-Enhanced Personalization Workflows

#### Real-Time Recommendation Engine
- AI suggests content, products, or UGC
- n8n pushes suggestions to web, email, SMS

#### Persona-Based Content Branching
Different journeys for:
- Creators
- Shoppers
- Influencers
- Business owners

#### Predictive Follow-Up Workflow
- AI predicts the best next message
- Automatically schedules across channels

---

### 11. Support & Retention Workflows

#### AI Support Triage
- User question → classify → reply or escalate
- Create ticket in Zendesk, Freshdesk, or HubSpot

#### Negative Feedback Rescue
- Trigger on bad sentiment
- Auto-send apology + recovery offer
- Notify support team

#### High-Value Customer Protection
- VIP customers get immediate human escalation
- Auto-tag for white-glove service

---

### 12. Ready-to-Use Automation Templates

Pre-packaged workflow templates for n8n, Make, and Zapier:

| Trigger | Workflow |
|---------|----------|
| New user signup | → CRM → Email welcome → SMS |
| New UGC approved | → Auto-post to Instagram, TikTok |
| Influencer delivered content | → Payment trigger |
| Customer viewed product | → WhatsApp follow-up |
| Failed payment | → Stripe retry + email + webhook |
| Cart item added | → AI recommends bundle |
| Review posted | → Sentiment → Publish or route to support |
| Blog post | → Auto-create 20 social snippets |
| New dataset | → AI insight → Dashboard update |
| Subscription renewal | → Invoice email → Loyalty points |
| Onboarding task incomplete | → Reminder workflow |

---

### 13. International & Multi-Region Marketing Workflows

#### Localized Campaign Automation
- Auto-translate campaigns (with human-in-the-loop review)
- Localized pricing, currency, and cultural adaptation
- Trigger country-specific offers or compliance checks

#### Geo-Fencing Campaign Triggers
- Campaign fires when user enters or exits a region
- Location-based product recommendations
- Event-based marketing for holidays in each country

#### Global Privacy & Consent Flow
- Auto-apply GDPR, CCPA, NDPR rules per user
- Consent tracking and automatic restriction triggers
- Data deletion or export automation

---

### 14. Advanced AI-Orchestrated Marketing Patterns

#### AI Multi-Agent Funnel Builder
- User describes goal → AI creates full email funnel, ads, landing page copy
- Auto-push drafts to CMS or ESP
- AI continuously improves funnel based on performance

#### Predictive Buyer Intent Workflow
- Behavior + UGC interactions → AI predicts buying window
- Auto-trigger targeted ads or offers
- Escalate hot leads to sales CRM

#### Creative Testing AI
- Generate multiple ad variants
- Auto-A/B test across channels
- Pause low performers, scale winners

#### AI-Powered Campaign Doctor
- Scan existing campaigns
- Detect inefficiencies
- Auto-suggest or auto-implement fixes

---

### 15. Influencer, Affiliate & Creator Ecosystem Workflows

#### Affiliate Tracking & Payouts
- Real-time conversion tracking
- Auto-generate commissions
- Trigger payout workflows via Stripe/Paystack

#### Creator Content Pipeline
- Creator uploads → moderation → versioning → approvals
- Auto-publication to multiple brand touchpoints

#### Influencer Contract & Asset Delivery
- Auto-generate contracts
- Send via e-sign tools
- Trigger asset delivery on signature

#### Creator Performance Scoring
- AI scores UGC performance
- Auto-prioritize top creators
- Trigger invitation for premium campaigns

---

### 16. Product Lifecycle & Commerce Workflow Patterns

#### New Product Launch Engine
- Auto-generate promotional sequences
- Auto-distribute launch content across channels
- Monitor early engagement and adjust campaigns

#### Dynamic Pricing Automation
- Monitor demand, region, inventory
- Auto-update product pricing
- Trigger discount removal when conversion rises

#### Inventory-Aware Marketing
- Low stock → pause ads
- Over-stock → push promotional workflows
- Auto-update product feeds

#### Transactional Event Enrichment
- Purchase → tag customer → create LTV prediction
- Sync with analytics and CDP

---

### 17. Customer Journey Orchestration Workflows

#### 100-Day Customer Journey Template
- Day-based onboarding
- Product usage tracking
- Reward milestones
- Predictive churn alerts

#### Milestone-Based Journey Automation
- First login
- First message/comment
- First purchase
- First referral
- Journey adapts dynamically

#### Role-Based Customer Journeys
Unique automated paths for:
- Creator
- Shopper
- Business account
- VIP
- Existing customer

---

### 18. Retention, Loyalty & Rewards Workflows

#### Loyalty Status Automation
- Points accumulation
- Tier progression
- Auto-reward triggers

#### Cashback / Benefits Workflow
- Qualifying event → auto-generate cashback
- Push notification → confirmation
- Sync with wallet/coin balance

#### Proactive Retention Workflow
- Behavior indicates frustration
- Trigger outreach via email/SMS/chat
- Offer coupon or guide

---

### 19. Reputation, Review & Feedback Workflows

#### Review Request Engine
- Trigger after purchase or service
- Auto-select best timing

#### Sentiment → Action Workflow
- Positive → request referral
- Neutral → educational content
- Negative → support escalation

#### Testimonial Publishing
- Gather videos/text
- Auto-tag categories
- Push to landing pages, galleries, and ads

---

### 20. Event, Webinar & Community Workflows

#### Event Registration Automation
- Registration → reminder sequence
- Auto-check-in
- Post-event follow-up

#### Webinar Funnel Workflow
- Auto-register
- Generate calendar invite
- Drip reminders
- Replay distribution

#### Community Growth Loop
- Trigger invitations to join chats, groups, or Discord channels
- Auto-schedule engagement prompts

---

### 21. Sales, Proposal & Contract Workflows

#### Sales Proposal Automation
- Lead request → auto-generate PDF proposal
- Route for signature
- Start onboarding when signed

#### Enterprise Account Workflow
- Assign multiple stakeholders
- Track lifecycle stages
- Trigger QBR reports

#### Renewal & Expansion Workflow
- Upcoming contract end date
- Auto-offers or meetings
- Usage insights included in the pitch

---

### 22. AI Data & Insights Workflows

#### RAG-Driven Personalization Pipeline
- Ingest user behavior
- Build semantic profile
- AI generates personalized recommendations

#### Data Unification Workflow
- Merge CRM + Ads + Web Analytics
- Auto-create unified customer profiles

#### Marketing Opportunities Detector
- AI scans performance
- Suggests revenue opportunities
- Auto-build campaign to capture it

---

### 23. Compliance, Security & Fraud Verification Workflows

#### Fraudulent Lead Filter
- Auto-verify email, phone, IP, region
- Block suspicious activity automatically

#### KYC/Compliance Workflow
- Enforce ID verification when needed
- Auto-trigger manual review

#### GDPR Data Lifecycle
- Request → export → deletion automation

---

### 24. Cross-Team Collaboration Workflows

#### Marketing → Design Handoff
- New campaign idea → auto-generate design briefs
- Tag designer
- Auto-reminder until assets delivered

#### Content → Engineering Sync
- Changes require dev update
- Auto-create tasks in GitHub or Jira

#### Sales → Support Sync
- Close deal → auto-create customer onboarding tasks

---

### 25. Platform-Specific (n8n.io) Advanced Patterns

#### Webhook → Multi-Step Decisioning
- Unified entry webhook
- AI scoring
- Branching logic
- CRM + ESP + SMS all triggered together

#### Multi-system Error Recovery
- Detect failure in ESP or CRM
- Reroute tasks to backup provider

#### Long-running Workflows
- Multi-day campaigns
- Delays, human steps, approvals

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌─────────┐  ┌─────────────┐  ┌────────────┐  ┌─────────────┐  │
│  │   Web   │  │   Creator   │  │   Brand    │  │   Mobile    │  │
│  │   App   │  │   Portal    │  │   Portal   │  │    App      │  │
│  └────┬────┘  └──────┬──────┘  └─────┬──────┘  └──────┬──────┘  │
└───────┼──────────────┼───────────────┼────────────────┼─────────┘
        │              │               │                │
        └──────────────┴───────────────┴────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   API GATEWAY     │
                    │  (Kong + Auth)    │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼───────┐  ┌──────────▼──────────┐  ┌──────▼──────┐
│  CORE SERVICES │  │   AI/ML SERVICES    │  │  WORKERS   │
│  ─────────────  │  │  ────────────────   │  │  ───────── │
│  • User        │  │  • Video Generator  │  │  • Video   │
│  • Creator     │◄─►│  • Script Generator │◄─►│    Process │
│  • Campaign    │  │  • Performance AI   │  │  • Social  │
│  • Content     │  │  • Recommendations  │  │    Publish │
│  • Commerce    │  │  • Content Mod      │  │  • Analytics│
│  • Analytics   │  │  • Trend Engine     │  │    ETL     │
└───────┬───────┘  └──────────┬──────────┘  └──────┬──────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
        ┌─────▼─────┐  ┌──────▼──────┐  ┌─────▼─────┐
        │ PostgreSQL │  │   MongoDB   │  │   Redis   │
        │ (Primary)  │  │  (Content)  │  │  (Cache)  │
        └───────────┘  └─────────────┘  └───────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5+
- **Styling**: TailwindCSS 3+, shadcn/ui
- **State**: Zustand, TanStack Query
- **Video Editor**: FFmpeg.wasm, custom timeline

### Backend
- **API**: Node.js + Express (REST), Apollo Server (GraphQL)
- **ML Services**: Python + FastAPI
- **Queue**: Redis + BullMQ
- **Auth**: OAuth 2.0, JWT, social login

### AI/ML
- **Training**: AWS SageMaker, Google Vertex AI
- **Frameworks**: TensorFlow, PyTorch
- **Pipelines**: Kubeflow
- **Feature Store**: Feast
- **Vector DB**: Pinecone

### Infrastructure
- **Cloud**: Azure (primary), AWS (ML/AI)
- **Orchestration**: Azure Kubernetes Service (AKS)
- **Container Registry**: Azure Container Registry (ACR)
- **IaC**: Terraform
- **CI/CD**: GitHub Actions
- **Monitoring**: Azure Application Insights, Grafana

### Data
- **Relational**: PostgreSQL 15+
- **Document**: MongoDB 7+
- **Cache**: Redis 7+
- **Search**: Elasticsearch 8+
- **Warehouse**: Snowflake / BigQuery

### Automation Integrations
- **Workflow Engines**: n8n.io, Make, Zapier
- **CRMs**: HubSpot, Salesforce, Pipedrive
- **ESPs**: Mailchimp, Klaviyo, SendGrid
- **Payment**: Stripe, Paystack, Flutterwave
- **Communication**: Twilio, WhatsApp Business API

---

## 💰 Subscription Tiers

NEXUS offers a 6-tier subscription model designed to scale with your business:

| Tier | Price/Month | Seats | Storage | Creators | Key Features |
|------|-------------|-------|---------|----------|--------------|
| **Free** | $0 | 1 | 1 GB | 5 | Basic UGC management, community support |
| **Starter** | $49 | 3 | 10 GB | 25 | 2FA, email support, shoppable galleries |
| **Growth** | $149 | 10 | 50 GB | 100 | Audit log, priority support, Spark Ads |
| **Pro** | $399 | 25 | 200 GB | 500 | SSO, custom domain, 99.9% SLA |
| **Business** | $999 | 100 | 1 TB | 2,000 | SCIM, white-label, dedicated support |
| **Enterprise** | Custom | Unlimited | Unlimited | Unlimited | Custom SLA, dedicated infrastructure |

All paid tiers include:
- Annual billing discount (2 months free)
- GDPR/CCPA compliance tools
- API access
- Multi-touch attribution

See [`config/entitlements.tiers.yml`](config/entitlements.tiers.yml) for complete tier specifications.

---

## ☁️ Azure Deployment

### Deployed Infrastructure (Staging)

| Resource | Name | Purpose |
|----------|------|---------|
| **AKS Cluster** | `aks-marketing-staging-ravs` | Kubernetes 1.32, managed node pool |
| **Container Registry** | `acrmktstagingravs.azurecr.io` | Docker image repository |
| **PostgreSQL** | Flexible Server | Primary database with pgvector |
| **Redis Cache** | Premium tier | Session & cache management |
| **Key Vault** | Secret management | Secure credential storage |
| **Storage Account** | Blob containers | Asset & media storage |
| **Virtual Network** | Hub-spoke topology | Network isolation |
| **Application Insights** | Telemetry | Monitoring & diagnostics |
| **Log Analytics** | Workspace | Centralized logging |

### Container Images (ACR)

```
acrmktstagingravs.azurecr.io/
├── api-gateway:latest
├── auth-service:latest
├── ai-service:latest
├── analytics-aggregator:latest
├── brand-portal:latest
├── notification-dispatcher:latest
├── recommendation-engine:latest
├── social-publisher:latest
├── video-generator:latest
├── video-processor:latest
└── ... (28 total services)
```

### Terraform Infrastructure

```bash
cd infrastructure/terraform

# Initialize
terraform init

# Plan deployment
terraform plan -var-file="environments/staging.tfvars"

# Apply
terraform apply -var-file="environments/staging.tfvars"
```

---

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- pnpm 8+

### Quick Start

```bash
# Clone the repository
git clone https://github.com/oks-citadel/UGC-Content-Creation-SaaS-Platform.git
cd UGC-Content-Creation-SaaS-Platform

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Start development services
docker-compose up -d

# Run database migrations
pnpm db:migrate

# Seed development data
pnpm db:seed

# Start the development server
pnpm dev
```

### Development URLs

| Service | URL |
|---------|-----|
| Web App | http://localhost:3000 |
| Creator Portal | http://localhost:3001 |
| Brand Portal | http://localhost:3002 |
| API Gateway | http://localhost:4000 |
| API Docs | http://localhost:4000/docs |
| Storybook | http://localhost:6006 |
| n8n Workflows | http://localhost:5678 |

---

## 📁 Project Structure

```
nexus-platform/
├── apps/                 # Application entry points
│   ├── web/              # Main web application
│   ├── creator-portal/   # Creator-facing app
│   ├── brand-portal/     # Brand/agency app
│   ├── admin/            # Internal admin dashboard
│   └── mobile/           # React Native app
├── packages/             # Shared packages
│   ├── ui/               # Component library
│   ├── video-editor/     # Video editing SDK
│   ├── analytics-sdk/    # Analytics client
│   ├── types/            # TypeScript types
│   └── utils/            # Shared utilities
├── services/             # Backend microservices
│   ├── api-gateway/
│   ├── user-service/
│   ├── creator-service/
│   ├── campaign-service/
│   ├── content-service/
│   ├── commerce-service/
│   └── analytics-service/
├── ai/                   # AI/ML services (Python)
│   ├── video-generator/
│   ├── script-generator/
│   ├── performance-predictor/
│   └── recommendation-engine/
├── workflows/            # Automation workflows
│   ├── n8n-templates/    # n8n workflow JSON exports
│   ├── make-blueprints/  # Make scenario templates
│   └── zapier-zaps/      # Zapier integration configs
├── workers/              # Background processors
├── infrastructure/       # IaC & deployment
└── docs/                 # Documentation
```

---

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run integration tests
pnpm test:integration

# Run e2e tests
pnpm test:e2e

# Run all tests with coverage
pnpm test:coverage
```

---

## 🚢 Deployment

### Staging

```bash
# Deploy to staging
pnpm deploy:staging
```

### Production

```bash
# Deploy to production (requires approval)
pnpm deploy:production
```

### Manual Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -k infrastructure/kubernetes/overlays/production
```

---

## 📚 Documentation

- [Architecture Overview](docs/architecture/overview.md)
- [API Reference](docs/api/openapi.yaml)
- [Getting Started Guide](docs/guides/getting-started.md)
- [Deployment Guide](docs/guides/deployment.md)
- [Contributing Guidelines](docs/guides/contributing.md)
- [Workflow Automation Guide](docs/guides/workflows.md)
- [n8n Integration Guide](docs/integrations/n8n.md)

---

## 🔐 Security

- SOC 2 Type II compliant
- GDPR & CCPA compliant
- AES-256 encryption at rest
- TLS 1.3 in transit
- Regular third-party penetration testing

Report security vulnerabilities to: security@nexusugc.com

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/guides/contributing.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary software. See [LICENSE](LICENSE) for details.

---

## 📞 Support

- **Documentation**: [docs.nexusugc.com](https://docs.nexusugc.com)
- **Email**: support@nexusugc.com
- **Enterprise**: enterprise@nexusugc.com

---

<p align="center">
  Built with ❤️ by the NEXUS Team
</p>
