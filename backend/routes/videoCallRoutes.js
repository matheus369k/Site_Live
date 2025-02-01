const express = require('express');
const { auth, isClient } = require('../middlewares/auth');
const {
    scheduleCall,
    joinCall,
    endCall,
    rateCall,
    getUpcomingCalls,
    getCallHistory
} = require('../controllers/videoCallController');

const router = express.Router();

// Todas as rotas são privadas
router.use(auth);

// Rotas para clientes e modelos
router.get('/upcoming', getUpcomingCalls);
router.get('/history', getCallHistory);
router.get('/:id/join', joinCall);
router.post('/:id/end', endCall);

// Rotas apenas para clientes
router.post('/schedule', isClient, scheduleCall);
router.post('/:id/rate', isClient, rateCall);

module.exports = router;
