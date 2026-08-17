// Bilingual UI strings. English is the source of truth; Arabic is a real
// translation, not a transliteration — the coaching examples are localised to
// make sense for an Arabic speaker rather than translated word for word.

export type Lang = 'en' | 'ar';

export const LANGS: { id: Lang; label: string; native: string }[] = [
  { id: 'en', label: 'English', native: 'English' },
  { id: 'ar', label: 'Arabic', native: 'العربية' },
];

export const STRINGS = {
  // ---------- shell ----------
  appName: { en: 'Vision Grid', ar: 'شبكة الرؤية' },
  chainHint: {
    en: 'Vision → Month → Week → Day',
    ar: 'رؤية ← شهر ← أسبوع ← يوم',
  },
  tabBoard: { en: 'Board', ar: 'اللوحة' },
  tabMonth: { en: 'Month', ar: 'الشهر' },
  tabWeek: { en: 'Week', ar: 'الأسبوع' },
  tabToday: { en: 'Today', ar: 'اليوم' },
  newBoard: { en: 'New board', ar: 'لوحة جديدة' },
  newBoardPrompt: {
    en: 'Board name (e.g. Health, Career, Money)',
    ar: 'اسم اللوحة (مثل: الصحة، العمل، المال)',
  },
  activeBoardTitle: {
    en: "Active board — only this board's goals can get tasks",
    ar: 'اللوحة النشطة — أهداف هذه اللوحة فقط يمكن إضافة مهام لها',
  },
  exportJson: { en: 'Export all data as JSON', ar: 'تصدير كل البيانات JSON' },
  howItWorks: { en: 'How this works', ar: 'كيف يعمل التطبيق' },
  language: { en: 'Language', ar: 'اللغة' },

  // ---------- board toolbar ----------
  image: { en: 'Image', ar: 'صورة' },
  heading: { en: 'Heading', ar: 'عنوان' },
  body: { en: 'Body', ar: 'نص' },
  quote: { en: 'Quote', ar: 'اقتباس' },
  rectTool: { en: 'Rectangle (R) — drag to draw', ar: 'مستطيل (R) — اسحب للرسم' },
  ellipseTool: { en: 'Ellipse (O) — drag to draw', ar: 'دائرة (O) — اسحب للرسم' },
  undo: { en: 'Undo', ar: 'تراجع' },
  redo: { en: 'Redo', ar: 'إعادة' },
  duplicate: { en: 'Duplicate', ar: 'تكرار' },
  deleteEl: { en: 'Delete', ar: 'حذف' },
  zoomOut: { en: 'Zoom out', ar: 'تصغير' },
  zoomIn: { en: 'Zoom in', ar: 'تكبير' },
  fitAll: { en: 'Fit everything', ar: 'ملاءمة الكل' },
  exportPng: { en: 'Export PNG', ar: 'تصدير PNG' },

  // ---------- inspector ----------
  vision: { en: 'Vision', ar: 'رؤية' },
  text: { en: 'Text', ar: 'نص' },
  shape: { en: 'Shape', ar: 'شكل' },
  title: { en: 'Title', ar: 'العنوان' },
  whyMatters: { en: 'Why does this matter?', ar: 'لماذا هذا مهم؟' },
  whyPlaceholder: {
    en: "The reason you'll still care in November…",
    ar: 'السبب الذي سيبقيك مهتماً بعد أشهر…',
  },
  targetDate: { en: 'Target date', ar: 'التاريخ المستهدف' },
  imageFit: { en: 'Image fit', ar: 'ملاءمة الصورة' },
  cover: { en: 'Cover', ar: 'تغطية' },
  contain: { en: 'Contain', ar: 'احتواء' },
  cornerRadius: { en: 'Corner radius', ar: 'انحناء الزوايا' },
  replaceImage: { en: 'Replace image…', ar: 'استبدال الصورة…' },
  opacity: { en: 'Opacity', ar: 'الشفافية' },
  rotation: { en: 'Rotation', ar: 'الدوران' },
  arrange: { en: 'Arrange', ar: 'الترتيب' },
  lock: { en: 'Lock', ar: 'قفل' },
  unlock: { en: 'Unlock', ar: 'فتح' },
  size: { en: 'Size', ar: 'الحجم' },
  weight: { en: 'Weight', ar: 'السماكة' },
  align: { en: 'Align', ar: 'المحاذاة' },
  colour: { en: 'Colour', ar: 'اللون' },
  font: { en: 'Font', ar: 'الخط' },
  direction: { en: 'Direction', ar: 'اتجاه النص' },
  auto: { en: 'Auto', ar: 'تلقائي' },
  fill: { en: 'Fill', ar: 'التعبئة' },
  border: { en: 'Border', ar: 'الحدود' },
  borderWidth: { en: 'Border width', ar: 'سماكة الحدود' },
  background: { en: 'Background', ar: 'الخلفية' },
  layers: { en: 'Layers', ar: 'الطبقات' },
  boardPanel: { en: 'Board', ar: 'اللوحة' },
  selectedCount: { en: 'selected', ar: 'محدد' },
  inspectorHint: {
    en: 'Click an element to edit it. Drag on empty space to marquee-select.',
    ar: 'اضغط على عنصر لتعديله. اسحب في مساحة فارغة للتحديد المتعدد.',
  },

  // ---------- month ----------
  monthHeadHint: {
    en: 'Pick a vision, then name one result you can finish this month.',
    ar: 'اختر رؤية، ثم حدد نتيجة واحدة يمكنك إنجازها هذا الشهر.',
  },
  whichVision: { en: 'Which vision does this serve?', ar: 'أي رؤية يخدم هذا الهدف؟' },
  pickVision: { en: '— pick a vision —', ar: '— اختر رؤية —' },
  monthGoalLabel: {
    en: 'What will be DONE by the end of this month?',
    ar: 'ما الذي سيكون مُنجزاً بنهاية هذا الشهر؟',
  },
  monthGoalPlaceholder: {
    en: 'e.g. Run 5km without stopping',
    ar: 'مثال: الجري ٥ كم دون توقف',
  },
  addMonthGoal: { en: 'Add month goal', ar: 'إضافة هدف شهري' },
  noVisionsYet: {
    en: 'Add an image to your board first — goals need a vision to attach to.',
    ar: 'أضف صورة إلى لوحتك أولاً — الأهداف تحتاج رؤية ترتبط بها.',
  },
  monthCapReached: {
    en: 'Three goals is the cap. Finish or drop one before adding another.',
    ar: 'ثلاثة أهداف هي الحد الأقصى. أنجز أو احذف هدفاً قبل إضافة آخر.',
  },
  goals: { en: 'goals', ar: 'أهداف' },
  monthCapLine: {
    en: 'Three goals maximum. The limit is the feature — it forces you to choose.',
    ar: 'ثلاثة أهداف كحد أقصى. الحد هو الميزة — يجبرك على الاختيار.',
  },
  needVisionFirst: { en: 'You need a vision first.', ar: 'تحتاج رؤية أولاً.' },
  needVisionHint: {
    en: 'Go to Board and add an image — goals must attach to something you actually want.',
    ar: 'اذهب إلى اللوحة وأضف صورة — يجب أن ترتبط الأهداف بشيء تريده فعلاً.',
  },
  noGoalsThisMonth: {
    en: 'No goals this month yet. Pick up to three.',
    ar: 'لا أهداف هذا الشهر بعد. اختر حتى ثلاثة.',
  },
  serves: { en: 'serves', ar: 'يخدم' },
  weekGoalCount: { en: 'week goals', ar: 'أهداف أسبوعية' },
  confirmDeleteMonth: {
    en: 'Delete this goal and its week goals/tasks?',
    ar: 'حذف هذا الهدف وأهدافه الأسبوعية ومهامه؟',
  },
  confirmDeleteWeek: {
    en: 'Delete this week goal and its tasks?',
    ar: 'حذف هذا الهدف الأسبوعي ومهامه؟',
  },
  exBadFit: { en: 'Get fit', ar: 'أن أصبح لائقاً' },
  exGoodFit: { en: 'Run 5km without stopping', ar: 'الجري ٥ كم دون توقف' },
  exWhyFit: {
    en: "'Get fit' never ends. 5km is a finish line you can cross.",
    ar: '"أن أصبح لائقاً" لا ينتهي أبداً. ٥ كم خط نهاية يمكنك عبوره.',
  },
  exBadApp: { en: 'Work on the app', ar: 'العمل على التطبيق' },
  exGoodApp: { en: 'Ship the paid beta to 10 users', ar: 'إطلاق النسخة المدفوعة لـ ١٠ مستخدمين' },
  exWhyApp: {
    en: "'Work on' has no end. 10 users is countable.",
    ar: '"العمل على" بلا نهاية. ١٠ مستخدمين رقم قابل للعد.',
  },
  exBadSave: { en: 'Save money', ar: 'ادخار المال' },
  exGoodSave: { en: 'Move SAR 5,000 into savings', ar: 'تحويل ٥٬٠٠٠ ريال إلى المدخرات' },
  exWhySave: {
    en: 'A number turns a hope into a target.',
    ar: 'الرقم يحوّل الأمنية إلى هدف.',
  },
  exBadRun: { en: 'Start running', ar: 'أبدأ الجري' },
  exGoodRun: { en: 'Run 3 times this week, 2km each', ar: 'الجري ٣ مرات هذا الأسبوع، ٢ كم لكل مرة' },
  exWhyRun: {
    en: "A count and a distance. You'll know on Sunday if you did it.",
    ar: 'عدد ومسافة. ستعرف يوم الأحد إن كنت فعلتها.',
  },
  exBadCheckout: { en: 'Make progress on checkout', ar: 'إحراز تقدم في صفحة الدفع' },
  exGoodCheckout: { en: 'Stripe checkout works end to end in test mode', ar: 'صفحة الدفع تعمل كاملة في وضع الاختبار' },
  exWhyCheckout: {
    en: 'Names the finish line, not the activity.',
    ar: 'يحدد خط النهاية، لا النشاط.',
  },
  exBadFinance: { en: 'Sort out finances', ar: 'ترتيب الأمور المالية' },
  exGoodFinance: { en: "Cancel the 3 subscriptions I don't use", ar: 'إلغاء الاشتراكات الثلاثة التي لا أستخدمها' },
  exWhyFinance: {
    en: "You can start this in 10 seconds. The other one you'd avoid all week.",
    ar: 'يمكنك البدء بها خلال ١٠ ثوانٍ. الأخرى ستتجنبها طوال الأسبوع.',
  },
  exBadStripe: { en: 'Work on Stripe', ar: 'العمل على بوابة الدفع' },
  exGoodStripe: { en: 'Add the webhook endpoint and test one payment', ar: 'إضافة نقطة الويب هوك واختبار عملية دفع واحدة' },
  exWhyStripe: {
    en: "Specific enough that 'done' is obvious.",
    ar: 'محددة بما يكفي ليكون "الإنجاز" واضحاً.',
  },

  // ---------- week ----------
  weekHeadHint: {
    en: 'Pull one or two month goals into this week, then break them into day tasks.',
    ar: 'اسحب هدفاً أو هدفين من الشهر إلى هذا الأسبوع، ثم قسّمهما إلى مهام يومية.',
  },
  whichMonthGoal: { en: 'Which month goal are you advancing?', ar: 'أي هدف شهري تتقدم فيه؟' },
  pickMonthGoal: { en: '— pick a month goal —', ar: '— اختر هدفاً شهرياً —' },
  weekGoalLabel: { en: 'Week goal', ar: 'هدف الأسبوع' },
  weekGoalPlaceholder: {
    en: 'e.g. Run 3 times this week, 2km each',
    ar: 'مثال: الجري ٣ مرات هذا الأسبوع، ٢ كم لكل مرة',
  },
  addWeekGoal: { en: 'Add week goal', ar: 'إضافة هدف أسبوعي' },
  noMonthGoals: {
    en: 'No month goals yet. Go to Month and add one first.',
    ar: 'لا توجد أهداف شهرية بعد. اذهب إلى الشهر وأضف واحداً أولاً.',
  },
  nothingThisWeek: {
    en: 'Nothing pulled into this week yet.',
    ar: 'لم يتم سحب أي شيء إلى هذا الأسبوع بعد.',
  },
  taskPlaceholder: {
    en: '+ a task you could do today in one sitting',
    ar: '+ مهمة يمكنك إنجازها اليوم في جلسة واحدة',
  },
  add: { en: 'Add', ar: 'إضافة' },
  thisWeek: { en: 'This week', ar: 'هذا الأسبوع' },

  // ---------- today ----------
  todayEmpty: { en: 'No tasks today.', ar: 'لا مهام اليوم.' },
  todayEmptyHint: {
    en: 'Every task lives under a week goal — go to Week to add one.',
    ar: 'كل مهمة تنتمي لهدف أسبوعي — اذهب إلى الأسبوع لإضافة واحدة.',
  },
  nothingScheduled: {
    en: 'Nothing scheduled. Add tasks under a week goal.',
    ar: 'لا يوجد شيء مجدول. أضف مهاماً تحت هدف أسبوعي.',
  },
  mostImportant: { en: 'Most important', ar: 'الأهم' },
  everythingElse: { en: 'Everything else', ar: 'الباقي' },
  starHint: {
    en: "star up to 3 as today's most important",
    ar: 'ميّز حتى ٣ مهام كالأهم اليوم',
  },
  done: { en: 'done', ar: 'مُنجز' },
  markMit: { en: "Mark as one of today's 3 MITs", ar: 'ميّزها كإحدى أهم ٣ مهام اليوم' },

  // ---------- coach ----------
  coachMonthTitle: { en: 'How to write a month goal', ar: 'كيف تكتب هدفاً شهرياً' },
  coachMonthBody: {
    en: 'A month goal is one visible result you could finish in about 30 days — not a habit, not a wish, not a whole project.',
    ar: 'الهدف الشهري هو نتيجة واحدة واضحة يمكنك إنجازها خلال ٣٠ يوماً تقريباً — ليس عادة، ولا أمنية، ولا مشروعاً كاملاً.',
  },
  coachMonthRule: {
    en: 'Test it: on the last day of the month, could you point at something and say "there, that\'s done"? If not, it\'s too vague.',
    ar: 'اختبره: في آخر يوم من الشهر، هل يمكنك الإشارة إلى شيء وتقول "ها هو، أُنجز"؟ إن لم تستطع، فهو غامض.',
  },
  coachMonthFoot: {
    en: 'Three maximum. If everything matters, nothing does.',
    ar: 'ثلاثة كحد أقصى. إذا كان كل شيء مهماً، فلا شيء مهم.',
  },
  coachWeekTitle: { en: 'How to write a week goal', ar: 'كيف تكتب هدفاً أسبوعياً' },
  coachWeekBody: {
    en: 'A week goal is one slice of a month goal — the part you can realistically finish in 7 days, around your actual life.',
    ar: 'الهدف الأسبوعي هو شريحة من الهدف الشهري — الجزء الذي يمكنك إنجازه فعلياً خلال ٧ أيام، ضمن حياتك الواقعية.',
  },
  coachWeekRule: {
    en: 'Test it: could you finish this even in a bad week? If it needs everything to go perfectly, cut it in half.',
    ar: 'اختبره: هل يمكنك إنجازه حتى في أسبوع سيئ؟ إذا كان يحتاج أن يسير كل شيء بمثالية، فاقسمه إلى النصف.',
  },
  coachWeekFoot: {
    en: 'Two maximum — and one is often the honest answer.',
    ar: 'هدفان كحد أقصى — وغالباً هدف واحد هو الجواب الصادق.',
  },
  coachTodayTitle: { en: "How to pick today's tasks", ar: 'كيف تختار مهام اليوم' },
  coachTodayBody: {
    en: 'A task is one concrete action you could sit down and finish in a single sitting — usually 20–60 minutes. If it needs several sessions, it\'s still a goal.',
    ar: 'المهمة هي إجراء ملموس واحد يمكنك الجلوس وإنجازه في جلسة واحدة — عادة ٢٠ إلى ٦٠ دقيقة. إذا احتاج عدة جلسات، فهو لا يزال هدفاً.',
  },
  coachTodayRule: {
    en: 'Test it: do you know exactly what to do first? If you\'d have to think about "how do I even start", break it down further.',
    ar: 'اختبرها: هل تعرف بالضبط ما ستفعله أولاً؟ إذا كنت ستفكر "كيف أبدأ أصلاً"، فقسّمها أكثر.',
  },
  coachTodayFoot: {
    en: 'Star up to 3 as your MITs. If you only did those, the day counts.',
    ar: 'ميّز حتى ٣ كأهم مهامك. لو أنجزت هذه فقط، فاليوم ناجح.',
  },

  // ---------- guide ----------
  guideTitle: { en: 'How Vision Grid works', ar: 'كيف تعمل شبكة الرؤية' },
  guideLead: {
    en: 'One rule: nothing exists without a parent. Every task belongs to a week goal, every week goal to a month goal, every month goal to a picture of the life you want. That way the thing in front of you on a Tuesday is visibly connected to the reason you care.',
    ar: 'قاعدة واحدة: لا شيء يوجد بلا أصل. كل مهمة تنتمي لهدف أسبوعي، وكل هدف أسبوعي لهدف شهري، وكل هدف شهري لصورة الحياة التي تريدها. بهذا يكون ما أمامك يوم الثلاثاء مرتبطاً بوضوح بالسبب الذي تهتم لأجله.',
  },
  guideStep1Title: { en: 'Put a picture of what you want', ar: 'ضع صورة لما تريده' },
  guideStep1Body: {
    en: 'Drag an image onto the board. That image is a vision — the thing you are actually working toward. Give it a title and write why it matters.',
    ar: 'اسحب صورة إلى اللوحة. تلك الصورة هي رؤية — الشيء الذي تعمل فعلاً من أجله. أعطها عنواناً واكتب لماذا هي مهمة.',
  },
  guideStep1Hint: { en: 'Start with ONE. You can add more later.', ar: 'ابدأ بواحدة فقط. يمكنك إضافة المزيد لاحقاً.' },
  guideStep2Title: { en: 'Name one result for this month', ar: 'حدد نتيجة واحدة لهذا الشهر' },
  guideStep2Body: {
    en: 'Pick the vision, then write one thing that will be DONE in 30 days. Not a habit — a finish line you can point at.',
    ar: 'اختر الرؤية، ثم اكتب شيئاً واحداً سيكون مُنجزاً خلال ٣٠ يوماً. ليست عادة — بل خط نهاية يمكنك الإشارة إليه.',
  },
  guideStep2Hint: {
    en: 'e.g. "Run 5km without stopping", not "get fit".',
    ar: 'مثال: "الجري ٥ كم دون توقف"، وليس "أن أصبح لائقاً".',
  },
  guideStep3Title: { en: 'Slice off this week', ar: 'اقتطع جزء هذا الأسبوع' },
  guideStep3Body: {
    en: 'Take the month goal and ask: what part of it can I finish in 7 days, in my real life, even in a bad week?',
    ar: 'خذ الهدف الشهري واسأل: أي جزء منه يمكنني إنجازه خلال ٧ أيام، في حياتي الواقعية، حتى في أسبوع سيئ؟',
  },
  guideStep3Hint: { en: 'e.g. "Run 3 times, 2km each".', ar: 'مثال: "الجري ٣ مرات، ٢ كم لكل مرة".' },
  guideStep4Title: { en: 'Do one thing today', ar: 'أنجز شيئاً واحداً اليوم' },
  guideStep4Body: {
    en: 'Break the week goal into single-sitting actions. Star up to 3 as your most important. Tick them off as you go.',
    ar: 'قسّم الهدف الأسبوعي إلى إجراءات تُنجز في جلسة واحدة. ميّز حتى ٣ كالأهم. وضع علامة عليها كلما أنجزت.',
  },
  guideStep4Hint: {
    en: 'If you would have to think "how do I start?", it is still too big.',
    ar: 'إذا كنت ستفكر "كيف أبدأ؟"، فهي لا تزال كبيرة جداً.',
  },
  guideNextStep: { en: 'Your next step:', ar: 'خطوتك التالية:' },
  guideOpenTab: { en: 'open the', ar: 'افتح تبويب' },
  guideTab: { en: 'tab and', ar: 'ثم' },
  guideAllSet: {
    en: 'You have the full chain set up. Now just tick things off.',
    ar: 'لقد أكملت السلسلة كاملة. الآن فقط أنجز المهام.',
  },
  guideCaps: {
    en: 'Caps are deliberate: 3 month goals, 2 week goals, 3 starred tasks a day. The limit is the feature — it forces you to choose.',
    ar: 'الحدود مقصودة: ٣ أهداف شهرية، هدفان أسبوعيان، ٣ مهام مميزة يومياً. الحد هو الميزة — يجبرك على الاختيار.',
  },
  goTo: { en: 'Go to', ar: 'اذهب إلى' },
  gotIt: { en: 'Got it', ar: 'فهمت' },
  close: { en: 'Close', ar: 'إغلاق' },
} as const;

export type StringKey = keyof typeof STRINGS;

export function translate(key: StringKey, lang: Lang): string {
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[lang] ?? entry.en;
}
