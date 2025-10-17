const express = require('express');
const router = express.Router();
const { evaluateMood } = require('../controllers/aiController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/evaluate', verifyToken, evaluateMood);

module.exports = router;
