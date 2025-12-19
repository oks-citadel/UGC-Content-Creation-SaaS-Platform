# NEXUS Creator Portal - Installation Guide

## Quick Start

Follow these steps to get the Creator Portal running locally.

## Prerequisites

- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- **Backend API** running (default: http://localhost:8000)

## Installation Steps

### 1. Navigate to the Project Directory

```bash
cd apps/creator-portal
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Using yarn:
```bash
yarn install
```

This will install all required packages:
- next@^14.1.0
- react@^18.2.0
- tailwindcss@^3.4.1
- zustand@^4.4.7
- @tanstack/react-query@^5.17.19
- And all other dependencies listed in package.json

### 3. Set Up Environment Variables

Copy the example environment file:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 4. Run the Development Server

```bash
npm run dev
```

The application will start on **http://localhost:3001**

### 5. Access the Application

Open your browser and navigate to:
```
http://localhost:3001
```

You should see the NEXUS Creator Portal landing page.

## Default Routes

### Public Routes
- `/login` - Creator login
- `/register` - Creator registration

### Protected Routes (require authentication)
- `/dashboard` - Main dashboard
- `/portfolio` - Portfolio management
- `/opportunities` - Browse opportunities
- `/campaigns` - Active campaigns
- `/earnings` - Earnings overview
- `/payouts` - Payout management
- `/studio` - Content creation studio
- `/analytics` - Performance analytics
- `/settings` - Account settings

## Development Scripts

```bash
# Start development server (port 3001)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint

# Run TypeScript type checking
npm run type-check
```

## Project Configuration

### Port Configuration

The app runs on port **3001** by default. To change the port, edit `package.json`:

```json
{
  "scripts": {
    "dev": "next dev -p YOUR_PORT",
    "start": "next start -p YOUR_PORT"
  }
}
```

### API Configuration

The app connects to the backend API via the `NEXT_PUBLIC_API_URL` environment variable. Make sure your backend API is running before starting the creator portal.

### Image Domains

If you're using external images, add the domains to `next.config.js`:

```javascript
images: {
  domains: ['your-domain.com'],
}
```

## Troubleshooting

### Port Already in Use

If port 3001 is already in use:
```bash
# Kill the process using the port (Windows)
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Or use a different port
npm run dev -- -p 3002
```

### Module Not Found Errors

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### TypeScript Errors

```bash
# Run type checking to see all errors
npm run type-check

# Clear Next.js cache
rm -rf .next
```

### Environment Variables Not Loading

- Ensure `.env.local` is in the root of `apps/creator-portal/`
- Restart the development server after changing env variables
- Variables must start with `NEXT_PUBLIC_` to be accessible in the browser

## Building for Production

### 1. Create Production Build

```bash
npm run build
```

This creates an optimized production build in the `.next` folder.

### 2. Test Production Build Locally

```bash
npm start
```

### 3. Deploy

The app can be deployed to:

#### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

#### Docker
```bash
docker build -t nexus-creator-portal .
docker run -p 3001:3001 nexus-creator-portal
```

#### Other Platforms
- AWS Amplify
- Netlify
- AWS EC2
- Digital Ocean
- Heroku

## Environment Variables for Production

Required environment variables for production:

```env
# Production API URL
NEXT_PUBLIC_API_URL=https://api.nexus-platform.com/api

# Production App URL
NEXT_PUBLIC_APP_URL=https://creators.nexus-platform.com
```

## Next Steps

1. **Start the Backend API** if not already running
2. **Create a test creator account** via the registration page
3. **Explore the application** features
4. **Connect to real backend** endpoints
5. **Customize** branding and content as needed

## Support

For issues or questions:
- Check the README.md for feature documentation
- Review the PROJECT_SUMMARY.md for technical details
- Ensure backend API is running and accessible

## File Structure Reference

```
apps/creator-portal/
├── app/              # Next.js pages and layouts
├── components/       # React components
├── hooks/           # Custom hooks
├── lib/             # Utilities and API client
├── stores/          # State management
├── public/          # Static assets
└── styles/          # Global styles
```

## Testing the Application

### Test Login (Mock Data)
Until connected to real backend, the app uses mock data:
- Email: any@email.com
- Password: any password

### Test Features
- Create portfolio items
- Browse opportunities
- Apply to campaigns
- View earnings
- Manage settings

## Performance Optimization

For production:
1. Enable image optimization
2. Configure caching headers
3. Set up CDN for static assets
4. Enable compression
5. Monitor with analytics

## Security Considerations

1. Never commit `.env.local` to version control
2. Use HTTPS in production
3. Implement rate limiting
4. Validate all user inputs
5. Keep dependencies updated

## Monitoring

Recommended monitoring tools:
- Vercel Analytics
- Google Analytics
- Sentry for error tracking
- LogRocket for session replay

---

**Happy Creating! 🚀**
