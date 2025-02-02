const express = require('express');
const contentController = require('../controllers/contentController');
const authController = require('../controllers/authController');
const { protect } = require('../controllers/authController');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const AppError = require('../utils/appError');
const auth = require('../middleware/auth');

const router = express.Router();

// Criar diretório temporário se não existir
const tempDir = path.join(__dirname, '../../temp/uploads');
fs.mkdir(tempDir, { recursive: true }).catch(console.error);

// Configuração do Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempDir); // Usar caminho absoluto
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Aceitar apenas imagens e vídeos
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
        fileSize: 100 * 1024 * 1024 // 100MB limite
    }
});

// Proteger todas as rotas
router.use(authController.protect);

// Rotas para visualização de conteúdo (usuários autenticados)
router.get('/recommended', contentController.getRecommendedContent);
router.get('/creator/:creatorId', contentController.getCreatorContent);
router.get('/:id', contentController.getContentById);
router.post('/:id/view', contentController.recordContentView);

// Rotas para criadores
router.get('/creator', contentController.getCreatorContent);
router.get('/:id', contentController.getContent);

router.post('/',
    authController.restrictTo('creator'),
    upload.single('file'),
    contentController.createContent
);

router.patch('/:id',
    authController.restrictTo('creator'),
    upload.single('file'),
    contentController.updateContent
);

router.delete('/:id',
    authController.restrictTo('creator'),
    contentController.deleteContent
);

module.exports = router;
