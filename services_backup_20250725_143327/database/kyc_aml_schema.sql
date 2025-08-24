-- KYC/AML Enhanced Database Schema for Indian Compliance
-- Supports PMLA, UIDAI, RBI/SEBI regulations with 5-year data retention

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- KYC Users Table (Enhanced)
CREATE TABLE kyc_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Personal Information (Encrypted)
    full_name_encrypted TEXT NOT NULL,
    date_of_birth_encrypted TEXT,
    gender VARCHAR(10),
    nationality VARCHAR(3) DEFAULT 'IN',
    
    -- Contact Information (Encrypted)
    email_encrypted TEXT,
    phone_encrypted TEXT,
    address_encrypted TEXT,
    
    -- KYC Status
    kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'in_progress', 'verified', 'rejected', 'expired')),
    kyc_level VARCHAR(10) DEFAULT 'basic' CHECK (kyc_level IN ('basic', 'intermediate', 'full')),
    
    -- Compliance Fields
    risk_category VARCHAR(10) DEFAULT 'low' CHECK (risk_category IN ('low', 'medium', 'high', 'critical')),
    pep_status BOOLEAN DEFAULT FALSE,
    sanctions_status BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit Fields
    created_by UUID,
    updated_by UUID,
    
    UNIQUE(user_id)
);

-- Aadhaar Verification Records
CREATE TABLE aadhaar_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES kyc_users(user_id) ON DELETE CASCADE,
    
    -- Aadhaar Details (Encrypted)
    aadhaar_number_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for indexing
    aadhaar_number_encrypted TEXT NOT NULL,
    
    -- Verification Details
    verification_method VARCHAR(20) NOT NULL CHECK (verification_method IN ('otp', 'biometric', 'qr_code', 'offline_xml')),
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'initiated', 'verified', 'failed', 'expired')),
    
    -- UIDAI Response Data (Encrypted)
    uidai_response_encrypted TEXT,
    reference_id VARCHAR(100),
    transaction_id VARCHAR(100),
    
    -- Extracted KYC Data (Encrypted)
    name_encrypted TEXT,
    dob_encrypted TEXT,
    gender VARCHAR(10),
    address_encrypted TEXT,
    photo_encrypted TEXT,
    
    -- OTP Specific Fields
    otp_attempts INTEGER DEFAULT 0,
    otp_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Compliance Fields
    consent_given BOOLEAN DEFAULT FALSE,
    consent_timestamp TIMESTAMP WITH TIME ZONE,
    data_retention_until TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 years'),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes'),
    
    -- Audit Fields
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT
);

-- PAN Verification Records
CREATE TABLE pan_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES kyc_users(user_id) ON DELETE CASCADE,
    
    -- PAN Details (Encrypted)
    pan_number_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for indexing
    pan_number_encrypted TEXT NOT NULL,
    
    -- Verification Details
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'invalid', 'not_found', 'failed')),
    nsdl_status VARCHAR(50),
    
    -- NSDL Response Data (Encrypted)
    nsdl_response_encrypted TEXT,
    reference_id VARCHAR(100),
    
    -- Extracted Data (Encrypted)
    name_on_pan_encrypted TEXT,
    pan_status VARCHAR(20),
    aadhaar_linked BOOLEAN,
    
    -- Compliance Fields
    data_retention_until TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 years'),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit Fields
    ip_address INET,
    user_agent TEXT
);

-- Passport Verification Records
CREATE TABLE passport_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES kyc_users(user_id) ON DELETE CASCADE,
    
    -- Passport Details (Encrypted)
    passport_number_hash VARCHAR(64) NOT NULL,
    passport_number_encrypted TEXT NOT NULL,
    
    -- Verification Details
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'invalid', 'expired', 'failed')),
    issuing_country VARCHAR(3) DEFAULT 'IN',
    
    -- Government Response Data (Encrypted)
    govt_response_encrypted TEXT,
    reference_id VARCHAR(100),
    
    -- Extracted Data (Encrypted)
    name_on_passport_encrypted TEXT,
    date_of_birth_encrypted TEXT,
    place_of_birth_encrypted TEXT,
    issue_date DATE,
    expiry_date DATE,
    
    -- Compliance Fields
    data_retention_until TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 years'),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit Fields
    ip_address INET,
    user_agent TEXT
);

-- AML Screening Records
CREATE TABLE aml_screenings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES kyc_users(user_id) ON DELETE CASCADE,
    
    -- Screening Details
    screening_type VARCHAR(20) NOT NULL CHECK (screening_type IN ('sanctions', 'pep', 'adverse_media', 'comprehensive')),
    screening_status VARCHAR(20) DEFAULT 'pending' CHECK (screening_status IN ('pending', 'in_progress', 'completed', 'failed')),
    
    -- Screening Parameters (Encrypted)
    search_parameters_encrypted TEXT NOT NULL,
    
    -- Results
    matches_found INTEGER DEFAULT 0,
    risk_score DECIMAL(5,3) DEFAULT 0.000,
    risk_level VARCHAR(10) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Provider Response (Encrypted)
    provider_response_encrypted TEXT,
    provider_name VARCHAR(50),
    reference_id VARCHAR(100),
    
    -- Lists Checked
    sanctions_lists TEXT[], -- Array of list names checked
    pep_lists TEXT[],
    
    -- Compliance Fields
    screening_required_by DATE,
    next_screening_due DATE DEFAULT (NOW() + INTERVAL '1 year'),
    data_retention_until TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 years'),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit Fields
    initiated_by UUID,
    automated_screening BOOLEAN DEFAULT FALSE
);

-- AML Screening Matches
CREATE TABLE aml_screening_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    screening_id UUID NOT NULL REFERENCES aml_screenings(id) ON DELETE CASCADE,
    
    -- Match Details
    match_type VARCHAR(20) NOT NULL CHECK (match_type IN ('sanctions', 'pep', 'adverse_media')),
    match_score DECIMAL(5,3) NOT NULL,
    list_name VARCHAR(100) NOT NULL,
    
    -- Matched Entity (Encrypted)
    matched_name_encrypted TEXT NOT NULL,
    matched_details_encrypted TEXT,
    
    -- Match Metadata
    match_reason TEXT,
    confidence_level VARCHAR(10) CHECK (confidence_level IN ('low', 'medium', 'high')),
    
    -- Review Status
    review_status VARCHAR(20) DEFAULT 'pending' CHECK (review_status IN ('pending', 'false_positive', 'confirmed', 'escalated')),
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Storage
CREATE TABLE kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES kyc_users(user_id) ON DELETE CASCADE,
    
    -- Document Details
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('aadhaar', 'pan', 'passport', 'voter_id', 'driving_license', 'bank_statement', 'utility_bill')),
    document_subtype VARCHAR(50), -- e.g., 'front', 'back', 'selfie'
    
    -- File Information
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for integrity
    
    -- Storage Information (Encrypted)
    storage_path_encrypted TEXT NOT NULL,
    encryption_key_id VARCHAR(100) NOT NULL,
    
    -- OCR and Processing
    ocr_status VARCHAR(20) DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed')),
    ocr_data_encrypted TEXT,
    
    -- Verification Status
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
    verification_notes TEXT,
    
    -- Compliance Fields
    data_retention_until TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 years'),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit Fields
    uploaded_by UUID,
    verified_by UUID,
    ip_address INET
);

-- Audit Trail Table
CREATE TABLE kyc_aml_audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Entity Information
    entity_type VARCHAR(50) NOT NULL, -- 'user', 'verification', 'screening', 'document'
    entity_id UUID NOT NULL,
    user_id UUID REFERENCES kyc_users(user_id),
    
    -- Action Details
    action VARCHAR(100) NOT NULL,
    action_category VARCHAR(50) NOT NULL, -- 'kyc', 'aml', 'document', 'system'
    
    -- Change Information
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    
    -- Compliance Fields
    regulatory_requirement VARCHAR(100), -- PMLA, UIDAI, etc.
    data_retention_until TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 years'),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Actor Information
    performed_by UUID,
    performed_by_type VARCHAR(20) DEFAULT 'user' CHECK (performed_by_type IN ('user', 'system', 'admin', 'api'))
);

-- Risk Assessment History
CREATE TABLE risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES kyc_users(user_id) ON DELETE CASCADE,
    
    -- Assessment Details
    assessment_type VARCHAR(50) NOT NULL DEFAULT 'comprehensive',
    risk_score DECIMAL(5,3) NOT NULL,
    risk_level VARCHAR(10) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Risk Factors (JSONB for flexibility)
    risk_factors JSONB NOT NULL,
    
    -- Assessment Results
    recommendations TEXT[],
    action_required BOOLEAN DEFAULT FALSE,
    escalation_required BOOLEAN DEFAULT FALSE,
    
    -- Validity
    valid_until TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year'),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Audit Fields
    assessed_by UUID,
    assessment_method VARCHAR(20) DEFAULT 'automated' CHECK (assessment_method IN ('automated', 'manual', 'hybrid'))
);

-- Indexes for Performance
CREATE INDEX idx_kyc_users_user_id ON kyc_users(user_id);
CREATE INDEX idx_kyc_users_status ON kyc_users(kyc_status);
CREATE INDEX idx_kyc_users_risk_category ON kyc_users(risk_category);

CREATE INDEX idx_aadhaar_verifications_user_id ON aadhaar_verifications(user_id);
CREATE INDEX idx_aadhaar_verifications_hash ON aadhaar_verifications(aadhaar_number_hash);
CREATE INDEX idx_aadhaar_verifications_status ON aadhaar_verifications(verification_status);

CREATE INDEX idx_pan_verifications_user_id ON pan_verifications(user_id);
CREATE INDEX idx_pan_verifications_hash ON pan_verifications(pan_number_hash);

CREATE INDEX idx_passport_verifications_user_id ON passport_verifications(user_id);
CREATE INDEX idx_passport_verifications_hash ON passport_verifications(passport_number_hash);

CREATE INDEX idx_aml_screenings_user_id ON aml_screenings(user_id);
CREATE INDEX idx_aml_screenings_type ON aml_screenings(screening_type);
CREATE INDEX idx_aml_screenings_status ON aml_screenings(screening_status);
CREATE INDEX idx_aml_screenings_next_due ON aml_screenings(next_screening_due);

CREATE INDEX idx_aml_matches_screening_id ON aml_screening_matches(screening_id);
CREATE INDEX idx_aml_matches_review_status ON aml_screening_matches(review_status);

CREATE INDEX idx_kyc_documents_user_id ON kyc_documents(user_id);
CREATE INDEX idx_kyc_documents_type ON kyc_documents(document_type);
CREATE INDEX idx_kyc_documents_status ON kyc_documents(verification_status);

CREATE INDEX idx_audit_trail_entity ON kyc_aml_audit_trail(entity_type, entity_id);
CREATE INDEX idx_audit_trail_user_id ON kyc_aml_audit_trail(user_id);
CREATE INDEX idx_audit_trail_created_at ON kyc_aml_audit_trail(created_at);
CREATE INDEX idx_audit_trail_category ON kyc_aml_audit_trail(action_category);

CREATE INDEX idx_risk_assessments_user_id ON risk_assessments(user_id);
CREATE INDEX idx_risk_assessments_level ON risk_assessments(risk_level);
CREATE INDEX idx_risk_assessments_valid_until ON risk_assessments(valid_until);

-- Row Level Security (RLS) Policies
ALTER TABLE kyc_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE aadhaar_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pan_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE passport_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE aml_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE aml_screening_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_aml_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Users can only access their own data)
CREATE POLICY "Users can view own KYC data" ON kyc_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own KYC data" ON kyc_users FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own Aadhaar verifications" ON aadhaar_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own Aadhaar verifications" ON aadhaar_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own PAN verifications" ON pan_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own PAN verifications" ON pan_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own passport verifications" ON passport_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own passport verifications" ON passport_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own AML screenings" ON aml_screenings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own documents" ON kyc_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload own documents" ON kyc_documents FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own audit trail" ON kyc_aml_audit_trail FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own risk assessments" ON risk_assessments FOR SELECT USING (auth.uid() = user_id);

-- Data Retention and Cleanup Functions
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
    -- Clean up expired OTP attempts
    DELETE FROM aadhaar_verifications 
    WHERE verification_status = 'pending' 
    AND expires_at < NOW();
    
    -- Archive old audit trail data (beyond 5 years)
    DELETE FROM kyc_aml_audit_trail 
    WHERE data_retention_until < NOW();
    
    -- Clean up expired risk assessments
    UPDATE risk_assessments 
    SET valid_until = NOW() 
    WHERE valid_until < NOW();
    
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup function (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-kyc-data', '0 2 * * *', 'SELECT cleanup_expired_data();');

-- Trigger Functions for Audit Trail
CREATE OR REPLACE FUNCTION audit_kyc_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO kyc_aml_audit_trail (
        entity_type,
        entity_id,
        user_id,
        action,
        action_category,
        old_values,
        new_values,
        performed_by,
        performed_by_type
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        COALESCE(NEW.user_id, OLD.user_id),
        TG_OP,
        'kyc',
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
        auth.uid(),
        'user'
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create Audit Triggers
CREATE TRIGGER audit_kyc_users AFTER INSERT OR UPDATE OR DELETE ON kyc_users FOR EACH ROW EXECUTE FUNCTION audit_kyc_changes();
CREATE TRIGGER audit_aadhaar_verifications AFTER INSERT OR UPDATE OR DELETE ON aadhaar_verifications FOR EACH ROW EXECUTE FUNCTION audit_kyc_changes();
CREATE TRIGGER audit_pan_verifications AFTER INSERT OR UPDATE OR DELETE ON pan_verifications FOR EACH ROW EXECUTE FUNCTION audit_kyc_changes();
CREATE TRIGGER audit_passport_verifications AFTER INSERT OR UPDATE OR DELETE ON passport_verifications FOR EACH ROW EXECUTE FUNCTION audit_kyc_changes();
CREATE TRIGGER audit_aml_screenings AFTER INSERT OR UPDATE OR DELETE ON aml_screenings FOR EACH ROW EXECUTE FUNCTION audit_kyc_changes();

-- Comments for Documentation
COMMENT ON TABLE kyc_users IS 'Enhanced KYC user profiles with Indian compliance features';
COMMENT ON TABLE aadhaar_verifications IS 'Aadhaar eKYC verification records with UIDAI compliance';
COMMENT ON TABLE pan_verifications IS 'PAN verification records with NSDL integration';
COMMENT ON TABLE passport_verifications IS 'Passport verification records with government database integration';
COMMENT ON TABLE aml_screenings IS 'AML screening records for PMLA compliance';
COMMENT ON TABLE aml_screening_matches IS 'Detailed matches found during AML screening';
COMMENT ON TABLE kyc_documents IS 'Encrypted document storage with OCR processing';
COMMENT ON TABLE kyc_aml_audit_trail IS '5-year audit trail for regulatory compliance';
COMMENT ON TABLE risk_assessments IS 'Risk assessment history and scoring';

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
