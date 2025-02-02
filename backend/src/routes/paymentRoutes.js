const express = require('express');
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const CoinbaseCommerce = require('coinbase-commerce-node');

const router = express.Router();

// Todas as rotas são protegidas
router.use(auth.protect);

// Rotas de pagamento
router.post('/', paymentController.createPayment);
router.get('/my-payments', paymentController.getUserPayments);
router.get('/:id', paymentController.getPayment);
router.post('/:id/process', paymentController.processPayment);

// Rotas para creators
router.get('/creator/:creatorId/earnings',
  auth.restrictTo('creator'),
  paymentController.getCreatorEarnings
);

// Rotas para reembolso (admin e creator)
router.post('/:id/refund',
  auth.restrictTo('admin', 'creator'),
  paymentController.refundPayment
);

// Rotas de pagamento com criptomoedas
router.post('/crypto/checkout', paymentController.createCryptoCharge);
router.get('/crypto/success', paymentController.handleCryptoSuccess);
router.post('/crypto/webhook', 
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const sig = req.headers['x-cc-webhook-signature'];
    try {
      const event = CoinbaseCommerce.Webhook.verifyEventBody(req.body, sig, process.env.COINBASE_WEBHOOK_SECRET);
      paymentController.handleCryptoPayment(event);
      res.status(200).end();
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

module.exports = router;
