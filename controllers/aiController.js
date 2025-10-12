const MoodEntry = require('../models/MoodEntry');
const AIIndicator = require('../models/AIIndicator');
const { Op } = require('sequelize');

// 🤖 Smart AI mood analysis and risk detection
exports.evaluateMoodAI = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // 🔹 Get the last 7 days of mood entries
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const entries = await MoodEntry.findAll({
      where: { user_id, created_at: { [Op.gte]: lastWeek } },
      order: [['created_at', 'ASC']]
    });

    if (!entries.length) {
      return res.status(404).json({ message: "No mood entries found for analysis" });
    }

    // 🧮 Count how many days had low mood or negative expression
    const lowMoodDays = entries.filter(e =>
      ['😢', '😞', '😔', '😭'].includes(e.mood_emoji)
    ).length;

    // 🗒️ Analyze notes for negative words (English)
    const negativeText = entries.filter(e =>
      e.note_text &&
      /(tired|sad|hopeless|anxious|depressed|alone|afraid|fear|lost|worthless|empty|no energy|no motivation)/i.test(e.note_text)
    ).length;

    // 🔍 Determine overall trend (improving / declining / stable)
    const trend =
      lowMoodDays > entries.length / 2
        ? "declining"
        : lowMoodDays === 0
        ? "improving"
        : "stable";

    // 🧠 Decision logic (inspired by PHQ-9 / DSM-5)
    let risk_level = "low";
    let suggestion = "Keep tracking your mood regularly 🌿";
    let message = "Your mood appears stable.";

    if (lowMoodDays >= 3 && lowMoodDays < 5) {
      risk_level = "medium";
      message = "Mood decline noticed for several days.";
      suggestion = "Try relaxation or breathing exercises 🧘‍♀️";
    }

    if (lowMoodDays >= 5 || negativeText >= 2 || trend === "declining") {
      risk_level = "high";
      message = "Mood decline detected for 5+ days with possible emotional distress.";
      suggestion = "We recommend talking with a mental health specialist 👩‍⚕️";
    }

    // 💾 Save the AI analysis result
    const indicator = await AIIndicator.create({
      user_id,
      risk_level,
      message,
      suggestion
    });

    return res.status(201).json({
      message: "AI mood analysis completed successfully 🤖",
      result: {
        trend,
        lowMoodDays,
        negativeText,
        risk_level,
        suggestion
      },
      indicator
    });

  } catch (error) {
    console.error("AI Evaluation Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
