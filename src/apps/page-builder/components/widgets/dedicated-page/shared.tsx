// ============================================================
// Shared bits for dp-* widgets — از WidgetRenderer.tsx استخراج شد
// (بخش «بلوک‌های صفحات اختصاصی»، مشترک بین همهٔ ویجت‌های dp-*).
// ============================================================

import React from 'react';
import { Building2 } from 'lucide-react';

/** پیام «هنوز پیکربندی نشده» — وقتی هنوز صفحهٔ اختصاصی از پنل تنظیمات انتخاب نشده باشد */
export const DedicatedPageNotConfigured: React.FC = () => (
  <div className="py-6 text-center space-y-2 rounded-xl border-2 border-dashed border-violet-300 dark:border-violet-800 bg-violet-500/5">
    <div className="flex items-center justify-center gap-2 text-xs font-bold text-violet-600 dark:text-violet-400">
      <Building2 className="w-4 h-4" />
      <span>این بلوک هنوز به صفحهٔ اختصاصی متصل نشده</span>
    </div>
    <p className="text-[11px] text-slate-500 dark:text-slate-400">از پنل تنظیمات (Smart Binding) یک صفحهٔ اختصاصی انتخاب کنید</p>
  </div>
);

export const DP_TYPE_DATE_LABEL: Record<string, string> = {
  event: 'تاریخ برگزاری',
  journal_issue: 'تاریخ انتشار'
};

/** کلاس شبکهٔ ستونی بر اساس تعداد ستون انتخاب‌شده در تنظیمات — برای بلوک‌های dp-* حالت grid */
const DP_GRID_COLS_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-2 lg:grid-cols-5',
  6: 'grid-cols-2 lg:grid-cols-6'
};
export const dpGridColsClass = (cols?: number, fallback = 2): string =>
  DP_GRID_COLS_CLASS[Math.min(Math.max(Number(cols) || fallback, 1), 6)] || DP_GRID_COLS_CLASS[fallback];
