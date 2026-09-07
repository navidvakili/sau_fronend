// ============================================================
// StaffDirectoryWidget — از WidgetRenderer.tsx استخراج شد (بخش «SMART WIDGETS»).
// ============================================================

import React from 'react';
import type { WidgetInstance, WidgetDataBinding } from '../../builderTypes';
import { fetchDataSourcePeople } from '../../api';
import type { PersonItem } from '@/src/shared-types';
import { useSmartData } from '../../hooks/useSmartData';
import { SmartEmpty, SmartSkeleton } from './SmartWidgetStates';

/** ویجت دلیل اعضای هیئت علمی — اتصال به وب‌سرویس پرسنلی */
export const StaffDirectoryWidget: React.FC<{
  widget: WidgetInstance;
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
}> = ({ widget, binding, containerStyle }) => {
  const { data, error, retry } = useSmartData<PersonItem>(() =>
    fetchDataSourcePeople({
      per_page: binding.limit || 6,
      type: binding.departmentFilter && binding.departmentFilter !== 'all' ? binding.departmentFilter : 'faculty_member',
      status: 'published'
    }).then((res) => res.data),
    [binding.limit, binding.departmentFilter]
  );

  const staffList = data || [];

  return (
    <div style={containerStyle} className="space-y-4">
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !data ? (
        <SmartSkeleton variant="list" count={binding.limit || 6} />
      ) : staffList.length === 0 ? null : (
        <div className="space-y-3">
          {staffList.map((st) => (
            <div
              key={st.id}
              className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center gap-3 shadow-xs"
            >
              <img
                src={st.image_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(st.title || st.lastName || '')}
                alt={st.title || `${st.firstName} ${st.lastName}`}
                className="w-12 h-12 rounded-full object-cover border border-teal-500/30 bg-slate-100"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {st.title || `${st.firstName || ''} ${st.lastName || ''}`}
                </div>
                <div className="text-[11px] text-teal-600 dark:text-teal-400 font-bold truncate">
                  {st.rank || st.position || st.specialization}
                </div>
                {st.email && <div className="text-[10px] text-slate-400 truncate">{st.email}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
