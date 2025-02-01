const express = require('express');
const { auth, isModel } = require('../middlewares/auth');
const { uploadSinglePhoto, uploadPhotos } = require('../middlewares/upload');
const {
    uploadPhoto,
    uploadMultiplePhotos,
    deletePhoto,
    setMainPhoto
} = require('../controllers/photoController');

const router = express.Router();

// Todas as rotas requerem autenticação e role de modelo
router.use(auth);
router.use(isModel);

router.post('/upload', uploadSinglePhoto, uploadPhoto);
router.post('/upload-multiple', uploadPhotos, uploadMultiplePhotos);
router.delete('/:photoId', deletePhoto);
router.put('/:photoId/main', setMainPhoto);

module.exports = router;
