# 📁 DEX Mobile v6 - File Structure Documentation

## 📋 Overview

This document provides a comprehensive breakdown of the DEX Mobile v6 codebase structure, organized by functional areas and architectural layers. The project follows a modular architecture with clear separation of concerns between frontend, backend services, blockchain integration, and infrastructure components.

**Total Structure:**
- **Root Level**: 156 files and directories
- **Source Code**: ~2,500+ TypeScript/JavaScript files
- **Microservices**: 5 active services with dedicated directories
- **Documentation**: 50+ markdown files
- **Configuration**: 25+ config files for various tools and services

---

## 🏗️ Root Directory Structure

```
dex-mobile-v6-master/
├── 📱 Frontend & Mobile Components
│   ├── src/                          # Main application source code
│   ├── public/                       # Static assets and PWA files
│   ├── android/                      # Android mobile app configuration
│   └── mobile-build/                 # Mobile build artifacts
├── 🔧 Backend Services
│   ├── microservices/                # Microservices architecture
│   ├── services/                     # Shared backend services
│   └── chart-api-service/            # Standalone chart service
├── ☁️ Infrastructure & Deployment
│   ├── aws/                          # AWS deployment configurations
│   ├── infrastructure/               # Terraform IaC
│   ├── monitoring/                   # Monitoring and alerting
│   └── scripts/                      # Deployment and utility scripts
├── 🗄️ Database & Configuration
│   ├── supabase/                     # Database migrations and config
│   └── alerts/                       # Alert configurations
├── 📚 Documentation
│   ├── docs/                         # Technical documentation
│   ├── Md files/                     # Implementation guides
│   └── *.md                          # Various documentation files
└── 🔧 Configuration & Build
    ├── package.json                  # Node.js dependencies
    ├── vite.config.ts               # Build configuration
    ├── tailwind.config.ts           # Styling configuration
    └── capacitor.config.ts          # Mobile app configuration
```

---

## 📱 Frontend & Mobile Components

### `/src/` - Main Application Source
```
src/
├── 🎨 UI Components
│   ├── components/                   # Reusable UI components
│   │   ├── ui/                      # Base UI primitives (Radix UI)
│   │   ├── charts/                  # Chart and visualization components
│   │   ├── trading/                 # Trading interface components
│   │   ├── wallet/                  # Wallet management components
│   │   ├── kyc/                     # KYC/AML form components
│   │   ├── admin/                   # Admin dashboard components
│   │   ├── mobile/                  # Mobile-specific components
│   │   └── enhanced/                # Enhanced enterprise components
├── 📄 Pages & Routes
│   ├── pages/                       # Application pages/screens
│   │   ├── HomePage.tsx             # Main dashboard
│   │   ├── TradePage.tsx            # Trading interface
│   │   ├── WalletDashboardPage.tsx  # Wallet management
│   │   ├── KYCPage.tsx              # KYC verification
│   │   ├── AdminDashboardPage.tsx   # Admin interface
│   │   └── [50+ other pages]       # Various application screens
├── 🔧 Services & Utilities
│   ├── services/                    # Business logic services
│   │   ├── blockchainService.ts     # Blockchain interactions
│   │   ├── walletService.ts         # Wallet operations
│   │   ├── dexSwapService.ts        # DEX trading logic
│   │   ├── kycApiService.ts         # KYC/AML integration
│   │   ├── enterprise/              # Enterprise service integrations
│   │   └── [40+ other services]     # Various business services
│   ├── hooks/                       # Custom React hooks
│   ├── utils/                       # Utility functions
│   └── lib/                         # Shared libraries
├── 🎯 State Management
│   ├── contexts/                    # React Context providers
│   │   ├── AuthContext.tsx          # Authentication state
│   │   ├── ThemeContext.tsx         # UI theme management
│   │   ├── MarketDataContext.tsx    # Market data state
│   │   └── [8 other contexts]       # Various app contexts
├── 🔗 Blockchain Integration
│   ├── contracts/                   # Smart contract interfaces
│   │   ├── abis/                    # Contract ABIs
│   │   └── addresses.ts             # Contract addresses
├── 🌐 Internationalization
│   ├── locales/                     # Translation files
│   │   ├── en/                      # English translations
│   │   ├── hi/                      # Hindi translations
│   │   ├── te/                      # Telugu translations
│   │   └── [4 other languages]     # Additional language support
├── 🎨 Styling & Assets
│   ├── styles/                      # Global styles
│   └── index.css                    # Main stylesheet
└── 🧪 Testing & Validation
    ├── tests/                       # Test files
    ├── validation/                  # Data validation schemas
    └── debug/                       # Debug utilities
```

### `/public/` - Static Assets
```
public/
├── 🖼️ Icons & Images
│   ├── crypto-icons/                # Cryptocurrency icons
│   ├── wallet-icons/                # Wallet provider icons
│   ├── hardware-wallets/            # Hardware wallet images
│   └── favicon.ico                  # App favicon
├── 📱 PWA Configuration
│   ├── manifest.json                # PWA manifest
│   ├── sw.js                        # Service worker
│   └── robots.txt                   # SEO configuration
└── 🔧 Utilities
    └── final-validation-script.js   # Client-side validation
```

### `/android/` - Mobile App Configuration
```
android/
├── 📱 App Configuration
│   ├── app/                         # Android app module
│   │   ├── src/main/                # Main source directory
│   │   └── build.gradle             # App build configuration
├── 🔧 Build System
│   ├── build.gradle                 # Project build configuration
│   ├── gradle.properties            # Gradle properties
│   └── settings.gradle              # Project settings
└── 🔑 Security
    └── local.properties             # Local SDK paths

---

## 🔧 Backend Services & APIs

### `/microservices/` - Microservices Architecture
```
microservices/
├── 📋 Service Registry
│   ├── SERVICE_MANIFEST.md          # Complete service documentation
│   └── README.md                    # Microservices overview
├── 🔐 KYC Service (Port 4001)
│   ├── kyc-service/
│   │   ├── controllers/             # API controllers
│   │   ├── services/                # Business logic
│   │   ├── routes/                  # API routes
│   │   ├── middlewares/             # Request middlewares
│   │   ├── schemas/                 # Data validation schemas
│   │   ├── __tests__/               # Unit tests
│   │   ├── Dockerfile               # Container configuration
│   │   └── package.json             # Service dependencies
├── 🛡️ AML Service (Port 4002)
│   ├── aml-service/
│   │   ├── controllers/             # Anti-money laundering logic
│   │   ├── services/                # AML screening services
│   │   ├── routes/                  # AML API endpoints
│   │   ├── middlewares/             # Security middlewares
│   │   ├── schemas/                 # AML data schemas
│   │   └── [similar structure]     # Standard service structure
├── 📊 Chart API Service (Port 4000)
│   ├── chart-api-service/
│   │   ├── src/                     # TypeScript source code
│   │   ├── Dockerfile               # Container configuration
│   │   ├── docker-compose.yml       # Local development setup
│   │   ├── redis.conf               # Redis configuration
│   │   └── tsconfig.json            # TypeScript configuration
├── ⛓️ Blockchain Service (Port 5001)
│   ├── blockchain-service/
│   │   ├── src/                     # Multi-chain integration
│   │   ├── Dockerfile               # Container configuration
│   │   └── package.json             # Blockchain dependencies
├── 📈 Monitoring Service (Port 3001)
│   ├── monitoring-service/
│   │   ├── health-check.js          # Health monitoring
│   │   ├── alerts/                  # Alert configurations
│   │   ├── dashboards/              # Monitoring dashboards
│   │   ├── configs/                 # Service configurations
│   │   └── scripts/                 # Monitoring scripts
├── 🗄️ Database Integration
│   ├── database/
│   │   ├── kyc_aml_schema.sql       # KYC/AML database schema
│   │   └── supabase_migration.sql   # Database migrations
└── 🔗 Shared Components
    ├── shared/
    │   ├── logger.js                # Centralized logging
    │   ├── redis.js                 # Redis connection
    │   ├── supabase.js              # Database connection
    │   ├── queueManager.js          # Job queue management
    │   └── utils.js                 # Shared utilities
```

### `/services/` - Shared Backend Services
```
services/
├── 📋 Documentation
│   ├── API_DOCUMENTATION.md         # Complete API documentation
│   ├── DEPLOYMENT_GUIDE.md          # Service deployment guide
│   └── README.md                    # Services overview
├── 🔧 Service Configuration
│   ├── docker-compose.yml           # Multi-service orchestration
│   ├── package.json                 # Shared dependencies
│   └── test-endpoints.sh            # API testing script
├── 📊 API Testing
│   ├── postman/                     # Postman collections
│   └── logs/                        # Service logs
└── 📦 Dependencies
    └── node_modules/                # Shared node modules
```

### `/chart-api-service/` - Standalone Chart Service
```
chart-api-service/
├── 📊 Market Data Service
│   ├── src/                         # TypeScript source code
│   │   ├── routes/                  # API endpoints
│   │   ├── services/                # Data fetching services
│   │   ├── utils/                   # Utility functions
│   │   └── index.ts                 # Main application entry
├── 🐳 Containerization
│   ├── Dockerfile                   # Production container
│   ├── docker-compose.yml           # Development setup
│   └── redis.conf                   # Redis cache configuration
├── 📦 Configuration
│   ├── package.json                 # Service dependencies
│   ├── tsconfig.json                # TypeScript configuration
│   └── README.md                    # Service documentation
└── 📈 Monitoring
    └── [health check endpoints]     # Service health monitoring
```

---

## ☁️ Infrastructure & Deployment

### `/aws/` - AWS Cloud Configuration
```
aws/
├── 📋 Documentation
│   ├── AWS_DEPLOYMENT_ARCHITECTURE.md  # Complete AWS architecture
│   └── AWS_DEPLOYMENT_GUIDE.md         # Deployment instructions
├── 🖥️ EC2 Configuration
│   └── ec2/
│       └── ec2-deployment.yml          # EC2 service deployment
├── 🐳 ECS Configuration
│   └── ecs/
│       └── ecs-deployment.yml          # Container service deployment
├── ☸️ EKS Configuration
│   └── eks/
│       ├── eks-deployment.yml          # Kubernetes deployment
│       └── blockchain-service-k8s.yaml # Blockchain service K8s config
├── 📊 Monitoring
│   └── monitoring/
│       └── prometheus.yml              # Prometheus configuration
└── 🔗 Shared Infrastructure
    └── shared/
        ├── vpc-infrastructure.yml      # VPC and networking
        ├── database-infrastructure.yml # RDS and ElastiCache
        ├── compliance-infrastructure.yml # Compliance services
        ├── waf-configuration.yml       # Web Application Firewall
        ├── cicd-pipeline.yml           # CI/CD pipeline
        └── secrets-template.json       # Secrets management template
```

### `/infrastructure/` - Infrastructure as Code
```
infrastructure/
└── terraform/
    ├── main.tf                      # Main Terraform configuration
    ├── api-gateway.tf               # API Gateway configuration
    ├── ecs.tf                       # ECS cluster configuration
    ├── monitoring.tf                # Monitoring infrastructure
    └── outputs.tf                   # Infrastructure outputs
```

### `/monitoring/` - Monitoring & Alerting
```
monitoring/
├── 🚨 Alerts
│   ├── alerts/
│   │   ├── rules/                   # Alert rules
│   │   ├── templates/               # Alert templates
│   │   └── webhooks/                # Webhook configurations
├── ⚙️ Configuration
│   └── configs/                     # Monitoring configurations
├── 📊 Dashboards
│   └── dashboards/                  # Grafana dashboards
├── 🔧 Scripts
│   └── scripts/                     # Monitoring scripts
└── 🏥 Health Checks
    └── health-check.js              # Service health monitoring

---

## 🗄️ Database & Configuration

### `/supabase/` - Database Management
```
supabase/
├── ⚙️ Configuration
│   └── config.toml                  # Supabase configuration
└── 📊 Database Migrations
    └── migrations/
        ├── 20240522000000_update_users_table.sql
        ├── 20240523000000_create_notification_settings.sql
        ├── 20240524000000_add_avatar_url.sql
        ├── 20240601000000_update_kyc_table.sql
        ├── 20250101_enhanced_wallet_schema.sql
        ├── 20250101_phase4_3_cross_chain_bridge.sql
        ├── 20250101_phase4_5_social_trading.sql
        ├── 20250101_phase4_advanced_trading.sql
        ├── 20250101_phase4_defi_integration.sql
        ├── 20250125000000_create_chat_system.sql
        ├── 20250126000000_create_admin_system.sql
        ├── 20250127000000_create_kyc_table.sql
        ├── 20250127000001_create_aml_table.sql
        ├── 20250127000001_fix_users_table_constraints.sql
        ├── 20250127000002_add_unique_constraints.sql
        ├── 20250127000003_cleanup_duplicate_data.sql
        ├── 20250128000000_fix_auth_policies.sql
        ├── 20250128000001_fix_database_registration_issues.sql
        ├── 20250128000002_update_phone_format_constraint.sql
        ├── 20250128000003_fix_rls_policy_issues.sql
        ├── 20250128_add_slippage_tolerance.sql
        ├── 20250523_defi_staking.sql
        ├── 20250523_generated_wallets.sql
        ├── 20250523_transaction_categories.sql
        ├── 20250523_wallet_connections.sql
        ├── 20250523_wallet_preferences.sql
        └── 20250523_wallet_settings.sql
```

### `/scripts/` - Database & Deployment Scripts
```
scripts/
├── 🗄️ Database Scripts
│   ├── admin_user_creation.sql      # Admin user setup
│   ├── create-admin-bypass-function.sql
│   ├── create-initial-admin.sql
│   ├── fix-database-issues.sql
│   ├── fix-rls-policies.sql
│   ├── manual-admin-setup.sql
│   ├── setup-admin.sql
│   ├── test-kyc-fix.sql
│   ├── test-profile-update-fix.sql
│   ├── test-upsert-functionality.sql
│   ├── verify-admin-setup.sql
│   ├── verify-database-connectivity.sql
│   └── verify-auth-fixes.js
└── 🚀 Deployment Scripts
    ├── deploy-microservices.sh      # Microservices deployment
    └── verify-microservices-integration.sh
```

---

## 📚 Documentation Structure

### `/docs/` - Technical Documentation
```
docs/
├── 🏗️ Architecture Documentation
│   ├── 01_ARCHITECTURE_OVERVIEW.md  # System architecture (this doc)
│   ├── 02_FILE_STRUCTURE.md         # File structure (current doc)
│   └── [additional architecture docs]
├── 🔧 Implementation Guides
│   ├── AUTHENTICATION_FIXES.md      # Authentication implementation
│   ├── PHASE_4_3_IMPLEMENTATION_SUMMARY.md
│   ├── PHASE_4_4_IMPLEMENTATION_PLAN.md
│   ├── PHASE_4_5_SOCIAL_TRADING_IMPLEMENTATION.md
│   ├── PHASE_4_COMPREHENSIVE_AUDIT_REPORT.md
│   ├── PHASE_4_COMPREHENSIVE_QA_REPORT.md
│   ├── PHASE_4_REAL_BLOCKCHAIN_INTEGRATIONS.md
│   └── SwapBlock-UI-Improvements.md
└── 📊 API Documentation
    └── [API documentation files]
```

### `/Md files/` - Implementation Documentation
```
Md files/
├── 🔐 Authentication & Security
│   ├── AUTHENTICATION_RUNTIME_ERROR_FIX.md
│   ├── AUTHENTICATION_SESSION_RECOVERY_FIX.md
│   ├── AUTH_ID_VALIDATION_FIX.md
│   ├── COMPREHENSIVE_SIGNUP_SOLUTION.md
│   └── CRITICAL_IMMEDIATE_RESOLUTION.md
├── 🗄️ Database Implementation
│   ├── DATABASE_REGISTRATION_ERROR_FIX.md
│   ├── DATABASE_RLS_RECURSION_FIX.md
│   ├── DATABASE_STRUCTURE.md
│   ├── PERSISTENT_DATABASE_ERROR_COMPLETE_FIX.md
│   └── UNIQUE_CONSTRAINTS_IMPLEMENTATION.md
├── 💱 Trading & DeFi
│   ├── SLIPPAGE_TOLERANCE_IMPLEMENTATION.md
│   ├── SWAP_FUNCTIONALITY_IMPLEMENTATION.md
│   ├── PHASE4_2_DEFI_INTEGRATION_DOCUMENTATION.md
│   └── PHASE_4.4_AI_ANALYTICS.md
├── 🎨 UI Components
│   ├── animations-setup.md
│   ├── button-components.md
│   ├── chart-components.md
│   └── HOME_PAGE_BALANCE_ENHANCEMENT_IMPLEMENTATION.md
└── 🏥 Admin & Testing
    └── ADMIN_TESTNET_ACCESS_IMPLEMENTATION.md
```

### Root Level Documentation Files
```
Root Documentation Files:
├── 📋 Project Overview
│   ├── README.md                    # Main project documentation
│   ├── PRODUCTION_READINESS_ASSESSMENT.md
│   ├── Production_Readiness_Analysis.md
│   └── VALIDATION_CHECKLIST.md
├── 🚀 Deployment & Build
│   ├── ANDROID_APK_BUILD_GUIDE.md
│   ├── APK_BUILD_SUCCESS_REPORT.md
│   ├── AWS_DEPLOYMENT_SUMMARY.md
│   ├── FINAL_DEPLOYMENT_STATUS.md
│   └── PRODUCTION_DEPLOYMENT_CONFIG.md
├── 🏗️ Architecture & Implementation
│   ├── MICROSERVICES_ARCHITECTURE_IMPLEMENTATION_PLAN.md
│   ├── MICROSERVICES_CONSOLIDATION_ANALYSIS.md
│   ├── MICROSERVICES_CONSOLIDATION_COMPLETE.md
│   ├── MICROSERVICES_IMPLEMENTATION_SUMMARY.md
│   ├── ZERO_DUPLICATION_ARCHITECTURE.md
│   └── ENTERPRISE_LOADING_IMPLEMENTATION.md
├── 📊 Code Quality & Analysis
│   ├── CODE_INDEXING_SUMMARY.md
│   ├── CODE_QUALITY_AUDIT_ANDROID_APK_REPORT.md
│   ├── COMPREHENSIVE_CODE_INDEX.md
│   ├── COMPONENTS_DETAILED_INDEX.md
│   └── SERVICES_DETAILED_INDEX.md
├── 🔧 Development & Troubleshooting
│   ├── DEV_SERVER_TROUBLESHOOTING.md
│   ├── TRADE_PAGE_CRITICAL_FIXES.md
│   ├── TRADE_PAGE_TAB_ENHANCEMENT.md
│   └── TRADING_INTERFACE_RESTRUCTURING.md
├── 🗄️ Database & Integration
│   ├── DEX_DATABASE_INTEGRATION_GUIDE.md
│   ├── KYC_Implementation_Plan.md
│   └── MONITORING_SETUP_SUMMARY.md
└── 🏥 Health & Monitoring
    ├── ENTERPRISE_HEALTH_REPORT.json
    └── ENTERPRISE_LOADING_INTEGRATION_PLAN.md
```

---

## 🔧 Configuration & Build Files

### Root Configuration Files
```
Configuration Files:
├── 📦 Package Management
│   ├── package.json                 # Main dependencies
│   ├── package-lock.json            # Dependency lock file
│   └── bun.lockb                    # Bun package manager lock
├── 🏗️ Build Configuration
│   ├── vite.config.ts               # Vite build configuration
│   ├── tsconfig.json                # TypeScript configuration
│   ├── tsconfig.app.json            # App-specific TS config
│   ├── tsconfig.node.json           # Node.js TS config
│   └── babel.config.js              # Babel configuration
├── 🎨 Styling Configuration
│   ├── tailwind.config.ts           # Tailwind CSS configuration
│   ├── postcss.config.js            # PostCSS configuration
│   └── components.json              # UI components configuration
├── 📱 Mobile Configuration
│   ├── capacitor.config.ts          # Capacitor mobile config
│   ├── app.json                     # App metadata
│   └── metro.config.js              # Metro bundler config
├── 🔍 Code Quality
│   ├── eslint.config.js             # ESLint configuration
│   └── .gitignore                   # Git ignore rules
└── 🚀 Deployment
    ├── docker-compose.microservices.yml
    ├── docker-compose.monitoring.yml
    └── Dockerfile                   # Container configuration
```

---

*This file structure documentation provides a comprehensive overview of the DEX Mobile v6 codebase organization, enabling developers and stakeholders to quickly understand the project layout and locate specific components.*
```
```