const Message = require('../models/Message');
const User = require('../models/userModel');
const multer = require('multer');
const path = require('path');

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/uploads/messages');
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mp3|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Tipo de arquivo não suportado!'));
  }
});

exports.uploadAttachments = upload.array('attachments', 5);

exports.sendMessage = async (req, res) => {
  try {
    const files = req.files ? req.files.map(file => ({
      type: file.mimetype.split('/')[0],
      url: `/uploads/messages/${file.filename}`,
      name: file.originalname,
      size: file.size,
      thumbnail: file.mimetype.startsWith('image') ? `/uploads/messages/${file.filename}` : null
    })) : [];

    const message = await Message.create({
      sender: req.user.id,
      recipient: req.body.recipient,
      content: req.body.content,
      attachments: files,
      isPaid: req.body.isPaid || false,
      price: req.body.price || 0
    });

    // Populate sender and recipient info
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username profilePicture')
      .populate('recipient', 'username profilePicture');

    // Adicionar notificação para o destinatário
    await User.findByIdAndUpdate(req.body.recipient, {
      $push: {
        notifications: {
          type: 'message',
          message: `Nova mensagem de ${req.user.username}`,
          createdAt: Date.now()
        }
      }
    });

    res.status(201).json({
      status: 'success',
      data: {
        message: populatedMessage
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};

exports.getConversations = async (req, res) => {
  try {
    // Encontrar todas as mensagens únicas agrupadas por conversas
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { recipient: req.user._id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', req.user._id] },
              '$recipient',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipient', req.user._id] },
                    { $eq: ['$read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Populate user info
    const populatedConversations = await User.populate(conversations, {
      path: '_id',
      select: 'username profilePicture'
    });

    res.status(200).json({
      status: 'success',
      results: conversations.length,
      data: {
        conversations: populatedConversations
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      $or: [
        { sender: req.user.id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user.id }
      ]
    })
    .populate('sender', 'username profilePicture')
    .populate('recipient', 'username profilePicture')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

    // Marcar mensagens como lidas
    await Message.updateMany(
      {
        sender: req.params.userId,
        recipient: req.user.id,
        read: false
      },
      {
        $set: { read: true, readAt: Date.now() }
      }
    );

    res.status(200).json({
      status: 'success',
      results: messages.length,
      data: {
        messages
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        status: 'error',
        message: 'Mensagem não encontrada'
      });
    }

    // Verificar se o usuário é o remetente ou destinatário
    if (message.sender.toString() !== req.user.id && 
        message.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Você não tem permissão para deletar esta mensagem'
      });
    }

    // Soft delete para remetente ou destinatário
    if (message.sender.toString() === req.user.id) {
      message.deletedBySender = true;
    } else {
      message.deletedByRecipient = true;
    }

    // Se ambos deletaram, remover a mensagem
    if (message.deletedBySender && message.deletedByRecipient) {
      await message.remove();
    } else {
      await message.save();
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        status: 'error',
        message: 'Mensagem não encontrada'
      });
    }

    // Verificar se o usuário é o destinatário
    if (message.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Você não tem permissão para marcar esta mensagem como lida'
      });
    }

    message.read = true;
    message.readAt = Date.now();
    await message.save();

    res.status(200).json({
      status: 'success',
      data: {
        message
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};
