import React from 'react';
import {
  ArrowRight,
  Plus,
  Settings2,
  Trash2,
  FilePlus2,
  Clock,
  Sparkles,
  LayoutGrid,
  Pencil,
  Monitor,
  Loader2
} from 'lucide-react';
import type { SmartPageDto } from './api';

interface PagesListProps {
  pages: SmartPageDto[];
  isLoading: boolean;
  onBackToPortal?: () => void;
  onCreatePage: () => void;
  onEditPage: (id: number) => void;
  onOpenSettings: (id: number) => void;
  onPreviewPage?: (id: number) => void;
  onDeletePage: (page: SmartPageDto) => void;
}

/** وضعیت انتشار صفحه */
const StatusBadge: React.FC<{ status: 'published' | 'draft' }> = ({ status }) => (
  <span
    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
      status === 'published'
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    }`}
  >
    {status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
  </span>
);

/** ظاهر یک صفحه وب مینیاتوری داخل کارت */
const PageMockup: React.FC = () => (
  <div className="flex-1 min-h-0 p-3 space-y-2 bg-white dark:bg-slate-900 flex flex-col">
    {/* Header bar */}
    <div className="flex items-center justify-between">
      <div className="w-12 h-2 rounded-full bg-teal-400/70" />
      <div className="flex gap-1">
        <div className="w-4 h-1.5 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="w-4 h-1.5 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="w-4 h-1.5 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
    {/* Hero */}
    <div className="h-12 rounded-lg bg-gradient-to-l from-teal-400/40 via-indigo-400/30 to-teal-400/40" />
    {/* Content columns */}
    <div className="grid grid-cols-3 gap-2">
      <div className="h-8 rounded bg-slate-100 dark:bg-slate-800" />
      <div className="h-8 rounded bg-slate-100 dark:bg-slate-800" />
      <div className="h-8 rounded bg-slate-100 dark:bg-slate-800" />
    </div>
    {/* Body rows */}
    <div className="h-3.5 rounded bg-slate-100 dark:bg-slate-800 w-11/12" />
    <div className="h-3.5 rounded bg-slate-100 dark:bg-slate-800 w-3/4" />
    <div className="h-3.5 rounded bg-slate-100 dark:bg-slate-800 w-5/6" />
    {/* Footer */}
    <div className="mt-auto h-3 rounded bg-slate-200 dark:bg-slate-700" />
  </div>
);

/** کارت یک صفحه ساخته‌شده */
const PageCard: React.FC<{
  page: SmartPageDto;
  onEdit: () => void;
  onSettings: () => void;
  onPreview?: () => void;
  onDelete: () => void;
}> = ({ page, onEdit, onSettings, onPreview, onDelete }) => {
  const updated = page.updated_at
    ? new Date(page.updated_at).toLocaleDateString('fa-IR')
    : '';

  return (
    <div
      onClick={onEdit}
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-teal-500/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer h-64 select-none"
      title={`ویرایش صفحه «${page.title}»`}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        <span className="flex-1 mx-2 h-4 rounded-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-[9px] font-mono text-slate-400 flex items-center px-2 truncate" dir="ltr">
          sau.ac.ir/{page.slug}
        </span>
      </div>

      {/* Mini website mockup */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <PageMockup />
      </div>

      {/* Meta row */}
      <div className="px-3 py-2.5 border-t border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-black text-slate-900 dark:text-white truncate">{page.title}</span>
          <StatusBadge status={page.status} />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span dir="ltr">/{page.slug}</span>
          {updated && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {updated}
            </span>
          )}
        </div>
      </div>

      {/* Hover actions */}
      <div className="absolute top-12 inset-x-0 flex items-center justify-center gap-2 py-3 bg-gradient-to-b from-slate-900/70 to-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md cursor-pointer"
          title="ویرایش صفحه"
        >
          <Pencil className="w-4 h-4" />
        </button>
        {onPreview && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="p-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-md cursor-pointer"
            title="پیش‌نمایش صفحه"
          >
            <Monitor className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSettings();
          }}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer"
          title="تنظیمات و سئو"
        >
          <Settings2 className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer"
          title="حذف صفحه"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/** فهرست کارتی صفحات ساخته‌شده (مشابه ظاهر صفحه سایت) */
export const PagesList: React.FC<PagesListProps> = ({
  pages,
  isLoading,
  onBackToPortal,
  onCreatePage,
  onEditPage,
  onOpenSettings,
  onPreviewPage,
  onDeletePage
}) => {
  return (
    <div className="h-[calc(100dvh-10rem)] min-h-[560px] w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white font-sans overflow-y-auto rtl text-right transition-colors">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            {onBackToPortal && (
              <button
                onClick={onBackToPortal}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-gray-200 dark:border-slate-800 transition-colors cursor-pointer"
                title="بازگشت به پورتال اصلی"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 text-white shadow-md">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-500" />
                صفحه ساز هوشمند
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                صفحات ساخته‌شده را انتخاب، ویرایش یا حذف کنید — هر کارت نمایانگر یک صفحه سایت است.
              </p>
            </div>
          </div>

          <button
            onClick={onCreatePage}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ایجاد صفحه جدید</span>
          </button>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Create new page card */}
            <button
              onClick={onCreatePage}
              className="h-64 rounded-2xl border-2 border-dashed border-teal-500/30 hover:border-teal-500 bg-teal-500/5 hover:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer"
            >
              <div className="p-4 rounded-full bg-teal-500/10 border border-teal-500/20">
                <FilePlus2 className="w-8 h-8" />
              </div>
              <span className="text-sm font-black">ایجاد صفحه جدید</span>
              <span className="text-[11px] text-slate-400 font-mono">بدون محدودیت در تعداد صفحات</span>
            </button>

            {pages.length === 0 && !isLoading ? (
              <div className="col-span-full py-16 text-center text-sm text-slate-400">
                هنوز صفحه‌ای ساخته نشده است. با کارت «ایجاد صفحه جدید» اولین صفحه سایت خود را بسازید.
              </div>
            ) : (
              pages.map((page) => (
                <PageCard
                  key={page.id}
                  page={page}
                  onEdit={() => onEditPage(page.id!)}
                  onSettings={() => onOpenSettings(page.id!)}
                  onPreview={onPreviewPage ? () => onPreviewPage(page.id!) : undefined}
                  onDelete={() => onDeletePage(page)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
