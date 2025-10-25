const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const sequelize = require('../config/db');

// 🔥 GET /api/moods - جلب كل مزاجات المستخدم
router.get('/', verifyToken, async (req, res) => {
  try {
    console.log('📊 جلب مزاجات للمستخدم:', req.user.user_id);
    
    // جرب أسماء جداول مختلفة
    const tableNames = ['mood_entries', 'moods'];
    
    for (let tableName of tableNames) {
      try {
        const [results] = await sequelize.query(
          `SELECT * FROM ${tableName} WHERE user_id = ? ORDER BY created_at DESC`,
          { replacements: [req.user.user_id] }
        );
        
        console.log(`✅ تم جلب ${results.length} تسجيل مزاج من جدول: ${tableName}`);
        return res.json(results);
      } catch (e) {
        console.log(`❌ جدول ${tableName} غير موجود: ${e.message}`);
      }
    }
    
    // إذا لم توجد أي جداول، أرجع مصفوفة فارغة
    console.log('⚠️ لا توجد جداول مزاجات، إرجاع بيانات فارغة');
    res.json([]);
    
  } catch (err) {
    console.error('❌ خطأ في جلب المزاجات:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🔥 POST /api/moods/add - إضافة مزاج جديد
router.post('/add', verifyToken, async (req, res) => {
  try {
    const { mood_emoji, note_text, note_audio } = req.body;
    console.log('➕ إضافة مزاج جديد:', { mood_emoji, note_text });
    
    // جرب إدراج في الجدول الصحيح
    const tableNames = ['mood_entries', 'moods'];
    
    for (let tableName of tableNames) {
      try {
        const [result] = await sequelize.query(
          `INSERT INTO ${tableName} (user_id, mood_emoji, note_text, note_audio, created_at) 
           VALUES (?, ?, ?, ?, NOW())`,
          { replacements: [req.user.user_id, mood_emoji, note_text, note_audio || null] }
        );
        
        console.log(`✅ تم إضافة مزاج جديد في جدول: ${tableName}، ID: ${result.insertId}`);
        return res.json({ 
          message: "Mood saved successfully!", 
          mood_id: result.insertId 
        });
      } catch (e) {
        console.log(`❌ فشل الإدراج في جدول ${tableName}: ${e.message}`);
      }
    }
    
    throw new Error('لم يتمكن من حفظ المزاج في أي جدول');
    
  } catch (err) {
    console.error('❌ خطأ في حفظ المزاج:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🔥 GET /api/moods/user/me - جلب مزاجات المستخدم الحالي
router.get('/user/me', verifyToken, async (req, res) => {
  try {
    console.log('📊 جلب مزاجات للمستخدم الحالي:', req.user.user_id);
    
    // نفس منطق الـ GET الأساسي
    const tableNames = ['mood_entries', 'moods'];
    
    for (let tableName of tableNames) {
      try {
        const [results] = await sequelize.query(
          `SELECT * FROM ${tableName} WHERE user_id = ? ORDER BY created_at DESC`,
          { replacements: [req.user.user_id] }
        );
        
        console.log(`✅ تم جلب ${results.length} تسجيل مزاج من جدول: ${tableName}`);
        return res.json(results);
      } catch (e) {
        console.log(`❌ جدول ${tableName} غير موجود: ${e.message}`);
      }
    }
    
    res.json([]);
    
  } catch (err) {
    console.error('❌ خطأ في جلب المزاجات:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🔥 DELETE /api/moods/:mood_id - حذف مزاج
router.delete('/:mood_id', verifyToken, async (req, res) => {
  try {
    const { mood_id } = req.params;
    console.log('🗑️ حذف مزاج:', mood_id);
    
    // جرب حذف من الجداول المختلفة
    const tableNames = ['mood_entries', 'moods'];
    
    for (let tableName of tableNames) {
      try {
        const [result] = await sequelize.query(
          `DELETE FROM ${tableName} WHERE mood_id = ? AND user_id = ?`,
          { replacements: [mood_id, req.user.user_id] }
        );
        
        if (result.affectedRows > 0) {
          console.log(`✅ تم حذف المزاج من جدول: ${tableName}`);
          return res.json({ message: "Mood deleted successfully!" });
        }
      } catch (e) {
        console.log(`❌ فشل الحذف من جدول ${tableName}: ${e.message}`);
      }
    }
    
    res.status(404).json({ message: "Mood not found" });
    
  } catch (err) {
    console.error('❌ خطأ في حذف المزاج:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;