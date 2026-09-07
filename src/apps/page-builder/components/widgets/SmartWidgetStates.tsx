// ============================================================
// SmartEmpty / SmartSkeleton — حالت‌های خطا و بارگذاری مشترک ویجت‌های هوشمند (داده‌محور).
// از WidgetRenderer.tsx استخراج شد.
// ============================================================

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/** حالت خطا / داده خالی ویجت هوشمند — فقط در صورت خطا نمایش داده می‌شود */
export const SmartEmpty: React.FC<{ error?: string | null; onRetry?: () => void }> = ({ error, onRetry }) => (
  <div className="py-6 text-center space-y-2">
    <div className="flex items-center justify-center gap-2 text-xs font-bold text-rose-500">
      <AlertTriangle className="w-4 h-4" />
      <span>{error || 'داده‌ای برای نمایش یافت نشد'}</span>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1.5 mx-auto cursor-pointer"
      >
        <RefreshCw className="w-3 h-3" />
        <span>تلاش مجدد</span>
      </button>
    )}
  </div>
);

/** اسکلت‌تون (Skeleton) ویجت‌های هوشمند — هنگام دریافت داده از وب‌سرویس نمایش داده می‌شود */
export const SmartSkeleton: React.FC<{
  variant?: 'cards' | 'list' | 'table' | 'gallery' | 'rows';
  count?: number;
}> = ({ variant = 'list', count = 3 }) => {
  const shimmer = 'bg-slate-200/80 dark:bg-slate-800 animate-pulse';

  if (variant === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden"
          >
            <div className={`h-24 ${shimmer}`} />
            <div className="p-3 space-y-2">
              <div className={`h-2.5 rounded w-3/4 ${shimmer}`} />
              <div className={`h-2 rounded w-full ${shimmer}`} />
              <div className={`h-2 rounded w-5/6 ${shimmer}`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'gallery') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`h-20 rounded-lg ${shimmer}`} />
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-2 border-b border-gray-100 dark:border-slate-800 last:border-0"
          >
            <div className={`w-6 h-6 rounded-md shrink-0 ${shimmer}`} />
            <div className="flex-1 space-y-1.5">
              <div className={`h-2.5 rounded w-2/5 ${shimmer}`} />
              <div className={`h-2 rounded w-1/3 ${shimmer}`} />
            </div>
            <div className={`w-14 h-2.5 rounded ${shimmer}`} />
          </div>
        ))}
      </div>
    );
  }

  // list / rows
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center gap-2.5"
        >
          <div className={`w-7 h-7 rounded-lg shrink-0 ${shimmer}`} />
          <div className="flex-1 space-y-1.5">
            <div className={`h-2.5 rounded w-2/3 ${shimmer}`} />
            <div className={`h-2 rounded w-1/2 ${shimmer}`} />
          </div>
        </div>
      ))}
    </div>
  );
};
