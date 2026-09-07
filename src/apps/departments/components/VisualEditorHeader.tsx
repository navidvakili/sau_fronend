import React from 'react';
import {
  AlertCircle, ArrowRight, CheckCircle2, LayoutTemplate, Loader2, Save, Settings2, Sparkles,
} from 'lucide-react';

interface VisualEditorHeaderProps {
  departmentName: string;
  layoutLinked: boolean;
  canApprove: boolean;
  statusChoice: 'published' | 'draft';
  saving: boolean;
  saveSuccess: boolean;
  onBack: () => void;
  onOpenSlugDialog: () => void;
  onOpenLayoutDialog: () => void;
  onUseFlatForm: () => void;
  onToggleStatus: () => void;
  onSave: () => void;
}

/** هدرِ ویرایشگر بصری — هم‌سبک با هدر صفحه‌ساز (page-builder) */
export default function VisualEditorHeader({
  departmentName, layoutLinked, canApprove, statusChoice, saving, saveSuccess,
  onBack, onOpenSlugDialog, onOpenLayoutDialog, onUseFlatForm, onToggleStatus, onSave,
}: VisualEditorHeaderProps) {
  return (
    <header className="sticky top-0 z-40 h-16 px-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-xs rounded-t-2xl">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          title="بازگشت به فهرست گروه‌ها"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-black text-slate-900 dark:text-white">{departmentName}</div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="px-1.5 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/20">
                ویرایشگر بصری
              </span>
              <span>روی هر بخش کلیک کنید تا همان‌جا ویرایشش کنید</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSlugDialog}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          title="تنظیم نشانی (slug) صفحهٔ عمومی گروه"
        >
          <Settings2 className="w-4 h-4 text-indigo-500" />
        </button>
        <button
          onClick={onOpenLayoutDialog}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          title={layoutLinked ? 'تغییر قالب' : 'اتصال قالب'}
        >
          <LayoutTemplate className="w-4 h-4 text-indigo-500" />
        </button>
        <button
          onClick={onUseFlatForm}
          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
        >
          فرم کامل
        </button>
        {canApprove ? (
          <button
            onClick={onToggleStatus}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border ${
              statusChoice === 'published'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/40'
            }`}
            title="کلیک کنید تا وضعیت انتشار تغییر کند (با «ذخیره تغییرات» اعمال می‌شود)"
          >
            {statusChoice === 'published' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{statusChoice === 'published' ? 'منتشر شده' : 'پیش‌نویس'}</span>
          </button>
        ) : (
          <span
            className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/40 flex items-center gap-1.5"
            title="شما مجوز انتشار (departments.approve) ندارید — این گروه به‌صورت پیش‌نویس ذخیره می‌شود تا توسط مدیر منتشر شود."
          >
            <AlertCircle className="w-4 h-4" />
            <span>پیش‌نویس</span>
          </span>
        )}
        <button
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white dark:text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>در حال ذخیره...</span>
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>ذخیره شد</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>ذخیره تغییرات</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
