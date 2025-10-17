const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');

const {
  register,
  login,
  forgotPassword,
  resetPassword,
  getAllUsers,
  getUserByEmail,
  deleteUser,
  updateUser,
  getPendingUsers,
  approveUser,
  rejectUser
} = require('../controllers/userController');

// 📝 تسجيل مستخدم جديد
router.post('/register', register);

// 🔐 تسجيل الدخول
router.post('/login', login);

// 🔑 نسيت كلمة السر
router.post('/forgot-password', forgotPassword);

// 🔁 إعادة تعيين كلمة السر
router.post('/reset-password', resetPassword);

// 👤 المستخدم العادي يشوف بياناته
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await getUserByEmail({ params: { email: req.user.email } }, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 👥 الأدمن يشوف كل المستخدمين
router.get('/', verifyToken, checkAdmin, getAllUsers);

// 🔎 الأدمن يشوف مستخدم حسب الإيميل
router.get('/:email', verifyToken, checkAdmin, getUserByEmail);

// 🗑️ حذف مستخدم (أدمن فقط)
router.delete('/:id', verifyToken, checkAdmin, deleteUser);

// 🔄 تحديث بيانات مستخدم
// الأدمن يمرر ID، المستخدم العادي لا يحتاج ID
// المستخدم العادي يحدث بياناته
router.put('/me', verifyToken, updateUser);

// الأدمن يحدث أي مستخدم
router.put('/:id', verifyToken, checkAdmin, updateUser);

// 📋 Admin: جلب المستخدمين pending
router.get('/admin/pending', verifyToken, checkAdmin, getPendingUsers);

// ✅ Admin: الموافقة على مستخدم
router.put('/admin/approve/:user_id', verifyToken, checkAdmin, approveUser);

// ❌ Admin: رفض مستخدم
router.put('/admin/reject/:user_id', verifyToken, checkAdmin, rejectUser);

module.exports = router;
