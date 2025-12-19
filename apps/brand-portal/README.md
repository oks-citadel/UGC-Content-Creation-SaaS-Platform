# NEXUS Brand Portal

The brand-facing application for the NEXUS UGC Content Creation SaaS Platform.

## Features

- Campaign management and creation
- Creator marketplace and discovery
- Content review and approval workflows
- Shoppable gallery builder with product tagging
- Comprehensive analytics and attribution reporting
- Team collaboration tools
- Billing and subscription management
- Integration hub for third-party tools

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Access to the NEXUS API backend

### Installation

1. Install dependencies:

```bash
npm install
```

2. Copy the example environment file:

```bash
cp .env.local.example .env.local
```

3. Update `.env.local` with your configuration:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
apps/brand-portal/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard and main app pages
│   ├── layout.tsx         # Root layout
│   └── providers.tsx      # Global providers
├── components/            # Reusable React components
│   ├── campaigns/        # Campaign-related components
│   ├── marketplace/      # Creator marketplace components
│   ├── content/          # Content management components
│   └── analytics/        # Analytics and reporting components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
├── stores/               # Zustand state management
└── public/              # Static assets
```

## Key Routes

- `/login` - Brand authentication
- `/dashboard` - Main dashboard with overview
- `/campaigns` - Campaign management
- `/marketplace` - Creator discovery
- `/content` - Content library and galleries
- `/analytics` - Performance analytics
- `/team` - Team management
- `/billing` - Subscription and billing
- `/settings` - Account settings
- `/integrations` - Third-party integrations

## Technology Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** React 18, Tailwind CSS
- **State Management:** Zustand, React Query
- **Charts:** Recharts
- **Forms:** React Hook Form, Zod
- **HTTP Client:** Axios
- **Notifications:** Sonner

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |
| `NEXT_PUBLIC_APP_URL` | Frontend app URL | Yes |

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Submit a pull request

## License

Proprietary - All rights reserved
