const mongoose = require('mongoose');
const User = require('../models/userModel');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config({ path: '.env' });

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Conectado ao MongoDB'))
    .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

async function createTestCreator() {
    try {
        // Verificar se o usuário já existe
        let creator = await User.findOne({ email: 'creator@example.com' });
        
        if (!creator) {
            // Criar usuário criador
            creator = await User.create({
                username: 'testcreator',
                email: 'creator@example.com',
                password: 'password123',
                passwordConfirm: 'password123',
                role: 'creator',
                name: 'Test Creator',
                active: true
            });
            console.log('Criador criado com sucesso:', creator);
        } else {
            console.log('Criador já existe:', creator);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Erro ao criar criador:', error);
        process.exit(1);
    }
}

createTestCreator();
