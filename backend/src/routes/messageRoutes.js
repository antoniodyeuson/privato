const express = require('express');
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

const router = express.Router();

// Todas as rotas são protegidas
router.use(auth.protect);

// Rotas de mensagens
router.post('/',
  messageController.uploadAttachments,
  messageController.sendMessage
);

router.get('/conversations', messageController.getConversations);
router.get('/user/:userId', messageController.getMessages);
router.patch('/:id/read', messageController.markAsRead);
router.delete('/:id', messageController.deleteMessage);

module.exports = router;
