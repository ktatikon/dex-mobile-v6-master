const express = require('express');
const router = express.Router();
const sanctionsController = require('../controllers/sanctions.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');
const { sanctionsSchemas } = require('../schemas/aml.schemas');

/**
 * @route POST /api/aml/sanctions/check
 * @desc Check user against sanctions lists
 * @access Private
 */
router.post('/check',
  authMiddleware.authenticate,
  validationMiddleware.validateBody(sanctionsSchemas.check),
  sanctionsController.checkSanctions
);

/**
 * @route GET /api/aml/sanctions/lists
 * @desc Get available sanctions lists and their status
 * @access Private
 */
router.get('/lists',
  authMiddleware.authenticate,
  sanctionsController.getSanctionsLists
);

/**
 * @route POST /api/aml/sanctions/lists/update
 * @desc Update sanctions lists from official sources
 * @access Private
 */
router.post('/lists/update',
  authMiddleware.authenticate,
  authMiddleware.authorize(['aml:admin']),
  validationMiddleware.validateBody(sanctionsSchemas.updateLists),
  sanctionsController.updateSanctionsLists
);

/**
 * @route GET /api/aml/sanctions/status/:userId
 * @desc Get sanctions screening status for a user
 * @access Private
 */
router.get('/status/:userId',
  authMiddleware.authenticate,
  authMiddleware.validateUserContext,
  sanctionsController.getSanctionsStatus
);

/**
 * @route GET /api/aml/sanctions/history/:userId
 * @desc Get sanctions screening history for a user
 * @access Private
 */
router.get('/history/:userId',
  authMiddleware.authenticate,
  authMiddleware.validateUserContext,
  sanctionsController.getSanctionsHistory
);

/**
 * @route POST /api/aml/sanctions/whitelist
 * @desc Add entry to sanctions whitelist
 * @access Private
 */
router.post('/whitelist',
  authMiddleware.authenticate,
  authMiddleware.authorize(['aml:admin']),
  sanctionsController.addToSanctionsWhitelist
);

/**
 * @route DELETE /api/aml/sanctions/whitelist/:entryId
 * @desc Remove entry from sanctions whitelist
 * @access Private
 */
router.delete('/whitelist/:entryId',
  authMiddleware.authenticate,
  authMiddleware.authorize(['aml:admin']),
  sanctionsController.removeFromSanctionsWhitelist
);

module.exports = router;
