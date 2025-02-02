const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const Subscription = require('../models/subscriptionModel');
const Content = require('../models/contentModel');
const ViewHistory = require('../models/viewHistoryModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Gerar Token JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Criar e enviar token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove senha do output
  user.password = undefined;

  console.log('Enviando resposta com token:', {
    token: token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });

  res.status(statusCode).json({
    status: 'success',
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
};

// Obter perfil do usuário logado
exports.getProfile = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return next(new AppError('Usuário não encontrado', 404));
    }

    res.status(200).json({
        status: 'success',
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }
    });
});

// Obter perfil do usuário atual
exports.getMe = catchAsync(async (req, res, next) => {
    try {
        // Verificar se o usuário está autenticado
        if (!req.user) {
            return next(new AppError('Usuário não autenticado', 401));
        }

        // Buscar usuário com dados atualizados
        const user = await User.findById(req.user._id).select('+role');
        
        if (!user) {
            return next(new AppError('Usuário não encontrado', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            }
        });
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        next(new AppError('Erro ao buscar dados do usuário', 500));
    }
});

// Obter assinaturas do usuário
exports.getUserSubscriptions = catchAsync(async (req, res, next) => {
    const subscriptions = await Subscription.find({ 
        subscriber: req.user.id,
        status: 'active'
    }).populate('creator', 'username');

    res.status(200).json({
        status: 'success',
        data: {
            subscriptions: subscriptions.map(sub => ({
                id: sub._id,
                creator: {
                    id: sub.creator._id,
                    username: sub.creator.username
                },
                plan: sub.plan,
                startDate: sub.startDate,
                endDate: sub.endDate,
                status: sub.status
            }))
        }
    });
});

// Atualizar perfil do usuário
exports.updateProfile = catchAsync(async (req, res, next) => {
    // Não permitir atualização de senha aqui
    if (req.body.password) {
        return next(new AppError('Esta rota não é para atualização de senha. Use /updatePassword.', 400));
    }

    // Filtrar campos permitidos
    const filteredBody = filterObj(req.body, 'username', 'email');

    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            user: {
                id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role
            }
        }
    });
});

// Função auxiliar para filtrar campos do objeto
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

// Obter favoritos do usuário
exports.getFavorites = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id)
        .populate({
            path: 'favorites',
            populate: {
                path: 'creator',
                select: 'username'
            }
        });

    if (!user) {
        return next(new AppError('Usuário não encontrado', 404));
    }

    res.status(200).json({
        status: 'success',
        favorites: user.favorites || []
    });
});

// Adicionar conteúdo aos favoritos
exports.addToFavorites = catchAsync(async (req, res, next) => {
    const content = await Content.findById(req.params.contentId);
    
    if (!content) {
        return next(new AppError('Conteúdo não encontrado', 404));
    }

    const user = await User.findByIdAndUpdate(
        req.user.id,
        { $addToSet: { favorites: content._id } },
        { new: true }
    );

    res.status(200).json({
        status: 'success',
        message: 'Conteúdo adicionado aos favoritos'
    });
});

// Remover conteúdo dos favoritos
exports.removeFromFavorites = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(
        req.user.id,
        { $pull: { favorites: req.params.contentId } },
        { new: true }
    );

    res.status(200).json({
        status: 'success',
        message: 'Conteúdo removido dos favoritos'
    });
});

// Obter histórico de visualizações
exports.getViewHistory = catchAsync(async (req, res, next) => {
    const history = await ViewHistory.find({ user: req.user.id })
        .populate({
            path: 'content',
            populate: {
                path: 'creator',
                select: 'username'
            }
        })
        .sort('-viewedAt')
        .limit(20);

    res.status(200).json({
        status: 'success',
        history
    });
});

// Remover item do histórico
exports.removeFromHistory = catchAsync(async (req, res, next) => {
    await ViewHistory.findOneAndDelete({
        user: req.user.id,
        content: req.params.contentId
    });

    res.status(200).json({
        status: 'success',
        message: 'Item removido do histórico'
    });
});

// Limpar histórico
exports.clearHistory = catchAsync(async (req, res, next) => {
    await ViewHistory.deleteMany({ user: req.user.id });

    res.status(200).json({
        status: 'success',
        message: 'Histórico limpo com sucesso'
    });
});

exports.signup = async (req, res) => {
  try {
    console.log('Dados recebidos no signup:', req.body);
    
    // Garantir que o role seja válido
    const role = req.body.role === 'creator' ? 'creator' : 'user';
    
    const newUser = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      role: role
    });

    console.log('Novo usuário criado:', {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    });

    createSendToken(newUser, 201, res);
  } catch (err) {
    console.error('Erro no signup:', err);
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar se email e senha existem
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Por favor, forneça email e senha'
      });
    }

    // Verificar se usuário existe e senha está correta
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Email ou senha incorretos'
      });
    }

    // Se tudo estiver ok, enviar token
    createSendToken(user, 200, res);
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message
    });
  }
};

exports.updateMe = catchAsync(async (req, res, next) => {
    try {
        // 1) Criar erro se usuário tentar atualizar senha
        if (req.body.password || req.body.passwordConfirm) {
            return next(new AppError('Esta rota não é para atualização de senha. Use /update-password.', 400));
        }

        // 2) Filtrar campos não permitidos
        const filteredBody = filterObj(req.body, 'username', 'email');

        // 3) Atualizar documento do usuário
        const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            data: {
                user: updatedUser
            }
        });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        next(new AppError('Erro ao atualizar dados do usuário', 500));
    }
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user.id, { active: false });

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        console.error('Erro ao desativar usuário:', error);
        next(new AppError('Erro ao desativar conta', 500));
    }
});
