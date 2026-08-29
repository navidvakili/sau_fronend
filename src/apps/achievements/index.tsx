// ============================================================
// AchievementManagement — سیستم مدیریت افتخارات
// شامل: آرشیو افتخارات و ویرایشگر
// افتخارات در صفحه «افتخارات» سایت عمومی (sau public) نمایش داده می‌شوند
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy, Plus, Search, Edit3, Trash2, Image as ImageIcon,
  Send, Loader2, X, CheckCircle2, AlertCircle, Globe,
  Rocket, FileText, Cpu, Palette, Star, Award, BookOpen,
} from 'lucide-react';
import type { AchievementItem, User } from '@/src/shared-types';
import ToastNotification from '@/src/shared-components/ToastNotification';
import MediaManager from '@/src/shared-components/MediaManager';
import WysiwygEditor from '@/src/shared-components/WysiwygEditor';
import {
  fetchAchievements, fetchAchievementById, createAchievement, updateAchievement, deleteAchievement,
} from './api';
import { useAppPermissions } from '@/src/shared-utils/PermissionsContext';
import { useLanguage } from '@/src/shared-utils/LanguageContext';
import AnalyticsDashboard from '@/src/apps/analytics/AnalyticsDashboard';

interface AchievementManagementProps {
  user?: User | null;
  activeTabId?: string;
  moduleId?: string;
  onOpenTab?: (id: string, title: string, iconName: string) => void;
}

type SubTab = 'list' | 'editor' | 'visitor-analytics';

// Icon options — کلیدهای آیکون باید با ACHIEVEMENT_ICONS در سایت عمومی یکی باشند
const ICON_OPTIONS: Array<{ key: string; label: string; icon: React.ReactNode }> = [
  { key: 'trophy', label: 'جام قهرمانی', icon: <Trophy size={18} /> },
  { key: 'award', label: 'نشان افتخار', icon: <Award size={18} /> },
  { key: 'medal', label: 'مدال', icon: <Trophy size={18} /> },
  { key: 'star', label: 'ستاره', icon: <Star size={18} /> },
  { key: 'rocket', label: 'پیشرفت', icon: <Rocket size={18} /> },
  { key: 'globe', label: 'بین‌الملل', icon: <Globe size={18} /> },
  { key: 'book', label: 'کتاب و علم', icon: <BookOpen size={18} /> },
  { key: 'file-text', label: 'سند و مقاله', icon: <FileText size={18} /> },
  { key: 'cpu', label: 'فناوری', icon: <Cpu size={18} /> },
  { key: 'palette', label: 'هنر', icon: <Palette size={18} /> },
];

function getIconNode(key: string | null | undefined, size: number = 18): React.ReactNode {
  const found = ICON_OPTIONS.find((o) => o.key === key);
  if (found) return found.icon;
  return <Award size={size} />;
}

export default function AchievementManagement({ user, moduleId }: AchievementManagementProps) {
  const { can } = useAppPermissions();
  const { currentLang, getLanguage } = useLanguage();
  const activeLanguage = getLanguage(currentLang);
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('support');
  const isEditor = user?.roles?.includes('editor');
  const roleCanEdit = isAdmin || isEditor;
  const permCanEdit = can('achievements.create') || can('achievements.edit');
  const permCanDelete = can('achievements.delete');
  const canApprove = can('achievements.approve') || isAdmin;
  const canEdit = roleCanEdit || permCanEdit;
  const canDelete = roleCanEdit || permCanDelete;

  // ===== Sub-tab state =====
  const [activeTab, setActiveTab] = useState<SubTab>(() => {
    if (moduleId === 'achievements-visitor-analytics') return 'visitor-analytics';
    return 'list';
  });

  // ===== Data state =====
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // ===== Filter state =====
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // ===== Editor State =====
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('award');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formStatus, setFormStatus] = useState<'published' | 'draft'>('published');
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [formMessage, setFormMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // ===== Toast state =====
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ===== Delete Confirmation state =====
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // ===== Metrics =====
  const publishedCount = achievements.filter(a => a.status === 'published').length;
  const draftCount = achievements.filter(a => a.status === 'draft').length;

  // ===== Fetch data =====
  const loadAchievements = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        per_page: 100,
        lang: currentLang,
      };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;

      const data = await fetchAchievements(params);
      setAchievements(data.data);
      setTotal(data.total);
    } catch (err: any) {
      console.error('Error loading achievements:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, currentLang]);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadAchievements();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter]);

  // ===== Handlers =====
  const handleStartEdit = async (item: AchievementItem) => {
    setFormMessage(null);
    setActiveTab('editor');
    setFormLoading(true);
    try {
      const detail = await fetchAchievementById(item.id);
      setEditingId(detail.id);
      setFormTitle(detail.title);
      setFormSubtitle(detail.subtitle || '');
      setFormDescription(detail.description || detail.desc || '');
      setFormIcon(detail.icon || 'award');
      setFormImageUrl(detail.image_url || '');
      setFormStatus(detail.status);
    } catch (err: any) {
      // Fallback to list item
      setEditingId(item.id);
      setFormTitle(item.title);
      setFormSubtitle(item.subtitle || '');
      setFormDescription(item.description || item.desc || '');
      setFormIcon(item.icon || 'award');
      setFormImageUrl(item.image_url || '');
      setFormStatus(item.status);
      showToast(err.message || 'خطا در بارگذاری جزئیات افتخار', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleResetForm = () => {
    setEditingId(null);
    setFormTitle('');
    setFormSubtitle('');
    setFormDescription('');
    setFormIcon('award');
    setFormImageUrl('');
    setFormStatus('published');
    setFormMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormMessage({ text: 'لطفاً عنوان افتخار را وارد نمایید.', type: 'error' });
      return;
    }

    setFormLoading(true);

    try {
      // If user cannot approve, force draft (backend also enforces this)
      const finalStatus: 'published' | 'draft' = canApprove ? formStatus : 'draft';
      const payload = {
        title: formTitle,
        subtitle: formSubtitle || undefined,
        description: formDescription || undefined,
        image_url: formImageUrl || undefined,
        icon: formIcon,
        status: finalStatus,
        lang: currentLang,
      };

      if (editingId) {
        await updateAchievement(editingId, payload);
        setFormMessage({ text: 'تغییرات افتخار با موفقیت ذخیره گردید.', type: 'success' });
      } else {
        await createAchievement(payload);
        setFormMessage({ text: 'افتخار جدید با موفقیت ثبت شد.', type: 'success' });
      }

      setTimeout(() => {
        setActiveTab('list');
        handleResetForm();
        loadAchievements();
      }, 1200);
    } catch (err: any) {
      if (err.errors) {
        const firstErr = Object.values(err.errors).flat()[0];
        setFormMessage({ text: firstErr as string, type: 'error' });
      } else {
        setFormMessage({ text: err.message || 'خطا در ذخیره افتخار', type: 'error' });
      }
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAchievement(deleteId);
      setAchievements(prev => prev.filter(a => a.id !== deleteId));
      showToast('افتخار با موفقیت حذف شد.', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در حذف افتخار', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-right rtl">
      {/* ===== Module Header Banner ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-amber-500/20">
        <div className="absolute top-0 left-0 translate-x-[-10%] translate-y-[-20%] w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
              <Trophy className="w-4 h-4" />
              <span>سامانه افتخارات دانشگاه</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              مدیریت افتخارات
              {activeLanguage && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/20 text-[11px] font-black font-sans uppercase">
                  <Globe className="w-3.5 h-3.5 text-amber-300" />
                  {activeLanguage.code} • {activeLanguage.name}
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
              ثبت، ویرایش و انتشار افتخارات دانشجویان و دانشگاه — افتخارات منتشرشده در صفحه «افتخارات» سایت عمومی نمایش داده می‌شوند
            </p>
          </div>

          {canEdit && (
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => { handleResetForm(); setActiveTab('editor'); }}
                className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت افتخار جدید</span>
              </button>
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{total}</div>
              <div className="text-[11px] text-gray-300">کل افتخارات</div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{publishedCount}</div>
              <div className="text-[11px] text-gray-300">منتشر شده</div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{draftCount}</div>
              <div className="text-[11px] text-gray-300">پیش‌نویس</div>
            </div>
          </div>
        </div>
      </div>

      <ToastNotification toast={toast} />

      {/* ===== Sub-tabs ===== */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-[#161618] rounded-2xl p-2 border border-gray-100 dark:border-white/10 shadow-sm">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'list' ? 'bg-amber-500 text-amber-950 shadow-md shadow-amber-500/20' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>آرشیو افتخارات</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 dark:bg-white/20 font-mono">{total}</span>
        </button>

        {canEdit && (
          <button
            onClick={() => { handleResetForm(); setActiveTab('editor'); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'editor' ? 'bg-amber-500 text-amber-950 shadow-md shadow-amber-500/20' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{editingId ? 'ویرایش افتخار' : 'ثبت افتخار جدید'}</span>
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => setActiveTab('visitor-analytics')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'visitor-analytics' ? 'bg-amber-500 text-amber-950 shadow-md shadow-amber-500/20' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>آمار بازدیدکنندگان</span>
          </button>
        )}
      </div>

      {/* ===== List View ===== */}
      {activeTab === 'list' && (
        <div className="space-y-5">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-[#161618] rounded-2xl p-4 border border-gray-100 dark:border-white/10 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در عنوان یا زیرعنوان..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'published', 'draft'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-amber-500 text-amber-950 shadow'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                >
                  {st === 'all' ? 'همه' : st === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
          ) : achievements.length === 0 ? (
            <div className="bg-white dark:bg-[#161618] rounded-3xl border border-gray-100 dark:border-white/10 p-16 text-center">
              <Trophy className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">افتخاری یافت نشد</h3>
              <p className="text-sm text-gray-400 mb-6">برای شروع، اولین افتخار را ثبت کنید.</p>
              {canEdit && (
                <button
                  onClick={() => { handleResetForm(); setActiveTab('editor'); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-amber-950 font-black text-xs hover:bg-amber-400 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  ثبت افتخار جدید
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {achievements.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-3xl overflow-hidden bg-white dark:bg-[#161618] border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Image */}
                  <div className="relative h-44 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-slate-800 to-indigo-950 flex items-center justify-center">
                        <div className="bg-amber-500/20 backdrop-blur-md w-14 h-14 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/30">
                          {getIconNode(item.icon, 24)}
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                    {/* Status badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black backdrop-blur-md border ${
                        item.status === 'published'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>
                        {item.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                      </span>
                    </div>

                    {/* Icon over image */}
                    <div className="absolute bottom-3 right-4 bg-amber-500/20 backdrop-blur-md w-11 h-11 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/30">
                      {getIconNode(item.icon)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-base font-black text-gray-900 dark:text-white mb-1.5 leading-tight line-clamp-2">
                      {item.title}
                    </h3>
                    {item.subtitle && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{item.subtitle}</p>
                    )}
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-4">
                      {item.author_name ? `ثبت توسط ${item.author_name}` : item.author_username}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-white/5">
                      {canEdit && (
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          ویرایش
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          حذف
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== Editor View ===== */}
      {activeTab === 'editor' && (
        <form onSubmit={handleSave} className="bg-white dark:bg-[#161618] rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
          {/* Editor header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
            <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit3 className="w-4 h-4 text-amber-500" />
                  ویرایش افتخار
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-amber-500" />
                  ثبت افتخار جدید
                </>
              )}
            </h2>
            <button
              type="button"
              onClick={() => { setActiveTab('list'); handleResetForm(); }}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {formMessage && (
              <div className={`px-4 py-3 rounded-2xl text-xs font-bold ${
                formMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              }`}>
                {formMessage.text}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">
                عنوان افتخار <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="مثلاً: کسب رتبه اول المپیاد علمی کشوری"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">زیرعنوان</label>
              <input
                type="text"
                value={formSubtitle}
                onChange={(e) => setFormSubtitle(e.target.value)}
                placeholder="توضیح کوتاه زیر عنوان (در کارت و صفحه جزئیات نمایش داده می‌شود)"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">
                توضیحات کامل (داستان موفقیت)
              </label>
              <WysiwygEditor
                content={formDescription}
                onChange={setFormDescription}
                placeholder="شرح کامل افتخار — در صفحه جزئیات نمایش داده می‌شود"
                minHeight="320px"
              />
              <p className="text-[10px] text-gray-400 mt-1.5">این متن با ویرایشگر متن نمایش داده می‌شود و در صفحه جزئیات به‌صورت HTML رندر می‌شود.</p>
            </div>

            {/* Icon picker */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">آیکون</label>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setFormIcon(opt.key)}
                    title={opt.label}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all cursor-pointer ${
                      formIcon === opt.key
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-500'
                        : 'border-gray-100 dark:border-white/10 text-gray-400 hover:border-amber-500/30 hover:text-amber-500'
                    }`}
                  >
                    {opt.icon}
                    <span className="text-[8px] font-bold truncate w-full text-center">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Image */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">تصویر</label>
              <div className="flex items-start gap-4">
                <div className="relative w-40 h-28 rounded-2xl overflow-hidden bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 shrink-0">
                  {formImageUrl ? (
                    <img src={formImageUrl} alt="پیش‌نمایش" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 dark:text-gray-600">
                      <ImageIcon className="w-8 h-8 mb-1" />
                      <span className="text-[10px] font-bold">بدون تصویر</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => setShowMediaSelector(true)}
                    className="px-4 py-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-colors cursor-pointer w-fit"
                  >
                    انتخاب از رسانه
                  </button>
                  {formImageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormImageUrl('')}
                      className="px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-colors cursor-pointer w-fit"
                    >
                      حذف تصویر
                    </button>
                  )}
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="یا آدرس تصویر را وارد کنید..."
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">وضعیت انتشار</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormStatus('published')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    formStatus === 'published'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-500 border border-transparent'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  انتشار (نمایش در سایت عمومی)
                </button>
                <button
                  type="button"
                  onClick={() => setFormStatus('draft')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    formStatus === 'draft'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/40'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-500 border border-transparent'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  پیش‌نویس
                </button>
              </div>
              {!canApprove && (
                <p className="text-[10px] text-gray-400 mt-2">
                  شما مجوز انتشار ندارید — این افتخار به‌صورت پیش‌نویس ذخیره می‌شود تا توسط مدیر منتشر شود.
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
            <button
              type="button"
              onClick={() => { setActiveTab('list'); handleResetForm(); }}
              className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {formLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {editingId ? 'ذخیره تغییرات' : 'ثبت افتخار'}
            </button>
          </div>
        </form>
      )}

      {/* ===== TAB: VISITOR ANALYTICS (آمار بازدیدکنندگان) ===== */}
      {activeTab === 'visitor-analytics' && (
        <AnalyticsDashboard viewableType="achievement" />
      )}

      {/* ===== Media Manager ===== */}
      <MediaManager
        open={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={(url: string) => { setFormImageUrl(url); setShowMediaSelector(false); }}
      />

      {/* ===== Delete Confirmation Modal ===== */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white dark:bg-[#161618] rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-white/10"
            >
              <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-4">
                <Trash2 className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="text-base font-black text-gray-900 dark:text-white mb-2">حذف افتخار</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                آیا از حذف این افتخار مطمئن هستید؟ این عمل قابل بازگشت نیست.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-black hover:bg-rose-400 transition-colors cursor-pointer"
                >
                  حذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
