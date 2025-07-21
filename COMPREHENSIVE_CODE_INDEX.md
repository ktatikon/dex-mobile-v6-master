# 📚 DEX Mobile v6 - Comprehensive Code Index

## 🎯 **Project Overview**

**Project Name:** DEX Mobile v6  
**Repository:** https://github.com/ktatikon/dex-mobile-v6-master.git  
**Technology Stack:** React + TypeScript + Vite + Supabase + Capacitor  
**Architecture:** Microservices + Mobile-First Design  
**Target Platforms:** Web, Android APK  

---

## 📁 **Root Directory Structure**

```
dex-mobile-v6-master/
├── 📱 android/                          # Android Capacitor build files
├── 📊 chart-api-service/                # Market data microservice (Port 4000)
├── 🏗️ infrastructure/                   # AWS Terraform infrastructure
├── 📝 Md files/                         # Documentation and guides
├── 🔧 microservices/                    # Consolidated microservices
├── 📊 monitoring/                       # Health monitoring service
├── 🗄️ services/                         # Legacy service directories
├── 📁 src/                              # Main React application source
├── 🗄️ supabase/                         # Database migrations and config
├── 🛠️ scripts/                          # Build and deployment scripts
├── 🎨 public/                           # Static assets
├── 📦 package.json                      # Main dependencies
├── ⚙️ vite.config.ts                    # Vite configuration
├── 🐳 docker-compose.microservices.yml  # Container orchestration
└── 📱 capacitor.config.ts               # Mobile app configuration
```

---

## 🏗️ **Microservices Architecture**

### **Active Microservices** (`/microservices/`)

| Service | Port | Technology | Purpose | Status |
|---------|------|------------|---------|--------|
| **KYC Service** | 4001 | Node.js + Express | Identity verification & compliance | ✅ Production |
| **AML Service** | 4002 | Node.js + Express | Anti-money laundering screening | ✅ Production |
| **Chart API Service** | 4000 | TypeScript + Express | Market data & chart generation | ✅ Production |
| **Monitoring Service** | 3001 | Node.js + Express | Health checks & metrics | ✅ Production |
| **Blockchain Service** | 5001 | TypeScript + Express | Multi-chain blockchain interaction | ✅ Production |

### **Service Dependencies**
- **Database:** Supabase PostgreSQL (20+ tables)
- **Cache:** Redis for session management and data caching
- **External APIs:** IDfy (KYC/AML), CoinGecko (Market Data), RPC endpoints
- **Communication:** HTTP REST APIs with health check endpoints

---

## 🎨 **Frontend Application** (`/src/`)

### **Core Application Files**
- **`App.tsx`** - Main application component with routing and providers
- **`main.tsx`** - Application entry point with React 18 setup
- **`index.css`** - Global styles and Tailwind CSS imports
- **`vite-env.d.ts`** - TypeScript environment declarations

### **Component Architecture** (`/src/components/`)

#### **Core Components**
- **`DexHeader.tsx`** - Main application header with wallet connection
- **`DexNavigation.tsx`** - Primary navigation component
- **`DexBottomNav.tsx`** - Mobile bottom navigation
- **`TokenSelector.tsx`** - Token selection interface
- **`SwapForm.tsx`** - Token swap interface
- **`WalletSwitcher.tsx`** - Multi-wallet management

#### **Specialized Component Directories**
```
components/
├── 👤 admin/                    # Admin dashboard components
├── 🔍 aml/                      # AML compliance components
├── 📊 charts/                   # Chart and visualization components
├── 💬 chat/                     # Live chat system components
├── 🐛 debug/                    # Development debugging tools
├── ⚡ enhanced/                 # Enhanced UI components
├── 🏢 enterprise/               # Enterprise service integrations
├── 🆔 kyc/                      # KYC verification components
├── 📱 mobile/                   # Mobile-specific components
├── 🧭 navigation/               # Navigation components
├── 🔄 swap_block/               # Modular swap components
├── 📈 trade/                    # Trading interface components
├── 💰 wallet/                   # Wallet management components
└── 🎨 ui/                       # Reusable UI components (shadcn/ui)
```

### **Context Providers** (`/src/contexts/`)
- **`AuthContext.tsx`** - User authentication and session management
- **`AdminContext.tsx`** - Admin user management and permissions
- **`KYCContext.tsx`** - KYC verification state management
- **`MarketDataContext.tsx`** - Real-time market data management
- **`ChatContext.tsx`** - Live chat system state
- **`ThemeContext.tsx`** - Dark/light theme management
- **`LanguageContext.tsx`** - Multi-language support (8 languages)
- **`TestnetContext.tsx`** - Testnet environment management

### **Custom Hooks** (`/src/hooks/`)
- **`useMarketData.ts`** - Real-time market data fetching
- **`useWalletData.ts`** - Wallet balance and transaction data
- **`usePortfolioData.ts`** - Portfolio analytics and calculations
- **`useChartData.ts`** - Chart data processing and caching
- **`useRealTimeTokens.ts`** - Live token price updates
- **`useTestnetAccess.ts`** - Testnet environment access control
- **`use-mobile.tsx`** - Mobile device detection and responsive behavior

---

## 🛠️ **Services Layer** (`/src/services/`)

### **Core Services**
- **`blockchainService.ts`** - Multi-chain blockchain interactions
- **`dexSwapService.ts`** - DEX swap execution and routing
- **`uniswapV3Service.ts`** - Uniswap V3 protocol integration
- **`walletService.ts`** - Wallet management and operations
- **`authValidationService.ts`** - Authentication and validation
- **`chartDataService.ts`** - Market data and chart processing

### **Enterprise Services** (`/src/services/enterprise/`)
- **MEV Protection** - Maximal Extractable Value protection
- **Gas Optimization** - Transaction cost optimization
- **TDS Compliance** - Indian tax compliance (Tax Deducted at Source)
- **Security Compliance** - Enterprise security standards

### **Payment Services** (`/src/services/payments/`)
- **`paypalService.ts`** - PayPal payment gateway integration
- **`phonepeService.ts`** - PhonePe UPI payment integration
- **`fiatWalletService.ts`** - Fiat currency wallet management
- **`upiService.ts`** - Unified Payments Interface integration

### **Specialized Services**
- **`kycApiService.ts`** - KYC verification API integration
- **`amlService.ts`** - AML screening and compliance
- **`mfaService.ts`** - Multi-factor authentication
- **`ensService.ts`** - Ethereum Name Service resolution
- **`realTimeDataManager.ts`** - WebSocket data management

---

## 📄 **Pages & Routing** (`/src/pages/`)

### **Core Pages**
- **`HomePage.tsx`** - Main dashboard with portfolio overview
- **`TradePage.tsx`** - Advanced trading interface
- **`WalletDashboardPage.tsx`** - Wallet management dashboard
- **`PortfolioPage.tsx`** - Portfolio analytics and tracking
- **`AuthPage.tsx`** - Authentication (login/signup)

### **Feature Pages**
- **`SwapPage.tsx`** - Token swapping interface
- **`SendPage.tsx` / `ReceivePage.tsx`** - Transaction pages
- **`BuyPage.tsx` / `SellPage.tsx`** - Fiat on/off ramp
- **`DeFiPage.tsx`** - DeFi protocols integration
- **`ExplorePage.tsx`** - Token discovery and exploration

### **Compliance & Security**
- **`KYCPage.tsx`** - KYC verification interface
- **`AadhaarEKYCPage.tsx`** - Indian Aadhaar eKYC
- **`SecurityPage.tsx`** - Security settings and MFA
- **`ProfileSettingsPage.tsx`** - User profile management

### **Admin & Debug**
- **`AdminDashboardPage.tsx`** - Admin control panel
- **`AdminUserManagementPage.tsx`** - User management interface
- **`DebugPage.tsx`** - Development debugging tools
- **`DiagnosticsPage.tsx`** - System diagnostics

---

## 🗄️ **Database Integration** (`/src/integrations/supabase/`)

### **Core Integration Files**
- **`client.ts`** - Supabase client configuration
- **`types.ts`** - Auto-generated TypeScript types (20+ tables)
- **`auth.ts`** - Authentication service integration
- **`database.ts`** - Database query helpers

### **Database Schema** (`/supabase/migrations/`)
**20+ Migration Files Including:**
- User management and authentication
- Wallet connections and preferences
- Transaction history and categories
- KYC/AML compliance data
- Admin system and audit logs
- Chat system and notifications
- DeFi staking and yield farming

---

## 📱 **Mobile Configuration**

### **Capacitor Setup** (`capacitor.config.ts`)
- **App ID:** `com.dexmobile.app`
- **App Name:** V-DEX Mobile
- **Target Platforms:** Android (iOS ready)
- **Security:** HTTPS scheme, no cleartext traffic

### **Android Build** (`android-build-setup.cjs`)
- **APK Output:** `v-dex_v6_0.1.apk`
- **Package:** `com.techvitta.dexmobile`
- **Signing:** Configured with keystore
- **Developer:** Krishna Deepak Tatikonda, TechVitta Pvt Ltd

---

## 🎨 **Styling & UI**

### **Design System**
- **Framework:** Tailwind CSS + shadcn/ui components
- **Theme:** Dark mode primary with light mode support
- **Colors:** 
  - Primary: `#B1420A` (dark orange)
  - Background: `#000000` (black), `#1C1C1E` (dark gray)
  - Text: `#FFFFFF` (white), `#8E8E93` (light gray)
- **Typography:** Poppins font family
- **Spacing:** 8px base unit system

### **Mobile Responsiveness**
- **Mobile-first design** with responsive breakpoints
- **Touch-optimized interfaces** for mobile devices
- **Progressive Web App** capabilities
- **Native mobile navigation** patterns

---

## 🔧 **Build & Development**

### **Package Management**
- **Main Dependencies:** React 18, TypeScript, Vite, Supabase
- **UI Components:** Radix UI, shadcn/ui, Lucide React
- **Blockchain:** Ethers.js, Uniswap SDK, MetaMask SDK
- **Charts:** Lightweight Charts, Plotly.js
- **Mobile:** Capacitor, Capacitor plugins

### **Development Scripts**
- **`npm run dev`** - Development server with hot reload
- **`npm run build`** - Production build
- **`npm run preview`** - Preview production build
- **`npm run android`** - Build Android APK
- **`npm run deploy`** - Deploy to production

---

## 🚀 **Deployment & Infrastructure**

### **AWS Infrastructure** (`/infrastructure/terraform/`)
- **ECS Fargate** - Container orchestration
- **Application Load Balancer** - Traffic distribution
- **RDS PostgreSQL** - Database hosting
- **ElastiCache Redis** - Caching layer
- **CloudFront CDN** - Global content delivery
- **S3 Buckets** - Asset and document storage

### **CI/CD Pipeline** (`.github/workflows/`)
- **Automated testing** and code quality checks
- **Docker image building** and security scanning
- **Infrastructure deployment** with Terraform
- **Health checks** and monitoring setup

---

## 📊 **Monitoring & Observability**

### **Health Monitoring**
- **Service health endpoints** for all microservices
- **Real-time metrics** collection with Prometheus
- **Centralized logging** with structured JSON logs
- **Performance monitoring** with custom metrics

### **Error Handling**
- **Error boundaries** for React components
- **Comprehensive error logging** with Winston
- **User-friendly error messages** with recovery options
- **Debug tools** for development troubleshooting

---

## 🔍 **Detailed Component Index**

### **UI Components** (`/src/components/ui/`)
**shadcn/ui Based Components:**
- **`button.tsx`** - Customizable button component with variants
- **`input.tsx`** - Form input with validation states
- **`dialog.tsx`** - Modal dialog component
- **`dropdown-menu.tsx`** - Dropdown menu with keyboard navigation
- **`toast.tsx`** - Notification toast system
- **`card.tsx`** - Container card component
- **`badge.tsx`** - Status and label badges
- **`avatar.tsx`** - User avatar component
- **`tabs.tsx`** - Tabbed interface component
- **`select.tsx`** - Select dropdown component

### **Trading Components** (`/src/components/trade/`)
- **`AdvancedTradingPanel.tsx`** - Professional trading interface
- **`OrderBook.tsx`** - Real-time order book display
- **`TradingChart.tsx`** - Advanced price charts
- **`PositionManager.tsx`** - Trading position management
- **`RiskManagement.tsx`** - Risk assessment tools

### **Wallet Components** (`/src/components/wallet/`)
- **`WalletCard.tsx`** - Individual wallet display card
- **`WalletList.tsx`** - Multi-wallet listing interface
- **`WalletImport.tsx`** - Wallet import functionality
- **`WalletGeneration.tsx`** - New wallet creation
- **`WalletSecurity.tsx`** - Security settings for wallets
- **`TransactionHistory.tsx`** - Wallet transaction history

### **Swap Components** (`/src/components/swap_block/`)
**Modular Swap Architecture:**
- **`SwapBlock.tsx`** - Main swap interface container
- **`TokenInput.tsx`** - Token amount input component
- **`SwapButton.tsx`** - Swap execution button
- **`SlippageSettings.tsx`** - Slippage tolerance configuration
- **`SwapPreview.tsx`** - Transaction preview modal
- **`SwapHistory.tsx`** - Swap transaction history

---

## 📊 **Service Architecture Details**

### **Enterprise Services** (`/src/services/enterprise/`)
```
enterprise/
├── mevProtectionService.ts      # MEV protection algorithms
├── gasOptimizationService.ts    # Gas cost optimization
├── tdsComplianceService.ts      # Indian tax compliance
├── securityComplianceService.ts # Enterprise security
├── auditLoggingService.ts       # Compliance audit trails
└── enterpriseServiceIntegrator.ts # Service orchestration
```

### **Payment Services** (`/src/services/payments/`)
```
payments/
├── paypalService.ts             # PayPal integration
├── phonepeService.ts            # PhonePe UPI integration
├── fiatWalletService.ts         # Fiat wallet management
├── upiService.ts                # UPI payment processing
├── bankingApiService.ts         # Banking API integration
└── fiatCryptoConversionService.ts # Fiat-crypto conversion
```

### **Mobile Services** (`/src/services/mobile/`)
```
mobile/
├── capacitorService.ts          # Capacitor plugin integration
├── deviceInfoService.ts         # Device information
├── biometricService.ts          # Biometric authentication
├── pushNotificationService.ts   # Push notifications
├── cameraService.ts             # Camera and QR scanning
└── storageService.ts            # Local storage management
```

---

## 🗄️ **Database Schema Index**

### **Core Tables** (Supabase PostgreSQL)
```sql
-- User Management
users                    # User profiles and authentication
user_login_history      # Login tracking and security
user_status_changes     # User status audit trail

-- Wallet System
wallets                 # Unified wallet management
generated_wallets       # App-generated wallets
wallet_connections      # External wallet connections
wallet_preferences      # User wallet settings
wallet_settings         # Individual wallet configurations

-- Transaction System
transactions            # Transaction history
transaction_categories  # Transaction categorization
fiat_transactions      # Fiat currency transactions

-- Compliance System
kyc                     # KYC verification data
aml_screenings         # AML screening results
tds_records            # Tax deduction records

-- Admin System
admin_users            # Admin user management
admin_activity_logs    # Admin audit trail
admin_permissions      # Role-based permissions

-- Communication
chat_messages          # Live chat system
notifications          # User notifications
notification_settings  # Notification preferences

-- DeFi Integration
defi_positions         # DeFi protocol positions
staking_records        # Staking history
yield_farming          # Yield farming data
```

---

## 🔧 **Configuration Files Index**

### **Build Configuration**
- **`vite.config.ts`** - Vite build configuration with plugins
- **`tsconfig.json`** - TypeScript compiler configuration
- **`tsconfig.app.json`** - App-specific TypeScript config
- **`tsconfig.node.json`** - Node.js TypeScript config
- **`tailwind.config.js`** - Tailwind CSS configuration
- **`postcss.config.js`** - PostCSS configuration

### **Mobile Configuration**
- **`capacitor.config.ts`** - Capacitor mobile app configuration
- **`android-build-setup.cjs`** - Android APK build script
- **`ionic.config.json`** - Ionic framework configuration

### **Development Tools**
- **`eslint.config.js`** - ESLint code quality rules
- **`.gitignore`** - Git ignore patterns
- **`.env.example`** - Environment variables template
- **`docker-compose.yml`** - Docker development setup

---

## 📚 **Documentation Index**

### **Technical Documentation** (`/Md files/`)
- **`DATABASE_STRUCTURE.md`** - Complete database schema
- **`DEX_DATABASE_INTEGRATION_GUIDE.md`** - Database integration guide
- **`MICROSERVICES_ARCHITECTURE_IMPLEMENTATION_PLAN.md`** - Architecture plan
- **`ENTERPRISE_LOADING_IMPLEMENTATION.md`** - Loading patterns
- **`PHASE_4_IMPLEMENTATION_GUIDE.md`** - Development phases

### **Service Documentation** (`/microservices/`)
- **`SERVICE_MANIFEST.md`** - Service registry and configuration
- **`README.md`** - Microservices setup and usage guide
- **Individual service READMEs** - Service-specific documentation

### **Infrastructure Documentation** (`/infrastructure/`)
- **Terraform configurations** - AWS infrastructure as code
- **Deployment scripts** - Automated deployment procedures
- **Monitoring configurations** - Observability setup

---

## 🧪 **Testing & Quality Assurance**

### **Test Files** (`/src/tests/`)
- **`authenticationTest.ts`** - Authentication flow testing
- **`walletConnectionFixes.test.ts`** - Wallet connection testing
- **`ProfileSettingsTest.tsx`** - Profile settings testing
- **`authContextRuntimeTest.ts`** - Context runtime testing

### **Validation** (`/src/validation/`)
- **`phase6Validator.ts`** - Phase 6 implementation validation
- **`poolDataIntegrationValidator.ts`** - Pool data validation
- **`runPhase6Validation.ts`** - Validation execution
- **`runPoolDataValidation.ts`** - Pool validation runner

### **Debug Tools** (`/src/debug/`)
- **`databaseDebugger.ts`** - Database debugging utilities
- **`signupDiagnosticService.ts`** - Signup flow diagnostics
- **`supabaseConstraintChecker.ts`** - Database constraint validation
- **`adminDebug.ts`** - Admin system debugging

---

## 🌐 **Internationalization** (`/src/locales/`)

### **Supported Languages**
- **`en/`** - English (default)
- **`hi/`** - Hindi (हिंदी)
- **`te/`** - Telugu (తెలుగు)
- **`kn/`** - Kannada (ಕನ್ನಡ)
- **`es/`** - Spanish (Español)
- **`fr/`** - French (Français)
- **`de/`** - German (Deutsch)

### **Translation Files**
Each language directory contains:
- **`common.json`** - Common UI elements
- **`navigation.json`** - Navigation labels
- **`trading.json`** - Trading interface
- **`wallet.json`** - Wallet management
- **`auth.json`** - Authentication flows
- **`errors.json`** - Error messages

---

*This comprehensive code index provides a complete overview of the DEX Mobile v6 codebase architecture, components, services, and infrastructure. All components follow zero-error implementation standards with enterprise-grade security and scalability.*
