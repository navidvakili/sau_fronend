import React, { useEffect, useState } from 'react';
import { Link2, Loader2, Save, X } from 'lucide-react';
import { inputCls } from '../constants/styles';

interface SlugDialogProps {
  open: boolean;
  /** نشانیِ فعلیِ گروه — هر بار دیالوگ باز می‌شود، پیش‌نویس از روی این مقدار شروع می‌شود */
  initialSlug: string;
  saving: boolean;
  onClose: () => void;
  /** اعتبارسنجی/فراخوانی API/toast/بستنِ دیالوگ همگی در سطح بالاتر (هوکِ دادهٔ گروه) انجام می‌شود */
  onSave: (slug: string) => void;
}

/** دیالوگ «تنظیم نشانی (slug) صفحهٔ عمومی گروه» */
export default function SlugDialog({ open, initialSlug, saving, onClose, onSave }: SlugDialogProps) {
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (open) setDraft(initialSlug);
  }, [open, initialSlug]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-[420px] max-w-full bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl overflow-hidden text-right" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Link2 className="w-4 h-4 text-indigo-500" />
            نشانی صفحهٔ عمومی گروه
          </span>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-300">نشانی (slug)</label>
          <input
            type="text"
            dir="ltr"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="comp-eng"
            className={`${inputCls} text-left`}
          />
          <p className="text-[11px] text-slate-400 break-all" dir="ltr">
            /departments/{draft.trim() || '...'}
          </p>
          <p className="text-[11px] text-slate-400">
            در صورت خالی گذاشتنِ این نشانی هنگام ایجاد گروه، به‌صورت خودکار از روی نام گروه ساخته می‌شود؛ در صورت تکراری بودن، به‌طور خودکار یکتا می‌شود.
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            انصراف
          </button>
          <button
            onClick={() => onSave(draft)}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            ذخیره نشانی
          </button>
        </div>
      </div>
    </div>
  );
}
