# KYC/AML Microservices for DEX Application

This directory contains enterprise-grade microservices for KYC (Know Your Customer) and AML (Anti-Money Laundering) compliance, specifically designed for Indian cryptocurrency exchanges following PMLA regulations.

## 🏗️ Architecture Overview

```
services/
├── shared/                 # Shared utilities and configurations
│   ├── logger.js          # Enterprise logging with audit trails
│   ├── redis.js           # Redis connection manager
│   └── utils.js           # Common utility functions
├── kyc-service/           # KYC verification service
│   ├── controllers/       # Request handlers
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic
│   ├── middlewares/      # Authentication, validation
│   ├── schemas/          # Joi validation schemas
│   └── jobs/             # Background job processors
├── aml-service/          # AML screening service
│   ├── controllers/      # Request handlers
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── middlewares/     # Authentication, validation
│   ├── schemas/         # Joi validation schemas
│   └── jobs/            # Background job processors
└── docker-compose.yml   # Container orchestration
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16.0.0
- Redis >= 6.0
- Docker & Docker Compose (optional)

### Installation

1. **Install dependencies:**
```bash
cd services
npm run install:all
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start Redis:**
```bash
npm run setup:redis
# Or use Docker: docker run -d --name redis -p 6379:6379 redis:alpine
```

4. **Start services:**
```bash
# Development mode
npm run dev

# Production mode
npm start

# Using Docker
docker-compose up -d
```

## 📋 Services Overview

### KYC Service (Port 4001)
Handles government-compliant identity verification:

- **Aadhaar eKYC**: OTP, biometric, QR code, offline XML
- **PAN Verification**: NSDL database integration
- **Passport Verification**: Government database checks
- **Document Processing**: OCR, validation, storage
- **Consent Management**: UIDAI-compliant consent handling

### AML Service (Port 4002)
Manages anti-money laundering compliance:

- **Sanctions Screening**: RBI/FIU/UN watchlists
- **PEP Screening**: Politically Exposed Person checks
- **Adverse Media**: Negative news detection
- **Risk Assessment**: Automated risk scoring
- **Periodic Re-screening**: Automated compliance monitoring

## 🔧 API Endpoints

### KYC Service Endpoints

#### Core KYC Operations
```
GET    /api/kyc/status/:userId           # Get KYC status
POST   /api/kyc/initiate                 # Start KYC process
GET    /api/kyc/progress/:userId         # Get progress
POST   /api/kyc/complete                 # Complete KYC
GET    /api/kyc/history/:userId          # Get history
POST   /api/kyc/retry                    # Retry failed step
```

#### Aadhaar Operations
```
POST   /api/kyc/aadhaar/otp/initiate     # Start OTP verification
POST   /api/kyc/aadhaar/otp/verify       # Verify OTP
POST   /api/kyc/aadhaar/biometric/verify # Biometric verification
POST   /api/kyc/aadhaar/qr/scan          # QR code processing
POST   /api/kyc/aadhaar/offline/upload   # Offline XML upload
```

#### PAN & Passport Operations
```
POST   /api/kyc/pan/verify               # PAN verification
POST   /api/kyc/passport/verify          # Passport verification
POST   /api/kyc/documents/upload         # Document upload
```

### AML Service Endpoints

#### Screening Operations
```
POST   /api/aml/screen                   # Comprehensive screening
GET    /api/aml/status/:userId           # Get screening status
GET    /api/aml/history/:userId          # Get screening history
POST   /api/aml/rescreen                 # Re-screen user
```

#### Sanctions & PEP
```
POST   /api/aml/sanctions/check          # Sanctions screening
POST   /api/aml/pep/check                # PEP screening
GET    /api/aml/sanctions/lists          # Get sanctions lists
GET    /api/aml/pep/lists                # Get PEP lists
```

#### Risk Management
```
GET    /api/aml/risk/score/:userId       # Get risk score
POST   /api/aml/risk/assess              # Risk assessment
GET    /api/aml/alerts                   # Get alerts
PUT    /api/aml/alerts/:id/resolve       # Resolve alert
```

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- API key management
- Rate limiting (30 req/min general, 5 req/5min for sensitive endpoints)

### Data Protection
- AES-256 encryption for sensitive data
- PII masking in logs
- Secure document storage
- HTTPS enforcement

### Compliance
- PMLA compliance for Indian regulations
- UIDAI guidelines for Aadhaar usage
- 5-year audit trail retention
- Automated compliance reporting

## 🏭 Production Deployment

### Docker Deployment
```bash
# Build and start all services
docker-compose up -d

# Scale services
docker-compose up -d --scale kyc-service=3 --scale aml-service=2

# View logs
docker-compose logs -f kyc-service aml-service

# Health check
curl http://localhost:4001/health
curl http://localhost:4002/health
```

### Environment Configuration
Key environment variables:

```env
# Service Configuration
NODE_ENV=production
KYC_SERVICE_PORT=4001
AML_SERVICE_PORT=4002

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Provider API Keys
SIGNZY_API_KEY=your_signzy_key
UQUDO_API_KEY=your_uqudo_key
NSDL_API_KEY=your_nsdl_key

# Security
ENCRYPTION_KEY=your_32_char_key
JWT_SECRET=your_jwt_secret

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## 📊 Monitoring & Logging

### Health Checks
```bash
# Service health
curl http://localhost:4001/health
curl http://localhost:4002/health

# Redis health
redis-cli ping
```

### Logging
- Structured JSON logging with Winston
- Automatic PII masking
- Audit trail for all KYC/AML operations
- Log rotation and retention

### Metrics (Optional)
- Prometheus metrics collection
- Grafana dashboards
- Custom KYC/AML compliance metrics

## 🧪 Testing

### Unit Tests
```bash
npm test                    # Run all tests
npm run test:kyc           # KYC service tests
npm run test:aml           # AML service tests
```

### Integration Tests
```bash
# Test with real providers (sandbox)
MOCK_PROVIDERS=false npm test

# Load testing
npm run test:load
```

### API Testing
Use the provided Postman collection:
```bash
# Import collection
postman-collection.json

# Environment variables
postman-environment.json
```

## 🔄 Background Jobs

### KYC Jobs
- Document processing and OCR
- Biometric verification
- Provider API retries
- Status updates

### AML Jobs
- Daily sanctions list updates
- Weekly PEP list updates
- Monthly user re-screening
- Alert generation

## 📈 Scaling Considerations

### Horizontal Scaling
- Stateless service design
- Redis for shared state
- Load balancer ready
- Database connection pooling

### Performance Optimization
- Redis caching for frequent queries
- Background job processing
- API response caching
- Database query optimization

## 🛠️ Development

### Adding New Providers
1. Create provider service in `services/`
2. Implement standard interface
3. Add configuration
4. Update routing
5. Add tests

### Custom Validation Rules
1. Add schema in `schemas/`
2. Implement validation logic
3. Add middleware
4. Update documentation

## 📞 Support

For issues and questions:
- Check logs in `logs/` directory
- Review health endpoints
- Check Redis connectivity
- Verify environment configuration

## 🔒 Compliance Notes

This implementation follows:
- **PMLA (Prevention of Money Laundering Act)** requirements
- **UIDAI guidelines** for Aadhaar usage
- **RBI regulations** for crypto exchanges
- **Data protection** best practices
- **Audit trail** requirements (5-year retention)

## 📄 License

MIT License - See LICENSE file for details.
