#!/bin/bash

# PlugPost One-Line Installer
# Usage: curl -sSL https://raw.githubusercontent.com/yourusername/plugpost/main/install.sh | bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    PlugPost Installer                       ║"
echo "║              Modern Blog Platform Setup                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    echo -e "${YELLOW}Visit: https://nodejs.org/${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed. Please install Git first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Git detected${NC}"

# Get project name from user or use default
read -p "Enter project name (default: plugpost): " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-plugpost}

echo -e "${BLUE}📦 Cloning PlugPost...${NC}"
git clone https://github.com/yourusername/plugpost.git "$PROJECT_NAME"
cd "$PROJECT_NAME"

echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

echo -e "${BLUE}🔧 Setting up the platform...${NC}"
npm run setup

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  🎉 Setup Complete! 🎉                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${YELLOW}🚀 To start your blog:${NC}"
echo -e "${BLUE}   cd $PROJECT_NAME${NC}"
echo -e "${BLUE}   npm run dev${NC}"
echo ""
echo -e "${YELLOW}🌐 Your blog will be available at:${NC}"
echo -e "${GREEN}   http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}🔑 Default admin login:${NC}"
echo -e "${GREEN}   Email: admin@plugpost.local${NC}"
echo -e "${GREEN}   Password: admin123${NC}"
echo ""
echo -e "${YELLOW}🔧 Admin dashboard:${NC}"
echo -e "${GREEN}   http://localhost:3000/admin${NC}"
echo ""
echo -e "${BLUE}Happy blogging! 🎉${NC}"
