import React, { useState, useEffect } from 'react';
import {
  WidgetInstance,
  SectionInstance,
  ColumnInstance,
  WidgetStyle,
  WidgetDataBinding,
  ConditionalDisplayRule,
  UserRoleCondition
} from './builderTypes';
import {
  fetchDataSourceNewsCategories,
  fetchDataSourceAnnouncementGroups,
  fetchDataSourceAnnouncementCategories,
  fetchDataSourceMediaFolders
} from './api';
import type { NewsCategory, AnnouncementCategory } from '@/src/shared-types';
import type { MediaFolderDto } from '../gallery/types';
import {
  Sliders,
  Paintbrush,
  Database,
  Shield,
  Trash2,
  Copy,
  ChevronDown,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  EyeOff,
  Sparkles,
  Link,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Grid,
  List,
  Layers
} from 'lucide-react';

interface InspectorPanelProps {
  selectedWidget: WidgetInstance | null;
  selectedColumn: ColumnInstance | null;
  selectedSection: SectionInstance | null;
  onUpdateWidget: (updated: WidgetInstance) => void;
  onUpdateSection: (updated: SectionInstance) => void;
  onUpdateSectionColumnLayout?: (sectionId: string, preset: '1col' | '2col' | '3col' | '4col' | '7-5' | '8-4') => void;
  onDeleteWidget: (widgetId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onDuplicateWidget: (widget: WidgetInstance) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedWidget,
  selectedColumn,
  selectedSection,
  onUpdateWidget,
  onUpdateSection,
  onUpdateSectionColumnLayout,
  onDeleteWidget,
  onDeleteSection,
  onDuplicateWidget
}) => {
  const [inspectorTab, setInspectorTab] = useState<'content' | 'style' | 'logic'>('content');

  // ── Data-source option lists (گروه‌ها و دسته‌بندی‌ها از وب‌سرویس) ──
  const [newsCategories, setNewsCategories] = useState<NewsCategory[]>([]);
  const [announcementGroups, setAnnouncementGroups] = useState<string[]>([]);
  const [announcementCategories, setAnnouncementCategories] = useState<AnnouncementCategory[]>([]);
  const [mediaFolders, setMediaFolders] = useState<MediaFolderDto[]>([]);
  const [dataSourceError, setDataSourceError] = useState<string | null>(null);

  const activeDataSource = selectedWidget?.settings.binding.dataSource;

  useEffect(() => {
    let cancelled = false;
    setDataSourceError(null);

    if (activeDataSource === 'news') {
      fetchDataSourceNewsCategories()
        .then((cats) => { if (!cancelled) setNewsCategories(cats); })
        .catch(() => { if (!cancelled) setDataSourceError('خطا در دریافت دسته‌بندی اخبار'); });
    } else if (activeDataSource === 'announcements') {
      fetchDataSourceAnnouncementGroups()
        .then((groups) => { if (!cancelled) setAnnouncementGroups(groups); })
        .catch(() => { if (!cancelled) setDataSourceError('خطا در دریافت گروه‌های اطلاعیه'); });
      fetchDataSourceAnnouncementCategories()
        .then((cats) => { if (!cancelled) setAnnouncementCategories(cats); })
        .catch(() => { /* optional */ });
    } else if (activeDataSource === 'gallery' || activeDataSource === 'files') {
      fetchDataSourceMediaFolders()
        .then((folders) => { if (!cancelled) setMediaFolders(folders); })
        .catch(() => { if (!cancelled) setDataSourceError('خطا در دریافت پوشه‌های رسانه'); });
    }

    return () => { cancelled = true; };
  }, [activeDataSource]);

  if (!selectedWidget && !selectedSection) {
    return (
      <div className="w-80 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center select-none rtl text-right">
        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
          <Sliders className="w-8 h-8" />
        </div>
        <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-1">پنل تنظیمات و هوشمندی</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          برای ویرایش خصوصیات، تغییر استایل یا اتصال به ماژول داده، روی یکی از ویجت‌ها یا سکشن‌های بوم کلیک کنید.
        </p>
      </div>
    );
  }

  // ==============================================================
  // WIDGET INSPECTION LOGIC
  // ==============================================================
  if (selectedWidget) {
    const handleStyleChange = (key: keyof WidgetStyle, val: any) => {
      const newStyle: WidgetStyle = { ...selectedWidget.settings.style, [key]: val };
      onUpdateWidget({
        ...selectedWidget,
        settings: {
          ...selectedWidget.settings,
          style: newStyle
        }
      });
    };

    const handleBindingChange = (key: keyof WidgetDataBinding, val: any) => {
      const newBinding: WidgetDataBinding = { ...selectedWidget.settings.binding, [key]: val };
      onUpdateWidget({
        ...selectedWidget,
        settings: {
          ...selectedWidget.settings,
          binding: newBinding
        }
      });
    };

    const handleVisibilityToggle = (device: 'desktop' | 'tablet' | 'mobile') => {
      const vis = { ...selectedWidget.settings.visibility };
      vis[device] = !vis[device];
      onUpdateWidget({
        ...selectedWidget,
        settings: {
          ...selectedWidget.settings,
          visibility: vis
        }
      });
    };

    const handleConditionalChange = (key: keyof ConditionalDisplayRule, val: any) => {
      const cond = { ...selectedWidget.settings.conditionalDisplay, [key]: val };
      onUpdateWidget({
        ...selectedWidget,
        settings: {
          ...selectedWidget.settings,
          conditionalDisplay: cond
        }
      });
    };

    return (
      <div className="w-80 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col h-full select-none rtl text-right">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span>ویرایش ویجت</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate">{selectedWidget.title || selectedWidget.type}</div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onDuplicateWidget(selectedWidget)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-500 cursor-pointer"
              title="تکثیر ویجت"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteWidget(selectedWidget.id)}
              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white cursor-pointer"
              title="حذف ویجت"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center justify-around border-b border-gray-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-1">
          <button
            onClick={() => setInspectorTab('content')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              inspectorTab === 'content'
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>محتوا و داده</span>
          </button>
          <button
            onClick={() => setInspectorTab('style')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              inspectorTab === 'style'
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>ظاهر و استایل</span>
          </button>
          <button
            onClick={() => setInspectorTab('logic')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              inspectorTab === 'logic'
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>شرایط هوشمند</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* TAB 1: CONTENT & DATA BINDING */}
          {inspectorTab === 'content' && (
            <div className="space-y-4">
              {/* Common Title & Content Inputs */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">عنوان ویجت</label>
                <input
                  type="text"
                  value={selectedWidget.title}
                  onChange={(e) => onUpdateWidget({ ...selectedWidget, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              {(selectedWidget.type === 'heading' || selectedWidget.type === 'text' || selectedWidget.type === 'accordion') && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">محتوای متنی</label>
                  <textarea
                    rows={4}
                    value={selectedWidget.content}
                    onChange={(e) => onUpdateWidget({ ...selectedWidget, content: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 leading-relaxed"
                  />
                </div>
              )}

              {selectedWidget.type === 'image' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">آدرس اینترنتی تصویر (URL)</label>
                  <input
                    type="text"
                    value={selectedWidget.imageUrl || ''}
                    onChange={(e) => onUpdateWidget({ ...selectedWidget, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-mono text-teal-600 dark:text-teal-400 focus:outline-none focus:border-teal-500"
                  />
                </div>
              )}

              {selectedWidget.type === 'button' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">عنوان روی دکمه</label>
                    <input
                      type="text"
                      value={selectedWidget.buttonText || ''}
                      onChange={(e) => onUpdateWidget({ ...selectedWidget, buttonText: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">لینک مقصد دکمه (HREF)</label>
                    <input
                      type="text"
                      value={selectedWidget.buttonUrl || ''}
                      onChange={(e) => onUpdateWidget({ ...selectedWidget, buttonUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-mono text-indigo-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </>
              )}

              {/* DATA BINDING CONTROLS FOR DYNAMIC WIDGETS */}
              <div className="pt-3 border-t border-gray-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400">
                  <Database className="w-3.5 h-3.5" />
                  <span>تنظیمات ماژول و اتصال داده (Smart Binding)</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">منبع داده متصل</label>
                  <select
                    value={selectedWidget.settings.binding.dataSource}
                    onChange={(e) => handleBindingChange('dataSource', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="none">بدون اتصال به ماژول (استاتیک)</option>
                    <option value="announcements">ماژول اطلاعیه‌های دانشگاهی</option>
                    <option value="news">ماژول مدیریت اخبار و مقالات</option>
                    <option value="gallery">آلبوم گالری رسانه‌ها</option>
                    <option value="awards">ماژول افتخارات و جوایز</option>
                    <option value="staff">سامانه پرسنلی اساتید و مدیران</option>
                    <option value="files">مدیریت فایل و مخزن اسناد</option>
                  </select>
                </div>

                {selectedWidget.settings.binding.dataSource !== 'none' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">حداکثر تعداد آیتم‌ها</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={selectedWidget.settings.binding.limit || 4}
                        onChange={(e) => handleBindingChange('limit', parseInt(e.target.value) || 4)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">حالت چیدمان و ساختار نمایش</label>
                      <select
                        value={selectedWidget.settings.binding.displayMode || 'grid'}
                        onChange={(e) => handleBindingChange('displayMode', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                      >
                        <option value="grid">شبکه‌ای (Grid)</option>
                        <option value="list">لیست عمودی (List)</option>
                        <option value="carousel">اسلایدر کروسل (Carousel)</option>
                        <option value="masonry">موزاییکی (Masonry)</option>
                        <option value="timeline">تایم‌لاین زمانی (Timeline)</option>
                        <option value="table">جدول همراه با سورت (Table)</option>
                      </select>
                    </div>

                    {/* ── گروه‌ها و دسته‌بندی‌ها از وب‌سرویس ── */}
                    {activeDataSource === 'news' && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          دسته‌بندی خبر (اتصال به گروه)
                        </label>
                        <select
                          value={selectedWidget.settings.binding.categoryFilter || 'all'}
                          onChange={(e) => handleBindingChange('categoryFilter', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                        >
                          <option value="all">همه دسته‌بندی‌ها</option>
                          {newsCategories.map((c) => (
                            <option key={c.id} value={String(c.id)}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {activeDataSource === 'announcements' && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            گروه اطلاعیه (اتصال به گروه)
                          </label>
                          <select
                            value={selectedWidget.settings.binding.categoryFilter || 'all'}
                            onChange={(e) => handleBindingChange('categoryFilter', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                          >
                            <option value="all">همه گروه‌ها</option>
                            {announcementGroups.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            دسته‌بندی اطلاعیه
                          </label>
                          <select
                            value={selectedWidget.settings.binding.yearFilter || 'all'}
                            onChange={(e) => handleBindingChange('yearFilter', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                          >
                            <option value="all">همه دسته‌بندی‌ها</option>
                            {announcementCategories.map((c) => (
                              <option key={c.id} value={String(c.id)}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            فیلتر اولویت (فوری / عادی)
                          </label>
                          <select
                            value={selectedWidget.settings.binding.priorityFilter || 'all'}
                            onChange={(e) => handleBindingChange('priorityFilter', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                          >
                            <option value="all">همه</option>
                            <option value="urgent">فقط فوری</option>
                            <option value="standard">فقط عادی</option>
                          </select>
                        </div>
                      </>
                    )}

                    {(activeDataSource === 'gallery' || activeDataSource === 'files') && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          پوشه رسانه (اختیاری)
                        </label>
                        <select
                          value={selectedWidget.settings.binding.folderFilter || 'all'}
                          onChange={(e) => handleBindingChange('folderFilter', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                        >
                          <option value="all">همه پوشه‌ها</option>
                          {mediaFolders.map((f) => (
                            <option key={f.id} value={String(f.id)}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {activeDataSource === 'staff' && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          نوع اعضا
                        </label>
                        <select
                          value={selectedWidget.settings.binding.departmentFilter || 'faculty_member'}
                          onChange={(e) => handleBindingChange('departmentFilter', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                        >
                          <option value="faculty_member">اعضای هیئت علمی</option>
                          <option value="visiting_professor">اساتید مدعو</option>
                          <option value="staff">کارکنان</option>
                          <option value="student">دانشجویان</option>
                        </select>
                      </div>
                    )}

                    {dataSourceError && (
                      <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {dataSourceError}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: STYLES & TYPOGRAPHY */}
          {inspectorTab === 'style' && (
            <div className="space-y-4">
              {/* Text Color & Background Color */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">رنگ متن</label>
                  <input
                    type="color"
                    value={selectedWidget.settings.style.textColor || '#000000'}
                    onChange={(e) => handleStyleChange('textColor', e.target.value)}
                    className="w-full h-9 rounded-xl border border-gray-200 dark:border-slate-800 cursor-pointer bg-slate-50 dark:bg-slate-950 p-1"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">رنگ پس‌زمینه</label>
                  <input
                    type="color"
                    value={selectedWidget.settings.style.backgroundColor || '#ffffff'}
                    onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                    className="w-full h-9 rounded-xl border border-gray-200 dark:border-slate-800 cursor-pointer bg-slate-50 dark:bg-slate-950 p-1"
                  />
                </div>
              </div>

              {/* Font Size & Weight */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">اندازه قلم</label>
                  <input
                    type="text"
                    placeholder="e.g. 18px"
                    value={selectedWidget.settings.style.fontSize || ''}
                    onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">وزن متنی</label>
                  <select
                    value={selectedWidget.settings.style.fontWeight || '400'}
                    onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="400">عادی (400)</option>
                    <option value="600">نیمه ضخیم (600)</option>
                    <option value="700">ضخیم (700)</option>
                    <option value="900">بسیار ضخیم (900)</option>
                  </select>
                </div>
              </div>

              {/* Text Alignment */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">ترازبندی متن</label>
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-gray-200 dark:border-slate-800">
                  <button
                    onClick={() => handleStyleChange('textAlign', 'right')}
                    className={`flex-1 py-1.5 rounded-lg flex justify-center text-xs font-bold cursor-pointer ${
                      selectedWidget.settings.style.textAlign === 'right' ? 'bg-teal-500 text-slate-950' : 'text-slate-500'
                    }`}
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleStyleChange('textAlign', 'center')}
                    className={`flex-1 py-1.5 rounded-lg flex justify-center text-xs font-bold cursor-pointer ${
                      selectedWidget.settings.style.textAlign === 'center' ? 'bg-teal-500 text-slate-950' : 'text-slate-500'
                    }`}
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleStyleChange('textAlign', 'left')}
                    className={`flex-1 py-1.5 rounded-lg flex justify-center text-xs font-bold cursor-pointer ${
                      selectedWidget.settings.style.textAlign === 'left' ? 'bg-teal-500 text-slate-950' : 'text-slate-500'
                    }`}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Padding & Border Radius */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">شعاع انحنا (Radius)</label>
                  <input
                    type="number"
                    value={selectedWidget.settings.style.borderRadius || 0}
                    onChange={(e) => handleStyleChange('borderRadius', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">پدینگ عمودی (px)</label>
                  <input
                    type="number"
                    value={selectedWidget.settings.style.paddingTop || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      handleStyleChange('paddingTop', val);
                      handleStyleChange('paddingBottom', val);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SMART LOGIC & RULES */}
          {inspectorTab === 'logic' && (
            <div className="space-y-4">
              {/* Responsive Device Visibility */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">نمایش در دستگاه‌های مختلف</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleVisibilityToggle('desktop')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs cursor-pointer ${
                      selectedWidget.settings.visibility.desktop
                        ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
                        : 'bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-400 opacity-60'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                    <span>دسکتاپ</span>
                  </button>

                  <button
                    onClick={() => handleVisibilityToggle('tablet')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs cursor-pointer ${
                      selectedWidget.settings.visibility.tablet
                        ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
                        : 'bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-400 opacity-60'
                    }`}
                  >
                    <Tablet className="w-4 h-4" />
                    <span>تبلت</span>
                  </button>

                  <button
                    onClick={() => handleVisibilityToggle('mobile')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs cursor-pointer ${
                      selectedWidget.settings.visibility.mobile
                        ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
                        : 'bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-400 opacity-60'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>موبایل</span>
                  </button>
                </div>
              </div>

              {/* Conditional Display Rule */}
              <div className="pt-3 border-t border-gray-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white">شرط نمایش بر اساس نقش کاربر</span>
                  <input
                    type="checkbox"
                    checked={selectedWidget.settings.conditionalDisplay?.enabled || false}
                    onChange={(e) => handleConditionalChange('enabled', e.target.checked)}
                    className="accent-teal-500 w-4 h-4 cursor-pointer"
                  />
                </div>

                {selectedWidget.settings.conditionalDisplay?.enabled && (
                  <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">نمایش فقط برای نقش:</label>
                    <select
                      value={selectedWidget.settings.conditionalDisplay?.userRole || 'all'}
                      onChange={(e) => handleConditionalChange('userRole', e.target.value as UserRoleCondition)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="all">همه کاربران (عمومی)</option>
                      <option value="student">فقط دانشجویان</option>
                      <option value="professor">فقط اساتید</option>
                      <option value="admin">فقط مدیران سیستم</option>
                      <option value="guest">فقط کاربران مهمان (وارد نشده)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==============================================================
  // SECTION INSPECTION LOGIC
  // ==============================================================
  if (selectedSection) {
    return (
      <div className="w-80 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col h-full select-none rtl text-right">
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-500" />
              <span>تنظیمات سکشن</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate">{selectedSection.name}</div>
          </div>

          <button
            onClick={() => onDeleteSection(selectedSection.id)}
            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white cursor-pointer"
            title="حذف سکشن"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">نام سکشن</label>
            <input
              type="text"
              value={selectedSection.name}
              onChange={(e) => onUpdateSection({ ...selectedSection, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">عرض سکشن (Layout)</label>
            <select
              value={selectedSection.layout}
              onChange={(e) => onUpdateSection({ ...selectedSection, layout: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="boxed">محدود شده به کادر (Boxed Container)</option>
              <option value="full-width">تمام صفحه (Full Width)</option>
            </select>
          </div>

          {onUpdateSectionColumnLayout && (
            <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-slate-800">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                الگوی چیدمان ستون‌ها (Column Layout)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateSectionColumnLayout(selectedSection.id, '1col')}
                  className="p-2 rounded-xl border bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 hover:border-teal-500 text-xs font-bold text-slate-800 dark:text-slate-200 text-center flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span className="w-full h-3 bg-teal-500/30 rounded-xs" />
                  <span className="text-[10px]">۱ ستونه</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateSectionColumnLayout(selectedSection.id, '2col')}
                  className="p-2 rounded-xl border bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 hover:border-teal-500 text-xs font-bold text-slate-800 dark:text-slate-200 text-center flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span className="w-full h-3 flex gap-0.5">
                    <span className="w-1/2 h-full bg-teal-500/30 rounded-xs" />
                    <span className="w-1/2 h-full bg-teal-500/30 rounded-xs" />
                  </span>
                  <span className="text-[10px]">۲ ستونه</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateSectionColumnLayout(selectedSection.id, '3col')}
                  className="p-2 rounded-xl border bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 hover:border-teal-500 text-xs font-bold text-slate-800 dark:text-slate-200 text-center flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span className="w-full h-3 flex gap-0.5">
                    <span className="w-1/3 h-full bg-teal-500/30 rounded-xs" />
                    <span className="w-1/3 h-full bg-teal-500/30 rounded-xs" />
                    <span className="w-1/3 h-full bg-teal-500/30 rounded-xs" />
                  </span>
                  <span className="text-[10px]">۳ ستونه</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateSectionColumnLayout(selectedSection.id, '4col')}
                  className="p-2 rounded-xl border bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 hover:border-teal-500 text-xs font-bold text-slate-800 dark:text-slate-200 text-center flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span className="w-full h-3 flex gap-0.5">
                    <span className="w-1/4 h-full bg-teal-500/30 rounded-xs" />
                    <span className="w-1/4 h-full bg-teal-500/30 rounded-xs" />
                    <span className="w-1/4 h-full bg-teal-500/30 rounded-xs" />
                    <span className="w-1/4 h-full bg-teal-500/30 rounded-xs" />
                  </span>
                  <span className="text-[10px]">۴ ستونه</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateSectionColumnLayout(selectedSection.id, '7-5')}
                  className="p-2 rounded-xl border bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 hover:border-teal-500 text-xs font-bold text-slate-800 dark:text-slate-200 text-center flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span className="w-full h-3 flex gap-0.5">
                    <span className="w-[60%] h-full bg-teal-500/30 rounded-xs" />
                    <span className="w-[40%] h-full bg-teal-500/30 rounded-xs" />
                  </span>
                  <span className="text-[10px]">۷ به ۵</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateSectionColumnLayout(selectedSection.id, '8-4')}
                  className="p-2 rounded-xl border bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 hover:border-teal-500 text-xs font-bold text-slate-800 dark:text-slate-200 text-center flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span className="w-full h-3 flex gap-0.5">
                    <span className="w-[66%] h-full bg-teal-500/30 rounded-xs" />
                    <span className="w-[34%] h-full bg-teal-500/30 rounded-xs" />
                  </span>
                  <span className="text-[10px]">۸ به ۴</span>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">رنگ پس‌زمینه سکشن</label>
            <input
              type="color"
              value={selectedSection.backgroundColor || '#ffffff'}
              onChange={(e) => onUpdateSection({ ...selectedSection, backgroundColor: e.target.value })}
              className="w-full h-9 rounded-xl border border-gray-200 dark:border-slate-800 cursor-pointer bg-slate-50 dark:bg-slate-950 p-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">پدینگ بالا (px)</label>
              <input
                type="number"
                value={selectedSection.paddingTop}
                onChange={(e) => onUpdateSection({ ...selectedSection, paddingTop: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">پدینگ پایین (px)</label>
              <input
                type="number"
                value={selectedSection.paddingBottom}
                onChange={(e) => onUpdateSection({ ...selectedSection, paddingBottom: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
