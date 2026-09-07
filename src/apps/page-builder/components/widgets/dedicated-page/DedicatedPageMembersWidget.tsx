// ============================================================
// DedicatedPageMembersWidget — از WidgetRenderer.tsx استخراج شد.
// ============================================================

import React from 'react';
import type { WidgetInstance, WidgetDataBinding } from '../../../builderTypes';
import { fetchDedicatedPageMembersForWidget, type DedicatedPageMemberItem } from '../../../api';
import { useSmartData } from '../../../hooks/useSmartData';
import { SmartEmpty, SmartSkeleton } from '../SmartWidgetStates';
import { DedicatedPageNotConfigured, dpGridColsClass } from './shared';

/** ویجت اعضای شورای مرکزی و کادر اجرایی صفحهٔ اختصاصی */
export const DedicatedPageMembersWidget: React.FC<{
  widget: WidgetInstance;
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
  dedicatedPageId?: number | null;
}> = ({ binding, containerStyle, dedicatedPageId }) => {
  const { data, error, retry } = useSmartData<DedicatedPageMemberItem>(
    () => (dedicatedPageId ? fetchDedicatedPageMembersForWidget(dedicatedPageId) : Promise.resolve([])),
    [dedicatedPageId]
  );

  if (!dedicatedPageId) {
    return (
      <div style={containerStyle}>
        <DedicatedPageNotConfigured />
      </div>
    );
  }

  const ordered = binding.sortBy === 'date_asc' ? [...(data || [])].reverse() : data || [];
  const members = ordered.slice(0, binding.limit || 12);

  // موقعیت تصویر خودش هم جهت (بالا/راست/چپ) و هم چیدمان (کارتی چندستونه یا ردیفی تک‌ستونه) را تعیین می‌کند
  const position = binding.avatarPosition || 'top';
  const isMultiColumn = position === 'top' || position === 'card-right' || position === 'card-left';
  const reverseAvatar = position === 'left' || position === 'card-left';

  const avatarSrc = (m: DedicatedPageMemberItem) => m.image_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(m.name);

  const renderRowCard = (m: DedicatedPageMemberItem) => (
    <div
      key={m.id}
      className={`p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center gap-3 shadow-xs ${
        reverseAvatar ? 'flex-row-reverse' : ''
      }`}
    >
      <img src={avatarSrc(m)} alt={m.name} className="w-12 h-12 rounded-full object-cover border border-violet-500/30 bg-slate-100 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-black text-slate-900 dark:text-white truncate">{m.name}</div>
        {(m.role_title || m.field_of_study) && (
          <div className="text-[11px] text-violet-600 dark:text-violet-400 font-bold truncate">
            {m.role_title}
            {m.role_title && m.field_of_study ? ' · ' : ''}
            {m.field_of_study}
          </div>
        )}
        {m.email && <div className="text-[10px] text-slate-400 truncate">{m.email}</div>}
      </div>
    </div>
  );

  const renderStackedCard = (m: DedicatedPageMemberItem) => (
    <div
      key={m.id}
      className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex flex-col items-center text-center gap-1.5 shadow-xs"
    >
      <img src={avatarSrc(m)} alt={m.name} className="w-16 h-16 rounded-full object-cover border border-violet-500/30 bg-slate-100" />
      <div className="text-xs font-black text-slate-900 dark:text-white truncate w-full">{m.name}</div>
      {(m.role_title || m.field_of_study) && (
        <div className="text-[11px] text-violet-600 dark:text-violet-400 font-bold truncate w-full">
          {m.role_title}
          {m.role_title && m.field_of_study ? ' · ' : ''}
          {m.field_of_study}
        </div>
      )}
      {m.email && <div className="text-[10px] text-slate-400 truncate w-full" dir="ltr">{m.email}</div>}
    </div>
  );

  const renderCard = position === 'top' ? renderStackedCard : renderRowCard;

  return (
    <div style={containerStyle} className="space-y-4">
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !data ? (
        <SmartSkeleton variant={isMultiColumn ? 'cards' : 'list'} count={binding.limit || 6} />
      ) : members.length === 0 ? null : isMultiColumn ? (
        <div className={`grid ${dpGridColsClass(binding.columnsCount, 3)} gap-3`}>{members.map(renderCard)}</div>
      ) : (
        <div className="space-y-3">{members.map(renderCard)}</div>
      )}
    </div>
  );
};
