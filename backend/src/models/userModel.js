const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Por favor, forneça um nome de usuário'],
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Por favor, forneça um email'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Por favor, forneça uma senha'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Por favor, confirme sua senha'],
        validate: {
            validator: function(el) {
                // Validar apenas quando a senha estiver sendo modificada
                return !this.isModified('password') || el === this.password;
            },
            message: 'As senhas não coincidem!'
        },
        // Não persistir no banco de dados
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'creator', 'admin'],
        default: 'user'
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    },
    avatar: String,
    bio: String,
    // Campos de fidelidade
    loyaltyPoints: {
        type: Number,
        default: 0,
        min: 0
    },
    loyaltyTier: {
        type: String,
        enum: ['bronze', 'prata', 'ouro'],
        default: 'bronze'
    },
    // Conexões sociais
    socialConnections: {
        twitter: {
            connected: { type: Boolean, default: false },
            username: String,
            token: String
        },
        instagram: {
            connected: { type: Boolean, default: false },
            username: String,
            token: String
        }
    },
    socialLinks: {
        twitter: String,
        instagram: String,
        youtube: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'users' // Forçar o uso da coleção existente
});

// Middleware para criptografar senha antes de salvar
userSchema.pre('save', async function(next) {
    // Só executa se a senha foi modificada
    if (!this.isModified('password')) return next();

    try {
        // Hash a senha com custo de 12
        this.password = await bcrypt.hash(this.password, 12);
        console.log('Senha criptografada com sucesso');

        // Remove passwordConfirm
        this.passwordConfirm = undefined;
        next();
    } catch (error) {
        console.error('Erro ao criptografar senha:', error);
        next(error);
    }
});

// Método para verificar senha
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    try {
        console.log('Verificando senha...');
        console.log('Senha fornecida:', candidatePassword ? 'Sim' : 'Não');
        console.log('Senha do usuário:', userPassword ? 'Sim' : 'Não');
        
        const isMatch = await bcrypt.compare(candidatePassword, userPassword);
        console.log('Senhas coincidem:', isMatch);
        
        return isMatch;
    } catch (error) {
        console.error('Erro ao verificar senha:', error);
        return false;
    }
};

// Método para verificar se a senha foi alterada após o token ser emitido
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
