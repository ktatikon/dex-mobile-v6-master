#!/bin/bash

echo "🧪 DEX Mobile v6 - Localhost Fix Verification Test"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
LOCALHOST_URL="http://localhost:8080"
NETWORK_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
NETWORK_URL="http://$NETWORK_IP:8080"

echo -e "${BLUE}🔍 Test Configuration:${NC}"
echo "   Localhost URL: $LOCALHOST_URL"
echo "   Network URL: $NETWORK_URL"
echo ""

# Function to test URL accessibility
test_url() {
    local url=$1
    local name=$2
    
    echo -e "${BLUE}🔄 Testing $name ($url)...${NC}"
    
    # Test basic connectivity
    if curl -s --max-time 5 "$url" > /dev/null; then
        echo -e "   ${GREEN}✅ Basic connectivity: PASS${NC}"
    else
        echo -e "   ${RED}❌ Basic connectivity: FAIL${NC}"
        return 1
    fi
    
    # Test if it returns HTML
    local response=$(curl -s --max-time 5 "$url")
    if echo "$response" | grep -q "<html\|<!DOCTYPE"; then
        echo -e "   ${GREEN}✅ HTML response: PASS${NC}"
    else
        echo -e "   ${RED}❌ HTML response: FAIL${NC}"
        return 1
    fi
    
    # Test if React app loads
    if echo "$response" | grep -q "root\|React\|Vite"; then
        echo -e "   ${GREEN}✅ React app detected: PASS${NC}"
    else
        echo -e "   ${YELLOW}⚠️  React app detection: UNCERTAIN${NC}"
    fi
    
    return 0
}

# Function to check port status
check_port() {
    local port=$1
    local service=$2
    
    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ Port $port ($service): RUNNING${NC}"
        return 0
    else
        echo -e "   ${RED}❌ Port $port ($service): NOT RUNNING${NC}"
        return 1
    fi
}

# Function to test service endpoints
test_service_endpoint() {
    local url=$1
    local service=$2
    
    echo -e "${BLUE}🔄 Testing $service endpoint ($url)...${NC}"
    
    if curl -s --max-time 3 "$url/health" > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ $service health check: PASS${NC}"
        return 0
    else
        echo -e "   ${YELLOW}⚠️  $service health check: FAIL (will use mock)${NC}"
        return 1
    fi
}

echo -e "${BLUE}📋 Step 1: Port Status Check${NC}"
echo "=============================="
check_port 8080 "Main App"
check_port 4001 "KYC Service"
check_port 4002 "AML Service"
check_port 4000 "Chart Service"
echo ""

echo -e "${BLUE}🌐 Step 2: URL Accessibility Test${NC}"
echo "=================================="

# Test localhost
if test_url "$LOCALHOST_URL" "Localhost"; then
    LOCALHOST_RESULT="PASS"
else
    LOCALHOST_RESULT="FAIL"
fi
echo ""

# Test network IP
if test_url "$NETWORK_URL" "Network IP"; then
    NETWORK_RESULT="PASS"
else
    NETWORK_RESULT="FAIL"
fi
echo ""

echo -e "${BLUE}🔧 Step 3: Service Endpoint Test${NC}"
echo "================================="
test_service_endpoint "http://localhost:4001/api/kyc" "KYC Service"
test_service_endpoint "http://localhost:4002/api/aml" "AML Service"
test_service_endpoint "http://localhost:4000/api/v1" "Chart Service"
echo ""

echo -e "${BLUE}🎭 Step 4: Mock Service Test${NC}"
echo "============================="

# Test if mock services are working by checking the file exists
if [ -f "src/services/mockKYCService.ts" ]; then
    echo -e "   ${GREEN}✅ Mock KYC service file: EXISTS${NC}"
else
    echo -e "   ${RED}❌ Mock KYC service file: MISSING${NC}"
fi

# Check if KYC service has mock integration
if grep -q "useMockService" src/services/kycApiService.ts; then
    echo -e "   ${GREEN}✅ Mock service integration: ENABLED${NC}"
else
    echo -e "   ${RED}❌ Mock service integration: MISSING${NC}"
fi

# Check if getServiceURL method exists
if grep -q "getServiceURL" src/services/kycApiService.ts; then
    echo -e "   ${GREEN}✅ Dynamic URL resolution: ENABLED${NC}"
else
    echo -e "   ${RED}❌ Dynamic URL resolution: MISSING${NC}"
fi
echo ""

echo -e "${BLUE}⚙️  Step 5: Configuration Check${NC}"
echo "==============================="

# Check Vite config
if grep -q 'host: "0.0.0.0"' vite.config.ts; then
    echo -e "   ${GREEN}✅ Vite host binding: CORRECT (0.0.0.0)${NC}"
else
    echo -e "   ${RED}❌ Vite host binding: INCORRECT${NC}"
fi

# Check HMR config
if grep -q 'host: "0.0.0.0"' vite.config.ts && grep -A5 "hmr:" vite.config.ts | grep -q '0.0.0.0'; then
    echo -e "   ${GREEN}✅ HMR configuration: CORRECT${NC}"
else
    echo -e "   ${YELLOW}⚠️  HMR configuration: CHECK NEEDED${NC}"
fi

# Check development config
if [ -f ".env.development" ]; then
    echo -e "   ${GREEN}✅ Development config: EXISTS${NC}"
else
    echo -e "   ${YELLOW}⚠️  Development config: MISSING (optional)${NC}"
fi
echo ""

echo -e "${BLUE}📊 Step 6: Final Results${NC}"
echo "========================"

echo -e "Test Results Summary:"
echo -e "   Localhost Access: ${LOCALHOST_RESULT == "PASS" && echo -e "${GREEN}✅ PASS${NC}" || echo -e "${RED}❌ FAIL${NC}"}"
echo -e "   Network IP Access: ${NETWORK_RESULT == "PASS" && echo -e "${GREEN}✅ PASS${NC}" || echo -e "${RED}❌ FAIL${NC}"}"

if [ "$LOCALHOST_RESULT" == "PASS" ] && [ "$NETWORK_RESULT" == "PASS" ]; then
    echo ""
    echo -e "${GREEN}🎉 SUCCESS: Both localhost and network IP access are working!${NC}"
    echo -e "${GREEN}✅ The localhost fix has been successfully applied.${NC}"
    echo ""
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo "   1. Test authentication flow on both URLs"
    echo "   2. Verify KYC services work (with mock fallback)"
    echo "   3. Test all major app features"
    echo ""
    echo -e "${BLUE}🔗 Access URLs:${NC}"
    echo "   • Localhost: $LOCALHOST_URL"
    echo "   • Network: $NETWORK_URL"
    
elif [ "$LOCALHOST_RESULT" == "FAIL" ] && [ "$NETWORK_RESULT" == "PASS" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  PARTIAL SUCCESS: Network IP works, localhost needs attention${NC}"
    echo ""
    echo -e "${BLUE}🔧 Troubleshooting Steps:${NC}"
    echo "   1. Check if dev server is running: npm run dev"
    echo "   2. Verify port 8080 is not blocked by firewall"
    echo "   3. Try restarting the dev server"
    echo "   4. Check browser console for errors"
    
elif [ "$LOCALHOST_RESULT" == "PASS" ] && [ "$NETWORK_RESULT" == "FAIL" ]; then
    echo ""
    echo -e "${YELLOW}⚠️  PARTIAL SUCCESS: Localhost works, network IP needs attention${NC}"
    echo ""
    echo -e "${BLUE}🔧 Troubleshooting Steps:${NC}"
    echo "   1. Check network connectivity"
    echo "   2. Verify firewall allows port 8080"
    echo "   3. Confirm network IP is correct: $NETWORK_IP"
    
else
    echo ""
    echo -e "${RED}❌ FAILURE: Both localhost and network IP access are failing${NC}"
    echo ""
    echo -e "${BLUE}🔧 Troubleshooting Steps:${NC}"
    echo "   1. Restart dev server: npm run dev"
    echo "   2. Check if port 8080 is available: lsof -i :8080"
    echo "   3. Verify Vite configuration"
    echo "   4. Check for any error messages in terminal"
    echo "   5. Try alternative port: npm run dev -- --port 3000"
fi

echo ""
echo -e "${BLUE}📞 Support:${NC}"
echo "   If issues persist, check the terminal output for detailed error messages"
echo "   and verify all services are running with: ./start-dev-services.sh"
echo ""
echo -e "${BLUE}🔍 Debug Commands:${NC}"
echo "   • Check running processes: lsof -i :8080"
echo "   • View dev server logs: Check terminal where 'npm run dev' is running"
echo "   • Test API endpoints: curl http://localhost:8080/api/health"
echo ""

exit 0
