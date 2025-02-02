const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const AppError = require('./appError');

// Gerar miniatura para imagem
async function generateImageThumbnail(inputPath, outputPath) {
    try {
        await sharp(inputPath)
            .resize(320, 180, {
                fit: 'cover',
                position: 'center'
            })
            .toFile(outputPath);
        return outputPath;
    } catch (error) {
        throw new AppError('Erro ao gerar miniatura da imagem', 500);
    }
}

// Gerar miniatura padrão para vídeo
async function generateDefaultVideoThumbnail(outputPath) {
    try {
        // Criar uma miniatura padrão para vídeos
        await sharp({
            create: {
                width: 320,
                height: 180,
                channels: 4,
                background: { r: 35, g: 35, b: 35, alpha: 1 }
            }
        })
        .composite([
            {
                input: Buffer.from(
                    `<svg width="320" height="180">
                        <rect width="320" height="180" fill="#232323"/>
                        <text x="160" y="90" text-anchor="middle" dy=".3em" 
                              fill="#ffffff" font-family="Arial" font-size="40">▶</text>
                    </svg>`
                ),
                top: 0,
                left: 0,
            },
        ])
        .toFile(outputPath);
        return outputPath;
    } catch (error) {
        throw new AppError('Erro ao gerar miniatura padrão para vídeo', 500);
    }
}

// Função principal para gerar miniatura
async function generateThumbnail(file, userId) {
    try {
        const ext = path.extname(file.originalname).toLowerCase();
        const thumbnailDir = path.join(__dirname, '../../public/uploads/thumbnails');
        const thumbnailName = `${userId}_${Date.now()}_thumb${ext === '.mp4' ? '.jpg' : ext}`;
        const thumbnailPath = path.join(thumbnailDir, thumbnailName);
        
        // Criar diretório de miniaturas se não existir
        await fs.mkdir(thumbnailDir, { recursive: true });

        // Gerar miniatura baseado no tipo de arquivo
        if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
            return await generateImageThumbnail(file.path, thumbnailPath);
        } else if (ext === '.mp4') {
            return await generateDefaultVideoThumbnail(thumbnailPath);
        } else {
            throw new AppError('Tipo de arquivo não suportado para geração de miniatura', 400);
        }
    } catch (error) {
        throw new AppError(error.message || 'Erro ao gerar miniatura', 500);
    }
}

module.exports = generateThumbnail;
