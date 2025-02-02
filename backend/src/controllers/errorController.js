const AppError = require('../utils/appError');

const handleCastErrorDB = err => new AppError(`Valor inválido: ${err.path}: ${err.value}`, 400);
const handleDuplicateFieldsDB = err => new AppError(`Valor duplicado: ${Object.keys(err.keyValue)} = ${Object.values(err.keyValue)}`, 400);
const handleValidationErrorDB = err => new AppError(`Dados inválidos: ${Object.values(err.errors).map(e => e.message).join('. ')}`, 400);
const handleJWTError = () => new AppError('Token inválido! Faça login novamente.', 401);
const handleJWTExpiredError = () => new AppError('Token expirado! Faça login novamente.', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    console.error('ERRO:', err);
    res.status(500).json({
      status: 'error',
      message: 'Algo deu errado!'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
