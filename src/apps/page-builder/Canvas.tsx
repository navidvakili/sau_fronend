import React, { useState } from 'react';
import {
  SmartPageSchema,
  SectionInstance,
  ColumnInstance,
  WidgetInstance,
  Breakpoint,
  UserRoleCondition,
  getColumnWidth
} from './builderTypes';
import { WidgetRenderer } from './WidgetRenderer';
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Layers,
  Sparkles,
  Grid,
  EyeOff,
  Pencil,
  GripVertical
} from 'lucide-react';

interface CanvasProps {
  pageSchema: SmartPageSchema;
  activeBreakpoint: Breakpoint;
  selectedSectionId: string | null;
  selectedColumnId: string | null;
  selectedWidgetId: string | null;
  currentUserRole: UserRoleCondition;
  onSelectSection: (sectionId: string) => void;
  onSelectColumn: (columnId: string) => void;
  onSelectWidget: (widgetId: string) => void;
  onAddWidget: (widgetType: any, targetColumnId?: string) => void;
  onAddSection: (preset: '1col' | '2col' | '3col' | '7-5' | '8-4') => void;
  onOpenComponentPicker?: (targetInsertIndex?: number, targetColumnId?: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onDeleteWidget: (widgetId: string) => void;
  onMoveWidget: (widgetId: string, direction: 'up' | 'down') => void;
  onMoveWidgetToColumn?: (widgetId: string, targetColumnId: string) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  pageSchema,
  activeBreakpoint,
  selectedSectionId,
  selectedColumnId,
  selectedWidgetId,
  currentUserRole,
  onSelectSection,
  onSelectColumn,
  onSelectWidget,
  onAddWidget,
  onAddSection,
  onOpenComponentPicker,
  onDeleteSection,
  onDeleteWidget,
  onMoveWidget,
  onMoveWidgetToColumn
}) => {
  // Drag & Drop state — widget being dragged + column currently hovered (highlight)
  const [dragWidgetId, setDragWidgetId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  // Breakpoint container width calculator
  const getCanvasWidthClass = () => {
    switch (activeBreakpoint) {
      case 'tablet':
        return 'max-w-[768px] shadow-2xl my-6 rounded-3xl border border-gray-300 dark:border-slate-800';
      case 'mobile':
        return 'max-w-[390px] shadow-2xl my-6 rounded-3xl border border-gray-300 dark:border-slate-800';
      default:
        return 'w-full';
    }
  };

  const globalStyles = pageSchema.globalStyles;

  return (
    <div className="flex-1 min-h-0 h-full w-full bg-slate-100 dark:bg-slate-950 overflow-auto p-4 md:p-8 pb-56 flex flex-col items-center select-none rtl text-right transition-all">
      {/* Canvas Frame Container — shrink-0 keeps natural height so the overflow-auto canvas scrolls (x & y) when sections exceed viewport */}
      <div
        className={`bg-white dark:bg-slate-900 transition-all duration-300 overflow-hidden mb-32 shrink-0 ${getCanvasWidthClass()}`}
        style={{
          fontFamily: globalStyles.fontFamily,
          color: globalStyles.textColor
        }}
      >
        {pageSchema.sections.length === 0 ? (
          <div className="p-16 text-center space-y-4 flex flex-col items-center justify-center min-h-[400px]">
            <div className="p-4 rounded-full bg-teal-500/10 text-teal-500">
              <Grid className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">بوم طراحی خالی است</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              جهت شروع طراحی، یک بلوک یا چیدمان جدید از طریق دیالوگ کامپوننت‌ها ایجاد نمایید.
            </p>
            <button
              onClick={() => onOpenComponentPicker ? onOpenComponentPicker(0) : onAddSection('1col')}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن اولین بلوک صفحه</span>
            </button>
          </div>
        ) : (
          <div className="space-y-0">
            {/* Divider button before the first section */}
            <div className="relative my-2 group/divider py-2 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-dashed border-teal-500/30 group-hover/divider:border-teal-500 transition-colors" />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenComponentPicker) {
                    onOpenComponentPicker(0);
                  } else {
                    onAddSection('1col');
                  }
                }}
                className="relative z-10 px-3 py-1 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-black text-[11px] flex items-center gap-1.5 shadow-md transition-transform transform hover:scale-105 cursor-pointer opacity-80 hover:opacity-100"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن بلوک جدید به ابتدا</span>
              </button>
            </div>
            {pageSchema.sections.map((sec, secIdx) => {
              const isSecSelected = selectedSectionId === sec.id;

              // Check section visibility for active breakpoint
              if (!sec.visibility[activeBreakpoint]) {
                return (
                  <div key={sec.id}>
                    <div
                      onClick={() => onSelectSection(sec.id)}
                      className="p-3 bg-slate-200/60 dark:bg-slate-800/60 border border-dashed border-slate-400 text-xs text-slate-500 flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 font-bold">
                        <EyeOff className="w-4 h-4" />
                        سکشن «{sec.name}» در حالت {activeBreakpoint} مخفی می‌باشد
                      </span>
                      <span className="text-[10px]">کلیک برای تنظیمات</span>
                    </div>

                    {/* Divider line after hidden section */}
                    <div className="relative my-2 group/divider py-2 flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-dashed border-teal-500/30 group-hover/divider:border-teal-500 transition-colors" />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenComponentPicker) {
                            onOpenComponentPicker(secIdx + 1);
                          } else {
                            onAddSection('1col');
                          }
                        }}
                        className="relative z-10 px-3 py-1 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-black text-[11px] flex items-center gap-1.5 shadow-md transition-transform transform hover:scale-105 cursor-pointer opacity-80 hover:opacity-100"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>افزودن بلوک جدید در این مکان</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <React.Fragment key={sec.id}>
                  <div
                    id={sec.bookmark || sec.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSection(sec.id);
                    }}
                    style={{
                      backgroundColor: sec.backgroundColor || undefined,
                      backgroundImage: sec.backgroundImage
                        ? `url("${sec.backgroundImage}")`
                        : sec.backgroundGradient || undefined,
                      backgroundPosition: sec.backgroundPosition || undefined,
                      backgroundSize: sec.backgroundSize || undefined,
                      backgroundRepeat: sec.backgroundRepeat || undefined,
                      paddingTop: `${sec.paddingTop}px`,
                      paddingBottom: `${sec.paddingBottom}px`,
                      // شعاع گوشه‌های جداگانه (مانند فتوشاپ) — ترتیب CSS: TL TR BR BL
                      borderRadius: sec.borderRadius
                        ? [sec.borderRadius.topLeft, sec.borderRadius.topRight, sec.borderRadius.bottomRight, sec.borderRadius.bottomLeft]
                            .map((v) => (v ? `${v}px` : '0px'))
                            .join(' ')
                        : undefined
                    }}
                    className={`relative group transition-all border-2 ${
                      isSecSelected
                        ? 'border-teal-500 shadow-lg'
                        : 'border-transparent hover:border-teal-500/40'
                    }`}
                  >
                    {/* Section Label & Quick Toolbar on Hover/Select */}
                    <div className={`absolute top-2 right-4 z-20 flex items-center gap-2 transition-opacity ${
                      isSecSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      <span className="px-2.5 py-1 rounded-lg bg-teal-600 text-white text-[10px] font-black shadow-md flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {sec.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSection(sec.id);
                        }}
                        className="p-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-md cursor-pointer"
                        title="ویرایش مشخصات سکشن در پنل تنظیمات"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSection(sec.id);
                        }}
                        className="p-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-md cursor-pointer"
                        title="حذف سکشن"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Section Content Container (Boxed or Full Width) */}
                    <div className={sec.layout === 'boxed' ? 'max-w-[1200px] mx-auto px-4 md:px-6' : 'w-full px-4'}>
                      <div className="grid grid-cols-12 gap-4 md:gap-6">
                        {sec.columns.map((col) => {
                          const isColSelected = selectedColumnId === col.id;
                          return (
                            <div
                              key={col.id}
                              style={{
                                gridColumn: `span ${getColumnWidth(col, activeBreakpoint)} / span ${getColumnWidth(col, activeBreakpoint)}`
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectSection(sec.id);
                                onSelectColumn(col.id);
                              }}
                              onDragOver={(e) => {
                                // Allow drop on any column — highlight while dragging over
                                if (dragWidgetId) {
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = 'move';
                                  setDragOverColumnId(col.id);
                                }
                              }}
                              onDragLeave={() => {
                                if (dragOverColumnId === col.id) {
                                  setDragOverColumnId(null);
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragOverColumnId(null);
                                if (dragWidgetId) {
                                  // Move the widget to this column (cross-section DnD)
                                  onMoveWidgetToColumn?.(dragWidgetId, col.id);
                                }
                                setDragWidgetId(null);
                              }}
                              className={`min-h-[100px] p-3 rounded-2xl border-2 transition-all flex flex-col justify-between relative group/col ${
                                isColSelected
                                  ? 'border-indigo-500 bg-indigo-500/5'
                                  : 'border-dashed border-gray-300 dark:border-slate-800 hover:border-indigo-400'
                              } ${
                                dragOverColumnId === col.id
                                  ? 'border-teal-500 bg-teal-500/10 ring-2 ring-teal-500/30'
                                  : ''
                              }`}
                            >
                              {/* Widgets inside column */}
                              <div className="space-y-4">
                                {col.widgets.length === 0 ? (
                                  <div className="p-6 text-center border-2 border-dashed border-gray-200 dark:border-slate-800/80 rounded-xl text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                                    <span>ستون خالی است</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onOpenComponentPicker) {
                                          onOpenComponentPicker(undefined, col.id);
                                        } else {
                                          onAddWidget('heading', col.id);
                                        }
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-500 hover:text-white text-slate-600 dark:text-slate-300 font-bold transition-all cursor-pointer flex items-center gap-1"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>افزودن کامپوننت</span>
                                    </button>
                                  </div>
                                ) : (
                                  col.widgets.map((widget, wIdx) => {
                                    const isWidgetSel = selectedWidgetId === widget.id;
                                    return (
                                      <div
                                        key={widget.id}
                                        draggable
                                        onDragStart={(e) => {
                                          setDragWidgetId(widget.id);
                                          e.dataTransfer.effectAllowed = 'move';
                                          e.dataTransfer.setData('text/plain', widget.id);
                                        }}
                                        onDragEnd={() => {
                                          setDragWidgetId(null);
                                          setDragOverColumnId(null);
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onSelectSection(sec.id);
                                          onSelectColumn(col.id);
                                          onSelectWidget(widget.id);
                                        }}
                                        className={`relative group/widget rounded-xl transition-all border-2 ${
                                          isWidgetSel
                                            ? 'border-amber-500 ring-2 ring-amber-500/20'
                                            : 'border-transparent hover:border-amber-400/50'
                                        } ${
                                          dragWidgetId === widget.id
                                            ? 'opacity-40 cursor-grabbing'
                                            : 'cursor-grab'
                                        }`}
                                      >
                                        {/* Drag handle indicator on hover */}
                                        <div className={`absolute top-2 right-2 z-30 p-1 rounded-lg bg-slate-900/80 text-slate-300 border border-slate-700 backdrop-blur-md transition-opacity ${
                                          isWidgetSel ? 'opacity-100' : 'opacity-0 group-hover/widget:opacity-100'
                                        }`}>
                                          <GripVertical className="w-3.5 h-3.5" />
                                        </div>

                                        {/* Widget Hover Action Bar */}
                                        <div className={`absolute top-2 left-2 z-30 flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl text-white text-xs border border-slate-700 backdrop-blur-md transition-opacity ${
                                          isWidgetSel ? 'opacity-100' : 'opacity-0 group-hover/widget:opacity-100'
                                        }`}>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onSelectSection(sec.id);
                                              onSelectColumn(col.id);
                                              onSelectWidget(widget.id);
                                            }}
                                            className="p-1 hover:text-amber-400 cursor-pointer"
                                            title="ویرایش مشخصات ویجت در پنل تنظیمات"
                                          >
                                            <Pencil className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onMoveWidget(widget.id, 'up');
                                            }}
                                            disabled={wIdx === 0}
                                            className="p-1 hover:text-amber-400 disabled:opacity-30 cursor-pointer"
                                            title="انتقال به بالا"
                                          >
                                            <ChevronUp className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onMoveWidget(widget.id, 'down');
                                            }}
                                            disabled={wIdx === col.widgets.length - 1}
                                            className="p-1 hover:text-amber-400 disabled:opacity-30 cursor-pointer"
                                            title="انتقال به پایین"
                                          >
                                            <ChevronDown className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onDeleteWidget(widget.id);
                                            }}
                                            className="p-1 hover:text-rose-400 cursor-pointer"
                                            title="حذف ویجت"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>

                                        {/* Render Widget */}
                                        <WidgetRenderer
                                          widget={widget}
                                          currentUserRole={currentUserRole}
                                          isEditorPreview={true}
                                        />
                                      </div>
                                    );
                                  })
                                )}
                              </div>

                              {/* Column Add Widget Trigger Button at bottom */}
                              <div className="pt-2 flex justify-center opacity-0 group-hover/col:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onOpenComponentPicker) {
                                      onOpenComponentPicker(undefined, col.id);
                                    } else {
                                      onAddWidget('heading', col.id);
                                    }
                                  }}
                                  className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm cursor-pointer hover:bg-indigo-700"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>افزودن کامپوننت به این ستون</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Add Section Divider between blocks */}
                  <div className="relative my-2 group/divider py-2 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-dashed border-teal-500/30 group-hover/divider:border-teal-500 transition-colors" />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenComponentPicker) {
                          onOpenComponentPicker(secIdx + 1);
                        } else {
                          onAddSection('1col');
                        }
                      }}
                      className="relative z-10 px-3 py-1 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-black text-[11px] flex items-center gap-1.5 shadow-md transition-transform transform hover:scale-105 cursor-pointer opacity-80 hover:opacity-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن بلوک جدید در این مکان</span>
                    </button>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
