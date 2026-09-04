// ============================================================
// QuickCreateDialog — دیالوگ سریع ایجاد گروه آموزشی: فقط نام گروه را
// می‌گیرد، رکورد را (به‌صورت پیش‌نویس) می‌سازد، و کاربر را مستقیماً به
// ویرایشگر بصری همان گروه هدایت می‌کند — به‌جای باز شدن فرم تخت کامل.
// ============================================================

import React, { useState } from 'react';
import { X, Building2, Loader2, Send } from 'lucide-react';
import type { AcademicDepartmentItem } from '@/src/shared-types';
import { createDepartment } from './api';
import { useLanguage } from '@/src/shared-utils/LanguageContext';

interface QuickCreateDialogProps {
  onClose: () => void;
  onCreated: (department: AcademicDepartmentItem) => void;
}

export default function QuickCreateDialog({ onClose, onCreated }: QuickCreateDialogProps) {
  const { currentLang } = useLanguage();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('لطفاً نام گروه آموزشی را وارد نمایید.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await createDepartment({ name: name.trim(), lang: currentLang, status: 'draft' });
      onCreated(res.data);
    } catch (err: any) {
      setError(err.message || 'خطا در ایجاد گروه آموزشی');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-[420px] max-w-[92vw] bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl overflow-hidden text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
            <Building2 className="w-4 h-4 text-emerald-500" />
            <span>ثبت سریع گروه آموزشی</span>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-300">نام گروه آموزشی</label>
          <input
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً گروه مهندسی کامپیوتر"
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
          <p className="text-[11px] text-slate-400">
            بقیهٔ اطلاعات (مدیر گروه، رشته‌ها، فایل‌ها و ...) را در مرحلهٔ بعد، به‌صورت بصری روی خودِ صفحهٔ گروه وارد می‌کنید.
          </p>
          {error && <p className="text-xs font-bold text-rose-500">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            ایجاد و ادامه
          </button>
        </div>
      </form>
    </div>
  );
}
