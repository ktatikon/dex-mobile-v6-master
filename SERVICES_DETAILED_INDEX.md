# 🛠️ DEX Mobile v6 - Services Detailed Index

## 📋 **Services Architecture Overview**

This document provides a comprehensive index of all services in the DEX Mobile v6 application, including both frontend services (`/src/services/`) and backend microservices (`/microservices/`).

---

## 🎯 **Frontend Services** (`/src/services/`)

### **🔗 Core Blockchain Services**

#### **`blockchainService.ts`**
- **Purpose:** Multi-chain blockchain interaction management
- **Features:** Network switching, RPC management, transaction broadcasting
- **Networks:** Ethereum, Polygon, BSC, Arbitrum
- **Dependencies:** ethers.js, network configurations
- **Key Methods:** `switchNetwork()`, `getBalance()`, `sendTransaction()`

#### **`dexSwapService.ts`**
- **Purpose:** DEX swap execution and routing
- **Features:** Multi-DEX routing, price comparison, slippage protection
- **Integrations:** Uniswap V3, 1inch, PancakeSwap
- **Dependencies:** Uniswap SDK, routing algorithms
- **Key Methods:** `executeSwap()`, `getQuote()`, `calculateSlippage()`

#### **`uniswapV3Service.ts`**
- **Purpose:** Uniswap V3 protocol integration
- **Features:** Pool data, liquidity provision, concentrated liquidity
- **Dependencies:** @uniswap/v3-sdk, @uniswap/smart-order-router
- **Key Methods:** `getPoolData()`, `addLiquidity()`, `removeLiquidity()`

#### **`ethersService.ts`**
- **Purpose:** Ethereum blockchain interaction wrapper
- **Features:** Contract interaction, transaction management
- **Dependencies:** ethers.js, contract ABIs
- **Key Methods:** `getContract()`, `callContract()`, `estimateGas()`

### **💰 Wallet Management Services**

#### **`walletService.ts`**
- **Purpose:** Primary wallet management service
- **Features:** Multi-wallet support, balance tracking, transaction history
- **Dependencies:** Supabase, blockchain services
- **Key Methods:** `createWallet()`, `importWallet()`, `getBalance()`

#### **`comprehensiveWalletService.ts`**
- **Purpose:** Enhanced wallet operations and analytics
- **Features:** Portfolio tracking, performance analytics, risk assessment
- **Dependencies:** walletService, portfolioService
- **Key Methods:** `getPortfolioAnalytics()`, `calculateRisk()`

#### **`unifiedWalletService.ts`**
- **Purpose:** Unified interface for all wallet types
- **Features:** Hardware wallet support, multi-signature wallets
- **Dependencies:** MetaMask SDK, WalletConnect, hardware wallet libraries
- **Key Methods:** `connectWallet()`, `signTransaction()`, `getWalletInfo()`

#### **`walletGenerationService.ts`**
- **Purpose:** Secure wallet generation and key management
- **Features:** Mnemonic generation, key derivation, secure storage
- **Dependencies:** bip39, hdkey, crypto libraries
- **Key Methods:** `generateWallet()`, `deriveKeys()`, `secureStore()`

#### **`hotWalletService.ts`**
- **Purpose:** Hot wallet management for quick transactions
- **Features:** Fast transaction execution, gas optimization
- **Dependencies:** ethers.js, gas optimization service
- **Key Methods:** `quickSend()`, `optimizeGas()`, `batchTransactions()`

### **📊 Market Data & Analytics Services**

#### **`chartDataService.ts`**
- **Purpose:** Market data processing and chart generation
- **Features:** Real-time price data, technical indicators, chart rendering
- **Dependencies:** CoinGecko API, TradingView data
- **Key Methods:** `getPriceData()`, `calculateIndicators()`, `generateChart()`

#### **`realTimeDataManager.ts`**
- **Purpose:** Real-time data streaming and management
- **Features:** WebSocket connections, data caching, event handling
- **Dependencies:** WebSocket APIs, Redis caching
- **Key Methods:** `subscribeToPrice()`, `handleDataUpdate()`, `cacheData()`

#### **`portfolioService.ts`**
- **Purpose:** Portfolio tracking and analytics
- **Features:** Asset allocation, performance tracking, P&L calculation
- **Dependencies:** market data services, wallet services
- **Key Methods:** `calculatePortfolio()`, `trackPerformance()`, `generateReport()`

#### **`poolDataService.ts`**
- **Purpose:** Liquidity pool data management
- **Features:** Pool analytics, APY calculations, liquidity tracking
- **Dependencies:** Uniswap subgraph, DEX APIs
- **Key Methods:** `getPoolInfo()`, `calculateAPY()`, `trackLiquidity()`

### **🔐 Security & Compliance Services**

#### **`authValidationService.ts`**
- **Purpose:** Authentication and authorization validation
- **Features:** JWT validation, session management, role-based access
- **Dependencies:** Supabase Auth, JWT libraries
- **Key Methods:** `validateToken()`, `checkPermissions()`, `refreshSession()`

#### **`mfaService.ts`**
- **Purpose:** Multi-factor authentication implementation
- **Features:** TOTP, SMS verification, biometric authentication
- **Dependencies:** authenticator libraries, SMS APIs
- **Key Methods:** `generateTOTP()`, `verifyCode()`, `enableBiometric()`

#### **`securityComplianceService.ts`**
- **Purpose:** Enterprise security compliance
- **Features:** Security auditing, compliance reporting, threat detection
- **Dependencies:** security libraries, audit logging
- **Key Methods:** `auditTransaction()`, `detectThreat()`, `generateReport()`

#### **`kycApiService.ts`**
- **Purpose:** KYC verification API integration
- **Features:** Document verification, identity validation, compliance checking
- **Dependencies:** IDfy API, government databases
- **Key Methods:** `verifyDocument()`, `validateIdentity()`, `checkCompliance()`

#### **`amlService.ts`**
- **Purpose:** Anti-money laundering screening
- **Features:** Transaction monitoring, sanctions screening, risk scoring
- **Dependencies:** AML databases, screening APIs
- **Key Methods:** `screenTransaction()`, `checkSanctions()`, `calculateRisk()`

### **💳 Payment & Financial Services**

#### **`paypalService.ts`**
- **Purpose:** PayPal payment gateway integration
- **Features:** Payment processing, refunds, multi-currency support
- **Dependencies:** PayPal SDK, payment APIs
- **Key Methods:** `processPayment()`, `handleRefund()`, `convertCurrency()`

#### **`phonepeService.ts`**
- **Purpose:** PhonePe UPI payment integration
- **Features:** UPI payments, QR code generation, transaction verification
- **Dependencies:** PhonePe API, UPI protocols
- **Key Methods:** `initiateUPI()`, `generateQR()`, `verifyPayment()`

#### **`fiatWalletService.ts`**
- **Purpose:** Fiat currency wallet management
- **Features:** Fiat balance tracking, currency conversion, transaction history
- **Dependencies:** banking APIs, currency services
- **Key Methods:** `getFiatBalance()`, `convertCurrency()`, `trackTransaction()`

#### **`tdsComplianceService.ts`**
- **Purpose:** Tax Deducted at Source compliance (India)
- **Features:** TDS calculation, tax reporting, compliance documentation
- **Dependencies:** Indian tax APIs, compliance databases
- **Key Methods:** `calculateTDS()`, `generateReport()`, `submitCompliance()`

### **🏢 Enterprise Services**

#### **`enterpriseServiceIntegrator.ts`**
- **Purpose:** Enterprise service orchestration and integration
- **Features:** Service coordination, enterprise patterns, monitoring
- **Dependencies:** All enterprise services
- **Key Methods:** `orchestrateServices()`, `monitorHealth()`, `handleFailover()`

#### **`mevProtectionService.ts`**
- **Purpose:** Maximal Extractable Value protection
- **Features:** MEV detection, transaction protection, front-running prevention
- **Dependencies:** MEV protection protocols, flashbots
- **Key Methods:** `detectMEV()`, `protectTransaction()`, `analyzeRisk()`

#### **`gasOptimizationService.ts`**
- **Purpose:** Transaction gas cost optimization
- **Features:** Gas price prediction, transaction batching, optimization algorithms
- **Dependencies:** gas price APIs, optimization libraries
- **Key Methods:** `optimizeGas()`, `predictPrice()`, `batchTransactions()`

### **🔄 Real-Time & Communication Services**

#### **`webSocketDataService.ts`**
- **Purpose:** WebSocket connection management
- **Features:** Real-time data streaming, connection handling, reconnection logic
- **Dependencies:** WebSocket libraries, event emitters
- **Key Methods:** `connect()`, `subscribe()`, `handleReconnection()`

#### **`realTimeOrderBook.ts`**
- **Purpose:** Real-time order book management
- **Features:** Order book updates, depth analysis, trade execution
- **Dependencies:** exchange APIs, WebSocket services
- **Key Methods:** `updateOrderBook()`, `analyzeDepth()`, `executeTrade()`

#### **`realTimeTokenSearchService.ts`**
- **Purpose:** Real-time token search and discovery
- **Features:** Token search, price updates, metadata retrieval
- **Dependencies:** token databases, search APIs
- **Key Methods:** `searchTokens()`, `updatePrices()`, `getMetadata()`

### **🌐 Network & Infrastructure Services**

#### **`networkSwitchingService.ts`**
- **Purpose:** Blockchain network switching management
- **Features:** Network detection, automatic switching, configuration management
- **Dependencies:** blockchain services, network configurations
- **Key Methods:** `switchNetwork()`, `detectNetwork()`, `configureRPC()`

#### **`ensService.ts`**
- **Purpose:** Ethereum Name Service resolution
- **Features:** ENS domain resolution, reverse lookup, avatar retrieval
- **Dependencies:** ENS libraries, Ethereum providers
- **Key Methods:** `resolveName()`, `reverseLookup()`, `getAvatar()`

#### **`subgraphService.ts`**
- **Purpose:** The Graph protocol subgraph queries
- **Features:** Decentralized data querying, indexing, analytics
- **Dependencies:** Graph Protocol, GraphQL
- **Key Methods:** `querySubgraph()`, `subscribeToEvents()`, `analyzeData()`

---

## 🏗️ **Backend Microservices** (`/microservices/`)

### **🆔 KYC Service** (Port 4001)
- **Technology:** Node.js + Express
- **Purpose:** Identity verification and compliance
- **Features:** Aadhaar eKYC, PAN verification, document validation
- **APIs:** IDfy, NSDL, government databases
- **Endpoints:** `/api/kyc/verify`, `/api/kyc/status`, `/health`

### **🔍 AML Service** (Port 4002)
- **Technology:** Node.js + Express
- **Purpose:** Anti-money laundering screening
- **Features:** Transaction monitoring, sanctions screening, PEP checks
- **APIs:** IDfy AML, sanctions databases
- **Endpoints:** `/api/aml/screen`, `/api/aml/status`, `/health`

### **📊 Chart API Service** (Port 4000)
- **Technology:** TypeScript + Express
- **Purpose:** Market data and chart generation
- **Features:** Real-time price data, technical indicators, chart APIs
- **APIs:** CoinGecko, TradingView, exchange APIs
- **Endpoints:** `/api/charts/price`, `/api/charts/ohlc`, `/health`

### **📊 Monitoring Service** (Port 3001)
- **Technology:** Node.js + Express
- **Purpose:** Health monitoring and metrics collection
- **Features:** Service health checks, metrics aggregation, alerting
- **Dependencies:** All other services
- **Endpoints:** `/health`, `/metrics`, `/status`

### **⛓️ Blockchain Service** (Port 5001)
- **Technology:** TypeScript + Express
- **Purpose:** Multi-chain blockchain interaction
- **Features:** RPC management, transaction broadcasting, network switching
- **Networks:** Ethereum, Polygon, BSC, Arbitrum
- **Endpoints:** `/api/blockchain/balance`, `/api/blockchain/transaction`, `/health`

---

## 🔗 **Service Communication Matrix**

| Service | Dependencies | Consumers | Communication |
|---------|-------------|-----------|---------------|
| **Blockchain Service** | RPC endpoints, Redis | Trading, Wallet services | HTTP REST |
| **KYC Service** | IDfy API, Supabase | Auth, Admin services | HTTP REST |
| **AML Service** | AML APIs, Supabase | KYC, Trading services | HTTP REST |
| **Chart API Service** | CoinGecko, Redis | Frontend, Trading | HTTP REST |
| **Monitoring Service** | All services | DevOps, Alerting | HTTP REST |

---

## 📊 **Service Health & Monitoring**

### **Health Check Endpoints**
All services implement standardized health checks:
```
GET /health
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
  }
}
```

### **Metrics Collection**
- **Prometheus metrics** at `/metrics` endpoint
- **Custom business metrics** for each service
- **Performance monitoring** with response times
- **Error tracking** with structured logging

---

*This detailed services index provides comprehensive documentation of all services in the DEX Mobile v6 ecosystem, enabling efficient development, maintenance, and scaling of the application.*
