const express = require('express');
const router = express.Router();
const moodController = require('../controllers/moodController');
const { verifyToken } = require('../middleware/authMiddleware');

// 🟢 إضافة مزاج (باستخدام التوكن)
router.post('/add', verifyToken, moodController.createMoodEntry);

// 🟡 جلب جميع المزاجات لمستخدم محدد
router.get('/user/:user_id', moodController.getMoodEntriesByUser);

// 🔵 حذف مزاج (تأكد أنه المستخدم صاحب التوكن هو صاحب الإدخال)
router.delete('/:mood_id', verifyToken, moodController.deleteMoodEntry);

module.exports = router;
