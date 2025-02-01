const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { auth, isModel, isAdmin } = require('../middlewares/auth');
const { uploadDocuments } = require('../middlewares/upload');

// Rotas para modelos
router.post('/submit', 
    auth, 
    isModel,
    uploadDocuments,
    verificationController.submitDocuments
);

router.get('/status', 
    auth, 
    isModel,
    verificationController.getVerificationStatus
);

// Rotas administrativas
router.get('/pending',
    auth,
    isAdmin,
    verificationController.listPendingVerifications
);

router.put('/:modelId/review',
    auth,
    isAdmin,
    verificationController.reviewVerification
);

module.exports = router;
