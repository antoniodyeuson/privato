const express = require('express');
const router = express.Router();
const creatorController = require('../controllers/creatorController');
const contentController = require('../controllers/contentController');
const authController = require('../controllers/authController');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const AppError = require('../utils/appError');

// Criar diretório temporário se não existir
const tempDir = path.join(__dirname, '../../temp/uploads');
fs.mkdir(tempDir, { recursive: true }).catch(console.error);

// Configuração do Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new AppError('Tipo de arquivo não suportado. Envie apenas imagens ou vídeos.', 400), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
    }
});

// Proteger todas as rotas
router.use(authController.protect);

// Rotas do perfil do criador
router.get('/me', creatorController.getMe);
router.get('/statistics', creatorController.getStats);

// Rotas de conteúdo
router.route('/content')
    .get(creatorController.getContent)
    .post(upload.single('file'), contentController.createContent);

// Rotas de conteúdo específico
router.route('/content/:id')
    .get(creatorController.getCreatorContent)
    .patch(upload.single('file'), contentController.updateContent)
    .delete(contentController.deleteContent);

module.exports = router;
