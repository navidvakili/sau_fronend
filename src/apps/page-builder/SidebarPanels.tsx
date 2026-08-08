import React, { useState } from 'react';
import {
  SmartPageSchema,
  PageVersion
} from './builderTypes';
import {
  Plus,
  Palette,
  History,
  Clock,
  CheckCircle,
  FolderPlus
} from 'lucide-react';

interface SidebarPanelsProps {
  pageSchema: SmartPageSchema;
  onOpenComponentPicker?: (targetInsertIndex?: number, targetColumnId?: string) => void;
  onOpenGlobalStyles: () => void;
  onOpenTemplatesModal: () => void;
  onRestoreVersion: (version: PageVersion) => void;
  onSaveDraftVersion: () => void;
}

export const SidebarPanels: React.FC<SidebarPanelsProps> = ({
  pageSchema,
  onOpenComponentPicker,
  onOpenGlobalStyles,
  onOpenTemplatesModal,
  onRestoreVersion,
  onSaveDraftVersion
}) => {
  const [activeTab, setActiveTab] = useState<'history'>('history');

  return (
    <div className="w-80 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 flex flex-col h-full select-none text-right rtl">
      {/* Top Action Header in Sidebar */}
      <div className="p-3 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
        {onOpenComponentPicker && (
          <button
            type="button"
            onClick={() => onOpenComponentPicker()}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer transform active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن کامپوننت / بلوک جدید</span>
          </button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenGlobalStyles}
            className="p-2 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 text-teal-700 dark:text-teal-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-all cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>استایل سراسری</span>
          </button>
          <button
            onClick={onOpenTemplatesModal}
            className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>قالب‌های آماده</span>
          </button>
        </div>
      </div>

      {/* Top Sidebar Tab Navigation */}
      <div className="flex items-center justify-around border-b border-gray-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/80 p-1">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="تاریخچه نسخه‌ها"
        >
          <History className="w-4 h-4" />
          <span>تاریخچه نسخه‌ها</span>
        </button>
      </div>

      {/* Tab Content Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* ============================================================== */}
        {/* TAB: VERSION HISTORY & DRAFTS */}
        {/* ============================================================== */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-white">پیش‌نویس‌ها و تاریخچه</span>
              <button
                onClick={onSaveDraftVersion}
                className="px-3 py-1.5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white dark:text-slate-950 font-bold text-xs cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>ثبت نسخه نقطه بازگشت</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {pageSchema.versionHistory.map(ver => (
                <div
                  key={ver.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                    <span>{ver.title}</span>
                    <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400">{ver.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{ver.note}</p>

                  <button
                    onClick={() => onRestoreVersion(ver)}
                    className="w-full py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-teal-500" />
                    <span>بازگردانی به این نسخه</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
