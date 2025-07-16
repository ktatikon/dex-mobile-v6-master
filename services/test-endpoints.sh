#!/bin/bash

# KYC/AML Microservices API Testing Script
# This script tests the key endpoints of both services

echo "🧪 Testing KYC/AML Microservices API Endpoints"
echo "=============================================="

# API Key for testing
API_KEY="super_secure_admin_key_change_in_production"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local method=$1
    local url=$2
    local data=$3
    local description=$4
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    echo "URL: $method $url"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
            -H "X-API-Key: $API_KEY" \
            -H "Content-Type: application/json" \
            "$url")
    else
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
            -X "$method" \
            -H "X-API-Key: $API_KEY" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$url")
    fi
    
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_CODE:/d')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✅ SUCCESS (HTTP $http_code)${NC}"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ FAILED (HTTP $http_code)${NC}"
        echo "$body"
    fi
}

echo -e "\n🔍 1. HEALTH CHECKS"
echo "=================="

test_endpoint "GET" "http://localhost:4001/health" "" "KYC Service Health Check"
test_endpoint "GET" "http://localhost:4002/health" "" "AML Service Health Check"

echo -e "\n🆔 2. KYC SERVICE TESTS"
echo "======================"

# Test Aadhaar validation
test_endpoint "POST" "http://localhost:4001/api/kyc/aadhaar/validate" \
    '{"aadhaarNumber": "123412341234"}' \
    "Aadhaar Number Validation"

# Test PAN validation
test_endpoint "POST" "http://localhost:4001/api/kyc/pan/validate" \
    '{"panNumber": "ABCDE1234F"}' \
    "PAN Number Validation"

# Test Passport validation
test_endpoint "POST" "http://localhost:4001/api/kyc/passport/validate" \
    '{"passportNumber": "M1234567", "dateOfBirth": "1990-01-01"}' \
    "Passport Number Validation"

# Test KYC status
test_endpoint "GET" "http://localhost:4001/api/kyc/status/550e8400-e29b-41d4-a716-446655440000" "" \
    "KYC Status Check"

echo -e "\n🛡️ 3. AML SERVICE TESTS"
echo "======================"

# Test sanctions check
test_endpoint "POST" "http://localhost:4002/api/aml/sanctions/check" \
    '{"fullName": "John Doe", "country": "IN", "userId": "550e8400-e29b-41d4-a716-446655440000"}' \
    "Sanctions List Check"

# Test PEP check
test_endpoint "POST" "http://localhost:4002/api/aml/pep/check" \
    '{"personalInfo": {"firstName": "John", "lastName": "Doe", "country": "IN"}, "userId": "550e8400-e29b-41d4-a716-446655440000"}' \
    "PEP List Check"

# Test risk assessment
test_endpoint "POST" "http://localhost:4002/api/aml/risk/assess" \
    '{"userId": "550e8400-e29b-41d4-a716-446655440000", "riskFactors": {"transactionVolume": 0.3}}' \
    "Risk Assessment"

# Test AML screening status
test_endpoint "GET" "http://localhost:4002/api/aml/status/550e8400-e29b-41d4-a716-446655440000" "" \
    "AML Screening Status"

echo -e "\n🔒 4. AUTHENTICATION TESTS"
echo "========================="

# Test without API key (should fail)
echo -e "\n${YELLOW}Testing: Authentication Failure (No API Key)${NC}"
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -H "Content-Type: application/json" \
    "http://localhost:4001/api/kyc/status/550e8400-e29b-41d4-a716-446655440000")

http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
if [ "$http_code" -eq 401 ] || [ "$http_code" -eq 403 ]; then
    echo -e "${GREEN}✅ SUCCESS - Authentication properly rejected (HTTP $http_code)${NC}"
else
    echo -e "${RED}❌ FAILED - Authentication should have been rejected (HTTP $http_code)${NC}"
fi

echo -e "\n🌐 5. NETWORK ACCESSIBILITY TEST"
echo "==============================="

# Get local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
echo "Local IP Address: $LOCAL_IP"

if [ ! -z "$LOCAL_IP" ]; then
    test_endpoint "GET" "http://$LOCAL_IP:4001/health" "" "KYC Service - Local Network Access"
    test_endpoint "GET" "http://$LOCAL_IP:4002/health" "" "AML Service - Local Network Access"
else
    echo -e "${YELLOW}⚠️ Could not determine local IP address${NC}"
fi

echo -e "\n📊 TESTING COMPLETE"
echo "==================="
echo -e "${GREEN}✅ KYC Service: http://localhost:4001${NC}"
echo -e "${GREEN}✅ AML Service: http://localhost:4002${NC}"
echo -e "${YELLOW}📖 API Documentation: See services/README.md${NC}"
