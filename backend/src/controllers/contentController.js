const Content = require('../models/contentModel');
const User = require('../models/userModel');
const Purchase = require('../models/purchaseModel');
const ViewHistory = require('../models/viewHistoryModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const path = require('path');
const fs = require('fs').promises;
const { updateLoyaltyPoints } = require('./loyaltyController');

// Função para criar diretório de uploads se não existir
async function ensureUploadDirectory() {
    const uploadDir = path.join(__dirname, '../../public/uploads');
    const tempDir = path.join(__dirname, '../../temp/uploads');
    
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.mkdir(tempDir, { recursive: true });
    
    return uploadDir;
}

// Função para fazer upload de arquivo
const uploadToLocal = async (file) => {
    try {
        console.log('Iniciando upload do arquivo:', file.originalname);
        
        const uploadDir = await ensureUploadDirectory();
        
        // Gerar nome único para o arquivo
        const ext = path.extname(file.originalname);
        const filename = `${Date.now()}-${Math.floor(Math.random() * 1000000000)}${ext}`;
        const filepath = path.join(uploadDir, filename);
        
        console.log('Salvando arquivo em:', filepath);
        
        // Salvar arquivo
        await fs.rename(file.path, filepath);
        
        const relativePath = `/uploads/${filename}`;
        console.log('Arquivo salvo com sucesso. Caminho relativo:', relativePath);
        
        return relativePath;
    } catch (error) {
        console.error('Erro ao fazer upload do arquivo:', error);
        throw new AppError('Erro ao fazer upload do arquivo. Por favor, tente novamente.', 500);
    }
};

// Obter todo o conteúdo
exports.getAllContent = catchAsync(async (req, res, next) => {
    const content = await Content.find({ status: 'published' })
        .populate('creator', 'username name avatar')
        .sort('-createdAt');

    res.status(200).json({
        status: 'success',
        results: content.length,
        data: { content }
    });
});

// Obter conteúdo por ID
exports.getContentById = catchAsync(async (req, res, next) => {
    const contentId = req.params.id;
    const userId = req.user.id;

    // Verificar se o usuário comprou o conteúdo
    const purchase = await Purchase.findOne({
        user: userId,
        content: contentId,
        status: 'completed'
    });

    if (!purchase) {
        return next(new AppError('Você precisa comprar este conteúdo primeiro', 403));
    }

    const content = await Content.findById(contentId)
        .populate('creator', 'username name avatar');
        
    if (!content) {
        return next(new AppError('Conteúdo não encontrado', 404));
    }

    res.status(200).json({
        status: 'success',
        data: { content }
    });
});

// Criar novo conteúdo
exports.createContent = catchAsync(async (req, res, next) => {
    try {
        console.log('Iniciando criação de conteúdo');
        console.log('Dados recebidos:', req.body);
        console.log('Arquivo recebido:', req.file);
        console.log('Usuário:', req.user);

        // Verificar campos obrigatórios
        if (!req.body.title || !req.body.description || !req.body.price) {
            return next(new AppError('Por favor, forneça todos os campos obrigatórios (título, descrição e preço)', 400));
        }

        // Validar preço
        const price = parseFloat(req.body.price);
        if (isNaN(price) || price < 0) {
            return next(new AppError('O preço deve ser um número válido e não pode ser negativo', 400));
        }

        // Verificar se há arquivo
        if (!req.file) {
            return next(new AppError('Por favor, forneça um arquivo', 400));
        }

        // Verificar tamanho do arquivo (máximo 100MB)
        const maxSize = 100 * 1024 * 1024; // 100MB em bytes
        if (req.file.size > maxSize) {
            return next(new AppError('O arquivo é muito grande. O tamanho máximo permitido é 100MB', 400));
        }

        // Verificar extensão do arquivo
        const ext = path.extname(req.file.originalname).toLowerCase();
        const allowedImageExts = ['.jpg', '.jpeg', '.png', '.gif'];
        const allowedVideoExts = ['.mp4', '.webm'];

        if (!allowedImageExts.includes(ext) && !allowedVideoExts.includes(ext)) {
            return next(new AppError('Formato de arquivo não suportado. Use jpg, jpeg, png, gif para imagens ou mp4, webm para vídeos.', 400));
        }

        // Determinar o tipo de conteúdo baseado na extensão
        const type = allowedVideoExts.includes(ext) ? 'video' : 'image';
        console.log('Tipo de conteúdo determinado:', type);

        // Garantir que o diretório de uploads existe
        const uploadDir = await ensureUploadDirectory();

        // Gerar nome único para o arquivo
        const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000000)}${ext}`;
        const filePath = path.join(uploadDir, fileName);
        
        console.log('Movendo arquivo para:', filePath);
        
        try {
            // Mover arquivo do temp para uploads
            await fs.copyFile(req.file.path, filePath);
            await fs.unlink(req.file.path); // Remover arquivo temporário
        } catch (error) {
            console.error('Erro ao mover arquivo:', error);
            return next(new AppError('Erro ao processar o arquivo. Por favor, tente novamente.', 500));
        }

        // Processar tags
        let tags = [];
        if (req.body.tags) {
            try {
                tags = JSON.parse(req.body.tags);
                if (!Array.isArray(tags)) {
                    tags = [];
                }
            } catch (error) {
                console.error('Erro ao processar tags:', error);
                tags = [];
            }
        }

        // Criar o conteúdo
        const contentData = {
            title: req.body.title.trim(),
            description: req.body.description.trim(),
            price: price,
            file: `/uploads/${fileName}`,
            type,
            status: 'published',
            tags
        };

        // Adicionar creator apenas se houver um usuário autenticado
        if (req.user && req.user.id) {
            contentData.creator = req.user.id;
        }

        // Criar o conteúdo sem validar o modelo de usuário
        const content = await Content.create(contentData);

        // Adicionar pontos de fidelidade por criar conteúdo
        if (req.user && req.user.id) {
            try {
                await updateLoyaltyPoints(req.user.id, 50);
            } catch (error) {
                console.error('Erro ao atualizar pontos de fidelidade:', error);
                // Não impede a criação do conteúdo se houver erro nos pontos
            }
        }

        console.log('Conteúdo criado com sucesso:', content);

        res.status(201).json({
            status: 'success',
            data: { content }
        });
    } catch (error) {
        console.error('Erro ao criar conteúdo:', error);
        // Limpar arquivo temporário em caso de erro
        if (req.file && req.file.path) {
            try {
                await fs.unlink(req.file.path);
            } catch (cleanupError) {
                console.error('Erro ao limpar arquivo temporário:', cleanupError);
            }
        }
        
        // Verificar se é um erro de validação do Mongoose
        if (error.name === 'ValidationError') {
            return next(new AppError('Erro de validação: ' + Object.values(error.errors).map(err => err.message).join(', '), 400));
        }
        
        next(error);
    }
});

// Registrar visualização de conteúdo
exports.recordContentView = catchAsync(async (req, res, next) => {
    const contentId = req.params.id;
    const userId = req.user.id;

    // Verificar se o usuário comprou o conteúdo
    const purchase = await Purchase.findOne({
        user: userId,
        content: contentId,
        status: 'completed'
    });

    if (!purchase) {
        return next(new AppError('Você precisa comprar este conteúdo primeiro', 403));
    }

    // Adicionar à lista de visualizações do usuário e incrementar contador
    await Promise.all([
        ViewHistory.create({
            user: userId,
            content: contentId,
            viewedAt: Date.now()
        }),
        Content.findByIdAndUpdate(contentId, {
            $inc: { views: 1 }
        })
    ]);

    res.status(200).json({
        status: 'success',
        message: 'Visualização registrada com sucesso'
    });
});

// Obter conteúdo recomendado
exports.getRecommendedContent = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    
    // Buscar conteúdos que o usuário ainda não comprou
    const purchases = await Purchase.find({ 
        user: userId, 
        status: 'completed' 
    }).select('content');

    const purchasedContentIds = purchases.map(p => p.content);
    
    const content = await Content.find({
        _id: { $nin: purchasedContentIds },
        status: 'published',
        isPublic: true
    })
    .populate('creator', 'username name avatar')
    .sort('-createdAt')
    .limit(6);

    res.status(200).json({
        status: 'success',
        data: { content }
    });
});

// Obter conteúdo do criador
exports.getCreatorContent = catchAsync(async (req, res, next) => {
    const contents = await Content.find({ creator: req.user.id })
        .sort('-createdAt')
        .select('title description type price createdAt views status');

    res.status(200).json({
        status: 'success',
        results: contents.length,
        data: {
            contents
        }
    });
});

// Obter conteúdo único
exports.getContent = catchAsync(async (req, res, next) => {
    const content = await Content.findById(req.params.id);

    if (!content) {
        return next(new AppError('Nenhum conteúdo encontrado com esse ID', 404));
    }

    // Verificar se o usuário é o criador do conteúdo
    if (content.creator.toString() !== req.user.id) {
        return next(new AppError('Você não tem permissão para ver este conteúdo', 403));
    }

    res.status(200).json({
        status: 'success',
        data: {
            content
        }
    });
});

// Atualizar conteúdo
exports.updateContent = catchAsync(async (req, res, next) => {
    const contentId = req.params.id;
    const userId = req.user.id;

    // Verificar se o conteúdo existe e pertence ao criador
    const content = await Content.findOne({ 
        _id: contentId,
        creator: userId
    });

    if (!content) {
        return next(new AppError('Conteúdo não encontrado ou você não tem permissão para editá-lo', 404));
    }

    // Se houver novo arquivo, fazer upload
    if (req.file) {
        // Remover arquivo antigo se existir
        if (content.file) {
            const oldPath = path.join(__dirname, '../../public', content.file);
            try {
                await fs.unlink(oldPath);
            } catch (err) {
                console.error('Erro ao remover arquivo antigo:', err);
            }
        }

        // Upload do novo arquivo
        const fileExt = path.extname(req.file.originalname);
        const fileName = `${req.user.id}_${Date.now()}${fileExt}`;
        const filePath = path.join(__dirname, '../../public/uploads', fileName);
        
        // Criar diretório de uploads se não existir
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        
        // Mover arquivo do temp para uploads
        await fs.copyFile(req.file.path, filePath);
        await fs.unlink(req.file.path); // Remover arquivo temporário

        // Atualizar tipo se necessário
        const ext = path.extname(req.file.originalname).toLowerCase();
        if (['.mp4', '.webm'].includes(ext)) {
            req.body.type = 'video';
        } else {
            req.body.type = 'image';
        }

        req.body.file = `/uploads/${fileName}`; // Caminho relativo para o frontend
    }

    // Atualizar conteúdo
    const updatedContent = await Content.findByIdAndUpdate(
        contentId,
        req.body,
        { new: true, runValidators: true }
    ).populate('creator', 'username name avatar');

    res.status(200).json({
        status: 'success',
        data: { content: updatedContent }
    });
});

// Excluir conteúdo
exports.deleteContent = catchAsync(async (req, res, next) => {
    const contentId = req.params.id;
    const userId = req.user.id;

    // Verificar se o conteúdo existe e pertence ao criador
    const content = await Content.findOne({ 
        _id: contentId,
        creator: userId
    });

    if (!content) {
        return next(new AppError('Conteúdo não encontrado ou você não tem permissão para excluí-lo', 404));
    }

    // Remover arquivo se existir
    if (content.file) {
        const filePath = path.join(__dirname, '../../public', content.file);
        try {
            await fs.unlink(filePath);
        } catch (err) {
            console.error('Erro ao remover arquivo:', err);
        }
    }

    // Marcar como inativo em vez de excluir
    await Content.findByIdAndUpdate(contentId, { status: 'inactive' });

    res.status(204).json({
        status: 'success',
        data: null
    });
});
