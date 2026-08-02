import React, { useState } from 'react';
import {
  WidgetType,
  SectionInstance,
  SmartPageSchema,
  PageVersion
} from './builderTypes';
import {
  Plus,
  Layers,
  Palette,
  History,
  Layout,
  Type,
  Image as ImageIcon,
  MousePointer,
  Video,
  Minus,
  Sparkles,
  Bell,
  Newspaper,
  Award,
  Users,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  FolderPlus,
  Grid,
  Settings,
  HelpCircle
} from 'lucide-react';

interface SidebarPanelsProps {
  pageSchema: SmartPageSchema;
  selectedSectionId: string | null;
  selectedColumnId: string | null;
  selectedWidgetId: string | null;
  onSelectSection: (sectionId: string) => void;
  onSelectColumn: (columnId: string) => void;
  onSelectWidget: (widgetId: string) => void;
  onAddSection: (layoutPreset: '1col' | '2col' | '3col' | '7-5' | '8-4') => void;
  onAddWidget: (widgetType: WidgetType, targetColumnId?: string) => void;
  onOpenComponentPicker?: (targetInsertIndex?: number, targetColumnId?: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onDeleteWidget: (widgetId: string) => void;
  onOpenGlobalStyles: () => void;
  onOpenTemplatesModal: () => void;
  onRestoreVersion: (version: PageVersion) => void;
  onSaveDraftVersion: () => void;
}

export const SidebarPanels: React.FC<SidebarPanelsProps> = ({
  pageSchema,
  selectedSectionId,
  selectedColumnId,
  selectedWidgetId,
  onSelectSection,
  onSelectColumn,
  onSelectWidget,
  onAddSection,
  onAddWidget,
  onOpenComponentPicker,
  onDeleteSection,
  onDeleteWidget,
  onOpenGlobalStyles,
  onOpenTemplatesModal,
  onRestoreVersion,
  onSaveDraftVersion
}) => {
  const [activeTab, setActiveTab] = useState<'layers' | 'history'>('layers');

  // Widget palette definitions
  const staticWidgets: { type: WidgetType; name: string; desc: string; icon: any }[] = [
    { type: 'heading', name: 'عنوان تیتر (Heading)', desc: 'تیتر اصلی با اندازه تایپوگرافی قابل تنظیم', icon: Type },
    { type: 'text', name: 'بلوک متنی (Text)', desc: 'متن توضیحات و پاراگراف‌های محتوایی', icon: Layout },
    { type: 'image', name: 'تصویر (Image)', desc: 'بارگذاری یا قرار دادن تصویر واکنش‌گرا', icon: ImageIcon },
    { type: 'button', name: 'دکمه اقدام (CTA Button)', desc: 'دکمه تعاملی جهت ارجاع به لینک یا بخش', icon: MousePointer },
    { type: 'video', name: 'ویدیو (Video Player)', desc: 'نمایش‌دهنده ویدیوهای آنلاین و آپارات', icon: Video },
    { type: 'stat-card', name: 'کارت آمار (Stat Card)', desc: 'نمایش عددی شاخص‌ها و آمار کلیدی', icon: Sparkles },
    { type: 'accordion', name: 'آکاردئون (Accordion)', desc: 'باز و بسته شونده سوالات متداول', icon: ChevronDown },
    { type: 'divider', name: 'خط جداکننده (Divider)', desc: 'خط تفکیک‌کننده بخش‌های صفحه', icon: Minus }
  ];

  const smartWidgets: { type: WidgetType; name: string; desc: string; icon: any; moduleName: string }[] = [
    { type: 'announcements-feed', name: 'لیست اطلاعیه‌ها', desc: 'نمایش هوشمند اطلاعیه‌های فورس و عادی', icon: Bell, moduleName: 'ماژول اطلاعیه‌ها' },
    { type: 'news-feed', name: 'خوراک اخبار (News Feed)', desc: 'نمایش داینامیک آخرین اخبار بر اساس دسته‌بندی', icon: Newspaper, moduleName: 'ماژول اخبار' },
    { type: 'image-gallery', name: 'گالری آلبوم تصاویر', desc: 'نمایش آلبوم‌های رسانه‌ای و پردیس', icon: ImageIcon, moduleName: 'گالری دانشگاه' },
    { type: 'achievements-timeline', name: 'تایم‌لاین افتخارات', desc: 'نمایش جوایز، نشان‌ها و دستاوردهای ملی', icon: Award, moduleName: 'ماژول افتخارات' },
    { type: 'staff-directory', name: 'دلیل اعضای هیئت علمی', desc: 'کارت مشخصات اساتید و مدیران', icon: Users, moduleName: 'سامانه پرسنلی' },
    { type: 'file-manager', name: 'مخزن اسناد و فایل‌ها', desc: 'لیست دانلود فرم‌ها و چارت‌های درسی', icon: FileText, moduleName: 'مدیریت فایل' }
  ];

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
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'layers'
              ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="درخت لایه‌ها"
        >
          <Layers className="w-4 h-4" />
          <span>ساختار لایه‌ها</span>
        </button>

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
        {/* TAB 1: LAYERS TREE */}
        {/* ============================================================== */}
        {activeTab === 'layers' && (
          <div className="space-y-3">
            <div className="text-xs font-black text-slate-900 dark:text-white border-b border-gray-200 dark:border-slate-800 pb-2">
              درخت لایه‌ها و ساختار صفحه
            </div>

            <div className="space-y-3">
              {pageSchema.sections.map((sec, secIdx) => {
                const isSecSelected = selectedSectionId === sec.id;
                return (
                  <div
                    key={sec.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isSecSelected
                        ? 'bg-teal-500/10 border-teal-500'
                        : 'bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Section Header */}
                    <div
                      onClick={() => onSelectSection(sec.id)}
                      className="p-3 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-teal-500" />
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {sec.name || `سکشن شماره ${secIdx + 1}`}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSection(sec.id);
                        }}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                        title="حذف سکشن"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Columns & Widgets List */}
                    <div className="p-2 space-y-2 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
                      {sec.columns.map((col, colIdx) => (
                        <div key={col.id} className="pr-2 space-y-1">
                          <div
                            onClick={() => {
                              onSelectSection(sec.id);
                              onSelectColumn(col.id);
                            }}
                            className={`text-[11px] font-bold p-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                              selectedColumnId === col.id
                                ? 'bg-indigo-500/20 text-indigo-400'
                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                          >
                            <span>ستون {colIdx + 1} (پهنا: {col.width}/12)</span>
                            <span className="text-[10px] font-mono">{col.widgets.length} ویجت</span>
                          </div>

                          {/* Widgets list in this column */}
                          <div className="pr-4 space-y-1">
                            {col.widgets.map(w => {
                              const isWidgetSel = selectedWidgetId === w.id;
                              return (
                                <div
                                  key={w.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectSection(sec.id);
                                    onSelectColumn(col.id);
                                    onSelectWidget(w.id);
                                  }}
                                  className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer border transition-all ${
                                    isWidgetSel
                                      ? 'bg-teal-500 text-slate-950 font-bold border-teal-400 shadow-sm'
                                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-gray-200 dark:border-slate-700/60 hover:border-slate-400'
                                  }`}
                                >
                                  <span className="truncate">{w.title || w.type}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteWidget(w.id);
                                    }}
                                    className="p-1 rounded text-rose-500 hover:bg-rose-500/20 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: VERSION HISTORY & DRAFTS */}
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
