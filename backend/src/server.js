const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '..', '.env') });

process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});

// Importar app.js configurado
const app = require('./app');

// Conexão com o MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('DB connection successful!');
    })
    .catch(err => {
        console.error('DB connection error:', err);
        process.exit(1);
    });

// Iniciar servidor
const port = process.env.PORT || 3000;

function startServer(retries = 5) {
    const server = app.listen(port, () => {
        console.log(`Servidor rodando na porta ${port}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE' && retries > 0) {
            console.log(`Port ${port} is busy, trying again in 1 second...`);
            setTimeout(() => {
                server.close();
                startServer(retries - 1);
            }, 1000);
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });

    process.on('unhandledRejection', err => {
        console.log('UNHANDLED REJECTION! Shutting down...');
        console.log(err.name, err.message);
        server.close(() => {
            process.exit(1);
        });
    });
}

startServer();
