// ============================================================
// ChildPagesBlock — از WidgetRenderer.tsx استخراج شد.
// ============================================================

import React from 'react';
import { ArrowLeft, FileText, Layers } from 'lucide-react';
import type { WidgetInstance } from '../../builderTypes';
import { fetchSmartPageChildrenTree, type SmartPageTreeNode } from '../../api';
import { useSmartData } from '../../hooks/useSmartData';
import { SmartEmpty } from './SmartWidgetStates';

/** لیست زیرصفحه‌ها — زیرصفحه‌های صفحهٔ فعلی را از وب‌سرویس می‌خواند
 *  حالت «درختی» (tree): همهٔ نسل‌ها به‌صورت تودرتو.
 *  حالت «مستقیم» (direct): فقط زیرصفحه‌های مستقیم همین صفحه (هر صفحه در خودش). */
export const ChildPagesBlock: React.FC<{
  widget: WidgetInstance;
  containerStyle: React.CSSProperties;
  pageId?: number | null;
}> = ({ widget, containerStyle, pageId }) => {
  const props = widget.settings.customProps || {};
  const limit = Number(props.limit) || 12;
  const mode = props.mode === 'direct' ? 'direct' : 'tree';

  const { data, error, retry } = useSmartData<SmartPageTreeNode>(() =>
    pageId ? fetchSmartPageChildrenTree(pageId) : Promise.resolve([]),
    [pageId]
  );

  const children = (data || []).slice(0, limit);

  // ردیف بازگشتی — عنوان + نام زیرصفحه‌های آن (بدون تاریخ)
  // در محیط مدیریت، کلیک روی ردیف‌ها هیچ عملی انجام نمی‌دهد (فقط پیش‌نمایش بصری)
  const renderRow = (node: SmartPageTreeNode, depth: number): React.ReactNode => {
    const subs = mode === 'tree' ? node.children || [] : [];
    if (depth > 6) return null;
    return (
      <div key={node.id} className="min-w-0">
        <div
          className="flex items-center gap-2.5 px-4 py-3 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-teal-600 dark:hover:text-teal-400 transition-all cursor-default select-none"
          style={depth > 0 ? { paddingRight: `${18 + depth * 20}px` } : undefined}
        >
          <span className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <FileText className={`${depth > 0 ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
          </span>
          <span className="flex-1 font-bold truncate">{node.title}</span>
          <ArrowLeft className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        </div>
        {subs.length > 0 && (
          <div className="border-r border-teal-500/10 mr-5">
            {subs.map((sub) => renderRow(sub, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // بدون pageId (صفحهٔ جدید هنوز ذخیره نشده) → ساختار نمونه نمایش داده می‌شود
  if (!pageId) {
    return (
      <div style={containerStyle} className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-teal-500" />
          {widget.title || 'لیست زیرصفحه‌ها'}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          این ویجت زیرصفحه‌های این صفحه را به‌صورت خودکار فهرست می‌کند.
          ابتدا صفحه را ذخیره کنید تا فهرست واقعی نمایش داده شود.
        </p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {widget.title ? (
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-teal-500" />
          {widget.title}
        </h3>
      ) : null}
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !data ? (
        <div className="grid gap-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : children.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          هنوز زیرصفحه‌ای برای این صفحه ساخته نشده است.
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {children.map((child) => renderRow(child, 0))}
          </div>
        </div>
      )}
    </div>
  );
};
