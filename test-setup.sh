#!/bin/bash

# Raydium LP Manager - Setup Verification Script
# This script checks if all prerequisites are met before testing

echo "🧪 Raydium LP Manager - Setup Verification"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} $NODE_VERSION"
else
    echo -e "${RED}✗ Not found${NC}"
    echo "  Please install Node.js v18 or higher"
    ERRORS=$((ERRORS + 1))
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} v$NPM_VERSION"
else
    echo -e "${RED}✗ Not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check PostgreSQL
echo -n "Checking PostgreSQL... "
if command -v psql &> /dev/null; then
    if pg_isready &> /dev/null; then
        echo -e "${GREEN}✓${NC} Running"
    else
        echo -e "${YELLOW}⚠${NC} Installed but not running"
        echo "  Start with: brew services start postgresql@14 (macOS)"
        echo "           or: sudo systemctl start postgresql (Linux)"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗ Not installed${NC}"
    echo "  Install PostgreSQL 14+"
    ERRORS=$((ERRORS + 1))
fi

# Check Redis
echo -n "Checking Redis... "
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✓${NC} Running"
    else
        echo -e "${YELLOW}⚠${NC} Installed but not running"
        echo "  Start with: brew services start redis (macOS)"
        echo "           or: sudo systemctl start redis-server (Linux)"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗ Not installed${NC}"
    echo "  Install Redis 6+"
    ERRORS=$((ERRORS + 1))
fi

# Check frontend dependencies
echo -n "Checking frontend dependencies... "
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Installed"
else
    echo -e "${YELLOW}⚠${NC} Not installed"
    echo "  Run: cd frontend && npm install"
    ERRORS=$((ERRORS + 1))
fi

# Check backend dependencies
echo -n "Checking backend dependencies... "
if [ -d "backend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Installed"
else
    echo -e "${YELLOW}⚠${NC} Not installed"
    echo "  Run: cd backend && npm install"
    ERRORS=$((ERRORS + 1))
fi

# Check database
echo -n "Checking database... "
if psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw raydium_lp_manager; then
    echo -e "${GREEN}✓${NC} raydium_lp_manager exists"
else
    echo -e "${YELLOW}⚠${NC} Database not found"
    echo "  Create with: createdb raydium_lp_manager"
    echo "  Then run: cd backend && npm run build && node dist/database/init.js"
    ERRORS=$((ERRORS + 1))
fi

# Check environment files
echo -n "Checking backend .env... "
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓${NC} Exists"
else
    echo -e "${YELLOW}⚠${NC} Not found"
    echo "  Copy: cp backend/.env.example backend/.env"
    echo "  Then edit database credentials"
    ERRORS=$((ERRORS + 1))
fi

echo -n "Checking frontend .env... "
if [ -f "frontend/.env" ]; then
    echo -e "${GREEN}✓${NC} Exists"
else
    echo -e "${YELLOW}⚠${NC} Not found"
    echo "  Copy: cp frontend/.env.example frontend/.env"
fi

echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Ready to start testing:"
    echo "  1. Terminal 1: cd backend && npm run dev"
    echo "  2. Terminal 2: cd frontend && npm run dev"
    echo "  3. Browser: http://localhost:3000"
    echo ""
    echo "See TESTING_GUIDE.md for detailed testing instructions"
else
    echo -e "${RED}✗ $ERRORS issue(s) found${NC}"
    echo ""
    echo "Please fix the issues above before testing"
    echo "See SETUP.md for installation instructions"
fi
echo "=========================================="
