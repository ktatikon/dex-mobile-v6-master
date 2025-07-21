# 🏗️ DEX Mobile v6 - Microservices Architecture

## 📋 **Overview**

This directory contains all microservices for the DEX Mobile v6 application, consolidated from various locations in the codebase into a unified, standardized structure.

---

## 🎯 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- Docker & Docker Compose
- Redis server
- PostgreSQL database (Supabase)

### **Development Setup**
```bash
# Clone the repository
git clone https://github.com/ktatikon/dex-mobile-v6-master.git
cd dex-mobile-v6-master/microservices

# Start all services with Docker Compose
docker-compose -f ../docker-compose.microservices.yml up -d

# Or start individual services
cd kyc-service && npm install && npm run dev
cd aml-service && npm install && npm run dev
cd chart-api-service && npm install && npm run dev
```

### **Production Deployment**
```bash
# Build and deploy all services
../scripts/deploy-microservices.sh

# Or use Docker Compose for production
docker-compose -f ../docker-compose.microservices.yml up -d --build
```

---

## 📁 **Directory Structure**

```
microservices/
├── SERVICE_MANIFEST.md           # 📋 Complete service registry
├── README.md                     # 📖 This file
├── kyc-service/                  # 🆔 Identity verification service
│   ├── Dockerfile               # 🐳 Multi-stage container build
│   ├── package.json             # 📦 Dependencies & scripts
│   ├── index.js                 # 🚀 Main application entry
│   ├── controllers/             # 🎮 Request handlers
│   ├── services/                # 🔧 Business logic
│   ├── middlewares/             # 🛡️ Authentication & validation
│   ├── schemas/                 # 📝 Data validation schemas
│   └── __tests__/               # 🧪 Test suites
├── aml-service/                  # 🔍 Anti-money laundering service
│   ├── Dockerfile               # 🐳 Multi-stage container build
│   ├── package.json             # 📦 Dependencies & scripts
│   ├── index.js                 # 🚀 Main application entry
│   ├── controllers/             # 🎮 Request handlers
│   ├── services/                # 🔧 Business logic
│   ├── middlewares/             # 🛡️ Authentication & validation
│   ├── schemas/                 # 📝 Data validation schemas
│   └── __tests__/               # 🧪 Test suites
├── chart-api-service/            # 📊 Market data & charts service
│   ├── Dockerfile               # 🐳 Multi-stage container build
│   ├── package.json             # 📦 Dependencies & scripts
│   ├── tsconfig.json            # 🔧 TypeScript configuration
│   ├── src/                     # 📁 Source code
│   │   ├── server.ts            # 🚀 Main server file
│   │   ├── routes/              # 🛣️ API routes
│   │   ├── services/            # 🔧 Business logic
│   │   └── config/              # ⚙️ Configuration files
│   └── README.md                # 📖 Service documentation
├── monitoring-service/           # 📊 Health monitoring service
│   ├── Dockerfile               # 🐳 Multi-stage container build
│   ├── package.json             # 📦 Dependencies & scripts
│   ├── health-check.js          # 🚀 Main health check server
│   ├── scripts/                 # 📜 Utility scripts
│   ├── configs/                 # ⚙️ Configuration files
│   └── dashboards/              # 📊 Monitoring dashboards
└── blockchain-service/           # ⛓️ Multi-chain blockchain service
    ├── Dockerfile               # 🐳 Multi-stage container build
    ├── package.json             # 📦 Dependencies & scripts
    ├── tsconfig.json            # 🔧 TypeScript configuration
    └── src/                     # 📁 Source code
        ├── index.ts             # 🚀 Main application entry
        ├── routes/              # 🛣️ API routes
        ├── services/            # 🔧 Business logic
        └── config/              # ⚙️ Configuration files
```

---

## 🚀 **Services Overview**

### **Active Services**

| Service | Port | Technology | Purpose | Status |
|---------|------|------------|---------|--------|
| **KYC Service** | 4001 | Node.js + Express | Identity verification & compliance | ✅ Production Ready |
| **AML Service** | 4002 | Node.js + Express | Anti-money laundering screening | ✅ Production Ready |
| **Chart API Service** | 4000 | TypeScript + Express | Market data & chart generation | ✅ Production Ready |
| **Monitoring Service** | 3001 | Node.js + Express | Health checks & metrics | ✅ Production Ready |
| **Blockchain Service** | 5001 | TypeScript + Express | Multi-chain blockchain interaction | ✅ Production Ready |

### **Planned Services**
- **Trading Service** (Port 5002) - Uniswap V3 integration
- **Pool Service** (Port 5003) - Liquidity pool management
- **Quote Service** (Port 5004) - Real-time price calculations
- **Wallet Service** (Port 5005) - Multi-wallet support
- **Auth Service** (Port 5006) - JWT/OAuth authentication
- **Security Service** (Port 5007) - Encryption & MFA

---

## 🔧 **Development Guidelines**

### **Service Standards**
- ✅ **Multi-stage Dockerfiles** for development and production
- ✅ **Health check endpoints** at `/health`
- ✅ **Structured logging** with Winston
- ✅ **Error handling** with proper HTTP status codes
- ✅ **Input validation** with Joi schemas
- ✅ **Security headers** with Helmet
- ✅ **Rate limiting** for API protection
- ✅ **CORS configuration** for cross-origin requests

### **Code Quality**
- ✅ **ESLint** for code linting
- ✅ **Jest** for unit testing
- ✅ **Supertest** for API testing
- ✅ **Test coverage** reporting
- ✅ **CI/CD integration** with GitHub Actions

### **Security Best Practices**
- ✅ **Non-root user** in Docker containers
- ✅ **Minimal base images** (Alpine Linux)
- ✅ **Dependency scanning** with npm audit
- ✅ **Environment variable** injection
- ✅ **Secrets management** with AWS Secrets Manager

---

## 🌐 **API Documentation**

### **Common Endpoints**
All services implement these standard endpoints:

```http
GET /health                    # Health check
GET /metrics                   # Prometheus metrics
GET /info                      # Service information
```

### **Service-Specific APIs**

#### **KYC Service (Port 4001)**
```http
POST /api/kyc/aadhaar/verify   # Aadhaar verification
POST /api/kyc/pan/verify       # PAN verification
POST /api/kyc/passport/verify  # Passport verification
GET  /api/kyc/status/:id       # Verification status
```

#### **AML Service (Port 4002)**
```http
POST /api/aml/screen           # AML screening
GET  /api/aml/status/:id       # Screening status
POST /api/aml/update-lists     # Update PEP/sanctions lists
```

#### **Chart API Service (Port 4000)**
```http
GET  /api/charts/price/:symbol # Price data
GET  /api/charts/ohlc/:symbol  # OHLC data
GET  /api/charts/volume/:symbol # Volume data
```

#### **Blockchain Service (Port 5001)**
```http
GET  /api/blockchain/balance/:address    # Get balance
POST /api/blockchain/transaction         # Send transaction
GET  /api/blockchain/networks            # Supported networks
```

---

## 🐳 **Docker Configuration**

### **Build Commands**
```bash
# Build individual service
docker build -t dex-kyc-service ./kyc-service

# Build all services
docker-compose -f ../docker-compose.microservices.yml build

# Build with specific target
docker build --target production -t dex-kyc-service ./kyc-service
```

### **Environment Variables**
```bash
# Database
POSTGRES_URL=postgresql://user:pass@host:5432/db
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# Cache
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# External APIs
SIGNZY_API_KEY=your_signzy_key
COINGECKO_API_KEY=your_coingecko_key
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your_key
```

---

## 📊 **Monitoring & Observability**

### **Health Checks**
```bash
# Check all services
curl http://localhost:3001/health

# Check individual services
curl http://localhost:4001/health  # KYC
curl http://localhost:4002/health  # AML
curl http://localhost:4000/health  # Chart API
curl http://localhost:5001/health  # Blockchain
```

### **Metrics Collection**
- **Prometheus metrics** at `/metrics` endpoint
- **Custom business metrics** for each service
- **Performance monitoring** with response times
- **Error tracking** with structured logging

### **Logging**
- **Structured JSON logging** with Winston
- **Centralized log aggregation** with ELK stack
- **Log levels**: error, warn, info, debug
- **Request/response logging** with Morgan

---

## 🚀 **Deployment**

### **Local Development**
```bash
# Start with Docker Compose
docker-compose -f ../docker-compose.microservices.yml up -d

# Start individual service
cd kyc-service && npm run dev
```

### **Production Deployment**
```bash
# Deploy to AWS ECS
../scripts/deploy-microservices.sh

# Deploy with Terraform
cd ../infrastructure/terraform && terraform apply
```

### **Scaling Configuration**
- **Auto-scaling** based on CPU/memory usage
- **Load balancing** with Application Load Balancer
- **Service discovery** with AWS Service Discovery
- **Circuit breakers** for fault tolerance

---

## 🔍 **Troubleshooting**

### **Common Issues**
1. **Service won't start**: Check environment variables and dependencies
2. **Health check fails**: Verify service is listening on correct port
3. **Database connection**: Ensure PostgreSQL/Redis are accessible
4. **API calls fail**: Check authentication and rate limiting

### **Debug Commands**
```bash
# Check service logs
docker logs dex-kyc-service

# Check service status
docker ps | grep dex-

# Test service connectivity
curl -v http://localhost:4001/health
```

---

## 📚 **Additional Resources**

- 📋 [Service Manifest](./SERVICE_MANIFEST.md) - Complete service registry
- 🏗️ [Architecture Plan](../MICROSERVICES_ARCHITECTURE_IMPLEMENTATION_PLAN.md) - Implementation details
- 🔍 [Consolidation Audit](../MICROSERVICES_CONSOLIDATION_AUDIT.md) - Migration documentation
- 🐳 [Docker Compose](../docker-compose.microservices.yml) - Container orchestration
- 🚀 [Deployment Scripts](../scripts/deploy-microservices.sh) - Automation tools

---

*For detailed service-specific documentation, refer to the README.md file in each service directory.*
