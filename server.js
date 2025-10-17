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


app.use('/api/users', userRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/assessments', assessmentRoutes);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // إضافة status column يدوياً إذا لم يكن موجوداً
    try {
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS status ENUM('pending','accepted','rejected') DEFAULT 'accepted'
      `);
      console.log('✅ Status column added/verified');
    } catch (err) {
      console.log('ℹ️  Status column might already exist:', err.message);
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
