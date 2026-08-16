import { PageTypeDefinition, DedicatedPage, PageContentItem, ProfessorProfileData } from './types';

export const PAGE_TYPE_REGISTRY: PageTypeDefinition[] = [
  {
    id: 'scientific_association',
    title: 'انجمن علمی',
    category: 'academic',
    description: 'صفحه پرتال اختصاصی انجمن‌های علمی دانشجویی، ارائه‌دهنده رویدادها، کارگاه‌ها و پروژه‌های تخصصی',
    iconName: 'GraduationCap',
    badge: 'دانشجویی / علمی',
    color: '#0284c7',
    bgGradient: 'from-sky-500 to-blue-600',
    isDisabled: false,
    defaultEnabledModules: ['hasNews', 'hasEvents', 'hasGallery', 'hasDocuments', 'hasBoardMembers', 'hasContactForm'],
    defaultTaxonomies: ['کارگاه‌های تخصصی', 'مسابقات و المپیادها', 'پروژه‌های پژوهشی', 'بازدیدهای علمی']
  },
  {
    id: 'cultural_club',
    title: 'کانون فرهنگی و هنری',
    category: 'cultural',
    description: 'پرتال کانون‌های فعال در حوزه‌های تئاتر، موسیقی، شعر و ادب، صنایع دستی، فیلم و عکس و خیریه',
    iconName: 'Palette',
    badge: 'فرهنگی / هنری',
    color: '#d97706',
    bgGradient: 'from-amber-500 to-orange-600',
    isDisabled: false,
    defaultEnabledModules: ['hasNews', 'hasEvents', 'hasGallery', 'hasBoardMembers', 'hasContactForm', 'hasUsefulLinks'],
    defaultTaxonomies: ['رویدادها و جشن‌ها', 'گالری آثار هنری', 'عضویت و فراخوان‌ها', 'کارگاه‌های مهارتی']
  },
  {
    id: 'student_union',
    title: 'تشکل دانشجویی',
    category: 'union',
    description: 'صفحات مستقل تشکل‌ها، شوراها، هیئت‌ها و کانون‌های صنفی و سیاسی دانشجویی دانشگاه',
    iconName: 'Users',
    badge: 'صنفی / تشکیلاتی',
    color: '#059669',
    bgGradient: 'from-emerald-500 to-teal-600',
    isDisabled: false,
    defaultEnabledModules: ['hasNews', 'hasEvents', 'hasDocuments', 'hasBoardMembers', 'hasContactForm', 'hasSurvey'],
    defaultTaxonomies: ['بیانیه‌ها و مواضع', 'جلسات و نشست‌ها', 'گزارش عملکرد صنفی', 'مطالبات دانشجویی']
  },
  {
    id: 'student_journal',
    title: 'نشریه دانشجویی',
    category: 'media',
    description: 'پرتال مستقل نشریات علمی، فرهنگی، تخصصی و گاهنامه‌های مصوب دانشگاه با آرشیو نسخه‌های PDF',
    iconName: 'BookOpen',
    badge: 'رسانه / مکتوب',
    color: '#7c3aed',
    bgGradient: 'from-violet-500 to-purple-600',
    isDisabled: false,
    defaultEnabledModules: ['hasNews', 'hasDocuments', 'hasBoardMembers', 'hasResearchArticles', 'hasContactForm'],
    defaultTaxonomies: ['آرشیو شماره‌های نشریه', 'مقالات برگزیده', 'هیئت تحریریه', 'فراخوان ارسال یادداشت']
  },
  {
    id: 'faculty_member',
    title: 'صفحه اختصاصی استاد',
    category: 'person',
    description: 'پرتال پروفایل رسمی اعضای هیات علمی و اساتید مدعو متصل به کارنامه پژوهشی، دروس و ساعات مشاوره',
    iconName: 'UserCheck',
    badge: 'هیات علمی / استاد',
    color: '#0d9488',
    bgGradient: 'from-teal-500 to-cyan-700',
    isDisabled: false,
    defaultEnabledModules: ['hasNews', 'hasResearchArticles', 'hasDocuments', 'hasContactForm', 'hasUsefulLinks'],
    defaultTaxonomies: ['دروس ترم جاری', 'مقالات و کتاب‌ها', 'پایان‌نامه‌های تحت راهنمایی', 'ساعات مشاوره و اطلاعیه‌ها']
  },
  {
    id: 'interactive_survey',
    title: 'پرسشنامه تعاملی',
    category: 'service',
    description: 'سامانه نظرسنجی و فرم‌های پیمایش هوشمند اختصاصی واحدها و مراکز پژوهشی دانشگاه',
    iconName: 'MessageSquareCheck',
    badge: 'در دست توسعه',
    color: '#64748b',
    bgGradient: 'from-slate-500 to-gray-600',
    isDisabled: true,
    disabledReason: 'این امکان در فاز آتی پورتال فعال خواهد شد.',
    defaultEnabledModules: ['hasSurvey'],
    defaultTaxonomies: []
  },
  {
    id: 'special_event',
    title: 'همایش و رویداد اختصاصی',
    category: 'service',
    description: 'سایت مستقل کنفرانس‌های ملی و بین‌المللی، جشنواره‌ها و استارتاپ‌ویکندهای دانشگاه',
    iconName: 'Sparkles',
    badge: 'در دست توسعه',
    color: '#64748b',
    bgGradient: 'from-slate-500 to-gray-600',
    isDisabled: true,
    disabledReason: 'این امکان در فاز آتی پورتال فعال خواهد شد.',
    defaultEnabledModules: ['hasEvents', 'hasNews'],
    defaultTaxonomies: []
  }
];

export const UNIVERSITY_PROFESSORS: ProfessorProfileData[] = [
  {
    professorId: 'p1',
    fullName: 'دکتر مریم رضایی',
    personnelId: '۸۸۲۲۱۱۴۴',
    academicRank: 'دانشیار',
    department: 'گروه معماری و طراحی شهری',
    faculty: 'دانشکده هنر و معماری',
    officeLocation: 'ساختمان هنر، طبقه دوم، اتاق ۲۰۴',
    internalPhone: '۳۲۸۰',
    officeHours: 'دوشنبه‌ها ۱۰:۰۰ الی ۱۲:۰۰ و چهارشنبه‌ها ۱۴:۰۰ الی ۱۶:۰۰',
    email: 'm.rezaei@elm-honar.ac.ir',
    googleScholarUrl: 'https://scholar.google.com/citations?user=rezaei_m',
    orcidId: '0000-0002-1825-0097',
    researchgateUrl: 'https://www.researchgate.net/profile/Maryam-Rezaei',
    linkedinUrl: 'https://linkedin.com/in/dr-maryam-rezaei',
    researchInterests: ['معماری پایدار و اقلیمی', 'بازتولید بافت‌های تاریخی', 'معماری بومی یزد'],
    taughtCourses: ['طراحی معماری ۴', 'مبانی نظری معماری', 'روش تحقیق در معماری پیشرفته'],
    supervisedThesesCount: 18,
    publishedPapersCount: 34,
    cvFileUrl: '/files/cv-dr-rezaei.pdf'
  },
  {
    professorId: 'p2',
    fullName: 'دکتر علیرضا صدقی',
    personnelId: '۷۷۱۱۰۲۴۵',
    academicRank: 'استاد تمام',
    department: 'گروه مهندسی نرم‌افزار و هوش مصنوعی',
    faculty: 'دانشکده فنی و مهندسی',
    officeLocation: 'ساختمان خوارزمی، طبقه اول، اتاق ۱۱۲',
    internalPhone: '۳۳۱۵',
    officeHours: 'شنبه‌ها ۸:۰۰ الی ۱۰:۰۰ و دوشنبه‌ها ۱۳:۰۰ الی ۱۵:۰۰',
    email: 'a.sedghi@elm-honar.ac.ir',
    googleScholarUrl: 'https://scholar.google.com/citations?user=sedghi_alireza',
    orcidId: '0000-0003-4412-8819',
    researchgateUrl: 'https://www.researchgate.net/profile/Alireza-Sedghi',
    linkedinUrl: 'https://linkedin.com/in/alireza-sedghi-phd',
    researchInterests: ['یادگیری ژرف (Deep Learning)', 'پردازش زبان طبیعی فارسی', 'سیستم‌های توزیع‌شده ابری'],
    taughtCourses: ['هوش مصنوعی پیشرفته', 'پردازش تصویر', 'شبکه‌های عصبی عمیق'],
    supervisedThesesCount: 27,
    publishedPapersCount: 62,
    cvFileUrl: '/files/cv-dr-sedghi.pdf'
  },
  {
    professorId: 'p3',
    fullName: 'دکتر کامران شفیعی',
    personnelId: '۹۹۲۲۰۱۲۳',
    academicRank: 'استادیار',
    department: 'گروه مهندسی برق و مکاترونیک',
    faculty: 'دانشکده فنی و مهندسی',
    officeLocation: 'ساختمان خوارزمی، طبقه دوم، اتاق ۲۱۸',
    internalPhone: '۳۳۴۰',
    officeHours: 'یک‌شنبه‌ها ۱۰:۰۰ الی ۱۲:۰۰ و سه‌شنبه‌ها ۸:۰۰ الی ۱۰:۰۰',
    email: 'k.shafiei@elm-honar.ac.ir',
    googleScholarUrl: 'https://scholar.google.com/citations?user=shafiei_kamran',
    orcidId: '0000-0001-9281-7162',
    researchInterests: ['سیستم‌های تعبیه‌شده (Embedded)', 'اینترنت اشیا صنعتی (IIoT)', 'کنترل مقاوم'],
    taughtCourses: ['میکروپروسسور و سیستم‌های تعبیه شده', 'کنترل خطی', 'الکترونیک صنعتی'],
    supervisedThesesCount: 12,
    publishedPapersCount: 22,
    cvFileUrl: '/files/cv-dr-shafiei.pdf'
  },
  {
    professorId: 'p4',
    fullName: 'دکتر سعیده موسوی',
    personnelId: '۸۸۳۳۰۴۵۶',
    academicRank: 'استادیار',
    department: 'گروه مدیریت کسب‌وکار و کارآفرینی',
    faculty: 'دانشکده علوم انسانی و مدیریت',
    officeLocation: 'ساختمان ابوریحان، طبقه همکف، اتاق ۰۱۵',
    internalPhone: '۳۱۲۰',
    officeHours: 'شنبه‌ها ۱۴:۰۰ الی ۱۶:۰۰ و چهارشنبه‌ها ۱۰:۰۰ الی ۱۲:۰۰',
    email: 's.mousavi@elm-honar.ac.ir',
    googleScholarUrl: 'https://scholar.google.com/citations?user=mousavi_saeedeh',
    orcidId: '0000-0002-8821-4433',
    researchInterests: ['بازاریابی دیجیتال', 'تحول دیجیتال در آموزش عالی', 'رفتار مصرف‌کننده'],
    taughtCourses: ['مدیریت استراتژیک پیشرفته', 'روش‌های نوین بازاریابی', 'کارآفرینی فناورانه'],
    supervisedThesesCount: 14,
    publishedPapersCount: 29,
    cvFileUrl: '/files/cv-dr-mousavi.pdf'
  }
];

export const INITIAL_DEDICATED_PAGES: DedicatedPage[] = [
  {
    id: 'page_assoc_ce',
    pageType: 'scientific_association',
    title: 'انجمن علمی مهندسی کامپیوتر',
    shortTitle: 'انجمن کامپیوتر',
    slug: 'computer-society',
    fullUrl: '/associations/computer-society',
    featuredImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    logo: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=200&q=80',
    shortDescription: 'مرجع رسمی فعالیت‌های علمی، دوره‌های مهارتی و مسابقات برنامه‌نویسی دانشگاه علم و هنر',
    fullDescription: 'انجمن علمی مهندسی کامپیوتر با هدف ارتقای دانش فنی دانشجویان، برگزاری بوت‌کمپ‌های تخصصی، ارتباط با صنعت و حمایت از پروژه‌های خلاقانه نرم‌افزاری فعالیت می‌کند.',
    status: 'active',
    publishStatus: 'published',
    createdAt: '۱۴۰۴/۰۸/۱۵',
    updatedAt: '۱۴۰۵/۰۳/۱۸',
    owner: {
      id: 'u_ali_mohammadi',
      name: 'علی محمدی',
      email: 'a.mohammadi@student.elm.ac.ir',
      phone: '۰۹۱۳۱۱۱۴۴۵۵',
      roleTitle: 'دبیر انجمن علمی کامپیوتر',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
    },
    authorizedUsers: [
      {
        id: 'auth_1',
        userId: 'u_ali_mohammadi',
        name: 'علی محمدی',
        email: 'a.mohammadi@student.elm.ac.ir',
        phone: '۰۹۱۳۱۱۱۴۴۵۵',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        roleTitle: 'دبیر کل و مدیر ارشد صفحه',
        accessLevel: 'full_manager',
        canManageTaxonomies: true,
        canManageModules: true,
        canPublish: true,
        assignedAt: '۱۴۰۴/۰۸/۱۵'
      },
      {
        id: 'auth_2',
        userId: 'u_sara_karimi',
        name: 'سارا کریمی',
        email: 's.karimi@student.elm.ac.ir',
        phone: '۰۹۱۳۲۲۲۶۶۷۷',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        roleTitle: 'مسئول روابط عمومی و تولید محتوا',
        accessLevel: 'content_editor',
        canManageTaxonomies: false,
        canManageModules: false,
        canPublish: true,
        assignedAt: '۱۴۰۴/۰۹/۰۱'
      }
    ],
    seo: {
      metaTitle: 'انجمن علمی مهندسی کامپیوتر | دانشگاه علم و هنر',
      metaDescription: 'پرتال اختصاصی انجمن علمی کامپیوتر: دوره‌های کدنویسی، همایش‌های هوش مصنوعی و بوت‌کمپ‌ها',
      metaKeywords: ['انجمن کامپیوتر', 'دانشگاه علم و هنر', 'هوش مصنوعی', 'برنامه‌نویسی', 'رویداد دانشجویی']
    },
    contactInfo: {
      email: 'ce.association@elm-honar.ac.ir',
      phone: '۰۳۵-۳۸۲۰۴۴۱۱',
      location: 'ساختمان خوارزمی، طبقه همکف، اتاق انجمن‌های علمی',
      telegramOrEitaa: '@elm_computer',
      instagram: 'elm_computer_society',
      linkedin: 'elm-computer-society',
      website: 'https://ce.elm.ac.ir'
    },
    displaySettings: {
      showInNavigation: true,
      showInDirectory: true,
      highlightOnHome: true
    },
    layoutConfig: {
      layoutType: 'two_column_sidebar_left',
      headerStyle: 'banner_hero',
      accentColor: '#0284c7',
      fontFamily: 'iransans',
      showSidebar: true,
      widgetOrder: ['hero', 'about', 'news', 'events', 'members', 'gallery', 'contact'],
      cardStyle: 'modern_rounded'
    },
    features: {
      hasNews: true,
      hasEvents: true,
      hasGallery: true,
      hasDocuments: true,
      hasBoardMembers: true,
      hasResearchArticles: false,
      hasContactForm: true,
      hasSurvey: false,
      hasUsefulLinks: true
    },
    taxonomies: [
      { id: 'tax_1', title: 'بوت‌کمپ‌های کدنویسی', slug: 'bootcamps', color: '#0284c7', itemCount: 6 },
      { id: 'tax_2', title: 'مسابقات برنامه‌نویسی ACM', slug: 'contests', color: '#059669', itemCount: 4 },
      { id: 'tax_3', title: 'سمینارها و وبینارها', slug: 'seminars', color: '#d97706', itemCount: 9 },
      { id: 'tax_4', title: 'جزوات و فایل‌های آموزشی', slug: 'handouts', color: '#7c3aed', itemCount: 12 }
    ],
    customFields: {
      facultyName: 'دانشکده فنی و مهندسی',
      councilMembersCount: 7,
      establishmentDate: '۱۳۹۲/۰۷/۱۰',
      licenseCode: 'AC-1404-981'
    }
  },
  {
    id: 'page_prof_sedghi',
    pageType: 'faculty_member',
    title: 'پرتال رسمی دکتر علیرضا صدقی',
    shortTitle: 'صفحه دکتر صدقی',
    slug: 'dr-sedghi',
    fullUrl: '/professors/dr-sedghi',
    featuredImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    logo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    shortDescription: 'استاد تمام گروه مهندسی نرم‌افزار و هوش مصنوعی دانشکده فنی و مهندسی',
    fullDescription: 'صفحه رسمی دانشگاهی دکتر علیرضا صدقی، پژوهشگر حوزه یادگیری ماشین و پردازش زبان طبیعی فارسی، حاوی سرفصل دروس، پروژه‌های پایان‌نامه و ساعات مشاوره.',
    status: 'active',
    publishStatus: 'published',
    createdAt: '۱۴۰۴/۰۲/۰۱',
    updatedAt: '۱۴۰۵/۰۳/۲۰',
    owner: {
      id: 'u_dr_sedghi',
      name: 'دکتر علیرضا صدقی',
      email: 'a.sedghi@elm-honar.ac.ir',
      phone: '۰۹۱۲۳۴۵۶۷۸۹',
      roleTitle: 'استاد تمام و عضو هیات علمی',
      personnelId: '۷۷۱۱۰۲۴۵',
      isFacultyMember: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
    },
    authorizedUsers: [
      {
        id: 'auth_prof_1',
        userId: 'u_dr_sedghi',
        name: 'دکتر علیرضا صدقی',
        email: 'a.sedghi@elm-honar.ac.ir',
        phone: '۰۹۱۲۳۴۵۶۷۸۹',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        roleTitle: 'استاد صاحب صفحه',
        accessLevel: 'full_manager',
        canManageTaxonomies: true,
        canManageModules: true,
        canPublish: true,
        assignedAt: '۱۴۰۴/۰۲/۰۱'
      },
      {
        id: 'auth_prof_ta',
        userId: 'u_reza_ta',
        name: 'رضا نادری (دستیار آموزشی TA)',
        email: 'r.naderi@student.elm.ac.ir',
        phone: '۰۹۱۳۵۵۵۸۸۹۹',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
        roleTitle: 'دستیار تدریس (TA)',
        accessLevel: 'content_editor',
        canManageTaxonomies: false,
        canManageModules: false,
        canPublish: true,
        assignedAt: '۱۴۰۴/۰۷/۰۱'
      }
    ],
    seo: {
      metaTitle: 'دکتر علیرضا صدقی | استاد هوش مصنوعی و مهندسی نرم‌افزار',
      metaDescription: 'صفحه شخصی دانشگاهی دکتر صدقی، مقالات، اسلایدهای درسی و پایان‌نامه‌ها',
      metaKeywords: ['دکتر علیرضا صدقی', 'هوش مصنوعی', 'دانشگاه علم و هنر', 'یادگیری ژرف']
    },
    contactInfo: {
      email: 'a.sedghi@elm-honar.ac.ir',
      phone: '۰۳۵-۳۸۲۰۳۳۱۵',
      location: 'ساختمان خوارزمی، طبقه اول، اتاق ۱۱۲',
      telegramOrEitaa: '@dr_sedghi_elm',
      website: 'https://sedghi.pro'
    },
    displaySettings: {
      showInNavigation: true,
      showInDirectory: true,
      highlightOnHome: false
    },
    layoutConfig: {
      layoutType: 'two_column_sidebar_right',
      headerStyle: 'profile_card',
      accentColor: '#0d9488',
      fontFamily: 'iransans',
      showSidebar: true,
      widgetOrder: ['hero', 'about', 'research', 'courses', 'theses', 'news', 'contact'],
      cardStyle: 'modern_rounded'
    },
    features: {
      hasNews: true,
      hasEvents: false,
      hasGallery: false,
      hasDocuments: true,
      hasBoardMembers: false,
      hasResearchArticles: true,
      hasContactForm: true,
      hasSurvey: false,
      hasUsefulLinks: true
    },
    taxonomies: [
      { id: 'tax_p1', title: 'اطلاعیه‌های کلاسی', slug: 'class-notices', color: '#0d9488', itemCount: 8 },
      { id: 'tax_p2', title: 'اسلایدهای درسی و مراجع', slug: 'slides', color: '#0284c7', itemCount: 15 },
      { id: 'tax_p3', title: 'موضوعات پیشنهادی پایان‌نامه', slug: 'thesis-topics', color: '#7c3aed', itemCount: 5 },
      { id: 'tax_p4', title: 'مقالات چاپ شده ISI', slug: 'isi-papers', color: '#d97706', itemCount: 22 }
    ],
    professorData: {
      professorId: 'p2',
      fullName: 'دکتر علیرضا صدقی',
      personnelId: '۷۷۱۱۰۲۴۵',
      academicRank: 'استاد تمام',
      department: 'گروه مهندسی نرم‌افزار و هوش مصنوعی',
      faculty: 'دانشکده فنی و مهندسی',
      officeLocation: 'ساختمان خوارزمی، طبقه اول، اتاق ۱۱۲',
      internalPhone: '۳۳۱۵',
      officeHours: 'شنبه‌ها ۸:۰۰ الی ۱۰:۰۰ و دوشنبه‌ها ۱۳:۰۰ الی ۱۵:۰۰',
      email: 'a.sedghi@elm-honar.ac.ir',
      googleScholarUrl: 'https://scholar.google.com/citations?user=sedghi_alireza',
      orcidId: '0000-0003-4412-8819',
      researchgateUrl: 'https://www.researchgate.net/profile/Alireza-Sedghi',
      linkedinUrl: 'https://linkedin.com/in/alireza-sedghi-phd',
      researchInterests: ['یادگیری ژرف (Deep Learning)', 'پردازش زبان طبیعی فارسی', 'سیستم‌های توزیع‌شده ابری'],
      taughtCourses: ['هوش مصنوعی پیشرفته', 'پردازش تصویر', 'شبکه‌های عصبی عمیق'],
      supervisedThesesCount: 27,
      publishedPapersCount: 62,
      cvFileUrl: '/files/cv-dr-sedghi.pdf'
    }
  },
  {
    id: 'page_journal_kavosh',
    pageType: 'student_journal',
    title: 'دوفصلنامه علمی و پژوهشی کاوش',
    shortTitle: 'نشریه کاوش',
    slug: 'kavosh-journal',
    fullUrl: '/journals/kavosh',
    featuredImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80',
    logo: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80',
    shortDescription: 'نشریه علمی دانشجویی در حوزه مهندسی فناوری اطلاعات و سیستم‌های هوشمند',
    fullDescription: 'دوفصلنامه کاوش با مجوز رسمی معاونت فرهنگی دانشگاه علم و هنر، پذیرای یادداشت‌ها، مقالات علمی مروری و دستاوردهای پژوهشی دانشجویان تحصیلات تکمیلی است.',
    status: 'active',
    publishStatus: 'published',
    createdAt: '۱۴۰۳/۱۱/۲۰',
    updatedAt: '۱۴۰۵/۰۲/۱۵',
    owner: {
      id: 'u_sara_abbasi',
      name: 'سارا عباسی',
      email: 's.abbasi@student.elm.ac.ir',
      phone: '۰۹۱۳۹۹۹۱۱۲۲',
      roleTitle: 'مدیر مسئول نشریه کاوش',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    },
    authorizedUsers: [
      {
        id: 'auth_j1',
        userId: 'u_sara_abbasi',
        name: 'سارا عباسی',
        email: 's.abbasi@student.elm.ac.ir',
        phone: '۰۹۱۳۹۹۹۱۱۲۲',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        roleTitle: 'مدیر مسئول',
        accessLevel: 'full_manager',
        canManageTaxonomies: true,
        canManageModules: true,
        canPublish: true,
        assignedAt: '۱۴۰۳/۱۱/۲۰'
      },
      {
        id: 'auth_j2',
        userId: 'u_hamed_reza',
        name: 'حامد رضایی',
        email: 'h.rezaei@student.elm.ac.ir',
        phone: '۰۹۱۲۷۷۷۴۴۳۳',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        roleTitle: 'سردبیر نشریه',
        accessLevel: 'content_editor',
        canManageTaxonomies: true,
        canManageModules: false,
        canPublish: true,
        assignedAt: '۱۴۰۳/۱۲/۰۱'
      }
    ],
    seo: {
      metaTitle: 'دوفصلنامه علمی کاوش | دانشگاه علم و هنر',
      metaDescription: 'آرشیو شماره‌های پیشین نشریه کاوش، فرم ارسال مقالات و اخبار هیئت تحریریه',
      metaKeywords: ['نشریه کاوش', 'نشریه دانشجویی', 'مقالات علمی', 'فناوری اطلاعات']
    },
    contactInfo: {
      email: 'kavosh.journal@elm-honar.ac.ir',
      phone: '۰۳۵-۳۸۲۰۴۵۰۰',
      location: 'ساختمان اداری، طبقه دوم، خانه نشریات دانشجویی',
      telegramOrEitaa: '@kavosh_journal'
    },
    displaySettings: {
      showInNavigation: true,
      showInDirectory: true,
      highlightOnHome: false
    },
    layoutConfig: {
      layoutType: 'magazine_grid',
      headerStyle: 'banner_hero',
      accentColor: '#7c3aed',
      fontFamily: 'iransans',
      showSidebar: true,
      widgetOrder: ['hero', 'about', 'issues', 'articles', 'editorial', 'downloads', 'contact'],
      cardStyle: 'modern_rounded'
    },
    features: {
      hasNews: true,
      hasEvents: false,
      hasGallery: true,
      hasDocuments: true,
      hasBoardMembers: true,
      hasResearchArticles: true,
      hasContactForm: true,
      hasSurvey: false,
      hasUsefulLinks: true
    },
    taxonomies: [
      { id: 'tax_j1', title: 'آرشیو شماره‌های کامل (PDF)', slug: 'full-issues', color: '#7c3aed', itemCount: 8 },
      { id: 'tax_j2', title: 'مقالات هوش مصنوعی و داده', slug: 'ai-articles', color: '#0284c7', itemCount: 14 },
      { id: 'tax_j3', title: 'مصاحبه با کارآفرینان', slug: 'interviews', color: '#059669', itemCount: 5 },
      { id: 'tax_j4', title: 'راهنمای نویسندگان و تمپلت‌ها', slug: 'author-guidelines', color: '#d97706', itemCount: 3 }
    ],
    customFields: {
      journalLicenseNumber: 'ن/۱۴۰۳/۸۷۴',
      journalPublisher: 'معاونت فرهنگی و دانشجویی دانشگاه علم و هنر',
      journalManagingDirector: 'سارا عباسی',
      journalEditorInChief: 'حامد رضایی',
      journalFrequency: 'دوفصلنامه',
      journalCirculation: 500
    }
  },
  {
    id: 'page_club_theatre',
    pageType: 'cultural_club',
    title: 'کانون فیلم و تئاتر پرواز',
    shortTitle: 'کانون تئاتر',
    slug: 'theatre-club',
    fullUrl: '/clubs/theatre',
    featuredImage: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80',
    logo: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=200&q=80',
    shortDescription: 'کانون هنرهای نمایشی، اکران و نقد فیلم‌های روز سینمای ایران و جهان',
    fullDescription: 'کانون تئاتر و فیلم پرواز فضایی پویا برای علاقه‌مندان به بازیگری، کارگردانی، فیلمنامه‌نویسی و نقد فیلم با کارگاه‌های منظم هفتگی فراهم نموده است.',
    status: 'active',
    publishStatus: 'published',
    createdAt: '۱۴۰۴/۰۱/۱۰',
    updatedAt: '۱۴۰۵/۰۳/۱۴',
    owner: {
      id: 'u_nima_roshan',
      name: 'نیما روشن',
      email: 'n.roshan@student.elm.ac.ir',
      phone: '۰۹۱۳۳۳۳۴۴۸۸',
      roleTitle: 'دبیر کانون فیلم و تئاتر',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80'
    },
    authorizedUsers: [
      {
        id: 'auth_th1',
        userId: 'u_nima_roshan',
        name: 'نیما روشن',
        email: 'n.roshan@student.elm.ac.ir',
        phone: '۰۹۱۳۳۳۳۴۴۸۸',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
        roleTitle: 'دبیر کانون',
        accessLevel: 'full_manager',
        canManageTaxonomies: true,
        canManageModules: true,
        canPublish: true,
        assignedAt: '۱۴۰۴/۰۱/۱۰'
      }
    ],
    seo: {
      metaTitle: 'کانون فیلم و تئاتر پرواز | دانشگاه علم و هنر',
      metaDescription: 'پرتال کانون تئاتر: برنامه‌های اکران فیلم، جشنواره‌های تئاتر دانشجویی و گالری اجراها',
      metaKeywords: ['تئاتر دانشجویی', 'کانون فیلم', 'دانشگاه علم و هنر', 'اکران فیلم']
    },
    contactInfo: {
      email: 'theatre.club@elm-honar.ac.ir',
      phone: '۰۳۵-۳۸۲۰۴۵۲۰',
      location: 'سالن آمفی‌تئاتر خیام، اتاق کانون‌های فرهنگی',
      telegramOrEitaa: '@parvaz_theatre_elm',
      instagram: 'parvaz_theatre'
    },
    displaySettings: {
      showInNavigation: true,
      showInDirectory: true,
      highlightOnHome: false
    },
    layoutConfig: {
      layoutType: 'two_column_sidebar_left',
      headerStyle: 'banner_hero',
      accentColor: '#d97706',
      fontFamily: 'iransans',
      showSidebar: true,
      widgetOrder: ['hero', 'about', 'events', 'gallery', 'news', 'contact'],
      cardStyle: 'modern_rounded'
    },
    features: {
      hasNews: true,
      hasEvents: true,
      hasGallery: true,
      hasDocuments: false,
      hasBoardMembers: true,
      hasResearchArticles: false,
      hasContactForm: true,
      hasSurvey: false,
      hasUsefulLinks: false
    },
    taxonomies: [
      { id: 'tax_th1', title: 'اکران هفتگی و نقد فیلم', slug: 'screenings', color: '#d97706', itemCount: 10 },
      { id: 'tax_th2', title: 'اجراهای صحنه‌ای و نمایشنامه‌خوانی', slug: 'plays', color: '#059669', itemCount: 6 },
      { id: 'tax_th3', title: 'کارگاه‌های فن بیان و بازیگری', slug: 'workshops', color: '#0284c7', itemCount: 4 }
    ],
    customFields: {
      councilMembersCount: 5,
      establishmentDate: '۱۳۹۵/۰۹/۱۵',
      licenseCode: 'CL-1404-102'
    }
  },
  {
    id: 'page_union_senfi',
    pageType: 'student_union',
    title: 'شورای صنفی دانشجویان دانشگاه',
    shortTitle: 'شورای صنفی',
    slug: 'senfi-council',
    fullUrl: '/unions/senfi',
    featuredImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    logo: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=200&q=80',
    shortDescription: 'پل ارتباطی دانشجویان با معاونت دانشجویی، تغذیه، خوابگاه و امور رفاهی',
    fullDescription: 'شورای صنفی دانشجویان در راستای پیگیری مطالبات برحق رفاهی، آموزشی، بهبود کیفیت سلف سرویس، خوابگاه‌ها و تسهیلات ایاب و ذهاب فعالیت می‌کند.',
    status: 'active',
    publishStatus: 'published',
    createdAt: '۱۴۰۴/۰۳/۰۱',
    updatedAt: '۱۴۰۵/۰۳/۱۵',
    owner: {
      id: 'u_hossein_ebadi',
      name: 'حسین عبادی',
      email: 'h.ebadi@student.elm.ac.ir',
      phone: '۰۹۱۳۸۸۸۲۲۳۳',
      roleTitle: 'دبیر شورای صنفی دانشجویان',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'
    },
    authorizedUsers: [
      {
        id: 'auth_sn1',
        userId: 'u_hossein_ebadi',
        name: 'حسین عبادی',
        email: 'h.ebadi@student.elm.ac.ir',
        phone: '۰۹۱۳۸۸۸۲۲۳۳',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
        roleTitle: 'دبیر شورا',
        accessLevel: 'full_manager',
        canManageTaxonomies: true,
        canManageModules: true,
        canPublish: true,
        assignedAt: '۱۴۰۴/۰۳/۰۱'
      }
    ],
    seo: {
      metaTitle: 'شورای صنفی دانشجویان | دانشگاه علم و هنر',
      metaDescription: 'پرتال اطلاع‌رسانی شورای صنفی: بیانیه‌ها، پیگیری مطالبات دانشجویی و ساعات ملاقات',
      metaKeywords: ['شورای صنفی', 'دانشگاه علم و هنر', 'رفاه دانشجویی', 'خوابگاه']
    },
    contactInfo: {
      email: 'senfi@elm-honar.ac.ir',
      phone: '۰۳۵-۳۸۲۰۴۶۰۰',
      location: 'ساختمان معاونت دانشجویی، طبقه اول، دفتر شورای صنفی',
      telegramOrEitaa: '@elm_senfi'
    },
    displaySettings: {
      showInNavigation: true,
      showInDirectory: true,
      highlightOnHome: false
    },
    layoutConfig: {
      layoutType: 'two_column_sidebar_left',
      headerStyle: 'banner_hero',
      accentColor: '#059669',
      fontFamily: 'iransans',
      showSidebar: true,
      widgetOrder: ['hero', 'about', 'news', 'documents', 'board', 'contact'],
      cardStyle: 'modern_rounded'
    },
    features: {
      hasNews: true,
      hasEvents: true,
      hasGallery: false,
      hasDocuments: true,
      hasBoardMembers: true,
      hasResearchArticles: false,
      hasContactForm: true,
      hasSurvey: true,
      hasUsefulLinks: true
    },
    taxonomies: [
      { id: 'tax_sn1', title: 'اطلاعیه‌های امور تغذیه و سلف', slug: 'food-services', color: '#059669', itemCount: 7 },
      { id: 'tax_sn2', title: 'امور خوابگاه‌ها و اسکان', slug: 'dormitory', color: '#0284c7', itemCount: 9 },
      { id: 'tax_sn3', title: 'گزارش جلسات با هیئت رئیسه', slug: 'board-meetings', color: '#7c3aed', itemCount: 4 }
    ],
    customFields: {
      councilMembersCount: 9,
      establishmentDate: '۱۳۹۴/۰۲/۲۰',
      licenseCode: 'SN-1404-001'
    }
  }
];

export const INITIAL_PAGE_CONTENTS: PageContentItem[] = [
  // Computer Association Content
  {
    id: 'cnt_1',
    pageId: 'page_assoc_ce',
    type: 'news',
    title: 'برگزاری بوت‌کمپ جامع Full-Stack Web Development در تابستان ۱۴۰۵',
    summary: 'دوره فشرده آموزشی توسعه وب با React، Node.js و پایگاه‌های داده با ارائه مدرک رسمی دانشگاهی و معرفی برترین‌ها به مراکز نوآوری.',
    content: 'انجمن علمی مهندسی کامپیوتر با همکاری دپارتمان فناوری اطلاعات، دوره تخصصی و پروژه‌محور Full-Stack را برگزار می‌نماید. علاقه‌مندان می‌توانند از طریق این پرتال ثبت‌نام نمایند.',
    categorySlug: 'bootcamps',
    categoryTitle: 'بوت‌کمپ‌های کدنویسی',
    publishedDate: '۱۴۰۵/۰۳/۱۵',
    author: 'علی محمدی',
    status: 'published',
    views: 482,
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'cnt_2',
    pageId: 'page_assoc_ce',
    type: 'event',
    title: 'یازدهمین دوره مسابقات برنامه‌نویسی ACM دانشگاهی',
    summary: 'مسابقه حضوری حل الگوریتم و کدنویسی تیمی با حضور تیم‌های منتخب دانشگاه‌های استان یزد در سالن همایش‌های خوارزمی.',
    content: 'این رویداد در روز پنج‌شنبه ۲۶ تیرماه با اسپانسری شرکت‌های فناور و اهدای جوایز نقدی برگزار خواهد شد.',
    categorySlug: 'contests',
    categoryTitle: 'مسابقات برنامه‌نویسی ACM',
    publishedDate: '۱۴۰۵/۰۳/۱۰',
    author: 'سارا کریمی',
    status: 'published',
    views: 310,
    imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'cnt_3',
    pageId: 'page_assoc_ce',
    type: 'document',
    title: 'پکیج آموزشی و نقشه راه گرایش هوش مصنوعی و داده (AI Roadmap 2026)',
    summary: 'فایل جامع PDF نقشه راه یادگیری از مقدماتی تا ورود به بازار کار به همراه لینک مراجع و دوره‌های رایگان بین‌المللی.',
    content: 'تهیه شده توسط تیم پژوهشی انجمن علمی کامپیوتر دانشگاه علم و هنر.',
    categorySlug: 'handouts',
    categoryTitle: 'جزوات و فایل‌های آموزشی',
    publishedDate: '۱۴۰۵/۰۲/۲۸',
    author: 'علی محمدی',
    status: 'published',
    views: 890,
    fileUrl: '/downloads/ai-roadmap-2026.pdf',
    fileSize: '4.8 MB'
  },

  // Dr. Sedghi Page Content
  {
    id: 'cnt_4',
    pageId: 'page_prof_sedghi',
    type: 'article',
    title: 'A Novel Hybrid Deep Learning Architecture for Persian Sentiment Analysis',
    summary: 'مقاله علمی پژوهشی چاپ شده در مجله تخصصی IEEE Transactions on Affective Computing با ضریب تاثیر ۶.۴',
    content: 'در این پژوهش به بررسی مدل‌های مبتنی بر Transformer برای تحلیل احساسات متون زبان فارسی پرداخته شده است.',
    categorySlug: 'isi-papers',
    categoryTitle: 'مقالات چاپ شده ISI',
    publishedDate: '۱۴۰۵/۰۱/۱۵',
    author: 'دکتر علیرضا صدقی',
    status: 'published',
    views: 650,
    fileUrl: '/papers/sedghi-ieee-2026.pdf',
    fileSize: '1.9 MB'
  },
  {
    id: 'cnt_5',
    pageId: 'page_prof_sedghi',
    type: 'announcement',
    title: 'اعلام زمان‌بندی جلسات دفاع پروپوزال و تحویل پروژه‌های پایانی نیمسال دوم',
    summary: 'دانشجویان کارشناسی ارشد و دکتری مقتضی است اسلایدهای ارائه را حداکثر تا ۲۸ خرداد در سامانه بارگذاری نمایند.',
    content: 'جلسات دفاع روز دوشنبه ۳۰ خرداد از ساعت ۹ صبح در سالن کنفرانس دانشکده مهندسی برگزار خواهد شد.',
    categorySlug: 'class-notices',
    categoryTitle: 'اطلاعیه‌های کلاسی',
    publishedDate: '۱۴۰۵/۰۳/۱۸',
    author: 'دکتر علیرضا صدقی',
    status: 'published',
    views: 420
  },

  // Kavosh Journal Content
  {
    id: 'cnt_6',
    pageId: 'page_journal_kavosh',
    type: 'document',
    title: 'دانلود نسخه کامل شماره ۱۲ دوفصلنامه علمی کاوش (بهار و تابستان ۱۴۰۵)',
    summary: 'شامل مقالات برگزیده در حوزه وب ۳، بلاکچین در مدیریت زنجیره تامین و فناوری‌های کوانتومی.',
    content: 'شماره ۱۲ مجله کاوش در ۹۲ صفحه با قطع رحلی و طراحی تمام‌رنگی منتشر شد.',
    categorySlug: 'full-issues',
    categoryTitle: 'آرشیو شماره‌های کامل (PDF)',
    publishedDate: '۱۴۰۵/۰۲/۱۰',
    author: 'سارا عباسی',
    status: 'published',
    views: 1240,
    fileUrl: '/journals/kavosh-issue-12.pdf',
    fileSize: '14.2 MB',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'
  }
];
