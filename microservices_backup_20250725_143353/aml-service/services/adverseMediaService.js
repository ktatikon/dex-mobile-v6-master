const axios = require('axios');
const logger = require('../../shared/logger');
const Utils = require('../../shared/utils');

class AdverseMediaService {
  constructor() {
    this.baseURL = process.env.IDFY_BASE_URL || 'https://apicentral.idfy.com';
    this.apiKey = process.env.IDFY_API_KEY;
    this.headers = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      'account-id': process.env.IDFY_ACCOUNT_ID
    };
    
    // Media sources configuration
    this.mediaSources = {
      news: {
        sources: ['Times of India', 'Hindu', 'Economic Times', 'Indian Express', 'NDTV', 'CNN-News18'],
        languages: ['english', 'hindi'],
        categories: ['business', 'crime', 'politics', 'legal']
      },
      social: {
        sources: ['Twitter', 'Facebook', 'LinkedIn'],
        enabled: false // Disabled by default for privacy
      },
      regulatory: {
        sources: ['RBI', 'SEBI', 'FIU-IND', 'ED', 'CBI'],
        categories: ['enforcement', 'penalties', 'investigations']
      },
      legal: {
        sources: ['Court Records', 'Legal Databases'],
        categories: ['criminal', 'civil', 'corporate']
      }
    };
    
    // Risk scoring weights
    this.riskWeights = {
      criminal: 0.9,
      financial_crime: 0.8,
      regulatory_action: 0.7,
      civil_litigation: 0.4,
      negative_business: 0.3,
      political_exposure: 0.6
    };
  }

  /**
   * Perform comprehensive adverse media screening
   */
  async performAdverseMediaScreening(personalInfo, userId, options = {}) {
    try {
      logger.aml(userId, 'adverse_media_screening', 'started', {
        name: Utils.maskSensitiveData(`${personalInfo.firstName} ${personalInfo.lastName}`)
      });

      const searchQuery = this.buildSearchQuery(personalInfo);
      const screeningResults = await this.searchAdverseMedia(searchQuery, options);
      
      const analysis = this.analyzeMediaResults(screeningResults, personalInfo);
      const riskAssessment = this.calculateMediaRiskScore(analysis);
      
      const result = {
        success: true,
        userId,
        searchQuery: Utils.maskSensitiveData(searchQuery),
        screening: {
          totalArticles: screeningResults.totalArticles,
          relevantArticles: screeningResults.relevantArticles,
          highRiskArticles: screeningResults.highRiskArticles,
          categories: analysis.categories,
          timeRange: screeningResults.timeRange,
          sources: screeningResults.sources
        },
        riskAssessment: {
          overallScore: riskAssessment.overallScore,
          riskLevel: riskAssessment.riskLevel,
          riskFactors: riskAssessment.riskFactors,
          recommendations: riskAssessment.recommendations
        },
        matches: analysis.matches.map(match => ({
          ...match,
          content: Utils.maskSensitiveData(match.content)
        })),
        timestamp: new Date().toISOString(),
        mockData: true // Indicates this is development data
      };

      logger.aml(userId, 'adverse_media_screening', 'completed', {
        totalArticles: result.screening.totalArticles,
        riskLevel: result.riskAssessment.riskLevel
      });

      return result;

    } catch (error) {
      logger.error('Adverse media screening failed:', error);
      throw error;
    }
  }

  /**
   * Search adverse media across configured sources
   */
  async searchAdverseMedia(searchQuery, options = {}) {
    try {
      // For development, return mock search results
      // In production, this would call actual media monitoring APIs
      
      await this.simulateProcessingDelay(3000);
      
      const mockResults = {
        totalArticles: Math.floor(Math.random() * 50) + 10,
        relevantArticles: Math.floor(Math.random() * 10) + 2,
        highRiskArticles: Math.floor(Math.random() * 3),
        timeRange: {
          from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
          to: new Date().toISOString()
        },
        sources: Object.keys(this.mediaSources),
        articles: this.generateMockArticles(searchQuery)
      };
      
      return mockResults;
      
    } catch (error) {
      logger.error('Media search failed:', error);
      throw error;
    }
  }

  /**
   * Analyze media search results for risk factors
   */
  analyzeMediaResults(searchResults, personalInfo) {
    const analysis = {
      categories: {
        criminal: 0,
        financial_crime: 0,
        regulatory_action: 0,
        civil_litigation: 0,
        negative_business: 0,
        political_exposure: 0
      },
      matches: [],
      sentiment: {
        positive: 0,
        neutral: 0,
        negative: 0
      }
    };

    // Analyze each article
    searchResults.articles.forEach(article => {
      const articleAnalysis = this.analyzeArticle(article, personalInfo);
      
      // Update category counts
      articleAnalysis.categories.forEach(category => {
        if (analysis.categories.hasOwnProperty(category)) {
          analysis.categories[category]++;
        }
      });
      
      // Update sentiment
      analysis.sentiment[articleAnalysis.sentiment]++;
      
      // Add to matches if relevant
      if (articleAnalysis.relevanceScore > 0.6) {
        analysis.matches.push({
          title: article.title,
          source: article.source,
          publishedDate: article.publishedDate,
          url: article.url,
          snippet: article.snippet,
          relevanceScore: articleAnalysis.relevanceScore,
          riskCategory: articleAnalysis.primaryCategory,
          sentiment: articleAnalysis.sentiment,
          content: article.content
        });
      }
    });

    return analysis;
  }

  /**
   * Analyze individual article for risk factors
   */
  analyzeArticle(article, personalInfo) {
    const fullName = `${personalInfo.firstName} ${personalInfo.lastName}`.toLowerCase();
    const content = (article.title + ' ' + article.content).toLowerCase();
    
    // Simple keyword-based analysis (in production, use NLP/ML)
    const riskKeywords = {
      criminal: ['arrest', 'charged', 'convicted', 'crime', 'fraud', 'theft', 'murder'],
      financial_crime: ['money laundering', 'embezzlement', 'financial fraud', 'tax evasion'],
      regulatory_action: ['penalty', 'fine', 'violation', 'regulatory action', 'compliance'],
      civil_litigation: ['lawsuit', 'court case', 'legal dispute', 'litigation'],
      negative_business: ['bankruptcy', 'business failure', 'scandal', 'controversy'],
      political_exposure: ['politician', 'government', 'political party', 'election']
    };
    
    const categories = [];
    let maxScore = 0;
    let primaryCategory = 'neutral';
    
    // Check for risk keywords
    Object.entries(riskKeywords).forEach(([category, keywords]) => {
      const matches = keywords.filter(keyword => content.includes(keyword)).length;
      if (matches > 0) {
        categories.push(category);
        if (matches > maxScore) {
          maxScore = matches;
          primaryCategory = category;
        }
      }
    });
    
    // Calculate relevance score based on name mentions and keyword matches
    const nameMatches = (content.match(new RegExp(fullName, 'g')) || []).length;
    const relevanceScore = Math.min((nameMatches * 0.3 + maxScore * 0.7), 1.0);
    
    // Determine sentiment (simplified)
    const negativeWords = ['bad', 'negative', 'wrong', 'illegal', 'fraud', 'crime'];
    const positiveWords = ['good', 'positive', 'award', 'achievement', 'success'];
    
    const negativeCount = negativeWords.filter(word => content.includes(word)).length;
    const positiveCount = positiveWords.filter(word => content.includes(word)).length;
    
    let sentiment = 'neutral';
    if (negativeCount > positiveCount) sentiment = 'negative';
    else if (positiveCount > negativeCount) sentiment = 'positive';
    
    return {
      categories,
      primaryCategory,
      relevanceScore,
      sentiment,
      keywordMatches: maxScore
    };
  }

  /**
   * Calculate overall media risk score
   */
  calculateMediaRiskScore(analysis) {
    let totalScore = 0;
    const riskFactors = [];
    
    // Calculate weighted risk score
    Object.entries(analysis.categories).forEach(([category, count]) => {
      if (count > 0 && this.riskWeights[category]) {
        const categoryScore = Math.min(count * this.riskWeights[category] * 0.1, this.riskWeights[category]);
        totalScore += categoryScore;
        
        riskFactors.push({
          category,
          count,
          weight: this.riskWeights[category],
          score: categoryScore
        });
      }
    });
    
    // Adjust for sentiment
    const totalSentiment = analysis.sentiment.positive + analysis.sentiment.neutral + analysis.sentiment.negative;
    if (totalSentiment > 0) {
      const negativeRatio = analysis.sentiment.negative / totalSentiment;
      totalScore *= (1 + negativeRatio * 0.5); // Increase score for negative sentiment
    }
    
    // Normalize score to 0-1 range
    const normalizedScore = Math.min(totalScore, 1.0);
    
    // Determine risk level
    let riskLevel = 'LOW';
    if (normalizedScore >= 0.7) riskLevel = 'HIGH';
    else if (normalizedScore >= 0.4) riskLevel = 'MEDIUM';
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(riskLevel, riskFactors);
    
    return {
      overallScore: normalizedScore,
      riskLevel,
      riskFactors,
      recommendations
    };
  }

  /**
   * Generate recommendations based on risk assessment
   */
  generateRecommendations(riskLevel, riskFactors) {
    const recommendations = [];
    
    switch (riskLevel) {
      case 'HIGH':
        recommendations.push('Immediate manual review required');
        recommendations.push('Enhanced due diligence recommended');
        recommendations.push('Consider escalation to compliance team');
        break;
      case 'MEDIUM':
        recommendations.push('Manual review recommended');
        recommendations.push('Additional documentation may be required');
        recommendations.push('Monitor for updates');
        break;
      case 'LOW':
        recommendations.push('Standard monitoring sufficient');
        recommendations.push('Periodic re-screening recommended');
        break;
    }
    
    // Add specific recommendations based on risk factors
    riskFactors.forEach(factor => {
      if (factor.category === 'criminal' && factor.count > 0) {
        recommendations.push('Verify criminal background check');
      }
      if (factor.category === 'financial_crime' && factor.count > 0) {
        recommendations.push('Enhanced financial screening required');
      }
      if (factor.category === 'regulatory_action' && factor.count > 0) {
        recommendations.push('Check regulatory compliance status');
      }
    });
    
    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Build search query from personal information
   */
  buildSearchQuery(personalInfo) {
    const queries = [];
    
    // Full name
    queries.push(`"${personalInfo.firstName} ${personalInfo.lastName}"`);
    
    // Name variations
    if (personalInfo.middleName) {
      queries.push(`"${personalInfo.firstName} ${personalInfo.middleName} ${personalInfo.lastName}"`);
    }
    
    // Add company/organization if provided
    if (personalInfo.company) {
      queries.push(`"${personalInfo.firstName} ${personalInfo.lastName}" AND "${personalInfo.company}"`);
    }
    
    // Add location if provided
    if (personalInfo.city) {
      queries.push(`"${personalInfo.firstName} ${personalInfo.lastName}" AND "${personalInfo.city}"`);
    }
    
    return queries.join(' OR ');
  }

  /**
   * Generate mock articles for development
   */
  generateMockArticles(searchQuery) {
    const mockArticles = [
      {
        id: Utils.generateReferenceId('ARTICLE'),
        title: 'Business Leader Receives Industry Award',
        source: 'Economic Times',
        publishedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        url: 'https://example.com/article1',
        snippet: 'Local business leader recognized for contributions to industry...',
        content: 'Sample positive article content about business achievements and industry recognition.',
        category: 'business',
        sentiment: 'positive'
      },
      {
        id: Utils.generateReferenceId('ARTICLE'),
        title: 'Company Faces Regulatory Scrutiny',
        source: 'Business Standard',
        publishedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        url: 'https://example.com/article2',
        snippet: 'Regulatory authorities investigating compliance issues...',
        content: 'Sample article about regulatory investigation and compliance matters.',
        category: 'regulatory',
        sentiment: 'negative'
      }
    ];
    
    return mockArticles;
  }

  /**
   * Simulate processing delay for development
   */
  async simulateProcessingDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get adverse media screening history
   */
  async getScreeningHistory(userId, limit = 10) {
    try {
      // Mock history data
      const history = [
        {
          id: Utils.generateReferenceId('MEDIA_HIST'),
          userId,
          screeningDate: new Date().toISOString(),
          riskLevel: 'LOW',
          totalArticles: 15,
          relevantArticles: 2,
          overallScore: 0.2
        }
      ];
      
      return {
        success: true,
        history: history.slice(0, limit),
        total: history.length
      };
      
    } catch (error) {
      logger.error('Error getting screening history:', error);
      throw error;
    }
  }

  /**
   * Health check for adverse media service
   */
  async healthCheck() {
    try {
      return {
        status: 'healthy',
        mediaSources: Object.keys(this.mediaSources),
        apiConnection: 'connected',
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

module.exports = new AdverseMediaService();
