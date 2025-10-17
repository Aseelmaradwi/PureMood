const AIIndicator = require('../models/AIIndicator');
const MoodAnalytics = require('../models/MoodAnalytics');

exports.evaluateMood = async (req,res) => {
  try {
    const user_id = req.user.user_id;

    const latestAnalytics = await MoodAnalytics.findOne({
      where: { user_id, period_type:'weekly' },
      order:[['created_at','DESC']]
    });

    if(!latestAnalytics){
      return res.json({ risk_level:'low', message:'No mood data available', suggestion:'Start tracking your mood' });
    }

    const lowDays = latestAnalytics.low_days || 0;
    const avgMood = latestAnalytics.average_mood || 0;
    let risk_level = 'low', message='Your mood is stable', suggestion='Keep up the good habits';

    if (lowDays >= 4 || avgMood <= 2){
      risk_level='high';
      message='Several challenging days recently';
      suggestion='Consider talking to a mental health professional';
    } else if (lowDays >= 2 || avgMood <= 3){
      risk_level='medium';
      message='Some mood fluctuations detected';
      suggestion='Try mindfulness or reach out to friends';
    }

    // تحديث أو إنشاء السجل الأخير
    const [aiIndicator, created] = await AIIndicator.findOrCreate({
      where: { user_id },
      defaults: {
        user_id, mood_trend: latestAnalytics.trend,
        risk_level, message, suggestion
      }
    });

    if(!created){
      await aiIndicator.update({ mood_trend: latestAnalytics.trend, risk_level, message, suggestion, analyzed_at: new Date() });
    }

    res.json({ risk_level: aiIndicator.risk_level, message: aiIndicator.message, suggestion: aiIndicator.suggestion });

  } catch(err){
    console.error('AI Evaluation Error:', err);
    res.json({ risk_level:'low', message:'Mood analysis unavailable', suggestion:'Try again later' });
  }
};
