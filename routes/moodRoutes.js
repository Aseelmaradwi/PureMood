const express = require('express');
const router = express.Router();
const moodController = require('../controllers/moodController');

// 🟢 إنشاء إدخال جديد
router.post('/add', moodController.createMoodEntry);

// 🟡 جلب كل الحالات المزاجية لمستخدم
router.get('/user/:user_id', moodController.getMoodEntriesByUser);

// 🔵 حذف إدخال
router.delete('/:mood_id', moodController.deleteMoodEntry);

module.exports = router;
