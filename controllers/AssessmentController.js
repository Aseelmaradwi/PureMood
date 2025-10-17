const Assessment = require('../models/Assessment');
const AssessmentQuestion = require('../models/AssessmentQuestion');
const AssessmentAnswer = require('../models/AssessmentAnswer');
const AssessmentResult = require('../models/AssessmentResult');
const AIIndicator = require('../models/AIIndicator');

// دالة لتحديد مستوى الخطر بناءً على نوع الاختبار والدرجة
const calculateRiskLevel = (assessmentName, score) => {
  console.log(`[calculateRiskLevel] Assessment: ${assessmentName}, Score: ${score}`);
  
  if (assessmentName === 'anxiety' || assessmentName === 'depression') {
    // GAD-7 & PHQ-9: 0-21 scale
    // Low: 0-9, Medium: 10-14, High: 15+
    if (score <= 9) return 'low';
    if (score <= 14) return 'medium';
    return 'high';
  } else if (assessmentName === 'wellbeing') {
    // WHO-5: 0-15 scale (higher is better)
    // Low risk (good): 13-15, Medium: 8-12, High risk (poor): 0-7
    if (score >= 13) return 'low';
    if (score >= 8) return 'medium';
    return 'high';
  }
  
  return 'unknown';
};

// عرض الأسئلة
exports.getQuestions = async (req, res) => {
  try {
    const { assessmentName } = req.params;
    const assessment = await Assessment.findOne({ where: { name: assessmentName } });
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    const questions = await AssessmentQuestion.findAll({ where: { assessment_id: assessment.assessment_id } });
    res.json({ assessment, questions });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching questions', error });
  }
};

// استقبال الإجابات وحساب النتيجة
exports.submitAnswers = async (req, res) => {
  try {
    const { assessmentName, answers } = req.body;
    const user_id = req.user.user_id; // ناخد الـ user_id من التوكن

    console.log('[submitAnswers] Request Body:', { assessmentName, answers });
    console.log('[submitAnswers] User ID:', user_id);

    const assessment = await Assessment.findOne({ where: { name: assessmentName } });
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    let totalScore = 0;

    for (const answer of answers) {
      console.log('[submitAnswers] Processing answer:', answer);
      
      const question = await AssessmentQuestion.findByPk(answer.question_id);
      if (!question) {
        console.log(`[submitAnswers] Question not found: ${answer.question_id}`);
        continue;
      }

      console.log('[submitAnswers] Question:', {
        id: question.question_id,
        score_values: question.score_values,
        selected_index: answer.selected_option_index
      });

      const selectedScore = question.score_values[answer.selected_option_index];
      console.log('[submitAnswers] Selected Score:', selectedScore);
      
      totalScore += selectedScore;
      console.log('[submitAnswers] Total Score so far:', totalScore);

      await AssessmentAnswer.create({
        user_id,
        question_id: answer.question_id,
        selected_option_index: answer.selected_option_index,
        score: selectedScore
      });
    }
    
    console.log('[submitAnswers] Final Total Score:', totalScore);

    const risk_level = calculateRiskLevel(assessmentName, totalScore);

    const result = await AssessmentResult.create({
      user_id,
      assessment_id: assessment.assessment_id,
      total_score: totalScore,
      risk_level
    });

    const aiMessage = `Your ${assessmentName} score indicates a ${risk_level} risk.`;
    const aiSuggestion = risk_level === 'high'
      ? 'It may help to talk to a mental health professional.'
      : risk_level === 'medium'
      ? 'We recommend practicing relaxation techniques and monitoring your condition.'
      : 'Your condition is good. Keep tracking your mental health!';

    await AIIndicator.create({
      user_id,
      mood_trend: 'stable',
      risk_level,
      message: aiMessage,
      suggestion: aiSuggestion,
      analyzed_at: new Date()
    });

    res.json({ 
      result_id: result.result_id,
      total_score: totalScore,
      risk_level: risk_level,
      message: aiMessage,
      suggestion: aiSuggestion,
      taken_at: result.taken_at
    });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    res.status(500).json({ message: 'Error submitting assessment', error: error.message });
  }
};

// عرض آخر نتيجة
exports.getLastResult = async (req, res) => {
  try {
    const { assessmentName } = req.params;
    const user_id = req.user.user_id; // ناخد user_id من التوكن

    const assessment = await Assessment.findOne({ where: { name: assessmentName } });
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    const result = await AssessmentResult.findOne({
      where: { user_id, assessment_id: assessment.assessment_id },
      order: [['taken_at', 'DESC']]
    });

    if (!result) return res.json({ message: 'No results found' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching last result', error });
  }
};
