# 🚀 KYC/AML Microservices Deployment Guide

## ✅ **DEPLOYMENT STATUS: FULLY OPERATIONAL**

Both KYC and AML microservices are successfully deployed and running on the local network with comprehensive error resolution completed.

---

## 🔧 **Quick Start Instructions**

### **1. Prerequisites**
- Node.js >= 16.0.0
- Redis server running on localhost:6379
- Git repository: https://github.com/ktatikon/dex-mobile-v6-master.git

### **2. Installation & Setup**
```bash
# Navigate to services directory
cd services

# Install all dependencies
npm run install:all

# Create environment file (already configured)
cp .env.example .env

# Start Redis (if not running)
redis-server

# Create logs directory
mkdir -p logs && touch logs/combined.log logs/error.log
```

### **3. Start Services**
```bash
# Start both services
npm run dev

# Or start individually
npm run dev:kyc    # KYC Service on port 4001
npm run dev:aml    # AML Service on port 4002
```

### **4. Verify Deployment**
```bash
# Test health endpoints
curl http://localhost:4001/health
curl http://localhost:4002/health

# Run comprehensive tests
./test-endpoints.sh
```

---

## 🌐 **Network Access Configuration**

### **Local Network Access**
Both services are configured to accept connections from:
- ✅ localhost (127.0.0.1)
- ✅ Local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
- ✅ Mobile devices on same network

### **Current Network Endpoints**
- **KYC Service**: http://192.168.1.4:4001
- **AML Service**: http://192.168.1.4:4002

### **CORS Configuration**
Services accept requests from:
- React development servers (localhost:3000, localhost:5173)
- Local network devices
- Mobile applications (no origin header)

---

## 🔐 **Authentication & Security**

### **API Key Authentication**
All endpoints require authentication via `X-API-Key` header:
```bash
curl -H "X-API-Key: super_secure_admin_key_change_in_production" \
     http://localhost:4001/health
```

### **Security Features**
- ✅ Rate limiting (30 req/min general, 5 req/5min sensitive)
- ✅ Helmet security headers
- ✅ PII data masking in logs
- ✅ Input sanitization and validation
- ✅ CORS protection with local network support

---

## 📋 **API Endpoints Reference**

### **KYC Service (Port 4001)**

#### **Health & Status**
```bash
GET  /health                           # Service health check
GET  /api/kyc/status/:userId          # User KYC status
GET  /api/kyc/progress/:userId        # KYC completion progress
```

#### **Aadhaar Verification**
```bash
POST /api/kyc/aadhaar/validate        # Validate Aadhaar format
POST /api/kyc/aadhaar/otp/initiate    # Start OTP verification
POST /api/kyc/aadhaar/otp/verify      # Verify OTP
POST /api/kyc/aadhaar/otp/resend      # Resend OTP
```

#### **PAN & Passport**
```bash
POST /api/kyc/pan/validate            # Validate PAN format
POST /api/kyc/pan/verify              # Verify PAN with NSDL
POST /api/kyc/passport/validate       # Validate passport format
POST /api/kyc/passport/verify         # Verify passport
```

### **AML Service (Port 4002)**

#### **Health & Status**
```bash
GET  /health                          # Service health check
GET  /api/aml/status/:userId          # User AML status
```

#### **Screening Operations**
```bash
POST /api/aml/screen                  # Comprehensive screening
POST /api/aml/sanctions/check         # Sanctions list check
POST /api/aml/pep/check              # PEP list check
POST /api/aml/risk/assess            # Risk assessment
```

---

## 🧪 **Testing Examples**

### **KYC Testing**
```bash
# Test Aadhaar validation
curl -X POST -H "X-API-Key: super_secure_admin_key_change_in_production" \
     -H "Content-Type: application/json" \
     -d '{"aadhaarNumber": "234567890123"}' \
     http://localhost:4001/api/kyc/aadhaar/validate

# Test PAN validation
curl -X POST -H "X-API-Key: super_secure_admin_key_change_in_production" \
     -H "Content-Type: application/json" \
     -d '{"panNumber": "ABCDE1234F"}' \
     http://localhost:4001/api/kyc/pan/validate
```

### **AML Testing**
```bash
# Test sanctions screening
curl -X POST -H "X-API-Key: super_secure_admin_key_change_in_production" \
     -H "Content-Type: application/json" \
     -d '{"fullName": "John Doe", "country": "IN", "userId": "550e8400-e29b-41d4-a716-446655440000"}' \
     http://localhost:4002/api/aml/sanctions/check

# Test risk assessment
curl -X POST -H "X-API-Key: super_secure_admin_key_change_in_production" \
     -H "Content-Type: application/json" \
     -d '{"userId": "550e8400-e29b-41d4-a716-446655440000", "riskFactors": {"transactionVolume": 0.3}}' \
     http://localhost:4002/api/aml/risk/assess
```

---

## 🔧 **Troubleshooting**

### **Common Issues & Solutions**

#### **Service Won't Start**
```bash
# Check if ports are available
lsof -i :4001
lsof -i :4002

# Check Redis connection
redis-cli ping

# Check environment variables
node -e "require('dotenv').config({path: '.env'}); console.log('API Key:', process.env.INTERNAL_API_KEY);"
```

#### **Authentication Errors**
- Verify API key in `.env` file
- Ensure `X-API-Key` header is included in requests
- Check rate limiting (wait 1 minute if exceeded)

#### **Network Access Issues**
- Verify firewall settings allow ports 4001, 4002
- Check local IP address: `ifconfig | grep "inet "`
- Test with curl from another device on network

#### **Redis Connection Issues**
```bash
# Start Redis server
redis-server

# Check Redis status
redis-cli ping

# Check Redis configuration in .env
REDIS_HOST=localhost
REDIS_PORT=6379
```

### **Log Files**
- **Combined logs**: `services/logs/combined.log`
- **Error logs**: `services/logs/error.log`
- **Service logs**: Check terminal output

---

## 🔄 **Integration with DEX Application**

### **Frontend Integration**
Services are ready to integrate with existing React components:
- KYCContext.tsx
- KYCForm components
- Wallet authentication flows

### **Environment Variables for Frontend**
```env
REACT_APP_KYC_SERVICE_URL=http://192.168.1.4:4001
REACT_APP_AML_SERVICE_URL=http://192.168.1.4:4002
REACT_APP_KYC_API_KEY=super_secure_admin_key_change_in_production
```

### **Service Integration Pattern**
```javascript
// Example frontend integration
const kycService = {
  baseURL: process.env.REACT_APP_KYC_SERVICE_URL,
  apiKey: process.env.REACT_APP_KYC_API_KEY,
  
  async validateAadhaar(aadhaarNumber) {
    const response = await fetch(`${this.baseURL}/api/kyc/aadhaar/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify({ aadhaarNumber })
    });
    return response.json();
  }
};
```

---

## 📊 **Production Readiness**

### **✅ Completed Features**
- Enterprise-grade authentication and authorization
- Comprehensive input validation and sanitization
- Rate limiting and security headers
- PII data masking and audit logging
- Local network accessibility
- Error handling and recovery
- Health monitoring endpoints
- Redis caching and session management

### **🚀 Ready for Next Phase**
- IDfy API integration (sandbox configured)
- Supabase database integration
- Docker containerization
- Production deployment
- Mobile app integration

---

## 📞 **Support & Maintenance**

### **Service Management**
```bash
# Check service status
npm run health

# View logs
tail -f logs/combined.log

# Restart services
npm run dev

# Stop services
pkill -f "node index.js"
```

### **Monitoring**
- Health endpoints provide service status
- Redis connectivity monitoring
- Automatic error logging and alerting
- Performance metrics collection ready

---

**🎉 DEPLOYMENT COMPLETE - SERVICES FULLY OPERATIONAL**
