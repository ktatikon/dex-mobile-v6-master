const adverseMediaService = require('../services/adverseMediaService');
const logger = require('../../shared/logger');
const Utils = require('../../shared/utils');

class AdverseMediaController {
  /**
   * Perform adverse media screening
   */
  async performScreening(req, res) {
    try {
      const { personalInfo, userId, options } = req.body;
      
      logger.aml(userId, 'adverse_media_screening', 'started', {
        name: Utils.maskSensitiveData(`${personalInfo.firstName} ${personalInfo.lastName}`)
      });
      
      const result = await adverseMediaService.performAdverseMediaScreening(
        personalInfo,
        userId,
        options || {}
      );
      
      logger.aml(userId, 'adverse_media_screening', 'completed', {
        riskLevel: result.riskAssessment.riskLevel,
        totalArticles: result.screening.totalArticles
      });
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('Adverse media screening failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform adverse media screening'
      });
    }
  }

  /**
   * Get screening history for a user
   */
  async getScreeningHistory(req, res) {
    try {
      const { userId } = req.params;
      const { limit } = req.query;
      
      const history = await adverseMediaService.getScreeningHistory(
        userId,
        parseInt(limit) || 10
      );
      
      res.json({
        success: true,
        data: history
      });
      
    } catch (error) {
      logger.error('Error getting screening history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get screening history'
      });
    }
  }

  /**
   * Get media sources configuration
   */
  async getMediaSources(req, res) {
    try {
      const sources = {
        news: {
          sources: ['Times of India', 'Hindu', 'Economic Times', 'Indian Express', 'NDTV', 'CNN-News18'],
          languages: ['english', 'hindi'],
          categories: ['business', 'crime', 'politics', 'legal'],
          enabled: true
        },
        social: {
          sources: ['Twitter', 'Facebook', 'LinkedIn'],
          enabled: false,
          note: 'Disabled by default for privacy compliance'
        },
        regulatory: {
          sources: ['RBI', 'SEBI', 'FIU-IND', 'ED', 'CBI'],
          categories: ['enforcement', 'penalties', 'investigations'],
          enabled: true
        },
        legal: {
          sources: ['Court Records', 'Legal Databases'],
          categories: ['criminal', 'civil', 'corporate'],
          enabled: true
        }
      };
      
      res.json({
        success: true,
        data: {
          sources,
          totalSources: Object.values(sources).reduce((total, source) => 
            total + (source.sources ? source.sources.length : 0), 0
          ),
          enabledSources: Object.values(sources).filter(source => source.enabled).length
        }
      });
      
    } catch (error) {
      logger.error('Error getting media sources:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get media sources'
      });
    }
  }

  /**
   * Get risk categories and weights
   */
  async getRiskCategories(req, res) {
    try {
      const categories = {
        criminal: {
          weight: 0.9,
          description: 'Criminal activities and charges',
          keywords: ['arrest', 'charged', 'convicted', 'crime', 'fraud', 'theft']
        },
        financial_crime: {
          weight: 0.8,
          description: 'Financial crimes and violations',
          keywords: ['money laundering', 'embezzlement', 'financial fraud', 'tax evasion']
        },
        regulatory_action: {
          weight: 0.7,
          description: 'Regulatory penalties and actions',
          keywords: ['penalty', 'fine', 'violation', 'regulatory action', 'compliance']
        },
        civil_litigation: {
          weight: 0.4,
          description: 'Civil lawsuits and disputes',
          keywords: ['lawsuit', 'court case', 'legal dispute', 'litigation']
        },
        negative_business: {
          weight: 0.3,
          description: 'Business failures and controversies',
          keywords: ['bankruptcy', 'business failure', 'scandal', 'controversy']
        },
        political_exposure: {
          weight: 0.6,
          description: 'Political connections and exposure',
          keywords: ['politician', 'government', 'political party', 'election']
        }
      };
      
      res.json({
        success: true,
        data: {
          categories,
          riskLevels: {
            LOW: { threshold: 0.0, color: 'green', action: 'Standard monitoring' },
            MEDIUM: { threshold: 0.4, color: 'yellow', action: 'Enhanced monitoring' },
            HIGH: { threshold: 0.7, color: 'red', action: 'Manual review required' }
          }
        }
      });
      
    } catch (error) {
      logger.error('Error getting risk categories:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get risk categories'
      });
    }
  }

  /**
   * Search specific media source
   */
  async searchMediaSource(req, res) {
    try {
      const { source, query, dateRange } = req.body;
      
      logger.info(`Searching media source: ${source}`, { query: Utils.maskSensitiveData(query) });
      
      // For development, return mock search results
      const mockResults = {
        source,
        query: Utils.maskSensitiveData(query),
        dateRange,
        results: [
          {
            id: Utils.generateReferenceId('SEARCH'),
            title: 'Sample Article Title',
            url: 'https://example.com/article',
            publishedDate: new Date().toISOString(),
            snippet: 'Sample article snippet...',
            relevanceScore: 0.8
          }
        ],
        totalResults: 1,
        searchTime: '0.5s'
      };
      
      res.json({
        success: true,
        data: mockResults
      });
      
    } catch (error) {
      logger.error('Media source search failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search media source'
      });
    }
  }

  /**
   * Get screening statistics
   */
  async getScreeningStats(req, res) {
    try {
      const { timeRange } = req.query;
      
      // Mock statistics
      const stats = {
        timeRange: timeRange || '30d',
        totalScreenings: 1250,
        riskDistribution: {
          LOW: 850,
          MEDIUM: 320,
          HIGH: 80
        },
        topRiskCategories: [
          { category: 'regulatory_action', count: 45 },
          { category: 'civil_litigation', count: 32 },
          { category: 'negative_business', count: 28 }
        ],
        averageProcessingTime: '3.2s',
        sourcesUsed: {
          news: 1200,
          regulatory: 890,
          legal: 650
        },
        timestamp: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      logger.error('Error getting screening stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get screening statistics'
      });
    }
  }

  /**
   * Health check for adverse media service
   */
  async healthCheck(req, res) {
    try {
      const health = await adverseMediaService.healthCheck();
      
      res.json({
        success: true,
        data: health
      });
      
    } catch (error) {
      logger.error('Adverse media health check failed:', error);
      res.status(500).json({
        success: false,
        error: 'Adverse media service health check failed'
      });
    }
  }

  /**
   * Update screening configuration
   */
  async updateConfiguration(req, res) {
    try {
      const { sources, riskWeights, updatedBy } = req.body;
      
      logger.info('Updating adverse media configuration', { updatedBy });
      
      // For development, return success
      const result = {
        success: true,
        configuration: {
          sources: sources || 'unchanged',
          riskWeights: riskWeights || 'unchanged',
          updatedBy,
          updatedAt: new Date().toISOString()
        }
      };
      
      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      logger.error('Configuration update failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update configuration'
      });
    }
  }
}

module.exports = new AdverseMediaController();
