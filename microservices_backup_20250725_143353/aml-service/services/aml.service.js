const axios = require('axios');
const logger = require('../../shared/logger');
const Utils = require('../../shared/utils');
const redisManager = require('../../shared/redis');

class AMLService {
  constructor() {
    this.baseURL = process.env.AML_BASE_URL || 'https://apicentral.idfy.com';
    this.apiKey = process.env.AML_API_KEY;
    this.headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Risk scoring thresholds
    this.riskThresholds = {
      LOW: 0.3,
      MEDIUM: 0.6,
      HIGH: 0.8,
      CRITICAL: 0.95
    };
  }

  /**
   * Perform comprehensive AML screening
   * @param {string} userId - User ID
   * @param {Object} personalInfo - Personal information
   * @param {Array} walletAddresses - Wallet addresses to screen
   * @returns {Object} Comprehensive screening result
   */
  async performComprehensiveScreening(userId, personalInfo, walletAddresses = []) {
    try {
      logger.aml(userId, 'comprehensive_screening', 'started');

      const screeningResults = {
        userId,
        timestamp: new Date().toISOString(),
        sanctions: null,
        pep: null,
        adverseMedia: null,
        walletScreening: null,
        overallRiskScore: 0,
        riskLevel: 'LOW',
        status: 'completed',
        alerts: []
      };

      // 1. Sanctions screening
      screeningResults.sanctions = await this.checkSanctions(
        `${personalInfo.firstName} ${personalInfo.lastName}`,
        personalInfo.country || 'IN',
        userId
      );

      // 2. PEP screening
      screeningResults.pep = await this.checkPEP(
        personalInfo,
        userId
      );

      // 3. Adverse media screening
      screeningResults.adverseMedia = await this.checkAdverseMedia(
        personalInfo,
        userId
      );

      // 4. Wallet address screening
      if (walletAddresses.length > 0) {
        screeningResults.walletScreening = await this.screenWalletAddresses(
          walletAddresses,
          userId
        );
      }

      // Calculate overall risk score
      screeningResults.overallRiskScore = this.calculateOverallRiskScore(screeningResults);
      screeningResults.riskLevel = this.determineRiskLevel(screeningResults.overallRiskScore);

      // Generate alerts if necessary
      screeningResults.alerts = this.generateAlerts(screeningResults);

      // Store results in Redis
      await redisManager.set(
        `aml:screening:${userId}`,
        screeningResults,
        86400 // 24 hours
      );

      logger.aml(userId, 'comprehensive_screening', 'completed', {
        riskScore: screeningResults.overallRiskScore,
        riskLevel: screeningResults.riskLevel,
        alertCount: screeningResults.alerts.length
      });

      return screeningResults;

    } catch (error) {
      logger.error('Comprehensive AML screening failed:', error);
      throw new Error(`AML screening failed: ${error.message}`);
    }
  }

  /**
   * Check sanctions lists
   * @param {string} fullName - Full name to check
   * @param {string} country - Country code
   * @param {string} userId - User ID
   * @returns {Object} Sanctions screening result
   */
  async checkSanctions(fullName, country, userId) {
    try {
      logger.aml(userId, 'sanctions_check', 'started');

      // For development/testing, return mock data
      // In production, this would call the actual IDfy API
      const mockResult = {
        status: 'completed',
        matches: [], // No matches for clean result
        riskScore: 0.1, // Low risk score
        checkedLists: ['UN', 'OFAC', 'EU', 'RBI', 'FIU_INDIA'],
        timestamp: new Date().toISOString(),
        mockData: true // Indicates this is test data
      };

      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 100));

      logger.aml(userId, 'sanctions_check', 'completed', {
        matches: mockResult.matches.length,
        riskScore: mockResult.riskScore
      });

      return mockResult;

    } catch (error) {
      logger.error('Sanctions screening failed:', error);
      return {
        status: 'error',
        matches: [],
        riskScore: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check PEP (Politically Exposed Person) lists
   * @param {Object} personalInfo - Personal information
   * @param {string} userId - User ID
   * @returns {Object} PEP screening result
   */
  async checkPEP(personalInfo, userId) {
    try {
      logger.aml(userId, 'pep_check', 'started');

      // For development/testing, return mock data
      // In production, this would call the actual IDfy API
      const mockResult = {
        status: 'completed',
        matches: [], // No PEP matches for clean result
        riskScore: 0.2, // Low risk score
        timestamp: new Date().toISOString(),
        mockData: true // Indicates this is test data
      };

      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 100));

      logger.aml(userId, 'pep_check', 'completed', {
        matches: mockResult.matches.length,
        riskScore: mockResult.riskScore
      });

      return mockResult;

    } catch (error) {
      logger.error('PEP screening failed:', error);
      return {
        status: 'error',
        matches: [],
        riskScore: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check adverse media
   * @param {Object} personalInfo - Personal information
   * @param {string} userId - User ID
   * @returns {Object} Adverse media screening result
   */
  async checkAdverseMedia(personalInfo, userId) {
    try {
      logger.aml(userId, 'adverse_media_check', 'started');

      const payload = {
        task_id: Utils.generateReferenceId('MEDIA'),
        group_id: Utils.generateReferenceId('GRP'),
        data: {
          name: `${personalInfo.firstName} ${personalInfo.lastName}`,
          country: personalInfo.country || 'IN',
          search_depth: 'standard'
        }
      };

      const response = await axios.post(
        `${this.baseURL}/v3/tasks/sync/aml/adverse_media_screening`,
        payload,
        { headers: this.headers }
      );

      const result = {
        status: response.data.status,
        articles: response.data.result?.articles || [],
        riskScore: this.calculateAdverseMediaRiskScore(response.data.result),
        timestamp: new Date().toISOString()
      };

      logger.aml(userId, 'adverse_media_check', 'completed', {
        articles: result.articles.length,
        riskScore: result.riskScore
      });

      return result;

    } catch (error) {
      logger.error('Adverse media screening failed:', error);
      return {
        status: 'error',
        articles: [],
        riskScore: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Screen wallet addresses
   * @param {Array} walletAddresses - Wallet addresses to screen
   * @param {string} userId - User ID
   * @returns {Object} Wallet screening result
   */
  async screenWalletAddresses(walletAddresses, userId) {
    try {
      logger.aml(userId, 'wallet_screening', 'started', {
        addressCount: walletAddresses.length
      });

      const screeningResults = [];

      for (const address of walletAddresses) {
        const payload = {
          task_id: Utils.generateReferenceId('WALLET'),
          group_id: Utils.generateReferenceId('GRP'),
          data: {
            address: address.address,
            blockchain: address.network || 'ethereum'
          }
        };

        try {
          const response = await axios.post(
            `${this.baseURL}/v3/tasks/sync/aml/wallet_screening`,
            payload,
            { headers: this.headers }
          );

          screeningResults.push({
            address: address.address,
            network: address.network,
            status: response.data.status,
            riskScore: response.data.result?.risk_score || 0,
            flags: response.data.result?.flags || [],
            timestamp: new Date().toISOString()
          });

        } catch (addressError) {
          logger.error(`Wallet screening failed for ${address.address}:`, addressError);
          screeningResults.push({
            address: address.address,
            network: address.network,
            status: 'error',
            riskScore: 0,
            flags: [],
            error: addressError.message,
            timestamp: new Date().toISOString()
          });
        }
      }

      const result = {
        addresses: screeningResults,
        overallRiskScore: this.calculateWalletRiskScore(screeningResults),
        highRiskAddresses: screeningResults.filter(r => r.riskScore > this.riskThresholds.HIGH),
        timestamp: new Date().toISOString()
      };

      logger.aml(userId, 'wallet_screening', 'completed', {
        addressCount: walletAddresses.length,
        highRiskCount: result.highRiskAddresses.length,
        overallRiskScore: result.overallRiskScore
      });

      return result;

    } catch (error) {
      logger.error('Wallet screening failed:', error);
      return {
        addresses: [],
        overallRiskScore: 0,
        highRiskAddresses: [],
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate overall risk score
   * @param {Object} screeningResults - All screening results
   * @returns {number} Overall risk score (0-1)
   */
  calculateOverallRiskScore(screeningResults) {
    const weights = {
      sanctions: 0.4,
      pep: 0.25,
      adverseMedia: 0.2,
      wallet: 0.15
    };

    let totalScore = 0;
    let totalWeight = 0;

    if (screeningResults.sanctions) {
      totalScore += screeningResults.sanctions.riskScore * weights.sanctions;
      totalWeight += weights.sanctions;
    }

    if (screeningResults.pep) {
      totalScore += screeningResults.pep.riskScore * weights.pep;
      totalWeight += weights.pep;
    }

    if (screeningResults.adverseMedia) {
      totalScore += screeningResults.adverseMedia.riskScore * weights.adverseMedia;
      totalWeight += weights.adverseMedia;
    }

    if (screeningResults.walletScreening) {
      totalScore += screeningResults.walletScreening.overallRiskScore * weights.wallet;
      totalWeight += weights.wallet;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Determine risk level based on score
   * @param {number} riskScore - Risk score (0-1)
   * @returns {string} Risk level
   */
  determineRiskLevel(riskScore) {
    if (riskScore >= this.riskThresholds.CRITICAL) return 'CRITICAL';
    if (riskScore >= this.riskThresholds.HIGH) return 'HIGH';
    if (riskScore >= this.riskThresholds.MEDIUM) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Calculate sanctions risk score
   * @param {Object} result - Sanctions screening result
   * @returns {number} Risk score (0-1)
   */
  calculateSanctionsRiskScore(result) {
    if (!result || !result.matches) return 0;
    
    const matches = result.matches;
    if (matches.length === 0) return 0;
    
    // High risk if any exact matches
    const exactMatches = matches.filter(m => m.match_strength === 'exact');
    if (exactMatches.length > 0) return 1.0;
    
    // Medium risk for strong matches
    const strongMatches = matches.filter(m => m.match_strength === 'strong');
    if (strongMatches.length > 0) return 0.8;
    
    // Low-medium risk for weak matches
    return 0.4;
  }

  /**
   * Calculate PEP risk score
   * @param {Object} result - PEP screening result
   * @returns {number} Risk score (0-1)
   */
  calculatePEPRiskScore(result) {
    if (!result || !result.matches) return 0;
    
    const matches = result.matches;
    if (matches.length === 0) return 0;
    
    // Risk based on PEP level
    const highLevelPEP = matches.filter(m => 
      m.pep_level === 'high' || m.position_level === 'senior'
    );
    
    if (highLevelPEP.length > 0) return 0.9;
    
    const mediumLevelPEP = matches.filter(m => 
      m.pep_level === 'medium' || m.position_level === 'mid'
    );
    
    if (mediumLevelPEP.length > 0) return 0.6;
    
    return 0.3;
  }

  /**
   * Calculate adverse media risk score
   * @param {Object} result - Adverse media screening result
   * @returns {number} Risk score (0-1)
   */
  calculateAdverseMediaRiskScore(result) {
    if (!result || !result.articles) return 0;
    
    const articles = result.articles;
    if (articles.length === 0) return 0;
    
    // Risk based on article severity and recency
    const highSeverityArticles = articles.filter(a => 
      a.severity === 'high' || a.category === 'criminal'
    );
    
    if (highSeverityArticles.length > 0) return 0.8;
    
    const mediumSeverityArticles = articles.filter(a => 
      a.severity === 'medium' || a.category === 'regulatory'
    );
    
    if (mediumSeverityArticles.length > 0) return 0.5;
    
    return 0.2;
  }

  /**
   * Calculate wallet risk score
   * @param {Array} screeningResults - Wallet screening results
   * @returns {number} Overall wallet risk score (0-1)
   */
  calculateWalletRiskScore(screeningResults) {
    if (!screeningResults || screeningResults.length === 0) return 0;
    
    const validResults = screeningResults.filter(r => r.status !== 'error');
    if (validResults.length === 0) return 0;
    
    const totalRisk = validResults.reduce((sum, result) => sum + result.riskScore, 0);
    return totalRisk / validResults.length;
  }

  /**
   * Generate alerts based on screening results
   * @param {Object} screeningResults - All screening results
   * @returns {Array} Generated alerts
   */
  generateAlerts(screeningResults) {
    const alerts = [];
    
    // Sanctions alerts
    if (screeningResults.sanctions?.matches?.length > 0) {
      alerts.push({
        type: 'SANCTIONS_MATCH',
        severity: 'HIGH',
        message: `User matches ${screeningResults.sanctions.matches.length} sanctions list(s)`,
        details: screeningResults.sanctions.matches,
        timestamp: new Date().toISOString()
      });
    }
    
    // PEP alerts
    if (screeningResults.pep?.matches?.length > 0) {
      alerts.push({
        type: 'PEP_MATCH',
        severity: 'MEDIUM',
        message: `User matches ${screeningResults.pep.matches.length} PEP record(s)`,
        details: screeningResults.pep.matches,
        timestamp: new Date().toISOString()
      });
    }
    
    // High-risk wallet alerts
    if (screeningResults.walletScreening?.highRiskAddresses?.length > 0) {
      alerts.push({
        type: 'HIGH_RISK_WALLET',
        severity: 'HIGH',
        message: `${screeningResults.walletScreening.highRiskAddresses.length} high-risk wallet address(es) detected`,
        details: screeningResults.walletScreening.highRiskAddresses,
        timestamp: new Date().toISOString()
      });
    }
    
    // Overall high risk alert
    if (screeningResults.overallRiskScore >= this.riskThresholds.HIGH) {
      alerts.push({
        type: 'HIGH_OVERALL_RISK',
        severity: 'HIGH',
        message: `Overall risk score is ${(screeningResults.overallRiskScore * 100).toFixed(1)}%`,
        details: { riskScore: screeningResults.overallRiskScore },
        timestamp: new Date().toISOString()
      });
    }
    
    return alerts;
  }

  /**
   * Get screening status for a user
   * @param {string} userId - User ID
   * @returns {Object} Screening status
   */
  async getScreeningStatus(userId) {
    try {
      const cachedResult = await redisManager.get(`aml:screening:${userId}`);
      
      if (cachedResult) {
        return {
          userId,
          status: 'completed',
          lastScreened: cachedResult.timestamp,
          riskLevel: cachedResult.riskLevel,
          riskScore: cachedResult.overallRiskScore,
          alertCount: cachedResult.alerts?.length || 0
        };
      }
      
      return {
        userId,
        status: 'not_screened',
        lastScreened: null,
        riskLevel: 'UNKNOWN',
        riskScore: 0,
        alertCount: 0
      };
      
    } catch (error) {
      logger.error('Error getting screening status:', error);
      throw new Error('Failed to get screening status');
    }
  }
}

module.exports = new AMLService();
