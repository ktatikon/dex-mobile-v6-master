const express = require('express');
const router = express.Router();
const amlController = require('../controllers/aml.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');
const { amlSchemas } = require('../schemas/aml.schemas');

/**
 * @route POST /api/aml/screen
 * @desc Perform comprehensive AML screening
 * @access Private
 */
router.post('/screen',
  authMiddleware.authenticate,
  validationMiddleware.validateBody(amlSchemas.screenUser),
  amlController.screenUser
);

/**
 * @route GET /api/aml/status/:userId
 * @desc Get AML screening status for a user
 * @access Private
 */
router.get('/status/:userId',
  authMiddleware.authenticate,
  validationMiddleware.validateParams(amlSchemas.userIdParam),
  amlController.getScreeningStatus
);

/**
 * @route GET /api/aml/history/:userId
 * @desc Get AML screening history for a user
 * @access Private
 */
router.get('/history/:userId',
  authMiddleware.authenticate,
  validationMiddleware.validateParams(amlSchemas.userIdParam),
  validationMiddleware.validateQuery(amlSchemas.historyQuery),
  amlController.getScreeningHistory
);

/**
 * @route POST /api/aml/rescreen
 * @desc Re-screen a user for AML compliance
 * @access Private
 */
router.post('/rescreen',
  authMiddleware.authenticate,
  validationMiddleware.validateBody(amlSchemas.rescreenUser),
  amlController.rescreenUser
);

/**
 * @route GET /api/aml/report/:userId
 * @desc Generate AML compliance report for a user
 * @access Private
 */
router.get('/report/:userId',
  authMiddleware.authenticate,
  validationMiddleware.validateParams(amlSchemas.userIdParam),
  amlController.generateComplianceReport
);

/**
 * @route POST /api/aml/batch-screen
 * @desc Perform batch AML screening
 * @access Private
 */
router.post('/batch-screen',
  authMiddleware.authenticate,
  validationMiddleware.validateBody(amlSchemas.batchScreen),
  amlController.batchScreen
);

/**
 * @route GET /api/aml/statistics
 * @desc Get AML screening statistics
 * @access Private
 */
router.get('/statistics',
  authMiddleware.authenticate,
  validationMiddleware.validateQuery(amlSchemas.statisticsQuery),
  amlController.getStatistics
);

/**
 * @route POST /api/aml/whitelist
 * @desc Add user to AML whitelist
 * @access Private
 */
router.post('/whitelist',
  authMiddleware.authenticate,
  validationMiddleware.validateBody(amlSchemas.whitelistUser),
  amlController.addToWhitelist
);

/**
 * @route DELETE /api/aml/whitelist/:userId
 * @desc Remove user from AML whitelist
 * @access Private
 */
router.delete('/whitelist/:userId',
  authMiddleware.authenticate,
  validationMiddleware.validateParams(amlSchemas.userIdParam),
  amlController.removeFromWhitelist
);

/**
 * @route GET /api/aml/alerts
 * @desc Get AML alerts
 * @access Private
 */
router.get('/alerts',
  authMiddleware.authenticate,
  validationMiddleware.validateQuery(amlSchemas.alertsQuery),
  amlController.getAlerts
);

/**
 * @route PUT /api/aml/alerts/:alertId/resolve
 * @desc Resolve AML alert
 * @access Private
 */
router.put('/alerts/:alertId/resolve',
  authMiddleware.authenticate,
  validationMiddleware.validateParams(amlSchemas.alertIdParam),
  validationMiddleware.validateBody(amlSchemas.resolveAlert),
  amlController.resolveAlert
);

/**
 * @route GET /api/aml/config
 * @desc Get AML configuration
 * @access Private
 */
router.get('/config',
  authMiddleware.authenticate,
  amlController.getConfiguration
);

/**
 * @route PUT /api/aml/config
 * @desc Update AML configuration
 * @access Private
 */
router.put('/config',
  authMiddleware.authenticate,
  validationMiddleware.validateBody(amlSchemas.updateConfig),
  amlController.updateConfiguration
);

module.exports = router;
