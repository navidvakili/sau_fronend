import React from 'react';
import { motion } from 'motion/react';
import { X, FilePlus2, FileText, Settings2, Trash2, ExternalLink, Globe, Clock } from 'lucide-react';
import type { SmartPageDto } from './api';

interface PageManagerModalProps {
  pages: SmartPageDto[];
  activePageId: number | null;
  isLoading?: boolean;
  onCreatePage: () => void;
  onSelectPage: (id: number) => void;
  onOpenSettings: (id: number) => void;
  onDeletePage: (id: number) => void;
  onClose: () => void;
}

export const PageManagerModal: React.FC<PageManagerModalProps> = ({
  pages,
  activePageId,
  isLoading,
  onCreatePage,
  onSelectPage,
  onOpenSettings,
  onDeletePage,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md rtl text-right transition-colors">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl text-slate-900 dark:text-white flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">مدیریت صفحات (Page Manager)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ساخت چند صفحه، انتخاب صفحه فعال، ویرایش مشخصات و سئو
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Create new page */}
          <button
            onClick={onCreatePage}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-teal-500/10 hover:bg-teal-500 hover:text-white text-teal-600 dark:text-teal-400 font-bold text-sm transition-all cursor-pointer border-2 border-dashed border-teal-500/30 hover:border-teal-500"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>ایجاد صفحه جدید</span>
          </button>

          {/* Page list */}
          <div className="mt-4 flex flex-col gap-2">
            {isLoading && (
              <div className="text-center text-sm text-slate-400 py-8">در حال بارگذاری صفحات...</div>
            )}

            {!isLoading && pages.length === 0 && (
              <div className="text-center text-sm text-slate-400 py-8">
                هنوز صفحه‌ای ساخته نشده است. با دکمه بالا اولین صفحه را بسازید.
              </div>
            )}

            {pages.map((page) => {
              const isActive = page.id === activePageId;
              return (
                <div
                  key={page.id}
                  className={`group flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-teal-500/10 border-teal-500/40 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-950/50 border-gray-200 dark:border-slate-800 hover:border-teal-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 ${isActive ? 'bg-teal-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-300'}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm truncate">{page.title}</span>
                        {isActive && (
                          <span className="px-1.5 py-0.5 rounded-md bg-teal-500/15 text-teal-600 dark:text-teal-400 text-[10px] font-bold border border-teal-500/20">
                            فعال
                          </span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${
                          page.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}>
                          {page.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5">
                        <span>/‌{page.slug}</span>
                        {page.updated_at && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              {new Date(page.updated_at).toLocaleDateString('fa-IR')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!isActive && (
                      <button
                        onClick={() => onSelectPage(page.id!)}
                        className="p-2 rounded-xl text-slate-500 dark:text-slate-300 hover:bg-teal-500 hover:text-white transition-colors cursor-pointer"
                        title="باز کردن صفحه"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onOpenSettings(page.id!)}
                      className="p-2 rounded-xl text-slate-500 dark:text-slate-300 hover:bg-indigo-500 hover:text-white transition-colors cursor-pointer"
                      title="تنظیمات و سئو"
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeletePage(page.id!)}
                      className="p-2 rounded-xl text-slate-500 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                      title="حذف صفحه"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
