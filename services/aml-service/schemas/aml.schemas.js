const Joi = require('joi');

/**
 * Joi validation schemas for AML service
 */

// Common patterns
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const countryCodePattern = /^[A-Z]{2}$/;
const walletAddressPattern = /^(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/;

// Base schemas
const userIdSchema = Joi.string().uuid().required();
const alertIdSchema = Joi.string().uuid().required();

// Personal information schema
const personalInfoSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  middleName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).required(),
  dateOfBirth: Joi.date().iso().max('now').optional(),
  nationality: Joi.string().pattern(countryCodePattern).optional(),
  country: Joi.string().pattern(countryCodePattern).default('IN'),
  occupation: Joi.string().max(100).optional(),
  address: Joi.object({
    line1: Joi.string().min(5).max(100).optional(),
    line2: Joi.string().max(100).optional(),
    city: Joi.string().min(2).max(50).optional(),
    state: Joi.string().min(2).max(50).optional(),
    postalCode: Joi.string().max(20).optional(),
    country: Joi.string().pattern(countryCodePattern).default('IN')
  }).optional()
});

// Wallet address schema
const walletAddressSchema = Joi.object({
  address: Joi.string().required(),
  network: Joi.string().valid(
    'ethereum', 'bitcoin', 'polygon', 'binance', 
    'arbitrum', 'optimism', 'avalanche', 'fantom'
  ).required(),
  label: Joi.string().max(50).optional()
});

// Main AML schemas
const amlSchemas = {
  screenUser: Joi.object({
    userId: userIdSchema,
    personalInfo: personalInfoSchema.required(),
    walletAddresses: Joi.array().items(walletAddressSchema).max(10).default([]),
    screeningType: Joi.string().valid('basic', 'comprehensive', 'enhanced').default('comprehensive'),
    includeWalletScreening: Joi.boolean().default(true),
    includePEPScreening: Joi.boolean().default(true),
    includeAdverseMedia: Joi.boolean().default(true)
  }),

  rescreenUser: Joi.object({
    userId: userIdSchema,
    reason: Joi.string().valid(
      'periodic_review', 'risk_change', 'regulatory_update', 
      'manual_request', 'alert_triggered'
    ).required(),
    screeningType: Joi.string().valid('basic', 'comprehensive', 'enhanced').default('comprehensive'),
    requestedBy: Joi.string().optional()
  }),

  batchScreen: Joi.object({
    users: Joi.array().items(
      Joi.object({
        userId: userIdSchema,
        personalInfo: personalInfoSchema.required(),
        walletAddresses: Joi.array().items(walletAddressSchema).max(10).default([])
      })
    ).min(1).max(100).required(),
    screeningType: Joi.string().valid('basic', 'comprehensive', 'enhanced').default('comprehensive'),
    priority: Joi.string().valid('low', 'normal', 'high').default('normal')
  }),

  whitelistUser: Joi.object({
    userId: userIdSchema,
    reason: Joi.string().min(10).max(500).required(),
    addedBy: Joi.string().required(),
    expiresAt: Joi.date().iso().greater('now').optional(),
    notes: Joi.string().max(1000).optional()
  }),

  resolveAlert: Joi.object({
    resolution: Joi.string().valid(
      'false_positive', 'approved', 'rejected', 
      'requires_review', 'escalated'
    ).required(),
    notes: Joi.string().min(10).max(1000).required(),
    resolvedBy: Joi.string().required(),
    followUpRequired: Joi.boolean().default(false),
    followUpDate: Joi.date().iso().greater('now').when('followUpRequired', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  }),

  updateConfig: Joi.object({
    config: Joi.object({
      riskThresholds: Joi.object({
        low: Joi.number().min(0).max(1).optional(),
        medium: Joi.number().min(0).max(1).optional(),
        high: Joi.number().min(0).max(1).optional(),
        critical: Joi.number().min(0).max(1).optional()
      }).optional(),
      screeningSettings: Joi.object({
        enableSanctionsScreening: Joi.boolean().optional(),
        enablePEPScreening: Joi.boolean().optional(),
        enableAdverseMediaScreening: Joi.boolean().optional(),
        enableWalletScreening: Joi.boolean().optional(),
        autoApprovalThreshold: Joi.number().min(0).max(1).optional(),
        manualReviewThreshold: Joi.number().min(0).max(1).optional()
      }).optional(),
      alertSettings: Joi.object({
        enableRealTimeAlerts: Joi.boolean().optional(),
        alertChannels: Joi.array().items(
          Joi.string().valid('email', 'sms', 'webhook', 'dashboard')
        ).optional(),
        escalationRules: Joi.object().optional()
      }).optional()
    }).required(),
    updatedBy: Joi.string().required()
  }),

  userIdParam: Joi.object({
    userId: userIdSchema
  }),

  alertIdParam: Joi.object({
    alertId: alertIdSchema
  }),

  historyQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    riskLevel: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').optional(),
    status: Joi.string().valid('completed', 'pending', 'failed', 'cancelled').optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    sortBy: Joi.string().valid('timestamp', 'riskScore', 'status').default('timestamp'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  statisticsQuery: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().required(),
    groupBy: Joi.string().valid('day', 'week', 'month').default('day'),
    includeRiskBreakdown: Joi.boolean().default(true),
    includeAlertStats: Joi.boolean().default(true)
  }),

  alertsQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    severity: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').optional(),
    status: Joi.string().valid('open', 'resolved', 'escalated', 'dismissed').default('open'),
    type: Joi.string().valid(
      'SANCTIONS_MATCH', 'PEP_MATCH', 'HIGH_RISK_WALLET', 
      'ADVERSE_MEDIA', 'HIGH_OVERALL_RISK'
    ).optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    assignedTo: Joi.string().optional()
  })
};

// Sanctions screening schemas
const sanctionsSchemas = {
  check: Joi.object({
    fullName: Joi.string().min(2).max(100).required(),
    country: Joi.string().pattern(countryCodePattern).default('IN'),
    userId: userIdSchema,
    lists: Joi.array().items(
      Joi.string().valid('UN', 'OFAC', 'EU', 'RBI', 'FIU_INDIA', 'HMT')
    ).default(['UN', 'OFAC', 'RBI', 'FIU_INDIA']),
    matchThreshold: Joi.number().min(0).max(1).default(0.8)
  }),

  updateLists: Joi.object({
    listType: Joi.string().valid('UN', 'OFAC', 'EU', 'RBI', 'FIU_INDIA', 'HMT').required(),
    forceUpdate: Joi.boolean().default(false),
    updatedBy: Joi.string().required()
  })
};

// PEP screening schemas
const pepSchemas = {
  check: Joi.object({
    personalInfo: personalInfoSchema.required(),
    userId: userIdSchema,
    includeAssociates: Joi.boolean().default(false),
    includeFamily: Joi.boolean().default(false),
    matchThreshold: Joi.number().min(0).max(1).default(0.7)
  }),

  updateLists: Joi.object({
    region: Joi.string().valid('global', 'india', 'asia', 'europe', 'americas').default('global'),
    forceUpdate: Joi.boolean().default(false),
    updatedBy: Joi.string().required()
  })
};

// Risk assessment schemas
const riskSchemas = {
  assess: Joi.object({
    userId: userIdSchema,
    riskFactors: Joi.object({
      transactionVolume: Joi.number().min(0).optional(),
      transactionFrequency: Joi.number().min(0).optional(),
      geographicRisk: Joi.number().min(0).max(1).optional(),
      industryRisk: Joi.number().min(0).max(1).optional(),
      customerType: Joi.string().valid('individual', 'business', 'institution').optional(),
      accountAge: Joi.number().min(0).optional(),
      kycStatus: Joi.string().valid('pending', 'verified', 'rejected').optional()
    }).optional(),
    includeHistoricalData: Joi.boolean().default(true),
    riskModel: Joi.string().valid('basic', 'advanced', 'ml_enhanced').default('advanced')
  }),

  updateScore: Joi.object({
    userId: userIdSchema,
    newScore: Joi.number().min(0).max(1).required(),
    reason: Joi.string().min(10).max(500).required(),
    updatedBy: Joi.string().required(),
    validUntil: Joi.date().iso().greater('now').optional()
  })
};

// Wallet screening schemas
const walletSchemas = {
  screen: Joi.object({
    walletAddresses: Joi.array().items(walletAddressSchema).min(1).max(10).required(),
    userId: userIdSchema,
    includeTransactionHistory: Joi.boolean().default(false),
    riskSources: Joi.array().items(
      Joi.string().valid('sanctions', 'darkweb', 'mixer', 'exchange_hack', 'ransomware')
    ).default(['sanctions', 'darkweb', 'mixer']),
    depth: Joi.number().integer().min(1).max(5).default(2)
  }),

  addToWatchlist: Joi.object({
    address: Joi.string().required(),
    network: Joi.string().required(),
    reason: Joi.string().min(10).max(500).required(),
    riskLevel: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').required(),
    addedBy: Joi.string().required(),
    expiresAt: Joi.date().iso().greater('now').optional()
  })
};

// Error response schema
const errorResponseSchema = Joi.object({
  success: Joi.boolean().valid(false).required(),
  error: Joi.string().required(),
  details: Joi.array().items(
    Joi.object({
      field: Joi.string().required(),
      message: Joi.string().required(),
      value: Joi.any().optional()
    })
  ).optional(),
  timestamp: Joi.date().iso().default(() => new Date()),
  requestId: Joi.string().uuid().optional()
});

// Success response schema
const successResponseSchema = Joi.object({
  success: Joi.boolean().valid(true).required(),
  data: Joi.any().required(),
  message: Joi.string().optional(),
  timestamp: Joi.date().iso().default(() => new Date()),
  requestId: Joi.string().uuid().optional()
});

// Adverse media screening schemas
const adverseMediaSchemas = {
  screen: Joi.object({
    personalInfo: personalInfoSchema.required(),
    userId: userIdSchema,
    options: Joi.object({
      sources: Joi.array().items(
        Joi.string().valid('news', 'social', 'regulatory', 'legal')
      ).default(['news', 'regulatory', 'legal']),
      languages: Joi.array().items(
        Joi.string().valid('english', 'hindi')
      ).default(['english']),
      timeRange: Joi.object({
        from: Joi.date().iso().optional(),
        to: Joi.date().iso().optional()
      }).optional(),
      riskCategories: Joi.array().items(
        Joi.string().valid('criminal', 'financial_crime', 'regulatory_action', 'civil_litigation', 'negative_business', 'political_exposure')
      ).optional(),
      includePositiveNews: Joi.boolean().default(false)
    }).optional()
  }),

  search: Joi.object({
    source: Joi.string().valid('news', 'regulatory', 'legal').required(),
    query: Joi.string().min(3).max(200).required(),
    dateRange: Joi.object({
      from: Joi.date().iso().required(),
      to: Joi.date().iso().required()
    }).optional(),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  updateConfig: Joi.object({
    sources: Joi.object({
      news: Joi.object({
        enabled: Joi.boolean().optional(),
        sources: Joi.array().items(Joi.string()).optional(),
        languages: Joi.array().items(Joi.string()).optional()
      }).optional(),
      social: Joi.object({
        enabled: Joi.boolean().optional(),
        sources: Joi.array().items(Joi.string()).optional()
      }).optional(),
      regulatory: Joi.object({
        enabled: Joi.boolean().optional(),
        sources: Joi.array().items(Joi.string()).optional()
      }).optional(),
      legal: Joi.object({
        enabled: Joi.boolean().optional(),
        sources: Joi.array().items(Joi.string()).optional()
      }).optional()
    }).optional(),
    riskWeights: Joi.object({
      criminal: Joi.number().min(0).max(1).optional(),
      financial_crime: Joi.number().min(0).max(1).optional(),
      regulatory_action: Joi.number().min(0).max(1).optional(),
      civil_litigation: Joi.number().min(0).max(1).optional(),
      negative_business: Joi.number().min(0).max(1).optional(),
      political_exposure: Joi.number().min(0).max(1).optional()
    }).optional(),
    updatedBy: Joi.string().required()
  })
};

// Export all schemas
module.exports = {
  amlSchemas,
  sanctionsSchemas,
  pepSchemas,
  riskSchemas,
  walletSchemas,
  adverseMediaSchemas,
  errorResponseSchema,
  successResponseSchema,
  
  // Common validation patterns
  patterns: {
    uuid: uuidPattern,
    countryCode: countryCodePattern,
    walletAddress: walletAddressPattern
  },
  
  // Utility functions for custom validation
  validators: {
    isValidUUID: (value) => uuidPattern.test(value),
    isValidCountryCode: (value) => countryCodePattern.test(value),
    isValidWalletAddress: (value) => walletAddressPattern.test(value)
  }
};
