// ============================================================
// HomeIntroManagement — مدیریت بخش «معرفی» صفحه اصلی سایت عمومی
// شامل: توضیحات، تصاویر (با ابعاد مشخص) و آمارها
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Info, Image as ImageIcon, Send, Loader2, CheckCircle2, AlertCircle, Globe,
  Award, Plus, Trash2, GripVertical, Columns, LayoutGrid,
} from 'lucide-react';
import ToastNotification from '@/src/shared-components/ToastNotification';
import MediaManager from '@/src/shared-components/MediaManager';
import WysiwygEditor from '@/src/shared-components/WysiwygEditor';
import { IconPicker, ICON_COMPONENTS } from '@/src/apps/page-builder/components/IconPicker';
import { fetchCurrentHomeIntro, updateHomeIntro } from './api';
import type { HomeIntroImage, HomeIntroStat } from './api';
import type { User } from '@/src/shared-types';
import { useAppPermissions } from '@/src/shared-utils/PermissionsContext';
import { useLanguage } from '@/src/shared-utils/LanguageContext';

interface HomeIntroManagementProps {
  user?: User | null;
}

const IMAGE_SLOTS = 4;
const IMAGE_WIDTH = 900;
const IMAGE_HEIGHT = 1100;

const STATS_COLUMN_OPTIONS = [2, 3, 4] as const;

function StatIcon({ name, size = 18 }: { name: string | null | undefined; size?: number }) {
  const Icon = (name && ICON_COMPONENTS[name]) || Award;
  return <Icon width={size} height={size} />;
}

const emptyImage = (): HomeIntroImage => ({ url: '', alt: '' });
const emptyStat = (): HomeIntroStat => ({ icon: 'award', number: '', label: '', sub: '' });

export default function HomeIntroManagement({ user }: HomeIntroManagementProps) {
  const { can } = useAppPermissions();
  const { currentLang, getLanguage } = useLanguage();
  const activeLanguage = getLanguage(currentLang);
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('support');
  const isEditor = user?.roles?.includes('editor');
  const roleCanEdit = isAdmin || isEditor;
  const permCanEdit = can('home-intro.edit');
  const canEdit = roleCanEdit || permCanEdit;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [tag, setTag] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<HomeIntroImage[]>(Array.from({ length: IMAGE_SLOTS }, emptyImage));
  const [stats, setStats] = useState<HomeIntroStat[]>([]);
  const [statsColumns, setStatsColumns] = useState<number>(2);
  const [isActive, setIsActive] = useState(true);

  const [activeImageSlot, setActiveImageSlot] = useState<number | null>(null);
  const [activeIconStatIndex, setActiveIconStatIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCurrentHomeIntro(currentLang);
      setTag(data.tag || '');
      setTitle(data.title || '');
      setDescription(data.description || '');
      const loadedImages = Array.from({ length: IMAGE_SLOTS }, (_, i) => data.images?.[i] || emptyImage());
      setImages(loadedImages);
      setStats(Array.isArray(data.stats) && data.stats.length > 0 ? data.stats : []);
      setStatsColumns(data.stats_columns && STATS_COLUMN_OPTIONS.includes(data.stats_columns as any) ? data.stats_columns : 2);
      setIsActive(data.is_active !== false);
    } catch (err: any) {
      showToast(err.message || 'خطا در بارگذاری بخش معرفی', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentLang]);

  useEffect(() => {
    load();
  }, [load]);

  const handleImageChange = (index: number, url: string) => {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, url } : img)));
  };

  const handleImageAltChange = (index: number, alt: string) => {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, alt } : img)));
  };

  const handleAddStat = () => {
    setStats((prev) => [...prev, emptyStat()]);
  };

  const handleRemoveStat = (index: number) => {
    setStats((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStatChange = (index: number, field: keyof HomeIntroStat, value: string) => {
    setStats((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        tag: tag || undefined,
        title: title || undefined,
        description: description || undefined,
        images: images.filter((img) => img.url.trim() !== ''),
        stats: stats.filter((s) => s.number.trim() !== '' || s.label.trim() !== ''),
        stats_columns: statsColumns,
        is_active: isActive,
        lang: currentLang,
      };

      await updateHomeIntro(payload);
      setMessage({ text: 'تغییرات بخش معرفی با موفقیت ذخیره شد.', type: 'success' });
      showToast('بخش معرفی به‌روزرسانی شد.', 'success');
    } catch (err: any) {
      if (err.errors) {
        const firstErr = Object.values(err.errors).flat()[0];
        setMessage({ text: firstErr as string, type: 'error' });
      } else {
        setMessage({ text: err.message || 'خطا در ذخیره بخش معرفی', type: 'error' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-right rtl">
      {/* ===== Module Header Banner ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-sky-500/20">
        <div className="absolute top-0 left-0 translate-x-[-10%] translate-y-[-20%] w-80 h-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold">
              <Info className="w-4 h-4" />
              <span>بخش معرفی صفحه اصلی</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              مدیریت معرفی دانشگاه
              {activeLanguage && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/20 text-[11px] font-black font-sans uppercase">
                  <Globe className="w-3.5 h-3.5 text-sky-300" />
                  {activeLanguage.code} • {activeLanguage.name}
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
              توضیحات، تصاویر و آمارهای بخش «معرفی» در صفحه اصلی سایت عمومی از همین‌جا مدیریت می‌شوند.
            </p>
          </div>
        </div>
      </div>

      <ToastNotification toast={toast} />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {message && (
            <div className={`px-4 py-3 rounded-2xl text-xs font-bold ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            }`}>
              {message.text}
            </div>
          )}

          {/* ===== Text Section ===== */}
          <div className="bg-white dark:bg-[#161618] rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm p-6 space-y-6">
            <h2 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-500" />
              متن معرفی
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">برچسب کوچک (بالای عنوان)</label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  disabled={!canEdit}
                  placeholder="مثلاً: معرفی"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">عنوان</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={!canEdit}
                  placeholder="مثلاً: دانشگاه علم و هنر"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">توضیحات</label>
              <WysiwygEditor
                content={description}
                onChange={setDescription}
                placeholder="متن معرفی دانشگاه — در صفحه اصلی سایت عمومی نمایش داده می‌شود"
                minHeight="220px"
                editable={canEdit}
              />
            </div>
          </div>

          {/* ===== Images Section ===== */}
          <div className="bg-white dark:bg-[#161618] rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-sky-500" />
                تصاویر (اسلایدر معرفی)
              </h2>
              <span className="text-[11px] text-gray-400 font-bold">
                ابعاد پیشنهادی: {IMAGE_WIDTH}×{IMAGE_HEIGHT} پیکسل (عمودی، نسبت تقریبی ۴:۵)
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                    {img.url ? (
                      <img src={img.url} alt={img.alt || ''} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 gap-1">
                        <ImageIcon className="w-7 h-7" />
                        <span className="text-[10px] font-bold">تصویر {idx + 1}</span>
                      </div>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveImageSlot(idx)}
                        className="px-3 py-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        انتخاب از رسانه
                      </button>
                      {img.url && (
                        <button
                          type="button"
                          onClick={() => handleImageChange(idx, '')}
                          className="px-3 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          حذف تصویر
                        </button>
                      )}
                      <input
                        type="text"
                        value={img.alt || ''}
                        onChange={(e) => handleImageAltChange(idx, e.target.value)}
                        placeholder="متن جایگزین (alt)"
                        className="w-full px-2.5 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-[11px] focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ===== Stats Section ===== */}
          <div className="bg-white dark:bg-[#161618] rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-sky-500" />
                آمارها
              </h2>
              {canEdit && (
                <button
                  type="button"
                  onClick={handleAddStat}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  افزودن آمار
                </button>
              )}
            </div>

            {/* Layout / columns setting */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
              <LayoutGrid className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 shrink-0">چیدمان آمارها (تعداد ستون در هر ردیف):</span>
              <div className="flex items-center gap-1.5">
                {STATS_COLUMN_OPTIONS.map((cols) => (
                  <button
                    key={cols}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => setStatsColumns(cols)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                      statsColumns === cols
                        ? 'bg-sky-500 text-sky-950'
                        : 'bg-white dark:bg-white/10 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-white/10 hover:border-sky-500/40'
                    }`}
                  >
                    <Columns className="w-3 h-3" />
                    {cols}
                  </button>
                ))}
              </div>
            </div>

            {stats.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-xs">
                هنوز آماری اضافه نشده است.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10"
                  >
                    <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 hidden md:block shrink-0" />

                    {/* Icon picker trigger */}
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => setActiveIconStatIndex(idx)}
                      title="انتخاب آیکون"
                      className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500 hover:bg-sky-500/20 shrink-0 flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <StatIcon name={stat.icon} size={18} />
                    </button>

                    <input
                      type="text"
                      value={stat.number}
                      onChange={(e) => handleStatChange(idx, 'number', e.target.value)}
                      disabled={!canEdit}
                      placeholder="عدد (مثلاً ۱۰,۰۰۰+)"
                      className="flex-1 min-w-[100px] px-3 py-2.5 rounded-xl bg-white dark:bg-white/10 border border-gray-100 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-60"
                    />
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => handleStatChange(idx, 'label', e.target.value)}
                      disabled={!canEdit}
                      placeholder="عنوان (مثلاً دانشجوی فعال)"
                      className="flex-1 min-w-[140px] px-3 py-2.5 rounded-xl bg-white dark:bg-white/10 border border-gray-100 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-60"
                    />
                    <input
                      type="text"
                      value={stat.sub || ''}
                      onChange={(e) => handleStatChange(idx, 'sub', e.target.value)}
                      disabled={!canEdit}
                      placeholder="زیرعنوان (اختیاری)"
                      className="flex-1 min-w-[140px] px-3 py-2.5 rounded-xl bg-white dark:bg-white/10 border border-gray-100 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-60"
                    />

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStat(idx)}
                        className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===== Status + Save ===== */}
          {canEdit && (
            <div className="bg-white dark:bg-[#161618] rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setIsActive((v) => !v)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-500 border border-transparent'
                }`}
              >
                {isActive ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {isActive ? 'فعال (نمایش در سایت عمومی)' : 'غیرفعال'}
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-sky-950 font-black text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                ذخیره تغییرات
              </button>
            </div>
          )}
        </form>
      )}

      {/* ===== Media Manager ===== */}
      <MediaManager
        open={activeImageSlot !== null}
        onClose={() => setActiveImageSlot(null)}
        onSelect={(url: string) => {
          if (activeImageSlot !== null) handleImageChange(activeImageSlot, url);
          setActiveImageSlot(null);
        }}
        title={`انتخاب تصویر ${activeImageSlot !== null ? activeImageSlot + 1 : ''}`}
      />

      {/* ===== Icon Picker (stats) ===== */}
      <IconPicker
        open={activeIconStatIndex !== null}
        onClose={() => setActiveIconStatIndex(null)}
        value={activeIconStatIndex !== null ? stats[activeIconStatIndex]?.icon : undefined}
        onSelect={(iconName) => {
          if (activeIconStatIndex !== null) handleStatChange(activeIconStatIndex, 'icon', iconName);
          setActiveIconStatIndex(null);
        }}
      />
    </div>
  );
}
