const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Função para verificar se o texto contém palavras impróprias
function containsInappropriateContent(text) {
    // Lista de palavras impróprias (exemplo simples)
    const inappropriateWords = [
        'palavrão',
        'ofensa',
        // Adicione mais palavras conforme necessário
    ];

    const lowerText = text.toLowerCase();
    return inappropriateWords.some(word => lowerText.includes(word));
}

exports.moderateContent = catchAsync(async (req, res, next) => {
    const { text } = req.body;

    if (!text) {
        return next(new AppError('Texto para moderação não fornecido', 400));
    }

    const isInappropriate = containsInappropriateContent(text);

    res.status(200).json({
        status: 'success',
        data: {
            isApproved: !isInappropriate,
            message: isInappropriate ? 'Conteúdo impróprio detectado' : 'Conteúdo aprovado'
        }
    });
});
