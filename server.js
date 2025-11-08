const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/db');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// 🧩 Routes
const userRoutes = require('./routes/userRoutes');
const moodRoutes = require('./routes/moodRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const aiRoutes = require('./routes/aiRoutes');
const assessmentRoutes = require('./routes/AssessmentRoutes');
const communityRoutes = require('./routes/communityRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const emailVerificationRoutes = require('./routes/emailVerificationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
// Gamification routes
const pointsRoutes = require('./routes/points');
const badgesRoutes = require('./routes/badges');
const challengesRoutes = require('./routes/challenges');

app.use('/api/users', userRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/email', emailVerificationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/badges', badgesRoutes);
app.use('/api/challenges', challengesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

const startServer = async () => {
  try {
    console.log('🔄 Starting server...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // 🧹 تنظيف الإشعارات القديمة عند بدء السيرفر
    const { cleanupOldNotifications, deleteVeryOldNotifications } = require('./controllers/notificationController');
    
    // تنظيف فوري عند البدء
    setTimeout(() => {
      cleanupOldNotifications();
      deleteVeryOldNotifications();
    }, 5000);

    // ⚠️ تنظيف تلقائي كل دقيقة (للاختبار فقط - غيرها ل 24 ساعة في الإنتاج)
    setInterval(() => {
      cleanupOldNotifications();
      deleteVeryOldNotifications();
    }, 1 * 60 * 1000); // كل دقيقة للاختبار
    // }, 24 * 60 * 60 * 1000); // كل يوم للإنتاج
    
    console.log('✅ Notification cleanup scheduler started (running every 1 minute for testing)');
    
    const User = require('./models/User');
    const CommunityPost = require('./models/CommunityPost');
    const CommunityComment = require('./models/CommunityComment');
    const CommunityLike = require('./models/CommunityLike');
    const Notification = require('./models/Notification');
    
    User.hasMany(CommunityPost, { foreignKey: 'user_id' });
    User.hasMany(CommunityComment, { foreignKey: 'user_id' });
    User.hasMany(CommunityLike, { foreignKey: 'user_id' });
    User.hasMany(Notification, { foreignKey: 'admin_id' });
    
    CommunityPost.belongsTo(User, { foreignKey: 'user_id' });
    CommunityPost.hasMany(CommunityComment, { foreignKey: 'post_id' });
    CommunityPost.hasMany(CommunityLike, { foreignKey: 'post_id' });
    
    CommunityComment.belongsTo(User, { foreignKey: 'user_id' });
    CommunityComment.belongsTo(CommunityPost, { foreignKey: 'post_id' });
    
    CommunityLike.belongsTo(User, { foreignKey: 'user_id' });
    CommunityLike.belongsTo(CommunityPost, { foreignKey: 'post_id' });
    
    Notification.belongsTo(User, { foreignKey: 'admin_id' });
    
    try {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS status ENUM('pending','accepted','rejected') DEFAULT 'accepted'
      `);
      console.log('✅ Status column added/verified');
    } catch (err) {
      console.log('ℹ️  Status column might already exist:', err.message);
    }

    try {
      await sequelize.query(`
        ALTER TABLE community_posts 
        ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0
      `);
      console.log('✅ Community posts columns added/verified');
    } catch (err) {
      console.log('ℹ️  Community columns might already exist:', err.message);
    }
    
    await sequelize.sync({ alter: false, force: false });
    console.log('✅ Models synced');

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📧 Email configured: ${process.env.EMAIL_USER}`);
      console.log(`⏰ Server started at: ${new Date().toLocaleString()}`);
      console.log('✅ Server is ready to accept connections!');
    });

    // Prevent timeout
    server.timeout = 0;
    server.keepAliveTimeout = 0;

    // Keep server alive
    server.on('close', () => {
      console.log('🛑 Server shutting down...');
      process.exit(0);
    });

    server.on('error', (error) => {
      console.error('❌ Server Error:', error);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('⚠️  SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('✅ HTTP server closed');
      });
    });

    process.on('SIGINT', () => {
      console.log('\n⚠️  SIGINT signal received: closing HTTP server');
      server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });
    });

  } catch (err) {
    console.error('❌ DB Error:', err);
    process.exit(1);
  }
};

startServer();
