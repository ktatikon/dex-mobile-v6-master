# 📚 KYC/AML Microservices API Documentation

## 🌐 **Base URLs**
- **KYC Service**: `http://localhost:4001` | `http://192.168.1.4:4001`
- **AML Service**: `http://localhost:4002` | `http://192.168.1.4:4002`

## 🔐 **Authentication**
All API endpoints require authentication via `X-API-Key` header:
```
X-API-Key: super_secure_admin_key_change_in_production
```

---

## 🆔 **KYC Service API**

### **Health & Monitoring**

#### `GET /health`
Get service health status
```bash
curl -H "X-API-Key: super_secure_admin_key_change_in_production" \
     http://localhost:4001/health
```

### **Aadhaar Verification**

#### `POST /api/kyc/aadhaar/validate`
Validate Aadhaar number format using Verhoeff algorithm
```bash
curl -X POST -H "X-API-Key: super_secure_admin_key_change_in_production" \
     -H "Content-Type: application/json" \
     -d '{"aadhaarNumber": "234567890123"}' \
     http://localhost:4001/api/kyc/aadhaar/validate
```

#### `POST /api/kyc/aadhaar/otp/initiate`
Initiate Aadhaar OTP verification with IDfy
```bash
curl -X POST -H "X-API-Key: super_secure_admin_key_change_in_production" \
     -H "Content-Type: application/json" \
     -d '{"aadhaarNumber": "234567890123", "userId": "550e8400-e29b-41d4-a716-446655440000", "consent": true}' \
     http://localhost:4001/api/kyc/aadhaar/otp/initiate
```

### **PAN Verification**

#### `POST /api/kyc/pan/validate`
Validate PAN number format (ABCDE1234F pattern)
```bash
curl -X POST -H "X-API-Key: super_secure_admin_key_change_in_production" \
     -H "Content-Type: application/json" \
     -d '{"panNumber": "ABCDE1234F"}' \
     http://localhost:4001/api/kyc/pan/validate
```

#### `POST /api/kyc/pan/verify`
Verify PAN with NSDL database via IDfy
```bash
curl -X POST -H "X-API-Key: super_secure_admin_key_change_in_production" \
     -H "Content-Type: application/json" \
     -d '{"panNumber": "ABCDE1234F", "userId": "550e8400-e29b-41d4-a716-446655440000"}' \
     http://localhost:4001/api/kyc/pan/verify
```

---

## 🛡️ **AML Service API**

### **Health & Monitoring**

#### `GET /health`
Get service health status
```bash
curl -H "X-API-Key: super_secure_admin_key_change_in_production" \
     http://localhost:4002/health
```

### **Sanctions Screening**

#### `POST /api/aml/sanctions/check`
Check user against global sanctions lists (UN, OFAC, RBI, FIU)
```bash
curl -X POST -H "X-API-Key: super_secure_admin_key_change_in_production" \
     -H "Content-Type: application/json" \
     -d '{"fullName": "John Doe", "country": "IN", "userId": "550e8400-e29b-41d4-a716-446655440000"}' \
     http://localhost:4002/api/aml/sanctions/check
```

### **PEP Screening**

#### `POST /api/aml/pep/check`
Check user against Politically Exposed Person lists
```bash
curl -X POST -H "X-API-Key: super_secure_admin_key_change_in_production" \
     -H "Content-Type: application/json" \
     -d '{"personalInfo": {"firstName": "John", "lastName": "Doe", "country": "IN"}, "userId": "550e8400-e29b-41d4-a716-446655440000"}' \
     http://localhost:4002/api/aml/pep/check
```

### **Risk Assessment**

#### `POST /api/aml/risk/assess`
Perform comprehensive risk assessment
```bash
curl -X POST -H "X-API-Key: super_secure_admin_key_change_in_production" \
     -H "Content-Type: application/json" \
     -d '{"userId": "550e8400-e29b-41d4-a716-446655440000", "riskFactors": {"transactionVolume": 0.3}}' \
     http://localhost:4002/api/aml/risk/assess
```

---

## 📊 **Response Formats**

### **Success Response**
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "timestamp": "2025-07-15T12:03:33.265Z"
}
```

### **Error Response**
```json
{
  "success": false,
  "error": "Error description",
  "details": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

---

## 🔒 **Security Features**

- **Rate Limiting**: 30 req/min general, 5 req/5min sensitive
- **PII Masking**: Automatic masking in logs
- **Input Validation**: Joi schema validation
- **CORS Protection**: Local network support
- **Audit Logging**: 5-year retention compliance

---

## 🧪 **Testing**

Run comprehensive tests:
```bash
cd services
./test-endpoints.sh
```

**✅ All endpoints tested and operational**
