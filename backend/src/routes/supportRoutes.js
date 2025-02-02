const express = require('express');
const supportController = require('../controllers/supportController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.route('/')
  .post(supportController.createTicket)
  .get(supportController.getAllTickets);

router.route('/:id')
  .get(supportController.getTicket)
  .patch(supportController.addResponse);

module.exports = router;
