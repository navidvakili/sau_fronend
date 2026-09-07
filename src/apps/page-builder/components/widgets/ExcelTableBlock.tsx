// ============================================================
// ExcelTableBlock — جدول اکسل: داده‌های واردشده به‌صورت JSON ثابت (پردازش‌شده هنگام آپلود)
// با جستجوی اختیاری. از WidgetRenderer.tsx استخراج شد.
// ============================================================

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import type { WidgetInstance } from '../../builderTypes';

export const ExcelTableBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState('all');
  const props = widget.settings.customProps || {};
  const columns: string[] = props.columns || [];
  const rows: string[][] = props.rows || [];
  const enableSearch = props.enableSearch !== false;
  const maxHeight: number | undefined = props.maxHeight || undefined;
  const headerBgColor = props.headerBgColor || '#0f172a';
  const headerTextColor = props.headerTextColor || '#ffffff';
  const rowBgColor = props.rowBgColor || undefined;
  const rowAltBgColor = props.rowAltBgColor || undefined;
  const rowTextColor = props.rowTextColor || undefined;
  const groupByColumn: string = props.groupByColumn || '';
  const groupColIndex = groupByColumn ? columns.indexOf(groupByColumn) : -1;

  if (columns.length === 0) {
    return (
      <div style={containerStyle} className="p-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 text-center text-xs text-slate-400">
        هنوز فایل اکسلی برای این بلوک آپلود نشده است.
      </div>
    );
  }

  const groupValues = groupColIndex >= 0 ? Array.from(new Set(rows.map((r) => r[groupColIndex]).filter(Boolean))) : [];

  const filteredRows = rows
    .filter((r) => (activeGroup === 'all' || groupColIndex < 0 ? true : r[groupColIndex] === activeGroup))
    .filter((r) => (search.trim() ? r.some((cell) => cell.toLowerCase().includes(search.trim().toLowerCase())) : true));

  return (
    <div style={containerStyle} className="space-y-3">
      {groupValues.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveGroup('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${activeGroup === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            همه
          </button>
          {groupValues.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setActiveGroup(v)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${activeGroup === v ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              {v}
            </button>
          ))}
        </div>
      )}
      {enableSearch && (
        <div className="relative max-w-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در جدول..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs focus:outline-none focus:border-teal-500 transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>
      )}
      <div
        className="rounded-2xl border border-gray-200 dark:border-slate-800"
        style={{ overflowX: 'auto', overflowY: maxHeight ? 'auto' : undefined, maxHeight: maxHeight ? `${maxHeight}px` : undefined }}
      >
        <table className="w-full text-right border-collapse text-xs">
          <thead style={{ backgroundColor: headerBgColor, color: headerTextColor, position: maxHeight ? 'sticky' : undefined, top: maxHeight ? 0 : undefined, zIndex: maxHeight ? 1 : undefined }} className="font-bold">
            <tr>
              {columns.map((c, i) => (
                <th key={i} className="p-3">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {filteredRows.length > 0 ? (
              filteredRows.map((row, ri) => (
                <tr
                  key={ri}
                  className="hover:bg-teal-50/50 dark:hover:bg-teal-500/5 transition-colors"
                  style={{ backgroundColor: (ri % 2 === 1 ? rowAltBgColor : undefined) ?? rowBgColor }}
                >
                  {row.map((cell, ci) => (
                    <td key={ci} className="p-3" style={{ color: rowTextColor }}>
                      <span className={rowTextColor ? undefined : 'text-slate-700 dark:text-slate-200'}>{cell}</span>
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-6 text-center text-slate-400 text-xs">
                  نتیجه‌ای یافت نشد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
