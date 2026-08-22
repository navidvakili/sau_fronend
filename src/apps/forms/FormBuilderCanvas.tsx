import React, { useEffect, useState } from 'react';
import {
  Type,
  AlignLeft,
  Hash,
  Mail,
  Phone,
  Calendar,
  Clock,
  ListFilter,
  CheckSquare,
  CircleDot,
  CheckCircle2,
  Table,
  Upload,
  SlidersHorizontal,
  PenTool,
  Plus,
  Trash2,
  Copy,
  Layers,
  Search,
  GripVertical,
  Star,
  ChevronDown,
  Award,
  MoveUp,
  MoveDown,
  Sparkles,
  X,
  Lock,
  DollarSign,
  Percent,
  Compass,
  Palette,
  Globe,
  Home,
  ArrowDown,
  MapPin
} from 'lucide-react';
import { FormDefinition, FormField, FieldType, FormStep } from './types';
import FormInspectorPanel from './FormInspectorPanel';

interface FormBuilderCanvasProps {
  form: FormDefinition;
  onChange: (updatedForm: FormDefinition) => void;
  activeBreakpoint?: '1240' | '1024' | '768' | '380';
  scrollToFieldId?: string | null;
}

const FIELD_PALETTE: {
  category: string;
  items: { type: FieldType; label: string; icon: any; color: string; desc: string }[];
}[] = [
  {
    category: 'ورودی‌های متنی و هویتی',
    items: [
      { type: 'text', label: 'متن تک‌خطی', icon: Type, color: 'text-teal-600 dark:text-teal-400', desc: 'نام، نام خانوادگی، عنوان' },
      { type: 'textarea', label: 'متن چندخطی (توضیحات)', icon: AlignLeft, color: 'text-cyan-600 dark:text-cyan-400', desc: 'شرح، بازخورد، بیوگرافی' },
      { type: 'number', label: 'ورودی عددی', icon: Hash, color: 'text-amber-600 dark:text-amber-400', desc: 'سن، کد ملی، تعداد' },
      { type: 'email', label: 'پست الکترونیکی', icon: Mail, color: 'text-blue-600 dark:text-blue-400', desc: 'ایمیل با اعتبارسنجی دامنه' },
      { type: 'phone', label: 'شماره همراه / ثابت', icon: Phone, color: 'text-emerald-600 dark:text-emerald-400', desc: 'موبایل ۱۱ رقمی یا بین‌المللی' },
      { type: 'password', label: 'گذرواژه و رمز عبور', icon: Lock, color: 'text-rose-600 dark:text-rose-400', desc: 'رمز عبور با قوانین پیچیدگی' }
    ]
  },
  {
    category: 'انتخابی، چندگزینه‌ای و آبشاری',
    items: [
      { type: 'select', label: 'منوی کشویی (Dropdown)', icon: ListFilter, color: 'text-indigo-600 dark:text-indigo-400', desc: 'انتخاب یک گزینه با قابلیت جستجو' },
      { type: 'radio', label: 'تک انتخابی (Radio)', icon: CircleDot, color: 'text-purple-600 dark:text-purple-400', desc: 'دکمه‌های رادیویی با چیدمان افقی/عمودی' },
      { type: 'checkbox', label: 'چند انتخابی (Checkbox)', icon: CheckSquare, color: 'text-violet-600 dark:text-violet-400', desc: 'انتخاب همزمان چند مورد با محدودیت' },
      { type: 'yesno', label: 'کلید دوحالته (بله / خیر)', icon: CheckCircle2, color: 'text-rose-600 dark:text-rose-400', desc: 'پاسخ‌های دوتایی قطعی و تاییدیه' },
      { type: 'cascading', label: 'انتخاب وابسته (آبشاری)', icon: Layers, color: 'text-sky-600 dark:text-sky-400', desc: 'استان/شهر یا دانشکده/گروه' }
    ]
  },
  {
    category: 'تاریخ، زمان و مالی',
    items: [
      { type: 'date', label: 'تاریخ (شمسی / میلادی)', icon: Calendar, color: 'text-teal-600 dark:text-teal-400', desc: 'انتخاب تاریخ روز یا تقویم' },
      { type: 'time', label: 'ساعت و زمان', icon: Clock, color: 'text-sky-600 dark:text-sky-400', desc: 'فرمت ۲۴ ساعته یا ۱۲ ساعته' },
      { type: 'currency', label: 'مبلغ و ریالی', icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400', desc: 'تومان، ریال، دلار با ۳ رقم اعشار' },
      { type: 'percentage', label: 'درصد و ضریب', icon: Percent, color: 'text-amber-600 dark:text-amber-400', desc: 'مقادیر درصدی از ۰ تا ۱۰۰٪' }
    ]
  },
  {
    category: 'ارزشیابی، فایل و پیشرفته',
    items: [
      { type: 'rating', label: 'نمره‌دهی ستاره‌ای (Rating)', icon: Star, color: 'text-amber-500', desc: 'رضایت‌سنجی ۱ تا ۵ ستاره یا قلب' },
      { type: 'matrix', label: 'ماتریس لیکرت (Likert Table)', icon: Table, color: 'text-teal-500', desc: 'ارزیابی چند معیار همزمان' },
      { type: 'slider', label: 'اسلایدر پیوسته عددی', icon: SlidersHorizontal, color: 'text-indigo-500', desc: 'انتخاب بازه‌ای از مقادیر' },
      { type: 'file', label: 'بارگذاری مدارک و فایل', icon: Upload, color: 'text-orange-500', desc: 'PDF، تصویر، زیپ با محدودیت حجم' },
      { type: 'signature', label: 'امضای دیجیتال کاربر', icon: PenTool, color: 'text-emerald-500', desc: 'تاییدیه با قلم لمسی یا ماوس' },
      { type: 'address', label: 'آدرس و کد پستی', icon: Home, color: 'text-indigo-600', desc: 'شامل استان، شهر و کدپستی' },
      { type: 'location', label: 'موقعیت نقشه (GPS)', icon: MapPin, color: 'text-rose-500', desc: 'انتخاب نقطه جغرافیایی روی نقشه' },
      { type: 'color', label: 'انتخاب رنگ (Color Picker)', icon: Palette, color: 'text-pink-500', desc: 'کدهای رنگی HEX / RGB' },
      { type: 'url', label: 'پیوند وب‌سایت (URL)', icon: Globe, color: 'text-blue-500', desc: 'آدرس اینترنتی معتبر با https' }
    ]
  }
];

export const FormBuilderCanvas: React.FC<FormBuilderCanvasProps> = ({
  form,
  onChange,
  activeBreakpoint = '1240',
  scrollToFieldId = null
}) => {
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    form.fields[0]?.id || null
  );
  const [activeStepId, setActiveStepId] = useState<string>(
    form.steps[0]?.id || 's1'
  );
  const [paletteSearch, setPaletteSearch] = useState('');
  const [newFieldId, setNewFieldId] = useState<string | null>(null);
  const [isAddStepDialogOpen, setIsAddStepDialogOpen] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState('');

  // Drag-and-Drop state tracking
  const [draggedPaletteType, setDraggedPaletteType] = useState<{ type: FieldType; label: string } | null>(null);
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const selectedField = form.fields.find(f => f.id === selectedFieldId) || null;

  useEffect(() => {
    const fieldId = scrollToFieldId || newFieldId;
    if (!fieldId) return;

    requestAnimationFrame(() => {
      document.getElementById(`form-field-${fieldId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    });
  }, [scrollToFieldId, newFieldId, form.fields.length]);

  // Filtered fields in active step
  const currentStepFields = form.fields.filter(
    f => f.stepId === activeStepId || (!f.stepId && activeStepId === form.steps[0]?.id)
  );

  // Helper: create a new field instance
  const createNewFieldInstance = (type: FieldType, label: string, targetStepId: string): FormField => {
    return {
      id: `f_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type,
      label: `سوال جدید ${form.fields.length + 1}: ${label}`,
      placeholder: 'متن راهنما را وارد کنید...',
      stepId: targetStepId,
      columnWidth: '100%',
      validation: { required: false },
      options: ['گزینه ۱', 'گزینه ۲', 'گزینه ۳'].map((lbl, idx) => ({
        id: `opt_${Date.now()}_${idx}`,
        label: lbl,
        value: `val_${idx + 1}`
      }))
    };
  };

  // Add field to current step at specific index or at end
  const handleAddField = (type: FieldType, label: string, insertAtStepIndex?: number) => {
    const newField = createNewFieldInstance(type, label, activeStepId);

    if (insertAtStepIndex !== undefined && insertAtStepIndex >= 0) {
      // Find global position corresponding to this step index
      const otherStepFields = form.fields.filter(
        f => f.stepId !== activeStepId && (f.stepId || activeStepId !== form.steps[0]?.id)
      );
      const stepFields = [...currentStepFields];
      stepFields.splice(insertAtStepIndex, 0, newField);

      // Reassemble fields preserving step structure
      const updatedFields: FormField[] = [];
      form.steps.forEach(st => {
        if (st.id === activeStepId) {
          updatedFields.push(...stepFields);
        } else {
          updatedFields.push(...form.fields.filter(f => f.stepId === st.id));
        }
      });

      onChange({ ...form, fields: updatedFields });
    } else {
      const updatedFields = [...form.fields, newField];
      onChange({ ...form, fields: updatedFields });
    }
    setSelectedFieldId(newField.id);
    setNewFieldId(newField.id);
  };

  // Reorder existing field to a new step index
  const handleReorderFieldToStepIndex = (sourceFieldId: string, targetIndex: number) => {
    const sourceField = form.fields.find(f => f.id === sourceFieldId);
    if (!sourceField) return;

    // Remove source field from step fields
    const stepFields = currentStepFields.filter(f => f.id !== sourceFieldId);
    // Insert at target index
    const clampedTarget = Math.max(0, Math.min(targetIndex, stepFields.length));
    stepFields.splice(clampedTarget, 0, { ...sourceField, stepId: activeStepId });

    // Reconstruct full form fields
    const updatedFields: FormField[] = [];
    form.steps.forEach(st => {
      if (st.id === activeStepId) {
        updatedFields.push(...stepFields);
      } else {
        updatedFields.push(...form.fields.filter(f => f.id !== sourceFieldId && f.stepId === st.id));
      }
    });

    onChange({ ...form, fields: updatedFields });
    setSelectedFieldId(sourceFieldId);
  };

  // Drag and Drop Event Handlers
  const handlePaletteDragStart = (e: React.DragEvent, type: FieldType, label: string) => {
    setDraggedPaletteType({ type, label });
    setDraggedFieldId(null);
    e.dataTransfer.setData('application/json', JSON.stringify({ source: 'palette', type, label }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleFieldDragStart = (e: React.DragEvent, fieldId: string) => {
    setDraggedFieldId(fieldId);
    setDraggedPaletteType(null);
    e.dataTransfer.setData('application/json', JSON.stringify({ source: 'canvas', fieldId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverZone = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = draggedPaletteType ? 'copy' : 'move';
    if (dropTargetIndex !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleDropOnZone = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetIndex(null);

    if (draggedPaletteType) {
      handleAddField(draggedPaletteType.type, draggedPaletteType.label, targetIndex);
      setDraggedPaletteType(null);
    } else if (draggedFieldId) {
      handleReorderFieldToStepIndex(draggedFieldId, targetIndex);
      setDraggedFieldId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedPaletteType(null);
    setDraggedFieldId(null);
    setDropTargetIndex(null);
  };

  // Duplicate field
  const handleDuplicateField = (field: FormField) => {
    const dup: FormField = {
      ...field,
      id: `f_${Date.now()}`,
      label: `${field.label} (کپی)`
    };
    const updatedFields = [...form.fields, dup];
    onChange({ ...form, fields: updatedFields });
    setSelectedFieldId(dup.id);
  };

  // Delete field
  const handleDeleteField = (fieldId: string) => {
    const updatedFields = form.fields.filter(f => f.id !== fieldId);
    onChange({ ...form, fields: updatedFields });
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(updatedFields[0]?.id || null);
    }
  };

  // Update field
  const handleUpdateField = (updatedField: FormField) => {
    const updatedFields = form.fields.map(f => (f.id === updatedField.id ? updatedField : f));
    onChange({ ...form, fields: updatedFields });
  };

  // Reorder field up/down
  const handleMoveField = (fieldId: string, direction: 'up' | 'down') => {
    const currentFields = [...form.fields];
    const index = currentFields.findIndex(f => f.id === fieldId);
    if (index < 0) return;
    if (direction === 'up' && index > 0) {
      const temp = currentFields[index];
      currentFields[index] = currentFields[index - 1];
      currentFields[index - 1] = temp;
      onChange({ ...form, fields: currentFields });
    } else if (direction === 'down' && index < currentFields.length - 1) {
      const temp = currentFields[index];
      currentFields[index] = currentFields[index + 1];
      currentFields[index + 1] = temp;
      onChange({ ...form, fields: currentFields });
    }
  };

  // Add step
  const handleAddStep = () => {
    setNewStepTitle(`گام ${form.steps.length + 1}`);
    setIsAddStepDialogOpen(true);
  };

  const handleConfirmAddStep = () => {
    const title = newStepTitle.trim();
    if (!title) return;

    const newStep: FormStep = {
      id: `s_${Date.now()}`,
      title,
      order: form.steps.length + 1
    };
    onChange({ ...form, steps: [...form.steps, newStep] });
    setActiveStepId(newStep.id);
    setIsAddStepDialogOpen(false);
  };

  const handleDeleteStep = (stepId: string) => {
    if (form.steps.length <= 1) return;

    const remainingSteps = form.steps.filter(step => step.id !== stepId);
    const fallbackStepId = remainingSteps[0].id;
    const updatedFields = form.fields.map(field =>
      field.stepId === stepId ? { ...field, stepId: fallbackStepId } : field
    );
    const updatedSteps = remainingSteps.map((step, index) => ({ ...step, order: index + 1 }));

    onChange({ ...form, steps: updatedSteps, fields: updatedFields });
    if (activeStepId === stepId) setActiveStepId(fallbackStepId);
  };

  // Canvas Max Width based on breakpoint
  const getMaxWidthClass = () => {
    switch (activeBreakpoint) {
      case '380': return 'max-w-xs';
      case '768': return 'max-w-xl';
      case '1024': return 'max-w-3xl';
      default: return 'max-w-4xl';
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden relative select-none rtl text-right h-full">
      {/* LEFT SIDEBAR: PALETTE LIST ONLY (NO STRUCTURE TAB AS REQUESTED) */}
      <div className="w-72 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 flex flex-col h-full text-slate-800 dark:text-slate-200 select-none transition-colors shrink-0">
        {/* Sidebar Header */}
        <div className="p-3 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border border-teal-200/50 dark:border-teal-800/50">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white">مخزن المان‌های فرم</h3>
              <p className="text-[10px] text-slate-400">کلیک یا کشیدن و رها کردن (DnD)</p>
            </div>
          </div>
          <span className="text-[10px] bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-mono font-bold">
            {FIELD_PALETTE.reduce((acc, cat) => acc + cat.items.length, 0)} المان
          </span>
        </div>

        {/* Palette Search and Field Categories */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={paletteSearch}
              onChange={e => setPaletteSearch(e.target.value)}
              placeholder="جستجوی فیلد و المان..."
              className="w-full pr-8 pl-3 py-1.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          {FIELD_PALETTE.map((cat, cIdx) => {
            const filteredItems = cat.items.filter(
              it => it.label.includes(paletteSearch) || it.desc.includes(paletteSearch)
            );
            if (filteredItems.length === 0) return null;

            return (
              <div key={cIdx} className="space-y-1.5">
                <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 px-1 block">
                  {cat.category}
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {filteredItems.map(item => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={e => handlePaletteDragStart(e, item.type, item.label)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleAddField(item.type, item.label)}
                      className="flex items-center gap-2.5 p-2 rounded-xl border border-gray-200/80 dark:border-slate-800/80 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-500/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all text-right group cursor-grab active:cursor-grabbing shadow-2xs hover:shadow-xs"
                    >
                      <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 ${item.color}`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block truncate font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400">
                          {item.label}
                        </span>
                        <span className="block text-[10px] text-slate-400 truncate">
                          {item.desc}
                        </span>
                      </div>
                      <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 shrink-0 opacity-50 group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CENTER VIEWPORT STAGE CANVAS */}
      <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-950/80 overflow-hidden relative">
        {/* Step Tabs Sub-bar */}
        <div className="h-11 border-b border-gray-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-4 flex items-center justify-between text-xs z-10 shrink-0">
          <div className="min-w-0 flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
            <span className="text-slate-500 font-bold text-[11px] ml-2 shrink-0">گام‌های فرم:</span>
            {form.steps.map(step => (
              <button
                key={step.id}
                onClick={() => setActiveStepId(step.id)}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeStepId === step.id
                    ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 font-black shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-gray-200 dark:border-slate-700'
                }`}
              >
                <span>{step.title}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/20 text-[10px] font-mono">
                  {form.fields.filter(f => f.stepId === step.id).length}
                </span>
                {form.steps.length > 1 && (
                  <span
                    role="button"
                    onClick={event => {
                      event.stopPropagation();
                      handleDeleteStep(step.id);
                    }}
                    className="p-0.5 rounded-md hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-300"
                    title="حذف گام"
                  >
                    <Trash2 className="w-3 h-3" />
                  </span>
                )}
              </button>
            ))}

            <button
              onClick={handleAddStep}
              className="p-1 px-2.5 rounded-xl bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-500 dark:hover:text-slate-950 transition-colors cursor-pointer border border-teal-200 dark:border-teal-500/30 flex items-center gap-1 text-[11px] font-bold"
              title="افزودن گام جدید"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن گام</span>
            </button>
          </div>

        </div>

        {/* Canvas Body with Dot-Grid Background */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] flex justify-center">
          <div className={`w-full ${getMaxWidthClass()} transition-all duration-300 space-y-4 pb-12`}>
            {/* Form Header Banner Preview Card */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-2 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-[10px] font-bold border border-teal-200 dark:border-teal-500/30">
                  {form.type === 'quiz' ? 'آزمون آنلاین' : form.type === 'survey' ? 'پرسشنامه و نظرسنجی' : 'فرم داده‌آمایی'}
                </span>
                <span className="text-xs text-slate-400">
                  نسخه {form.version} • {form.steps.find(s => s.id === activeStepId)?.title || 'گام فعال'}
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {form.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {form.description}
              </p>
            </div>

            {/* Top Drop Zone (Before first question) */}
            <div
              onDragOver={e => handleDragOverZone(e, 0)}
              onDrop={e => handleDropOnZone(e, 0)}
              className={`transition-all duration-200 rounded-2xl flex items-center justify-center ${
                dropTargetIndex === 0
                  ? 'h-14 bg-teal-50 dark:bg-teal-950/40 border-2 border-dashed border-teal-500 text-teal-600 dark:text-teal-400 shadow-md font-bold text-xs gap-2'
                  : 'h-2 hover:h-5 opacity-0 hover:opacity-100 bg-teal-500/10 border border-dashed border-teal-300/60 dark:border-teal-700/60'
              }`}
            >
              {dropTargetIndex === 0 && (
                <>
                  <ArrowDown className="w-4 h-4 animate-bounce" />
                  <span>رها کردن برای افزودن / جابجایی فیلد در ابتدای فرم</span>
                </>
              )}
            </div>

            {/* Questions List */}
            {currentStepFields.length === 0 ? (
              <div
                onDragOver={e => handleDragOverZone(e, 0)}
                onDrop={e => handleDropOnZone(e, 0)}
                className={`text-center py-16 border-2 border-dashed rounded-3xl p-8 space-y-3 transition-all ${
                  dropTargetIndex === 0
                    ? 'border-teal-500 bg-teal-50/80 dark:bg-teal-950/40'
                    : 'border-gray-300 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto border border-teal-200 dark:border-teal-500/30">
                  <Plus className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">
                  هیچ سؤالی در این گام وجود ندارد
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  از ستون سمت راست یک المان را کلیک کنید یا آن را بکشید و در این کادر رها کنید (Drag & Drop).
                </p>
              </div>
            ) : (
              currentStepFields.map((field, idx) => {
                const isSelected = selectedFieldId === field.id;
                const isBeingDragged = draggedFieldId === field.id;

                return (
                  <React.Fragment key={field.id}>
                    <div
                      id={`form-field-${field.id}`}
                      draggable
                      onDragStart={e => handleFieldDragStart(e, field.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedFieldId(field.id)}
                      className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all cursor-pointer relative group ${
                        isBeingDragged
                          ? 'opacity-40 border-dashed border-teal-400 scale-[0.98]'
                          : isSelected
                          ? 'border-2 border-teal-600 dark:border-teal-500 shadow-xl ring-4 ring-teal-500/10'
                          : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 shadow-xs'
                      }`}
                    >
                      {/* Top Meta Bar */}
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            title="برای جابجایی بکشید (DnD)"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-black text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-500/20 px-2.5 py-0.5 rounded-lg border border-teal-200 dark:border-teal-500/30 font-mono">
                            Q{idx + 1}
                          </span>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white">
                            {field.label}
                          </h4>
                          {field.validation?.required && (
                            <span className="text-[10px] text-red-500 font-bold bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-md">
                              * ضروری
                            </span>
                          )}
                          {field.points ? (
                            <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                              <Award className="w-3 h-3" /> {field.points} نمره
                            </span>
                          ) : null}
                        </div>

                        {/* Quick Action Toolbar */}
                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleMoveField(field.id, 'up');
                            }}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700"
                            title="حرکت به بالا"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleMoveField(field.id, 'down');
                            }}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700"
                            title="حرکت به پایین"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDuplicateField(field);
                            }}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700"
                            title="کپی فیلد"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteField(field.id);
                            }}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg text-slate-400 hover:text-red-600"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Realistic Field Component Visual Simulation */}
                      <div className="bg-slate-50 dark:bg-slate-950/60 border border-gray-200/80 dark:border-slate-800 rounded-2xl p-3.5 text-xs">
                        {['text', 'email', 'phone', 'number', 'password', 'currency', 'percentage', 'url'].includes(field.type) && (
                          <div className="px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 text-slate-400 flex items-center justify-between">
                            <span>{field.placeholder || 'پاسخ کاربر در این محل قرار می‌گیرد...'}</span>
                            {field.numberUnit && (
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                                {field.numberUnit}
                              </span>
                            )}
                            {field.type === 'currency' && (
                              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 px-1.5 py-0.5 rounded font-bold">
                                {field.currencyUnit || 'تومان'}
                              </span>
                            )}
                          </div>
                        )}

                        {field.type === 'textarea' && (
                          <div className="px-3 py-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 text-slate-400 h-16">
                            {field.placeholder || 'کادر متن چندخطی و توضیحات تفصیلی...'}
                          </div>
                        )}

                        {field.type === 'select' && (
                          <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 text-slate-400">
                            <span>{field.placeholder || 'انتخاب کنید...'}</span>
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          </div>
                        )}

                        {field.type === 'radio' && (
                          <div className="space-y-2">
                            {(field.options || ['گزینه الف', 'گزینه ب']).map((opt, oIdx) => (
                              <div key={oIdx} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center">
                                  {oIdx === 0 && <div className="w-2 h-2 rounded-full bg-teal-600"></div>}
                                </div>
                                <span>{opt.label}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {field.type === 'checkbox' && (
                          <div className="space-y-2">
                            {(field.options || ['گزینه ۱', 'گزینه ۲']).map((opt, oIdx) => (
                              <div key={oIdx} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <div className="w-4 h-4 rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center">
                                  {oIdx === 0 && <CheckCircle2 className="w-3 h-3 text-teal-600" />}
                                </div>
                                <span>{opt.label}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {field.type === 'rating' && (
                          <div className="flex items-center gap-2 text-amber-400 py-1">
                            {[1, 2, 3, 4, 5].map(st => (
                              <Star key={st} className={`w-5 h-5 ${st <= 4 ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
                            ))}
                            <span className="text-xs text-slate-400 mr-2">(۴ از ۵)</span>
                          </div>
                        )}

                        {field.type === 'matrix' && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-[11px] text-right">
                              <thead>
                                <tr className="border-b border-gray-200 dark:border-slate-800 text-slate-500">
                                  <th className="py-1">معیار</th>
                                  <th className="py-1 text-center">عالی</th>
                                  <th className="py-1 text-center">خوب</th>
                                  <th className="py-1 text-center">متوسط</th>
                                  <th className="py-1 text-center">ضعیف</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(field.matrixRows || [{ id: '1', label: 'کیفیت تدریس' }]).map(r => (
                                  <tr key={r.id} className="border-b border-gray-100 dark:border-slate-800/50">
                                    <td className="py-1.5 font-bold text-slate-700 dark:text-slate-300">{r.label}</td>
                                    <td className="py-1.5 text-center"><div className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-slate-700 mx-auto"></div></td>
                                    <td className="py-1.5 text-center"><div className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-slate-700 mx-auto"></div></td>
                                    <td className="py-1.5 text-center"><div className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-slate-700 mx-auto"></div></td>
                                    <td className="py-1.5 text-center"><div className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-slate-700 mx-auto"></div></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {['file', 'image'].includes(field.type) && (
                          <div className="border border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-4 text-center text-slate-400">
                            <Upload className="w-5 h-5 mx-auto mb-1 text-teal-600" />
                            <span>برای بارگذاری فایل کلیک کنید یا فایل را اینجا بکشید</span>
                          </div>
                        )}

                        {field.type === 'signature' && (
                          <div className="border border-gray-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 text-center text-slate-400 flex items-center justify-center gap-2">
                            <PenTool className="w-4 h-4 text-teal-600" />
                            <span>محل امضای دیجیتال کاربر</span>
                          </div>
                        )}

                        {['date', 'time', 'datetime'].includes(field.type) && (
                          <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 text-slate-400">
                            <span>{field.calendarType === 'gregorian' ? 'انتخاب تاریخ میلادی' : 'انتخاب تاریخ خورشیدی (شمسی)'}</span>
                            <Calendar className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Intermediate Drop Zone between fields */}
                    <div
                      onDragOver={e => handleDragOverZone(e, idx + 1)}
                      onDrop={e => handleDropOnZone(e, idx + 1)}
                      className={`transition-all duration-200 rounded-2xl flex items-center justify-center ${
                        dropTargetIndex === idx + 1
                          ? 'h-14 bg-teal-50 dark:bg-teal-950/40 border-2 border-dashed border-teal-500 text-teal-600 dark:text-teal-400 shadow-md font-bold text-xs gap-2'
                          : 'h-2 hover:h-5 opacity-0 hover:opacity-100 bg-teal-500/10 border border-dashed border-teal-300/60 dark:border-teal-700/60'
                      }`}
                    >
                      {dropTargetIndex === idx + 1 && (
                        <>
                          <ArrowDown className="w-4 h-4 animate-bounce" />
                          <span>رها کردن برای افزودن / جابجایی فیلد در موقعیت {idx + 2}</span>
                        </>
                      )}
                    </div>
                  </React.Fragment>
                );
              })
            )}

            {/* Bottom Add Question Button */}
            <div className="pt-2">
              <button
                onClick={() => handleAddField('text', 'متن')}
                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 rounded-3xl text-xs font-black text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 flex items-center justify-center gap-2 transition-all bg-white/50 dark:bg-slate-900/50 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن سوال جدید به این گام</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR: INSPECTOR PROPERTY PANEL */}
      <FormInspectorPanel
        selectedField={selectedField}
        form={form}
        onUpdateField={handleUpdateField}
        onDeleteField={handleDeleteField}
        onDuplicateField={handleDuplicateField}
      />

      {isAddStepDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-5 text-right">
            <div className="flex items-center justify-between gap-3 mb-5">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">افزودن گام جدید</h3>
              <button
                onClick={() => setIsAddStepDialogOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                title="بستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              عنوان گام
            </label>
            <input
              autoFocus
              value={newStepTitle}
              onChange={event => setNewStepTitle(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') handleConfirmAddStep();
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              placeholder="مثال: اطلاعات شخصی"
            />
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setIsAddStepDialogOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                لغو
              </button>
              <button
                onClick={handleConfirmAddStep}
                disabled={!newStepTitle.trim()}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold"
              >
                افزودن گام
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
