import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  LayoutGrid,
  Sparkles,
  Link as LinkIcon,
  Columns,
  Code,
  FileText,
  Check,
  Move,
  Eye,
  Sliders,
  GripVertical,
  GripHorizontal,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Info,
  Megaphone,
  Sun,
  Moon,
  ExternalLink
} from 'lucide-react';
import { NavigationItem, MegaMenuConfig, MegaMenuColumn, MegaMenuLinkItem } from './types';

interface MegaMenuDesignerModalProps {
  item: NavigationItem;
  onSave: (updatedItem: NavigationItem) => void;
  onClose: () => void;
}

export const MegaMenuDesignerModal: React.FC<MegaMenuDesignerModalProps> = ({
  item,
  onSave,
  onClose
}) => {
  const defaultConfig: MegaMenuConfig = item.megaMenuConfig || {
    columnsCount: 3,
    columns: [
      {
        id: 'col_1',
        title: 'دستورالعمل‌ها و دسترسی سریع',
        type: 'links',
        widthSpan: 4,
        links: [
          { id: 'l1', title: 'راهنمای پذیرش و ثبت‌نام', url: '/admissions', description: 'شرایط ثبت‌نام ورودی‌های جدید' },
          { id: 'l2', title: 'سامانه آموزش (سما)', url: '/edu-portal', description: 'انتخاب واحد و دریافت کارنامه' },
          { id: 'l3', title: 'تقویم نیمسال تحصیلی', url: '/calendar', description: 'زمان‌بندی امتحانات و تعطیلات' }
        ]
      },
      {
        id: 'col_2',
        title: 'پژوهش و فناوری',
        type: 'links',
        widthSpan: 4,
        links: [
          { id: 'l4', title: 'آزمایشگاه مرکزی و نانو', url: '/labs', description: 'تجهیزات و رزرو نوبت آنالیز' },
          { id: 'l5', title: 'مجلات و نشریات ISI', url: '/journals', description: 'ارسال مقاله و داوری علمی' },
          { id: 'l6', title: 'گرنت‌ها و تسهیلات پژوهشی', url: '/grants', description: 'حمایت مالی از طرح‌های برتر' }
        ]
      },
      {
        id: 'col_3',
        title: 'رویداد و همایش ویژه',
        type: 'image',
        widthSpan: 4,
        imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80',
        imageAlt: 'تصویر همایش بین‌المللی',
        imageCaption: 'ثبت‌نام بیست‌وهشتمین کنفرانس بین‌المللی AI و نانوفناوری'
      }
    ]
  };

  const [columns, setColumns] = useState<MegaMenuColumn[]>(defaultConfig.columns);
  const [selectedColId, setSelectedColId] = useState<string>(defaultConfig.columns[0]?.id || '');

  // Theme mode simulation for live website preview
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');

  // DnD state for Columns (used strictly in Section 1 ordering cards)
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);
  const [dragOverColIndex, setDragOverColIndex] = useState<number | null>(null);

  // DnD state for Links inside active column editor
  const [draggedLinkIndex, setDraggedLinkIndex] = useState<number | null>(null);
  const [dragOverLinkIndex, setDragOverLinkIndex] = useState<number | null>(null);

  const activeColumn = columns.find(c => c.id === selectedColId) || columns[0];

  // --- Column Operations ---
  const handleAddColumn = () => {
    if (columns.length >= 6) return;
    const newCol: MegaMenuColumn = {
      id: `col_${Date.now()}`,
      title: `ستون ${columns.length + 1}: موضوع جدید`,
      type: 'links',
      widthSpan: 4,
      links: [
        { id: `l_${Date.now()}`, title: 'عنوان لینک جدید', url: '/' }
      ]
    };
    setColumns([...columns, newCol]);
    setSelectedColId(newCol.id);
  };

  const handleRemoveColumn = (colId: string) => {
    if (columns.length <= 1) return;
    const updated = columns.filter(c => c.id !== colId);
    setColumns(updated);
    if (selectedColId === colId) {
      setSelectedColId(updated[0].id);
    }
  };

  // Reorder column shift (Left / Right)
  const handleMoveColumnShift = (index: number, direction: 'left' | 'right') => {
    // In RTL layout: 'right' means moving to earlier index (-1), 'left' means moving to later index (+1)
    const targetIndex = direction === 'right' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= columns.length) return;
    const updated = [...columns];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setColumns(updated);
  };

  // Drag and Drop for Columns (Section 1 Cards)
  const handleColDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleColDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColIndex !== index) {
      setDragOverColIndex(index);
    }
  };

  const handleColDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedColIndex === null || draggedColIndex === targetIndex) {
      setDraggedColIndex(null);
      setDragOverColIndex(null);
      return;
    }
    const updated = [...columns];
    const [moved] = updated.splice(draggedColIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setColumns(updated);
    setDraggedColIndex(null);
    setDragOverColIndex(null);
  };

  const handleColDragEnd = () => {
    setDraggedColIndex(null);
    setDragOverColIndex(null);
  };

  // --- Link Operations within Active Column ---
  const handleUpdateActiveColumn = (updated: Partial<MegaMenuColumn>) => {
    setColumns(
      columns.map(col => (col.id === activeColumn.id ? { ...col, ...updated } : col))
    );
  };

  const handleAddLinkToColumn = () => {
    if (!activeColumn) return;
    const newLink: MegaMenuLinkItem = {
      id: `m_link_${Date.now()}`,
      title: 'عنوان لینک جدید',
      url: '/page'
    };
    const updatedLinks = [...(activeColumn.links || []), newLink];
    handleUpdateActiveColumn({ links: updatedLinks });
  };

  const handleRemoveLinkFromColumn = (linkId: string) => {
    if (!activeColumn) return;
    const updatedLinks = (activeColumn.links || []).filter(l => l.id !== linkId);
    handleUpdateActiveColumn({ links: updatedLinks });
  };

  // Link Reorder (Up / Down)
  const handleMoveLinkShift = (index: number, direction: 'up' | 'down') => {
    if (!activeColumn || !activeColumn.links) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeColumn.links.length) return;
    const updatedLinks = [...activeColumn.links];
    const [moved] = updatedLinks.splice(index, 1);
    updatedLinks.splice(targetIndex, 0, moved);
    handleUpdateActiveColumn({ links: updatedLinks });
  };

  // Link DnD
  const handleLinkDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation();
    setDraggedLinkIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleLinkDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverLinkIndex !== index) {
      setDragOverLinkIndex(index);
    }
  };

  const handleLinkDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeColumn || !activeColumn.links || draggedLinkIndex === null || draggedLinkIndex === targetIndex) {
      setDraggedLinkIndex(null);
      setDragOverLinkIndex(null);
      return;
    }
    const updatedLinks = [...activeColumn.links];
    const [moved] = updatedLinks.splice(draggedLinkIndex, 1);
    updatedLinks.splice(targetIndex, 0, moved);
    handleUpdateActiveColumn({ links: updatedLinks });
    setDraggedLinkIndex(null);
    setDragOverLinkIndex(null);
  };

  // Save changes
  const handleSaveMegaMenu = () => {
    const updatedConfig: MegaMenuConfig = {
      columnsCount: columns.length,
      columns
    };

    onSave({
      ...item,
      displayType: 'mega_menu',
      megaMenuConfig: updatedConfig
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans text-right" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center shadow-inner">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                طراح و چیدمان بصری مگا منو: <span className="text-teal-600 dark:text-teal-400">{item.title}</span>
              </h3>
              <p className="text-xs text-slate-500">
                تنظیم ترتیب ستون‌ها با کشیدن و رها کردن (Drag & Drop) و مشاهده پیش‌نمایش دقیق خروجی وب‌سایت
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Top Bar Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Columns className="w-4 h-4 text-teal-600" />
              <span className="font-bold text-slate-800 dark:text-slate-200">تعداد ستون‌های فعال:</span>
              <span className="px-3 py-1 rounded-xl bg-teal-600 text-white font-extrabold shadow-sm">
                {columns.length} ستون
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddColumn}
                disabled={columns.length >= 6}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> افزودن ستون جدید
              </button>
            </div>
          </div>

          {/* SECTION 1: COLUMN CARDS WITH DnD */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <GripHorizontal className="w-4 h-4 text-teal-600" />
                مدیریت و چیدمان ترتیب ستون‌ها (Drag & Drop):
              </label>
              <span className="text-[11px] text-slate-400">
                (آیکون ۶ نقطه را بکشید یا از دکمه‌های فلش برای تغییر ترتیب استفاده کنید)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {columns.map((col, idx) => {
                const isSelected = col.id === activeColumn?.id;
                const isDragging = draggedColIndex === idx;
                const isDragOver = dragOverColIndex === idx;

                return (
                  <div
                    key={col.id}
                    draggable
                    onDragStart={e => handleColDragStart(e, idx)}
                    onDragOver={e => handleColDragOver(e, idx)}
                    onDrop={e => handleColDrop(e, idx)}
                    onDragEnd={handleColDragEnd}
                    onClick={() => setSelectedColId(col.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all space-y-2 relative group ${
                      isDragging
                        ? 'opacity-40 border-dashed border-teal-500 bg-teal-50 dark:bg-teal-950/30'
                        : isDragOver
                        ? 'border-2 border-teal-600 bg-teal-100 dark:bg-teal-900/80 scale-105 shadow-xl'
                        : isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/70 border-teal-500 shadow-md ring-2 ring-teal-500/30'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {/* Column Drag Handle & Shift Buttons */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-100 dark:border-slate-700/60 pb-1.5">
                      <div className="flex items-center gap-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-teal-600">
                        <GripVertical className="w-4 h-4" />
                        <span className="font-mono text-[10px] font-bold">ستون {idx + 1}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Shift Right (earlier index in RTL) */}
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleMoveColumnShift(idx, 'right');
                          }}
                          disabled={idx === 0}
                          className="p-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-teal-600 hover:text-white disabled:opacity-30 transition-colors"
                          title="انتقال به راست"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        {/* Shift Left (later index in RTL) */}
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleMoveColumnShift(idx, 'left');
                          }}
                          disabled={idx === columns.length - 1}
                          className="p-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-teal-600 hover:text-white disabled:opacity-30 transition-colors"
                          title="انتقال به چپ"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>

                        {columns.length > 1 && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleRemoveColumn(col.id);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-red-500 transition-colors"
                            title="حذف ستون"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="font-extrabold text-slate-900 dark:text-white truncate text-[11px]">
                      {col.title || `ستون ${idx + 1}`}
                    </div>

                    <div className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-lg text-center font-bold">
                      {col.type === 'links'
                        ? '📄 گروه لینک‌ها'
                        : col.type === 'image'
                        ? '🖼️ تصویر شاخص'
                        : col.type === 'banner'
                        ? '📣 بنر تبلیغاتی'
                        : col.type === 'html'
                        ? '💻 بلاک HTML'
                        : '📰 ویجت محتوایی'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: CLEAN READ-ONLY WEBSITE OUTPUT PREVIEW (EXACT SITE STYLE, NO DnD) */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                  پیش‌نمایش خروجی وب‌سایت (Website Output Preview)
                </h4>
                <span className="text-[10px] text-slate-500">
                  — نمایش دقیق و خالص مگامنو مطابق با ظاهر نهایی در وب‌سایت
                </span>
              </div>

              {/* Theme Toggle for Preview */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setPreviewTheme('light')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                    previewTheme === 'light'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" /> پوسته روشن
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTheme('dark')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                    previewTheme === 'dark'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" /> پوسته تاریک
                </button>
              </div>
            </div>

            {/* Simulated Website Frame */}
            <div className={`rounded-3xl border shadow-xl overflow-hidden transition-all duration-300 ${
              previewTheme === 'dark'
                ? 'bg-slate-950 border-slate-800 text-slate-100'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              {/* Simulated Browser Address Bar */}
              <div className={`px-4 py-2 border-b flex items-center justify-between text-[11px] font-mono ${
                previewTheme === 'dark'
                  ? 'bg-slate-900 border-slate-800 text-slate-400'
                  : 'bg-slate-200/70 border-slate-200 text-slate-600'
              }`}>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                  </div>
                  <span className="dir-ltr text-[10px] font-sans">https://portal.university.edu</span>
                </div>
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
                  پیش‌نمایش زنده وب‌سایت
                </span>
              </div>

              {/* Simulated Website Header Navbar */}
              <div className={`px-6 py-4 border-b relative z-10 flex items-center justify-between ${
                previewTheme === 'dark'
                  ? 'bg-slate-900/90 border-slate-800'
                  : 'bg-white border-slate-200'
              }`}>
                {/* Brand */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black shadow-md text-xs">
                    CMS
                  </div>
                  <div>
                    <span className="font-black text-xs block">دانشگاه بین‌المللی علوم و فناوری</span>
                    <span className="text-[9px] text-slate-400 block">International Portal</span>
                  </div>
                </div>

                {/* Navbar Items Simulation */}
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                    صفحه اصلی
                  </span>

                  {/* Active Item with Chevron */}
                  <div className="relative">
                    <span className="px-3.5 py-2 rounded-xl text-xs font-black bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1.5 shadow-sm">
                      <span>{item.title}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    </span>
                  </div>

                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                    خدمات الکترونیک
                  </span>
                  <span className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                    ارتباط با ما
                  </span>
                </div>
              </div>

              {/* PURE WEBSITE OUTPUT MEGA MENU DROPDOWN PANEL (READ-ONLY) */}
              <div className="p-6 md:p-8">
                <div className={`rounded-3xl p-6 shadow-2xl border transition-all ${
                  previewTheme === 'dark'
                    ? 'bg-slate-900 border-slate-700 text-slate-100'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                    {columns.map(col => (
                      <div key={col.id} className="space-y-3">
                        {/* Header Title */}
                        <h4 className="font-extrabold text-xs text-teal-700 dark:text-teal-400 border-b pb-2 border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <span>{col.title}</span>
                        </h4>

                        {/* Render Links Group */}
                        {col.type === 'links' && (
                          <div className="space-y-1.5">
                            {(col.links || []).map(link => (
                              <a
                                key={link.id}
                                href={link.url}
                                onClick={e => e.preventDefault()}
                                className={`block p-2.5 rounded-xl transition-all group border ${
                                  previewTheme === 'dark'
                                    ? 'border-slate-800/80 hover:bg-slate-800 hover:border-slate-700'
                                    : 'border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                                }`}
                              >
                                <div className="font-bold text-[11px] flex items-center justify-between text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-300">
                                  <span>{link.title}</span>
                                  {link.badge && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black bg-red-500 text-white">
                                      {link.badge}
                                    </span>
                                  )}
                                </div>
                                {link.description && (
                                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                                    {link.description}
                                  </p>
                                )}
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Render Featured Image */}
                        {col.type === 'image' && col.imageUrl && (
                          <div className="space-y-2">
                            <div className="h-32 rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700 relative group">
                              <img
                                src={col.imageUrl}
                                alt={col.imageAlt || 'Banner'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            {col.imageCaption && (
                              <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 text-center leading-snug">
                                {col.imageCaption}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Render Promotional Banner */}
                        {col.type === 'banner' && (
                          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-800 text-white space-y-2.5 text-center shadow-lg">
                            <Megaphone className="w-6 h-6 mx-auto text-teal-200" />
                            <div className="font-extrabold text-xs">{col.bannerTitle || 'عنوان بنر'}</div>
                            <p className="text-[10px] text-teal-100 leading-relaxed">{col.bannerSubtitle || 'توضیحات کوتاه'}</p>
                            <button
                              type="button"
                              className="px-3 py-1.5 bg-white text-teal-900 rounded-xl text-[10px] font-extrabold hover:bg-teal-50 transition-colors shadow-sm"
                            >
                              {col.bannerButtonText || 'مشاهده کامل'}
                            </button>
                          </div>
                        )}

                        {/* Render Custom HTML */}
                        {col.type === 'html' && (
                          <div className="p-3 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[10px] dir-ltr text-left overflow-hidden border border-slate-800">
                            {col.customHtml || '<div>HTML Content</div>'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: ACTIVE COLUMN INSPECTOR & CONTENT EDITOR */}
          {activeColumn && (
            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-teal-600" />
                  ویرایش محتوا و تنظیمات {activeColumn.title}
                </h4>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    نوع محتوای ستون:
                  </span>
                  <select
                    value={activeColumn.type}
                    onChange={e => handleUpdateActiveColumn({ type: e.target.value as any })}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                  >
                    <option value="links">📄 گروه لینک‌ها (Links Group)</option>
                    <option value="image">🖼️ تصویر شاخص (Featured Image)</option>
                    <option value="banner">📣 بنر تبلیغاتی (Promotional Banner)</option>
                    <option value="html">💻 بلاک HTML سفارشی</option>
                  </select>
                </div>
              </div>

              {/* Column Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    عنوان سرستون (Column Header Title)
                  </label>
                  <input
                    type="text"
                    value={activeColumn.title}
                    onChange={e => handleUpdateActiveColumn({ title: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                  />
                </div>
              </div>

              {/* TYPE 1: Links Group Editor with Link DnD */}
              {activeColumn.type === 'links' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <LinkIcon className="w-4 h-4 text-teal-600" />
                      لینک‌های داخل این ستون (تغییر ترتیب با Drag & Drop):
                    </label>
                    <button
                      type="button"
                      onClick={handleAddLinkToColumn}
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-1 text-[11px] shadow-sm transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> افزودن لینک جدید
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(activeColumn.links || []).map((link, lIdx) => {
                      const isLinkDragging = draggedLinkIndex === lIdx;
                      const isLinkDragOver = dragOverLinkIndex === lIdx;

                      return (
                        <div
                          key={link.id}
                          draggable
                          onDragStart={e => handleLinkDragStart(e, lIdx)}
                          onDragOver={e => handleLinkDragOver(e, lIdx)}
                          onDrop={e => handleLinkDrop(e, lIdx)}
                          onDragEnd={() => {
                            setDraggedLinkIndex(null);
                            setDragOverLinkIndex(null);
                          }}
                          className={`p-3 rounded-2xl bg-white dark:bg-slate-900 border transition-all grid grid-cols-1 sm:grid-cols-12 gap-3 items-center ${
                            isLinkDragging
                              ? 'opacity-40 border-dashed border-teal-500'
                              : isLinkDragOver
                              ? 'border-2 border-teal-600 bg-teal-50 dark:bg-teal-950/60'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          {/* Drag handle & order buttons */}
                          <div className="sm:col-span-1 flex items-center gap-1 text-slate-400">
                            <span className="cursor-grab active:cursor-grabbing hover:text-teal-600">
                              <GripVertical className="w-4 h-4" />
                            </span>
                            <div className="flex flex-col">
                              <button
                                type="button"
                                onClick={() => handleMoveLinkShift(lIdx, 'up')}
                                disabled={lIdx === 0}
                                className="p-0.5 hover:text-teal-600 disabled:opacity-20"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveLinkShift(lIdx, 'down')}
                                disabled={lIdx === (activeColumn.links?.length || 0) - 1}
                                className="p-0.5 hover:text-teal-600 disabled:opacity-20"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Link Title */}
                          <div className="sm:col-span-3">
                            <input
                              type="text"
                              placeholder="عنوان لینک..."
                              value={link.title}
                              onChange={e => {
                                const updatedLinks = (activeColumn.links || []).map(l =>
                                  l.id === link.id ? { ...l, title: e.target.value } : l
                                );
                                handleUpdateActiveColumn({ links: updatedLinks });
                              }}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
                            />
                          </div>

                          {/* Link URL */}
                          <div className="sm:col-span-4">
                            <input
                              type="text"
                              placeholder="آدرس URL..."
                              value={link.url}
                              onChange={e => {
                                const updatedLinks = (activeColumn.links || []).map(l =>
                                  l.id === link.id ? { ...l, url: e.target.value } : l
                                );
                                handleUpdateActiveColumn({ links: updatedLinks });
                              }}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono dir-ltr text-left"
                            />
                          </div>

                          {/* Description */}
                          <div className="sm:col-span-3">
                            <input
                              type="text"
                              placeholder="توضیح کوتاه..."
                              value={link.description || ''}
                              onChange={e => {
                                const updatedLinks = (activeColumn.links || []).map(l =>
                                  l.id === link.id ? { ...l, description: e.target.value } : l
                                );
                                handleUpdateActiveColumn({ links: updatedLinks });
                              }}
                              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                            />
                          </div>

                          {/* Delete Link */}
                          <div className="sm:col-span-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveLinkFromColumn(link.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                              title="حذف لینک"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TYPE 2: Featured Image */}
              {activeColumn.type === 'image' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      آدرس تصویر (Image URL)
                    </label>
                    <input
                      type="text"
                      value={activeColumn.imageUrl || ''}
                      onChange={e => handleUpdateActiveColumn({ imageUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs dir-ltr text-left"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        متن جایگزین (Alt Text)
                      </label>
                      <input
                        type="text"
                        value={activeColumn.imageAlt || ''}
                        onChange={e => handleUpdateActiveColumn({ imageAlt: e.target.value })}
                        placeholder="توضیح تصویر..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        زیرنویس و کپشن (Caption)
                      </label>
                      <input
                        type="text"
                        value={activeColumn.imageCaption || ''}
                        onChange={e => handleUpdateActiveColumn({ imageCaption: e.target.value })}
                        placeholder="زیرنویس بنر..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TYPE 3: Promotional Banner */}
              {activeColumn.type === 'banner' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        عنوان بنر (Banner Title)
                      </label>
                      <input
                        type="text"
                        value={activeColumn.bannerTitle || ''}
                        onChange={e => handleUpdateActiveColumn({ bannerTitle: e.target.value })}
                        placeholder="مثال: فراخوان جذب گرنت پژوهشی"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        توضیحات کوتاه
                      </label>
                      <input
                        type="text"
                        value={activeColumn.bannerSubtitle || ''}
                        onChange={e => handleUpdateActiveColumn({ bannerSubtitle: e.target.value })}
                        placeholder="مثال: تا سقف ۵۰ میلیون تومان"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        متن دکمه (CTA)
                      </label>
                      <input
                        type="text"
                        value={activeColumn.bannerButtonText || ''}
                        onChange={e => handleUpdateActiveColumn({ bannerButtonText: e.target.value })}
                        placeholder="مشاهده شرایط"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                        لینک دکمه
                      </label>
                      <input
                        type="text"
                        value={activeColumn.bannerButtonLink || ''}
                        onChange={e => handleUpdateActiveColumn({ bannerButtonLink: e.target.value })}
                        placeholder="/grants/apply"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs dir-ltr text-left"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TYPE 4: HTML Block */}
              {activeColumn.type === 'html' && (
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    کد HTML سفارشی
                  </label>
                  <textarea
                    rows={4}
                    value={activeColumn.customHtml || ''}
                    onChange={e => handleUpdateActiveColumn({ customHtml: e.target.value })}
                    placeholder="<div className='p-2 bg-blue-50'>...</div>"
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-900 text-emerald-400 font-mono text-xs dir-ltr text-left"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleSaveMegaMenu}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> ذخیره پیکربندی مگا منو
          </button>
        </div>
      </div>
    </div>
  );
};
