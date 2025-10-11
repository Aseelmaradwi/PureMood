const MoodEntry = require('../models/MoodEntry');

// 🟢 إنشاء إدخال جديد (تسجيل مزاج)
exports.createMoodEntry = async (req, res) => {
  try {
    const { user_id, mood_emoji, note_text, note_audio } = req.body;

    if (!user_id || !mood_emoji) {
      return res.status(400).json({ message: "User ID and mood emoji are required." });
    }

    const newEntry = await MoodEntry.create({
      user_id,
      mood_emoji,
      note_text,
      note_audio
    });
//lkwjdikjdkfckdhfjkhdfdhghgjgjcgdfygejfgej
    res.status(201).json({
      message: "Mood entry created successfully 🌿",
      entry: newEntry
    });
  } catch (error) {
    console.error("Error creating mood entry:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 🟡 جلب كل المزاجات لمستخدم
exports.getMoodEntriesByUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    const entries = await MoodEntry.findAll({
      where: { user_id },
      order: [['created_at', 'DESC']]
    });

    res.status(200).json(entries);
  } catch (error) {
    console.error("Error fetching mood entries:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔵 حذف إدخال مزاج معين
exports.deleteMoodEntry = async (req, res) => {
  try {
    const { mood_id } = req.params;
    const entry = await MoodEntry.findByPk(mood_id);

    if (!entry) return res.status(404).json({ message: "Entry not found" });

    await entry.destroy();
    res.status(200).json({ message: "Mood entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting mood entry:", error);
    res.status(500).json({ message: "Server error" });
  }
};
