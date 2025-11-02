const Recommendation = require('../models/Recommendation');
const MoodEntry = require('../models/MoodEntry');

// ☕ قائمة المشروبات الدافئة
const WARM_DRINKS = [
  { name: 'شاي أخضر', icon: '🍵', benefits: 'يحتوي على مضادات أكسدة ويساعد على الاسترخاء' },
  { name: 'شاي بالنعناع', icon: '🌿', benefits: 'منعش ومهدئ للجهاز الهضمي' },
  { name: 'قهوة تركية', icon: '☕', benefits: 'تعطي طاقة وتحسن التركيز' },
  { name: 'قهوة لاتيه', icon: '🥛', benefits: 'حليب دافئ مع قهوة، مثالي للاسترخاء' },
  { name: 'كابتشينو', icon: '☕', benefits: 'متوازن بين القهوة والحليب' },
  { name: 'شوكولاتة ساخنة', icon: '🍫', benefits: 'يحسن المزاج ويشعرك بالسعادة' },
  { name: 'شاي بالزنجبيل', icon: '🫚', benefits: 'يدفئ الجسم ويقوي المناعة' },
  { name: 'حليب بالكركم', icon: '🥛', benefits: 'مضاد للالتهاب ومهدئ' },
  { name: 'يانسون', icon: '⭐', benefits: 'مهدئ ومريح للأعصاب' },
  { name: 'بابونج', icon: '🌼', benefits: 'يساعد على النوم والاسترخاء' },
  { name: 'قهوة فرنسية', icon: '🇫🇷', benefits: 'نكهة غنية وعميقة' },
  { name: 'ماتشا لاتيه', icon: '🍵', benefits: 'طاقة مستدامة بدون توتر' }
];

// 🎵 قائمة الموسيقى المهدئة
const RELAXING_MUSIC = [
  { title: 'أصوات المطر', icon: '🌧️', duration: '60 دقيقة', url: 'https://www.youtube.com/watch?v=q76bMs-NwRk' },
  { title: 'موسيقى البيانو الهادئة', icon: '🎹', duration: '45 دقيقة', url: 'https://www.youtube.com/watch?v=_AOJhuU_hus' },
  { title: 'أصوات الطبيعة', icon: '🌿', duration: '30 دقيقة', url: 'https://www.youtube.com/watch?v=eKFTSSKCzWA' },
  { title: 'موسيقى للتأمل', icon: '🧘', duration: '20 دقيقة', url: 'https://www.youtube.com/watch?v=lFcSrYw-ARY' },
  { title: 'أمواج البحر', icon: '🌊', duration: '60 دقيقة', url: 'https://www.youtube.com/watch?v=WHPEKLQID4U' }
];

// 🏃 قائمة التمارين الرياضية
const EXERCISES = [
  { name: 'المشي السريع', icon: '🚶', duration: '20-30 دقيقة', calories: '150 سعرة', benefits: 'يحسن الدورة الدموية ويخفف التوتر' },
  { name: 'اليوغا للمبتدئين', icon: '🧘', duration: '15 دقيقة', calories: '80 سعرة', benefits: 'مرونة وهدوء ذهني' },
  { name: 'تمارين الإطالة', icon: '🤸', duration: '10 دقائق', calories: '40 سعرة', benefits: 'تقلل الشد العضلي وتحسن المرونة' },
  { name: 'القفز على الحبل', icon: '🪢', duration: '10 دقائق', calories: '120 سعرة', benefits: 'تمرين قلبي ممتاز' },
  { name: 'تمارين القوة المنزلية', icon: '💪', duration: '20 دقيقة', calories: '100 سعرة', benefits: 'بناء العضلات وزيادة القوة' },
  { name: 'ركوب الدراجة', icon: '🚴', duration: '30 دقيقة', calories: '200 سعرة', benefits: 'تقوية القلب والساقين' },
  { name: 'السباحة', icon: '🏊', duration: '30 دقيقة', calories: '250 سعرة', benefits: 'تمرين شامل للجسم' },
  { name: 'الرقص', icon: '💃', duration: '20 دقيقة', calories: '150 سعرة', benefits: 'متعة وحرق سعرات' },
  { name: 'تمارين الضغط', icon: '🤛', duration: '5 دقائق', calories: '50 سعرة', benefits: 'قوة الصدر والذراعين' },
  { name: 'تمارين البطن', icon: '🔥', duration: '10 دقائق', calories: '60 سعرة', benefits: 'شد البطن وتقوية العضلات' }
];

// 🧘 قائمة تمارين التأمل
const MEDITATION_EXERCISES = [
  { name: 'تأمل الوعي الذهني', icon: '🧘‍♀️', duration: '10 دقائق', level: 'مبتدئ', benefits: 'زيادة التركيز والهدوء الذهني' },
  { name: 'تأمل المسح الجسدي', icon: '💆', duration: '15 دقيقة', level: 'مبتدئ', benefits: 'استرخاء عميق وتخفيف التوتر' },
  { name: 'تأمل الحب والعطف', icon: '💝', duration: '12 دقيقة', level: 'متوسط', benefits: 'زيادة الإيجابية والعطف نحو الذات' },
  { name: 'تأمل التنفس العميق', icon: '🌬️', duration: '8 دقائق', level: 'مبتدئ', benefits: 'تهدئة سريعة للجهاز العصبي' },
  { name: 'تأمل التخيل الموجه', icon: '🌈', duration: '20 دقيقة', level: 'متوسط', benefits: 'تحسين المزاج وتخفيف القلق' },
  { name: 'تأمل الامتنان', icon: '🙏', duration: '10 دقائق', level: 'مبتدئ', benefits: 'زيادة السعادة والرضا' },
  { name: 'تأمل المانترا', icon: '🕉️', duration: '15 دقيقة', level: 'متقدم', benefits: 'عمق روحي وصفاء ذهني' },
  { name: 'تأمل المراقبة', icon: '👁️', duration: '12 دقيقة', level: 'متوسط', benefits: 'فهم أعمق للأفكار والمشاعر' }
];

// 🌬️ قائمة تمارين التنفس
const BREATHING_EXERCISES = [
  { name: 'تنفس 4-7-8', icon: '🌬️', duration: '5 دقائق', technique: 'شهيق 4 ثوان، حبس 7 ثوان، زفير 8 ثوان', benefits: 'يساعد على النوم ويقلل القلق' },
  { name: 'التنفس الصندوقي', icon: '📦', duration: '5 دقائق', technique: '4 ثوان لكل مرحلة (شهيق، حبس، زفير، حبس)', benefits: 'يحسن التركيز ويقلل التوتر' },
  { name: 'التنفس البطني', icon: '🫁', duration: '10 دقائق', technique: 'شهيق عميق من البطن، زفير بطيء', benefits: 'استرخاء عميق للجسم' },
  { name: 'تنفس الأنف المتبادل', icon: '👃', duration: '8 دقائق', technique: 'أغلق فتحة أنف واحدة بالتناوب', benefits: 'توازن الطاقة وصفاء الذهن' },
  { name: 'تنفس الأسد', icon: '🦁', duration: '3 دقائق', technique: 'شهيق عميق وزفير قوي مع إخراج اللسان', benefits: 'تحرير التوتر والطاقة السلبية' },
  { name: 'التنفس المنشط', icon: '⚡', duration: '5 دقائق', technique: 'شهيق وزفير سريع ومتتالي', benefits: 'زيادة الطاقة واليقظة' },
  { name: 'التنفس البطيء', icon: '🐌', duration: '10 دقائق', technique: 'شهيق وزفير بطيء جداً', benefits: 'هدوء عميق وخفض ضغط الدم' }
];

// 📚 قائمة القراءات المقترحة
const READING_SUGGESTIONS = [
  { title: 'قوة الآن', author: 'إيكهارت تول', icon: '📖', category: 'تطوير ذاتي', pages: '236 صفحة', rating: '4.8/5' },
  { title: 'العادات الذرية', author: 'جيمس كلير', icon: '⚛️', category: 'إنتاجية', pages: '320 صفحة', rating: '4.9/5' },
  { title: 'فن اللامبالاة', author: 'مارك مانسون', icon: '🎯', category: 'فلسفة', pages: '224 صفحة', rating: '4.6/5' },
  { title: 'السر', author: 'روندا بايرن', icon: '🔮', category: 'إلهام', pages: '198 صفحة', rating: '4.5/5' },
  { title: 'الرجل الذي حسب زوجته قبعة', author: 'أوليفر ساكس', icon: '🧠', category: 'علم نفس', pages: '256 صفحة', rating: '4.7/5' },
  { title: 'ابدأ بلماذا', author: 'سيمون سينك', icon: '❓', category: 'قيادة', pages: '256 صفحة', rating: '4.8/5' },
  { title: 'التفكير السريع والبطيء', author: 'دانيال كانيمان', icon: '🤔', category: 'علم نفس', pages: '499 صفحة', rating: '4.6/5' },
  { title: 'لغات الحب الخمس', author: 'غاري تشابمان', icon: '💕', category: 'علاقات', pages: '204 صفحة', rating: '4.7/5' }
];

// 👥 قائمة النشاطات الاجتماعية
const SOCIAL_ACTIVITIES = [
  { name: 'اتصل بصديق قديم', icon: '📞', duration: '20 دقيقة', benefits: 'تقوية الروابط الاجتماعية' },
  { name: 'نزهة مع العائلة', icon: '👨‍👩‍👧‍👦', duration: 'ساعة واحدة', benefits: 'تعزيز الروابط الأسرية' },
  { name: 'انضم لمجموعة هواية', icon: '🎨', duration: 'أسبوعي', benefits: 'تكوين صداقات جديدة' },
  { name: 'تطوع في جمعية خيرية', icon: '🤝', duration: 'حسب الرغبة', benefits: 'إحساس بالعطاء والسعادة' },
  { name: 'قهوة مع صديق', icon: '☕', duration: '30 دقيقة', benefits: 'دعم اجتماعي ومشاركة المشاعر' },
  { name: 'لعب جماعي', icon: '🎮', duration: 'ساعة واحدة', benefits: 'متعة وترفيه مشترك' },
  { name: 'حضور فعالية اجتماعية', icon: '🎉', duration: 'حسب الفعالية', benefits: 'توسيع الدائرة الاجتماعية' },
  { name: 'مساعدة جار', icon: '🏘️', duration: '30 دقيقة', benefits: 'تقوية المجتمع المحلي' }
];

// 🎯 قائمة النشاطات العامة
const GENERAL_ACTIVITIES = [
  { name: 'الكتابة اليومية', icon: '📝', duration: '15 دقيقة', benefits: 'تفريغ المشاعر وتنظيم الأفكار' },
  { name: 'رسم أو تلوين', icon: '🎨', duration: '30 دقيقة', benefits: 'تعبير إبداعي واسترخاء' },
  { name: 'البستنة', icon: '🌱', duration: '30 دقيقة', benefits: 'اتصال بالطبيعة وإحساس بالإنجاز' },
  { name: 'الطبخ', icon: '🍳', duration: '45 دقيقة', benefits: 'إبداع وتغذية صحية' },
  { name: 'التصوير الفوتوغرافي', icon: '📸', duration: 'حسب الرغبة', benefits: 'تقدير الجمال والإبداع' },
  { name: 'تعلم شيء جديد', icon: '🎓', duration: '30 دقيقة', benefits: 'تحفيز الدماغ والنمو الشخصي' },
  { name: 'ترتيب الغرفة', icon: '🧹', duration: '20 دقيقة', benefits: 'بيئة منظمة وذهن صافي' },
  { name: 'الاستماع لبودكاست', icon: '🎧', duration: '30 دقيقة', benefits: 'تعلم وترفيه' },
  { name: 'ممارسة هواية', icon: '🎸', duration: 'حسب الرغبة', benefits: 'متعة وإبداع' },
  { name: 'تحضير قائمة أهداف', icon: '✅', duration: '15 دقيقة', benefits: 'وضوح ورؤية للمستقبل' }
];

// 🎯 قاعدة بيانات التوصيات حسب المزاج
const MOOD_RECOMMENDATIONS = {
  // مزاج سعيد 😊
  '😊': [
    { title: 'اكتب ما يجعلك سعيداً', description: 'سجّل اللحظات الجميلة في مذكرتك اليومية', category: 'activity', icon: '📝' },
    { title: 'شارك السعادة', description: 'اتصل بصديق وشارك معه خبراً جميلاً', category: 'social', icon: '💬' },
    { title: 'استمتع بالموسيقى', description: 'استمع لأغانيك المفضلة وارقص قليلاً', category: 'music', icon: '🎵' },
    { title: 'تمرين خفيف', description: 'اذهب للمشي في الهواء الطلق', category: 'exercise', icon: '🚶' }
  ],
  
  // مزاج حزين 😢
  '😢': [
    { title: 'تنفس بعمق', description: 'خذ 5 أنفاس عميقة بطيئة لتهدئة نفسك', category: 'breathing', icon: '🌬️' },
    { title: 'اكتب مشاعرك', description: 'عبّر عن مشاعرك بالكتابة بدون حكم على نفسك', category: 'activity', icon: '✍️' },
    { title: 'استمع لموسيقى هادئة', description: 'استرخ مع موسيقى هادئة أو أصوات الطبيعة', category: 'music', icon: '🎼' },
    { title: 'تواصل مع أحبائك', description: 'لا تكن وحيداً، تحدث مع شخص تثق به', category: 'social', icon: '🤗' },
    { title: 'مشروب دافئ', description: 'اصنع كوب شاي أو قهوة واسترخ', category: 'food', icon: '☕' }
  ],
  
  // مزاج قلق 😰
  '😰': [
    { title: 'تأمل لمدة 5 دقائق', description: 'مارس التأمل الموجه للتخفيف من القلق', category: 'meditation', icon: '🧘' },
    { title: 'تمارين التنفس', description: 'تقنية 4-7-8: استنشق 4 ثوان، احبس 7، ازفر 8', category: 'breathing', icon: '💨' },
    { title: 'اكتب مخاوفك', description: 'اكتب ما يقلقك ثم اكتب حلول ممكنة', category: 'activity', icon: '📋' },
    { title: 'مشي سريع', description: 'المشي السريع يساعد في تخفيف التوتر', category: 'exercise', icon: '🏃' },
    { title: 'موسيقى مهدئة', description: 'استمع لموسيقى الاسترخاء أو أصوات المطر', category: 'music', icon: '🌧️' }
  ],
  
  // مزاج غاضب 😠
  '😠': [
    { title: 'توقف وتنفس', description: 'خذ 10 أنفاس عميقة قبل أي رد فعل', category: 'breathing', icon: '🛑' },
    { title: 'تمرين رياضي مكثف', description: 'أفرغ طاقة الغضب في تمارين القوة أو الجري', category: 'exercise', icon: '💪' },
    { title: 'اكتب رسالة لا ترسلها', description: 'اكتب كل ما تشعر به ثم مزق الورقة', category: 'activity', icon: '💌' },
    { title: 'موسيقى هادئة', description: 'استمع لموسيقى كلاسيكية أو هادئة', category: 'music', icon: '🎻' },
    { title: 'استحم بماء بارد', description: 'الماء البارد يساعد في خفض حرارة الغضب', category: 'activity', icon: '🚿' }
  ],
  
  // مزاج متعب 😫
  '😫': [
    { title: 'خذ قيلولة قصيرة', description: 'استرح لمدة 20 دقيقة فقط', category: 'activity', icon: '😴' },
    { title: 'تناول وجبة خفيفة صحية', description: 'فواكه أو مكسرات لاستعادة الطاقة', category: 'food', icon: '🥗' },
    { title: 'تمدد بسيط', description: 'تمارين تمدد لتنشيط الدورة الدموية', category: 'exercise', icon: '🤸' },
    { title: 'موسيقى منعشة', description: 'استمع لموسيقى محفزة لرفع الطاقة', category: 'music', icon: '🎶' },
    { title: 'اشرب ماء', description: 'قد يكون التعب بسبب الجفاف، اشرب كوبين من الماء', category: 'food', icon: '💧' }
  ],
  
  // مزاج محايد 😐
  '😐': [
    { title: 'حدد هدف صغير', description: 'اختر نشاط بسيط لإنجازه اليوم', category: 'activity', icon: '🎯' },
    { title: 'استكشف هواية جديدة', description: 'جرب شيء جديد لكسر الروتين', category: 'activity', icon: '🎨' },
    { title: 'تمشى في الطبيعة', description: 'المشي في الهواء الطلق ينشط العقل', category: 'exercise', icon: '🌳' },
    { title: 'اقرأ شيء ملهم', description: 'اقرأ مقالة أو كتاب محفز', category: 'reading', icon: '📚' },
    { title: 'استمع لبودكاست', description: 'بودكاست ملهم أو تعليمي', category: 'music', icon: '🎙️' }
  ],
  
  // مزاج متحمس 🤗
  '🤗': [
    { title: 'ابدأ مشروع جديد', description: 'استثمر طاقتك في شيء إبداعي', category: 'activity', icon: '🚀' },
    { title: 'شارك حماسك', description: 'ألهم الآخرين بطاقتك الإيجابية', category: 'social', icon: '✨' },
    { title: 'تمرين طاقة عالية', description: 'جرب تمارين HIIT أو الرقص', category: 'exercise', icon: '🔥' },
    { title: 'تعلم مهارة جديدة', description: 'ابدأ كورس أونلاين في مجال يهمك', category: 'reading', icon: '🎓' },
    { title: 'موسيقى محفزة', description: 'استمع لموسيقى نشيطة ومحفزة', category: 'music', icon: '🎸' }
  ],
  
  // مزاج وحيد 🥺
  '🥺': [
    { title: 'اتصل بصديق', description: 'تواصل مع شخص تحبه، حتى لو رسالة قصيرة', category: 'social', icon: '📞' },
    { title: 'انضم لمجتمع أونلاين', description: 'شارك في مجموعة بنفس اهتماماتك', category: 'social', icon: '👥' },
    { title: 'تطوع', description: 'ساعد الآخرين، سيشعرك بالاتصال', category: 'activity', icon: '🤝' },
    { title: 'اذهب لمكان عام', description: 'مقهى أو مكتبة، التواجد بين الناس يساعد', category: 'activity', icon: '☕' },
    { title: 'اكتب رسالة امتنان', description: 'اكتب لشخص تقدره', category: 'activity', icon: '💝' }
  ]
};

// 🎲 توصيات افتراضية لمزاجات غير معروفة
const DEFAULT_RECOMMENDATIONS = [
  { title: 'تنفس بوعي', description: 'خذ دقيقة للتنفس العميق والتركيز على اللحظة الحالية', category: 'breathing', icon: '🌬️' },
  { title: 'تحرك قليلاً', description: 'قم بتمرين بسيط أو تمدد سريع', category: 'exercise', icon: '🏃' },
  { title: 'اشرب ماء', description: 'الترطيب مهم للصحة النفسية والجسدية', category: 'food', icon: '💧' },
  { title: 'استمع للموسيقى', description: 'اختر موسيقى تناسب مزاجك الحالي', category: 'music', icon: '🎵' }
];

// 🎯 توليد توصيات بناءً على المزاج
exports.generateRecommendations = async (userId, moodEmoji, moodId = null) => {
  try {
    // اختيار التوصيات المناسبة للمزاج
    const moodRecommendations = MOOD_RECOMMENDATIONS[moodEmoji] || DEFAULT_RECOMMENDATIONS;
    
    // إنشاء التوصيات في قاعدة البيانات
    const recommendations = [];
    for (const rec of moodRecommendations) {
      // إضافة suggestions و audio_url حسب الفئة
      let suggestions = null;
      let audio_url = null;
      
      switch (rec.category) {
        case 'food':
          // إضافة اقتراحات المشروبات الدافئة
          suggestions = JSON.stringify(WARM_DRINKS);
          break;
        
        case 'music':
          // إضافة قائمة موسيقى
          suggestions = JSON.stringify(RELAXING_MUSIC);
          // اختيار موسيقى عشوائية
          const randomMusic = RELAXING_MUSIC[Math.floor(Math.random() * RELAXING_MUSIC.length)];
          audio_url = randomMusic.url;
          break;
        
        case 'exercise':
          // إضافة اقتراحات التمارين الرياضية
          suggestions = JSON.stringify(EXERCISES);
          break;
        
        case 'meditation':
          // إضافة اقتراحات تمارين التأمل
          suggestions = JSON.stringify(MEDITATION_EXERCISES);
          break;
        
        case 'breathing':
          // إضافة اقتراحات تمارين التنفس
          suggestions = JSON.stringify(BREATHING_EXERCISES);
          break;
        
        case 'reading':
          // إضافة اقتراحات القراءة
          suggestions = JSON.stringify(READING_SUGGESTIONS);
          break;
        
        case 'social':
          // إضافة اقتراحات النشاطات الاجتماعية
          suggestions = JSON.stringify(SOCIAL_ACTIVITIES);
          break;
        
        case 'activity':
          // إضافة اقتراحات النشاطات العامة
          suggestions = JSON.stringify(GENERAL_ACTIVITIES);
          break;
      }
      
      const recommendation = await Recommendation.create({
        user_id: userId,
        mood_id: moodId,
        mood_emoji: moodEmoji,
        title: rec.title,
        description: rec.description,
        category: rec.category,
        icon: rec.icon,
        suggestions: suggestions,
        audio_url: audio_url,
        completed: false
      });
      recommendations.push(recommendation);
    }
    
    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
};

// 🟢 جلب التوصيات للمستخدم الحالي
exports.getMyRecommendations = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { mood_emoji, limit = 10 } = req.query;

    let whereClause = { user_id };
    
    // إذا كان المستخدم يريد توصيات لمزاج معين
    if (mood_emoji) {
      whereClause.mood_emoji = mood_emoji;
    }

    const recommendations = await Recommendation.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit)
    });

    res.status(200).json({
      message: 'Recommendations fetched successfully',
      count: recommendations.length,
      recommendations
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 🟡 جلب توصيات لمزاج معين بدون حفظها
exports.getRecommendationsByMood = async (req, res) => {
  try {
    const { mood_emoji } = req.params;
    
    const moodRecommendations = MOOD_RECOMMENDATIONS[mood_emoji] || DEFAULT_RECOMMENDATIONS;
    
    res.status(200).json({
      message: 'Recommendations generated successfully',
      mood: mood_emoji,
      count: moodRecommendations.length,
      recommendations: moodRecommendations
    });
  } catch (error) {
    console.error('Error getting mood recommendations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 🔵 حذف توصية معينة
exports.deleteRecommendation = async (req, res) => {
  try {
    const { recommendation_id } = req.params;
    const recommendation = await Recommendation.findByPk(recommendation_id);

    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    // التأكد أن صاحب التوكن هو صاحب التوصية
    if (recommendation.user_id !== req.user.user_id) {
      return res.status(403).json({ message: 'You can only delete your own recommendations' });
    }

    await recommendation.destroy();
    res.status(200).json({ message: 'Recommendation deleted successfully' });
  } catch (error) {
    console.error('Error deleting recommendation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 🟣 حذف كل التوصيات للمستخدم (تنظيف)
exports.clearMyRecommendations = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    
    const deletedCount = await Recommendation.destroy({
      where: { user_id }
    });

    res.status(200).json({ 
      message: 'All recommendations cleared successfully',
      deletedCount 
    });
  } catch (error) {
    console.error('Error clearing recommendations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 🟢 تحديث حالة التوصية (مكتملة أم لا)
exports.updateRecommendationStatus = async (req, res) => {
  try {
    const { recommendation_id } = req.params;
    const { completed } = req.body;
    
    const recommendation = await Recommendation.findByPk(recommendation_id);
    
    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }
    
    // التأكد أن صاحب التوكن هو صاحب التوصية
    if (recommendation.user_id !== req.user.user_id) {
      return res.status(403).json({ message: 'You can only update your own recommendations' });
    }
    
    recommendation.completed = completed;
    await recommendation.save();
    
    res.status(200).json({ 
      message: 'Recommendation status updated successfully',
      recommendation 
    });
  } catch (error) {
    console.error('Error updating recommendation status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 📷 رفع صورة إثبات للتوصية
exports.uploadProofImage = async (req, res) => {
  try {
    const { recommendation_id } = req.params;
    const { image_url } = req.body; // يمكن استخدام base64 أو URL
    
    const recommendation = await Recommendation.findByPk(recommendation_id);
    
    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }
    
    // التأكد أن صاحب التوكن هو صاحب التوصية
    if (recommendation.user_id !== req.user.user_id) {
      return res.status(403).json({ message: 'You can only update your own recommendations' });
    }
    
    recommendation.proof_image_url = image_url;
    recommendation.completed = true; // تلقائياً تصبح مكتملة عند رفع الصورة
    await recommendation.save();
    
    res.status(200).json({ 
      message: 'Proof image uploaded successfully',
      recommendation 
    });
  } catch (error) {
    console.error('Error uploading proof image:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 🎵 الحصول على قائمة الموسيقى المهدئة
exports.getRelaxingMusic = async (req, res) => {
  try {
    res.status(200).json({
      message: 'Relaxing music list',
      count: RELAXING_MUSIC.length,
      music: RELAXING_MUSIC
    });
  } catch (error) {
    console.error('Error getting relaxing music:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ☕ الحصول على قائمة المشروبات الدافئة
exports.getWarmDrinks = async (req, res) => {
  try {
    res.status(200).json({
      message: 'Warm drinks list',
      count: WARM_DRINKS.length,
      drinks: WARM_DRINKS
    });
  } catch (error) {
    console.error('Error getting warm drinks:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
