const express = require('express');
const router = express.Router();
const { verifyToken, checkAdmin } = require('../middleware/authMiddleware');
const {
  getDashboardStats,
  getAllUsersAdmin,
  getUserDetails,
  updateUserRoleStatus,
  deleteUserAdmin,
  getAllPostsAdmin,
  deletePostAdmin,
  getSystemHealth
} = require('../controllers/adminController');

// All routes require admin authentication
router.use(verifyToken);
router.use(checkAdmin);

// 📊 Dashboard statistics
router.get('/dashboard/stats', getDashboardStats);

// 📊 System health
router.get('/system/health', getSystemHealth);

// 👥 User management
router.get('/users', getAllUsersAdmin);
router.get('/users/:userId', getUserDetails);
router.put('/users/:userId', updateUserRoleStatus);
router.delete('/users/:userId', deleteUserAdmin);

// 📝 Content moderation
router.get('/posts', getAllPostsAdmin);
router.delete('/posts/:postId', deletePostAdmin);

module.exports = router;
