const multer = require('multer');
const path = require('path');

// Configuração do armazenamento local
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, fileName);
    }
});

// Função para filtrar tipos de arquivo
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo não permitido'));
    }
};

// Configuração do multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// Middleware para upload de documentos
const uploadDocuments = upload.fields([
    { name: 'identityDocument', maxCount: 1 },
    { name: 'addressDocument', maxCount: 1 }
]);

// Middleware para upload de fotos
const uploadPhotos = upload.array('photos', 5);

// Middleware para upload de foto única
const uploadSinglePhoto = upload.single('photo');

module.exports = {
    uploadDocuments,
    uploadPhotos,
    uploadSinglePhoto
};
