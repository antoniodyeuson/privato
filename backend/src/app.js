const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs').promises;
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const creatorRoutes = require('./routes/creatorRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const contentRoutes = require('./routes/contentRoutes');
const socialRoutes = require('./routes/socialRoutes');

const app = express();

// Criar diretórios necessários
async function createRequiredDirectories() {
    const dirs = [
        path.join(__dirname, '../public'),
        path.join(__dirname, '../public/uploads'),
        path.join(__dirname, '../public/uploads/thumbnails'),
        path.join(__dirname, '../temp'),
        path.join(__dirname, '../temp/uploads')
    ];

    for (const dir of dirs) {
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (error) {
            console.error(`Erro ao criar diretório ${dir}:`, error);
        }
    }
}

// Criar diretórios ao iniciar
createRequiredDirectories();

// Middleware
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:5173'],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Servir arquivos estáticos
app.use('/api/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/public', express.static(path.join(__dirname, '../public')));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/creators', creatorRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/social', socialRoutes);

// Rota 404 para URLs não encontradas
app.all('*', (req, res, next) => {
    next(new AppError(`Não foi possível encontrar ${req.originalUrl} neste servidor!`, 404));
});

// Tratamento global de erros
app.use(globalErrorHandler);

module.exports = app;
