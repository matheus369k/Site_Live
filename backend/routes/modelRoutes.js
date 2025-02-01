const express = require('express');
const multer = require('multer');
const { auth, isModel, isVerifiedModel } = require('../middlewares/auth');
const {
    updateProfile,
    uploadPhotos,
    deletePhoto,
    setPrimaryPhoto,
    getModels,
    getModel
} = require('../controllers/modelController');

const router = express.Router();

// Configuração do multer para upload de imagens
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 10 // máximo de 10 arquivos por vez
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas'));
        }
    }
});

// Rotas públicas
router.get('/', getModels);
router.get('/:id', getModel);

// Rotas privadas (apenas modelos)
router.use(auth);
router.use(isModel);

// Rotas de perfil
router.post('/profile', updateProfile);

// Rotas de fotos
router.post('/photos', upload.array('photos', 10), uploadPhotos);
router.delete('/photos/:photoId', deletePhoto);
router.put('/photos/:photoId/primary', setPrimaryPhoto);

module.exports = router;
