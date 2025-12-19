#!/bin/bash

# Commerce Service Setup Script

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   🛒  NEXUS Commerce Service Setup                        ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  Please update the .env file with your configuration"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npm run prisma:generate

# Run migrations
echo "🗄️  Running database migrations..."
read -p "Do you want to run database migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run prisma:migrate
fi

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your configuration"
echo "2. Run 'npm run dev' to start in development mode"
echo "3. Run 'npm run build && npm start' for production"
echo ""
