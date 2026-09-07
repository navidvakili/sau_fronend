// ============================================================
// BuilderToolbar — نوار بالای استودیوی صفحه‌ساز (عنوان صفحه، سوییچر Breakpoint،
// Undo/Redo، تاریخچهٔ نسخه‌ها، و دکمه‌های اکشن: قالب‌ها/استایل سراسری/خروجی/پیش‌نمایش/ذخیره)
// از PageBuilderStudio استخراج شد — این کامپوننت هیچ state ای از خودش ندارد (به‌جز
// state تعریف‌شده در همین فایل نیست)، فقط primitive/callback prop می‌گیرد.
// ============================================================

import React from 'react';
import { Breakpoint, PageVersion } from '../builderTypes';
import {
  Save,
  Undo2,
  Redo2,
  Eye,
  Code,
  Palette,
  FolderPlus,
  Monitor,
  Tablet,
  Smartphone,
  CheckCircle2,
  CheckCircle,
  Clock,
  History,
  Sparkles,
  ArrowRight,
  LayoutGrid,
  Settings2,
  Loader2,
  FolderTree,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';

interface BuilderToolbarProps {
  onBackToPortal?: () => void;
  onBackToPageList: () => void;
  title: string;
  onTitleChange: (title: string) => void;
  parentPage?: { id: number; title: string };
  onOpenParentPage: (id: number) => void;
  onOpenPageSettings: () => void;
  onOpenChildPages: () => void;
  childCount: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  activeBreakpoint: Breakpoint;
  onChangeBreakpoint: (bp: Breakpoint) => void;
  showVersionHistory: boolean;
  onToggleVersionHistory: () => void;
  onCloseVersionHistory: () => void;
  versionHistory: PageVersion[];
  onSaveDraftVersion: () => void;
  onRestoreVersion: (ver: PageVersion) => void;
  onOpenTemplateLibrary: () => void;
  onOpenGlobalStyles: () => void;
  onOpenExport: () => void;
  onOpenPreview: () => void;
  onSavePublish: () => void;
  onSaveDraft: () => void;
  isSavingPage: boolean;
  saveSuccess: boolean;
  showSaveMenu: boolean;
  onToggleSaveMenu: () => void;
  onCloseSaveMenu: () => void;
  publishWarning: string | null;
  onClearPublishWarning: () => void;
}

export const BuilderToolbar: React.FC<BuilderToolbarProps> = ({
  onBackToPortal,
  onBackToPageList,
  title,
  onTitleChange,
  parentPage,
  onOpenParentPage,
  onOpenPageSettings,
  onOpenChildPages,
  childCount,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  activeBreakpoint,
  onChangeBreakpoint,
  showVersionHistory,
  onToggleVersionHistory,
  onCloseVersionHistory,
  versionHistory,
  onSaveDraftVersion,
  onRestoreVersion,
  onOpenTemplateLibrary,
  onOpenGlobalStyles,
  onOpenExport,
  onOpenPreview,
  onSavePublish,
  onSaveDraft,
  isSavingPage,
  saveSuccess,
  showSaveMenu,
  onToggleSaveMenu,
  onCloseSaveMenu,
  publishWarning,
  onClearPublishWarning
}) => {
  return (
    <header className="h-16 px-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between z-30 shadow-xs">
      {/* Right Section: Title & Status */}
      <div className="flex items-center gap-3">
        {onBackToPortal && (
          <button
            onClick={onBackToPortal}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="بازگشت به پورتال اصلی"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {/* Back to the pages card list */}
        <button
          onClick={onBackToPageList}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          title="بازگشت به فهرست صفحات"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="text-sm font-black bg-transparent text-slate-900 dark:text-white border-b border-transparent hover:border-gray-300 dark:hover:border-slate-700 focus:border-teal-500 focus:outline-none px-1"
            />
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="px-1.5 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/20">
                Intelligent Layout Engine
              </span>
              {parentPage && (
                <button
                  onClick={() => onOpenParentPage(parentPage.id)}
                  className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors cursor-pointer inline-flex items-center gap-1"
                  title="این صفحه زیرصفحه است — برای رفتن به صفحهٔ والد کلیک کنید"
                >
                  <FolderTree className="w-3 h-3" />
                  زیرصفحهٔ {parentPage.title}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Page settings (title / slug / SEO) */}
        <button
          onClick={onOpenPageSettings}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          title="تنظیمات صفحه و سئو (عنوان، لینک، متادیتا)"
        >
          <Settings2 className="w-4 h-4 text-indigo-500" />
        </button>

        {/* Child-pages manager: زیرصفحه‌ها از داخل همین صفحه ساخته و مدیریت می‌شوند */}
        <button
          onClick={onOpenChildPages}
          className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          title="مدیریت زیرصفحه‌های این صفحه (ایجاد، باز کردن، حذف)"
        >
          <FolderTree className="w-4 h-4 text-teal-600" />
          {childCount > 0 && (
            <span className="absolute -top-1.5 -left-1.5 min-w-4 h-4 px-1 rounded-full bg-teal-600 text-white text-[9px] font-black flex items-center justify-center shadow-sm">
              {childCount}
            </span>
          )}
        </button>
      </div>

      {/* Center Section: Responsive Breakpoint Switcher & Undo/Redo */}
      <div className="flex items-center gap-4">
        {/* Undo/Redo */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-gray-200 dark:border-slate-800">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-teal-500 disabled:opacity-30 cursor-pointer"
            title="واکشی قبلی (Undo)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-teal-500 disabled:opacity-30 cursor-pointer"
            title="اعمال مجدد (Redo)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Breakpoint selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-gray-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => onChangeBreakpoint('desktop')}
            className={`p-2 rounded-xl flex items-center gap-1 font-bold cursor-pointer transition-all ${
              activeBreakpoint === 'desktop' ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs' : 'text-slate-400'
            }`}
            title="نمایش دسکتاپ"
          >
            <Monitor className="w-4 h-4" />
          </button>

          <button
            onClick={() => onChangeBreakpoint('tablet')}
            className={`p-2 rounded-xl flex items-center gap-1 font-bold cursor-pointer transition-all ${
              activeBreakpoint === 'tablet' ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs' : 'text-slate-400'
            }`}
            title="نمایش تبلت (768px)"
          >
            <Tablet className="w-4 h-4" />
          </button>

          <button
            onClick={() => onChangeBreakpoint('mobile')}
            className={`p-2 rounded-xl flex items-center gap-1 font-bold cursor-pointer transition-all ${
              activeBreakpoint === 'mobile' ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs' : 'text-slate-400'
            }`}
            title="نمایش موبایل (390px)"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Left Section: Actions Bar */}
      <div className="flex items-center gap-2">
        {/* Version history dropdown (moved from the removed right sidebar) */}
        <div className="relative">
          <button
            onClick={onToggleVersionHistory}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="تاریخچه نسخه‌ها"
          >
            <History className="w-4 h-4 text-purple-500" />
          </button>
          {showVersionHistory && (
            <>
              <div className="fixed inset-0 z-40" onClick={onCloseVersionHistory} />
              <div className="absolute top-full left-0 mt-2 z-50 w-80 max-h-96 overflow-y-auto bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-900 dark:text-white">پیش‌نویس‌ها و تاریخچه</span>
                  <button
                    onClick={onSaveDraftVersion}
                    className="px-2.5 py-1.5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white dark:text-slate-950 font-bold text-[10px] cursor-pointer flex items-center gap-1 shadow-xs shrink-0"
                  >
                    <Clock className="w-3 h-3" />
                    <span>ثبت نسخه</span>
                  </button>
                </div>

                {versionHistory.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-6">هنوز نسخه‌ای ثبت نشده است</div>
                ) : (
                  versionHistory.map((ver) => (
                    <div
                      key={ver.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                        <span className="truncate">{ver.title}</span>
                        <span className="text-[10px] text-teal-600 dark:text-teal-400 shrink-0">{ver.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{ver.note}</p>
                      <button
                        onClick={() => {
                          onRestoreVersion(ver);
                          onCloseVersionHistory();
                        }}
                        className="w-full py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-teal-500" />
                        <span>بازگردانی به این نسخه</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <button
          onClick={onOpenTemplateLibrary}
          className="px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-indigo-500/20 shadow-xs"
          title="کتابخانه قالب‌های آماده"
        >
          <FolderPlus className="w-4 h-4" />
          <span>کتابخانه قالب‌ها</span>
        </button>

        <button
          onClick={onOpenGlobalStyles}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          title="استایل‌های سراسری"
        >
          <Palette className="w-4 h-4 text-teal-500" />
        </button>

        <button
          onClick={onOpenExport}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          title="تولید کد خروجی"
        >
          <Code className="w-4 h-4 text-amber-500" />
        </button>

        <button
          onClick={onOpenPreview}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Eye className="w-4 h-4 text-teal-500" />
          <span>پیش‌نمایش زنده</span>
        </button>

        {/* دکمهٔ ذخیره و انتشار (اسپلیت) — پیش‌نویس در منوی کشویی */}
        <div className="relative flex items-stretch rounded-xl shadow-md border border-teal-600 dark:border-teal-500">
          <button
            onClick={onSavePublish}
            disabled={isSavingPage}
            className="px-5 py-2 rounded-r-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white dark:text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-60"
            title="ذخیره و انتشار"
          >
            {isSavingPage ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال ذخیره...</span>
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white dark:text-slate-950" />
                <span>ذخیره گردید</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>ذخیره و انتشار</span>
              </>
            )}
          </button>

          <button
            onClick={onToggleSaveMenu}
            disabled={isSavingPage}
            className="px-2.5 rounded-l-xl bg-teal-700 dark:bg-teal-600 hover:bg-teal-800 dark:hover:bg-teal-700 text-white dark:text-slate-950 border-r border-white/25 dark:border-slate-950/20 flex items-center justify-center cursor-pointer transition-all disabled:opacity-60"
            title="گزینه‌های بیشتر ذخیره"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showSaveMenu ? 'rotate-180' : ''}`} />
          </button>

          {showSaveMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={onCloseSaveMenu} />
              <div className="absolute top-full left-0 mt-2 z-50 min-w-48 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 space-y-0.5">
                <button
                  onClick={() => {
                    onSaveDraft();
                    onCloseSaveMenu();
                  }}
                  disabled={isSavingPage}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-60"
                  title="ذخیره به‌عنوان پیش‌نویس (بدون انتشار)"
                >
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>ذخیره پیش‌نویس</span>
                  <span className="mr-auto text-[10px] text-slate-400 font-normal">بدون انتشار</span>
                </button>
              </div>
            </>
          )}

          {publishWarning && (
            <>
              <div className="fixed inset-0 z-40" onClick={onClearPublishWarning} />
              <div className="absolute top-full left-0 mt-2 z-50 w-72 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-2xl shadow-2xl p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-300 font-bold leading-5">{publishWarning}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
