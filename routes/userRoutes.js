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
  updateUser 
} = require('../controllers/userController');

router.post('/register', register);

router.post('/login', login);

router.post('/forgot-password', forgotPassword);

router.post('/reset-password', resetPassword);

router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await getUserByEmail({ params: { email: req.user.email } }, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', verifyToken, checkAdmin, getAllUsers);

router.get('/:email', verifyToken, checkAdmin, getUserByEmail);

router.delete('/:id', verifyToken, checkAdmin, deleteUser);


router.put('/me', verifyToken, updateUser);

router.put('/:id', verifyToken, checkAdmin, updateUser);



module.exports = router;
