const Payment = require('../models/Payment');
const User = require('../models/userModel');
const Subscription = require('../models/Subscription');
const Content = require('../models/Content');
const { Client } = require('coinbase-commerce-node');
const { calculateLoyaltyPoints } = require('./loyaltyController');
const { createNotification } = require('./notificationController');

Client.init(process.env.COINBASE_API_KEY);

exports.createPayment = async (req, res) => {
  try {
    const {
      recipient,
      amount,
      type,
      paymentMethod,
      relatedItem,
      itemType
    } = req.body;

    // Criar pagamento
    const payment = await Payment.create({
      payer: req.user.id,
      recipient,
      amount,
      type,
      paymentMethod,
      relatedItem,
      itemType,
      status: 'pending'
    });

    // Atualizar status do item relacionado após pagamento
    if (payment.status === 'completed') {
      switch (payment.itemType) {
        case 'Subscription':
          await Subscription.findByIdAndUpdate(payment.relatedItem, {
            status: 'active'
          });
          break;
        case 'Content':
          // Adicionar aos ganhos do creator
          await Content.findByIdAndUpdate(payment.relatedItem, {
            $inc: { 'stats.earnings': payment.creatorEarnings }
          });
          break;
      }

      // Atualizar ganhos do creator
      await User.findByIdAndUpdate(payment.recipient, {
        $inc: {
          'earnings.total': payment.creatorEarnings,
          'earnings.pending': payment.creatorEarnings
        }
      });
    }

    res.status(201).json({
      status: 'success',
      data: {
        payment
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};

exports.getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('payer', 'username email profilePicture')
      .populate('recipient', 'username email profilePicture');

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Pagamento não encontrado'
      });
    }

    // Verificar permissão
    if (payment.payer.id !== req.user.id && 
        payment.recipient.id !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Você não tem permissão para ver este pagamento'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        payment
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};

exports.getUserPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtrar por tipo de pagamento
    const filter = { payer: req.user.id };
    if (req.query.type) {
      filter.type = req.query.type;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const payments = await Payment.find(filter)
      .populate('recipient', 'username email profilePicture')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: payments.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: {
        payments
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};

exports.getCreatorEarnings = async (req, res) => {
  try {
    // Verificar se o usuário é o creator
    if (req.params.creatorId !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Você não tem permissão para ver estes dados'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtrar pagamentos recebidos
    const filter = { 
      recipient: req.user.id,
      status: 'completed'
    };

    if (req.query.type) {
      filter.type = req.query.type;
    }

    const payments = await Payment.find(filter)
      .populate('payer', 'username email profilePicture')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    // Calcular estatísticas
    const stats = await Payment.aggregate([
      {
        $match: {
          recipient: req.user._id,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$creatorEarnings' },
          totalPayments: { $sum: 1 },
          avgPayment: { $avg: '$amount' }
        }
      }
    ]);

    const total = await Payment.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: payments.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      stats: stats[0] || {
        totalEarnings: 0,
        totalPayments: 0,
        avgPayment: 0
      },
      data: {
        payments
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};

exports.processPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Pagamento não encontrado'
      });
    }

    // Simular processamento de pagamento
    // Aqui você integraria com um gateway de pagamento real
    const success = Math.random() > 0.1; // 90% de chance de sucesso

    if (success) {
      payment.status = 'completed';
      payment.completedAt = Date.now();

      // Atualizar item relacionado
      switch (payment.itemType) {
        case 'Subscription':
          await Subscription.findByIdAndUpdate(payment.relatedItem, {
            status: 'active'
          });
          break;
        case 'Content':
          await Content.findByIdAndUpdate(payment.relatedItem, {
            $inc: { 'stats.earnings': payment.creatorEarnings }
          });
          break;
      }

      // Atualizar ganhos do creator
      await User.findByIdAndUpdate(payment.recipient, {
        $inc: {
          'earnings.total': payment.creatorEarnings,
          'earnings.pending': payment.creatorEarnings
        }
      });

      // Adicionar cálculo de pontos de fidelidade
      await calculateLoyaltyPoints(payment.payer, payment.amount);

      await payment.save();

      // Adicionar notificação de compra bem-sucedida
      await createNotification(payment.payer, 'purchase', 'Compra realizada com sucesso', { amount: payment.amount });

      res.status(200).json({
        status: 'success',
        message: 'Pagamento processado com sucesso',
        data: {
          payment
        }
      });
    } else {
      payment.status = 'failed';
      await payment.save();

      res.status(400).json({
        status: 'error',
        message: 'Falha no processamento do pagamento'
      });
    }
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};

exports.refundPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Pagamento não encontrado'
      });
    }

    // Verificar se o pagamento pode ser reembolsado
    if (payment.status !== 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Este pagamento não pode ser reembolsado'
      });
    }

    // Verificar permissão (apenas admin ou recipient pode reembolsar)
    if (req.user.role !== 'admin' && payment.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Você não tem permissão para reembolsar este pagamento'
      });
    }

    payment.status = 'refunded';
    payment.refundedAt = Date.now();
    payment.refundReason = req.body.reason;

    // Reverter ganhos do creator
    await User.findByIdAndUpdate(payment.recipient, {
      $inc: {
        'earnings.total': -payment.creatorEarnings,
        'earnings.pending': -payment.creatorEarnings
      }
    });

    await payment.save();

    res.status(200).json({
      status: 'success',
      message: 'Pagamento reembolsado com sucesso',
      data: {
        payment
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};

exports.createCryptoCharge = async (req, res) => {
  try {
    const charge = await Client.createCharge({
      name: 'Conteúdo Premium',
      pricing_type: 'fixed_price',
      local_price: {
        amount: req.body.amount,
        currency: 'USD'
      },
      metadata: {
        userId: req.user.id,
        contentId: req.body.contentId
      }
    });
    res.json({ checkoutUrl: charge.hosted_url });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};
