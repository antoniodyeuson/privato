const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const authMiddleware = catchAsync(async (req, res, next) => {
    // 1) Pegar o token
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new AppError('Você não está logado. Por favor, faça login para ter acesso.', 401));
    }

    // 2) Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Verificar se usuário ainda existe
    const user = await User.findById(decoded.id);
    if (!user) {
        return next(new AppError('O usuário deste token não existe mais.', 401));
    }

    // 4) Verificar se usuário mudou a senha depois do token ser emitido
    if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('Usuário mudou a senha recentemente. Por favor, faça login novamente.', 401));
    }

    // Conceder acesso à rota protegida
    req.user = user;
    next();
});

module.exports = authMiddleware;
