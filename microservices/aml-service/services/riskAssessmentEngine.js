const logger = require('../../shared/logger');
const Utils = require('../../shared/utils');

class RiskAssessmentEngine {
  constructor() {
    // Risk assessment configuration
    this.riskConfig = {
      // Risk factor weights (must sum to 1.0)
      weights: {
        transactionVolume: 0.25,
        transactionFrequency: 0.20,
        geographicRisk: 0.15,
        industryRisk: 0.10,
        customerType: 0.10,
        behavioralPatterns: 0.10,
        sanctionsStatus: 0.05,
        pepStatus: 0.05
      },
      
      // Risk thresholds
      thresholds: {
        low: 0.3,
        medium: 0.6,
        high: 0.8,
        critical: 0.95
      },
      
      // Transaction monitoring parameters
      monitoring: {
        volumeThresholds: {
          daily: 50000,    // INR 50,000
          monthly: 200000, // INR 2,00,000
          yearly: 1000000  // INR 10,00,000
        },
        frequencyThresholds: {
          daily: 10,
          hourly: 5,
          suspicious: 20
        },
        velocityThresholds: {
          rapidIncrease: 3.0, // 3x normal volume
          rapidFrequency: 5.0  // 5x normal frequency
        }
      }
    };
    
    // Geographic risk mapping
    this.geographicRisk = {
      'IN': 0.1,  // India - Low risk
      'US': 0.1,  // United States - Low risk
      'GB': 0.1,  // United Kingdom - Low risk
      'SG': 0.1,  // Singapore - Low risk
      'AE': 0.2,  // UAE - Low-Medium risk
      'CH': 0.1,  // Switzerland - Low risk
      'HK': 0.2,  // Hong Kong - Low-Medium risk
      'DEFAULT': 0.5 // Unknown countries - Medium risk
    };
    
    // Industry risk mapping
    this.industryRisk = {
      'technology': 0.1,
      'finance': 0.3,
      'healthcare': 0.1,
      'education': 0.1,
      'retail': 0.2,
      'real_estate': 0.4,
      'gaming': 0.6,
      'cryptocurrency': 0.8,
      'money_services': 0.7,
      'precious_metals': 0.5,
      'DEFAULT': 0.3
    };
  }

  /**
   * Perform comprehensive risk assessment
   */
  async performRiskAssessment(userId, assessmentData, options = {}) {
    try {
      logger.aml(userId, 'risk_assessment', 'started', {
        assessmentType: options.assessmentType || 'comprehensive'
      });

      // Extract risk factors
      const riskFactors = await this.extractRiskFactors(userId, assessmentData);
      
      // Calculate individual risk scores
      const individualScores = await this.calculateIndividualScores(riskFactors);
      
      // Calculate weighted overall score
      const overallScore = this.calculateWeightedScore(individualScores);
      
      // Determine risk level
      const riskLevel = this.determineRiskLevel(overallScore);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(riskLevel, riskFactors, individualScores);
      
      // Create assessment result
      const assessment = {
        userId,
        assessmentId: Utils.generateReferenceId('RISK_ASSESS'),
        assessmentType: options.assessmentType || 'comprehensive',
        
        // Scores
        overallScore: Math.round(overallScore * 1000) / 1000, // Round to 3 decimal places
        riskLevel,
        
        // Detailed breakdown
        riskFactors,
        individualScores,
        weightedContributions: this.calculateWeightedContributions(individualScores),
        
        // Analysis
        riskIndicators: this.identifyRiskIndicators(riskFactors, individualScores),
        recommendations,
        
        // Metadata
        assessmentDate: new Date().toISOString(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        assessmentVersion: '2.0',
        
        // Compliance
        regulatoryRequirements: this.getApplicableRegulations(riskLevel),
        nextReviewDate: this.calculateNextReviewDate(riskLevel),
        
        mockData: true // Indicates this is development data
      };

      logger.aml(userId, 'risk_assessment', 'completed', {
        overallScore: assessment.overallScore,
        riskLevel: assessment.riskLevel
      });

      return assessment;

    } catch (error) {
      logger.error('Risk assessment failed:', error);
      throw error;
    }
  }

  /**
   * Extract risk factors from assessment data
   */
  async extractRiskFactors(userId, data) {
    const factors = {
      // Transaction-based factors
      transactionVolume: {
        daily: data.transactions?.dailyVolume || 0,
        monthly: data.transactions?.monthlyVolume || 0,
        yearly: data.transactions?.yearlyVolume || 0,
        averageAmount: data.transactions?.averageAmount || 0
      },
      
      transactionFrequency: {
        daily: data.transactions?.dailyCount || 0,
        monthly: data.transactions?.monthlyCount || 0,
        hourlyPeak: data.transactions?.hourlyPeak || 0,
        velocity: data.transactions?.velocity || 1.0
      },
      
      // Geographic factors
      geographicRisk: {
        primaryCountry: data.profile?.country || 'IN',
        transactionCountries: data.transactions?.countries || ['IN'],
        highRiskCountries: data.transactions?.highRiskCountries || []
      },
      
      // Customer profile factors
      customerType: data.profile?.customerType || 'individual',
      industryRisk: {
        industry: data.profile?.industry || 'technology',
        businessType: data.profile?.businessType || 'individual'
      },
      
      // Behavioral patterns
      behavioralPatterns: {
        loginFrequency: data.behavior?.loginFrequency || 'normal',
        deviceChanges: data.behavior?.deviceChanges || 0,
        locationChanges: data.behavior?.locationChanges || 0,
        timePatterns: data.behavior?.timePatterns || 'normal'
      },
      
      // Compliance status
      sanctionsStatus: data.compliance?.sanctionsMatches || 0,
      pepStatus: data.compliance?.pepMatches || 0,
      
      // Additional factors
      accountAge: data.profile?.accountAge || 0,
      verificationLevel: data.profile?.verificationLevel || 'basic',
      previousIncidents: data.history?.incidents || 0
    };
    
    return factors;
  }

  /**
   * Calculate individual risk scores for each factor
   */
  async calculateIndividualScores(factors) {
    const scores = {};
    
    // Transaction Volume Score
    scores.transactionVolume = this.calculateVolumeScore(factors.transactionVolume);
    
    // Transaction Frequency Score
    scores.transactionFrequency = this.calculateFrequencyScore(factors.transactionFrequency);
    
    // Geographic Risk Score
    scores.geographicRisk = this.calculateGeographicScore(factors.geographicRisk);
    
    // Industry Risk Score
    scores.industryRisk = this.calculateIndustryScore(factors.industryRisk);
    
    // Customer Type Score
    scores.customerType = this.calculateCustomerTypeScore(factors.customerType);
    
    // Behavioral Patterns Score
    scores.behavioralPatterns = this.calculateBehavioralScore(factors.behavioralPatterns);
    
    // Sanctions Status Score
    scores.sanctionsStatus = factors.sanctionsStatus > 0 ? 1.0 : 0.0;
    
    // PEP Status Score
    scores.pepStatus = factors.pepStatus > 0 ? 0.8 : 0.0;
    
    return scores;
  }

  /**
   * Calculate transaction volume risk score
   */
  calculateVolumeScore(volumeData) {
    const { daily, monthly, yearly } = volumeData;
    const thresholds = this.riskConfig.monitoring.volumeThresholds;
    
    let score = 0;
    
    // Daily volume assessment
    if (daily > thresholds.daily * 2) score += 0.4;
    else if (daily > thresholds.daily) score += 0.2;
    
    // Monthly volume assessment
    if (monthly > thresholds.monthly * 2) score += 0.4;
    else if (monthly > thresholds.monthly) score += 0.2;
    
    // Yearly volume assessment
    if (yearly > thresholds.yearly * 2) score += 0.2;
    else if (yearly > thresholds.yearly) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculate transaction frequency risk score
   */
  calculateFrequencyScore(frequencyData) {
    const { daily, hourlyPeak, velocity } = frequencyData;
    const thresholds = this.riskConfig.monitoring.frequencyThresholds;
    
    let score = 0;
    
    // Daily frequency
    if (daily > thresholds.suspicious) score += 0.5;
    else if (daily > thresholds.daily) score += 0.3;
    
    // Hourly peak frequency
    if (hourlyPeak > thresholds.hourly * 2) score += 0.3;
    else if (hourlyPeak > thresholds.hourly) score += 0.1;
    
    // Velocity (rate of change)
    if (velocity > this.riskConfig.monitoring.velocityThresholds.rapidFrequency) score += 0.2;
    else if (velocity > this.riskConfig.monitoring.velocityThresholds.rapidIncrease) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculate geographic risk score
   */
  calculateGeographicScore(geoData) {
    const { primaryCountry, transactionCountries, highRiskCountries } = geoData;
    
    let score = this.geographicRisk[primaryCountry] || this.geographicRisk.DEFAULT;
    
    // Add risk for high-risk countries
    if (highRiskCountries.length > 0) {
      score += highRiskCountries.length * 0.2;
    }
    
    // Add risk for multiple countries
    if (transactionCountries.length > 3) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculate industry risk score
   */
  calculateIndustryScore(industryData) {
    const { industry } = industryData;
    return this.industryRisk[industry] || this.industryRisk.DEFAULT;
  }

  /**
   * Calculate customer type risk score
   */
  calculateCustomerTypeScore(customerType) {
    const typeScores = {
      'individual': 0.1,
      'business': 0.3,
      'corporate': 0.4,
      'trust': 0.6,
      'ngo': 0.5,
      'government': 0.2
    };
    
    return typeScores[customerType] || 0.3;
  }

  /**
   * Calculate behavioral patterns risk score
   */
  calculateBehavioralScore(behaviorData) {
    const { loginFrequency, deviceChanges, locationChanges, timePatterns } = behaviorData;
    
    let score = 0;
    
    // Login frequency patterns
    if (loginFrequency === 'very_high') score += 0.3;
    else if (loginFrequency === 'irregular') score += 0.2;
    
    // Device changes
    if (deviceChanges > 5) score += 0.3;
    else if (deviceChanges > 2) score += 0.1;
    
    // Location changes
    if (locationChanges > 3) score += 0.2;
    else if (locationChanges > 1) score += 0.1;
    
    // Time patterns
    if (timePatterns === 'unusual') score += 0.2;
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculate weighted overall risk score
   */
  calculateWeightedScore(individualScores) {
    let weightedScore = 0;
    
    Object.entries(this.riskConfig.weights).forEach(([factor, weight]) => {
      const score = individualScores[factor] || 0;
      weightedScore += score * weight;
    });
    
    return Math.min(weightedScore, 1.0);
  }

  /**
   * Calculate weighted contributions for transparency
   */
  calculateWeightedContributions(individualScores) {
    const contributions = {};
    
    Object.entries(this.riskConfig.weights).forEach(([factor, weight]) => {
      const score = individualScores[factor] || 0;
      contributions[factor] = {
        individualScore: score,
        weight: weight,
        contribution: score * weight
      };
    });
    
    return contributions;
  }

  /**
   * Determine risk level based on score
   */
  determineRiskLevel(score) {
    const { thresholds } = this.riskConfig;
    
    if (score >= thresholds.critical) return 'CRITICAL';
    if (score >= thresholds.high) return 'HIGH';
    if (score >= thresholds.medium) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Identify specific risk indicators
   */
  identifyRiskIndicators(factors, scores) {
    const indicators = [];
    
    // High transaction volume
    if (scores.transactionVolume > 0.6) {
      indicators.push({
        type: 'HIGH_VOLUME',
        severity: 'HIGH',
        description: 'Transaction volume exceeds normal thresholds',
        recommendation: 'Enhanced transaction monitoring required'
      });
    }
    
    // Unusual frequency patterns
    if (scores.transactionFrequency > 0.7) {
      indicators.push({
        type: 'UNUSUAL_FREQUENCY',
        severity: 'MEDIUM',
        description: 'Transaction frequency patterns are unusual',
        recommendation: 'Review transaction timing and patterns'
      });
    }
    
    // Geographic risk
    if (scores.geographicRisk > 0.5) {
      indicators.push({
        type: 'GEOGRAPHIC_RISK',
        severity: 'MEDIUM',
        description: 'Transactions from high-risk geographic locations',
        recommendation: 'Enhanced due diligence for geographic exposure'
      });
    }
    
    // Sanctions or PEP matches
    if (scores.sanctionsStatus > 0 || scores.pepStatus > 0) {
      indicators.push({
        type: 'COMPLIANCE_ALERT',
        severity: 'CRITICAL',
        description: 'Sanctions or PEP matches detected',
        recommendation: 'Immediate manual review and compliance assessment'
      });
    }
    
    return indicators;
  }

  /**
   * Generate risk-based recommendations
   */
  generateRecommendations(riskLevel, factors, scores) {
    const recommendations = [];
    
    switch (riskLevel) {
      case 'CRITICAL':
        recommendations.push('Immediate manual review required');
        recommendations.push('Consider account restrictions');
        recommendations.push('Escalate to senior compliance officer');
        recommendations.push('Enhanced due diligence mandatory');
        break;
        
      case 'HIGH':
        recommendations.push('Manual review within 24 hours');
        recommendations.push('Enhanced transaction monitoring');
        recommendations.push('Additional documentation required');
        recommendations.push('Senior approval for high-value transactions');
        break;
        
      case 'MEDIUM':
        recommendations.push('Enhanced monitoring recommended');
        recommendations.push('Periodic manual review');
        recommendations.push('Transaction pattern analysis');
        recommendations.push('Consider additional verification');
        break;
        
      case 'LOW':
        recommendations.push('Standard monitoring sufficient');
        recommendations.push('Periodic automated review');
        recommendations.push('Continue normal operations');
        break;
    }
    
    // Add specific recommendations based on risk factors
    if (scores.transactionVolume > 0.6) {
      recommendations.push('Implement transaction volume limits');
    }
    
    if (scores.geographicRisk > 0.5) {
      recommendations.push('Verify source of funds for international transactions');
    }
    
    if (scores.behavioralPatterns > 0.5) {
      recommendations.push('Investigate unusual behavioral patterns');
    }
    
    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Get applicable regulatory requirements
   */
  getApplicableRegulations(riskLevel) {
    const baseRegulations = ['PMLA 2002', 'RBI Master Directions', 'FIU-IND Guidelines'];
    
    if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
      baseRegulations.push('Enhanced Due Diligence Requirements');
      baseRegulations.push('STR Filing Requirements');
    }
    
    if (riskLevel === 'CRITICAL') {
      baseRegulations.push('Immediate Reporting Requirements');
      baseRegulations.push('Account Freezing Considerations');
    }
    
    return baseRegulations;
  }

  /**
   * Calculate next review date based on risk level
   */
  calculateNextReviewDate(riskLevel) {
    const now = new Date();
    let months;
    
    switch (riskLevel) {
      case 'CRITICAL': months = 1; break;  // Monthly review
      case 'HIGH': months = 3; break;      // Quarterly review
      case 'MEDIUM': months = 6; break;    // Semi-annual review
      case 'LOW': months = 12; break;      // Annual review
      default: months = 12;
    }
    
    return new Date(now.setMonth(now.getMonth() + months)).toISOString();
  }

  /**
   * Health check for risk assessment engine
   */
  async healthCheck() {
    try {
      return {
        status: 'healthy',
        version: '2.0',
        riskFactors: Object.keys(this.riskConfig.weights).length,
        thresholds: this.riskConfig.thresholds,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new RiskAssessmentEngine();
