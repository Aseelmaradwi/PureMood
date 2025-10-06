const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/db');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// Connect to Database
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    

    await sequelize.sync({ alter: true });
    console.log('✅ All models synced with DB');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.log('❌ DB Error or Sync Error: ', err);
  }
};

startServer();
