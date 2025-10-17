const express = require('express');
const router = express.Router();
 AssessmentController = require('../controllers/AssessmentController');
const { verifyToken } = require('../middleware/authMiddleware');

// جلب أسئلة اختبار معين (لا يحتاج auth)
router.get('/:assessmentName/questions', AssessmentController.getQuestions);

// إرسال إجابات المستخدم (يحتاج توكن)
router.post('/submit', verifyToken, AssessmentController.submitAnswers);

// عرض آخر نتيجة لاختبار معين (يحتاج توكن)
router.get('/:assessmentName/result', verifyToken, AssessmentController.getLastResult);

module.exports = router;
