# NEXUS Marketplace Service

The Marketplace Service powers the creator marketplace, handling opportunities, bidding, contracts, payouts, disputes, and ambassador programs for the NEXUS platform.

## Features

### Core Capabilities
- **Opportunity Management**: Create and manage creator opportunities with AI-powered matching
- **Bidding System**: Complete bidding workflow with negotiation support
- **Smart Contracts**: E-signature integration via DocuSign for legal agreements
- **Multi-Currency Payouts**: Support for Stripe, Paystack, and Flutterwave
- **Dispute Resolution**: Built-in dispute management system
- **Ambassador Programs**: Brand ambassador program management with tier systems

### Payment Providers
- **Stripe Connect**: Global payouts via bank transfer and cards
- **Paystack**: African markets (Nigeria, Ghana, Kenya, South Africa)
- **Flutterwave**: Pan-African payment solution with mobile money

### Contract Management
- DocuSign integration for e-signatures
- Template-based contract generation
- Multi-party signing workflow
- Contract status tracking

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Payments**: Stripe Connect, Paystack, Flutterwave
- **E-Signatures**: DocuSign API
- **AI**: OpenAI (for opportunity matching)

## Getting Started

### Prerequisites
- Node.js 18 or higher
- PostgreSQL database
- Redis server
- Stripe account (for payouts)
- DocuSign account (for contracts)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Generate Prisma client:
```bash
npm run prisma:generate
```

4. Run database migrations:
```bash
npm run prisma:migrate
```

5. Start development server:
```bash
npm run dev
```

The service will be available at `http://localhost:3006`

## API Endpoints

### Opportunities
- `POST /api/marketplace/opportunities` - Create opportunity
- `GET /api/marketplace/opportunities` - List opportunities
- `GET /api/marketplace/opportunities/:id` - Get opportunity details
- `PUT /api/marketplace/opportunities/:id` - Update opportunity
- `POST /api/marketplace/opportunities/:id/close` - Close opportunity
- `GET /api/marketplace/opportunities/matches/:creatorId` - Get AI matches

### Bids
- `POST /api/marketplace/bids` - Submit bid
- `GET /api/marketplace/bids/creator/:creatorId` - Get creator bids
- `GET /api/marketplace/opportunities/:id/bids` - Get opportunity bids
- `PUT /api/marketplace/bids/:id` - Update bid
- `POST /api/marketplace/bids/:id/withdraw` - Withdraw bid
- `POST /api/marketplace/bids/:id/accept` - Accept bid
- `POST /api/marketplace/bids/:id/reject` - Reject bid
- `POST /api/marketplace/bids/:id/negotiate` - Negotiate bid

### Contracts
- `POST /api/marketplace/contracts` - Generate contract
- `GET /api/marketplace/contracts` - List contracts
- `GET /api/marketplace/contracts/:id` - Get contract details
- `POST /api/marketplace/contracts/:id/send-for-signature` - Send for signature
- `POST /api/marketplace/contracts/:id/sign` - Sign contract
- `GET /api/marketplace/contracts/:id/status` - Get contract status
- `POST /api/marketplace/contracts/:id/terminate` - Terminate contract

### Payouts
- `POST /api/marketplace/payouts` - Request payout
- `GET /api/marketplace/payouts/:creatorId` - Get payout history
- `POST /api/marketplace/payouts/:id/cancel` - Cancel payout
- `POST /api/marketplace/payout-methods` - Add payout method
- `GET /api/marketplace/payout-methods/:creatorId` - Get payout methods

### Disputes
- `POST /api/marketplace/disputes` - Raise dispute
- `GET /api/marketplace/disputes` - List disputes
- `GET /api/marketplace/disputes/:id` - Get dispute details
- `POST /api/marketplace/disputes/:id/respond` - Respond to dispute
- `POST /api/marketplace/disputes/:id/escalate` - Escalate dispute
- `POST /api/marketplace/disputes/:id/resolve` - Resolve dispute

### Ambassador Programs
- `POST /api/marketplace/ambassador-programs` - Create program
- `GET /api/marketplace/ambassador-programs` - List programs
- `GET /api/marketplace/ambassador-programs/:id` - Get program details
- `PUT /api/marketplace/ambassador-programs/:id` - Update program
- `POST /api/marketplace/ambassador-programs/:id/invite` - Invite ambassador
- `POST /api/marketplace/ambassadors/:id/accept` - Accept invitation
- `POST /api/marketplace/ambassadors/:id/upgrade-tier` - Upgrade tier

## Multi-Currency Support

The service supports the following currencies:
- USD - US Dollar
- EUR - Euro
- GBP - British Pound
- NGN - Nigerian Naira
- KES - Kenyan Shilling
- GHS - Ghanaian Cedi
- ZAR - South African Rand

Exchange rates are automatically fetched and cached for conversions.

## Payout Processing

### Stripe Connect
- Global coverage
- Bank transfers, debit cards
- Automatic onboarding flow
- 2.5% + $0.30 processing fee

### Paystack
- Nigeria, Ghana, Kenya, South Africa
- Bank transfer, mobile money
- Instant transfers
- Local currency support

### Flutterwave
- Pan-African coverage
- Mobile money, bank transfer
- Multi-currency
- Competitive rates

## Contract Workflow

1. **Generate Contract**: Brand generates contract from template
2. **Send for Signature**: Contract sent to DocuSign
3. **Multi-Party Signing**: Brand and creator sign electronically
4. **Activation**: Contract becomes active when fully signed
5. **Completion**: Contract marked complete when work is done

## Dispute Resolution

1. **Raise Dispute**: Either party can raise a dispute
2. **Under Review**: Platform team reviews evidence
3. **Escalation**: Can be escalated to senior mediators
4. **Resolution**: Final decision with documented outcome
5. **Closure**: Dispute closed with resolution applied

## Docker Deployment

Build image:
```bash
docker build -t nexus-marketplace-service .
```

Run container:
```bash
docker run -p 3006:3006 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  nexus-marketplace-service
```

## Environment Variables

See `.env.example` for all required and optional environment variables.

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token validation

### Payment Providers (at least one required)
- `STRIPE_SECRET_KEY` - Stripe API key
- `PAYSTACK_SECRET_KEY` - Paystack API key
- `FLUTTERWAVE_SECRET_KEY` - Flutterwave API key

### DocuSign (required for contracts)
- `DOCUSIGN_INTEGRATION_KEY` - Integration key
- `DOCUSIGN_USER_ID` - User ID
- `DOCUSIGN_ACCOUNT_ID` - Account ID
- `DOCUSIGN_PRIVATE_KEY_PATH` - Path to private key

## Database Schema

See `prisma/schema.prisma` for complete database schema including:
- Opportunities
- Bids
- Contracts
- Payouts
- PayoutMethodConfigs
- Disputes
- AmbassadorPrograms
- Ambassadors
- ExchangeRates

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Monitoring

The service includes:
- Health check endpoint: `GET /health`
- Readiness check: `GET /ready`
- Prometheus metrics (if enabled)
- Structured logging with Winston

## License

Proprietary - NEXUS Platform

## Support

For issues or questions, contact the platform team.
