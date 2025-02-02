const Transaction = require('../models/transactionModel');
const Content = require('../models/contentModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const qrcode = require('qrcode');
const crypto = require('crypto');

// Função auxiliar para gerar código PIX
const generatePixCode = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Função auxiliar para gerar QR Code
const generateQRCode = async (pixCode) => {
    try {
        return await qrcode.toDataURL(pixCode);
    } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
        throw new AppError('Erro ao gerar QR Code', 500);
    }
};

// Iniciar uma transação
exports.createTransaction = catchAsync(async (req, res, next) => {
    const { contentId } = req.body;
    const userId = req.user.id;

    // Verificar se o conteúdo existe
    const content = await Content.findById(contentId);
    if (!content) {
        return next(new AppError('Conteúdo não encontrado', 404));
    }

    // Verificar se o usuário já comprou este conteúdo
    const user = await User.findById(userId);
    if (user.purchasedContent && user.purchasedContent.includes(contentId)) {
        return next(new AppError('Você já comprou este conteúdo', 400));
    }

    // Gerar código PIX
    const pixCode = generatePixCode();
    
    // Definir expiração (30 minutos)
    const pixExpiration = new Date();
    pixExpiration.setMinutes(pixExpiration.getMinutes() + 30);

    // Criar transação
    const transaction = await Transaction.create({
        user: userId,
        content: contentId,
        amount: content.price,
        paymentMethod: 'pix',
        pixCode,
        pixExpiration
    });

    // Gerar QR Code
    const qrCode = await generateQRCode(pixCode);

    res.status(201).json({
        status: 'success',
        data: {
            transaction: {
                id: transaction._id,
                amount: transaction.amount,
                pixCode: transaction.pixCode,
                pixExpiration: transaction.pixExpiration,
                qrCode
            }
        }
    });
});

// Verificar status da transação
exports.checkTransactionStatus = catchAsync(async (req, res, next) => {
    const { transactionId } = req.params;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
        return next(new AppError('Transação não encontrada', 404));
    }

    // Verificar se o usuário tem permissão para ver esta transação
    if (transaction.user.toString() !== req.user.id) {
        return next(new AppError('Você não tem permissão para ver esta transação', 403));
    }

    res.status(200).json({
        status: 'success',
        data: {
            status: transaction.status,
            pixExpiration: transaction.pixExpiration
        }
    });
});

// Confirmar pagamento (webhook)
exports.confirmPayment = catchAsync(async (req, res, next) => {
    const { pixCode } = req.body;

    // Encontrar transação pelo código PIX
    const transaction = await Transaction.findOne({ pixCode, status: 'pending' });
    if (!transaction) {
        return next(new AppError('Transação não encontrada ou já processada', 404));
    }

    // Verificar se o PIX não expirou
    if (new Date() > transaction.pixExpiration) {
        transaction.status = 'expired';
        await transaction.save();
        return next(new AppError('Código PIX expirado', 400));
    }

    // Atualizar status da transação
    transaction.status = 'completed';
    transaction.completedAt = new Date();
    await transaction.save();

    // Adicionar conteúdo à lista de comprados do usuário
    await User.findByIdAndUpdate(transaction.user, {
        $addToSet: { purchasedContent: transaction.content }
    });

    res.status(200).json({
        status: 'success',
        message: 'Pagamento confirmado com sucesso'
    });
});

// Listar transações do usuário
exports.getUserTransactions = catchAsync(async (req, res, next) => {
    const transactions = await Transaction.find({ user: req.user.id })
        .populate('content', 'title price')
        .sort('-createdAt');

    res.status(200).json({
        status: 'success',
        data: {
            transactions
        }
    });
});

// Cancelar transação pendente
exports.cancelTransaction = catchAsync(async (req, res, next) => {
    const { transactionId } = req.params;

    const transaction = await Transaction.findOne({
        _id: transactionId,
        user: req.user.id,
        status: 'pending'
    });

    if (!transaction) {
        return next(new AppError('Transação não encontrada ou não pode ser cancelada', 404));
    }

    transaction.status = 'failed';
    await transaction.save();

    res.status(200).json({
        status: 'success',
        message: 'Transação cancelada com sucesso'
    });
});
