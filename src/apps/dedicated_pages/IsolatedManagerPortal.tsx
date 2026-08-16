import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Shield,
  LayoutDashboard,
  FileText,
  Layers,
  Settings,
  Eye,
  LogOut,
  Mail,
  Users,
  CheckCircle,
  Clock,
  Sparkles,
  AlertTriangle,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { DedicatedPage, PageContentItem } from './types';

interface IsolatedManagerPortalProps {
  page: DedicatedPage;
  allPages: DedicatedPage[];
  contents: PageContentItem[];
  currentPersonaName: string;
  onSelectPage: (page: DedicatedPage) => void;
  onUpdatePage: (updatedPage: DedicatedPage) => void;
  onUpdateContents: (updatedContents: PageContentItem[]) => void;
  onOpenLivePreview: (page: DedicatedPage) => void;
  onExitToSuperAdmin: () => void;
}

export default function IsolatedManagerPortal({
  page,
  allPages,
  contents,
  currentPersonaName,
  onSelectPage,
  onUpdatePage,
  onUpdateContents,
  onOpenLivePreview,
  onExitToSuperAdmin
}: IsolatedManagerPortalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'contents' | 'taxonomies' | 'settings' | 'messages'>('dashboard');

  // Filter pages that this persona is authorized to manage
  const authorizedPages = allPages.filter(
    p =>
      p.owner.name === currentPersonaName ||
      p.authorizedUsers.some(u => u.name === currentPersonaName) ||
      p.id === page.id
  );

  const pageContents = contents.filter(c => c.pageId === page.id);

  // New content inline state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'news' | 'event' | 'document' | 'article'>('news');
  const [newCatSlug, setNewCatSlug] = useState(page.taxonomies[0]?.slug || 'general');
  const [newSummary, setNewSummary] = useState('');

  // Contact messages mockup for this isolated page
  const [messages, setMessages] = useState([
    {
      id: 'msg_1',
      senderName: 'محمد احمدی',
      senderEmail: 'm.ahmadi@student.elm.ac.ir',
      subject: 'درخواست عضویت در کارگروه هوش مصنوعی',
      body: 'با سلام و احترام، اینجانب دانشجوی ترم ۶ متقاضی همکاری در تیم پژوهشی انجمن می‌باشم.',
      date: '۱۴۰۵/۰۳/۱۸',
      read: false
    },
    {
      id: 'msg_2',
      senderName: 'زهرا موسوی',
      senderEmail: 'z.mousavi@student.elm.ac.ir',
      subject: 'پرسش درباره گواهی کارگاه وب',
      body: 'سلام، زمان صدور گواهی دوره‌های کدنویسی چه تاریخی خواهد بود؟ با تشکر.',
      date: '۱۴۰۵/۰۳/۱۶',
      read: true
    }
  ]);

  const handleAddContentQuick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const matchedTax = page.taxonomies.find(t => t.slug === newCatSlug);
    const categoryTitle = matchedTax ? matchedTax.title : 'عمومی';

    const newItem: PageContentItem = {
      id: `cnt_${Date.now()}`,
      pageId: page.id,
      type: newType,
      title: newTitle,
      summary: newSummary || newTitle,
      content: newSummary,
      categorySlug: newCatSlug,
      categoryTitle,
      publishedDate: '۱۴۰۵/۰۳/۲۵',
      author: currentPersonaName,
      status: 'published',
      views: 1
    };

    onUpdateContents([...contents, newItem]);
    setNewTitle('');
    setNewSummary('');
  };

  const handleDeleteContent = (id: string) => {
    if (confirm('آیا از حذف این محتوا مطمئن هستید؟')) {
      onUpdateContents(contents.filter(c => c.id !== id));
    }
  };

  const handleToggleContentStatus = (id: string) => {
    onUpdateContents(
      contents.map(c => (c.id === id ? { ...c, status: c.status === 'published' ? 'draft' : 'published' } : c))
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
      {/* Isolation Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 border-b border-indigo-900/50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                دسترسی ایزوله شده (Isolated Tenant Portal)
              </span>
              <span className="text-xs text-slate-400">کاربر فعال:</span>
              <span className="text-xs font-bold text-amber-300">{currentPersonaName}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-0.5 flex items-center gap-2">
              مدیریت اختصاصی: {page.title}
            </h2>
          </div>
        </div>

        {/* Page Switcher for Authorized Multi-Page Managers */}
        <div className="flex items-center gap-3">
          {authorizedPages.length > 1 && (
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400">صفحات مجاز شما:</span>
              <select
                value={page.id}
                onChange={e => {
                  const target = authorizedPages.find(p => p.id === e.target.value);
                  if (target) onSelectPage(target);
                }}
                className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
              >
                {authorizedPages.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.shortTitle || p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => onOpenLivePreview(page)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
            پیش‌نمایش زنده در وب‌سایت
          </button>

          <button
            onClick={onExitToSuperAdmin}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            بازگشت به پیشخوان کل
          </button>
        </div>
      </div>

      {/* Security Isolation Notice */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/40 px-6 py-2 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            سطح دسترسی شما محدود به <strong>«{page.title}»</strong> است. دسترسی به سایر تشکل‌ها، واحدهای دانشگاه و تنظیمات سراسری مسدود می‌باشد.
          </span>
        </div>
        <span className="text-[11px] font-mono opacity-80 dir-ltr">{page.fullUrl}</span>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('dashboard')}
          className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'dashboard'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          پیشخوان و آمار
        </button>

        <button
          onClick={() => setActiveSubTab('contents')}
          className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'contents'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          محتواها و اخبار ({pageContents.length})
        </button>

        <button
          onClick={() => setActiveSubTab('taxonomies')}
          className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'taxonomies'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          دسته‌بندی‌های اختصاصی ({page.taxonomies.length})
        </button>

        <button
          onClick={() => setActiveSubTab('messages')}
          className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'messages'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Mail className="w-4 h-4" />
          پیام‌های دریافتی
          {messages.filter(m => !m.read).length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'settings'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          مشخصات و راه‌های ارتباطی
        </button>
      </div>

      {/* Main Isolated Workspace */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* SUBTAB: DASHBOARD */}
        {activeSubTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">مجموع محتواهای فعال</span>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                    {pageContents.length}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">کل بازدیدهای صفحه</span>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                    {pageContents.reduce((sum, item) => sum + item.views, 120)}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">پیام‌های فرم تماس</span>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                    {messages.length}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">دسته‌بندی‌های محتوایی</span>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                    {page.taxonomies.length}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Items */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Publish Box */}
              <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  ارسال سریع خبر یا اطلاعیه
                </h3>

                <form onSubmit={handleAddContentQuick} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">عنوان خبر</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="عنوان خبر یا اطلاعیه..."
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">نوع</label>
                      <select
                        value={newType}
                        onChange={e => setNewType(e.target.value as any)}
                        className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <option value="news">خبر</option>
                        <option value="event">رویداد</option>
                        <option value="document">فایل</option>
                        <option value="article">مقاله</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">دسته</label>
                      <select
                        value={newCatSlug}
                        onChange={e => setNewCatSlug(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        {page.taxonomies.map(t => (
                          <option key={t.id} value={t.slug}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">متن خلاصه</label>
                    <textarea
                      rows={3}
                      value={newSummary}
                      onChange={e => setNewSummary(e.target.value)}
                      placeholder="توضیح کوتاه..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    انتشار فوری در صفحه
                  </button>
                </form>
              </div>

              {/* Recent Contents List */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    آخرین مطالب منتشر شده در این صفحه
                  </h3>
                  <button
                    onClick={() => setActiveSubTab('contents')}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                  >
                    مدیریت همه
                  </button>
                </div>

                <div className="space-y-2.5">
                  {pageContents.slice(0, 5).map(item => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600">
                            {item.categoryTitle}
                          </span>
                          <span className="text-slate-400">{item.publishedDate}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{item.title}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono text-[11px]">{item.views} بازدید</span>
                        <button
                          onClick={() => handleToggleContentStatus(item.id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                            item.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {item.status === 'published' ? 'فعال' : 'پیش‌نویس'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB: CONTENTS */}
        {activeSubTab === 'contents' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  مدیریت محتوای {page.shortTitle || page.title}
                </h3>
                <p className="text-xs text-slate-500">امکان حذف، تغییر وضعیت و مشاهده مطالب اختصاصی</p>
              </div>
            </div>

            <div className="space-y-3">
              {pageContents.map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                      <span className="text-indigo-600 font-bold">{item.categoryTitle}</span>
                      <span>• تاریخ: {item.publishedDate}</span>
                      <span>• نویسنده: {item.author}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.summary}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleContentStatus(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                        item.status === 'published'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {item.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                    </button>
                    <button
                      onClick={() => handleDeleteContent(item.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB: TAXONOMIES */}
        {activeSubTab === 'taxonomies' && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              دسته‌بندی‌های محتوایی اختصاصی این صفحه
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {page.taxonomies.map(tax => (
                <div
                  key={tax.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: tax.color }} />
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">{tax.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tax.slug}</div>
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 font-mono">
                    {pageContents.filter(c => c.categorySlug === tax.slug).length} مطلب
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB: MESSAGES */}
        {activeSubTab === 'messages' && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              پیام‌های دریافتی از فرم تماس اختصاصی
            </h3>
            <div className="space-y-3">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{msg.senderName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">({msg.senderEmail})</span>
                    </div>
                    <span className="text-xs text-slate-400">{msg.date}</span>
                  </div>
                  <h4 className="font-semibold text-xs text-indigo-600 dark:text-indigo-400">{msg.subject}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{msg.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB: SETTINGS */}
        {activeSubTab === 'settings' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-2xl">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">مشخصات و اطلاعات تماس صفحه</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">محل استقرار / دفتر</label>
                <input
                  type="text"
                  value={page.contactInfo.location}
                  onChange={e =>
                    onUpdatePage({
                      ...page,
                      contactInfo: { ...page.contactInfo, location: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">تلفن مستقیم</label>
                <input
                  type="text"
                  value={page.contactInfo.phone}
                  onChange={e =>
                    onUpdatePage({
                      ...page,
                      contactInfo: { ...page.contactInfo, phone: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono dir-ltr"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">پست الکترونیک رسمی</label>
                <input
                  type="email"
                  value={page.contactInfo.email}
                  onChange={e =>
                    onUpdatePage({
                      ...page,
                      contactInfo: { ...page.contactInfo, email: e.target.value }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono dir-ltr"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
