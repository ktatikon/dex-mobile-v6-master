const amlService = require('../services/aml.service');
const logger = require('../../shared/logger');
const Utils = require('../../shared/utils');

class AMLController {
  /**
   * Perform comprehensive AML screening
   */
  async screenUser(req, res) {
    try {
      const { userId, personalInfo, walletAddresses } = req.body;
      
      logger.aml(userId, 'comprehensive_screening', 'started', {
        walletCount: walletAddresses?.length || 0
      });
      
      const screeningResult = await amlService.performComprehensiveScreening(
        userId,
        personalInfo,
        walletAddresses
      );
      
      logger.aml(userId, 'comprehensive_screening', 'completed', {
        riskScore: screeningResult.riskScore,
        status: screeningResult.status
      });
      
      res.json({
        success: true,
        data: screeningResult
      });
      
    } catch (error) {
      logger.error('AML screening failed:', error);
      res.status(500).json({
        success: false,
        error: 'AML screening failed'
      });
    }
  }

  /**
   * Run sanctions screening
   */
  async runScreening(req, res) {
    try {
      const { fullName, country, userId } = req.body;
      
      logger.aml(userId, 'sanctions_screening', 'started', { 
        name: Utils.maskSensitiveData(fullName),
        country 
      });
      
      const result = await amlService.checkSanctions(fullName, country, userId);
      
      logger.aml(userId, 'sanctions_screening', 'completed', {
        riskScore: result.riskScore,
        matches: result.matches?.length || 0
      });
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('Sanctions screening failed:', error);
      res.status(500).json({
        success: false,
        error: 'Sanctions screening failed'
      });
    }
  }

  /**
   * Get AML screening status
   */
  async getScreeningStatus(req, res) {
    try {
      const { userId } = req.params;
      
      const status = await amlService.getScreeningStatus(userId);
      
      res.json({
        success: true,
        data: status
      });
      
    } catch (error) {
      logger.error('Error getting AML status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get AML status'
      });
    }
  }

  /**
   * Get AML screening history
   */
  async getScreeningHistory(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10, riskLevel, startDate, endDate } = req.query;
      
      const history = await amlService.getScreeningHistory(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        riskLevel,
        startDate,
        endDate
      });
      
      res.json({
        success: true,
        data: history
      });
      
    } catch (error) {
      logger.error('Error getting AML history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get AML history'
      });
    }
  }

  /**
   * Re-screen a user
   */
  async rescreenUser(req, res) {
    try {
      const { userId, reason } = req.body;
      
      logger.aml(userId, 'rescreen', 'started', { reason });
      
      const result = await amlService.rescreenUser(userId, reason);
      
      logger.aml(userId, 'rescreen', 'completed', {
        riskScore: result.riskScore,
        status: result.status
      });
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('User re-screening failed:', error);
      res.status(500).json({
        success: false,
        error: 'User re-screening failed'
      });
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(req, res) {
    try {
      const { userId } = req.params;
      
      const report = await amlService.generateComplianceReport(userId);
      
      res.json({
        success: true,
        data: report
      });
      
    } catch (error) {
      logger.error('Error generating compliance report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate compliance report'
      });
    }
  }

  /**
   * Batch screening
   */
  async batchScreen(req, res) {
    try {
      const { users, screeningType = 'comprehensive' } = req.body;
      
      logger.info('Batch AML screening started', {
        userCount: users.length,
        screeningType
      });
      
      const results = await amlService.batchScreen(users, screeningType);
      
      logger.info('Batch AML screening completed', {
        userCount: users.length,
        successCount: results.filter(r => r.success).length,
        failureCount: results.filter(r => !r.success).length
      });
      
      res.json({
        success: true,
        data: {
          results,
          summary: {
            total: users.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
          }
        }
      });
      
    } catch (error) {
      logger.error('Batch screening failed:', error);
      res.status(500).json({
        success: false,
        error: 'Batch screening failed'
      });
    }
  }

  /**
   * Get AML statistics
   */
  async getStatistics(req, res) {
    try {
      const { startDate, endDate, groupBy = 'day' } = req.query;
      
      const statistics = await amlService.getStatistics({
        startDate,
        endDate,
        groupBy
      });
      
      res.json({
        success: true,
        data: statistics
      });
      
    } catch (error) {
      logger.error('Error getting AML statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get AML statistics'
      });
    }
  }

  /**
   * Add user to whitelist
   */
  async addToWhitelist(req, res) {
    try {
      const { userId, reason, addedBy } = req.body;
      
      logger.aml(userId, 'whitelist_add', 'started', { reason, addedBy });
      
      const result = await amlService.addToWhitelist(userId, reason, addedBy);
      
      logger.aml(userId, 'whitelist_add', 'completed');
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('Error adding to whitelist:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add to whitelist'
      });
    }
  }

  /**
   * Remove user from whitelist
   */
  async removeFromWhitelist(req, res) {
    try {
      const { userId } = req.params;
      const { reason, removedBy } = req.body;
      
      logger.aml(userId, 'whitelist_remove', 'started', { reason, removedBy });
      
      const result = await amlService.removeFromWhitelist(userId, reason, removedBy);
      
      logger.aml(userId, 'whitelist_remove', 'completed');
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('Error removing from whitelist:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove from whitelist'
      });
    }
  }

  /**
   * Get AML alerts
   */
  async getAlerts(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        severity, 
        status = 'open',
        startDate,
        endDate 
      } = req.query;
      
      const alerts = await amlService.getAlerts({
        page: parseInt(page),
        limit: parseInt(limit),
        severity,
        status,
        startDate,
        endDate
      });
      
      res.json({
        success: true,
        data: alerts
      });
      
    } catch (error) {
      logger.error('Error getting AML alerts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get AML alerts'
      });
    }
  }

  /**
   * Resolve AML alert
   */
  async resolveAlert(req, res) {
    try {
      const { alertId } = req.params;
      const { resolution, notes, resolvedBy } = req.body;
      
      logger.info('Resolving AML alert', { alertId, resolution, resolvedBy });
      
      const result = await amlService.resolveAlert(alertId, {
        resolution,
        notes,
        resolvedBy
      });
      
      logger.info('AML alert resolved', { alertId, resolution });
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('Error resolving AML alert:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resolve AML alert'
      });
    }
  }

  /**
   * Get AML configuration
   */
  async getConfiguration(req, res) {
    try {
      const config = await amlService.getConfiguration();
      
      res.json({
        success: true,
        data: config
      });
      
    } catch (error) {
      logger.error('Error getting AML configuration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get AML configuration'
      });
    }
  }

  /**
   * Update AML configuration
   */
  async updateConfiguration(req, res) {
    try {
      const { config, updatedBy } = req.body;
      
      logger.info('Updating AML configuration', { updatedBy });
      
      const result = await amlService.updateConfiguration(config, updatedBy);
      
      logger.info('AML configuration updated', { updatedBy });
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('Error updating AML configuration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update AML configuration'
      });
    }
  }
}

module.exports = new AMLController();
