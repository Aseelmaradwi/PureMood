const Assessment = require('../models/Assessment');
const AssessmentQuestion = require('../models/AssessmentQuestion');
const AssessmentAnswer = require('../models/AssessmentAnswer');
const AssessmentResult = require('../models/AssessmentResult');
const AIIndicator = require('../models/AIIndicator');
const MoodEntry = require('../models/MoodEntry');
const { Op } = require('sequelize');

// المنطق الجديد: الاختبارات تظهر حسب عدد مرات تسجيل المزاج
const ASSESSMENT_INTERVALS = {
  'wellbeing': 7,     // WHO-5: بعد كل 7 مرات تسجيل مزاج
  'anxiety': 14,      // GAD-7: بعد كل 14 مرة تسجيل مزاج
  'depression': 14,   // PHQ-9: بعد كل 14 مرة تسجيل مزاج
  'stress': 30        // PSS: بعد كل 30 مرة (مستقبلاً)
};

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

// ========== النظام الدوري المتقدم ==========

// 1. جلب جدول التقييمات الدورية (المنطق الجديد: حسب عدد مرات تسجيل المزاج)
exports.getSchedules = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    
    // حساب عدد مرات تسجيل المزاج للمستخدم
    const totalMoodEntries = await MoodEntry.count({
      where: { user_id }
    });

    console.log(`[getSchedules] User ${user_id} has ${totalMoodEntries} mood entries`);
    
    // جلب جميع التقييمات
    const assessments = await Assessment.findAll();
    const schedules = [];

    for (const assessment of assessments) {
      // الفترة المطلوبة (عدد مرات تسجيل المزاج)
      const intervalEntries = ASSESSMENT_INTERVALS[assessment.name] || 14;
      
      // جلب آخر نتيجة
      const lastResult = await AssessmentResult.findOne({
        where: { user_id, assessment_id: assessment.assessment_id },
        order: [['taken_at', 'DESC']]
      });

      // حساب عدد المزاج entries منذ آخر تقييم
      let entriesSinceLastAssessment = 0;
      if (lastResult) {
        entriesSinceLastAssessment = await MoodEntry.count({
          where: {
            user_id,
            created_at: {
              [Op.gt]: lastResult.taken_at
            }
          }
        });
      } else {
        // لم يأخذ التقييم من قبل - استخدم العدد الكلي
        entriesSinceLastAssessment = totalMoodEntries;
      }

      console.log(`[getSchedules] ${assessment.name}: ${entriesSinceLastAssessment} entries since last assessment (needs ${intervalEntries})`);

      // هل التقييم مستحق؟
      const isDue = entriesSinceLastAssessment >= intervalEntries;
      
      // كم مرة متبقية؟
      const entriesUntilDue = Math.max(0, intervalEntries - entriesSinceLastAssessment);

      let lastTaken = null;
      let nextDue = null;

      if (lastResult) {
        lastTaken = lastResult.taken_at;
        // تقدير التاريخ القادم (افتراضي)
        if (entriesUntilDue > 0) {
          const estimatedDays = entriesUntilDue; // نفترض entry واحد في اليوم
          const nextDueDate = new Date();
          nextDueDate.setDate(nextDueDate.getDate() + estimatedDays);
          nextDue = nextDueDate;
        }
      }

      schedules.push({
        assessment_type: assessment.name,
        assessment_name: assessment.description,
        last_taken: lastTaken,
        next_due: nextDue,
        interval_days: intervalEntries, // الآن: عدد المرات المطلوبة
        is_due: isDue,
        days_until_due: entriesUntilDue, // الآن: عدد المرات المتبقية
        entries_since_last: entriesSinceLastAssessment,
        total_mood_entries: totalMoodEntries
      });
    }

    res.json({ schedules });
  } catch (error) {
    console.error('Error getting schedules:', error);
    res.status(500).json({ message: 'Error getting schedules', error: error.message });
  }
};

// 2. مقارنة النتائج (الحالية vs السابقة)
exports.compareResults = async (req, res) => {
  try {
    const { assessmentName } = req.params;
    const user_id = req.user.user_id;

    const assessment = await Assessment.findOne({ where: { name: assessmentName } });
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    // جلب آخر نتيجتين
    const results = await AssessmentResult.findAll({
      where: { user_id, assessment_id: assessment.assessment_id },
      order: [['taken_at', 'DESC']],
      limit: 2
    });

    if (results.length === 0) {
      return res.status(404).json({ message: 'No results found' });
    }

    const current = results[0];
    const previous = results.length > 1 ? results[1] : null;

    let scoreDifference = 0;
    let trend = 'stable';
    let trendMessage = 'هذا هو تقييمك الأول.';
    let needsProfessionalHelp = false;

    if (previous) {
      scoreDifference = current.total_score - previous.total_score;
      
      // للاكتئاب والقلق: نقاط أقل = تحسن
      if (assessmentName === 'anxiety' || assessmentName === 'depression') {
        if (scoreDifference < -3) {
          trend = 'improved';
          trendMessage = `تحسن ملحوظ! انخفضت النقاط بـ ${Math.abs(scoreDifference)} نقاط. استمر!`;
        } else if (scoreDifference > 3) {
          trend = 'worsened';
          trendMessage = `ازدادت النقاط بـ ${scoreDifference} نقاط. ننصح بالمتابعة مع مختص.`;
          needsProfessionalHelp = current.total_score >= 15; // شديد
        } else {
          trend = 'stable';
          trendMessage = `الوضع مستقر بفارق ${Math.abs(scoreDifference)} نقاط فقط.`;
        }
      } 
      // للرفاهية: نقاط أعلى = تحسن
      else if (assessmentName === 'wellbeing') {
        if (scoreDifference > 2) {
          trend = 'improved';
          trendMessage = `تحسن رائع! ازدادت نقاط الرفاهية بـ ${scoreDifference} نقاط.`;
        } else if (scoreDifference < -2) {
          trend = 'worsened';
          trendMessage = `انخفضت الرفاهية بـ ${Math.abs(scoreDifference)} نقاط. ننصح بالرعاية الذاتية.`;
          needsProfessionalHelp = current.total_score < 8; // منخفض
        } else {
          trend = 'stable';
          trendMessage = `مستوى الرفاهية مستقر.`;
        }
      }
    } else {
      // أول تقييم - فقط تحقق من الخطورة
      if (assessmentName === 'anxiety' || assessmentName === 'depression') {
        needsProfessionalHelp = current.total_score >= 15;
        if (needsProfessionalHelp) {
          trendMessage = 'النقاط تشير لحاجة للتحدث مع مختص نفسي.';
        }
      } else if (assessmentName === 'wellbeing') {
        needsProfessionalHelp = current.total_score < 8;
        if (needsProfessionalHelp) {
          trendMessage = 'مستوى الرفاهية منخفض. ننصح باستشارة مختص.';
        }
      }
    }

    res.json({
      current: {
        result_id: current.result_id,
        total_score: current.total_score,
        risk_level: current.risk_level,
        message: '',
        suggestion: '',
        taken_at: current.taken_at
      },
      previous: previous ? {
        result_id: previous.result_id,
        total_score: previous.total_score,
        risk_level: previous.risk_level,
        message: '',
        suggestion: '',
        taken_at: previous.taken_at
      } : null,
      score_difference: scoreDifference,
      trend,
      trend_message: trendMessage,
      needs_professional_help: needsProfessionalHelp
    });
  } catch (error) {
    console.error('Error comparing results:', error);
    res.status(500).json({ message: 'Error comparing results', error: error.message });
  }
};

// 3. التقدم عبر الزمن
exports.getProgress = async (req, res) => {
  try {
    const { assessmentType } = req.params;
    const user_id = req.user.user_id;

    const assessment = await Assessment.findOne({ where: { name: assessmentType } });
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    // جلب جميع النتائج
    const results = await AssessmentResult.findAll({
      where: { user_id, assessment_id: assessment.assessment_id },
      order: [['taken_at', 'ASC']]
    });

    if (results.length === 0) {
      return res.status(404).json({ message: 'No results found' });
    }

    // حساب الإحصائيات
    const scores = results.map(r => r.total_score);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    let bestResult, worstResult;
    if (assessmentType === 'anxiety' || assessmentType === 'depression') {
      // أقل نقاط = أفضل
      bestResult = results.reduce((best, current) => 
        current.total_score < best.total_score ? current : best
      );
      worstResult = results.reduce((worst, current) => 
        current.total_score > worst.total_score ? current : worst
      );
    } else {
      // أعلى نقاط = أفضل
      bestResult = results.reduce((best, current) => 
        current.total_score > best.total_score ? current : best
      );
      worstResult = results.reduce((worst, current) => 
        current.total_score < worst.total_score ? current : worst
      );
    }

    // تحديد الاتجاه العام
    let overallTrend = 'stable';
    if (results.length >= 3) {
      const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
      const secondHalf = scores.slice(Math.floor(scores.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      if (assessmentType === 'anxiety' || assessmentType === 'depression') {
        if (secondAvg < firstAvg - 2) overallTrend = 'improved';
        else if (secondAvg > firstAvg + 2) overallTrend = 'worsened';
      } else {
        if (secondAvg > firstAvg + 1) overallTrend = 'improved';
        else if (secondAvg < firstAvg - 1) overallTrend = 'worsened';
      }
    }

    res.json({
      assessment_type: assessmentType,
      history: results.map(r => ({
        result_id: r.result_id,
        total_score: r.total_score,
        risk_level: r.risk_level,
        message: '',
        suggestion: '',
        taken_at: r.taken_at
      })),
      overall_trend: overallTrend,
      average_score: Math.round(averageScore * 10) / 10,
      best_result: {
        result_id: bestResult.result_id,
        total_score: bestResult.total_score,
        risk_level: bestResult.risk_level,
        message: '',
        suggestion: '',
        taken_at: bestResult.taken_at
      },
      worst_result: {
        result_id: worstResult.result_id,
        total_score: worstResult.total_score,
        risk_level: worstResult.risk_level,
        message: '',
        suggestion: '',
        taken_at: worstResult.taken_at
      }
    });
  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({ message: 'Error getting progress', error: error.message });
  }
};

// 4. التحقق من الحاجة لمختص نفسي
exports.checkProfessionalReferral = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    // فحص جميع التقييمات الأخيرة
    const assessments = await Assessment.findAll();
    let isNeeded = false;
    let severity = 'moderate';
    let reason = '';
    const symptoms = [];
    const recommendations = [];

    for (const assessment of assessments) {
      const lastResult = await AssessmentResult.findOne({
        where: { user_id, assessment_id: assessment.assessment_id },
        order: [['taken_at', 'DESC']]
      });

      if (!lastResult) continue;

      // فحص الاكتئاب
      if (assessment.name === 'depression') {
        if (lastResult.total_score >= 20) {
          isNeeded = true;
          severity = 'severe';
          reason = 'نقاط عالية جداً في اختبار الاكتئاب (PHQ-9)';
          symptoms.push('أعراض اكتئاب شديدة');
          recommendations.push('استشارة عاجلة مع طبيب نفسي');
        } else if (lastResult.total_score >= 15) {
          isNeeded = true;
          severity = severity === 'severe' ? 'severe' : 'moderate-severe';
          symptoms.push('أعراض اكتئاب متوسطة إلى شديدة');
          recommendations.push('ننصح بشدة بزيارة مختص نفسي');
        }
      }

      // فحص القلق
      if (assessment.name === 'anxiety') {
        if (lastResult.total_score >= 15) {
          isNeeded = true;
          severity = severity === 'severe' ? 'severe' : 'moderate-severe';
          reason = reason || 'نقاط عالية في اختبار القلق (GAD-7)';
          symptoms.push('أعراض قلق شديدة');
          recommendations.push('العلاج السلوكي المعرفي قد يكون مفيداً');
        }
      }

      // فحص الرفاهية
      if (assessment.name === 'wellbeing') {
        if (lastResult.total_score < 8) {
          isNeeded = true;
          symptoms.push('مستوى رفاهية منخفض');
          recommendations.push('تحسين جودة الحياة مع دعم مهني');
        }
      }
    }

    if (!isNeeded) {
      return res.json({
        is_needed: false,
        severity: 'low',
        reason: 'النتائج الحالية لا تشير لحاجة عاجلة للمساعدة المهنية',
        message: 'حالتك النفسية مستقرة. استمر في متابعة مزاجك والعناية بنفسك.',
        symptoms: [],
        recommendations: ['الاستمرار في تتبع المزاج', 'ممارسة الرياضة والتأمل']
      });
    }

    let message = '';
    if (severity === 'severe') {
      message = '⚠️ ننصحك بشدة بالتحدث مع مختص نفسي في أقرب وقت. الأعراض التي تعاني منها تحتاج لتدخل مهني.';
    } else {
      message = '💡 نقترح عليك استشارة مختص نفسي لمساعدتك في تحسين حالتك النفسية.';
    }

    res.json({
      is_needed: isNeeded,
      severity,
      reason,
      message,
      symptoms,
      recommendations
    });
  } catch (error) {
    console.error('Error checking professional referral:', error);
    res.status(500).json({ message: 'Error checking referral', error: error.message });
  }
};

// 5. جلب التاريخ الكامل
exports.getHistory = async (req, res) => {
  try {
    const { assessmentType } = req.params;
    const user_id = req.user.user_id;

    const assessment = await Assessment.findOne({ where: { name: assessmentType } });
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    const results = await AssessmentResult.findAll({
      where: { user_id, assessment_id: assessment.assessment_id },
      order: [['taken_at', 'DESC']]
    });

    res.json({
      results: results.map(r => ({
        result_id: r.result_id,
        total_score: r.total_score,
        risk_level: r.risk_level,
        message: '',
        suggestion: '',
        taken_at: r.taken_at
      }))
    });
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({ message: 'Error getting history', error: error.message });
  }
};
