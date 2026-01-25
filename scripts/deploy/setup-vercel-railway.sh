#!/bin/bash
# =============================================================================
# Vercel + Railway Deployment Setup Script
# =============================================================================
# This script helps configure your project for deployment to Vercel and Railway.
# Run this script once to set up the initial configuration.
#
# Prerequisites:
# - Node.js 20+
# - pnpm installed
# - Vercel CLI: npm i -g vercel
# - Railway CLI: npm i -g @railway/cli
# - GitHub CLI: brew install gh (optional)
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Vercel + Railway Deployment Setup                    ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# Check Prerequisites
# =============================================================================
echo -e "${YELLOW}Checking prerequisites...${NC}"

check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "  ${RED}✗${NC} $1 is not installed"
        return 1
    fi
}

MISSING=0
check_command "node" || MISSING=1
check_command "pnpm" || MISSING=1
check_command "vercel" || { echo -e "    Run: ${YELLOW}npm i -g vercel${NC}"; MISSING=1; }
check_command "railway" || { echo -e "    Run: ${YELLOW}npm i -g @railway/cli${NC}"; MISSING=1; }

if [ $MISSING -eq 1 ]; then
    echo ""
    echo -e "${RED}Please install missing prerequisites and run again.${NC}"
    exit 1
fi

echo ""

# =============================================================================
# Vercel Setup
# =============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 1: Vercel Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Checking Vercel login status..."
if vercel whoami &> /dev/null; then
    VERCEL_USER=$(vercel whoami)
    echo -e "  ${GREEN}✓${NC} Logged in as: $VERCEL_USER"
else
    echo -e "  ${YELLOW}Not logged in to Vercel. Running 'vercel login'...${NC}"
    vercel login
fi

echo ""
echo "Setting up Vercel projects for each frontend app..."

APPS=("web" "admin" "creator-portal" "brand-portal")

for app in "${APPS[@]}"; do
    echo ""
    echo -e "${YELLOW}Setting up apps/$app...${NC}"

    if [ -d "apps/$app" ]; then
        cd "apps/$app"

        if [ -f ".vercel/project.json" ]; then
            echo -e "  ${GREEN}✓${NC} Vercel project already linked"
        else
            echo "  Linking to Vercel..."
            vercel link --yes || echo -e "  ${YELLOW}Run 'vercel link' manually in apps/$app${NC}"
        fi

        cd ../..
    else
        echo -e "  ${RED}✗${NC} Directory apps/$app not found"
    fi
done

echo ""

# =============================================================================
# Railway Setup
# =============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 2: Railway Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Checking Railway login status..."
if railway whoami &> /dev/null; then
    RAILWAY_USER=$(railway whoami)
    echo -e "  ${GREEN}✓${NC} Logged in as: $RAILWAY_USER"
else
    echo -e "  ${YELLOW}Not logged in to Railway. Running 'railway login'...${NC}"
    railway login
fi

echo ""
echo "You need to create a Railway project manually:"
echo ""
echo "  1. Go to https://railway.app/new"
echo "  2. Select 'Empty Project'"
echo "  3. Add services for: api-gateway, auth-service, etc."
echo "  4. Add PostgreSQL and Redis plugins"
echo ""
echo "Then link this directory to your Railway project:"
echo -e "  ${YELLOW}railway link${NC}"
echo ""

read -p "Press Enter after you've created and linked your Railway project..."

echo ""

# =============================================================================
# Environment Variables Setup
# =============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 3: Environment Variables${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Generating secure secrets..."
echo ""

JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
NEXTAUTH_SECRET=$(openssl rand -base64 32 | tr -d '\n')
SESSION_SECRET=$(openssl rand -base64 32 | tr -d '\n')

echo "Generated secrets (save these securely):"
echo ""
echo -e "${YELLOW}JWT_SECRET=${NC}"
echo "$JWT_SECRET"
echo ""
echo -e "${YELLOW}NEXTAUTH_SECRET=${NC}"
echo "$NEXTAUTH_SECRET"
echo ""
echo -e "${YELLOW}SESSION_SECRET=${NC}"
echo "$SESSION_SECRET"
echo ""

echo "Add these to your platform dashboards:"
echo ""
echo -e "  ${BLUE}Vercel:${NC} Project Settings → Environment Variables"
echo -e "  ${BLUE}Railway:${NC} Service → Variables"
echo ""

# =============================================================================
# GitHub Secrets
# =============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Step 4: GitHub Secrets${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Add these secrets to your GitHub repository:"
echo "  GitHub → Repository → Settings → Secrets and Variables → Actions"
echo ""
echo "  Required secrets:"
echo -e "  ${YELLOW}VERCEL_TOKEN${NC}          - Get from Vercel Account Settings → Tokens"
echo -e "  ${YELLOW}VERCEL_ORG_ID${NC}         - Get from Vercel Project Settings"
echo -e "  ${YELLOW}RAILWAY_TOKEN${NC}         - Get from Railway Account Settings → Tokens"
echo ""

if command -v gh &> /dev/null; then
    echo "GitHub CLI detected. Would you like to add secrets now? (y/n)"
    read -r RESPONSE
    if [ "$RESPONSE" = "y" ]; then
        echo "Enter your Vercel token:"
        read -s VERCEL_TOKEN
        gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN"
        echo -e "  ${GREEN}✓${NC} VERCEL_TOKEN set"

        echo "Enter your Vercel Org ID:"
        read VERCEL_ORG_ID
        gh secret set VERCEL_ORG_ID --body "$VERCEL_ORG_ID"
        echo -e "  ${GREEN}✓${NC} VERCEL_ORG_ID set"

        echo "Enter your Railway token:"
        read -s RAILWAY_TOKEN
        gh secret set RAILWAY_TOKEN --body "$RAILWAY_TOKEN"
        echo -e "  ${GREEN}✓${NC} RAILWAY_TOKEN set"
    fi
fi

echo ""

# =============================================================================
# Summary
# =============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Setup Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Next steps:"
echo ""
echo "  1. Configure environment variables in Vercel and Railway dashboards"
echo "  2. Set up custom domains in both platforms"
echo "  3. Configure DNS records in GoDaddy (see docs/deployment/dns-cutover.md)"
echo "  4. Run staging validation (see docs/deployment/staging-validation.md)"
echo "  5. Proceed with production cutover"
echo ""
echo "Documentation:"
echo "  - docs/deployment/architecture.md"
echo "  - docs/deployment/deployments.md"
echo "  - docs/deployment/dns-cutover.md"
echo "  - docs/deployment/rollback.md"
echo ""
echo -e "${GREEN}Happy deploying!${NC}"
