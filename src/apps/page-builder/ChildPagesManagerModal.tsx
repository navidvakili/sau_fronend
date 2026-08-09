import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, FolderTree, Plus, Loader2, Pencil, Trash2, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import type { SmartPageDto } from './api';

interface ChildPagesManagerModalProps {
  /** شناسهٔ صفحهٔ والد — اگر null باشد یعنی صفحه هنوز ذخیره نشده */
  parentId: number | null;
  parentTitle: string;
  parentSlug: string;
  children: SmartPageDto[];
  isLoading: boolean;
  isCreating: boolean;
  createError?: string | null;
  onCreateChild: (data: { title: string; slug: string; status: 'published' | 'draft' }) => void;
  onOpenChild: (id: number) => void;
  onDeleteChild: (page: SmartPageDto) => void;
  onClose: () => void;
}

const StatusBadge: React.FC<{ status: 'published' | 'draft' }> = ({ status }) => (
  <span
    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
      status === 'published'
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    }`}
  >
    {status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
  </span>
);

/**
 * مدیریت زیرصفحه‌های یک صفحهٔ والد — از داخل استودیوی همان صفحه باز می‌شود.
 * زیرصفحه‌ها در فهرست اصلی «صفحه ساز هوشمند» نمایش داده نمی‌شوند.
 */
export const ChildPagesManagerModal: React.FC<ChildPagesManagerModalProps> = ({
  parentId,
  parentTitle,
  parentSlug,
  children,
  isLoading,
  isCreating,
  createError,
  onCreateChild,
  onOpenChild,
  onDeleteChild,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugError, setSlugError] = useState<string | null>(null);
  const [status, setStatus] = useState<'published' | 'draft'>('draft');

  const handleSlugChange = (value: string) => {
    const normalized = value
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');
    setSlug(normalized);
    setSlugError(normalized ? null : 'Slug نباید خالی باشد و فقط حروف انگلیسی، عدد و خط تیره مجاز است.');
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      setSlugError('عنوان زیرصفحه الزامی است.');
      return;
    }
    if (!slug.trim()) {
      setSlugError('Slug زیرصفحه الزامی است.');
      return;
    }
    onCreateChild({ title: title.trim(), slug, status });
    // پس از موفقیت والد، فرم برای ساخت زیرصفحهٔ بعدی خالی می‌شود
    setTitle('');
    setSlug('');
    setSlugError(null);
    setStatus('draft');
  };

  const childPath = (child: SmartPageDto) => `/page/${parentSlug}/${child.slug}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-2xl rtl text-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-200 dark:border-slate-800 bg-gradient-to-l from-indigo-500/10 via-transparent to-teal-500/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
              <FolderTree className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black text-slate-900 dark:text-white truncate">زیرصفحه‌های «{parentTitle}»</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate" dir="ltr">
                sau.ac.ir/page/{parentSlug}/slug
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* صفحه هنوز ذخیره نشده */}
          {!parentId && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                ابتدا این صفحه را با دکمهٔ «ذخیره و انتشار» ذخیره کنید تا بتوانید زیرصفحه‌ای برای آن بسازید.
              </span>
            </div>
          )}

          {/* فرم ایجاد زیرصفحه */}
          {parentId && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200">
                <Plus className="w-4 h-4 text-teal-600" />
                ایجاد زیرصفحهٔ جدید
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">عنوان زیرصفحه *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثلاً: پذیرش کارشناسی ارشد"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">Slug (بخش آخر لینک) *</label>
                  <div className="flex items-center gap-1 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus-within:border-teal-500 px-3">
                    <span className="text-[10px] text-slate-400 whitespace-nowrap" dir="ltr">
                      /page/{parentSlug}/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="arshad-99"
                      dir="ltr"
                      className="w-full py-2 bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400"
                    />
                  </div>
                  {slugError && <p className="text-[10px] text-rose-500 font-bold">{slugError}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500">وضعیت:</span>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-1 rounded-xl">
                    <button
                      onClick={() => setStatus('draft')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        status === 'draft' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-amber-500'
                      }`}
                    >
                      پیش‌نویس
                    </button>
                    <button
                      onClick={() => setStatus('published')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        status === 'published' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 hover:text-emerald-500'
                      }`}
                    >
                      منتشر شده
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={isCreating}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-60"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>ایجاد و باز کردن</span>
                </button>
              </div>
              {createError && (
                <p className="text-[11px] text-rose-500 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {createError}
                </p>
              )}
            </div>
          )}

          {/* فهرست زیرصفحه‌ها */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-black text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-indigo-500" />
                زیرصفحه‌ها ({children.length})
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : children.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                هنوز زیرصفحه‌ای ساخته نشده است.
                {parentId && ' با فرم بالا اولین زیرصفحه را بسازید.'}
              </div>
            ) : (
              <div className="space-y-2">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className="group p-3 rounded-2xl bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 hover:border-indigo-500/40 transition-all flex items-center gap-3"
                  >
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                      <FolderTree className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate">{child.title}</span>
                        <StatusBadge status={child.status} />
                      </div>
                      <div className="text-[10px] text-slate-400 truncate" dir="ltr">
                        {childPath(child)}
                        {child.updated_at && (
                          <span className="mr-3 inline-flex items-center gap-1" dir="rtl">
                            <Clock className="w-3 h-3" />
                            {new Date(child.updated_at).toLocaleDateString('fa-IR')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onOpenChild(child.id!)}
                        className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-600 dark:text-indigo-400 transition-all cursor-pointer"
                        title="باز کردن و طراحی این زیرصفحه"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteChild(child)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 transition-all cursor-pointer"
                        title="حذف زیرصفحه"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/60">
          <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
            زیرصفحه‌ها فقط از داخل همین صفحه قابل مدیریت هستند.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
          >
            بستن
          </button>
        </div>
      </motion.div>
    </div>
  );
};
