const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { protect } = require('../controllers/authController');

// Proteger todas as rotas
router.use(protect);

// Rotas para transações
router.post('/create', transactionController.createTransaction);
router.get('/status/:transactionId', transactionController.checkTransactionStatus);
router.post('/confirm', transactionController.confirmPayment);
router.get('/user', transactionController.getUserTransactions);
router.post('/cancel/:transactionId', transactionController.cancelTransaction);

module.exports = router;
