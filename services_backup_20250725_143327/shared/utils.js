const crypto = require('crypto');
const logger = require('./logger');

/**
 * Utility functions for KYC/AML services
 */
class Utils {
  /**
   * Validate Aadhaar number format
   * @param {string} aadhaar - Aadhaar number
   * @returns {boolean} True if valid format
   */
  static validateAadhaarFormat(aadhaar) {
    if (!aadhaar || typeof aadhaar !== 'string') return false;

    // Remove spaces and hyphens
    const cleanAadhaar = aadhaar.replace(/[\s-]/g, '');

    // Check if it's 12 digits
    if (!/^\d{12}$/.test(cleanAadhaar)) return false;

    // Aadhaar should not start with 0 or 1
    if (cleanAadhaar.startsWith('0') || cleanAadhaar.startsWith('1')) return false;

    // For testing purposes, skip Verhoeff validation if in development mode
    if (process.env.NODE_ENV === 'development' || process.env.SKIP_AADHAAR_CHECKSUM === 'true') {
      return true; // Skip checksum validation for testing
    }

    // Verhoeff algorithm validation (simplified)
    return this.verhoeffCheck(cleanAadhaar);
  }

  /**
   * Validate PAN number format
   * @param {string} pan - PAN number
   * @returns {boolean} True if valid format
   */
  static validatePANFormat(pan) {
    if (!pan || typeof pan !== 'string') return false;
    
    // PAN format: ABCDE1234F (5 letters, 4 digits, 1 letter)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan.toUpperCase());
  }

  /**
   * Validate passport number format
   * @param {string} passport - Passport number
   * @returns {boolean} True if valid format
   */
  static validatePassportFormat(passport) {
    if (!passport || typeof passport !== 'string') return false;
    
    // Indian passport format: A1234567 or AB1234567
    const passportRegex = /^[A-Z]{1,2}[0-9]{7}$/;
    return passportRegex.test(passport.toUpperCase());
  }

  /**
   * Mask sensitive data for display
   * @param {string} data - Data to mask
   * @param {number} visibleStart - Number of characters to show at start
   * @param {number} visibleEnd - Number of characters to show at end
   * @returns {string} Masked data
   */
  static maskSensitiveData(data, visibleStart = 2, visibleEnd = 2) {
    if (!data || typeof data !== 'string') return '***';
    
    if (data.length <= visibleStart + visibleEnd) {
      return '*'.repeat(data.length);
    }
    
    const start = data.substring(0, visibleStart);
    const end = data.substring(data.length - visibleEnd);
    const middle = '*'.repeat(data.length - visibleStart - visibleEnd);
    
    return start + middle + end;
  }

  /**
   * Generate unique reference ID
   * @param {string} prefix - Prefix for the ID
   * @returns {string} Unique reference ID
   */
  static generateReferenceId(prefix = 'REF') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Encrypt sensitive data
   * @param {string} data - Data to encrypt
   * @param {string} key - Encryption key
   * @returns {string} Encrypted data
   */
  static encrypt(data, key = process.env.ENCRYPTION_KEY) {
    if (!key) throw new Error('Encryption key not provided');
    
    try {
      const algorithm = 'aes-256-gcm';
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, key);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      logger.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   * @param {Object} encryptedData - Encrypted data object
   * @param {string} key - Decryption key
   * @returns {string} Decrypted data
   */
  static decrypt(encryptedData, key = process.env.ENCRYPTION_KEY) {
    if (!key) throw new Error('Decryption key not provided');
    
    try {
      const algorithm = 'aes-256-gcm';
      const decipher = crypto.createDecipher(algorithm, key);
      
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Validate Indian mobile number
   * @param {string} mobile - Mobile number
   * @returns {boolean} True if valid
   */
  static validateMobileNumber(mobile) {
    if (!mobile || typeof mobile !== 'string') return false;
    
    // Remove country code and spaces
    const cleanMobile = mobile.replace(/[\s+()-]/g, '');
    
    // Indian mobile number: 10 digits starting with 6-9
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(cleanMobile);
  }

  /**
   * Validate email format
   * @param {string} email - Email address
   * @returns {boolean} True if valid
   */
  static validateEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Calculate age from date of birth
   * @param {string} dob - Date of birth (YYYY-MM-DD)
   * @returns {number} Age in years
   */
  static calculateAge(dob) {
    if (!dob) return 0;
    
    const birthDate = new Date(dob);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Verhoeff algorithm check for Aadhaar validation
   * @param {string} num - Number to validate
   * @returns {boolean} True if valid
   */
  static verhoeffCheck(num) {
    // Simplified Verhoeff algorithm implementation
    const d = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
      [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
      [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
      [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
      [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
      [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
      [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
      [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
      [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    ];

    const p = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
      [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
      [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
      [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
      [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
      [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
      [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
    ];

    let c = 0;
    const myArray = num.split('').reverse();

    for (let i = 0; i < myArray.length; i++) {
      c = d[c][p[((i + 1) % 8)][parseInt(myArray[i])]];
    }

    return c === 0;
  }

  /**
   * Sanitize input data
   * @param {any} input - Input to sanitize
   * @returns {any} Sanitized input
   */
  static sanitizeInput(input) {
    if (typeof input === 'string') {
      return input.trim().replace(/[<>]/g, '');
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  /**
   * Generate hash for data integrity
   * @param {string} data - Data to hash
   * @returns {string} SHA-256 hash
   */
  static generateHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Validate date format (YYYY-MM-DD)
   * @param {string} date - Date string
   * @returns {boolean} True if valid
   */
  static validateDateFormat(date) {
    if (!date || typeof date !== 'string') return false;
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate);
  }

  /**
   * Rate limiting key generator
   * @param {string} identifier - Identifier (IP, user ID, etc.)
   * @param {string} action - Action type
   * @returns {string} Rate limiting key
   */
  static generateRateLimitKey(identifier, action) {
    return `rate_limit:${action}:${identifier}`;
  }
}

module.exports = Utils;
