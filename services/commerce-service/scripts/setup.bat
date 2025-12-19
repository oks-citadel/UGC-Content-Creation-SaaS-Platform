@echo off
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║   🛒  NEXUS Commerce Service Setup                        ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if .env exists
if not exist .env (
    echo 📝 Creating .env file from .env.example...
    copy .env.example .env
    echo ✓ .env file created
    echo.
    echo ⚠️  Please update the .env file with your configuration
    echo.
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Generate Prisma Client
echo 🔧 Generating Prisma Client...
call npm run prisma:generate

REM Run migrations
echo 🗄️  Running database migrations...
set /p migrate="Do you want to run database migrations? (y/n): "
if /i "%migrate%"=="y" (
    call npm run prisma:migrate
)

REM Create logs directory
echo 📁 Creating logs directory...
if not exist logs mkdir logs

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Update .env with your configuration
echo 2. Run 'npm run dev' to start in development mode
echo 3. Run 'npm run build && npm start' for production
echo.
pause
