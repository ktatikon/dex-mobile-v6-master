# 🏗️ **V-DEX KYC/AML Implementation Plan & Architecture**

## 📋 **Table of Contents**
1. [Current Implementation Status](#current-implementation-status)
2. [Production Requirements Gap Analysis](#production-requirements-gap-analysis)
3. [Complete User Flow](#complete-user-flow)
4. [Implementation Roadmap](#implementation-roadmap)
5. [Database Architecture](#database-architecture)
6. [Security & Compliance](#security--compliance)
7. [API Integration Scripts](#api-integration-scripts)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Plan](#deployment-plan)

---

## 🎯 **Current Implementation Status**

### ✅ **What We Have (Development Ready)**
```
✅ Complete UI Components (5 React components)
   - AadhaarNumberInput.tsx
   - AadhaarOTPVerification.tsx
   - BiometricCapture.tsx
   - AadhaarQRScanner.tsx
   - AadhaarEKYCFlow.tsx

✅ Backend Services (Node.js)
   - KYC Service (Port 4001) - 15+ endpoints
   - AML Service (Port 4002) - 12+ endpoints

✅ Database Integration (Supabase)
   - KYC table with user data
   - Users table integration
   - Real-time updates

✅ API Service Layer
   - kycApiService.ts - Frontend to backend connector
   - Error handling & loading states
   - Context integration

✅ Routing & Navigation
   - /kyc - Traditional KYC page
   - /kyc/aadhaar - New Aadhaar eKYC flow
   - /kyc-aml - Combined KYC/AML page

✅ Mock Integrations
   - Simulated IDfy responses
   - Mock UIDAI gateway
   - Fake government database checks
```

### ❌ **What We Need for Production**
```
❌ Real IDfy API Integration
❌ UIDAI Gateway Connection  
❌ Government Database Access
❌ Production Security Measures
❌ Compliance Logging
❌ Error Recovery Systems
❌ Performance Optimization
❌ Load Testing
```

---

## 🔍 **Production Requirements Gap Analysis**

### **1. ❌ Real IDfy API Integration**
**Current Status**: Mock implementation with simulated responses
**Required**: 
- IDfy production account & API credentials
- Real API endpoint integration
- Webhook handling for async responses
- Rate limiting compliance

**Estimated Effort**: 1-2 weeks
**Dependencies**: IDfy account approval, API documentation

### **2. ❌ UIDAI Gateway Connection**
**Current Status**: Simulated UIDAI responses
**Required**:
- UIDAI eKYC gateway access (through IDfy)
- Real Aadhaar validation
- OTP delivery integration
- Biometric device integration

**Estimated Effort**: 2-3 weeks
**Dependencies**: UIDAI authorization, certified biometric devices

### **3. ❌ Government Database Access**
**Current Status**: Mock sanctions/PEP screening
**Required**:
- RBI sanctions list integration
- FIU-India database access
- SEBI enforcement database
- International sanctions lists (UN, OFAC)

**Estimated Effort**: 2-3 weeks
**Dependencies**: Government API approvals, compliance certifications

### **4. ❌ Production Security Measures**
**Current Status**: Basic authentication
**Required**:
- PII encryption at rest and in transit
- Data masking and anonymization
- Secure key management (AWS KMS/HashiCorp Vault)
- API security hardening

**Estimated Effort**: 1-2 weeks
**Dependencies**: Security infrastructure setup

### **5. ❌ Compliance Logging**
**Current Status**: Basic logging
**Required**:
- Comprehensive audit trails
- GDPR compliance features
- Data retention policies
- Regulatory reporting

**Estimated Effort**: 1 week
**Dependencies**: Legal compliance requirements

### **6. ❌ Error Recovery Systems**
**Current Status**: Basic error handling
**Required**:
- Circuit breakers for external APIs
- Retry mechanisms with exponential backoff
- Fallback procedures
- Dead letter queues

**Estimated Effort**: 1 week
**Dependencies**: Infrastructure monitoring setup

### **7. ❌ Performance Optimization**
**Current Status**: Development-level performance
**Required**:
- Redis caching layer
- Database query optimization
- CDN integration
- Connection pooling

**Estimated Effort**: 1 week
**Dependencies**: Production infrastructure

### **8. ❌ Load Testing**
**Current Status**: Not implemented
**Required**:
- Performance benchmarking
- Stress testing
- Scalability testing
- Monitoring setup

**Estimated Effort**: 3-5 days
**Dependencies**: Production-like environment

---

## 🔄 **Complete User Flow**

### **Phase 1: User Initiation**
```
1. User navigates to /kyc/aadhaar
2. System checks existing KYC status
3. Display verification method selection
4. Log user access attempt
```

### **Phase 2: Aadhaar Input & Validation**
```
1. User enters 12-digit Aadhaar number
2. Frontend validation (format, checksum)
3. Backend validation via IDfy API
4. Store masked Aadhaar in database
5. Generate secure session token
```

### **Phase 3: OTP Request (Production Flow)**
```
1. Call IDfy API: POST /v3/tasks/sync/verify_with_source/ind_aadhaar_otp
2. IDfy forwards request to UIDAI Gateway
3. UIDAI sends OTP to registered mobile number
4. IDfy returns task_id and status
5. Store OTP session with 5-minute expiry
6. Display OTP input screen to user
```

### **Phase 4: OTP Verification (Production Flow)**
```
1. User enters 6-digit OTP
2. Call IDfy API: POST /v3/tasks/sync/verify_with_source/ind_aadhaar_otp
3. IDfy validates OTP with UIDAI
4. UIDAI returns user data (if OTP valid)
5. IDfy returns complete KYC data
6. Process and encrypt received data
```

### **Phase 5: AML Risk Assessment**
```
1. Extract user details from KYC data
2. Check against sanctions lists (RBI, UN, OFAC)
3. Perform PEP screening
4. Adverse media scanning
5. Calculate composite risk score
6. Generate compliance recommendations
```

### **Phase 6: Data Storage & Response**
```
1. Encrypt and store KYC data
2. Store AML risk assessment
3. Update user verification status
4. Create comprehensive audit log
5. Send success response to frontend
6. Enable enhanced platform features
```

---

## 🛣️ **Implementation Roadmap**

### **Phase 1: IDfy Integration (Weeks 1-2)**

#### **Week 1: Setup & Authentication**
- [ ] Create IDfy production account
- [ ] Obtain API credentials (API key, secret)
- [ ] Set up webhook endpoints
- [ ] Configure IP whitelisting
- [ ] Test sandbox environment

#### **Week 2: API Integration**
- [ ] Replace mock IDfy service with real implementation
- [ ] Implement Aadhaar OTP flow
- [ ] Add PAN verification
- [ ] Implement passport verification
- [ ] Add comprehensive error handling

### **Phase 2: Security & Compliance (Weeks 3-4)**

#### **Week 3: Data Security**
- [ ] Implement PII encryption
- [ ] Add data masking for Aadhaar
- [ ] Set up secure key management
- [ ] Implement access controls

#### **Week 4: Compliance Features**
- [ ] Add comprehensive audit logging
- [ ] Implement GDPR compliance features
- [ ] Set up data retention policies
- [ ] Create regulatory reporting

### **Phase 3: Performance & Scalability (Week 5)**
- [ ] Implement Redis caching layer
- [ ] Add connection pooling
- [ ] Optimize database queries
- [ ] Set up monitoring and alerting

### **Phase 4: Testing & Deployment (Week 6)**
- [ ] Comprehensive testing
- [ ] Load testing
- [ ] Security testing
- [ ] Production deployment

---

## 💾 **Database Architecture**

### **Enhanced Production Schema**

```sql
-- Enhanced KYC table with encryption
CREATE TABLE kyc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  
  -- Personal Information (Encrypted)
  first_name_encrypted TEXT,
  last_name_encrypted TEXT,
  date_of_birth_encrypted TEXT,
  gender_encrypted TEXT,
  
  -- Address Information (Encrypted)
  address_encrypted TEXT,
  city_encrypted TEXT,
  state_encrypted TEXT,
  postal_code_encrypted TEXT,
  country TEXT DEFAULT 'IN',
  
  -- Contact Information (Encrypted)
  phone_encrypted TEXT,
  email_encrypted TEXT,
  
  -- Aadhaar Information (Masked & Hashed)
  aadhaar_masked TEXT, -- XXXX-XXXX-1234
  aadhaar_hash TEXT,   -- SHA-256 hash for verification
  
  -- IDfy Integration
  idfy_task_id TEXT,
  idfy_group_id TEXT,
  idfy_request_id TEXT,
  
  -- Verification Details
  verification_method TEXT CHECK (verification_method IN ('otp', 'biometric', 'qr')),
  verification_timestamp TIMESTAMP,
  verification_ip INET,
  
  -- Status Management
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  status_reason TEXT,
  
  -- Timestamps
  submitted_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '1 year'),
  
  -- Audit Fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  
  -- Indexes
  CONSTRAINT unique_user_kyc UNIQUE(user_id)
);

-- KYC Audit Logs
CREATE TABLE kyc_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  kyc_id UUID REFERENCES kyc(id),
  
  -- Action Details
  action TEXT NOT NULL, -- 'initiated', 'otp_sent', 'otp_verified', 'approved', 'rejected'
  action_details JSONB,
  
  -- Request Context
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  request_id TEXT,
  
  -- IDfy Context
  idfy_task_id TEXT,
  idfy_response_code TEXT,
  
  -- Timestamp
  timestamp TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_kyc_logs_user_id (user_id),
  INDEX idx_kyc_logs_timestamp (timestamp),
  INDEX idx_kyc_logs_action (action)
);

-- AML Risk Assessments
CREATE TABLE aml_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  kyc_id UUID REFERENCES kyc(id),
  
  -- Risk Scoring
  overall_risk_score DECIMAL(5,3) CHECK (overall_risk_score >= 0 AND overall_risk_score <= 1),
  risk_level TEXT CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  
  -- Screening Results
  sanctions_matches INTEGER DEFAULT 0,
  pep_matches INTEGER DEFAULT 0,
  adverse_media_matches INTEGER DEFAULT 0,
  
  -- Assessment Details (Encrypted)
  assessment_data_encrypted JSONB,
  risk_factors JSONB,
  recommendations TEXT[],
  
  -- Validity
  assessed_at TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP DEFAULT (NOW() + INTERVAL '1 year'),
  next_review_date TIMESTAMP,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_aml_assessments_user_id (user_id),
  INDEX idx_aml_assessments_risk_level (risk_level),
  INDEX idx_aml_assessments_assessed_at (assessed_at)
);

-- API Request Tracking
CREATE TABLE api_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  
  -- Request Details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  request_body_hash TEXT,
  
  -- Response Details
  response_status INTEGER,
  response_time_ms INTEGER,
  response_size_bytes INTEGER,
  
  -- External API Context
  idfy_task_id TEXT,
  external_request_id TEXT,
  
  -- Error Handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamp
  timestamp TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_api_requests_user_id (user_id),
  INDEX idx_api_requests_endpoint (endpoint),
  INDEX idx_api_requests_timestamp (timestamp),
  INDEX idx_api_requests_status (response_status)
);
```

---

## 🔐 **Security & Compliance Implementation**

### **Data Encryption Service**
```javascript
// services/encryption.service.js
const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
    this.encryptionKey = process.env.PII_ENCRYPTION_KEY;
  }

  encrypt(text) {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
    cipher.setAAD(Buffer.from('additional-data'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  decrypt(encryptedData) {
    const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
    decipher.setAAD(Buffer.from('additional-data'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  hashAadhaar(aadhaar) {
    return crypto.createHash('sha256').update(aadhaar + process.env.AADHAAR_SALT).digest('hex');
  }

  maskAadhaar(aadhaar) {
    return aadhaar.replace(/(\d{4})(\d{4})(\d{4})/, 'XXXX-XXXX-$3');
  }
}

module.exports = new EncryptionService();
```

### **Audit Logging Service**
```javascript
// services/audit.service.js
class AuditService {
  async logKYCAction(userId, action, details = {}, context = {}) {
    const logEntry = {
      user_id: userId,
      action: action,
      action_details: this.sanitizeDetails(details),
      ip_address: context.ip,
      user_agent: context.userAgent,
      session_id: context.sessionId,
      request_id: context.requestId,
      idfy_task_id: details.idfyTaskId,
      idfy_response_code: details.idfyResponseCode,
      timestamp: new Date().toISOString()
    };

    try {
      const { error } = await supabase
        .from('kyc_logs')
        .insert(logEntry);

      if (error) throw error;
      
      // Also log to external audit system if required
      await this.logToExternalAuditSystem(logEntry);
      
    } catch (error) {
      console.error('Audit logging failed:', error);
      // Don't throw - audit failure shouldn't break main flow
    }
  }

  sanitizeDetails(details) {
    // Remove sensitive information from audit logs
    const sanitized = { ...details };
    delete sanitized.aadhaarNumber;
    delete sanitized.otp;
    delete sanitized.biometricData;
    return sanitized;
  }

  async logToExternalAuditSystem(logEntry) {
    // Integration with external audit/SIEM system
    // This could be Splunk, ELK Stack, or other audit systems
  }
}

module.exports = new AuditService();
```

---

## 🔌 **API Integration Scripts**

### **Production IDfy Service Implementation**
```javascript
// services/idfy.service.js
const axios = require('axios');
const crypto = require('crypto');

class IDfyService {
  constructor() {
    this.baseURL = process.env.IDFY_BASE_URL || 'https://api.idfy.com';
    this.apiKey = process.env.IDFY_API_KEY;
    this.accountId = process.env.IDFY_ACCOUNT_ID;
    this.secretKey = process.env.IDFY_SECRET_KEY;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'account-id': this.accountId
      }
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(this.addAuthHeader.bind(this));

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      this.handleError.bind(this)
    );
  }

  addAuthHeader(config) {
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString('hex');
    const signature = this.generateSignature(config.method, config.url, timestamp, nonce);

    config.headers['Authorization'] = `Bearer ${this.apiKey}`;
    config.headers['X-Timestamp'] = timestamp;
    config.headers['X-Nonce'] = nonce;
    config.headers['X-Signature'] = signature;

    return config;
  }

  generateSignature(method, url, timestamp, nonce) {
    const message = `${method.toUpperCase()}${url}${timestamp}${nonce}`;
    return crypto.createHmac('sha256', this.secretKey).update(message).digest('hex');
  }

  async handleError(error) {
    if (error.response) {
      // IDfy API error response
      const { status, data } = error.response;
      throw new Error(`IDfy API Error ${status}: ${data.message || 'Unknown error'}`);
    } else if (error.request) {
      // Network error
      throw new Error('IDfy API network error: No response received');
    } else {
      // Other error
      throw new Error(`IDfy API error: ${error.message}`);
    }
  }

  // Aadhaar OTP Initiation
  async initiateAadhaarOTP(aadhaarNumber, userId) {
    const taskId = this.generateTaskId();
    const groupId = this.generateGroupId();

    const payload = {
      task_id: taskId,
      group_id: groupId,
      data: {
        aadhaar_number: aadhaarNumber
      }
    };

    try {
      const response = await this.client.post('/v3/tasks/sync/verify_with_source/ind_aadhaar_otp', payload);

      return {
        success: true,
        taskId: taskId,
        groupId: groupId,
        referenceId: response.data.request_id,
        message: 'OTP sent successfully',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  // Aadhaar OTP Verification
  async verifyAadhaarOTP(taskId, otp, userId) {
    const payload = {
      task_id: taskId,
      data: {
        otp: otp
      }
    };

    try {
      const response = await this.client.post('/v3/tasks/sync/verify_with_source/ind_aadhaar_otp', payload);

      if (response.data.status === 'completed' && response.data.result.source_output) {
        const kycData = this.parseAadhaarResponse(response.data.result.source_output);

        return {
          success: true,
          kycData: kycData,
          message: 'OTP verified successfully',
          data: response.data
        };
      } else {
        return {
          success: false,
          message: 'OTP verification failed',
          data: response.data
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  // PAN Verification
  async verifyPAN(panNumber, fullName, dateOfBirth) {
    const taskId = this.generateTaskId();

    const payload = {
      task_id: taskId,
      group_id: this.generateGroupId(),
      data: {
        id_number: panNumber,
        name: fullName,
        date_of_birth: dateOfBirth
      }
    };

    try {
      const response = await this.client.post('/v3/tasks/sync/verify_with_source/ind_pan', payload);

      return {
        success: response.data.status === 'completed',
        verified: response.data.result?.source_output?.status === 'id_found',
        data: response.data,
        message: response.data.result?.source_output?.status === 'id_found'
          ? 'PAN verified successfully'
          : 'PAN verification failed'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  // Passport Verification
  async verifyPassport(passportNumber, dateOfBirth, fullName) {
    const taskId = this.generateTaskId();

    const payload = {
      task_id: taskId,
      group_id: this.generateGroupId(),
      data: {
        id_number: passportNumber,
        date_of_birth: dateOfBirth,
        name: fullName
      }
    };

    try {
      const response = await this.client.post('/v3/tasks/sync/verify_with_source/ind_passport', payload);

      return {
        success: response.data.status === 'completed',
        verified: response.data.result?.source_output?.status === 'id_found',
        data: response.data,
        message: response.data.result?.source_output?.status === 'id_found'
          ? 'Passport verified successfully'
          : 'Passport verification failed'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  parseAadhaarResponse(sourceOutput) {
    return {
      name: sourceOutput.name,
      dateOfBirth: sourceOutput.date_of_birth,
      gender: sourceOutput.gender,
      address: {
        careOf: sourceOutput.care_of,
        house: sourceOutput.house,
        street: sourceOutput.street,
        landmark: sourceOutput.landmark,
        area: sourceOutput.area,
        city: sourceOutput.city,
        district: sourceOutput.district,
        state: sourceOutput.state,
        country: sourceOutput.country,
        pincode: sourceOutput.pincode
      },
      photo: sourceOutput.photo_link,
      aadhaarNumber: sourceOutput.aadhaar_number,
      verifiedAt: new Date().toISOString()
    };
  }

  generateTaskId() {
    return `task_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  generateGroupId() {
    return `group_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }
}

module.exports = new IDfyService();
```

### **Error Recovery & Retry Service**
```javascript
// services/errorRecovery.service.js
class ErrorRecoveryService {
  constructor() {
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1 second
    this.maxDelay = 30000; // 30 seconds
  }

  async withRetry(operation, context = {}) {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await operation();

        // Log successful retry if not first attempt
        if (attempt > 1) {
          console.log(`Operation succeeded on attempt ${attempt}`, context);
        }

        return result;
      } catch (error) {
        lastError = error;

        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === this.maxRetries) {
          break;
        }

        const delay = this.calculateDelay(attempt);
        console.log(`Operation failed on attempt ${attempt}, retrying in ${delay}ms`, {
          error: error.message,
          context
        });

        await this.delay(delay);
      }
    }

    throw new Error(`Operation failed after ${this.maxRetries} attempts: ${lastError.message}`);
  }

  isNonRetryableError(error) {
    // Don't retry on authentication errors, validation errors, etc.
    const nonRetryableStatuses = [400, 401, 403, 422];
    return error.response && nonRetryableStatuses.includes(error.response.status);
  }

  calculateDelay(attempt) {
    // Exponential backoff with jitter
    const exponentialDelay = Math.min(this.baseDelay * Math.pow(2, attempt - 1), this.maxDelay);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return Math.floor(exponentialDelay + jitter);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Circuit breaker pattern
  createCircuitBreaker(operation, options = {}) {
    const {
      failureThreshold = 5,
      resetTimeout = 60000,
      monitoringPeriod = 60000
    } = options;

    let failures = 0;
    let lastFailureTime = null;
    let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN

    return async (...args) => {
      if (state === 'OPEN') {
        if (Date.now() - lastFailureTime > resetTimeout) {
          state = 'HALF_OPEN';
        } else {
          throw new Error('Circuit breaker is OPEN');
        }
      }

      try {
        const result = await operation(...args);

        if (state === 'HALF_OPEN') {
          state = 'CLOSED';
          failures = 0;
        }

        return result;
      } catch (error) {
        failures++;
        lastFailureTime = Date.now();

        if (failures >= failureThreshold) {
          state = 'OPEN';
        }

        throw error;
      }
    };
  }
}

module.exports = new ErrorRecoveryService();
```

### **Performance Optimization Service**
```javascript
// services/performance.service.js
const Redis = require('redis');
const { Pool } = require('pg');

class PerformanceService {
  constructor() {
    // Redis client for caching
    this.redis = Redis.createClient({
      url: process.env.REDIS_URL,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          return new Error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Redis retry time exhausted');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    // Database connection pool
    this.dbPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  // Cache KYC status
  async cacheKYCStatus(userId, status, ttl = 300) {
    const key = `kyc_status:${userId}`;
    await this.redis.setex(key, ttl, JSON.stringify(status));
  }

  async getCachedKYCStatus(userId) {
    const key = `kyc_status:${userId}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // Cache API responses
  async cacheAPIResponse(endpoint, params, response, ttl = 600) {
    const key = `api_response:${endpoint}:${this.hashParams(params)}`;
    await this.redis.setex(key, ttl, JSON.stringify(response));
  }

  async getCachedAPIResponse(endpoint, params) {
    const key = `api_response:${endpoint}:${this.hashParams(params)}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  hashParams(params) {
    return require('crypto').createHash('md5').update(JSON.stringify(params)).digest('hex');
  }

  // Database query optimization
  async executeQuery(query, params = []) {
    const client = await this.dbPool.connect();
    try {
      const start = Date.now();
      const result = await client.query(query, params);
      const duration = Date.now() - start;

      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query detected: ${duration}ms`, { query, params });
      }

      return result;
    } finally {
      client.release();
    }
  }

  // Request rate limiting
  async checkRateLimit(userId, action, limit = 5, window = 900) { // 5 requests per 15 minutes
    const key = `rate_limit:${userId}:${action}`;
    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, window);
    }

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetTime: await this.redis.ttl(key)
    };
  }

  // Memory usage monitoring
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024)
    };
  }
}

module.exports = new PerformanceService();
```

---

## 🧪 **Testing Strategy**

### **Unit Testing Setup**
```javascript
// tests/kyc.service.test.js
const request = require('supertest');
const app = require('../index');
const { supabase } = require('../config/supabase');

describe('KYC Service', () => {
  beforeEach(async () => {
    // Clean test database
    await supabase.from('kyc').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });

  describe('POST /api/kyc/aadhaar/validate', () => {
    it('should validate correct Aadhaar number', async () => {
      const response = await request(app)
        .post('/api/kyc/aadhaar/validate')
        .set('X-API-Key', process.env.TEST_API_KEY)
        .send({ aadhaarNumber: '123456789012' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.referenceId).toBeDefined();
    });

    it('should reject invalid Aadhaar number', async () => {
      const response = await request(app)
        .post('/api/kyc/aadhaar/validate')
        .set('X-API-Key', process.env.TEST_API_KEY)
        .send({ aadhaarNumber: '123456789' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
```

### **Load Testing Script**
```javascript
// tests/load-test.js
const autocannon = require('autocannon');

async function runLoadTest() {
  const result = await autocannon({
    url: 'http://localhost:4001',
    connections: 100,
    duration: 60,
    requests: [
      {
        method: 'POST',
        path: '/api/kyc/aadhaar/validate',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.TEST_API_KEY
        },
        body: JSON.stringify({ aadhaarNumber: '123456789012' })
      }
    ]
  });

  console.log('Load test results:', result);
}

runLoadTest().catch(console.error);
```

---

## 🚀 **Deployment Plan**

### **Environment Setup**
```bash
# Production environment variables
export NODE_ENV=production
export PORT=4001
export DATABASE_URL=postgresql://user:pass@host:5432/db
export REDIS_URL=redis://host:6379
export IDFY_API_KEY=your_production_api_key
export IDFY_SECRET_KEY=your_production_secret
export PII_ENCRYPTION_KEY=your_32_byte_encryption_key
export AADHAAR_SALT=your_random_salt
```

### **Docker Configuration**
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 4001

USER node

CMD ["npm", "start"]
```

### **Kubernetes Deployment**
```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kyc-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kyc-service
  template:
    metadata:
      labels:
        app: kyc-service
    spec:
      containers:
      - name: kyc-service
        image: your-registry/kyc-service:latest
        ports:
        - containerPort: 4001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: kyc-secrets
              key: database-url
        - name: IDFY_API_KEY
          valueFrom:
            secretKeyRef:
              name: kyc-secrets
              key: idfy-api-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

---

## 📊 **Monitoring & Alerting**

### **Health Check Endpoint**
```javascript
// Health check with detailed status
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: process.uptime(),
    memory: performanceService.getMemoryUsage(),
    services: {
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
      idfy: await checkIDfyHealth()
    }
  };

  const isHealthy = Object.values(health.services).every(service => service.status === 'healthy');

  res.status(isHealthy ? 200 : 503).json(health);
});
```

### **Prometheus Metrics**
```javascript
// metrics/prometheus.js
const client = require('prom-client');

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const kycVerificationTotal = new client.Counter({
  name: 'kyc_verification_total',
  help: 'Total number of KYC verifications',
  labelNames: ['method', 'status']
});

const amlRiskAssessmentTotal = new client.Counter({
  name: 'aml_risk_assessment_total',
  help: 'Total number of AML risk assessments',
  labelNames: ['risk_level']
});

module.exports = {
  httpRequestDuration,
  kycVerificationTotal,
  amlRiskAssessmentTotal,
  register: client.register
};
```

---

## 📋 **Production Checklist**

### **Pre-Deployment**
- [ ] IDfy production account setup
- [ ] API credentials configured
- [ ] Database schema deployed
- [ ] Security measures implemented
- [ ] Load testing completed
- [ ] Monitoring setup
- [ ] Backup procedures tested

### **Post-Deployment**
- [ ] Health checks passing
- [ ] Metrics collection working
- [ ] Alerts configured
- [ ] Documentation updated
- [ ] Team training completed
- [ ] Incident response procedures ready

---

## 📞 **Support & Maintenance**

### **Key Contacts**
- **IDfy Support**: support@idfy.com
- **UIDAI Technical**: technical@uidai.gov.in
- **Internal Team**: dev-team@v-dex.com

### **Maintenance Schedule**
- **Daily**: Health check monitoring
- **Weekly**: Performance review
- **Monthly**: Security audit
- **Quarterly**: Compliance review

---

*This document is a living document and should be updated as the implementation progresses.*
```
