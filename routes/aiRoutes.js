const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// تحليل الحالة النفسية باستخدام الذكاء الاصطناعي
router.post('/evaluate', aiController.evaluateMoodAI);
//router.get('/test', (req, res) => res.send('AI route works!'));

module.exports = router;
