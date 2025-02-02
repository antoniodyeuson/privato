const mongoose = require('mongoose');
const Content = require('../models/contentModel');
const User = require('../models/userModel');
const Subscription = require('../models/subscriptionModel');
const Follow = require('../models/followModel');
const Badge = require('../models/badgeModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const fs = require('fs').promises;
const path = require('path');

// Obter dados do creator logado
exports.getMe = catchAsync(async (req, res, next) => {
    try {
        // Verificar se o usuário está autenticado e é um creator
        if (!req.user || req.user.role !== 'creator') {
            return next(new AppError('Não autorizado', 401));
        }

        const creator = await User.findById(req.user._id)
            .select('username email role createdAt');

        if (!creator) {
            return next(new AppError('Creator não encontrado', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                creator
            }
        });
    } catch (error) {
        console.error('Erro ao buscar dados do creator:', error);
        return next(new AppError('Erro ao buscar dados do creator', 500));
    }
});

// Obter estatísticas do creator
exports.getStats = catchAsync(async (req, res, next) => {
    try {
        // Verificar se o usuário está autenticado e é um creator
        if (!req.user || req.user.role !== 'creator') {
            return next(new AppError('Não autorizado', 401));
        }

        // Validar o ID do usuário
        if (!mongoose.Types.ObjectId.isValid(req.user._id)) {
            return next(new AppError('ID de usuário inválido', 400));
        }

        console.log('Buscando estatísticas para o creator:', req.user._id);

        // Buscar estatísticas do creator usando agregação
        const stats = await Promise.all([
            Subscription.countDocuments({ creator: req.user._id }),
            Content.countDocuments({ creator: req.user._id })
        ]);

        const [subscribers, content] = stats;

        res.status(200).json({
            status: 'success',
            data: {
                stats: {
                    subscribers,
                    content,
                    views: 0,
                    revenue: 0
                },
                recentSubscribers: []
            }
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return next(new AppError('Erro ao buscar estatísticas', 500));
    }
});

// Obter conteúdo do creator
exports.getContent = catchAsync(async (req, res, next) => {
    try {
        console.log('Buscando conteúdo para o creator:', req.user._id);

        // Validar o ID do usuário
        if (!mongoose.Types.ObjectId.isValid(req.user._id)) {
            return next(new AppError('ID de usuário inválido', 400));
        }

        // Buscar conteúdo do creator
        const content = await Content.find({ creator: req.user._id })
            .sort({ createdAt: -1 })
            .select('title description price file type views status tags createdAt');

        console.log('Conteúdo encontrado:', content);

        res.status(200).json({
            status: 'success',
            results: content.length,
            data: {
                content
            }
        });
    } catch (error) {
        console.error('Erro ao buscar conteúdo:', error);
        return next(new AppError('Erro ao buscar conteúdo', 500));
    }
});

// Obter conteúdo específico do creator
exports.getCreatorContent = catchAsync(async (req, res, next) => {
    const content = await Content.findOne({
        _id: req.params.id,
        creator: req.user.id
    });

    if (!content) {
        return next(new AppError('Conteúdo não encontrado', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            content
        }
    });
});

// Criar novo conteúdo do creator
exports.createContent = catchAsync(async (req, res, next) => {
    console.log('Criando novo conteúdo...');
    console.log('Arquivos recebidos:', req.files);
    console.log('Dados recebidos:', req.body);

    // Verificar se os arquivos foram enviados
    if (!req.files || !req.files.file) {
        return next(new AppError('Por favor, envie o arquivo do conteúdo', 400));
    }

    // Preparar dados do conteúdo
    const contentData = {
        title: req.body.title,
        description: req.body.description,
        type: req.body.type || 'video',
        price: req.body.price,
        creator: req.user._id,
        contentUrl: `/uploads/content/${req.files.file[0].filename}`,
        status: 'active',
        isPublic: true
    };

    // Adicionar thumbnail se foi enviada
    if (req.files.thumbnail) {
        contentData.thumbnail = `/uploads/thumbnails/${req.files.thumbnail[0].filename}`;
    }

    // Adicionar tags se foram enviadas
    if (req.body.tags) {
        try {
            contentData.tags = JSON.parse(req.body.tags);
        } catch (error) {
            console.error('Erro ao processar tags:', error);
            return next(new AppError('Formato inválido para tags', 400));
        }
    }

    console.log('Dados do conteúdo preparados:', contentData);

    // Criar o conteúdo
    const content = await Content.create(contentData);
    console.log('Conteúdo criado:', content._id);

    res.status(201).json({
        status: 'success',
        data: {
            content
        }
    });
});

// Atualizar conteúdo do creator
exports.updateContent = catchAsync(async (req, res, next) => {
    const content = await Content.findOneAndUpdate(
        {
            _id: req.params.id,
            creator: req.user.id
        },
        req.body,
        {
            new: true,
            runValidators: true
        }
    );

    if (!content) {
        return next(new AppError('Conteúdo não encontrado', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            content
        }
    });
});

// Excluir conteúdo do creator
exports.deleteContent = catchAsync(async (req, res, next) => {
    const content = await Content.findOne({
        _id: req.params.id,
        creator: req.user.id
    });

    if (!content) {
        return next(new AppError('Conteúdo não encontrado', 404));
    }

    // Excluir arquivos associados
    try {
        if (content.contentUrl) {
            await fs.unlink(path.join('public/uploads/content', content.contentUrl));
        }
        if (content.thumbnail) {
            await fs.unlink(path.join('public/uploads/thumbnails', content.thumbnail));
        }
    } catch (error) {
        console.error('Erro ao excluir arquivos:', error);
    }

    // Excluir o documento
    await content.deleteOne();

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Obter criadores recomendados
exports.getRecommendedCreators = catchAsync(async (req, res, next) => {
    // Buscar criadores com mais seguidores e conteúdo
    const creators = await User.aggregate([
        { $match: { role: 'creator' } },
        {
            $lookup: {
                from: 'follows',
                localField: '_id',
                foreignField: 'creator',
                as: 'followers'
            }
        },
        {
            $lookup: {
                from: 'contents',
                localField: '_id',
                foreignField: 'creator',
                as: 'contents'
            }
        },
        {
            $addFields: {
                followersCount: { $size: '$followers' },
                contentCount: { $size: '$contents' }
            }
        },
        {
            $project: {
                name: 1,
                username: 1,
                avatar: 1,
                bio: 1,
                followersCount: 1,
                contentCount: 1
            }
        },
        { $sort: { followersCount: -1, contentCount: -1 } },
        { $limit: 8 }
    ]);

    res.status(200).json({
        status: 'success',
        data: creators
    });
});

// Obter perfil público do criador
exports.getCreatorProfile = catchAsync(async (req, res, next) => {
    console.log('Buscando perfil do criador:', req.params.id);

    const creator = await User.findOne({ 
        _id: req.params.id,
        role: 'creator'
    }).select('name username avatar bio createdAt');

    if (!creator) {
        return next(new AppError('Criador não encontrado', 404));
    }

    // Buscar estatísticas do criador
    const [followersCount, contentCount] = await Promise.all([
        Follow.countDocuments({ creator: creator._id }),
        Content.countDocuments({ creator: creator._id, status: 'active' })
    ]);

    const creatorProfile = {
        ...creator.toObject(),
        followersCount,
        contentCount
    };

    console.log('Perfil encontrado:', creatorProfile);

    res.status(200).json({
        status: 'success',
        data: {
            creator: creatorProfile
        }
    });
});

// Obter conteúdo público do criador
exports.getCreatorPublicContent = catchAsync(async (req, res, next) => {
    console.log('Buscando conteúdo público do criador:', req.params.id);

    // Verificar se o criador existe
    const creator = await User.findOne({
        _id: req.params.id,
        role: 'creator'
    });

    if (!creator) {
        return next(new AppError('Criador não encontrado', 404));
    }

    // Buscar conteúdo público
    const content = await Content.find({
        creator: creator._id,
        status: 'active',
        isPublic: true
    })
    .select('title description thumbnail type price views createdAt tags')
    .sort('-createdAt');

    console.log('Conteúdo encontrado:', content.length, 'itens');

    res.status(200).json({
        status: 'success',
        data: {
            content
        }
    });
});

// Seguir um criador
exports.followCreator = catchAsync(async (req, res, next) => {
    const creator = await User.findOne({
        _id: req.params.id,
        role: 'creator'
    });

    if (!creator) {
        return next(new AppError('Criador não encontrado', 404));
    }

    // Verificar se já segue
    const existingFollow = await Follow.findOne({
        user: req.user.id,
        creator: creator._id
    });

    if (existingFollow) {
        return next(new AppError('Você já segue este criador', 400));
    }

    // Criar novo follow
    await Follow.create({
        user: req.user.id,
        creator: creator._id
    });

    res.status(200).json({
        status: 'success',
        message: 'Agora você está seguindo este criador'
    });
});

// Deixar de seguir um criador
exports.unfollowCreator = catchAsync(async (req, res, next) => {
    const result = await Follow.deleteOne({
        user: req.user.id,
        creator: req.params.id
    });

    if (result.deletedCount === 0) {
        return next(new AppError('Você não segue este criador', 400));
    }

    res.status(200).json({
        status: 'success',
        message: 'Você deixou de seguir este criador'
    });
});

// Atualizar badges do criador
exports.updateCreatorBadges = catchAsync(async (userId) => {
    const creator = await User.findById(userId).populate('content');
    const badges = await Badge.find();
  
    const earnedBadges = badges.filter(badge => {
        return (
            creator.subscribersCount >= (badge.criteria.minSubscribers || 0) &&
            creator.totalEarnings >= (badge.criteria.minEarnings || 0)
        );
    });
  
    creator.badges = earnedBadges.map(b => b._id);
    await creator.save();
});
