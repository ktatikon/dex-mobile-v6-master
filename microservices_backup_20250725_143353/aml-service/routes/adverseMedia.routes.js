const express = require('express');
const router = express.Router();

// Middleware
const authMiddleware = require('../middlewares/auth.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');
const { adverseMediaSchemas } = require('../schemas/aml.schemas');

// Controller
const adverseMediaController = require('../controllers/adverseMedia.controller');

/**
 * @route POST /api/aml/adverse-media/screen
 * @desc Perform adverse media screening
 * @access Private
 */
router.post('/screen',
  authMiddleware.authenticate,
  validationMiddleware.validateBody(adverseMediaSchemas.screen),
  adverseMediaController.performScreening
);

/**
 * @route GET /api/aml/adverse-media/history/:userId
 * @desc Get adverse media screening history
 * @access Private
 */
router.get('/history/:userId',
  authMiddleware.authenticate,
  adverseMediaController.getScreeningHistory
);

/**
 * @route GET /api/aml/adverse-media/sources
 * @desc Get available media sources
 * @access Private
 */
router.get('/sources',
  authMiddleware.authenticate,
  adverseMediaController.getMediaSources
);

/**
 * @route GET /api/aml/adverse-media/categories
 * @desc Get risk categories and weights
 * @access Private
 */
router.get('/categories',
  authMiddleware.authenticate,
  adverseMediaController.getRiskCategories
);

/**
 * @route POST /api/aml/adverse-media/search
 * @desc Search specific media source
 * @access Private
 */
router.post('/search',
  authMiddleware.authenticate,
  validationMiddleware.validateBody(adverseMediaSchemas.search),
  adverseMediaController.searchMediaSource
);

/**
 * @route GET /api/aml/adverse-media/stats
 * @desc Get screening statistics
 * @access Private
 */
router.get('/stats',
  authMiddleware.authenticate,
  adverseMediaController.getScreeningStats
);

/**
 * @route PUT /api/aml/adverse-media/config
 * @desc Update screening configuration
 * @access Private
 */
router.put('/config',
  authMiddleware.authenticate,
  validationMiddleware.validateBody(adverseMediaSchemas.updateConfig),
  adverseMediaController.updateConfiguration
);

/**
 * @route GET /api/aml/adverse-media/health
 * @desc Adverse media service health check
 * @access Private
 */
router.get('/health',
  authMiddleware.authenticate,
  adverseMediaController.healthCheck
);

module.exports = router;
