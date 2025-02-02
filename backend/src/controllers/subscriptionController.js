const Subscription = require('../models/subscriptionModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');

// Criar nova assinatura
exports.createSubscription = catchAsync(async (req, res) => {
    // Verificar se já existe assinatura ativa
    const existingSubscription = await Subscription.findOne({
        subscriber: req.user.id,
        creator: req.params.creatorId,
        status: 'active'
    });

    if (existingSubscription) {
        return res.status(400).json({
            status: 'error',
            message: 'Você já tem uma assinatura ativa com este criador'
        });
    }

    // Verificar se o criador existe
    const creator = await User.findById(req.params.creatorId);
    if (!creator || creator.role !== 'creator') {
        return res.status(404).json({
            status: 'error',
            message: 'Criador não encontrado'
        });
    }

    // Calcular data de término baseado no plano
    const startDate = new Date();
    const endDate = new Date();
    if (req.body.plan === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
        endDate.setMonth(endDate.getMonth() + 1);
    }

    // Criar assinatura
    const subscription = await Subscription.create({
        subscriber: req.user.id,
        creator: req.params.creatorId,
        plan: req.body.plan,
        price: req.body.price,
        startDate,
        endDate
    });

    res.status(201).json({
        status: 'success',
        data: {
            subscription
        }
    });
});

// Listar assinaturas do usuário
exports.getUserSubscriptions = catchAsync(async (req, res) => {
    const subscriptions = await Subscription.find({
        subscriber: req.user.id,
        status: 'active'
    }).populate('creator', 'username');

    res.status(200).json({
        status: 'success',
        results: subscriptions.length,
        data: {
            subscriptions
        }
    });
});

// Listar assinantes do criador
exports.getCreatorSubscribers = catchAsync(async (req, res) => {
    const subscriptions = await Subscription.find({
        creator: req.user.id,
        status: 'active'
    }).populate('subscriber', 'username email');

    res.status(200).json({
        status: 'success',
        results: subscriptions.length,
        data: {
            subscriptions
        }
    });
});

// Cancelar assinatura
exports.cancelSubscription = catchAsync(async (req, res) => {
    const subscription = await Subscription.findOne({
        _id: req.params.id,
        subscriber: req.user.id,
        status: 'active'
    });

    if (!subscription) {
        return res.status(404).json({
            status: 'error',
            message: 'Assinatura não encontrada ou já cancelada'
        });
    }

    subscription.status = 'cancelled';
    subscription.cancelReason = req.body.reason;
    subscription.autoRenew = false;
    await subscription.save();

    res.status(200).json({
        status: 'success',
        message: 'Assinatura cancelada com sucesso'
    });
});

// Renovar assinatura
exports.renewSubscription = catchAsync(async (req, res) => {
    const subscription = await Subscription.findOne({
        _id: req.params.id,
        subscriber: req.user.id
    });

    if (!subscription) {
        return res.status(404).json({
            status: 'error',
            message: 'Assinatura não encontrada'
        });
    }

    // Calcular nova data de término
    const startDate = new Date();
    const endDate = new Date();
    if (subscription.plan === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
        endDate.setMonth(endDate.getMonth() + 1);
    }

    subscription.status = 'active';
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    subscription.autoRenew = true;
    await subscription.save();

    res.status(200).json({
        status: 'success',
        message: 'Assinatura renovada com sucesso',
        data: {
            subscription
        }
    });
});
