// ============================================================
// DedicatedPageWeeklyScheduleWidget — از WidgetRenderer.tsx استخراج شد
// (بخش «بلوک‌های اختصاصیِ صفحهٔ استاد»).
// ============================================================

import React from 'react';
import { CalendarClock } from 'lucide-react';
import { fetchDedicatedPageWeeklyScheduleForWidget, type DedicatedPageScheduleSlot } from '../../../api';
import { useSmartData } from '../../../hooks/useSmartData';
import { SmartEmpty, SmartSkeleton } from '../SmartWidgetStates';
import { DedicatedPageNotConfigured } from './shared';
import { DEFAULT_ACCENT_COLOR, accentWithAlpha } from '../../../utils/styleResolvers';

const WEEKLY_SCHEDULE_DAYS = ['شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

/** ویجت برنامه هفتگی ترم جاری — گرید ساده روز×بازهٔ زمانی، از ستون weekly_schedule خودِ صفحه */
export const DedicatedPageWeeklyScheduleWidget: React.FC<{
  containerStyle: React.CSSProperties;
  dedicatedPageId?: number | null;
  accentColor?: string;
}> = ({ containerStyle, dedicatedPageId, accentColor = DEFAULT_ACCENT_COLOR }) => {
  const { data, error, retry } = useSmartData<DedicatedPageScheduleSlot>(
    () => (dedicatedPageId ? fetchDedicatedPageWeeklyScheduleForWidget(dedicatedPageId) : Promise.resolve([])),
    [dedicatedPageId]
  );

  if (!dedicatedPageId) {
    return <div style={containerStyle}><DedicatedPageNotConfigured /></div>;
  }

  const byDay = new Map<string, DedicatedPageScheduleSlot[]>();
  (data || []).forEach((slot) => {
    const list = byDay.get(slot.day) || [];
    list.push(slot);
    byDay.set(slot.day, list);
  });

  const daysWithSlots = WEEKLY_SCHEDULE_DAYS.filter((d) => (byDay.get(d) || []).length > 0);

  return (
    <div style={containerStyle}>
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !data ? (
        <SmartSkeleton variant="table" count={5} />
      ) : daysWithSlots.length === 0 ? (
        <SmartEmpty error="هنوز برنامهٔ هفتگی‌ای برای این ترم ثبت نشده است" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
          <table className="w-full text-xs">
            <tbody>
              {daysWithSlots.map((day) => (
                <tr key={day} className="border-b last:border-b-0 border-gray-100 dark:border-slate-800">
                  <td className="p-3 font-black text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800/60 whitespace-nowrap align-top w-24">{day}</td>
                  <td className="p-3">
                    <div className="flex flex-col gap-2">
                      {(byDay.get(day) || []).map((slot, i) => (
                        <div key={i} className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono dir-ltr px-2 py-0.5 rounded-md" style={{ backgroundColor: accentWithAlpha(accentColor, '1a'), color: accentColor }}>
                            <CalendarClock className="w-3 h-3" />
                            {slot.startTime}–{slot.endTime}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-white">{slot.courseTitle}</span>
                          {slot.location && <span className="text-[10px] text-slate-400">({slot.location})</span>}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
