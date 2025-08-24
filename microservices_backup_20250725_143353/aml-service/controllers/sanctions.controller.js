const amlService = require('../services/aml.service');
const logger = require('../../shared/logger');
const Utils = require('../../shared/utils');

class SanctionsController {
  /**
   * Check sanctions lists
   */
  async checkSanctions(req, res) {
    try {
      const { fullName, country, userId, lists, matchThreshold } = req.body;
      
      logger.aml(userId, 'sanctions_check', 'started', {
        name: Utils.maskSensitiveData(fullName),
        country,
        lists
      });
      
      const result = await amlService.checkSanctions(fullName, country, userId);
      
      logger.aml(userId, 'sanctions_check', 'completed', {
        matches: result.matches?.length || 0,
        riskScore: result.riskScore
      });
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('Sanctions check failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check sanctions lists'
      });
    }
  }

  /**
   * Get available sanctions lists
   */
  async getSanctionsLists(req, res) {
    try {
      const lists = [
        {
          name: 'UN',
          description: 'United Nations Security Council Sanctions List',
          lastUpdated: new Date().toISOString(),
          status: 'active',
          recordCount: 1250
        },
        {
          name: 'OFAC',
          description: 'US Office of Foreign Assets Control',
          lastUpdated: new Date().toISOString(),
          status: 'active',
          recordCount: 8500
        },
        {
          name: 'RBI',
          description: 'Reserve Bank of India Sanctions',
          lastUpdated: new Date().toISOString(),
          status: 'active',
          recordCount: 450
        },
        {
          name: 'FIU_INDIA',
          description: 'Financial Intelligence Unit India',
          lastUpdated: new Date().toISOString(),
          status: 'active',
          recordCount: 320
        }
      ];
      
      res.json({
        success: true,
        data: {
          lists,
          totalRecords: lists.reduce((sum, list) => sum + list.recordCount, 0),
          lastGlobalUpdate: new Date().toISOString()
        }
      });
      
    } catch (error) {
      logger.error('Error getting sanctions lists:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get sanctions lists'
      });
    }
  }

  /**
   * Update sanctions lists
   */
  async updateSanctionsLists(req, res) {
    try {
      const { listType, forceUpdate, updatedBy } = req.body;
      
      logger.info('Updating sanctions lists', { listType, forceUpdate, updatedBy });
      
      // For now, return success - implement actual update logic
      res.json({
        success: true,
        data: {
          listType,
          status: 'updated',
          recordsUpdated: 150,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      logger.error('Sanctions list update failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update sanctions lists'
      });
    }
  }

  /**
   * Get sanctions status for user
   */
  async getSanctionsStatus(req, res) {
    try {
      const { userId } = req.params;
      
      // For now, return sample status
      res.json({
        success: true,
        data: {
          userId,
          status: 'clear',
          lastChecked: new Date().toISOString(),
          matches: [],
          riskScore: 0.1
        }
      });
      
    } catch (error) {
      logger.error('Error getting sanctions status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get sanctions status'
      });
    }
  }

  /**
   * Get sanctions history for user
   */
  async getSanctionsHistory(req, res) {
    try {
      const { userId } = req.params;
      
      // For now, return sample history
      res.json({
        success: true,
        data: {
          userId,
          history: [
            {
              id: Utils.generateReferenceId('SANCTIONS_HIST'),
              timestamp: new Date().toISOString(),
              status: 'clear',
              matches: [],
              riskScore: 0.1
            }
          ]
        }
      });
      
    } catch (error) {
      logger.error('Error getting sanctions history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get sanctions history'
      });
    }
  }

  /**
   * Add to sanctions whitelist
   */
  async addToSanctionsWhitelist(req, res) {
    try {
      const { name, reason, addedBy } = req.body;
      
      logger.info('Adding to sanctions whitelist', { name: Utils.maskSensitiveData(name), reason, addedBy });
      
      res.json({
        success: true,
        data: {
          entryId: Utils.generateReferenceId('WHITELIST'),
          name: Utils.maskSensitiveData(name),
          status: 'whitelisted',
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      logger.error('Error adding to sanctions whitelist:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add to sanctions whitelist'
      });
    }
  }

  /**
   * Remove from sanctions whitelist
   */
  async removeFromSanctionsWhitelist(req, res) {
    try {
      const { entryId } = req.params;
      
      logger.info('Removing from sanctions whitelist', { entryId });
      
      res.json({
        success: true,
        data: {
          entryId,
          status: 'removed',
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      logger.error('Error removing from sanctions whitelist:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove from sanctions whitelist'
      });
    }
  }
}

module.exports = new SanctionsController();
