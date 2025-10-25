const User = require('../models/User');
const MoodEntry = require('../models/MoodEntry');
const CommunityPost = require('../models/CommunityPost');
const CommunityComment = require('../models/CommunityComment');
const AssessmentResult = require('../models/AssessmentResult');
const { Op } = require('sequelize');
const sequelize = require('../config/db');

// 📊 إحصائيات Dashboard
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalPatients = await User.count({ where: { role: 'patient' } });
    const totalSpecialists = await User.count({ where: { role: 'specialist' } });
    const totalMoodEntries = await MoodEntry.count();
    const totalPosts = await CommunityPost.count();
    const totalComments = await CommunityComment.count();
    const pendingUsers = await User.count({ where: { status: 'pending' } });

    // مستخدمين جدد هذا الشهر
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newUsersThisMonth = await User.count({
      where: { created_at: { [Op.gte]: startOfMonth } }
    });

    // مستخدمين نشطين (آخر 7 أيام)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = await MoodEntry.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('user_id')), 'user_id']],
      where: { created_at: { [Op.gte]: sevenDaysAgo } },
      raw: true
    });

    res.json({
      totalUsers,
      totalPatients,
      totalSpecialists,
      totalMoodEntries,
      totalPosts,
      totalComments,
      pendingUsers,
      newUsersThisMonth,
      activeUsers: activeUsers.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 👥 جلب كل المستخدمين مع فلاتر
const getAllUsersAdmin = async (req, res) => {
  try {
    const { role, status, search } = req.query;
    const where = {};

    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const users = await User.findAll({
      where,
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['password_hash'] }
    });

    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 👤 تفاصيل مستخدم مع إحصائياته
const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({
      where: { user_id: userId },
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const moodCount = await MoodEntry.count({ where: { user_id: userId } });
    const postCount = await CommunityPost.count({ where: { user_id: userId } });
    const commentCount = await CommunityComment.count({ where: { user_id: userId } });

    const recentMoods = await MoodEntry.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: 10
    });

    res.json({
      user,
      statistics: { moodCount, postCount, commentCount },
      recentMoods
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔄 تحديث دور أو حالة مستخدم
const updateUserRoleStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, status } = req.body;

    const user = await User.findOne({ where: { user_id: userId } });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (role) user.role = role;
    if (status) user.status = status;
    await user.save();

    res.json({ message: 'User updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🗑️ حذف مستخدم
const deleteUserAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ where: { user_id: userId } });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // منع حذف أدمن آخرين
    if (user.role === 'admin' && user.user_id !== req.user.user_id) {
      return res.status(403).json({ message: 'Cannot delete other admin users' });
    }

    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📝 جلب كل منشورات المجتمع
const getAllPostsAdmin = async (req, res) => {
  try {
    const posts = await CommunityPost.findAll({
      include: [{
        model: User,
        attributes: ['user_id', 'name', 'email', 'picture']
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({ posts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🗑️ حذف منشور
const deletePostAdmin = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await CommunityPost.findOne({ where: { post_id: postId } });
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await post.destroy();
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📊 صحة النظام والنشاط الأخير
const getSystemHealth = async (req, res) => {
  try {
    await sequelize.authenticate();

    const recentUsers = await User.findAll({
      order: [['created_at', 'DESC']],
      limit: 5,
      attributes: ['user_id', 'name', 'email', 'created_at']
    });

    const recentMoods = await MoodEntry.findAll({
      order: [['created_at', 'DESC']],
      limit: 10,
      include: [{
        model: User,
        attributes: ['name']
      }]
    });

    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date(),
      recentUsers,
      recentMoods
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'unhealthy',
      message: err.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsersAdmin,
  getUserDetails,
  updateUserRoleStatus,
  deleteUserAdmin,
  getAllPostsAdmin,
  deletePostAdmin,
  getSystemHealth
};
