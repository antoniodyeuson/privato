const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    // Remover senha da saída
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    try {
        console.log('Dados do registro:', req.body);
        
        const newUser = await User.create({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            passwordConfirm: req.body.passwordConfirm,
            role: req.body.role || 'user'
        });

        console.log('Usuário criado:', {
            id: newUser._id,
            email: newUser.email,
            role: newUser.role
        });

        createSendToken(newUser, 201, res);
    } catch (error) {
        console.error('Erro no cadastro:', error);
        next(new AppError('Erro ao criar usuário: ' + error.message, 400));
    }
});

exports.login = catchAsync(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        console.log('Tentativa de login:', { email });

        // 1) Verificar se email e senha existem
        if (!email || !password) {
            console.log('Email ou senha não fornecidos');
            return next(new AppError('Por favor, forneça email e senha', 400));
        }

        // 2) Verificar se usuário existe e senha está correta
        const user = await User.findOne({ email }).select('+password +active');
        console.log('Usuário encontrado:', user ? {
            id: user._id,
            email: user.email,
            role: user.role,
            active: user.active
        } : 'Não');

        if (!user || !user.active) {
            console.log('Usuário não encontrado ou inativo');
            return next(new AppError('Email ou senha incorretos', 401));
        }

        // 3) Verificar se a senha está correta
        let isPasswordCorrect = false;
        try {
            isPasswordCorrect = await bcrypt.compare(password, user.password);
            console.log('Senha correta:', isPasswordCorrect);
        } catch (error) {
            console.error('Erro ao verificar senha:', error);
            return next(new AppError('Erro ao verificar senha', 500));
        }

        if (!isPasswordCorrect) {
            console.log('Senha incorreta');
            return next(new AppError('Email ou senha incorretos', 401));
        }

        // 4) Se tudo estiver ok, enviar token
        console.log('Login bem-sucedido para:', {
            id: user._id,
            email: user.email,
            role: user.role
        });

        createSendToken(user, 200, res);
    } catch (error) {
        console.error('Erro no login:', error);
        next(new AppError('Erro ao fazer login: ' + error.message, 500));
    }
});

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
    try {
        // 1) Verificar token
        let token;
        if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
            console.log('Token encontrado no header:', token);
        } else if (req.cookies.jwt) {
            token = req.cookies.jwt;
            console.log('Token encontrado no cookie:', token);
        }

        if (!token) {
            return next(new AppError('Por favor, faça login para acessar', 401));
        }

        // 2) Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decodificado:', decoded);

        // 3) Verificar se usuário existe
        const user = await User.findById(decoded.id).select('+role +active');
        if (!user || !user.active) {
            return next(new AppError('O usuário não existe mais ou está inativo', 401));
        }

        // 4) Verificar se mudou a senha após o token
        if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat)) {
            return next(new AppError('Usuário mudou a senha recentemente. Por favor, faça login novamente', 401));
        }

        // Conceder acesso
        req.user = user;
        next();
    } catch (error) {
        console.error('Erro na autenticação:', error);
        next(new AppError('Erro na autenticação: ' + error.message, 401));
    }
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('Você não tem permissão para realizar esta ação', 403));
        }
        next();
    };
};

exports.getMe = catchAsync(async (req, res, next) => {
    // O usuário já está disponível em req.user do middleware protect
    if (!req.user) {
        return next(new AppError('Por favor, faça login para acessar seus dados.', 401));
    }

    res.status(200).json({
        status: 'success',
        data: {
            user: req.user
        }
    });
});
