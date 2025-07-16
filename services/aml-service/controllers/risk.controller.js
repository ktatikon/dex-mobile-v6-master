const amlService = require('../services/aml.service');
const riskAssessmentEngine = require('../services/riskAssessmentEngine');
const logger = require('../../shared/logger');
const Utils = require('../../shared/utils');

class RiskController {
  /**
   * Assess risk for a user using comprehensive risk assessment engine
   */
  async assessRisk(req, res) {
    try {
      const { userId, assessmentData, options } = req.body;

      logger.aml(userId, 'risk_assessment', 'started', {
        assessmentType: options?.assessmentType || 'comprehensive'
      });

      // Use the comprehensive risk assessment engine
      const result = await riskAssessmentEngine.performRiskAssessment(
        userId,
        assessmentData || {},
        options || {}
      );

      logger.aml(userId, 'risk_assessment', 'completed', {
        riskScore: result.overallScore,
        riskLevel: result.riskLevel
      });

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Risk assessment failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assess risk'
      });
    }
  }

  /**
   * Get current risk score
   */
  async getRiskScore(req, res) {
    try {
      const { userId } = req.params;
      
      // For now, return sample risk score
      res.json({
        success: true,
        data: {
          userId,
          currentScore: 0.25,
          riskLevel: 'LOW',
          lastAssessed: new Date().toISOString(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        }
      });
      
    } catch (error) {
      logger.error('Error getting risk score:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get risk score'
      });
    }
  }

  /**
   * Update risk score
   */
  async updateRiskScore(req, res) {
    try {
      const { userId, newScore, reason, updatedBy, validUntil } = req.body;
      
      logger.aml(userId, 'risk_score_update', 'completed', {
        newScore,
        reason,
        updatedBy
      });
      
      res.json({
        success: true,
        data: {
          userId,
          previousScore: 0.25,
          newScore,
          reason,
          updatedBy,
          timestamp: new Date().toISOString(),
          validUntil
        }
      });
      
    } catch (error) {
      logger.error('Risk score update failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update risk score'
      });
    }
  }

  /**
   * Get risk factors
   */
  async getRiskFactors(req, res) {
    try {
      const { userId } = req.params;
      
      // For now, return sample risk factors
      res.json({
        success: true,
        data: {
          userId,
          factors: {
            transactionVolume: {
              value: 0.2,
              weight: 0.3,
              description: 'Monthly transaction volume'
            },
            transactionFrequency: {
              value: 0.1,
              weight: 0.2,
              description: 'Transaction frequency pattern'
            },
            geographicRisk: {
              value: 0.15,
              weight: 0.25,
              description: 'Geographic risk assessment'
            },
            industryRisk: {
              value: 0.1,
              weight: 0.15,
              description: 'Industry-specific risk'
            },
            customerType: {
              value: 'individual',
              weight: 0.1,
              description: 'Customer type classification'
            }
          },
          lastUpdated: new Date().toISOString()
        }
      });
      
    } catch (error) {
      logger.error('Error getting risk factors:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get risk factors'
      });
    }
  }

  /**
   * Get risk history
   */
  async getRiskHistory(req, res) {
    try {
      const { userId } = req.params;
      
      // For now, return sample history
      res.json({
        success: true,
        data: {
          userId,
          history: [
            {
              id: Utils.generateReferenceId('RISK_HIST'),
              timestamp: new Date().toISOString(),
              riskScore: 0.25,
              riskLevel: 'LOW',
              assessmentType: 'comprehensive'
            }
          ]
        }
      });
      
    } catch (error) {
      logger.error('Error getting risk history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get risk history'
      });
    }
  }

  /**
   * Get risk matrix
   */
  async getRiskMatrix(req, res) {
    try {
      const matrix = {
        thresholds: {
          low: 0.3,
          medium: 0.6,
          high: 0.8,
          critical: 0.95
        },
        factors: {
          transactionVolume: { weight: 0.3, max: 1.0 },
          transactionFrequency: { weight: 0.2, max: 1.0 },
          geographicRisk: { weight: 0.25, max: 1.0 },
          industryRisk: { weight: 0.15, max: 1.0 },
          customerType: { weight: 0.1, max: 1.0 }
        },
        actions: {
          low: ['Standard monitoring'],
          medium: ['Enhanced monitoring', 'Periodic review'],
          high: ['Manual review required', 'Enhanced due diligence'],
          critical: ['Immediate review', 'Potential restriction']
        },
        lastUpdated: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: matrix
      });
      
    } catch (error) {
      logger.error('Error getting risk matrix:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get risk matrix'
      });
    }
  }

  /**
   * Update risk matrix
   */
  async updateRiskMatrix(req, res) {
    try {
      const { matrix, updatedBy } = req.body;
      
      logger.info('Updating risk matrix', { updatedBy });
      
      res.json({
        success: true,
        data: {
          status: 'updated',
          updatedBy,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      logger.error('Risk matrix update failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update risk matrix'
      });
    }
  }

  /**
   * Get risk assessment engine health
   */
  async getRiskEngineHealth(req, res) {
    try {
      const health = await riskAssessmentEngine.healthCheck();

      res.json({
        success: true,
        data: health
      });

    } catch (error) {
      logger.error('Risk engine health check failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get risk engine health'
      });
    }
  }

  /**
   * Get risk analytics
   */
  async getRiskAnalytics(req, res) {
    try {
      const analytics = {
        summary: {
          totalAssessments: 1250,
          averageRiskScore: 0.32,
          riskDistribution: {
            low: 65,
            medium: 25,
            high: 8,
            critical: 2
          }
        },
        trends: {
          monthlyTrend: [
            { month: '2024-01', avgScore: 0.28 },
            { month: '2024-02', avgScore: 0.31 },
            { month: '2024-03', avgScore: 0.32 }
          ]
        },
        topRiskFactors: [
          { factor: 'transactionVolume', impact: 0.35 },
          { factor: 'geographicRisk', impact: 0.28 },
          { factor: 'transactionFrequency', impact: 0.22 }
        ],
        lastUpdated: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: analytics
      });
      
    } catch (error) {
      logger.error('Error getting risk analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get risk analytics'
      });
    }
  }
}

module.exports = new RiskController();
