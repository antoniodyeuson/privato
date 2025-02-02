const express = require('express');
const purchaseController = require('../controllers/purchaseController');
const authController = require('../controllers/authController');

const router = express.Router();

// Proteger todas as rotas
router.use(authController.protect);

// Rotas para compras
router.get('/', purchaseController.getUserPurchases);
router.post('/:contentId', purchaseController.createPurchase);
router.get('/:contentId/access', purchaseController.checkAccess);

module.exports = router;
