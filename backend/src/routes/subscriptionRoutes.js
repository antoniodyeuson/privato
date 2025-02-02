const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const authController = require('../controllers/authController');

const router = express.Router();

// Proteger todas as rotas
router.use(authController.protect);

// Rotas para usuários
router.get('/my-subscriptions', subscriptionController.getUserSubscriptions);
router.post('/creator/:creatorId', subscriptionController.createSubscription);
router.patch('/:id/cancel', subscriptionController.cancelSubscription);
router.patch('/:id/renew', subscriptionController.renewSubscription);

// Rotas para criadores
router.use(authController.restrictTo('creator'));
router.get('/my-subscribers', subscriptionController.getCreatorSubscribers);

module.exports = router;
