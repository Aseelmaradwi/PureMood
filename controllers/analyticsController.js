const MoodEntry = require('../models/MoodEntry');
const MoodAnalytics = require('../models/MoodAnalytics');
const { Op } = require('sequelize');

// 🧮 تحليل المزاج الأسبوعي
exports.calculateWeeklyAnalytics = async (req, res) => {
  try {
    const { user_id } = req.params;

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const entries = await MoodEntry.findAll({
      where: { user_id, created_at: { [Op.gte]: lastWeek } },
      order: [['created_at', 'ASC']]
    });

    if (!entries.length) {
      return res.status(404).json({ message: 'No mood data found for this week' });
    }

    // احصائيات
    const average = entries.length;
    const highDays = entries.filter(e => e.mood_emoji === '😊' || e.mood_emoji === '😄').length;
    const lowDays = entries.filter(e => e.mood_emoji === '😢' || e.mood_emoji === '😔').length;

    const trend = highDays > lowDays ? 'improving' :
                  lowDays > highDays ? 'declining' : 'stable';

    // حفظ النتائج في MoodAnalytics
    const analytics = await MoodAnalytics.create({
      user_id,
      period_type: 'weekly',
      average_mood: average,
      high_days: highDays,
      low_days: lowDays,
      trend
    });

    res.status(201).json({
      message: "Weekly analytics calculated successfully 🌿",
      analytics
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
