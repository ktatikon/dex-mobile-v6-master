# 📋 DEX Mobile v6 - Microservices Manifest

## 🏗️ **Service Registry & Index**

This document provides a comprehensive index of all microservices in the DEX Mobile v6 ecosystem, their configurations, and inter-service dependencies.

---

## 📊 **Service Overview**

| Service | Port | Status | Docker | Health Check | Purpose |
|---------|------|--------|--------|--------------|---------|
| **KYC Service** | 4001 | ✅ Active | ✅ Ready | `/health` | Identity verification & compliance |
| **AML Service** | 4002 | ✅ Active | ✅ Ready | `/health` | Anti-money laundering screening |
| **Chart API Service** | 4000 | ✅ Active | ✅ Ready | `/health` | Market data & chart generation |
| **Monitoring Service** | 3001 | ✅ Active | ✅ Ready | `/health` | Health checks & metrics collection |
| **Blockchain Service** | 5001 | ✅ Active | ✅ Ready | `/health` | Multi-chain blockchain interaction |
| **Trading Service** | 5002 | 🔄 Planned | 🔄 Pending | `/health` | Uniswap V3 integration & swap execution |
| **Pool Service** | 5003 | 🔄 Planned | 🔄 Pending | `/health` | Liquidity pool data management |
| **Quote Service** | 5004 | 🔄 Planned | 🔄 Pending | `/health` | Real-time price calculations |
| **Wallet Service** | 5005 | 🔄 Planned | 🔄 Pending | `/health` | Multi-wallet support & management |
| **Auth Service** | 5006 | 🔄 Planned | 🔄 Pending | `/health` | JWT/OAuth authentication |
| **Security Service** | 5007 | 🔄 Planned | 🔄 Pending | `/health` | Encryption & MFA |

---

## 🔧 **Service Configurations**

### **KYC Service** (`/microservices/kyc-service/`)
```yaml
Name: kyc-service
Port: 4001
Technology: Node.js + Express
Database: Supabase PostgreSQL
Cache: Redis
External APIs: IDfy, NSDL, Aadhaar
Health Check: GET /health
Docker: ✅ Multi-stage Dockerfile
Dependencies:
  - Redis (session management)
  - Supabase (user data)
  - IDfy API (verification)
Environment Variables:
  - SIGNZY_API_KEY
  - UQUDO_API_KEY
  - NSDL_API_KEY
  - REDIS_URL
  - SUPABASE_URL
```

### **AML Service** (`/microservices/aml-service/`)
```yaml
Name: aml-service
Port: 4002
Technology: Node.js + Express
Database: Supabase PostgreSQL
Cache: Redis
External APIs: IDfy, PEP Lists
Health Check: GET /health
Docker: ✅ Multi-stage Dockerfile
Dependencies:
  - Redis (caching)
  - Supabase (screening data)
  - IDfy API (AML screening)
Environment Variables:
  - SIGNZY_API_KEY
  - REDIS_URL
  - SUPABASE_URL
```

### **Chart API Service** (`/microservices/chart-api-service/`)
```yaml
Name: chart-api-service
Port: 4000
Technology: TypeScript + Express
Database: None (stateless)
Cache: Redis
External APIs: CoinGecko, TradingView
Health Check: GET /health
Docker: ✅ Multi-stage Dockerfile (existing)
Dependencies:
  - Redis (price caching)
  - CoinGecko API (market data)
Environment Variables:
  - COINGECKO_API_KEY
  - REDIS_URL
  - REDIS_PASSWORD
```

### **Monitoring Service** (`/microservices/monitoring-service/`)
```yaml
Name: monitoring-service
Port: 3001
Technology: Node.js + Express
Database: None (metrics only)
Cache: Redis (optional)
External APIs: None
Health Check: GET /health
Docker: ✅ Multi-stage Dockerfile
Dependencies:
  - All other services (health monitoring)
Environment Variables:
  - HEALTH_CHECK_PORT
  - SERVICES_TO_MONITOR
```

### **Blockchain Service** (`/microservices/blockchain-service/`)
```yaml
Name: blockchain-service
Port: 5001
Technology: TypeScript + Express
Database: Supabase PostgreSQL
Cache: Redis
External APIs: Infura, Alchemy, RPC endpoints
Health Check: GET /health
Docker: ✅ Multi-stage Dockerfile
Dependencies:
  - Redis (transaction caching)
  - Supabase (transaction history)
  - RPC endpoints (blockchain interaction)
Environment Variables:
  - ETHEREUM_RPC_URL
  - POLYGON_RPC_URL
  - BSC_RPC_URL
  - ARBITRUM_RPC_URL
  - REDIS_URL
  - POSTGRES_URL
```

---

## 🌐 **Service Communication Matrix**

| Service | Calls | Called By | Communication Type |
|---------|-------|-----------|-------------------|
| **KYC Service** | AML Service, Supabase | Auth Service, Frontend | HTTP REST |
| **AML Service** | IDfy API, Supabase | KYC Service, Trading Service | HTTP REST |
| **Chart API Service** | CoinGecko API, Redis | Frontend, Trading Service | HTTP REST |
| **Monitoring Service** | All Services | DevOps, Alerting | HTTP REST |
| **Blockchain Service** | RPC Endpoints, Redis | Trading Service, Wallet Service | HTTP REST |

---

## 🔗 **Inter-Service Dependencies**

### **Critical Dependencies:**
- **Database**: All services → Supabase PostgreSQL
- **Cache**: All services → Redis
- **Authentication**: All services → Auth Service (planned)
- **Monitoring**: All services → Monitoring Service

### **External Dependencies:**
- **KYC/AML**: IDfy API, NSDL API, Aadhaar API
- **Market Data**: CoinGecko API, TradingView API
- **Blockchain**: Infura, Alchemy, RPC endpoints
- **Payments**: PayPal API, PhonePe API (planned)

---

## 🐳 **Docker Configuration**

### **Existing Dockerfiles:**
- ✅ **KYC Service**: Multi-stage, security-hardened
- ✅ **AML Service**: Multi-stage, security-hardened
- ✅ **Chart API Service**: Multi-stage, TypeScript build
- ✅ **Monitoring Service**: Multi-stage, health-focused
- ✅ **Blockchain Service**: Multi-stage, TypeScript build

### **Docker Standards Applied:**
- 🔒 **Non-root user execution** (nodejs:1001)
- 🏔️ **Alpine Linux base images** for minimal footprint
- 🏗️ **Multi-stage builds** (development + production)
- 🩺 **Health check endpoints** for all services
- 🛡️ **Security scanning** integration ready
- 📦 **Dependency optimization** with npm ci

---

## 🔧 **Environment Configuration**

### **Common Environment Variables:**
```bash
# Database
POSTGRES_URL=postgresql://postgres:password@host:5432/dex_mobile
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# Cache
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key

# Monitoring
LOG_LEVEL=info
NODE_ENV=production
```

### **Service-Specific Variables:**
```bash
# KYC Service
SIGNZY_API_KEY=your_signzy_key
UQUDO_API_KEY=your_uqudo_key
NSDL_API_KEY=your_nsdl_key

# Chart API Service
COINGECKO_API_KEY=your_coingecko_key

# Blockchain Service
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your_key
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/your_key
BSC_RPC_URL=https://bsc-dataseed.binance.org/
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
```

---

## 📊 **Service Health Monitoring**

### **Health Check Endpoints:**
- **KYC Service**: `GET http://localhost:4001/health`
- **AML Service**: `GET http://localhost:4002/health`
- **Chart API Service**: `GET http://localhost:4000/health`
- **Monitoring Service**: `GET http://localhost:3001/health`
- **Blockchain Service**: `GET http://localhost:5001/health`

### **Health Check Response Format:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "service": "service-name",
  "version": "1.0.0",
  "uptime": 3600,
  "dependencies": {
    "database": "connected",
    "redis": "connected",
    "external_api": "connected"
  },
  "metrics": {
    "memory_usage": "45MB",
    "cpu_usage": "2%",
    "active_connections": 12
  }
}
```

---

## 🚀 **Deployment Configuration**

### **Docker Compose Integration:**
All services are configured in `docker-compose.microservices.yml` with:
- Service discovery via Docker networks
- Environment variable injection
- Volume mounts for persistent data
- Health check configurations
- Restart policies

### **Production Deployment:**
- **Container Orchestration**: AWS ECS Fargate
- **Load Balancing**: Application Load Balancer
- **Service Discovery**: AWS Service Discovery
- **Monitoring**: CloudWatch + Prometheus
- **Logging**: Centralized logging with ELK stack

---

## 📈 **Scaling Configuration**

### **Auto-scaling Targets:**
- **CPU Utilization**: < 70%
- **Memory Utilization**: < 80%
- **Response Time**: < 200ms
- **Error Rate**: < 1%

### **Resource Allocation:**
| Service | CPU | Memory | Min Instances | Max Instances |
|---------|-----|--------|---------------|---------------|
| KYC Service | 0.25 vCPU | 512MB | 1 | 5 |
| AML Service | 0.25 vCPU | 512MB | 1 | 3 |
| Chart API Service | 0.5 vCPU | 1GB | 2 | 10 |
| Monitoring Service | 0.25 vCPU | 256MB | 1 | 2 |
| Blockchain Service | 0.5 vCPU | 1GB | 2 | 8 |

---

*This manifest is automatically updated as services are added, modified, or removed from the microservices ecosystem.*
