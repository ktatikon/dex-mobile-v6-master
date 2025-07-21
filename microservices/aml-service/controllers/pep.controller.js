const amlService = require('../services/aml.service');
const logger = require('../../shared/logger');
const Utils = require('../../shared/utils');

class PEPController {
  /**
   * Check PEP lists
   */
  async checkPEP(req, res) {
    try {
      const { personalInfo, userId, includeAssociates, includeFamily, matchThreshold } = req.body;
      
      logger.aml(userId, 'pep_check', 'started', {
        name: Utils.maskSensitiveData(`${personalInfo.firstName} ${personalInfo.lastName}`),
        includeAssociates,
        includeFamily
      });
      
      const result = await amlService.checkPEP(personalInfo, userId);
      
      logger.aml(userId, 'pep_check', 'completed', {
        matches: result.matches?.length || 0,
        riskScore: result.riskScore
      });
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('PEP check failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check PEP lists'
      });
    }
  }

  /**
   * Get available PEP lists
   */
  async getPEPLists(req, res) {
    try {
      const lists = [
        {
          name: 'Global PEP',
          description: 'Global Politically Exposed Persons Database',
          lastUpdated: new Date().toISOString(),
          status: 'active',
          recordCount: 2500,
          regions: ['global']
        },
        {
          name: 'India PEP',
          description: 'Indian Politically Exposed Persons',
          lastUpdated: new Date().toISOString(),
          status: 'active',
          recordCount: 850,
          regions: ['india']
        },
        {
          name: 'Asia PEP',
          description: 'Asian Politically Exposed Persons',
          lastUpdated: new Date().toISOString(),
          status: 'active',
          recordCount: 1200,
          regions: ['asia']
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
      logger.error('Error getting PEP lists:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get PEP lists'
      });
    }
  }

  /**
   * Update PEP lists
   */
  async updatePEPLists(req, res) {
    try {
      const { region, forceUpdate, updatedBy } = req.body;
      
      logger.info('Updating PEP lists', { region, forceUpdate, updatedBy });
      
      // For now, return success - implement actual update logic
      res.json({
        success: true,
        data: {
          region,
          status: 'updated',
          recordsUpdated: 75,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      logger.error('PEP list update failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update PEP lists'
      });
    }
  }

  /**
   * Get PEP status for user
   */
  async getPEPStatus(req, res) {
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
          riskScore: 0.2
        }
      });
      
    } catch (error) {
      logger.error('Error getting PEP status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get PEP status'
      });
    }
  }

  /**
   * Get PEP history for user
   */
  async getPEPHistory(req, res) {
    try {
      const { userId } = req.params;
      
      // For now, return sample history
      res.json({
        success: true,
        data: {
          userId,
          history: [
            {
              id: Utils.generateReferenceId('PEP_HIST'),
              timestamp: new Date().toISOString(),
              status: 'clear',
              matches: [],
              riskScore: 0.2
            }
          ]
        }
      });
      
    } catch (error) {
      logger.error('Error getting PEP history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get PEP history'
      });
    }
  }

  /**
   * Add to PEP whitelist
   */
  async addToPEPWhitelist(req, res) {
    try {
      const { name, reason, addedBy } = req.body;
      
      logger.info('Adding to PEP whitelist', { name: Utils.maskSensitiveData(name), reason, addedBy });
      
      res.json({
        success: true,
        data: {
          entryId: Utils.generateReferenceId('PEP_WHITELIST'),
          name: Utils.maskSensitiveData(name),
          status: 'whitelisted',
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      logger.error('Error adding to PEP whitelist:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add to PEP whitelist'
      });
    }
  }

  /**
   * Remove from PEP whitelist
   */
  async removeFromPEPWhitelist(req, res) {
    try {
      const { entryId } = req.params;
      
      logger.info('Removing from PEP whitelist', { entryId });
      
      res.json({
        success: true,
        data: {
          entryId,
          status: 'removed',
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      logger.error('Error removing from PEP whitelist:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove from PEP whitelist'
      });
    }
  }
}

module.exports = new PEPController();
