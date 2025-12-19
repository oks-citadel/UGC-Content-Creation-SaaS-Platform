# NEXUS Creator Portal

The creator-facing application for the NEXUS UGC content creation platform.

## Features

- **Authentication**: Creator login and registration
- **Dashboard**: Overview of stats, earnings, and activity
- **Portfolio Management**: Upload and showcase your best work
- **Opportunities**: Browse and apply to brand collaborations
- **Campaign Management**: Track active campaigns and deliverables
- **Earnings**: Monitor income and request payouts
- **Content Studio**: Create and edit content
- **Analytics**: Track performance across platforms
- **Settings**: Manage profile and payout methods

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Icons**: Lucide React
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API running on port 8000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

3. Run the development server:
```bash
npm run dev
```

The app will be available at [http://localhost:3001](http://localhost:3001)

## Project Structure

```
apps/creator-portal/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication routes
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # Dashboard routes
│   │   ├── dashboard/       # Main dashboard
│   │   ├── portfolio/       # Portfolio management
│   │   ├── opportunities/   # Browse opportunities
│   │   ├── campaigns/       # Active campaigns
│   │   ├── earnings/        # Earnings dashboard
│   │   ├── payouts/         # Payout management
│   │   ├── studio/          # Content creation
│   │   ├── analytics/       # Performance analytics
│   │   └── settings/        # Settings
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/              # React components
│   ├── layout/              # Layout components
│   ├── dashboard/           # Dashboard components
│   ├── portfolio/           # Portfolio components
│   ├── opportunities/       # Opportunity components
│   ├── campaigns/           # Campaign components
│   ├── earnings/            # Earnings components
│   └── ui/                  # Reusable UI components
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities and helpers
├── stores/                  # Zustand stores
└── types/                   # TypeScript types
```

## Available Scripts

- `npm run dev` - Start development server on port 3001
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Key Features

### Authentication
- Secure login and registration
- JWT token management
- Protected routes

### Dashboard
- Real-time stats and metrics
- Recent activity feed
- Upcoming deadlines

### Portfolio
- Upload and manage content
- Filter by type (images, videos, reels)
- Edit and delete portfolio items

### Opportunities
- Browse available brand collaborations
- Filter by niche and budget
- Apply with custom proposals

### Campaigns
- View active, pending, and completed campaigns
- Track deliverables and deadlines
- Submit content for review
- Campaign brief and guidelines

### Earnings & Payouts
- Track total and monthly earnings
- Request payouts
- Manage payout methods
- View transaction history

### Content Studio
- Upload and edit content
- AI-powered caption generation
- Image and video editing tools

### Analytics
- Track engagement across platforms
- View top-performing content
- Monitor follower growth
- Platform-specific metrics

## Mobile Responsive

The application is fully responsive and optimized for:
- Mobile devices (320px+)
- Tablets (768px+)
- Desktop (1024px+)

## Integration

This app connects to the NEXUS backend API for:
- User authentication
- Data fetching and mutations
- File uploads
- Real-time updates

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Copyright 2024 NEXUS Platform
