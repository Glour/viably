#!/bin/bash
# Viably Monitoring Setup Script
# Usage: ./scripts/setup-monitoring.sh

set -e

echo "🔍 Viably Monitoring Setup"
echo "=========================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running on production server
if [[ $(hostname -I | grep -o "<SERVER_IP>") ]]; then
    ENV="production"
    echo -e "${GREEN}✅ Running on PRODUCTION server${NC}"
elif [[ $(hostname -I | grep -o "<SERVER_IP>") ]]; then
    ENV="development"
    echo -e "${YELLOW}⚠️  Running on DEVELOPMENT server${NC}"
else
    ENV="unknown"
    echo -e "${YELLOW}⚠️  Unknown server${NC}"
fi

echo ""

# 1. Check health endpoint files
echo -e "${BLUE}📝 Step 1: Checking health endpoint files...${NC}"
if [[ -f "backend/app/health.py" ]]; then
    echo -e "${GREEN}✅ health.py exists${NC}"
else
    echo -e "${RED}❌ health.py not found${NC}"
    exit 1
fi

# 2. Check dependencies
echo -e "\n${BLUE}📦 Step 2: Checking dependencies...${NC}"
if grep -q "psutil" backend/pyproject.toml; then
    echo -e "${GREEN}✅ psutil in pyproject.toml${NC}"
else
    echo -e "${RED}❌ psutil missing${NC}"
    exit 1
fi

if grep -q "sentry-sdk" backend/pyproject.toml; then
    echo -e "${GREEN}✅ sentry-sdk in pyproject.toml${NC}"
else
    echo -e "${RED}❌ sentry-sdk missing${NC}"
    exit 1
fi

# 3. Install dependencies (if in backend venv)
echo -e "\n${BLUE}📥 Step 3: Installing dependencies...${NC}"
cd backend

if command -v poetry &> /dev/null; then
    echo "Using Poetry..."
    poetry install --no-dev
    echo -e "${GREEN}✅ Dependencies installed via Poetry${NC}"
elif [[ -f "requirements.txt" ]]; then
    echo "Using pip..."
    pip install -r requirements.txt
    echo -e "${GREEN}✅ Dependencies installed via pip${NC}"
else
    echo -e "${YELLOW}⚠️  No package manager found, skipping...${NC}"
fi

cd ..

# 4. Check .env file
echo -e "\n${BLUE}🔐 Step 4: Checking .env configuration...${NC}"
if [[ -f "backend/.env" ]]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
    
    if grep -q "SENTRY_DSN" backend/.env && [[ $(grep "SENTRY_DSN" backend/.env | cut -d'=' -f2 | tr -d ' ') != "" ]]; then
        echo -e "${GREEN}✅ SENTRY_DSN configured${NC}"
    else
        echo -e "${YELLOW}⚠️  SENTRY_DSN not set or empty${NC}"
        echo "   Add to backend/.env: SENTRY_DSN=https://your-dsn@sentry.io/project-id"
    fi
    
    if grep -q "ENVIRONMENT" backend/.env; then
        current_env=$(grep "ENVIRONMENT" backend/.env | cut -d'=' -f2 | tr -d ' "')
        echo -e "${GREEN}✅ ENVIRONMENT=$current_env${NC}"
    else
        echo -e "${YELLOW}⚠️  ENVIRONMENT not set${NC}"
        echo "   Add to backend/.env: ENVIRONMENT=$ENV"
    fi
else
    echo -e "${RED}❌ .env file not found${NC}"
    echo "   Create backend/.env from backend/.env.example"
    exit 1
fi

# 5. Test health endpoint (if server is running)
echo -e "\n${BLUE}🏥 Step 5: Testing health endpoint...${NC}"

if command -v systemctl &> /dev/null && systemctl is-active --quiet viably-backend; then
    echo "Testing local health endpoint..."
    
    if curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Health endpoint responding${NC}"
        curl -s http://localhost:8000/health | jq -r '.status' 2>/dev/null || echo "(jq not installed for pretty print)"
    else
        echo -e "${RED}❌ Health endpoint not responding${NC}"
        echo "   Start backend: systemctl start viably-backend"
    fi
elif docker ps | grep -q viably.*backend; then
    echo "Testing Docker health endpoint..."
    
    if curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Health endpoint responding${NC}"
    else
        echo -e "${RED}❌ Health endpoint not responding${NC}"
        echo "   Restart: docker-compose restart backend"
    fi
else
    echo -e "${YELLOW}⚠️  Backend not running (skipping test)${NC}"
fi

# 6. Test public endpoint (if on production)
if [[ "$ENV" == "production" ]]; then
    echo -e "\n${BLUE}🌐 Step 6: Testing public endpoint...${NC}"
    
    if curl -f -s -m 10 https://viably.dev/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Public health endpoint responding${NC}"
        curl -s https://viably.dev/api/health | jq -r '.status' 2>/dev/null || true
    else
        echo -e "${YELLOW}⚠️  Public endpoint not responding (may not be deployed yet)${NC}"
    fi
fi

# 7. Summary and next steps
echo ""
echo "================================"
echo -e "${GREEN}✅ Monitoring setup check complete!${NC}"
echo "================================"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. 🚀 Deploy to production:"
echo "   - Commit changes: git add . && git commit -m 'Add monitoring'"
echo "   - Push: git push origin main"
echo "   - SSH to prod: ssh root@<SERVER_IP>"
echo "   - Pull and restart: cd /path/to/viably && git pull && systemctl restart viably-backend"
echo ""
echo "2. 📊 Setup UptimeRobot:"
echo "   - Sign up: https://uptimerobot.com"
echo "   - Email: alexdevguru@gmail.com"
echo "   - Create monitors for:"
echo "     • https://viably.dev (Main Site)"
echo "     • https://viably.dev/api/health (Health Check)"
echo ""
echo "3. 🐛 Setup Sentry:"
echo "   - Sign up: https://sentry.io"
echo "   - Create projects: viably-backend, viably-frontend"
echo "   - Add DSN to production .env"
echo ""
echo "4. 💬 Create Telegram Bot:"
echo "   - Open @BotFather in Telegram"
echo "   - /newbot → 'Viably Monitor Bot'"
echo "   - Save bot token"
echo "   - Configure in UptimeRobot webhooks"
echo ""
echo "5. ✅ Test alerts:"
echo "   - Trigger test failure in UptimeRobot"
echo "   - Check Telegram for notification"
echo ""
echo "📖 Full documentation: ./MONITORING.md"
echo ""
