// ============================================================
// AchievementsWidget — از WidgetRenderer.tsx استخراج شد (بخش «SMART WIDGETS»).
// ============================================================

import React from 'react';
import type { WidgetInstance, WidgetDataBinding } from '../../builderTypes';
import { fetchDataSourceAchievements } from '../../api';
import type { AchievementItem } from '@/src/shared-types';
import { useSmartData } from '../../hooks/useSmartData';
import { formatFaDate } from '../../utils/styleResolvers';
import { SmartEmpty, SmartSkeleton } from './SmartWidgetStates';

/** ویجت تایم‌لاین افتخارات — اتصال به وب‌سرویس افتخارات */
export const AchievementsWidget: React.FC<{
  widget: WidgetInstance;
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
}> = ({ widget, binding, containerStyle }) => {
  const { data, error, retry } = useSmartData<AchievementItem>(() =>
    fetchDataSourceAchievements({
      per_page: binding.limit || 5,
      status: 'published'
    }).then((res) => res.data),
    [binding.limit]
  );

  const achs = data || [];

  return (
    <div style={containerStyle} className="space-y-4">
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !data ? (
        <SmartSkeleton variant="list" count={binding.limit || 5} />
      ) : achs.length === 0 ? null : (
        <div className="space-y-3 relative before:absolute before:right-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-yellow-500/30">
          {achs.map((ach) => (
            <div key={ach.id} className="relative pr-9 flex flex-col gap-1">
              <div className="absolute right-2 top-1 w-5 h-5 rounded-full bg-yellow-500 text-slate-950 flex items-center justify-center text-[10px] font-black shadow-md">
                {ach.icon || '★'}
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-1 shadow-xs">
                <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white">
                  <span>{ach.title}</span>
                  <span className="text-[10px] text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded bg-yellow-500/10">
                    {ach.published_at ? formatFaDate(ach.published_at) : ''}
                  </span>
                </div>
                {ach.subtitle && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">{ach.subtitle}</div>
                )}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                  {ach.desc || ach.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
