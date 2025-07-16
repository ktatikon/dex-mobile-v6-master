const express = require('express');
const router = express.Router();
const riskController = require('../controllers/risk.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');
const { riskSchemas } = require('../schemas/aml.schemas');

/**
 * @route POST /api/aml/risk/assess
 * @desc Perform risk assessment for a user
 * @access Private
 */
router.post('/assess',
  authMiddleware.authenticate,
  validationMiddleware.validateBody(riskSchemas.assess),
  validationMiddleware.validateRiskAssessment,
  riskController.assessRisk
);

/**
 * @route GET /api/aml/risk/score/:userId
 * @desc Get current risk score for a user
 * @access Private
 */
router.get('/score/:userId',
  authMiddleware.authenticate,
  authMiddleware.validateUserContext,
  riskController.getRiskScore
);

/**
 * @route POST /api/aml/risk/score/update
 * @desc Update risk score for a user
 * @access Private
 */
router.post('/score/update',
  authMiddleware.authenticate,
  authMiddleware.authorize(['aml:admin']),
  validationMiddleware.validateBody(riskSchemas.updateScore),
  riskController.updateRiskScore
);

/**
 * @route GET /api/aml/risk/factors/:userId
 * @desc Get risk factors for a user
 * @access Private
 */
router.get('/factors/:userId',
  authMiddleware.authenticate,
  authMiddleware.validateUserContext,
  riskController.getRiskFactors
);

/**
 * @route GET /api/aml/risk/history/:userId
 * @desc Get risk assessment history for a user
 * @access Private
 */
router.get('/history/:userId',
  authMiddleware.authenticate,
  authMiddleware.validateUserContext,
  riskController.getRiskHistory
);

/**
 * @route GET /api/aml/risk/matrix
 * @desc Get risk assessment matrix and thresholds
 * @access Private
 */
router.get('/matrix',
  authMiddleware.authenticate,
  riskController.getRiskMatrix
);

/**
 * @route POST /api/aml/risk/matrix/update
 * @desc Update risk assessment matrix
 * @access Private
 */
router.post('/matrix/update',
  authMiddleware.authenticate,
  authMiddleware.authorize(['aml:admin']),
  riskController.updateRiskMatrix
);

/**
 * @route GET /api/aml/risk/engine/health
 * @desc Get risk assessment engine health
 * @access Private
 */
router.get('/engine/health',
  authMiddleware.authenticate,
  riskController.getRiskEngineHealth
);

/**
 * @route GET /api/aml/risk/analytics
 * @desc Get risk analytics and trends
 * @access Private
 */
router.get('/analytics',
  authMiddleware.authenticate,
  authMiddleware.authorize(['aml:read']),
  riskController.getRiskAnalytics
);

module.exports = router;
