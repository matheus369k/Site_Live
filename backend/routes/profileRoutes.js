const express = require('express');
const { auth, isModel } = require('../middlewares/auth');
const {
    getModelProfile,
    updateModelProfile,
    updateAvailability,
    updatePricing,
    updateServices,
    updateUserProfile
} = require('../controllers/profileController');

const router = express.Router();

// Rotas públicas
router.get('/model/:id', getModelProfile);

// Rotas protegidas para todos os usuários
router.use(auth);
router.put('/user', updateUserProfile);

// Rotas protegidas apenas para modelos
router.use(isModel);
router.put('/model', updateModelProfile);
router.put('/model/availability', updateAvailability);
router.put('/model/pricing', updatePricing);
router.put('/model/services', updateServices);

module.exports = router;
