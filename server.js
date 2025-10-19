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

app.use('/api/users', userRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/community', communityRoutes);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    const User = require('./models/User');
    const CommunityPost = require('./models/CommunityPost');
    const CommunityComment = require('./models/CommunityComment');
    const CommunityLike = require('./models/CommunityLike');
    
    User.hasMany(CommunityPost, { foreignKey: 'user_id' });
    User.hasMany(CommunityComment, { foreignKey: 'user_id' });
    User.hasMany(CommunityLike, { foreignKey: 'user_id' });
    
    CommunityPost.belongsTo(User, { foreignKey: 'user_id' });
    CommunityPost.hasMany(CommunityComment, { foreignKey: 'post_id' });
    CommunityPost.hasMany(CommunityLike, { foreignKey: 'post_id' });
    
    CommunityComment.belongsTo(User, { foreignKey: 'user_id' });
    CommunityComment.belongsTo(CommunityPost, { foreignKey: 'post_id' });
    
    CommunityLike.belongsTo(User, { foreignKey: 'user_id' });
    CommunityLike.belongsTo(CommunityPost, { foreignKey: 'post_id' });
    
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
    
    await sequelize.sync();
    console.log('✅ Models synced');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ DB Error:', err);
  }
};

startServer();
