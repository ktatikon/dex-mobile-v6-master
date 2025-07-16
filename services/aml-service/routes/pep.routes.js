const express = require('express');
const router = express.Router();
const pepController = require('../controllers/pep.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');
const { pepSchemas } = require('../schemas/aml.schemas');

/**
 * @route POST /api/aml/pep/check
 * @desc Check user against PEP lists
 * @access Private
 */
router.post('/check',
  authMiddleware.authenticate,
  validationMiddleware.validateBody(pepSchemas.check),
  validationMiddleware.validateAMLScreening,
  pepController.checkPEP
);

/**
 * @route GET /api/aml/pep/lists
 * @desc Get available PEP lists and their status
 * @access Private
 */
router.get('/lists',
  authMiddleware.authenticate,
  pepController.getPEPLists
);

/**
 * @route POST /api/aml/pep/lists/update
 * @desc Update PEP lists from official sources
 * @access Private
 */
router.post('/lists/update',
  authMiddleware.authenticate,
  authMiddleware.authorize(['aml:admin']),
  validationMiddleware.validateBody(pepSchemas.updateLists),
  pepController.updatePEPLists
);

/**
 * @route GET /api/aml/pep/status/:userId
 * @desc Get PEP screening status for a user
 * @access Private
 */
router.get('/status/:userId',
  authMiddleware.authenticate,
  authMiddleware.validateUserContext,
  pepController.getPEPStatus
);

/**
 * @route GET /api/aml/pep/history/:userId
 * @desc Get PEP screening history for a user
 * @access Private
 */
router.get('/history/:userId',
  authMiddleware.authenticate,
  authMiddleware.validateUserContext,
  pepController.getPEPHistory
);

/**
 * @route POST /api/aml/pep/whitelist
 * @desc Add entry to PEP whitelist
 * @access Private
 */
router.post('/whitelist',
  authMiddleware.authenticate,
  authMiddleware.authorize(['aml:admin']),
  pepController.addToPEPWhitelist
);

/**
 * @route DELETE /api/aml/pep/whitelist/:entryId
 * @desc Remove entry from PEP whitelist
 * @access Private
 */
router.delete('/whitelist/:entryId',
  authMiddleware.authenticate,
  authMiddleware.authorize(['aml:admin']),
  pepController.removeFromPEPWhitelist
);

module.exports = router;
