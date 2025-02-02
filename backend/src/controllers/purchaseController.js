const Purchase = require('../models/purchaseModel');
const Content = require('../models/contentModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Criar nova compra
exports.createPurchase = catchAsync(async (req, res, next) => {
    console.log('Criando nova compra...');
    console.log('Usuário:', req.user._id);
    console.log('Conteúdo:', req.params.contentId);

    // 1) Verificar se o conteúdo existe
    const content = await Content.findById(req.params.contentId);
    if (!content) {
        return next(new AppError('Conteúdo não encontrado', 404));
    }

    // 2) Verificar se o usuário já comprou este conteúdo
    const existingPurchase = await Purchase.findOne({
        user: req.user._id,
        content: content._id,
        status: 'completed'
    });

    if (existingPurchase) {
        return next(new AppError('Você já comprou este conteúdo', 400));
    }

    // 3) Criar a compra
    const purchase = await Purchase.create({
        user: req.user._id,
        content: content._id,
        creator: content.creator,
        price: content.price,
        status: 'completed' // Por enquanto, vamos considerar todas as compras como completadas
    });

    console.log('Compra criada:', purchase._id);

    res.status(201).json({
        status: 'success',
        data: {
            purchase
        }
    });
});

// Listar compras do usuário
exports.getUserPurchases = catchAsync(async (req, res, next) => {
    const purchases = await Purchase.find({ user: req.user._id, status: 'completed' })
        .populate({
            path: 'content',
            select: 'title description thumbnail type contentUrl'
        })
        .populate({
            path: 'creator',
            select: 'name username avatar'
        })
        .sort('-purchaseDate');

    res.status(200).json({
        status: 'success',
        data: {
            purchases
        }
    });
});

// Verificar se o usuário tem acesso ao conteúdo
exports.checkAccess = catchAsync(async (req, res, next) => {
    const purchase = await Purchase.findOne({
        user: req.user._id,
        content: req.params.contentId,
        status: 'completed'
    });

    res.status(200).json({
        status: 'success',
        data: {
            hasAccess: !!purchase
        }
    });
});
