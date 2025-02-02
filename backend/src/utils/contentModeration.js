const axios = require('axios');
const AppError = require('./appError');

exports.moderateContent = async (content) => {
    // Em desenvolvimento, apenas simular a moderação
    if (process.env.NODE_ENV === 'development') {
        console.log('Moderação de conteúdo em modo de desenvolvimento');
        console.log('Conteúdo a ser moderado:', content);
        
        return {
            isApproved: true,
            confidence: 1,
            categories: [],
            message: 'Aprovado (modo de desenvolvimento)'
        };
    }

    try {
        const response = await axios.post('https://api.moderatecontent.com/moderate', {
            text: content,
            key: process.env.MODERATE_CONTENT_API_KEY
        });

        if (response.data.error) {
            throw new AppError('Erro na moderação de conteúdo', 500);
        }

        return {
            isApproved: response.data.results.isAppropriate,
            confidence: response.data.results.confidence,
            categories: response.data.results.categories,
            message: response.data.results.message
        };
    } catch (error) {
        console.error('Erro na moderação:', error);
        // Em caso de erro na API, aprovar em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
            return {
                isApproved: true,
                confidence: 1,
                categories: [],
                message: 'Aprovado (erro na API em desenvolvimento)'
            };
        }
        throw new AppError('Erro ao moderar conteúdo: ' + error.message, 500);
    }
};

exports.checkContent = async (req, res, next) => {
    try {
        const { text } = req.body;
        const result = await exports.moderateContent(text);

        if (!result.isApproved) {
            return next(new AppError('Conteúdo impróprio detectado', 400));
        }

        req.moderationResult = result;
        next();
    } catch (error) {
        next(error);
    }
};
