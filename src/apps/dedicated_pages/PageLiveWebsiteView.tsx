import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  FileText,
  Download,
  Share2,
  Users,
  Award,
  BookOpen,
  Send,
  Sparkles,
  Layers,
  ChevronRight,
  Globe,
  GraduationCap,
  MessageSquare,
  CheckCircle2,
  Smartphone,
  Monitor,
  Tablet,
  Sun,
  Moon,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { DedicatedPage, PageContentItem } from './types';
import { getDedicatedPagePublicUrl } from './utils';

interface PageLiveWebsiteViewProps {
  page: DedicatedPage;
  contents: PageContentItem[];
  onClose?: () => void;
  onEditPage?: (page: DedicatedPage) => void;
}

export default function PageLiveWebsiteView({
  page,
  contents,
  onClose,
  onEditPage
}: PageLiveWebsiteViewProps) {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState<'home' | 'news' | 'about' | 'downloads' | 'contact' | 'courses' | 'publications'>('home');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });

  const pageContents = contents.filter(c => c.pageId === page.id);
  const newsItems = pageContents.filter(c => c.type === 'news' || c.type === 'announcement' || c.type === 'event');
  const documentItems = pageContents.filter(c => c.type === 'document');
  const articleItems = pageContents.filter(c => c.type === 'article');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.message) return;
    setContactSuccess(true);
    setTimeout(() => {
      setContactSuccess(false);
      setContactForm({ name: '', email: '', subject: '', message: '' });
    }, 4000);
  };

  const getContainerWidth = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'max-w-[420px]';
      case 'tablet':
        return 'max-w-[768px]';
      default:
        return 'w-full max-w-6xl';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
      {/* Control Bar Header */}
      <div className="bg-white dark:bg-slate-900 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
            style={{ backgroundColor: page.layoutConfig?.accentColor || '#0284c7' }}
          >
            {page.shortTitle ? page.shortTitle.slice(0, 2) : 'صف'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{page.title}</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                پیش‌نمایش خروجی زنده
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono dir-ltr">{getDedicatedPagePublicUrl(page.pageType, page.slug)}</p>
          </div>
        </div>

        {/* Viewport & Theme Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                deviceMode === 'desktop'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="نمای دسکتاپ"
            >
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">دسکتاپ</span>
            </button>
            <button
              onClick={() => setDeviceMode('tablet')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                deviceMode === 'tablet'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="نمای تبلت"
            >
              <Tablet className="w-4 h-4" />
              <span className="hidden sm:inline">تبلت</span>
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
                deviceMode === 'mobile'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="نمای موبایل"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">موبایل</span>
            </button>
          </div>

          <button
            onClick={() => setPreviewTheme(t => (t === 'light' ? 'dark' : 'light'))}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
            title="تغییر تم پیش‌نمایش"
          >
            {previewTheme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {onEditPage && (
            <button
              onClick={() => onEditPage(page)}
              className="px-3 py-1.5 text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-colors"
            >
              ویرایش ساختار
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-colors"
            >
              بستن
            </button>
          )}
        </div>
      </div>

      {/* Screen Canvas Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center items-start bg-slate-200/70 dark:bg-slate-950/80">
        <div
          className={`${getContainerWidth()} w-full transition-all duration-300 rounded-2xl overflow-hidden shadow-xl border border-slate-300/80 dark:border-slate-800 ${
            previewTheme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'
          }`}
        >
          {/* Top Portal Breadcrumb Header Bar */}
          <div className="bg-slate-900 text-white px-5 py-2.5 text-xs flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">دانشگاه علم و هنر</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400">پرتال صفحات اختصاصی</span>
              <span className="text-slate-600">/</span>
              <span className="text-blue-400 font-medium">{page.shortTitle || page.title}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                {page.pageType === 'scientific_association' && 'انجمن علمی'}
                {page.pageType === 'cultural_club' && 'کانون فرهنگی'}
                {page.pageType === 'student_union' && 'تشکل دانشجویی'}
                {page.pageType === 'student_journal' && 'نشریه علمی'}
                {page.pageType === 'faculty_member' && 'عضو هیات علمی'}
              </span>
            </div>
          </div>

          {/* Hero Banner / Header Presentation */}
          <div className="relative">
            {page.featuredImage ? (
              <div className="h-48 sm:h-64 w-full relative overflow-hidden bg-slate-800">
                <img
                  src={page.featuredImage}
                  alt={page.title}
                  className="w-full h-full object-cover object-center opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              </div>
            ) : (
              <div
                className="h-44 sm:h-56 w-full relative overflow-hidden flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${page.layoutConfig?.accentColor || '#0284c7'}, #1e293b)`
                }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
              </div>
            )}

            {/* Profile / Emblem Overlap Bar */}
            <div className="px-6 pb-4 pt-2 -mt-16 sm:-mt-20 relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white dark:bg-slate-800 p-1.5 shadow-2xl border-2 border-white dark:border-slate-700 overflow-hidden flex-shrink-0">
                  {page.logo ? (
                    <img src={page.logo} alt="لوگو" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div
                      className="w-full h-full rounded-xl flex items-center justify-center text-white text-2xl font-bold"
                      style={{ backgroundColor: page.layoutConfig?.accentColor || '#0284c7' }}
                    >
                      {page.shortTitle ? page.shortTitle.slice(0, 2) : 'صف'}
                    </div>
                  )}
                </div>
                <div className="mb-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white drop-shadow-sm">
                    {page.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">
                    {page.shortDescription}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-stretch sm:self-auto">
                {page.features?.hasContactForm && (
                  <button
                    onClick={() => setActiveTab('contact')}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-md transition-all flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: page.layoutConfig?.accentColor || '#0284c7' }}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    ارتباط و ارسال پیام
                  </button>
                )}
                {page.contactInfo?.website && (
                  <a
                    href={page.contactInfo?.website}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Navigation Tabs of Dedicated Page */}
            <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 sm:gap-4 overflow-x-auto text-xs sm:text-sm font-medium scrollbar-none">
              <button
                onClick={() => setActiveTab('home')}
                className={`py-3 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'home'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                پیشخوان اصلی
              </button>

              {page.pageType === 'faculty_member' && (
                <>
                  <button
                    onClick={() => setActiveTab('courses')}
                    className={`py-3 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === 'courses'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    دروس و تدریس
                  </button>
                  <button
                    onClick={() => setActiveTab('publications')}
                    className={`py-3 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === 'publications'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    مقالات و پژوهش‌ها
                  </button>
                </>
              )}

              {page.features?.hasNews && (
                <button
                  onClick={() => setActiveTab('news')}
                  className={`py-3 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'news'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  اخبار و رویدادها ({newsItems.length})
                </button>
              )}

              {page.features?.hasDocuments && (
                <button
                  onClick={() => setActiveTab('downloads')}
                  className={`py-3 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'downloads'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  اسناد و دریافت فایل ({documentItems.length})
                </button>
              )}

              <button
                onClick={() => setActiveTab('about')}
                className={`py-3 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'about'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                معرفی و ساختار
              </button>

              {page.features?.hasContactForm && (
                <button
                  onClick={() => setActiveTab('contact')}
                  className={`py-3 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'contact'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  اطلاعات تماس
                </button>
              )}
            </div>
          </div>

          {/* Body Content by Tab */}
          <div className="p-6 space-y-6">
            {/* TAB: HOME */}
            {activeTab === 'home' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Left Column (2 Cols) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Faculty Specific Academic Box */}
                  {page.pageType === 'faculty_member' && page.professorData && (
                    <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-slate-900 p-5 rounded-2xl border border-teal-200 dark:border-teal-800/40">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                          <h4 className="font-bold text-sm text-teal-900 dark:text-teal-200">
                            شناسنامه علمی و رتبه آکادمیک
                          </h4>
                        </div>
                        <span className="text-xs bg-teal-600 text-white font-bold px-2.5 py-1 rounded-lg">
                          {page.professorData.academicRank}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-300">
                        <div>
                          <span className="text-slate-500">دانشکده:</span>{' '}
                          <span className="font-semibold">{page.professorData.faculty}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">دپارتمان/گروه:</span>{' '}
                          <span className="font-semibold">{page.professorData.department}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">اتاق کار:</span>{' '}
                          <span className="font-semibold">{page.professorData.officeLocation}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">تلفن داخلی:</span>{' '}
                          <span className="font-semibold font-mono">{page.professorData.internalPhone}</span>
                        </div>
                      </div>

                      {page.professorData.officeHours && (
                        <div className="mt-3.5 pt-3 border-t border-teal-200/70 dark:border-teal-800/40 flex items-start gap-2 text-xs text-teal-800 dark:text-teal-300">
                          <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">ساعات مشاوره و حضور هفتگی:</span>{' '}
                            {page.professorData.officeHours}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* About Summary Box */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      درباره {page.shortTitle || page.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                      {page.fullDescription}
                    </p>
                  </div>

                  {/* Latest News / Announcements */}
                  {page.features?.hasNews && newsItems.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          تازه‌ترین اطلاعیه‌ها و رویدادها
                        </h4>
                        <button
                          onClick={() => setActiveTab('news')}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                          مشاهده همه
                          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {newsItems.slice(0, 4).map(item => (
                          <div
                            key={item.id}
                            className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow flex flex-col justify-between gap-3"
                          >
                            {item.imageUrl && (
                              <div className="h-32 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900">
                                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1.5">
                                <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400 font-medium">
                                  {item.categoryTitle}
                                </span>
                                <span>{item.publishedDate}</span>
                              </div>
                              <h5 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 line-clamp-2">
                                {item.title}
                              </h5>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                {item.summary}
                              </p>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                              <span>نویسنده: {item.author}</span>
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {item.views}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Publications / Articles Section (if professor or journal) */}
                  {articleItems.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-violet-600" />
                          مقالات و یادداشت‌های تخصصی
                        </h4>
                      </div>

                      <div className="space-y-2.5">
                        {articleItems.map(art => (
                          <div
                            key={art.id}
                            className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1">
                                <span className="text-violet-600 dark:text-violet-400 font-semibold">{art.categoryTitle}</span>
                                <span>• {art.publishedDate}</span>
                              </div>
                              <h5 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                                {art.title}
                              </h5>
                              <p className="text-xs text-slate-500 mt-1">{art.summary}</p>
                            </div>
                            {art.fileUrl && (
                              <button className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-semibold hover:bg-violet-100 flex items-center gap-1">
                                <Download className="w-3.5 h-3.5" />
                                دانلود PDF
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right / Sidebar Column (1 Col) */}
                <div className="space-y-6">
                  {/* Owner / Leadership Card */}
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-3">
                      مسئول و مدیر صفحه
                    </h4>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                        {page.owner?.avatar ? (
                          <img src={page.owner.avatar} alt={page.owner?.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                            {page.owner?.name?.slice(0, 1)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{page.owner?.name}</div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">{page.owner?.roleTitle}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{page.owner?.email}</div>
                      </div>
                    </div>
                  </div>

                  {/* Dedicated Taxonomies / Categories */}
                  {(page.taxonomies?.length || 0) > 0 && (
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        دسته‌بندی‌های محتوایی
                      </h4>
                      <div className="space-y-2">
                        {(page.taxonomies || []).map(tax => (
                          <div
                            key={tax.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-xs hover:bg-slate-100 transition-colors"
                          >
                            <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tax.color }} />
                              {tax.title}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                              {tax.itemCount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Downloads & Forms Widget */}
                  {page.features?.hasDocuments && documentItems.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5" />
                        اسناد و فرم‌های آماده
                      </h4>
                      <div className="space-y-2.5">
                        {documentItems.slice(0, 3).map(doc => (
                          <div
                            key={doc.id}
                            className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between gap-2"
                          >
                            <div className="overflow-hidden">
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {doc.title}
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono">{doc.fileSize || 'PDF'}</span>
                            </div>
                            <button className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex-shrink-0">
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact Summary Box */}
                  <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md space-y-3 text-xs">
                    <h4 className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-400" />
                      راه‌های ارتباطی
                    </h4>
                    {page.contactInfo?.email && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-mono">{page.contactInfo?.email}</span>
                      </div>
                    )}
                    {page.contactInfo?.phone && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-mono">{page.contactInfo?.phone}</span>
                      </div>
                    )}
                    {page.contactInfo?.location && (
                      <div className="flex items-start gap-2 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span>{page.contactInfo?.location}</span>
                      </div>
                    )}
                    {page.contactInfo?.telegramOrEitaa && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span>کانال/پیام‌رسان: {page.contactInfo?.telegramOrEitaa}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: NEWS */}
            {activeTab === 'news' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                    آرشیو کامل اخبار و اطلاعیه‌های {page.shortTitle || page.title}
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">مجموع {newsItems.length} مورد</span>
                </div>

                {newsItems.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">تاکنون اطلاعیه‌ای در این صفحه منتشر نشده است.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {newsItems.map(item => (
                      <div
                        key={item.id}
                        className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-4"
                      >
                        {item.imageUrl && (
                          <div className="h-44 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900">
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold text-[11px]">
                              {item.categoryTitle}
                            </span>
                            <span>{item.publishedDate}</span>
                          </div>
                          <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">{item.title}</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                            {item.content || item.summary}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                          <span>ارسال کننده: {item.author}</span>
                          <span className="flex items-center gap-1 font-mono">
                            <Eye className="w-3.5 h-3.5" />
                            {item.views}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: COURSES (Faculty) */}
            {activeTab === 'courses' && page.professorData && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-teal-600" />
                    دروس تدریس شده و ترم جاری
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {page.professorData.taughtCourses.map((c, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-800/40 flex items-center gap-2.5 text-xs font-semibold text-teal-900 dark:text-teal-200"
                      >
                        <span className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center text-[11px] font-mono">
                          {i + 1}
                        </span>
                        {c}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    حوزه‌ها و علایق پژوهشی
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {page.professorData.researchInterests.map((interest, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PUBLICATIONS (Faculty or Journal) */}
            {activeTab === 'publications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                    فهرست مقالات، ژورنال‌ها و تالیفات علمی
                  </h3>
                  {page.professorData && (
                    <div className="flex items-center gap-2">
                      {page.professorData.googleScholarUrl && (
                        <a
                          href={page.professorData.googleScholarUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium flex items-center gap-1"
                        >
                          Google Scholar
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {page.professorData.orcidId && (
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-mono">
                          ORCID: {page.professorData.orcidId}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {articleItems.length > 0 ? (
                    articleItems.map(art => (
                      <div
                        key={art.id}
                        className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                            <span className="text-blue-600 font-semibold">{art.categoryTitle}</span>
                            <span>• تاریخ: {art.publishedDate}</span>
                          </div>
                          <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">{art.title}</h4>
                          <p className="text-xs text-slate-500 mt-1">{art.summary}</p>
                        </div>
                        {art.fileUrl && (
                          <button className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 flex items-center gap-1.5 flex-shrink-0">
                            <Download className="w-3.5 h-3.5" />
                            دریافت متن کامل
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                      مقاله‌ای ثبت نشده است.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: DOWNLOADS */}
            {activeTab === 'downloads' && (
              <div className="space-y-4">
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                  مرکز اسناد، آیین‌نامه‌ها و فرم‌های دانلودی
                </h3>
                {documentItems.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                    سندی بارگذاری نشده است.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {documentItems.map(doc => (
                      <div
                        key={doc.id}
                        className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100">
                              {doc.title}
                            </h4>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                              <span>{doc.categoryTitle}</span>
                              <span>• حجم: {doc.fileSize || 'نامشخص'}</span>
                            </div>
                          </div>
                        </div>
                        <button className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1 flex-shrink-0">
                          <Download className="w-3.5 h-3.5" />
                          دانلود
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: ABOUT & STRUCTURE */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                    معرفی، اهداف و اساسنامه {page.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                    {page.fullDescription}
                  </p>
                </div>

                {/* Authorized sub-admins / board members */}
                {(page.authorizedUsers?.length || 0) > 0 && (
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      کادر مدیریتی و اعضای مجاز صفحه
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {(page.authorizedUsers || []).map(auth => (
                        <div
                          key={auth.id}
                          className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 flex items-center gap-3"
                        >
                          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 font-bold flex items-center justify-center flex-shrink-0">
                            {auth.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-800 dark:text-slate-200">{auth.name}</div>
                            <div className="text-[11px] text-blue-600 dark:text-blue-400">{auth.roleTitle}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{auth.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: CONTACT */}
            {activeTab === 'contact' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    ارسال پیام مستقیم به مسئول این صفحه
                  </h3>
                  <p className="text-xs text-slate-500">
                    پیام شما مستقیماً در کارتابل اختصاصی مسئول صفحه ثبت و پاسخ به ایمیل شما ارسال می‌گردد.
                  </p>

                  {contactSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      پیام شما با موفقیت به مدیریت صفحه ارسال شد.
                    </div>
                  )}

                  <form onSubmit={handleSendMessage} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">
                        نام و نام خانوادگی
                      </label>
                      <input
                        type="text"
                        value={contactForm.name}
                        onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="مثال: محمد امینی"
                        required
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">ایمیل شما</label>
                      <input
                        type="email"
                        value={contactForm.email}
                        onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="user@example.com"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">موضوع پیام</label>
                      <input
                        type="text"
                        value={contactForm.subject}
                        onChange={e => setContactForm({ ...contactForm, subject: e.target.value })}
                        placeholder="موضوع درخواست یا پرسش"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">متن پیام</label>
                      <textarea
                        rows={4}
                        value={contactForm.message}
                        onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder="پیام یا درخواست خود را شرح دهید..."
                        required
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      ارسال پیام
                    </button>
                  </form>
                </div>

                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                    <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
                      مشخصات دبیرخانه و محل استقرار
                    </h3>
                    <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">آدرس: </span>
                          {page.contactInfo?.location || 'یزد، بلوار دانشجو، دانشگاه علم و هنر'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">تلفن مستقیم: </span>
                          <span className="font-mono">{page.contactInfo?.phone || '۰۳۵-۳۸۲۰۴۰۰۰'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">پست الکترونیک: </span>
                          <span className="font-mono">{page.contactInfo?.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="bg-slate-100 dark:bg-slate-950 px-6 py-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>© {new Date().getFullYear()} کلیه حقوق این صفحه متعلق به «{page.title}» دانشگاه علم و هنر می‌باشد.</div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>قدرت گرفته از پرتال صفحات مستقل دانشگاه</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
