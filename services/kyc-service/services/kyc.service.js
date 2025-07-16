const axios = require('axios');
const logger = require('../../shared/logger');
const Utils = require('../../shared/utils');
const redisManager = require('../../shared/redis');

class KYCService {
  constructor() {
    this.baseURL = process.env.KYC_BASE_URL || 'https://apicentral.idfy.com';
    this.apiKey = process.env.KYC_API_KEY;
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Send Aadhaar OTP for verification
   * @param {string} aadhaarNumber - Aadhaar number
   * @param {string} userId - User ID for tracking
   * @returns {Object} OTP initiation response
   */
  async sendAadhaarOtp(aadhaarNumber, userId) {
    try {
      logger.kyc(userId, 'aadhaar_otp_init', 'started', { 
        aadhaar: Utils.maskSensitiveData(aadhaarNumber) 
      });

      // Validate Aadhaar format
      if (!Utils.validateAadhaarFormat(aadhaarNumber)) {
        throw new Error('Invalid Aadhaar number format');
      }

      const payload = {
        aadhaar: aadhaarNumber,
        consent: 'Y',
        reason: 'KYC verification for DEX platform'
      };

      const response = await axios.post(
        `${this.baseURL}/v3/tasks/async/verify_with_source/aadhaar`,
        payload,
        { headers: this.headers }
      );

      // Store reference in Redis for tracking
      const referenceId = response.data.request_id;
      await redisManager.set(
        `kyc:aadhaar:${userId}:${referenceId}`,
        {
          userId,
          aadhaarNumber: Utils.generateHash(aadhaarNumber), // Store hash only
          status: 'otp_sent',
          timestamp: new Date().toISOString()
        },
        300 // 5 minutes expiry
      );

      logger.kyc(userId, 'aadhaar_otp_init', 'completed', { 
        referenceId,
        status: response.data.status 
      });

      return {
        success: true,
        referenceId,
        message: 'OTP sent successfully',
        data: response.data
      };

    } catch (error) {
      logger.error('Aadhaar OTP initiation failed:', error);
      throw new Error(`Aadhaar OTP initiation failed: ${error.message}`);
    }
  }

  /**
   * Verify Aadhaar OTP and get KYC data
   * @param {string} referenceId - Reference ID from OTP initiation
   * @param {string} otp - OTP received by user
   * @param {string} userId - User ID
   * @returns {Object} Verification response with KYC data
   */
  async verifyAadhaarOtp(referenceId, otp, userId) {
    try {
      logger.kyc(userId, 'aadhaar_otp_verify', 'started', { referenceId });

      const payload = {
        request_id: referenceId,
        otp: otp
      };

      const response = await axios.post(
        `${this.baseURL}/v3/tasks/async/verify_with_source/aadhaar`,
        payload,
        { headers: this.headers }
      );

      // Update Redis with verification result
      await redisManager.set(
        `kyc:aadhaar:${userId}:${referenceId}`,
        {
          userId,
          status: 'verified',
          kycData: response.data.result,
          timestamp: new Date().toISOString()
        },
        3600 // 1 hour expiry
      );

      logger.kyc(userId, 'aadhaar_otp_verify', 'completed', { 
        referenceId,
        status: response.data.status 
      });

      return {
        success: true,
        data: response.data,
        kycData: response.data.result
      };

    } catch (error) {
      logger.error('Aadhaar OTP verification failed:', error);
      throw new Error(`Aadhaar OTP verification failed: ${error.message}`);
    }
  }

  /**
   * Verify PAN number
   * @param {string} panNumber - PAN number
   * @param {string} userId - User ID
   * @returns {Object} PAN verification response
   */
  async verifyPAN(panNumber, userId) {
    try {
      logger.kyc(userId, 'pan_verify', 'started', { 
        pan: Utils.maskSensitiveData(panNumber) 
      });

      // Validate PAN format
      if (!Utils.validatePANFormat(panNumber)) {
        throw new Error('Invalid PAN number format');
      }

      const payload = {
        task_id: Utils.generateReferenceId('PAN'),
        group_id: Utils.generateReferenceId('GRP'),
        data: {
          id_number: panNumber
        }
      };

      const response = await axios.post(
        `${this.baseURL}/v3/tasks/sync/verify_with_source/ind_pan`,
        payload,
        { headers: this.headers }
      );

      // Store verification result
      await redisManager.set(
        `kyc:pan:${userId}`,
        {
          userId,
          panHash: Utils.generateHash(panNumber),
          status: 'verified',
          verificationData: response.data.result,
          timestamp: new Date().toISOString()
        },
        86400 // 24 hours expiry
      );

      logger.kyc(userId, 'pan_verify', 'completed', { 
        status: response.data.status 
      });

      return {
        success: true,
        data: response.data,
        verificationData: response.data.result
      };

    } catch (error) {
      logger.error('PAN verification failed:', error);
      throw new Error(`PAN verification failed: ${error.message}`);
    }
  }

  /**
   * Verify Passport
   * @param {string} passportNumber - Passport number
   * @param {string} dob - Date of birth (YYYY-MM-DD)
   * @param {string} userId - User ID
   * @returns {Object} Passport verification response
   */
  async verifyPassport(passportNumber, dob, userId) {
    try {
      logger.kyc(userId, 'passport_verify', 'started', { 
        passport: Utils.maskSensitiveData(passportNumber) 
      });

      // Validate passport format
      if (!Utils.validatePassportFormat(passportNumber)) {
        throw new Error('Invalid passport number format');
      }

      // Validate date format
      if (!Utils.validateDateFormat(dob)) {
        throw new Error('Invalid date of birth format');
      }

      const payload = {
        task_id: Utils.generateReferenceId('PASSPORT'),
        group_id: Utils.generateReferenceId('GRP'),
        data: {
          passport_number: passportNumber,
          date_of_birth: dob
        }
      };

      const response = await axios.post(
        `${this.baseURL}/v3/tasks/sync/verify_with_source/ind_passport`,
        payload,
        { headers: this.headers }
      );

      // Store verification result
      await redisManager.set(
        `kyc:passport:${userId}`,
        {
          userId,
          passportHash: Utils.generateHash(passportNumber),
          status: 'verified',
          verificationData: response.data.result,
          timestamp: new Date().toISOString()
        },
        86400 // 24 hours expiry
      );

      logger.kyc(userId, 'passport_verify', 'completed', { 
        status: response.data.status 
      });

      return {
        success: true,
        data: response.data,
        verificationData: response.data.result
      };

    } catch (error) {
      logger.error('Passport verification failed:', error);
      throw new Error(`Passport verification failed: ${error.message}`);
    }
  }

  /**
   * Get KYC status for a user
   * @param {string} userId - User ID
   * @returns {Object} KYC status
   */
  async getKYCStatus(userId) {
    try {
      const aadhaarStatus = await redisManager.get(`kyc:aadhaar:${userId}:*`);
      const panStatus = await redisManager.get(`kyc:pan:${userId}`);
      const passportStatus = await redisManager.get(`kyc:passport:${userId}`);

      return {
        userId,
        aadhaar: aadhaarStatus ? 'verified' : 'pending',
        pan: panStatus ? 'verified' : 'pending',
        passport: passportStatus ? 'verified' : 'pending',
        overallStatus: this.calculateOverallStatus(aadhaarStatus, panStatus, passportStatus),
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error getting KYC status:', error);
      throw new Error('Failed to get KYC status');
    }
  }

  /**
   * Calculate overall KYC status
   * @param {Object} aadhaarStatus - Aadhaar verification status
   * @param {Object} panStatus - PAN verification status
   * @param {Object} passportStatus - Passport verification status
   * @returns {string} Overall status
   */
  calculateOverallStatus(aadhaarStatus, panStatus, passportStatus) {
    if (aadhaarStatus && panStatus) {
      return 'completed';
    } else if (aadhaarStatus || panStatus || passportStatus) {
      return 'partial';
    } else {
      return 'pending';
    }
  }

  /**
   * Get KYC progress for a user
   * @param {string} userId - User ID
   * @returns {Object} KYC progress
   */
  async getKYCProgress(userId) {
    try {
      const status = await this.getKYCStatus(userId);
      
      const progress = {
        userId,
        steps: {
          aadhaar: {
            completed: status.aadhaar === 'verified',
            required: true,
            description: 'Aadhaar verification with OTP'
          },
          pan: {
            completed: status.pan === 'verified',
            required: true,
            description: 'PAN card verification'
          },
          passport: {
            completed: status.passport === 'verified',
            required: false,
            description: 'Passport verification (optional)'
          }
        },
        completionPercentage: this.calculateCompletionPercentage(status),
        nextStep: this.getNextStep(status),
        overallStatus: status.overallStatus
      };

      return progress;

    } catch (error) {
      logger.error('Error getting KYC progress:', error);
      throw new Error('Failed to get KYC progress');
    }
  }

  /**
   * Calculate completion percentage
   * @param {Object} status - KYC status
   * @returns {number} Completion percentage
   */
  calculateCompletionPercentage(status) {
    let completed = 0;
    let total = 2; // Aadhaar and PAN are required

    if (status.aadhaar === 'verified') completed++;
    if (status.pan === 'verified') completed++;

    return Math.round((completed / total) * 100);
  }

  /**
   * Get next step in KYC process
   * @param {Object} status - KYC status
   * @returns {string} Next step
   */
  getNextStep(status) {
    if (status.aadhaar !== 'verified') {
      return 'aadhaar_verification';
    } else if (status.pan !== 'verified') {
      return 'pan_verification';
    } else {
      return 'completed';
    }
  }
}

module.exports = new KYCService();
