const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const purchaseController = require('../controllers/purchaseController');
const loyaltyController = require('../controllers/loyaltyController'); // Adicionado

// Rotas públicas
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Proteger todas as rotas seguintes
router.use(authController.protect);

// Rotas protegidas
router.get('/loyalty/status', loyaltyController.getLoyaltyStatus);
router.post('/loyalty/redeem', loyaltyController.redeemReward);

// Outras rotas protegidas
router.get('/me', userController.getMe);
router.patch('/update-me', userController.updateMe);
router.delete('/delete-me', userController.deleteMe);

// Rotas de compras
router.get('/purchases', purchaseController.getUserPurchases);
router.post('/purchases/:contentId', purchaseController.createPurchase);
router.get('/purchases/:contentId/access', purchaseController.checkAccess);

module.exports = router;
