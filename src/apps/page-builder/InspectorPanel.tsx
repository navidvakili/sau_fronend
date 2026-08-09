import React, { useState, useEffect, useRef } from 'react';
import {
  WidgetInstance,
  SectionInstance,
  ColumnInstance,
  WidgetStyle,
  WidgetDataBinding,
  ConditionalDisplayRule,
  UserRoleCondition,
  Breakpoint,
  getColumnWidth,
  getWidgetTypeLabel
} from './builderTypes';
import {
  fetchDataSourceNewsCategories,
  fetchDataSourceAnnouncementGroups,
  fetchDataSourceMediaFolders
} from './api';
import GradientPicker from '../slider-studio/components/GradientPicker';
import MediaManager from '@/src/shared-components/MediaManager';
import WysiwygEditor, { type WysiwygEditorHandle } from '@/src/shared-components/WysiwygEditor';
import IconPicker, { ICON_CHOICES } from './components/IconPicker';
import type { NewsCategory } from '@/src/shared-types';
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
  Layers,
  Image as ImageIcon,
  Bookmark as BookmarkIcon,
  X,
  Maximize2,
  Minimize2,
  Check
} from 'lucide-react';

// ── سایه‌های آماده (هم‌سطح slider-studio) ──
const SHADOW_SM = '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1)';
const SHADOW_MD = '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)';
const SHADOW_LG = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)';

// ── جعبهٔ انتخاب رنگ — وقتی رنگ حذف شده باشد چهارخانهٔ ترانسپرنت نمایش می‌دهد ──
/** اگر مقدار undefined/transparent باشد، الگوی چهارخانهٔ شفاف (مثل نرم‌افزارهای تصویری) دیده می‌شود */
const ColorBox: React.FC<{
  value?: string;
  onChange: (color: string) => void;
  className?: string;
}> = ({ value, onChange, className = '' }) => {
  const empty = !value || value === 'transparent';
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800 shrink-0 p-1 ${className}`}
    >
      <div
        className="w-full h-full rounded-lg"
        style={{
          backgroundColor: empty ? undefined : value,
          backgroundImage: empty
            ? 'conic-gradient(#d8dee6 0 25%, #ffffff 0 50%, #d8dee6 0 75%, #ffffff 0)'
            : undefined,
          backgroundSize: empty ? '12px 12px' : undefined
        }}
      />
      <input
        type="color"
        value={value || '#ffffff'}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  );
};

interface InspectorPanelProps {
  selectedWidget: WidgetInstance | null;
  selectedColumn: ColumnInstance | null;
  selectedSection: SectionInstance | null;
  activeBreakpoint?: Breakpoint;
  onUpdateWidget: (updated: WidgetInstance) => void;
  onUpdateSection: (updated: SectionInstance) => void;
  onUpdateSectionColumnLayout?: (sectionId: string, preset: '1col' | '2col' | '3col' | '4col' | '7-5' | '8-4') => void;
  onUpdateColumnWidth?: (sectionId: string, columnId: string, bp: Breakpoint, value: number) => void;
  onDeleteWidget: (widgetId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onDuplicateWidget: (widget: WidgetInstance) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedWidget,
  selectedColumn,
  selectedSection,
  activeBreakpoint = 'desktop',
  onUpdateWidget,
  onUpdateSection,
  onUpdateSectionColumnLayout,
  onUpdateColumnWidth,
  onDeleteWidget,
  onDeleteSection,
  onDuplicateWidget
}) => {
  const [inspectorTab, setInspectorTab] = useState<'content' | 'style' | 'logic'>('content');
  const [colBp, setColBp] = useState<Breakpoint>('desktop');
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'sectionBg' | 'widgetImage' | 'videoPoster' | null>(null);
  /** دیالوگ نسخهٔ کامل ویرایشگر متن غنی (WYSIWYG) */
  const [richtextFullscreen, setRichtextFullscreen] = useState(false);

  // کپی مستعار — قبل از هر Narrowing تا در دیالوگ fullscreen نوع کامل حفظ شود
  const fullscreenWidget = selectedWidget;

  // ── انتخابگر آیکون برای متن / دکمه ──
  const [iconPickerState, setIconPickerState] = useState<{ open: boolean; mode: 'text' | 'button' | 'richtext' }>({ open: false, mode: 'text' });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [cursorRange, setCursorRange] = useState<{ start: number; end: number } | null>(null);

  // refs ویرایشگر متن غنی (پایه در پنل و کامل در دیالوگ) — برای درج توکن آیکون
  const richtextEditorRef = useRef<WysiwygEditorHandle | null>(null);
  const richtextFullscreenEditorRef = useRef<WysiwygEditorHandle | null>(null);
  /** کدام ویرایشگر متن غنی درخواست درج آیکون داده است */
  const iconTargetRef = useRef<'inline' | 'fullscreen'>('inline');

  /** درج توکن آیکون در محتوای متنی (heading / text / richtext) */
  const insertIconToken = (iconName: string) => {
    if (!iconName) {
      setIconPickerState({ open: false, mode: 'text' });
      return;
    }
    const token = `[icon:${iconName}]`;
    const content = selectedWidget?.content || '';
    if (cursorRange && textareaRef.current) {
      const start = Math.min(cursorRange.start, content.length);
      const end = Math.min(cursorRange.end, content.length);
      const next = content.slice(0, start) + token + content.slice(end);
      onUpdateWidget({ ...selectedWidget!, content: next });
      // پس از رندر، مکان‌نما را بعد از توکن بگذار
      setTimeout(() => {
        const ta = textareaRef.current;
        if (ta) {
          ta.focus();
          const pos = start + token.length;
          ta.setSelectionRange(pos, pos);
        }
      }, 0);
    } else {
      onUpdateWidget({ ...selectedWidget!, content: content + (content ? ' ' : '') + token });
    }
    setIconPickerState({ open: false, mode: 'text' });
  };

  /** انتخاب آیکون برای دکمه */
  const selectButtonIcon = (iconName: string) => {
    if (selectedWidget) {
      onUpdateWidget({ ...selectedWidget, iconName: iconName || undefined });
    }
    setIconPickerState({ open: false, mode: 'button' });
  };

  /** درج آیکون در ویرایشگر متن غنی (WYSIWYG) — از طریق ref در محل مکان‌نما */
  const insertRichtextIcon = (iconName: string) => {
    const ref = iconTargetRef.current === 'fullscreen' ? richtextFullscreenEditorRef : richtextEditorRef;
    if (iconName) {
      ref.current?.insertIconToken(iconName);
    }
    setIconPickerState({ open: false, mode: 'text' });
  };

  // ── Data-source option lists (گروه‌ها و دسته‌بندی‌ها از وب‌سرویس) ──
  const [newsCategories, setNewsCategories] = useState<NewsCategory[]>([]);
  const [announcementGroups, setAnnouncementGroups] = useState<string[]>([]);
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

  // ── دیالوگ نسخهٔ کامل ویرایشگر متن غنی (WYSIWYG) ──
  // این دیالوگ باید قبل از شاخهٔ ویجت/سکشن قرار بگیرد تا با کلیک روی دکمهٔ بزرگ‌نمایی نمایش داده شود
  if (richtextFullscreen && fullscreenWidget) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-900/70 backdrop-blur-sm select-none rtl text-right">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-teal-500" />
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">ویرایشگر کامل متن غنی</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  نوع ویجت: {getWidgetTypeLabel(fullscreenWidget.type)} — همهٔ ابزارها در دسترس است
                </p>
              </div>
            </div>
            <button
              onClick={() => setRichtextFullscreen(false)}
              className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
              title="بستن (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Full Editor */}
          <div className="flex-1 overflow-y-auto p-4">
            <WysiwygEditor
              ref={richtextFullscreenEditorRef}
              content={fullscreenWidget.content}
              onChange={(html) => onUpdateWidget({ ...fullscreenWidget, content: html })}
              placeholder="متن غنی را بنویسید — تیتر، پاراگراف، لینک، تصویر و جدول..."
              minHeight="60vh"
              mode="full"
              onRequestCompact={() => setRichtextFullscreen(false)}
              showIconButton
              onRequestIcon={() => {
                iconTargetRef.current = 'fullscreen';
                setIconPickerState({ open: true, mode: 'text' });
              }}
            />
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between shrink-0">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              تغییرات به‌صورت زنده روی بوم اعمال می‌شود.
            </p>
            <button
              onClick={() => setRichtextFullscreen(false)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              اعمال و بستن
            </button>
          </div>
        </div>

        {/* انتخابگر آیکون — برای نسخهٔ کامل هم در دسترس است */}
        <IconPicker
          open={iconPickerState.open}
          onClose={() => setIconPickerState({ open: false, mode: 'text' })}
          title="انتخاب آیکون متن"
          onSelect={insertRichtextIcon}
        />
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

    /** به‌روزرسانی فیلدهای سفارشی (customProps) بلوک */
    const updateCustomProps = (patch: Record<string, any>) => {
      onUpdateWidget({
        ...selectedWidget,
        settings: {
          ...selectedWidget.settings,
          customProps: {
            ...(selectedWidget.settings.customProps || {}),
            ...patch
          }
        }
      });
    };

    const customProps = selectedWidget.settings.customProps || {};

    return (
      <>
      <div className="w-80 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col h-full select-none rtl text-right">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span>ویرایش ویجت</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">{selectedWidget.title || selectedWidget.type}</div>
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
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">عنوان ویجت</label>
                  <span
                    className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black whitespace-nowrap"
                    title={`نوع ویجت: ${getWidgetTypeLabel(selectedWidget.type)}`}
                  >
                    {getWidgetTypeLabel(selectedWidget.type)}
                  </span>
                </div>
                <input
                  type="text"
                  value={selectedWidget.title}
                  onChange={(e) => onUpdateWidget({ ...selectedWidget, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              {(selectedWidget.type === 'heading' || selectedWidget.type === 'text' || selectedWidget.type === 'accordion') && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">محتوای متنی</label>
                    <button
                      type="button"
                      onClick={() => {
                        const ta = textareaRef.current;
                        setCursorRange(ta ? { start: ta.selectionStart, end: ta.selectionEnd } : null);
                        setIconPickerState({ open: true, mode: 'text' });
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500 hover:text-white text-[10px] font-bold transition-all cursor-pointer"
                      title="درج آیکون در متن (توکن [icon:name])"
                    >
                      <Sparkles className="w-3 h-3" />
                      درج آیکون
                    </button>
                  </div>
                  <textarea
                    ref={textareaRef}
                    rows={4}
                    value={selectedWidget.content}
                    onChange={(e) => onUpdateWidget({ ...selectedWidget, content: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-400">برای درج آیکون در دل متن، از دکمه «درج آیکون» استفاده کنید.</p>
                </div>
              )}

              {selectedWidget.type === 'image' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">آدرس اینترنتی تصویر (URL)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      dir="ltr"
                      value={selectedWidget.imageUrl || ''}
                      onChange={(e) => onUpdateWidget({ ...selectedWidget, imageUrl: e.target.value })}
                      className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-teal-600 dark:text-teal-400 focus:outline-none focus:border-teal-500"
                    />
                    <button
                      type="button"
                      onClick={() => setMediaPickerTarget('widgetImage')}
                      className="shrink-0 p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500 hover:text-white transition-all cursor-pointer"
                      title="انتخاب از مدیریت رسانه"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                  </div>
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
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">آیکون دکمه (اختیاری)</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIconPickerState({ open: true, mode: 'button' })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          selectedWidget.iconName
                            ? 'bg-teal-500/15 border-teal-500/50 text-teal-600 dark:text-teal-400'
                            : 'bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400'
                        }`}
                      >
                        {selectedWidget.iconName ? (
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" />
                            {selectedWidget.iconName}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" />
                            انتخاب آیکون
                          </span>
                        )}
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      {selectedWidget.iconName && (
                        <button
                          type="button"
                          onClick={() => onUpdateWidget({ ...selectedWidget, iconName: undefined })}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                          title="حذف آیکون"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">لینک مقصد دکمه (HREF)</label>
                    <input
                      type="text"
                      value={selectedWidget.buttonUrl || ''}
                      onChange={(e) => onUpdateWidget({ ...selectedWidget, buttonUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-indigo-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </>
              )}

              {selectedWidget.type === 'video' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">آدرس اینترنتی ویدیو (URL)</label>
                    <input
                      type="text"
                      value={selectedWidget.videoUrl || ''}
                      onChange={(e) => onUpdateWidget({ ...selectedWidget, videoUrl: e.target.value })}
                      placeholder="https://... (لینک جاسازی یا فایل mp4)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-teal-600 dark:text-teal-400 focus:outline-none focus:border-teal-500"
                    />
                    <p className="text-[10px] text-slate-400">لینک جاسازی (iframe) یا فایل مستقیم mp4/webm/ogg</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">ابعاد قاب (Aspect Ratio)</label>
                    <select
                      value={selectedWidget.settings.style.aspectRatio || '16 / 9'}
                      onChange={(e) => handleStyleChange('aspectRatio', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="16 / 9">۱۶ به ۹ (سینمایی)</option>
                      <option value="4 / 3">۴ به ۳</option>
                      <option value="1 / 1">۱ به ۱ (مربعی)</option>
                      <option value="auto">خودکار</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { key: 'videoAutoplay', label: 'پخش خودکار' },
                      { key: 'videoLoop', label: 'حلقه تکرار' },
                      { key: 'videoMuted', label: 'بی‌صدا' }
                    ] as const).map(({ key, label }) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedWidget.settings.style[key] === true}
                          onChange={(e) => handleStyleChange(key, e.target.checked)}
                          className="accent-teal-600 w-4 h-4"
                        />
                        {label}
                      </label>
                    ))}
                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedWidget.settings.style.videoControls !== false}
                        onChange={(e) => handleStyleChange('videoControls', e.target.checked)}
                        className="accent-teal-600 w-4 h-4"
                      />
                      نمایش کنترل‌ها
                    </label>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">تصویر پوستر (Poster) — اختیاری</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        dir="ltr"
                        value={selectedWidget.settings.style.videoPoster || ''}
                        onChange={(e) => handleStyleChange('videoPoster', e.target.value)}
                        placeholder="https://... تصویر قبل از پخش"
                        className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                      <button
                        type="button"
                        onClick={() => setMediaPickerTarget('videoPoster')}
                        className="shrink-0 p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500 hover:text-white transition-all cursor-pointer"
                        title="انتخاب از مدیریت رسانه"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ────────────────────────────────────────────────
                   NEW BLOCK TYPES — محتوای بلوک‌های جدید
              ──────────────────────────────────────────────── */}

              {/* ریش‌تکست / بلاک متن WYSIWYG */}
              {selectedWidget.type === 'richtext' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    محتوای HTML (ویرایشگر غنی)
                  </label>
                  <WysiwygEditor
                    ref={richtextEditorRef}
                    content={selectedWidget.content}
                    onChange={(html) => onUpdateWidget({ ...selectedWidget, content: html })}
                    placeholder="متن غنی را بنویسید — تیتر، پاراگراف، لینک، تصویر و جدول..."
                    minHeight="240px"
                    mode="basic"
                    showMaximize
                    onRequestFullscreen={() => setRichtextFullscreen(true)}
                    showIconButton
                    onRequestIcon={() => {
                      iconTargetRef.current = 'inline';
                      setIconPickerState({ open: true, mode: 'richtext' });
                    }}
                  />
                  <p className="text-[10px] text-slate-400">
                    ویرایشگر WYSIWYG هم‌سطح مدیریت خبر — برای دسترسی به همهٔ ابزارها دکمهٔ بزرگ‌نمایی را بزنید.
                  </p>
                </div>
              )}

              {/* باکس آیکون */}
              {selectedWidget.type === 'icon-box' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">آیکون</label>
                    <select
                      value={customProps.iconName || 'sparkles'}
                      onChange={(e) => updateCustomProps({ iconName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      {ICON_CHOICES.map((ic) => (
                        <option key={ic} value={ic}>{ic}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">توضیح باکس</label>
                    <textarea
                      rows={3}
                      value={selectedWidget.content}
                      onChange={(e) => onUpdateWidget({ ...selectedWidget, content: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">متن دکمه (اختیاری)</label>
                    <input
                      type="text"
                      value={customProps.buttonText || ''}
                      onChange={(e) => updateCustomProps({ buttonText: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">لینک دکمه (اختیاری)</label>
                    <input
                      type="text"
                      value={customProps.buttonUrl || ''}
                      onChange={(e) => updateCustomProps({ buttonUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-indigo-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </>
              )}

              {/* دربرگیرنده‌ها (عمودی/افقی) */}
              {(selectedWidget.type === 'vertical-container' || selectedWidget.type === 'horizontal-container') && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">فاصله بین زیربلوک‌ها (px)</label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={customProps.gap ?? 16}
                      onChange={(e) => updateCustomProps({ gap: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">زیربلوک‌ها (هر خط یک آدرس تصویر یا متن)</label>
                    <textarea
                      rows={4}
                      value={(customProps.children || []).map((c: any) => c.content).join('\n')}
                      onChange={(e) => {
                        const lines = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                        const children = lines.map((line, i) => ({
                          id: `child-${Date.now()}-${i}`,
                          type: 'text' as any,
                          title: `زیربلوک ${i + 1}`,
                          content: line,
                          settings: {
                            style: { textAlign: 'right' as const },
                            binding: { dataSource: 'none' as const },
                            visibility: { desktop: true, tablet: true, mobile: true },
                            conditionalDisplay: { enabled: false, userRole: 'all' as any }
                          }
                        }));
                        updateCustomProps({ children });
                      }}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </>
              )}

              {/* اسلایدر تصویر */}
              {selectedWidget.type === 'image-slider' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    آدرس تصاویر (هر خط یک URL)
                  </label>
                  <textarea
                    rows={5}
                    value={(customProps.images || []).join('\n')}
                    onChange={(e) => {
                      const urls = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                      updateCustomProps({ images: urls });
                    }}
                    placeholder={'https://example.com/1.jpg\nhttps://example.com/2.jpg'}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 leading-relaxed"
                  />
                </div>
              )}

              {/* شمارنده */}
              {selectedWidget.type === 'counter' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">مقدار عددی هدف</label>
                    <input
                      type="number"
                      min={0}
                      value={customProps.target ?? 100}
                      onChange={(e) => updateCustomProps({ target: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">مدت زمان انیمیشن (میلی‌ثانیه)</label>
                    <input
                      type="number"
                      min={300}
                      max={5000}
                      step={100}
                      value={customProps.duration ?? 1200}
                      onChange={(e) => updateCustomProps({ duration: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">پیشوند</label>
                      <input
                        type="text"
                        value={customProps.prefix || ''}
                        onChange={(e) => updateCustomProps({ prefix: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">پسوند</label>
                      <input
                        type="text"
                        value={customProps.suffix ?? '+'}
                        onChange={(e) => updateCustomProps({ suffix: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* پیمایشگر */}
              {selectedWidget.type === 'navigator' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">تایپ محتوا</label>
                    <select
                      value={customProps.postType || 'صفحه'}
                      onChange={(e) => updateCustomProps({ postType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="صفحه">برگه‌ها (صفحات)</option>
                      <option value="نوشته">نوشته‌ها (بلاگ)</option>
                      <option value="خبر">اخبار</option>
                      <option value="اطلاعیه">اطلاعیه‌ها</option>
                      <option value="دسته">دسته‌بندی دلخواه</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      فهرست آیتم‌ها (هر خط: عنوان|لینک)
                    </label>
                    <textarea
                      rows={5}
                      value={(customProps.items || []).map((i: any) => `${i.label}|${i.url}`).join('\n')}
                      onChange={(e) => {
                        const items = e.target.value
                          .split('\n')
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((line) => {
                            const [label, url] = line.split('|');
                            return { label: label || 'مورد', url: url || '#' };
                          });
                        updateCustomProps({ items });
                      }}
                      placeholder={'صفحه اصلی|/\nدرباره ما|/about'}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 leading-relaxed"
                    />
                  </div>
                </>
              )}

              {/* نوار راهبری (منو) */}
              {selectedWidget.type === 'nav-menu' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">عنوان برند (سمت راست نوار)</label>
                    <input
                      type="text"
                      value={customProps.brand || ''}
                      onChange={(e) => updateCustomProps({ brand: e.target.value })}
                      placeholder="معاونت آموزشی و تحصیلات تکمیلی"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      آیتم‌های منو (هر خط: عنوان|لینک)
                    </label>
                    <textarea
                      rows={5}
                      value={(customProps.items || []).map((i: any) => `${i.label}|${i.url}`).join('\n')}
                      onChange={(e) => {
                        const items = e.target.value
                          .split('\n')
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((line) => {
                            const [label, url] = line.split('|');
                            return { label: label || 'مورد', url: url || '#' };
                          });
                        updateCustomProps({ items });
                      }}
                      placeholder={'صفحه اصلی|/\nخدمات|#services'}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 leading-relaxed"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                    برای نوار چسبان، وضعیت «چسبان (sticky)» را از بخش موقعیت سکشن انتخاب کنید و پس‌زمینه را روی همان سکشن تنظیم کنید.
                  </p>
                </>
              )}

              {/* لیست زیرصفحه‌ها */}
              {selectedWidget.type === 'child-pages' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      نحوهٔ نمایش
                    </label>
                    <div className="grid grid-cols-1 gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateCustomProps({ mode: 'tree' })}
                        className={`text-right px-3 py-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                          (customProps.mode ?? 'tree') === 'tree'
                            ? 'bg-teal-500/10 border-teal-500/40 text-teal-700 dark:text-teal-300'
                            : 'bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-teal-500/40'
                        }`}
                      >
                        درختی — همهٔ زیرمجموعه‌ها زیر همین صفحه
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCustomProps({ mode: 'direct' })}
                        className={`text-right px-3 py-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                          customProps.mode === 'direct'
                            ? 'bg-teal-500/10 border-teal-500/40 text-teal-700 dark:text-teal-300'
                            : 'bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-teal-500/40'
                        }`}
                      >
                        هر صفحه فقط زیرصفحه‌های خودش
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      حداکثر تعداد زیرصفحه‌ها (Limit)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={customProps.limit ?? 12}
                      onChange={(e) =>
                        updateCustomProps({ limit: Math.max(1, Math.min(100, parseInt(e.target.value) || 12)) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                    در حالت درختی، زیر هر زیرصفحه نام زیرصفحه‌های آن نیز به‌صورت تودرتو فهرست می‌شود؛ در حالت دوم، هر صفحه فقط زیرصفحه‌های مستقیم خودش را نشان می‌دهد.
                  </p>
                </>
              )}

              {/* نقشه */}
              {selectedWidget.type === 'map' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">لینک جاسازی نقشه (Embed URL)</label>
                    <input
                      type="text"
                      value={customProps.embedUrl || ''}
                      onChange={(e) => updateCustomProps({ embedUrl: e.target.value })}
                      placeholder="https://www.google.com/maps?q=Yazd&output=embed"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-indigo-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">نشانی نمایشی</label>
                    <input
                      type="text"
                      value={customProps.address || ''}
                      onChange={(e) => updateCustomProps({ address: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </>
              )}

              {/* اطلاعات تماس */}
              {selectedWidget.type === 'contact-info' && (
                <>
                  {(
                    [
                      ['phone', 'تلفن'],
                      ['email', 'ایمیل'],
                      ['address', 'نشانی'],
                      ['workHours', 'ساعات کاری']
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{label}</label>
                      <input
                        type="text"
                        value={customProps[key] || ''}
                        onChange={(e) => updateCustomProps({ [key]: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  ))}
                </>
              )}

              {/* HTML دلخواه */}
              {selectedWidget.type === 'custom-html' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">کد HTML / اسکریپت</label>
                  <textarea
                    rows={7}
                    value={selectedWidget.content}
                    onChange={(e) => onUpdateWidget({ ...selectedWidget, content: e.target.value })}
                    placeholder={'<div>کد دلخواه شما...</div>'}
                    className="w-full p-3 rounded-xl bg-slate-950 text-xs text-emerald-400 border border-gray-800 focus:outline-none focus:border-teal-500 leading-relaxed"
                    dir="ltr"
                  />
                </div>
              )}

              {/* لینک‌های اجتماعی */}
              {selectedWidget.type === 'social-links' && (
                <>
                  <p className="text-[10px] text-slate-400">آدرس شبکه‌های اجتماعی را وارد کنید (خالی = نمایش آیکون بدون لینک)</p>
                  {(
                    [
                      ['telegram', 'تلگرام'],
                      ['instagram', 'اینستاگرام'],
                      ['twitter', 'توییتر'],
                      ['linkedin', 'لینکدین'],
                      ['youtube', 'یوتیوب'],
                      ['whatsapp', 'واتساپ']
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{label}</label>
                      <input
                        type="text"
                        value={(customProps.urls || {})[key] || ''}
                        onChange={(e) =>
                          updateCustomProps({ urls: { ...(customProps.urls || {}), [key]: e.target.value } })
                        }
                        placeholder="https://..."
                        dir="ltr"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  ))}
                </>
              )}

              {/* دکمه‌های اشتراک‌گذاری */}
              {selectedWidget.type === 'share-buttons' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    لینک صفحه برای اشتراک (اختیاری — خالی = آدرس فعلی)
                  </label>
                  <input
                    type="text"
                    value={customProps.pageUrl || ''}
                    onChange={(e) => updateCustomProps({ pageUrl: e.target.value })}
                    dir="ltr"
                    placeholder="https://sau.ac.ir/page"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-indigo-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              )}

              {/* جدول قیمت */}
              {selectedWidget.type === 'pricing-table' && (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400">
                    هر خط یک پلن: نام|قیمت|ویژگی۱،ویژگی۲|پیشنهادی(اختیاری yes)
                  </p>
                  <textarea
                    rows={6}
                    value={(customProps.plans || []).map((p: any) => `${p.name}|${p.price}|${(p.features || []).join('،')}|${p.highlight ? 'yes' : 'no'}`).join('\n')}
                    onChange={(e) => {
                      const plans = e.target.value
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((line) => {
                          const parts = line.split('|');
                          return {
                            name: parts[0] || 'پلن',
                            price: parts[1] || 'رایگان',
                            features: (parts[2] || '').split(/[،,]/).map((f) => f.trim()).filter(Boolean),
                            highlight: (parts[3] || '').trim() === 'yes'
                          };
                        });
                      updateCustomProps({ plans });
                    }}
                    placeholder={'پایه|رایگان|۱ نوشته\nحرفه‌ای|۱۵۰۰۰۰۰|۱۰ نوشته،پشتیبانی|yes'}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 leading-relaxed"
                  />
                </div>
              )}

              {/* نظر کاربر */}
              {selectedWidget.type === 'testimonial' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">متن نظر</label>
                    <textarea
                      rows={3}
                      value={selectedWidget.content}
                      onChange={(e) => onUpdateWidget({ ...selectedWidget, content: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">نام کاربر</label>
                      <input
                        type="text"
                        value={customProps.author || ''}
                        onChange={(e) => updateCustomProps({ author: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">نقش کاربر</label>
                      <input
                        type="text"
                        value={customProps.role || ''}
                        onChange={(e) => updateCustomProps({ role: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* کال‌اوت / آیکون — انتخاب آیکون */}
              {(selectedWidget.type === 'callout' || selectedWidget.type === 'icon') && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">آیکون</label>
                  <select
                    value={selectedWidget.iconName || 'info'}
                    onChange={(e) => onUpdateWidget({ ...selectedWidget, iconName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    {ICON_CHOICES.map((ic) => (
                      <option key={ic} value={ic}>{ic}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedWidget.type === 'callout' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">متن کال‌اوت</label>
                  <textarea
                    rows={3}
                    value={selectedWidget.content}
                    onChange={(e) => onUpdateWidget({ ...selectedWidget, content: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
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
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
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

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            نحوه باز شدن اطلاعیه با کلیک
                          </label>
                          <select
                            value={selectedWidget.settings.binding.openMode || 'self'}
                            onChange={(e) => handleBindingChange('openMode', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                          >
                            <option value="self">در صفحه جاری</option>
                            <option value="new">در صفحه جدید (تب جدید)</option>
                            <option value="modal">در پنجره modal</option>
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
                  <div className="flex items-center gap-1.5">
                    <ColorBox
                      value={selectedWidget.settings.style.backgroundColor}
                      onChange={(color) => handleStyleChange('backgroundColor', color)}
                      className="flex-1 min-w-0 h-9"
                    />
                    <button
                      type="button"
                      title="حذف رنگ پس‌زمینه"
                      onClick={() => handleStyleChange('backgroundColor', undefined)}
                      className="px-2 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer shrink-0"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>

              {/* Widget Background Gradient — colorpicker with stops + angle */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  گرادیان پس‌زمینه ویجت (اختیاری)
                </label>
                {selectedWidget.settings.style.backgroundGradient ? (
                  <>
                    <GradientPicker
                      value={selectedWidget.settings.style.backgroundGradient}
                      onChange={(css) => handleStyleChange('backgroundGradient', css)}
                    />
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleStyleChange('backgroundGradient', undefined)}
                        className="px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                      >
                        حذف گرادیان
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { label: 'تیره', value: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' },
                      { label: 'آبی تیره', value: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)' },
                      { label: 'سرمه‌ای', value: 'linear-gradient(135deg, #0f766e 0%, #1e1b4b 100%)' },
                      { label: 'نقره‌ای', value: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleStyleChange('backgroundGradient', preset.value)}
                        className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition-all cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                )}
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
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

              {/* ── تنظیمات لایه (هم‌سطح slider-studio) ── */}

              {/* Typography extras for text-like widgets */}
              {(selectedWidget.type === 'text' || selectedWidget.type === 'heading' || selectedWidget.type === 'richtext' || selectedWidget.type === 'button') && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">نام فونت</label>
                    <select
                      value={selectedWidget.settings.style.fontFamily || 'Vazirmatn, sans-serif'}
                      onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="Vazirmatn, sans-serif">وزیرمتن (فارسی)</option>
                      <option value="Poppins, sans-serif">Poppins</option>
                      <option value="Inter, sans-serif">Inter</option>
                      <option value="Impact, sans-serif">Impact (برجسته)</option>
                      <option value="Allemand, serif">Allemand</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">فاصله خط (Line Height)</label>
                      <input
                        type="number"
                        step={0.1}
                        min={0.5}
                        max={3}
                        value={typeof selectedWidget.settings.style.lineHeight === 'number' ? selectedWidget.settings.style.lineHeight : 1.6}
                        onChange={(e) => handleStyleChange('lineHeight', parseFloat(e.target.value) || 1.6)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">فاصله حروف (px)</label>
                      <input
                        type="number"
                        value={selectedWidget.settings.style.letterSpacing || 0}
                        onChange={(e) => handleStyleChange('letterSpacing', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">حالت حروف</label>
                    <select
                      value={selectedWidget.settings.style.textTransform || 'none'}
                      onChange={(e) => handleStyleChange('textTransform', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="none">عادی</option>
                      <option value="uppercase">بزرگ (UPPERCASE)</option>
                      <option value="lowercase">کوچک (lowercase)</option>
                      <option value="capitalize">اول حرف بزرگ</option>
                    </select>
                  </div>
                </>
              )}

              {/* Padding — all sides */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">پدینگ بالا (px)</label>
                  <input
                    type="number"
                    min={0}
                    value={selectedWidget.settings.style.paddingTop || 0}
                    onChange={(e) => handleStyleChange('paddingTop', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">پدینگ پایین (px)</label>
                  <input
                    type="number"
                    min={0}
                    value={selectedWidget.settings.style.paddingBottom || 0}
                    onChange={(e) => handleStyleChange('paddingBottom', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">پدینگ راست (px)</label>
                  <input
                    type="number"
                    min={0}
                    value={selectedWidget.settings.style.paddingRight || 0}
                    onChange={(e) => handleStyleChange('paddingRight', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">پدینگ چپ (px)</label>
                  <input
                    type="number"
                    min={0}
                    value={selectedWidget.settings.style.paddingLeft || 0}
                    onChange={(e) => handleStyleChange('paddingLeft', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Per-corner border radius — Photoshop style */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">شعاع گوشه‌ها (px) — مانند فتوشاپ</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 block">بالا راست</label>
                    <input
                      type="number"
                      min={0}
                      value={selectedWidget.settings.style.borderRadiusTopRight || 0}
                      onChange={(e) => handleStyleChange('borderRadiusTopRight', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 block">بالا چپ</label>
                    <input
                      type="number"
                      min={0}
                      value={selectedWidget.settings.style.borderRadiusTopLeft || 0}
                      onChange={(e) => handleStyleChange('borderRadiusTopLeft', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 block">پایین راست</label>
                    <input
                      type="number"
                      min={0}
                      value={selectedWidget.settings.style.borderRadiusBottomRight || 0}
                      onChange={(e) => handleStyleChange('borderRadiusBottomRight', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400 block">پایین چپ</label>
                    <input
                      type="number"
                      min={0}
                      value={selectedWidget.settings.style.borderRadiusBottomLeft || 0}
                      onChange={(e) => handleStyleChange('borderRadiusBottomLeft', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Border — width / style / color */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">ضخامت خط دور (px)</label>
                  <input
                    type="number"
                    min={0}
                    value={selectedWidget.settings.style.borderWidth || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const updates: Partial<WidgetStyle> = { borderWidth: val };
                      if (val > 0 && (!selectedWidget.settings.style.borderColor || selectedWidget.settings.style.borderColor === 'transparent')) {
                        updates.borderColor = '#ffffff';
                      }
                      handleStyleChange('borderWidth', updates.borderWidth);
                      if (updates.borderColor) handleStyleChange('borderColor', updates.borderColor);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">نوع خط</label>
                  <select
                    value={selectedWidget.settings.style.borderStyle || 'solid'}
                    onChange={(e) => handleStyleChange('borderStyle', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="solid">توپر (Solid)</option>
                    <option value="dashed">خط‌چین (Dashed)</option>
                    <option value="dotted">نقطه‌چین (Dotted)</option>
                    <option value="none">بدون خط</option>
                  </select>
                </div>
              </div>
              {(selectedWidget.settings.style.borderWidth || 0) > 0 && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">رنگ خط دور</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={!selectedWidget.settings.style.borderColor || selectedWidget.settings.style.borderColor === 'transparent' ? '#0f172a' : selectedWidget.settings.style.borderColor}
                      onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
                    />
                    <input
                      type="text"
                      value={selectedWidget.settings.style.borderColor ?? 'transparent'}
                      onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              )}

              {/* Shadow */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">سایه</label>
                <select
                  value={(() => {
                    const s = selectedWidget.settings.style.shadow;
                    if (!s || s === 'none') return 'none';
                    if (s === SHADOW_SM) return 'soft';
                    if (s === SHADOW_MD) return 'medium';
                    if (s === SHADOW_LG) return 'hard';
                    return 'custom';
                  })()}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'none') handleStyleChange('shadow', 'none');
                    else if (val === 'soft') handleStyleChange('shadow', SHADOW_SM);
                    else if (val === 'medium') handleStyleChange('shadow', SHADOW_MD);
                    else if (val === 'hard') handleStyleChange('shadow', SHADOW_LG);
                    else if (val === 'custom') handleStyleChange('shadow', '0 0 15px rgba(59,130,246,0.5)');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="none">بدون سایه</option>
                  <option value="soft">نرم (Soft)</option>
                  <option value="medium">متوسط (Medium)</option>
                  <option value="hard">سخت (Hard)</option>
                  <option value="custom">سفارشی</option>
                </select>
                {selectedWidget.settings.style.shadow && selectedWidget.settings.style.shadow !== 'none' && (
                  <input
                    type="text"
                    dir="ltr"
                    value={selectedWidget.settings.style.shadow}
                    onChange={(e) => handleStyleChange('shadow', e.target.value || 'none')}
                    placeholder="مثال: 0 0 15px rgba(59,130,246,0.5)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                )}
              </div>

              {/* Background opacity + preview swatch */}
              {(selectedWidget.settings.style.backgroundColor || selectedWidget.settings.style.backgroundGradient) && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    شفافیت پس‌زمینه: {selectedWidget.settings.style.backgroundOpacity ?? 100}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={selectedWidget.settings.style.backgroundOpacity ?? 100}
                    onChange={(e) => handleStyleChange('backgroundOpacity', Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-teal-600"
                  />
                  <div
                    className="w-full h-8 rounded-xl border border-gray-300 dark:border-slate-700"
                    style={{
                      background: selectedWidget.settings.style.backgroundGradient || selectedWidget.settings.style.backgroundColor || 'transparent',
                      opacity: (selectedWidget.settings.style.backgroundOpacity ?? 100) / 100
                    }}
                  />
                </div>
              )}

              {/* Object fit — image only */}
              {selectedWidget.type === 'image' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">حالت نمایش تصویر (Object Fit)</label>
                    <select
                      value={selectedWidget.settings.style.objectFit || 'cover'}
                      onChange={(e) => handleStyleChange('objectFit', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="cover">پوشش کامل (Cover)</option>
                      <option value="contain">درون قاب (Contain)</option>
                      <option value="fill">کشیده (Fill)</option>
                      <option value="none">حجم اصلی (None)</option>
                      <option value="scale-down">کوچک‌تر (Scale-down)</option>
                    </select>
                  </div>

                  {/* کادر تصویر — مستطیل/گوشه‌گرد/مربع/دایره (روی خود تصویر اعمال می‌شود) */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">شکل تصویر (کادر قاب)</label>
                    <select
                      value={selectedWidget.settings.style.imageFrame || ''}
                      onChange={(e) => handleStyleChange('imageFrame', e.target.value || undefined)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="">خودکار / مستطیل</option>
                      <option value="rounded">گوشه‌گرد</option>
                      <option value="square">مربع</option>
                      <option value="circle">دایره</option>
                    </select>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">شعاع گوشه‌ها روی خود تصویر اعمال می‌شود (نه روی بلوک)</p>
                  </div>
                </>
              )}

              {/* Button — full width */}
              {selectedWidget.type === 'button' && (
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedWidget.settings.style.fullWidth === true}
                    onChange={(e) => handleStyleChange('fullWidth', e.target.checked)}
                    className="accent-teal-600 w-4 h-4"
                  />
                  تمام‌عرض (کشیدن دکمه به کل ستون)
                </label>
              )}

              {/* Max width */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">حداکثر عرض ویجت (px) — خالی = خودکار</label>
                <input
                  type="number"
                  min={0}
                  value={selectedWidget.settings.style.maxWidth || ''}
                  onChange={(e) => handleStyleChange('maxWidth', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
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

      {/* انتخاب تصویر از مدیریت رسانه — ویجت تصویر و پوستر ویدیو */}
      <MediaManager
        open={mediaPickerTarget === 'widgetImage'}
        onClose={() => setMediaPickerTarget(null)}
        filter="image"
        title="انتخاب تصویر"
        onSelect={(url) => {
          onUpdateWidget({ ...selectedWidget, imageUrl: url });
          setMediaPickerTarget(null);
        }}
      />
      <MediaManager
        open={mediaPickerTarget === 'videoPoster'}
        onClose={() => setMediaPickerTarget(null)}
        filter="image"
        title="انتخاب تصویر پوستر ویدیو"
        onSelect={(url) => {
          handleStyleChange('videoPoster', url);
          setMediaPickerTarget(null);
        }}
      />

      {/* انتخابگر آیکون — متن و دکمه */}
      <IconPicker
        open={iconPickerState.open}
        onClose={() => setIconPickerState({ open: false, mode: iconPickerState.mode })}
        title={
          iconPickerState.mode === 'button'
            ? 'انتخاب آیکون دکمه'
            : iconPickerState.mode === 'richtext'
              ? 'انتخاب آیکون متن (ویرایشگر غنی)'
              : 'انتخاب آیکون متن'
        }
        value={iconPickerState.mode === 'button' ? selectedWidget.iconName : undefined}
        onSelect={
          iconPickerState.mode === 'button'
            ? selectButtonIcon
            : iconPickerState.mode === 'richtext'
              ? insertRichtextIcon
              : insertIconToken
        }
      />
      </>
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
            <div className="text-[10px] text-slate-400 truncate">{selectedSection.name}</div>
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
                الگوی چیدمان ستون‌ها ({activeBreakpoint === 'mobile' ? 'موبایل' : activeBreakpoint === 'tablet' ? 'تبلت' : 'دسکتاپ'})
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

              {onUpdateColumnWidth && (
                <>
                  <div className="pt-2 mt-2 border-t border-gray-100 dark:border-slate-800/60">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        عرض ستون‌ها در هر دستگاه (Responsive)
                      </label>
                      <div className="flex items-center gap-1">
                        {([
                          { bp: 'desktop' as Breakpoint, label: 'دسکتاپ', Icon: Monitor },
                          { bp: 'tablet' as Breakpoint, label: 'تبلت', Icon: Tablet },
                          { bp: 'mobile' as Breakpoint, label: 'موبایل', Icon: Smartphone }
                        ]).map(({ bp, label, Icon }) => (
                          <button
                            key={bp}
                            type="button"
                            onClick={() => setColBp(bp)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                              colBp === bp
                                ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/40'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 pt-1">
                    {selectedSection.columns.map((col, idx) => {
                      const current = getColumnWidth(col, colBp);
                      return (
                        <div key={col.id} className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 w-14 shrink-0">ستون {idx + 1}</span>
                          <input
                            type="range"
                            min={1}
                            max={12}
                            value={current}
                            onChange={(e) => onUpdateColumnWidth(selectedSection.id, col.id, colBp, Number(e.target.value))}
                            className="flex-1 accent-teal-600 cursor-pointer"
                          />
                          <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 w-8 text-center">{current}</span>
                        </div>
                      );
                    })}
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                      در موبایل به‌صورت پیش‌فرض همه ستون‌ها تمام‌عرض (تک‌ستونه) می‌شوند؛ این مقدار را می‌توانید تغییر دهید.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">رنگ پس‌زمینه سکشن</label>
            <div className="flex items-center gap-1.5">
              <ColorBox
                value={selectedSection.backgroundColor}
                onChange={(color) => onUpdateSection({ ...selectedSection, backgroundColor: color })}
                className="flex-1 min-w-0 h-9"
              />
              <button
                type="button"
                title="حذف رنگ پس‌زمینه سکشن"
                onClick={() => onUpdateSection({ ...selectedSection, backgroundColor: undefined })}
                className="px-2 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer shrink-0"
              >
                حذف
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              گرادیان پس‌زمینه (اختیاری — جایگزین رنگ ساده می‌شود)
            </label>
            {selectedSection.backgroundGradient ? (
              <>
                <GradientPicker
                  value={selectedSection.backgroundGradient}
                  onChange={(css) => onUpdateSection({ ...selectedSection, backgroundGradient: css })}
                />
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => onUpdateSection({ ...selectedSection, backgroundGradient: undefined })}
                    className="px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                  >
                    حذف گرادیان
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { label: 'تیره', value: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' },
                  { label: 'آبی تیره', value: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)' },
                  { label: 'سرمه‌ای', value: 'linear-gradient(135deg, #0f766e 0%, #1e1b4b 100%)' },
                  { label: 'نقرهای', value: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => onUpdateSection({ ...selectedSection, backgroundGradient: preset.value })}
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition-all cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* شفافیت پس‌زمینه سکشن (رنگ یا گرادیان) */}
          {(selectedSection.backgroundColor || selectedSection.backgroundGradient) && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                شفافیت پس‌زمینه سکشن: {selectedSection.backgroundOpacity ?? 100}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={selectedSection.backgroundOpacity ?? 100}
                onChange={(e) => onUpdateSection({ ...selectedSection, backgroundOpacity: Number(e.target.value) })}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-teal-600"
              />
              <div
                className="w-full h-8 rounded-xl border border-gray-300 dark:border-slate-700"
                style={{
                  background: selectedSection.backgroundGradient || selectedSection.backgroundColor || 'transparent',
                  opacity: (selectedSection.backgroundOpacity ?? 100) / 100
                }}
              />
            </div>
          )}

          {/* تصویر پس‌زمینه سکشن (به همراه position/size/repeat) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              تصویر پس‌زمینه سکشن (اختیاری)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                dir="ltr"
                placeholder="https://... یا انتخاب از رسانه"
                value={selectedSection.backgroundImage || ''}
                onChange={(e) => onUpdateSection({ ...selectedSection, backgroundImage: e.target.value || undefined })}
                className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setMediaPickerTarget('sectionBg')}
                className="shrink-0 p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500 hover:text-white transition-all cursor-pointer"
                title="انتخاب از مدیریت رسانه"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              {selectedSection.backgroundImage && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSection({
                      ...selectedSection,
                      backgroundImage: undefined,
                      backgroundPosition: undefined,
                      backgroundSize: undefined,
                      backgroundRepeat: undefined
                    })
                  }
                  className="shrink-0 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                  title="حذف تصویر پس‌زمینه"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {selectedSection.backgroundImage && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block">موقعیت (Position)</label>
                  <select
                    value={selectedSection.backgroundPosition || 'center'}
                    onChange={(e) => onUpdateSection({ ...selectedSection, backgroundPosition: e.target.value })}
                    className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="center">وسط (center)</option>
                    <option value="top">بالا (top)</option>
                    <option value="bottom">پایین (bottom)</option>
                    <option value="left">چپ (left)</option>
                    <option value="right">راست (right)</option>
                    <option value="top left">بالا چپ</option>
                    <option value="top right">بالا راست</option>
                    <option value="bottom left">پایین چپ</option>
                    <option value="bottom right">پایین راست</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block">اندازه (Size)</label>
                  <select
                    value={selectedSection.backgroundSize || 'cover'}
                    onChange={(e) => onUpdateSection({ ...selectedSection, backgroundSize: e.target.value })}
                    className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="cover">پوشش کامل (cover)</option>
                    <option value="contain">درون قاب (contain)</option>
                    <option value="auto">خودکار (auto)</option>
                    <option value="100% 100%">کشیدن کامل (100% 100%)</option>
                    <option value="50%">نصف عرض (50%)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block">تکرار (Repeat)</label>
                  <select
                    value={selectedSection.backgroundRepeat || 'no-repeat'}
                    onChange={(e) => onUpdateSection({ ...selectedSection, backgroundRepeat: e.target.value })}
                    className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="no-repeat">بدون تکرار</option>
                    <option value="repeat">تکرار کامل</option>
                    <option value="repeat-x">تکرار افقی</option>
                    <option value="repeat-y">تکرار عمودی</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block">پیش‌نمایش</label>
                  <div
                    className="w-full h-10 rounded-xl border border-gray-200 dark:border-slate-800"
                    style={{
                      backgroundImage: `url("${selectedSection.backgroundImage}")`,
                      backgroundPosition: selectedSection.backgroundPosition || 'center',
                      backgroundSize: selectedSection.backgroundSize || 'cover',
                      backgroundRepeat: selectedSection.backgroundRepeat || 'no-repeat'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* نشانک سکشن (Bookmark) — برای لینک‌های #anchor */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <BookmarkIcon className="w-3.5 h-3.5" />
              نشانک سکشن (Bookmark)
            </label>
            <input
              type="text"
              dir="ltr"
              placeholder="services — بدون # (برای لینک #services)"
              value={selectedSection.bookmark || ''}
              onChange={(e) => onUpdateSection({ ...selectedSection, bookmark: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 placeholder:text-slate-400"
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
              با تعیین نشانک، دکمه‌ها و لینک‌های دارای <span dir="ltr">href="#نشانک"</span> به این سکشن اسکرول می‌کنند.
            </p>
          </div>

          {/* شعاع گوشه‌های سکشن — مانند فتوشاپ (TL/TR/BL/BR) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              شعاع گوشه‌های سکشن (px)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 block">بالا راست</label>
                <input
                  type="number"
                  min={0}
                  value={selectedSection.borderRadius?.topRight ?? 0}
                  onChange={(e) =>
                    onUpdateSection({
                      ...selectedSection,
                      borderRadius: {
                        ...selectedSection.borderRadius,
                        topRight: parseInt(e.target.value) || 0
                      }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 block">بالا چپ</label>
                <input
                  type="number"
                  min={0}
                  value={selectedSection.borderRadius?.topLeft ?? 0}
                  onChange={(e) =>
                    onUpdateSection({
                      ...selectedSection,
                      borderRadius: {
                        ...selectedSection.borderRadius,
                        topLeft: parseInt(e.target.value) || 0
                      }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 block">پایین راست</label>
                <input
                  type="number"
                  min={0}
                  value={selectedSection.borderRadius?.bottomRight ?? 0}
                  onChange={(e) =>
                    onUpdateSection({
                      ...selectedSection,
                      borderRadius: {
                        ...selectedSection.borderRadius,
                        bottomRight: parseInt(e.target.value) || 0
                      }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 block">پایین چپ</label>
                <input
                  type="number"
                  min={0}
                  value={selectedSection.borderRadius?.bottomLeft ?? 0}
                  onChange={(e) =>
                    onUpdateSection({
                      ...selectedSection,
                      borderRadius: {
                        ...selectedSection.borderRadius,
                        bottomLeft: parseInt(e.target.value) || 0
                      }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* موقعیت و لایهٔ سکشن — fixed/sticky/relative + z-index */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">موقعیت سکشن</label>
              <select
                value={selectedSection.position || 'static'}
                onChange={(e) =>
                  onUpdateSection({
                    ...selectedSection,
                    position: (e.target.value || 'static') as SectionInstance['position']
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              >
                <option value="static">معمولی (static)</option>
                <option value="relative">نسبی (relative)</option>
                <option value="sticky">چسبان (sticky)</option>
                <option value="fixed">ثابت (fixed)</option>
              </select>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                چسبان/ثابت: سکشن هنگام اسکرول بالای صفحه می‌ماند (مانند نوار راهبری).
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">لایه (z-index)</label>
              <input
                type="number"
                min={0}
                value={selectedSection.zIndex ?? ''}
                placeholder="خودکار"
                onChange={(e) =>
                  onUpdateSection({
                    ...selectedSection,
                    zIndex: e.target.value === '' ? undefined : parseInt(e.target.value) || 0
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 placeholder:text-slate-400"
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                مقدار بالاتر = روی سکشن‌های دیگر قرار می‌گیرد.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">پدینگ بالا (px)</label>
              <input
                type="number"
                value={selectedSection.paddingTop}
                onChange={(e) => onUpdateSection({ ...selectedSection, paddingTop: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">پدینگ پایین (px)</label>
              <input
                type="number"
                value={selectedSection.paddingBottom}
                onChange={(e) => onUpdateSection({ ...selectedSection, paddingBottom: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <MediaManager
            open={mediaPickerTarget === 'sectionBg'}
            onClose={() => setMediaPickerTarget(null)}
            filter="image"
            title="انتخاب تصویر پس‌زمینه سکشن"
            onSelect={(url) => {
              onUpdateSection({ ...selectedSection, backgroundImage: url });
              setMediaPickerTarget(null);
            }}
          />
        </div>
      </div>
    );
  }

  return null;
};
