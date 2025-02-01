const express = require('express');
const { auth, isAdmin } = require('../middlewares/auth');
const {
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    updateProfile
} = require('../controllers/userController');

const router = express.Router();

// Rotas protegidas por admin
router.use(auth);
router.get('/', isAdmin, getUsers);
router.get('/:id', isAdmin, getUser);
router.put('/:id', isAdmin, updateUser);
router.delete('/:id', isAdmin, deleteUser);

// Rota para usuário atualizar próprio perfil
router.put('/profile/me', updateProfile);

module.exports = router;
