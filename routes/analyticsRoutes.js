const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/weekly/:user_id', analyticsController.calculateWeeklyAnalytics);

module.exports = router;
