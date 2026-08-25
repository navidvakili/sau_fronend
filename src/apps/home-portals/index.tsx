// ============================================================
// HomePortalsManagement — مدیریت بخش «سامانه‌های دانشگاه» در پایین صفحه اصلی سایت عمومی
// شامل: عنوان/زیرعنوان بخش و کارت‌های دسترسی سریع به سامانه‌ها
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  LayoutGrid, Send, Loader2, CheckCircle2, AlertCircle, Globe,
  Plus, Trash2, GripVertical, Link2 as LinkIcon,
} from 'lucide-react';
import ToastNotification from '@/src/shared-components/ToastNotification';
import { IconPicker, ICON_COMPONENTS } from '@/src/apps/page-builder/components/IconPicker';
import { fetchCurrentHomePortals, updateHomePortals, PORTAL_COLORS } from './api';
import type { HomePortalItem, PortalColor } from './api';
import type { User } from '@/src/shared-types';
import { useAppPermissions } from '@/src/shared-utils/PermissionsContext';
import { useLanguage } from '@/src/shared-utils/LanguageContext';

interface HomePortalsManagementProps {
  user?: User | null;
}

function ItemIcon({ name, size = 18 }: { name: string | null | undefined; size?: number }) {
  const Icon = (name && ICON_COMPONENTS[name]) || LayoutGrid;
  return <Icon width={size} height={size} />;
}

/** رنگ سواچ‌ها — کلاس‌های Tailwind باید به‌صورت رشته کامل نوشته شوند تا JIT آن‌ها را حذف نکند */
const COLOR_SWATCH_CLASSES: Record<PortalColor, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  indigo: 'bg-indigo-500',
  teal: 'bg-teal-500',
  pink: 'bg-pink-500',
};

const emptyItem = (): HomePortalItem => ({ icon: 'link', title: '', description: '', url: '', color: 'blue' });

export default function HomePortalsManagement({ user }: HomePortalsManagementProps) {
  const { can } = useAppPermissions();
  const { currentLang, getLanguage } = useLanguage();
  const activeLanguage = getLanguage(currentLang);
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('support');
  const isEditor = user?.roles?.includes('editor');
  const roleCanEdit = isAdmin || isEditor;
  const permCanEdit = can('home-portals.edit');
  const canEdit = roleCanEdit || permCanEdit;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [items, setItems] = useState<HomePortalItem[]>([]);
  const [isActive, setIsActive] = useState(true);

  const [activeIconItemIndex, setActiveIconItemIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCurrentHomePortals(currentLang);
      setTitle(data.title || '');
      setSubtitle(data.subtitle || '');
      setItems(Array.isArray(data.items) ? data.items : []);
      setIsActive(data.is_active !== false);
    } catch (err: any) {
      showToast(err.message || 'خطا در بارگذاری بخش سامانه‌ها', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentLang]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddItem = () => {
    setItems((prev) => [...prev, emptyItem()]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof HomePortalItem, value: string) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        title: title || undefined,
        subtitle: subtitle || undefined,
        items: items.filter((it) => it.title.trim() !== '' || it.url.trim() !== ''),
        is_active: isActive,
        lang: currentLang,
      };

      await updateHomePortals(payload);
      setMessage({ text: 'تغییرات بخش سامانه‌های دانشگاه با موفقیت ذخیره شد.', type: 'success' });
      showToast('بخش سامانه‌های دانشگاه به‌روزرسانی شد.', 'success');
    } catch (err: any) {
      if (err.errors) {
        const firstErr = Object.values(err.errors).flat()[0];
        setMessage({ text: firstErr as string, type: 'error' });
      } else {
        setMessage({ text: err.message || 'خطا در ذخیره بخش سامانه‌ها', type: 'error' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-right rtl">
      {/* ===== Module Header Banner ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-950 text-white p-6 sm:p-8 shadow-xl border border-indigo-500/20">
        <div className="absolute top-0 left-0 translate-x-[-10%] translate-y-[-20%] w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
              <LayoutGrid className="w-4 h-4" />
              <span>دسترسی سریع به سامانه‌ها</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              مدیریت سامانه‌های دانشگاه
              {activeLanguage && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/20 text-[11px] font-black font-sans uppercase">
                  <Globe className="w-3.5 h-3.5 text-indigo-300" />
                  {activeLanguage.code} • {activeLanguage.name}
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
              کارت‌های دسترسی سریع (سامانه آموزشی، پرتال، اتوماسیون و...) در پایین صفحه اصلی سایت عمومی از همین‌جا مدیریت می‌شوند.
            </p>
          </div>
        </div>
      </div>

      <ToastNotification toast={toast} />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
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

          {/* ===== Title / Subtitle ===== */}
          <div className="bg-white dark:bg-[#161618] rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-indigo-500" />
              عنوان بخش
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">عنوان</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={!canEdit}
                  placeholder="مثلاً: سامانه‌های دانشگاهی"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">زیرعنوان</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  disabled={!canEdit}
                  placeholder="مثلاً: دسترسی مستقیم به خدمات الکترونیک"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* ===== Items ===== */}
          <div className="bg-white dark:bg-[#161618] rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-indigo-500" />
                کارت‌های سامانه‌ها
              </h2>
              {canEdit && (
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  افزودن سامانه
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-xs">
                هنوز سامانه‌ای اضافه نشده است.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 hidden md:block shrink-0" />

                      {/* Icon picker trigger */}
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => setActiveIconItemIndex(idx)}
                        title="انتخاب آیکون"
                        className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 shrink-0 flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <ItemIcon name={item.icon} size={18} />
                      </button>

                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleItemChange(idx, 'title', e.target.value)}
                        disabled={!canEdit}
                        placeholder="عنوان (مثلاً سامانه آموزشی)"
                        className="flex-1 min-w-[140px] px-3 py-2.5 rounded-xl bg-white dark:bg-white/10 border border-gray-100 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-60"
                      />

                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        disabled={!canEdit}
                        placeholder="توضیح کوتاه"
                        className="flex-1 min-w-[140px] px-3 py-2.5 rounded-xl bg-white dark:bg-white/10 border border-gray-100 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-60"
                      />

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="relative flex-1">
                        <LinkIcon className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={item.url}
                          onChange={(e) => handleItemChange(idx, 'url', e.target.value)}
                          disabled={!canEdit}
                          placeholder="آدرس سامانه (مثلاً https://lms.sau.ac.ir)"
                          dir="ltr"
                          className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-white dark:bg-white/10 border border-gray-100 dark:border-white/10 text-xs text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-60"
                        />
                      </div>

                      {/* Color swatches */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {PORTAL_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            disabled={!canEdit}
                            onClick={() => handleItemChange(idx, 'color', color)}
                            title={color}
                            className={`w-6 h-6 rounded-full ${COLOR_SWATCH_CLASSES[color]} transition-all cursor-pointer disabled:cursor-not-allowed ${
                              item.color === color ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-[#161618] scale-110' : 'opacity-60 hover:opacity-100'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
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
                className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                ذخیره تغییرات
              </button>
            </div>
          )}
        </form>
      )}

      {/* ===== Icon Picker ===== */}
      <IconPicker
        open={activeIconItemIndex !== null}
        onClose={() => setActiveIconItemIndex(null)}
        value={activeIconItemIndex !== null ? items[activeIconItemIndex]?.icon : undefined}
        onSelect={(iconName) => {
          if (activeIconItemIndex !== null) handleItemChange(activeIconItemIndex, 'icon', iconName);
          setActiveIconItemIndex(null);
        }}
      />
    </div>
  );
}
