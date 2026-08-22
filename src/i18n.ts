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
  newBoardPrompt: { en: 'Name your new board', ar: 'سمِّ لوحتك الجديدة' },
  renameBoard: { en: 'Rename this board', ar: 'إعادة تسمية اللوحة' },
  renameBoardTitle: { en: 'Rename board', ar: 'إعادة تسمية اللوحة' },
  deleteBoard: { en: 'Delete this board', ar: 'حذف هذه اللوحة' },
  deleteBoardBlocked: {
    en: 'You need at least one board.',
    ar: 'تحتاج إلى لوحة واحدة على الأقل.',
  },
  deleteBoardTitle: { en: 'Delete this board?', ar: 'حذف هذه اللوحة؟' },
  // Names the board and states the blast radius: the cascade reaches well past
  // the canvas you are looking at, so the count has to be on screen.
  confirmDeleteBoard: {
    en: 'Deleting "{name}" also deletes everything hanging off it: {v} visions, {m} month goals, {w} week goals and {t} tasks. Ctrl+Z undoes it.',
    ar: 'حذف "{name}" يحذف أيضاً كل ما يتبعها: {v} رؤية، و{m} هدفاً شهرياً، و{w} هدفاً أسبوعياً، و{t} مهمة. Ctrl+Z للتراجع.',
  },
  confirmDeleteBoardEmpty: {
    en: 'Delete "{name}"? Nothing is on it yet.',
    ar: 'حذف "{name}"؟ لا يوجد عليها شيء بعد.',
  },
  save: { en: 'Save', ar: 'حفظ' },
  account: { en: 'Account', ar: 'الحساب' },
  settings: { en: 'Settings', ar: 'الإعدادات' },
  exportPngBusy: { en: 'Rendering PNG...', ar: 'جارٍ إنشاء PNG...' },
  exportPngEmpty: {
    en: 'Nothing on this board to export yet.',
    ar: 'لا يوجد شيء على هذه اللوحة للتصدير بعد.',
  },
  yourProfile: { en: 'Your profile', ar: 'ملفك' },
  displayName: { en: 'Name', ar: 'الاسم' },
  displayNameHint: {
    en: 'This is what the people in Together see.',
    ar: 'هذا ما يراه من معك.',
  },
  pickEmoji: { en: 'Avatar', ar: 'الصورة الرمزية' },
  noEmoji: { en: 'Use my initial', ar: 'استخدم الحرف الأول' },
  avatarColor: { en: 'Colour', ar: 'اللون' },
  profileSaved: { en: 'Profile saved', ar: 'تم حفظ الملف' },
  signIn: { en: 'Sign in', ar: 'تسجيل الدخول' },
  signOut: { en: 'Sign out', ar: 'تسجيل الخروج' },
  sendLink: { en: 'Send link', ar: 'إرسال الرابط' },
  signInBlurb: {
    en: 'Sign in to back up your board and reach it from any device. We email you a link — no password.',
    ar: 'سجّل الدخول لحفظ لوحتك والوصول إليها من أي جهاز. سنرسل رابطاً على بريدك — بدون كلمة مرور.',
  },
  magicLinkSent: {
    en: 'Check your email and open the link to finish signing in.',
    ar: 'افتح بريدك واضغط الرابط لإكمال تسجيل الدخول.',
  },
  syncedMsg: { en: 'Your board is backed up.', ar: 'لوحتك محفوظة في السحابة.' },
  syncingMsg: { en: 'Syncing…', ar: 'جارٍ المزامنة…' },
  syncErrorMsg: {
    en: "Sync failed — your work is still saved on this device.",
    ar: 'فشلت المزامنة — عملك ما زال محفوظاً على هذا الجهاز.',
  },
  syncedShort: { en: 'Synced', ar: 'متزامن' },
  offlineShort: { en: 'Local only', ar: 'محلي فقط' },

  // ---------- together / social ----------
  tabCircle: { en: 'Together', ar: 'معاً' },
  tabArchive: { en: 'History', ar: 'السجل' },
  archiveBlurb: {
    en: 'Every month you have planned. The planning tabs only show now — this is the record.',
    ar: 'كل شهر خطّطت فيه. تبويبات التخطيط تعرض الحاضر فقط — وهذا هو السجل.',
  },
  archiveEmpty: {
    en: 'Nothing here yet. Set a month goal and it will start filling up.',
    ar: 'لا شيء بعد. ضع هدفاً شهرياً وسيبدأ بالامتلاء.',
  },
  thisMonthPill: { en: 'now', ar: 'الآن' },
  tasksWord: { en: 'tasks', ar: 'مهمة' },
  unfinished: { en: 'unfinished', ar: 'لم يكتمل' },
  circle: { en: 'Together', ar: 'معاً' },
  circleBlurb: {
    en: "One or two people going through it with you — they'll notice when you go quiet.",
    ar: 'شخص أو اثنان يسيران معك — سيلاحظان إذا توقفت.',
  },
  circleNeedsCloud: {
    en: 'Sharing needs the cloud, which is not configured in this build.',
    ar: 'المشاركة تحتاج السحابة، وهي غير مُهيّأة في هذه النسخة.',
  },
  circleNeedsSignIn: {
    en: 'Sign in first — pairing needs an account on both sides.',
    ar: 'سجّل الدخول أولاً — الاقتران يحتاج حساباً من الطرفين.',
  },
  yourCircle: { en: 'Doing this with you', ar: 'يسيرون معك' },
  noFriendsTitle: { en: 'Nobody here yet', ar: 'لا أحد هنا بعد' },
  addAFriendHint: { en: 'Share a code', ar: 'شارك رمزاً' },
  perfectDay: { en: 'Everything done today', ar: 'أنجز كل شيء اليوم' },
  daysQuiet: { en: 'd quiet', ar: ' يوم بلا حركة' },
  earlierNudges: { en: 'Earlier nudges', ar: 'تنبيهات سابقة' },
  nudgeThemToStart: { en: 'Give them a nudge', ar: 'نبّهه ليبدأ' },
  allClear: { en: 'Nothing left today', ar: 'لا شيء متبقٍ اليوم' },
  copied: { en: 'Copied', ar: 'تم النسخ' },
  or: { en: 'or', ar: 'أو' },
  noFriendsYet: {
    en: 'Nobody yet. Share your code below with one person who will actually ask you about it.',
    ar: 'لا أحد بعد. شارك رمزك أدناه مع شخص واحد سيسألك عنه فعلاً.',
  },
  addAFriend: { en: 'Add someone', ar: 'إضافة شخص' },
  yourCode: { en: 'Your invite code', ar: 'رمز الدعوة الخاص بك' },
  showMyCode: { en: 'Show my code', ar: 'أظهر رمزي' },
  copy: { en: 'Copy', ar: 'نسخ' },
  codeHint: {
    en: 'Send this to one person. It works for 14 days.',
    ar: 'أرسل هذا لشخص واحد. صالح لمدة ١٤ يوماً.',
  },
  haveACode: { en: 'Got a code from someone?', ar: 'لديك رمز من شخص ما؟' },
  connect: { en: 'Connect', ar: 'اتصال' },
  codeInvalid: { en: 'That code is wrong or expired.', ar: 'هذا الرمز خطأ أو منتهي.' },
  codeIsYours: { en: "That's your own code.", ar: 'هذا رمزك أنت.' },
  unnamedFriend: { en: 'Someone', ar: 'شخص' },
  doneToday: { en: 'done today', ar: 'مُنجز اليوم' },
  nothingPlannedToday: { en: 'Nothing planned today.', ar: 'لا شيء مخطط اليوم.' },
  quiet: { en: 'quiet', ar: 'صامت' },
  viewBoard: { en: 'View board', ar: 'عرض اللوحة' },
  unfriend: { en: 'Disconnect', ar: 'إلغاء الاتصال' },
  unfriendConfirm: {
    en: 'Disconnect from this person? Neither of you will see the other\'s board.',
    ar: 'إلغاء الاتصال بهذا الشخص؟ لن يرى أي منكما لوحة الآخر.',
  },
  sharingReadOnlyNote: {
    en: 'Sharing is read-only in both directions — a friend can see your board but never change it.',
    ar: 'المشاركة للقراءة فقط في الاتجاهين — يمكن لصديقك رؤية لوحتك دون تغييرها.',
  },

  // ---------- friend board ----------
  readOnlyBoard: { en: 'Read-only view', ar: 'عرض للقراءة فقط' },
  theirVisions: { en: 'Their visions', ar: 'رؤاهم' },
  theirToday: { en: 'Their today', ar: 'يومهم' },
  noVisionsShared: { en: 'No visions on their board yet.', ar: 'لا رؤى في لوحتهم بعد.' },
  loading: { en: 'Loading…', ar: 'جارٍ التحميل…' },
  starving: { en: 'starving', ar: 'مهملة' },
  tapVisionHint: {
    en: 'Tap a vision to see the goals behind it',
    ar: 'اضغط على رؤية لترى الأهداف خلفها',
  },
  noGoalsForVision: {
    en: 'No goals attached to this vision yet.',
    ar: 'لا أهداف مرتبطة بهذه الرؤية بعد.',
  },
  noWeekGoals: { en: 'No week goals under this month.', ar: 'لا أهداف أسبوعية تحت هذا الشهر.' },
  noTasksYet: { en: 'No tasks yet.', ar: 'لا مهام بعد.' },

  // ---------- nudges ----------
  nudge: { en: 'Nudge', ar: 'تنبيه' },
  nudged: { en: 'Nudged', ar: 'تم' },
  sendNudge: { en: 'Send', ar: 'إرسال' },
  nudgeAbout: { en: 'Nudge about', ar: 'تنبيه بشأن' },
  nudgePlaceholder: {
    en: 'Optional — one line, kind or blunt',
    ar: 'اختياري — سطر واحد، لطيف أو صريح',
  },
  nudgesLeft: { en: 'nudges left today', ar: 'تنبيهات متاحة اليوم' },
  budgetGone: {
    en: "You've used today's nudges for this person. Three a day is the cap.",
    ar: 'استخدمت تنبيهات اليوم لهذا الشخص. ثلاثة يومياً هو الحد.',
  },
  nudgesForYou: { en: 'Nudges for you', ar: 'تنبيهات لك' },
  markRead: { en: 'Got it', ar: 'فهمت' },
  boardNamePlaceholder: {
    en: 'e.g. Health, Career, Money',
    ar: 'مثال: الصحة، العمل، المال',
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
  addVision: { en: 'Add vision', ar: 'إضافة رؤية' },
  addVisionTitle: {
    en: 'Add a vision — pick an image of something you want',
    ar: 'أضف رؤية — اختر صورة لشيء تريده',
  },
  emptyBoardTitle: { en: 'Your board is empty', ar: 'لوحتك فارغة' },
  emptyBoardBody: {
    en: 'A vision is a picture of something you actually want. Everything else in the app hangs off it.',
    ar: 'الرؤية هي صورة لشيء تريده فعلاً. كل شيء آخر في التطبيق يتفرع منها.',
  },
  emptyBoardCta: { en: 'Add your first vision', ar: 'أضف رؤيتك الأولى' },
  newBoardCreated: { en: 'New board', ar: 'لوحة جديدة' },
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
  goals: { en: 'open', ar: 'مفتوحة' },
  goalDone: { en: 'Done', ar: 'تم' },
  markGoalDone: {
    en: 'Mark finished — frees a slot for a new goal',
    ar: 'وسّمه كمنجَز — يفتح خانة لهدف جديد',
  },
  tabPlan: { en: 'Plan', ar: 'خطتي' },
  planBlurb: {
    en: 'Your month goals, the weekly slices under them, and today\'s tasks — one chain.',
    ar: 'أهداف شهرك، والشرائح الأسبوعية تحتها، ومهام اليوم — سلسلة واحدة.',
  },
  monthCap: { en: 'month', ar: 'شهر' },
  weekCap: { en: 'week', ar: 'أسبوع' },
  addTaskHere: { en: '+ Task', ar: '+ مهمة' },
  mitCapHit: { en: 'Already 3 starred today.', ar: 'ثلاث مهام مُنجَّمة اليوم بالفعل.' },
  expandAll: { en: 'Expand all', ar: 'افتح الكل' },
  collapseAll: { en: 'Collapse all', ar: 'اطوِ الكل' },
  noWeekGoalsUnder: { en: 'No weekly slice yet', ar: 'لا شريحة أسبوعية بعد' },
  addWeekGoalHere: { en: '+ Week goal', ar: '+ هدف أسبوعي' },
  weekGoalUnder: { en: 'Week goal under', ar: 'هدف أسبوعي تحت' },
  weekCapHitHere: {
    en: "Both week goals are taken. Finish one first.",
    ar: 'هدفا الأسبوع محجوزان. خلّص واحدًا أولاً.',
  },
  carriedOver: { en: 'Carried over', ar: 'مُرحَّل' },
  fromWeek: { en: 'from', ar: 'من' },
  capWayOut: {
    en: 'Tick off every task under a goal and you can close it — that frees the slot.',
    ar: 'أنجز كل المهام تحت أي هدف وستقدر تسكّره — وهذا يفتح الخانة.',
  },
  allTasksDoneHint: {
    en: 'Every task under this is done.',
    ar: 'كل المهام تحت هذا الهدف مُنجزة.',
  },
  closeIt: { en: 'Close it', ar: 'سكّره' },
  finishedThisMonth: { en: 'Finished this month', ar: 'أُنجز هذا الشهر' },
  finishedThisWeek: { en: 'Finished this week', ar: 'أُنجز هذا الأسبوع' },
  weekCapReached: {
    en: 'Two week goals is the cap.',
    ar: 'هدفان أسبوعيان هو الحد.',
  },
  reopen: { en: 'Reopen', ar: 'أعد فتحه' },
  stalledTitle: {
    en: 'These keep moving',
    ar: 'هذه تُؤجَّل باستمرار',
  },
  stalledBody: {
    en: 'These rolled over {n} times. Either today is the day, or they should leave the list.',
    ar: 'رُحّلت {n} مرات. إمّا أن يكون اليوم موعدها، أو أن تخرج من القائمة.',
  },
  postponedTimes: { en: 'postponed {n}×', ar: 'أُجّلت {n} مرات' },
  plannedFor: { en: 'planned for', ar: 'كانت ليوم' },
  doItToday: { en: 'Do it today', ar: 'أنجزها اليوم' },
  notNow: { en: 'Not now', ar: 'ليس الآن' },
  rolledOver: { en: 'carried over', ar: 'مُرحّلة' },
  reopenBlocked: {
    en: 'No free slot — close another goal first',
    ar: 'لا توجد خانة فارغة — سكّر هدفاً آخر أولاً',
  },
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
  cancel: { en: 'Cancel', ar: 'إلغاء' },
  create: { en: 'Create', ar: 'إنشاء' },
  confirmBtn: { en: 'Confirm', ar: 'تأكيد' },
  deleteQ: { en: 'Delete', ar: 'حذف' },

  // ---------- board / canvas chrome ----------
  // The canvas LAYOUT stays LTR by design, but its LABELS are UI text.
  starvingNothingYet: {
    en: 'Nothing finished yet for this vision',
    ar: 'لم يُنجز شيء لهذه الرؤية بعد',
  },
  starvingSince: {
    en: '{n} days since you finished anything here',
    ar: 'مضى {n} يوماً دون إنجاز أي شيء هنا',
  },
  rotateHint: { en: 'Rotate (Shift = 15°)', ar: 'تدوير (Shift = ١٥°)' },
  undoTitle: { en: 'Undo (Ctrl+Z)', ar: 'تراجع (Ctrl+Z)' },
  redoTitle: { en: 'Redo (Ctrl+Y)', ar: 'إعادة (Ctrl+Y)' },
  duplicateTitle: { en: 'Duplicate (Ctrl+D)', ar: 'تكرار (Ctrl+D)' },
  resetZoom: { en: 'Reset to 100%', ar: 'العودة إلى ١٠٠٪' },
  dropImagesHint: {
    en: 'Drop images anywhere, or use the toolbar.',
    ar: 'أفلِت الصور في أي مكان، أو استخدم شريط الأدوات.',
  },
  dropImagesSub: {
    en: 'Images become visions — the only elements you can attach goals to.',
    ar: 'الصور تصبح رؤى — وهي العناصر الوحيدة التي يمكن ربط الأهداف بها.',
  },

  // ---------- inspector ----------
  boardEmptyShort: { en: 'Nothing on the board yet.', ar: 'لا يوجد شيء على اللوحة بعد.' },
  alignLabel: { en: 'Align', ar: 'محاذاة' },
  // Geometric — the board keeps absolute x/y, so these stay physical.
  alignLeftEdge: { en: 'Align left edges', ar: 'محاذاة الحدود اليسرى' },
  alignRightEdge: { en: 'Align right edges', ar: 'محاذاة الحدود اليمنى' },
  // 'start'/'end' rather than left/right: in Arabic the leading edge is on the right.
  alignStart: { en: 'Align to the leading edge', ar: 'محاذاة إلى الحافة الأمامية' },
  alignEnd: { en: 'Align to the trailing edge', ar: 'محاذاة إلى الحافة الخلفية' },
  alignHCenter: { en: 'Centre horizontally', ar: 'توسيط أفقي' },
  alignTop: { en: 'Align top', ar: 'محاذاة للأعلى' },
  alignBottom: { en: 'Align bottom', ar: 'محاذاة للأسفل' },
  alignVCenter: { en: 'Centre vertically', ar: 'توسيط رأسي' },
  weightRegular: { en: 'Reg', ar: 'عادي' },
  weightSemi: { en: 'Semi', ar: 'متوسط' },
  weightBold: { en: 'Bold', ar: 'عريض' },
  toFront: { en: 'Bring to front', ar: 'إلى الأمام تماماً' },
  forward: { en: 'Forward', ar: 'للأمام' },
  backward: { en: 'Backward', ar: 'للخلف' },
  toBack: { en: 'Send to back', ar: 'إلى الخلف تماماً' },

  // ---------- minimap ----------
  showMinimap: { en: 'Show minimap', ar: 'إظهار الخريطة المصغرة' },
  hideMinimap: { en: 'Hide minimap', ar: 'إخفاء الخريطة المصغرة' },
  minimapHint: { en: 'Click or drag to navigate', ar: 'انقر أو اسحب للتنقل' },

  // ---------- images ----------
  imageTooLarge: {
    en: 'That image is too large — keep it under 12 MB.',
    ar: 'هذه الصورة كبيرة جداً — أبقِها أقل من ١٢ ميجابايت.',
  },
  imageInvalid: {
    en: 'That file is not an image the board can read.',
    ar: 'هذا الملف ليس صورة يمكن للوحة قراءتها.',
  },

  // ---------- carry-over ----------
  carriedFromMonth: { en: 'from {m}', ar: 'من {m}' },
  carriedFromWeek: { en: 'from {m}', ar: 'من {m}' },
  stillOpen: { en: 'still open', ar: 'ما زال مفتوحاً' },
  carriedTitle: {
    en: 'Still open from an earlier period — it carried forward instead of vanishing.',
    ar: 'ما زال مفتوحاً من فترة سابقة — تم ترحيله بدلاً من اختفائه.',
  },

  // ---------- pairing ----------
  codeThrottled: {
    en: 'Too many wrong codes. Wait an hour and try again.',
    ar: 'محاولات خاطئة كثيرة. انتظر ساعة ثم أعد المحاولة.',
  },
} as const;

export type StringKey = keyof typeof STRINGS;

export function translate(key: StringKey, lang: Lang): string {
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[lang] ?? entry.en;
}
