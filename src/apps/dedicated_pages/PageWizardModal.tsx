import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  GraduationCap,
  Palette,
  Users,
  BookOpen,
  UserCheck,
  MessageSquare,
  Sparkles,
  Info,
  Layers,
  Globe,
  Plus,
  Shield,
  User,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Link as LinkIcon,
  AlertCircle,
  FileText,
  Key,
  CheckCircle2,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import MediaManager from '@/src/shared-components/MediaManager';
import {
  DedicatedPage,
  PageType,
  AuthorizedUser,
  PageTaxonomy,
  ProfessorProfileData,
  LayoutType,
  HeaderStyle,
  PageTypeDefinition,
  DEDICATED_PAGE_TYPES
} from './types';
import { fetchProfessors, getOwnerAccount, setOwnerAccount } from './api';
import { getDedicatedPagePublicUrl } from './utils';

interface PageWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePage: (page: DedicatedPage) => Promise<DedicatedPage | null>;
  initialPage?: DedicatedPage | null;
}

const WIZARD_STEPS = [
  { step: 1, title: 'نوع صفحه', desc: 'انتخاب نوع واحد یا صفحه شخص' },
  { step: 2, title: 'اطلاعات پایه و آدرس', desc: 'عناوین، آدرس اینترنتی و رنگ سازمانی' },
  { step: 3, title: 'کاربر مدیر و دسترسی', desc: 'مشخصات هویتی و تنظیمات دسترسی' },
  { step: 4, title: 'انتشار و فعال‌سازی', desc: 'وضعیت نمایش و ثبت نهایی' }
];

export default function PageWizardModal({
  isOpen,
  onClose,
  onSavePage,
  initialPage
}: PageWizardModalProps) {
  const isEditMode = !!initialPage;
  const [currentStep, setCurrentStep] = useState(1);
  const [universityProfessors, setUniversityProfessors] = useState<ProfessorProfileData[]>([]);

  // Load data from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const professors = await fetchProfessors();
        setUniversityProfessors(professors);
      } catch (e) {
        console.error('Error loading wizard data:', e);
      }
    };
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Form State - Step 1 & 2: Page Type, Info, URL & Theme
  const [pageType, setPageType] = useState<PageType>('scientific_association');
  const [title, setTitle] = useState('');
  const [shortTitle, setShortTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [logo, setLogo] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [accentColor, setAccentColor] = useState('#0284c7');
  const [mediaManagerTarget, setMediaManagerTarget] = useState<'logo' | 'featuredImage' | null>(null);

  // Form State - Step 3: Single Manager User (Merged Owner & Access)
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerRoleTitle, setOwnerRoleTitle] = useState('');
  const [selectedProfId, setSelectedProfId] = useState<string>('p1');

  // New Creation mode credentials
  const [ownerUsername, setOwnerUsername] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // نام‌کاربری واقعیِ ورود مسئول صفحه — از جدول جداگانهٔ page_manager_accounts
  // (نه از خودِ رکورد DedicatedPage) — برای تشخیص واقعیِ تغییر نام‌کاربری
  const [realOwnerUsername, setRealOwnerUsername] = useState<string | null>(null);

  // Edit mode password change fields
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  // Form State - Step 4: Status & Publish Settings
  const [status, setStatus] = useState<'active' | 'inactive' | 'draft' | 'maintenance'>('active');
  const [publishStatus, setPublishStatus] = useState<'published' | 'draft' | 'scheduled'>('published');
  const [showInNavigation, setShowInNavigation] = useState(true);
  const [showInDirectory, setShowInDirectory] = useState(true);
  const [highlightOnHome, setHighlightOnHome] = useState(false);

  // Preserve other internal configs for compatibility
  const [customFields, setCustomFields] = useState<any>({});
  const [layoutType, setLayoutType] = useState<LayoutType>('two_column_sidebar_left');
  const [headerStyle, setHeaderStyle] = useState<HeaderStyle>('banner_hero');
  const [fontFamily, setFontFamily] = useState<'iransans' | 'vazir' | 'sahel' | 'shabnam' | 'dana'>('iransans');
  const [features, setFeatures] = useState({
    hasNews: true,
    hasEvents: true,
    hasGallery: true,
    hasDocuments: true,
    hasBoardMembers: true,
    hasResearchArticles: false,
    hasContactForm: true,
    hasSurvey: false,
    hasUsefulLinks: true
  });
  const [taxonomies, setTaxonomies] = useState<PageTaxonomy[]>([]);

  // Password Generator
  const generateRandomPassword = (forNewPassword = false) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (forNewPassword) {
      setNewPassword(pass);
      setConfirmNewPassword(pass);
      setShowNewPassword(true);
    } else {
      setOwnerPassword(pass);
      setShowPassword(true);
    }
  };

  // Initialize / Reset Form
  useEffect(() => {
    if (initialPage) {
      setPageType(initialPage.pageType);
      setTitle(initialPage.title || '');
      setShortTitle(initialPage.shortTitle || '');
      setSlug(initialPage.slug || '');
      setShortDescription(initialPage.shortDescription || '');
      setFullDescription(initialPage.fullDescription || '');
      setLogo(initialPage.logo || '');
      setFeaturedImage(initialPage.featuredImage || '');
      setAccentColor(initialPage.layoutConfig?.accentColor || '#0284c7');

      // Manager User Identity
      setOwnerName(initialPage.owner?.name || '');
      setOwnerPhone(initialPage.owner?.phone || '');
      setOwnerEmail(initialPage.owner?.email || '');
      setOwnerRoleTitle(initialPage.owner?.roleTitle || '');
      setOwnerUsername(initialPage.owner?.email?.split('@')[0] || 'manager');
      setOwnerPassword('');

      // Reset password change fields
      setIsChangingPassword(false);
      setNewPassword('');
      setConfirmNewPassword('');
      setShowNewPassword(false);
      setPasswordChangeSuccess(false);

      // نام‌کاربری واقعیِ ورود مسئول صفحه از وب‌سرویس جداگانهٔ owner-account می‌آید
      setRealOwnerUsername(null);
      getOwnerAccount(initialPage.id)
        .then(account => {
          if (account) {
            setRealOwnerUsername(account.username);
            setOwnerUsername(account.username);
          }
        })
        .catch(e => console.error('Error loading owner account:', e));

      if (initialPage.professorData?.professorId) {
        setSelectedProfId(initialPage.professorData.professorId);
      }

      setStatus(initialPage.status);
      setPublishStatus(initialPage.publishStatus);
      setShowInNavigation(initialPage.displaySettings?.showInNavigation ?? true);
      setShowInDirectory(initialPage.displaySettings?.showInDirectory ?? true);
      setHighlightOnHome(initialPage.displaySettings?.highlightOnHome ?? false);

      setLayoutType(initialPage.layoutConfig?.layoutType || 'two_column_sidebar_left');
      setHeaderStyle(initialPage.layoutConfig?.headerStyle || 'banner_hero');
      setFontFamily(initialPage.layoutConfig?.fontFamily || 'iransans');
      setFeatures(initialPage.features || {
        hasNews: true,
        hasEvents: true,
        hasGallery: true,
        hasDocuments: true,
        hasBoardMembers: true,
        hasResearchArticles: false,
        hasContactForm: true,
        hasSurvey: false,
        hasUsefulLinks: true
      });
      setTaxonomies(initialPage.taxonomies || []);
      setCustomFields(initialPage.customFields || {});
      setCurrentStep(1);
    } else {
      // Reset defaults for new page
      setPageType('scientific_association');
      setTitle('');
      setShortTitle('');
      setSlug('');
      setShortDescription('');
      setFullDescription('');
      setLogo('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=200&q=80');
      setFeaturedImage('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80');
      setAccentColor('#0284c7');

      // User defaults
      setOwnerName('');
      setOwnerUsername('');
      setOwnerPassword('Elm@2026!');
      setOwnerPhone('');
      setOwnerEmail('');
      setOwnerRoleTitle('مسئول صفحه');
      setSelectedProfId('p1');

      setIsChangingPassword(false);
      setNewPassword('');
      setConfirmNewPassword('');
      setShowNewPassword(false);
      setPasswordChangeSuccess(false);

      setStatus('active');
      setPublishStatus('published');
      setShowInNavigation(true);
      setShowInDirectory(true);
      setHighlightOnHome(false);

      setLayoutType('two_column_sidebar_left');
      setHeaderStyle('banner_hero');
      setFontFamily('iransans');
      setFeatures({
        hasNews: true,
        hasEvents: true,
        hasGallery: true,
        hasDocuments: true,
        hasBoardMembers: true,
        hasResearchArticles: false,
        hasContactForm: true,
        hasSurvey: false,
        hasUsefulLinks: true
      });
      setTaxonomies([
        { id: 'tax_d1', title: 'اطلاعیه‌های رسمی', slug: 'official-notices', color: '#0284c7', itemCount: 0 },
        { id: 'tax_d2', title: 'کارگاه‌ها و دوره‌ها', slug: 'workshops', color: '#059669', itemCount: 0 },
        { id: 'tax_d3', title: 'فایل‌ها و مستندات', slug: 'files', color: '#7c3aed', itemCount: 0 }
      ]);
      setCustomFields({});
      setCurrentStep(1);
    }
  }, [initialPage, isOpen]);

  // When Page Type Changes
  const handleSelectPageType = (typeId: PageType) => {
    const reg = DEDICATED_PAGE_TYPES.find(r => r.id === typeId);
    if (reg?.isDisabled) return;

    setPageType(typeId);
    if (reg) {
      setAccentColor(reg.color);
      if (typeId === 'faculty_member') {
        setHeaderStyle('profile_card');
        setLayoutType('two_column_sidebar_right');
        setFeatures(f => ({ ...f, hasResearchArticles: true, hasBoardMembers: false }));
        const prof = universityProfessors.find(p => p.professorId === selectedProfId) || universityProfessors[0];
        if (prof) {
          setTitle(`صفحه اختصاصی ${prof.fullName}`);
          setShortTitle(prof.fullName);
          setSlug(prof.fullName.replace(/\s+/g, '-').toLowerCase());
          setOwnerName(prof.fullName);
          setOwnerUsername(`dr.${prof.fullName.split(' ').pop() || 'prof'}`.toLowerCase());
          setOwnerEmail(prof.email);
          setOwnerPhone(prof.internalPhone || '۰۹۱۳۰۰۰۰۰۰۰');
          setOwnerRoleTitle(`${prof.academicRank} ${prof.department}`);
          setShortDescription(`${prof.academicRank} ${prof.department}، ${prof.faculty}`);
          setFullDescription(`پرتال رسمی دانشگاهی ${prof.fullName}، ${prof.academicRank} ${prof.faculty} دانشگاه علم و هنر.`);
        }
      } else if (typeId === 'student_journal') {
        setLayoutType('magazine_grid');
        setFeatures(f => ({ ...f, hasResearchArticles: true, hasGallery: true }));
        setOwnerRoleTitle('مدیر مسئول نشریه');
      } else if (typeId === 'cultural_club') {
        setOwnerRoleTitle('دبیر کانون فرهنگی');
      } else if (typeId === 'student_union') {
        setOwnerRoleTitle('دبیر شورای صنفی / تشکل');
      } else {
        setOwnerRoleTitle('دبیر انجمن علمی');
      }
    }
  };

  // Sync professor selection for faculty_member
  const handleSelectProfessor = (profId: string) => {
    setSelectedProfId(profId);
    const prof = universityProfessors.find(p => p.professorId === profId);
    if (prof) {
      setTitle(`صفحه اختصاصی ${prof.fullName}`);
      setShortTitle(prof.fullName);
      const cleanSlug = `dr-${prof.fullName.split(' ').pop() || 'prof'}`.toLowerCase();
      setSlug(cleanSlug);
      setOwnerName(prof.fullName);
      setOwnerUsername(`dr.${prof.fullName.split(' ').pop() || 'prof'}`.toLowerCase());
      setOwnerEmail(prof.email);
      setOwnerPhone(prof.internalPhone || '۰۹۱۳۰۰۰۰۰۰۰');
      setOwnerRoleTitle(`${prof.academicRank} - ${prof.department}`);
      setShortDescription(`${prof.academicRank} ${prof.department}، ${prof.faculty}`);
      setFullDescription(`صفحه رسمی دانشگاهی ${prof.fullName} شامل اطلاعات درسی، مقالات و ساعات مشاوره.`);
    }
  };

  // Calculate Final URL (full, absolute — matches the real public site routes)
  const getFullUrl = () => getDedicatedPagePublicUrl(pageType, slug);

  // Determine final password to save
  const getFinalPassword = () => {
    if (isEditMode) {
      if (isChangingPassword && newPassword.trim()) {
        return newPassword;
      }
      return initialPage?.owner?.password || ownerPassword || 'Elm@2026!';
    }
    return ownerPassword || 'Elm@2026!';
  };

  // Save Dedicated Page
  const handleFinalSave = async () => {
    const profObj = pageType === 'faculty_member'
      ? universityProfessors.find(p => p.professorId === selectedProfId) || universityProfessors[0]
      : undefined;

    const userObjId = initialPage?.owner?.id || `usr_${Date.now()}`;
    const finalPassword = getFinalPassword();

    // Single Authorized User mapped directly to this manager
    const singleAuthorizedUser: AuthorizedUser = {
      id: `auth_${userObjId}`,
      userId: userObjId,
      name: ownerName || 'مدیر صفحه',
      email: ownerEmail || 'manager@elm.ac.ir',
      phone: ownerPhone || '۰۹۱۳۰۰۰۰۰۰۰',
      roleTitle: ownerRoleTitle || 'مدیر اصلی و مسئول صفحه',
      accessLevel: 'full_manager',
      canManageTaxonomies: true,
      canManageModules: true,
      canPublish: true,
      assignedAt: initialPage?.authorizedUsers?.[0]?.assignedAt || '۱۴۰۵/۰۳/۲۵'
    };

    const newDedicatedPage: DedicatedPage = {
      id: initialPage?.id || `page_${Date.now()}`,
      pageType,
      title: title || 'صفحه اختصاصی جدید',
      shortTitle: shortTitle || title,
      slug: slug || 'new-page',
      fullUrl: getFullUrl(),
      featuredImage: featuredImage || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
      logo: logo || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=200&q=80',
      shortDescription: shortDescription || 'توضیح کوتاه صفحه اختصاصی',
      fullDescription: fullDescription || 'توضیحات کامل درباره اهداف و فعالیت‌های صفحه.',
      status,
      publishStatus,
      createdAt: initialPage?.createdAt || '۱۴۰۵/۰۳/۲۵',
      updatedAt: '۱۴۰۵/۰۳/۲۵',
      owner: {
        id: userObjId,
        name: ownerName || 'مسئول صفحه',
        username: ownerUsername || 'manager',
        password: finalPassword,
        email: ownerEmail || 'manager@elm.ac.ir',
        phone: ownerPhone || '۰۹۱۳۰۰۰۰۰۰۰',
        roleTitle: ownerRoleTitle || 'مدیر صفحه',
        facultyId: profObj?.department,
        isFacultyMember: pageType === 'faculty_member'
      },
      authorizedUsers: [singleAuthorizedUser],
      seo: {
        metaTitle: title,
        metaDescription: shortDescription,
        metaKeywords: [title, shortTitle]
      },
      contactInfo: {
        email: ownerEmail || 'contact@elm.ac.ir',
        phone: ownerPhone || '۰۳۵-۳۸۲۰۴۰۰۰',
        location: profObj?.officeLocation || 'یزد، بلوار دانشجو، دانشگاه علم و هنر'
      },
      displaySettings: {
        showInNavigation,
        showInDirectory,
        highlightOnHome
      },
      layoutConfig: {
        layoutType,
        headerStyle,
        accentColor,
        fontFamily,
        showSidebar: layoutType.includes('sidebar'),
        widgetOrder: ['hero', 'about', 'news', 'events', 'documents', 'contact'],
        cardStyle: 'modern_rounded'
      },
      features,
      taxonomies,
      professorData: profObj,
      customFields
    };

    const savedPage = await onSavePage(newDedicatedPage);

    // ورود مسئول صفحه (page-manager) در جدول جداگانه‌ای ذخیره می‌شود — نه در
    // خودِ رکورد DedicatedPage — پس باید جدا و پس از ذخیرهٔ موفق صفحه ارسال شود.
    // فقط وقتی واقعاً نام‌کاربری/گذرواژه تغییر کرده یا صفحه تازه ایجاد شده
    // ارسال می‌شود؛ در غیر این صورت گذرواژهٔ فعلی مسئول صفحه دست‌نخورده می‌ماند.
    if (savedPage?.id) {
      const usernameChanged = ownerUsername && ownerUsername !== (realOwnerUsername ?? '');
      const passwordChanged = isChangingPassword && newPassword.trim();
      if (!isEditMode || usernameChanged || passwordChanged) {
        try {
          await setOwnerAccount(savedPage.id, {
            username: ownerUsername || 'manager',
            ...(passwordChanged || !isEditMode ? { password: finalPassword } : {})
          });
        } catch (e) {
          console.error('Error saving owner account credentials:', e);
          const reason = e instanceof Error ? e.message : 'خطای نامشخص';
          alert(`صفحه ذخیره شد، اما تغییر نام‌کاربری/گذرواژهٔ ورود مسئول صفحه ذخیره نشد: ${reason}`);
        }
      }
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
      >
        {/* Wizard Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {isEditMode ? `ویرایش صفحه اختصاصی: ${initialPage.title}` : 'ایجاد و تنظیم صفحه اختصاصی جدید'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              پیکربندی نوع صفحه، مشخصات پایه و آدرس اینترنتی، اطلاعات کاربر مدیر و وضعیت انتشار
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Timeline Indicator (4 Steps) */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/60">
          <div className="grid grid-cols-4 gap-2">
            {WIZARD_STEPS.map(s => {
              const isPassed = currentStep > s.step;
              const isCurrent = currentStep === s.step;
              return (
                <button
                  key={s.step}
                  onClick={() => setCurrentStep(s.step)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all text-right ${
                    isCurrent
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : isPassed
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                      : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                      isCurrent
                        ? 'bg-white text-blue-600 font-bold'
                        : isPassed
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {isPassed ? <Check className="w-3 h-3" /> : s.step}
                  </span>
                  <div className="truncate">
                    <div className="truncate font-bold">{s.title}</div>
                    <div
                      className={`text-[10px] truncate hidden sm:block ${
                        isCurrent
                          ? 'text-blue-100 font-normal'
                          : isPassed
                          ? 'text-blue-600/80 dark:text-blue-400/80'
                          : 'text-slate-400'
                      }`}
                    >
                      {s.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Wizard Body Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {/* STEP 1: SELECT PAGE TYPE */}
          {currentStep === 1 && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="text-center max-w-xl mx-auto mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">انتخاب نوع صفحه اختصاصی</h3>
                <p className="text-xs text-slate-500 mt-1">
                  نوع صفحه و ماهیت فعالیت واحد، تشکل یا هیئت علمی را مشخص کنید.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DEDICATED_PAGE_TYPES.map(type => {
                  const isSelected = pageType === type.id;
                  const isDisabled = type.isDisabled;

                  return (
                    <div
                      key={type.id}
                      onClick={() => !isDisabled && handleSelectPageType(type.id)}
                      className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                        isDisabled
                          ? 'opacity-60 bg-slate-100 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-800 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-50/50 dark:bg-blue-950/30 border-2 border-blue-600 shadow-md cursor-pointer'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:shadow-sm cursor-pointer'
                      }`}
                    >
                      {isDisabled && (
                        <div className="absolute top-3 left-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          فعلاً غیرفعال
                        </div>
                      )}

                      {isSelected && (
                        <div className="absolute top-3 left-3 bg-blue-600 text-white p-1 rounded-full">
                          <Check className="w-3 h-3" />
                        </div>
                      )}

                      <div>
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-white mb-3 shadow-sm"
                          style={{ backgroundColor: type.color }}
                        >
                          {type.id === 'scientific_association' && <GraduationCap className="w-6 h-6" />}
                          {type.id === 'cultural_club' && <Palette className="w-6 h-6" />}
                          {type.id === 'student_union' && <Users className="w-6 h-6" />}
                          {type.id === 'student_journal' && <BookOpen className="w-6 h-6" />}
                          {type.id === 'faculty_member' && <UserCheck className="w-6 h-6" />}
                          {type.id === 'interactive_survey' && <MessageSquare className="w-6 h-6" />}
                          {type.id === 'special_event' && <Sparkles className="w-6 h-6" />}
                        </div>

                        <div className="flex items-center gap-2 mb-1.5">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{type.title}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                            {type.badge}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                          {type.description}
                        </p>
                      </div>

                      {isDisabled ? (
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-2 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          {type.disabledReason}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                          دسته‌بندی: {type.category === 'academic' ? 'علمی و آموزشی' : type.category === 'cultural' ? 'فرهنگی و هنری' : type.category === 'media' ? 'رسانه و نشریه' : 'شخص و هیئت علمی'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: BASIC INFORMATION, URL & ACCENT COLOR */}
          {currentStep === 2 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white pb-1">
                  اطلاعات پایه، آدرس اینترنتی و هویت بصری
                </h3>
                <p className="text-xs text-slate-500">
                  عنوان صفحه، نامک آدرس URL، رنگ سازمانی شاخص و تصاویر صفحه را تنظیم نمایید.
                </p>
              </div>

              {/* Title & Short Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان کامل صفحه *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="مثال: انجمن علمی مهندسی کامپیوتر"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان کوتاه (جهت هدر، منوها و تب‌ها) *
                  </label>
                  <input
                    type="text"
                    value={shortTitle}
                    onChange={e => setShortTitle(e.target.value)}
                    placeholder="مثال: انجمن کامپیوتر"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  توضیح کوتاه / شعار (Short Description)
                </label>
                <input
                  type="text"
                  value={shortDescription}
                  onChange={e => setShortDescription(e.target.value)}
                  placeholder="مرجع رسمی فعالیت‌های علمی، بوت‌کمپ‌ها و مسابقات برنامه‌نویسی..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات کامل و معرفی اهداف
                </label>
                <textarea
                  rows={3}
                  value={fullDescription}
                  onChange={e => setFullDescription(e.target.value)}
                  placeholder="معرفی جامع، تاریخچه تاسیس، اهداف، آیین‌نامه و بیانیه ماموریت این واحد یا صفحه..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              {/* URL & Address Section */}
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 space-y-3">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <h4 className="font-bold text-xs">آدرس و مسیر اینترنتی اختصاصی (URL & Slug)</h4>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نامک مسیر انگلیسی (Slug) *
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                    placeholder="computer-society"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs dir-ltr focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
                  <span className="font-semibold flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                    پیش‌نمایش آدرس نهایی صفحه در وب‌سایت:
                  </span>
                  <span className="font-mono dir-ltr font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 rounded-lg">
                    {getFullUrl()}
                  </span>
                </div>
              </div>

              {/* Accent Color & Visual Identity */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    رنگ سازمانی و المان‌های تاکید (Accent Color)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono dir-ltr">{accentColor}</span>
                    <span
                      className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600"
                      style={{ backgroundColor: accentColor }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { hex: '#0284c7', label: 'آبی اقیانوسی' },
                    { hex: '#059669', label: 'سبز زمردی' },
                    { hex: '#d97706', label: 'کهربایی / طلایی' },
                    { hex: '#7c3aed', label: 'بنفش سلطنتی' },
                    { hex: '#0d9488', label: 'فیروزه‌ای' },
                    { hex: '#e11d48', label: 'یاقوتی / سرخ' },
                    { hex: '#475569', label: 'طوسی متالیک' }
                  ].map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setAccentColor(c.hex)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                        accentColor === c.hex
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 font-bold shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.hex }} />
                      <span className="text-slate-700 dark:text-slate-300 text-[11px]">{c.label}</span>
                      {accentColor === c.hex && <Check className="w-3 h-3 text-blue-600 ml-0.5" />}
                    </button>
                  ))}

                  <div className="flex items-center gap-2 mr-auto">
                    <span className="text-[11px] text-slate-500">رنگ دلخواه:</span>
                    <input
                      type="color"
                      value={accentColor}
                      onChange={e => setAccentColor(e.target.value)}
                      className="w-8 h-8 rounded-xl border-0 cursor-pointer bg-transparent"
                      title="انتخاب رنگ سفارشی"
                    />
                  </div>
                </div>
              </div>

              {/* Logo & Banner Images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    آدرس تصویر لوگو یا نشان اختصاصی
                  </label>
                  <div className="flex items-start gap-3">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                      {logo ? (
                        <img src={logo} alt="پیش‌نمایش لوگو" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMediaManagerTarget('logo')}
                          className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-bold transition-colors cursor-pointer"
                        >
                          انتخاب از رسانه
                        </button>
                        {logo && (
                          <button
                            type="button"
                            onClick={() => setLogo('')}
                            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
                            title="حذف تصویر"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={logo}
                        onChange={e => setLogo(e.target.value)}
                        placeholder="https://... /logo.png"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono dir-ltr"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تصویر شاخص / بنر هدر (Featured Image)
                  </label>
                  <div className="flex items-start gap-3">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                      {featuredImage ? (
                        <img src={featuredImage} alt="پیش‌نمایش بنر" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMediaManagerTarget('featuredImage')}
                          className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-bold transition-colors cursor-pointer"
                        >
                          انتخاب از رسانه
                        </button>
                        {featuredImage && (
                          <button
                            type="button"
                            onClick={() => setFeaturedImage('')}
                            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
                            title="حذف تصویر"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={featuredImage}
                        onChange={e => setFeaturedImage(e.target.value)}
                        placeholder="https://... /banner.jpg"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono dir-ltr"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SINGLE MANAGER USER IDENTITY & SEPARATE PASSWORD SECTION */}
          {currentStep === 3 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white pb-1">
                  مشخصات هویتی و تنظیمات دسترسی کاربر مدیر
                </h3>
                <p className="text-xs text-slate-500">
                  اطلاعات هویتی و ارتباطی مسئول این صفحه را وارد نمایید.
                </p>
              </div>

              {/* If Faculty Member Page: Professor Selection */}
              {pageType === 'faculty_member' && (
                <div className="space-y-3 p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/40">
                  <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200 text-xs font-bold">
                    <GraduationCap className="w-4 h-4 text-teal-600" />
                    انتخاب از سامانه اعضای هیئت علمی و اساتید دانشگاه:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
                    {universityProfessors.map(prof => {
                      const isSelected = selectedProfId === prof.professorId;
                      return (
                        <div
                          key={prof.professorId}
                          onClick={() => handleSelectProfessor(prof.professorId)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-teal-100/60 dark:bg-teal-900/50 border-teal-600 border-2 shadow-sm'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center text-xs">
                              {prof.fullName.slice(0, 1)}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-900 dark:text-white">{prof.fullName}</div>
                              <div className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold">
                                {prof.academicRank} - {prof.department}
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Identity & Contact Info Card (PURE IDENTITY ONLY) */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 border-b pb-2 border-slate-200 dark:border-slate-700">
                  <User className="w-4 h-4 text-blue-600" />
                  مشخصات هویتی و اطلاعات تماس مسئول صفحه
                </div>

                {/* Name & Role Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      نام و نام خانوادگی *
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={e => setOwnerName(e.target.value)}
                      placeholder="مثال: علی محمدی"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      سمت / عنوان رسمی در تشکل *
                    </label>
                    <input
                      type="text"
                      value={ownerRoleTitle}
                      onChange={e => setOwnerRoleTitle(e.target.value)}
                      placeholder="مثال: دبیر انجمن علمی کامپیوتر"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Mobile & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      شماره تلفن همراه *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={ownerPhone}
                        onChange={e => setOwnerPhone(e.target.value)}
                        placeholder="۰۹۱۳۰۰۰۰۰۰۰"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono dir-ltr focus:ring-2 focus:ring-blue-500"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      پست الکترونیک (ایمیل رسمی) *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={ownerEmail}
                        onChange={e => setOwnerEmail(e.target.value)}
                        placeholder="manager@elm.ac.ir"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono dir-ltr focus:ring-2 focus:ring-blue-500"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>
              </div>

              {/* SEPARATE SECURITY / PASSWORD SECTION */}
              {isEditMode ? (
                /* EDIT MODE: Dedicated Password Change Box */
                <div className="p-5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-amber-200/80 dark:border-amber-800/40">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        تنظیمات امنیتی و تغییر گذرواژه پرتال
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">حساب کاربری فعال:</span>
                      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 font-mono text-xs font-bold text-amber-700 dark:text-amber-300 dir-ltr">
                        {ownerUsername || 'manager'}
                      </span>
                    </div>
                  </div>

                  {/* Change Password Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-amber-200/60 dark:border-amber-800/30">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        id="toggleChangePass"
                        checked={isChangingPassword}
                        onChange={e => {
                          setIsChangingPassword(e.target.checked);
                          if (!e.target.checked) {
                            setNewPassword('');
                            setConfirmNewPassword('');
                          }
                        }}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="toggleChangePass" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                        تغییر گذرواژه ورود به پرتال برای این کاربر
                      </label>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      {isChangingPassword ? 'در حال ویرایش رمز' : 'رمز فعلی فعال است'}
                    </span>
                  </div>

                  {/* Expanded Password Change Inputs */}
                  {isChangingPassword && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pt-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                            <span>گذرواژه جدید (New Password) *</span>
                            <button
                              type="button"
                              onClick={() => generateRandomPassword(true)}
                              className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" />
                              تولید رمز قوی
                            </button>
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              placeholder="حداقل ۸ کاراکتر..."
                              className="w-full pl-16 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono dir-ltr focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 text-slate-400">
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                              >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <Lock className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            تکرار گذرواژه جدید *
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              value={confirmNewPassword}
                              onChange={e => setConfirmNewPassword(e.target.value)}
                              placeholder="تکرار رمز عبور..."
                              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono dir-ltr focus:ring-2 focus:ring-blue-500"
                            />
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          </div>
                        </div>
                      </div>

                      {newPassword && newPassword.trim().length < 8 && (
                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          گذرواژه باید حداقل ۸ کاراکتر باشد.
                        </div>
                      )}

                      {newPassword && confirmNewPassword && newPassword !== confirmNewPassword && (
                        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          گذرواژه جدید و تکرار آن با یکدیگر مطابقت ندارند.
                        </div>
                      )}

                      {newPassword && confirmNewPassword && newPassword === confirmNewPassword && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                          گذرواژه جدید معتبر است و پس از ذخیره نهایی اعمال خواهد شد.
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              ) : (
                /* CREATION MODE: Separate Credentials & Authentication Box */
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 border-b pb-2 border-slate-200 dark:border-slate-700">
                    <KeyRound className="w-4 h-4 text-blue-600" />
                    اطلاعات ورود به پرتال و امنیت حساب
                  </div>

                  {/* Username & Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>نام کاربری (Username) *</span>
                        <span className="text-[10px] text-slate-400 font-normal">جهت ورود به پرتال</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={ownerUsername}
                          onChange={e => setOwnerUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                          placeholder="a.mohammadi"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono dir-ltr focus:ring-2 focus:ring-blue-500"
                        />
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>گذرواژه (Password) *</span>
                        <button
                          type="button"
                          onClick={() => generateRandomPassword(false)}
                          className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          تولید رمز قوی
                        </button>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={ownerPassword}
                          onChange={e => setOwnerPassword(e.target.value)}
                          placeholder="گذرواژه امن..."
                          className="w-full pl-16 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono dir-ltr focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 text-slate-400">
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <Lock className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Informational Card */}
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  این کاربر پس از ذخیره، دسترسی سطح مدیر ارشد (Full Manager) به پرتال ایزوله این صفحه را خواهد داشت و
                  می‌تواند اخبار، اطلاعیه‌ها، فرم‌ها و محتواهای اختصاصی این واحد را مدیریت نماید.
                </span>
              </div>
            </div>
          )}

          {/* STEP 4: PUBLISH STATUS & ACTIVATION */}
          {currentStep === 4 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white pb-1">
                  وضعیت انتشار و تنظیمات نهایی
                </h3>
                <p className="text-xs text-slate-500">
                  وضعیت فعالیت صفحه و دسترسی در منوهای سایت را تعیین کرده و صفحه را نهایی‌سازی کنید.
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  مرور مشخصات پیکربندی شده صفحه:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-slate-400">عنوان و نوع صفحه:</span>
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span>{title || 'بدون عنوان'}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600">
                        {pageType}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-slate-400">آدرس وب‌سایت:</span>
                    <span className="font-mono dir-ltr font-bold text-blue-600">{getFullUrl()}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-slate-400">کاربر مدیر صفحه:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {ownerName} ({ownerUsername || 'manager'})
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-slate-400">رنگ سازمانی:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] dir-ltr">{accentColor}</span>
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: accentColor }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  وضعیت فعالیت صفحه
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'active', title: 'فعال و عمومی (Active)', desc: 'صفحه برای تمام کاربران و عموم قابل مشاهده است' },
                    { id: 'draft', title: 'پیش‌نویس (Draft)', desc: 'فقط مدیران سیستم و صفحه به آن دسترسی دارند' },
                    { id: 'maintenance', title: 'در دست به‌روزرسانی', desc: 'پیام موقت تعمیرات و ارتقا نمایش داده می‌شود' }
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStatus(st.id as any)}
                      className={`p-3.5 rounded-2xl border text-right transition-all ${
                        status === st.id
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{st.title}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{st.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Visibility Options */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  گزینه‌های نمایش در ناوبری و پرتال اصلی دانشگاه
                </label>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showInNavigation}
                      onChange={e => setShowInNavigation(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span className="text-slate-700 dark:text-slate-300">
                      نمایش در منوی اصلی و فهرست صفحات سایت دانشگاه
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showInDirectory}
                      onChange={e => setShowInDirectory(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span className="text-slate-700 dark:text-slate-300">
                      نمایش در دایرکتوری و راهنمای تشکل‌ها و واحدهای دانشگاه
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={highlightOnHome}
                      onChange={e => setHighlightOnHome(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span className="text-slate-700 dark:text-slate-300">
                      برجسته‌سازی در صفحه اول پورتال دانشگاه (ویترین ویژه)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              currentStep === 1
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
            مرحله قبل
          </button>

          <div className="text-xs text-slate-400 font-medium">
            مرحله {currentStep} از {WIZARD_STEPS.length}
          </div>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-[1.02]"
            >
              مرحله بعد
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSave}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg hover:shadow-emerald-600/30 transition-all hover:scale-[1.02]"
            >
              <Check className="w-4 h-4" />
              {isEditMode ? 'ذخیره تغییرات صفحه' : 'ایجاد و ثبت نهایی صفحه'}
            </button>
          )}
        </div>
      </motion.div>

      {/* Media Manager — انتخاب لوگو / تصویر شاخص از رسانه */}
      <MediaManager
        open={mediaManagerTarget !== null}
        filter="image"
        title={mediaManagerTarget === 'logo' ? 'انتخاب تصویر لوگو' : 'انتخاب تصویر شاخص / بنر هدر'}
        onClose={() => setMediaManagerTarget(null)}
        onSelect={(url) => {
          if (mediaManagerTarget === 'logo') setLogo(url);
          else if (mediaManagerTarget === 'featuredImage') setFeaturedImage(url);
          setMediaManagerTarget(null);
        }}
      />
    </div>
  );
}
