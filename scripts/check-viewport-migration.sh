#!/bin/bash

# Script to check which pages still need GameViewport migration
# Usage: ./scripts/check-viewport-migration.sh

echo "🔍 Checking GameViewport Migration Status..."
echo ""
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
migrated=0
not_migrated=0

# Function to check if a file uses GameViewport
check_file() {
    local file=$1
    local display_name=$2
    
    if grep -q "GameViewport" "$file" 2>/dev/null; then
        echo -e "${GREEN}✅ $display_name${NC}"
        ((migrated++))
    else
        echo -e "${RED}❌ $display_name${NC}"
        ((not_migrated++))
    fi
}

echo "📱 Game Pages (High Priority):"
echo "---"
check_file "app/[locale]/dashboard/DashboardClient.tsx" "Dashboard"
check_file "app/[locale]/combat/[matchId]/page.tsx" "Combat Page"
check_file "app/[locale]/arena/[slug]/ArenaDetailClient.tsx" "Arena Detail"
check_file "app/[locale]/server-selection/page.tsx" "Server Selection"
check_file "app/[locale]/ludus-creation/LudusCreationClient.tsx" "Ludus Creation"
check_file "app/[locale]/initial-gladiators/page.tsx" "Initial Gladiators"
check_file "app/[locale]/gladiator/[id]/page.tsx" "Gladiator Detail"

echo ""
echo "🎯 Onboarding Pages (Medium Priority):"
echo "---"
check_file "app/[locale]/intro/page.tsx" "Intro Page"
check_file "app/[locale]/auth/page.tsx" "Auth Page"

echo ""
echo "🏠 Marketing Pages (Low Priority):"
echo "---"
check_file "app/[locale]/page.tsx" "Homepage"

echo ""
echo "================================================"
echo ""
echo -e "${GREEN}✅ Migrated: $migrated${NC}"
echo -e "${RED}❌ Not Migrated: $not_migrated${NC}"
echo ""

if [ $not_migrated -eq 0 ]; then
    echo -e "${GREEN}🎉 All pages migrated!${NC}"
else
    echo -e "${YELLOW}📋 $not_migrated page(s) still need migration${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review docs/GAME_VIEWPORT_GUIDE.md for migration patterns"
    echo "2. Check Dashboard or Combat page for examples"
    echo "3. Test on mobile devices after migration"
fi

echo ""

