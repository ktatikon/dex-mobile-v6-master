const Joi = require('joi');
const logger = require('../../shared/logger');
const Utils = require('../../shared/utils');

class ValidationMiddleware {
  /**
   * Validate request body against Joi schema
   * @param {Object} schema - Joi validation schema
   */
  validateBody(schema) {
    return (req, res, next) => {
      try {
        // Sanitize input data
        req.body = Utils.sanitizeInput(req.body);
        
        const { error, value } = schema.validate(req.body, {
          abortEarly: false,
          stripUnknown: true,
          convert: true
        });
        
        if (error) {
          const errorDetails = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value
          }));
          
          logger.warn('Request body validation failed', {
            endpoint: req.path,
            errors: errorDetails,
            userId: req.user?.sub || req.user?.userId
          });
          
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errorDetails
          });
        }
        
        // Replace req.body with validated and sanitized data
        req.body = value;
        next();
        
      } catch (validationError) {
        logger.error('Body validation middleware error:', validationError);
        return res.status(500).json({
          success: false,
          error: 'Validation service error'
        });
      }
    };
  }

  /**
   * Validate request parameters against Joi schema
   * @param {Object} schema - Joi validation schema
   */
  validateParams(schema) {
    return (req, res, next) => {
      try {
        const { error, value } = schema.validate(req.params, {
          abortEarly: false,
          stripUnknown: true,
          convert: true
        });
        
        if (error) {
          const errorDetails = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value
          }));
          
          logger.warn('Request params validation failed', {
            endpoint: req.path,
            errors: errorDetails,
            userId: req.user?.sub || req.user?.userId
          });
          
          return res.status(400).json({
            success: false,
            error: 'Parameter validation failed',
            details: errorDetails
          });
        }
        
        req.params = value;
        next();
        
      } catch (validationError) {
        logger.error('Params validation middleware error:', validationError);
        return res.status(500).json({
          success: false,
          error: 'Validation service error'
        });
      }
    };
  }

  /**
   * Validate query parameters against Joi schema
   * @param {Object} schema - Joi validation schema
   */
  validateQuery(schema) {
    return (req, res, next) => {
      try {
        const { error, value } = schema.validate(req.query, {
          abortEarly: false,
          stripUnknown: true,
          convert: true
        });
        
        if (error) {
          const errorDetails = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value
          }));
          
          logger.warn('Request query validation failed', {
            endpoint: req.path,
            errors: errorDetails,
            userId: req.user?.sub || req.user?.userId
          });
          
          return res.status(400).json({
            success: false,
            error: 'Query validation failed',
            details: errorDetails
          });
        }
        
        req.query = value;
        next();
        
      } catch (validationError) {
        logger.error('Query validation middleware error:', validationError);
        return res.status(500).json({
          success: false,
          error: 'Validation service error'
        });
      }
    };
  }

  /**
   * Validate wallet addresses
   * @param {Object} options - Validation options
   */
  validateWalletAddresses(options = {}) {
    const {
      maxAddresses = 10,
      requiredNetworks = ['ethereum', 'bitcoin', 'polygon']
    } = options;
    
    return (req, res, next) => {
      try {
        const { walletAddresses } = req.body;
        
        if (!walletAddresses || !Array.isArray(walletAddresses)) {
          return res.status(400).json({
            success: false,
            error: 'Wallet addresses must be provided as an array'
          });
        }
        
        if (walletAddresses.length > maxAddresses) {
          return res.status(400).json({
            success: false,
            error: `Maximum ${maxAddresses} wallet addresses allowed`
          });
        }
        
        const errors = [];
        
        walletAddresses.forEach((wallet, index) => {
          if (!wallet.address || typeof wallet.address !== 'string') {
            errors.push({
              field: `walletAddresses[${index}].address`,
              message: 'Address is required and must be a string'
            });
          }
          
          if (!wallet.network || typeof wallet.network !== 'string') {
            errors.push({
              field: `walletAddresses[${index}].network`,
              message: 'Network is required and must be a string'
            });
          }
          
          // Basic address format validation
          if (wallet.address && wallet.network) {
            if (!this.isValidAddressFormat(wallet.address, wallet.network)) {
              errors.push({
                field: `walletAddresses[${index}].address`,
                message: `Invalid address format for ${wallet.network} network`
              });
            }
          }
        });
        
        if (errors.length > 0) {
          logger.warn('Wallet address validation failed', {
            endpoint: req.path,
            errors,
            userId: req.user?.sub || req.user?.userId
          });
          
          return res.status(400).json({
            success: false,
            error: 'Wallet address validation failed',
            details: errors
          });
        }
        
        next();
        
      } catch (validationError) {
        logger.error('Wallet address validation middleware error:', validationError);
        return res.status(500).json({
          success: false,
          error: 'Wallet validation service error'
        });
      }
    };
  }

  /**
   * Validate address format for different networks
   * @param {string} address - Wallet address
   * @param {string} network - Network name
   * @returns {boolean} True if valid format
   */
  isValidAddressFormat(address, network) {
    const patterns = {
      ethereum: /^0x[a-fA-F0-9]{40}$/,
      polygon: /^0x[a-fA-F0-9]{40}$/,
      bitcoin: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
      binance: /^0x[a-fA-F0-9]{40}$/,
      arbitrum: /^0x[a-fA-F0-9]{40}$/,
      optimism: /^0x[a-fA-F0-9]{40}$/
    };
    
    const pattern = patterns[network.toLowerCase()];
    return pattern ? pattern.test(address) : true; // Allow unknown networks
  }

  /**
   * Validate AML screening parameters
   */
  validateAMLScreening(req, res, next) {
    try {
      const { personalInfo } = req.body;
      const errors = [];
      
      if (!personalInfo) {
        errors.push({
          field: 'personalInfo',
          message: 'Personal information is required for AML screening'
        });
      } else {
        // Validate required personal info fields
        if (!personalInfo.firstName || personalInfo.firstName.length < 2) {
          errors.push({
            field: 'personalInfo.firstName',
            message: 'First name is required and must be at least 2 characters'
          });
        }
        
        if (!personalInfo.lastName || personalInfo.lastName.length < 2) {
          errors.push({
            field: 'personalInfo.lastName',
            message: 'Last name is required and must be at least 2 characters'
          });
        }
        
        if (personalInfo.dateOfBirth && !Utils.validateDateFormat(personalInfo.dateOfBirth)) {
          errors.push({
            field: 'personalInfo.dateOfBirth',
            message: 'Date of birth must be in YYYY-MM-DD format'
          });
        }
        
        if (personalInfo.country && personalInfo.country.length !== 2) {
          errors.push({
            field: 'personalInfo.country',
            message: 'Country must be a 2-letter ISO code'
          });
        }
      }
      
      if (errors.length > 0) {
        logger.warn('AML screening validation failed', {
          endpoint: req.path,
          errors,
          userId: req.user?.sub || req.user?.userId
        });
        
        return res.status(400).json({
          success: false,
          error: 'AML screening validation failed',
          details: errors
        });
      }
      
      next();
      
    } catch (validationError) {
      logger.error('AML screening validation middleware error:', validationError);
      return res.status(500).json({
        success: false,
        error: 'AML validation service error'
      });
    }
  }

  /**
   * Validate risk assessment parameters
   */
  validateRiskAssessment(req, res, next) {
    try {
      const { riskFactors } = req.body;
      
      if (riskFactors && typeof riskFactors !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Risk factors must be an object'
        });
      }
      
      // Validate risk factor values
      if (riskFactors) {
        const validFactors = [
          'transactionVolume',
          'transactionFrequency',
          'geographicRisk',
          'industryRisk',
          'customerType'
        ];
        
        const invalidFactors = Object.keys(riskFactors).filter(
          factor => !validFactors.includes(factor)
        );
        
        if (invalidFactors.length > 0) {
          return res.status(400).json({
            success: false,
            error: `Invalid risk factors: ${invalidFactors.join(', ')}`
          });
        }
      }
      
      next();
      
    } catch (validationError) {
      logger.error('Risk assessment validation middleware error:', validationError);
      return res.status(500).json({
        success: false,
        error: 'Risk assessment validation service error'
      });
    }
  }
}

module.exports = new ValidationMiddleware();
