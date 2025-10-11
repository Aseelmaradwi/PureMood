// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);
const moodRoutes = require('./routes/moodRoutes');
app.use('/api/moods', moodRoutes);


// Connect to Database and sync models
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    // Models
      const User = require('./models/User');
      const MoodEntry = require('./models/MoodEntry');
  
    await sequelize.sync({ alter: true }); // إنشاء الجداول تلقائيًا إذا غير موجودة
    
    console.log('✅ All models synced with DB');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.log('❌ DB Error or Sync Error: ', err);
  }
};

startServer();
