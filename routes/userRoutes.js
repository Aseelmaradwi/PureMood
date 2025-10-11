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

router.post('/register', register);

router.post('/login', login);

router.post('/forgot-password', forgotPassword);

router.post('/reset-password', resetPassword);

router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id, {
      attributes: ['user_id', 'name', 'email', 'role', 'age', 'gender', 'picture', 'status']
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', verifyToken, checkAdmin, getAllUsers);

router.get('/:email', verifyToken, checkAdmin, getUserByEmail);

router.delete('/:id', verifyToken, checkAdmin, deleteUser);

router.put('/me', verifyToken, updateUser);

router.put('/:id', verifyToken, checkAdmin, updateUser);

router.put('/:id/status', verifyToken, checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    const adminUser = await User.findByPk(req.user.user_id);

    if (!adminUser || adminUser.status !== 'approved') {
      return res.status(403).json({ message: "Only approved admins can change account statuses" });
    }

    if (parseInt(id) === adminUser.user_id) {
      return res.status(403).json({ message: "Admins cannot change their own status" });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });

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
