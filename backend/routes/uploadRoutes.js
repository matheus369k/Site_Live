const express = require('express');
const multer = require('multer');
const { auth, isModel } = require('../middlewares/auth');
const {
    uploadProfilePhoto,
    uploadGalleryPhotos,
    deletePhoto,
    setPrimaryPhoto
} = require('../controllers/uploadController');

const router = express.Router();

// Configuração do Multer para armazenar em memória
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 5 // máximo de 5 arquivos por vez
    },
    fileFilter: (req, file, cb) => {
        // Aceita apenas imagens
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas'));
        }
    }
});

// Rotas protegidas
router.use(auth);

// Upload de foto de perfil (único arquivo)
router.post('/profile', upload.single('photo'), uploadProfilePhoto);

// Upload de fotos para galeria (múltiplos arquivos, apenas modelos)
router.post('/gallery', isModel, upload.array('photos', 5), uploadGalleryPhotos);

// Deletar foto
router.delete('/photo/:photoId', deletePhoto);

// Definir foto como principal
router.put('/photo/:photoId/primary', setPrimaryPhoto);

module.exports = router;
