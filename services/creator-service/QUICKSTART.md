# Quick Start Guide

Get the Creator Service up and running in minutes!

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- (Optional) Docker and Docker Compose

## Option 1: Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and update the database connection:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/nexus_creators
JWT_SECRET=your-secret-key-min-32-characters
```

### 3. Setup Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

The service will be available at `http://localhost:3003`

## Option 2: Docker Compose (Recommended)

### 1. Start All Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL database on port 5434
- Creator Service on port 3003
- Prisma Studio on port 5555

### 2. Run Migrations

```bash
docker-compose exec creator-service npm run prisma:migrate
```

### 3. View Logs

```bash
docker-compose logs -f creator-service
```

## Option 3: Using Makefile

### 1. Setup

```bash
make setup
```

### 2. Start Development

```bash
make dev
```

### 3. Other Commands

```bash
make help              # View all available commands
make docker-up         # Start Docker containers
make prisma-studio     # Open database GUI
make test              # Run tests
make lint              # Run linter
```

## Verify Installation

### 1. Check Health

```bash
curl http://localhost:3003/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "creator-service",
  "version": "1.0.0"
}
```

### 2. Create a Test Creator

```bash
curl -X POST http://localhost:3003/api/creators \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": "user-123",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "Creator"
  }'
```

## Database Management

### Prisma Studio (Database GUI)

```bash
npm run prisma:studio
# or
make prisma-studio
```

Visit `http://localhost:5555` to view and edit data.

### Create Migration

```bash
npm run prisma:migrate
```

### Reset Database

```bash
npx prisma migrate reset
```

## Testing

### Run All Tests

```bash
npm test
```

### Run with Coverage

```bash
npm test -- --coverage
```

## API Documentation

View the comprehensive API documentation in `API.md`.

Quick links:
- Create Creator: `POST /api/creators`
- Get Creator: `GET /api/creators/:id`
- List Creators: `GET /api/creators`
- Match Creators: `GET /api/creators/match`

## Common Issues

### Database Connection Failed

**Problem:** Can't connect to PostgreSQL

**Solution:**
1. Verify PostgreSQL is running
2. Check `DATABASE_URL` in `.env`
3. Ensure database exists: `createdb nexus_creators`

### Port Already in Use

**Problem:** Port 3003 is already in use

**Solution:**
1. Change `PORT` in `.env`
2. Or stop the process using port 3003

### Prisma Client Not Generated

**Problem:** `@prisma/client` not found

**Solution:**
```bash
npm run prisma:generate
```

## Next Steps

1. Read the full [README.md](README.md)
2. Review [API Documentation](API.md)
3. Explore the [Database Schema](prisma/schema.prisma)
4. Check out example requests in the API docs
5. Integrate with other NEXUS services

## Production Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Docker Production Build

```bash
docker build -t nexus-creator-service:latest .
docker run -p 3003:3003 --env-file .env nexus-creator-service:latest
```

## Support

For issues or questions:
- Check the README.md
- Review API.md
- Check logs: `docker-compose logs creator-service`
- Enable debug logging: `LOG_LEVEL=debug` in `.env`

## Development Tips

1. **Hot Reload**: Use `npm run dev` for automatic restarts
2. **Database GUI**: Use Prisma Studio to view/edit data
3. **Logging**: Set `LOG_LEVEL=debug` for detailed logs
4. **Testing**: Run tests before committing: `npm test`
5. **Linting**: Format code: `npm run format`

Happy coding!
