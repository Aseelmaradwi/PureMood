const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');
const User = require('../models/User');

const {
  register,
  login,
  forgotPassword,
  resetPassword,
  getAllUsers,
  getUserByEmail,
  deleteUser,
  updateUser 
} = require('../controllers/userController');

// تسجيل مستخدم جديد
router.post('/register', register);

// تسجيل الدخول
router.post('/login', login);

// نسيان كلمة المرور
router.post('/forgot-password', forgotPassword);

// إعادة تعيين كلمة المرور
router.post('/reset-password', resetPassword);

// الحصول على جميع المستخدمين (أدمن فقط)
router.get('/', verifyToken, checkAdmin, getAllUsers);

// الحصول على مستخدم حسب البريد الإلكتروني (أدمن فقط)
router.get('/:email', verifyToken, checkAdmin, getUserByEmail);

// حذف مستخدم (أدمن فقط)
router.delete('/:id', verifyToken, checkAdmin, deleteUser);

// تحديث بيانات المستخدم (المستخدم نفسه)
router.put('/me', verifyToken, updateUser);

// تحديث مستخدم عام (أدمن فقط)
router.put('/:id', verifyToken, checkAdmin, updateUser);

// ✅ تحديث حالة المستخدم (approve / reject) — للأدمن المفعّل فقط
router.put('/:id/status', verifyToken, checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // التحقق من أن القيمة صحيحة
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    // جلب بيانات الأدمن الحالي من التوكن
    const adminUser = await User.findByPk(req.user.user_id);

    // تحقق أن الأدمن نفسه مفعّل
    if (!adminUser || adminUser.status !== 'approved') {
      return res.status(403).json({ message: "Only approved admins can change account statuses" });
    }

    // منع الأدمن من تعديل حالته بنفسه
    if (parseInt(id) === adminUser.user_id) {
      return res.status(403).json({ message: "Admins cannot change their own status" });
    }

    // جلب المستخدم الهدف
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // تحديث الحالة
    user.status = status;
    await user.save();

    res.json({
      message: `User status updated to '${status}' successfully`,
      user
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
