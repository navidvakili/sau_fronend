import React, { useState } from 'react';
import {
  Type,
  AlignLeft,
  Hash,
  Mail,
  Phone,
  ListFilter,
  CheckSquare,
  CircleDot,
  Star,
  Table,
  Upload,
  Calendar,
  Layers,
  Plus,
  Trash2,
  Copy,
  Eye,
  Settings2,
  Monitor,
  Tablet,
  Smartphone,
  ChevronDown,
  GripVertical,
  CheckCircle2,
  SlidersHorizontal,
  PenTool,
  HelpCircle,
  Clock,
  MapPin,
  QrCode
} from 'lucide-react';
import { FormDefinition, FormField, FieldType, FormStep } from './types';
import { FormRespondentView } from './FormRespondentView';

interface FormBuilderCanvasProps {
  form: FormDefinition;
  onChange: (updatedForm: FormDefinition) => void;
}

const FIELD_PALETTE: { category: string; items: { type: FieldType; label: string; icon: any }[] }[] = [
  {
    category: 'پایه‌ای و متنی',
    items: [
      { type: 'text', label: 'متن کوتاه', icon: Type },
      { type: 'textarea', label: 'متن چند خطی (توضیحات)', icon: AlignLeft },
      { type: 'number', label: 'عدد / مقادیر عددی', icon: Hash },
      { type: 'email', label: 'ایمیل / پست الکترونیک', icon: Mail },
      { type: 'phone', label: 'شماره تلفن همراه', icon: Phone }
    ]
  },
  {
    category: 'گزینه‌ای و انتخابی',
    items: [
      { type: 'select', label: 'لیست کشویی (Dropdown)', icon: ListFilter },
      { type: 'radio', label: 'تک انتخابی (Radio)', icon: CircleDot },
      { type: 'checkbox', label: 'چند انتخابی (Checkbox)', icon: CheckSquare },
      { type: 'yesno', label: 'بله / خیر', icon: CheckCircle2 },
      { type: 'cascading', label: 'انتخاب وابسته (Cascading)', icon: Layers }
    ]
  },
  {
    category: 'نظرسنجی و پیشرفته',
    items: [
      { type: 'rating', label: 'نمره‌دهی ستاره‌ای', icon: Star },
      { type: 'matrix', label: 'جدول ماتریسی (Likert)', icon: Table },
      { type: 'slider', label: 'اسلایدر بازه‌ای', icon: SlidersHorizontal },
      { type: 'file', label: 'بارگذاری فایل / مدرک', icon: Upload },
      { type: 'signature', label: 'امضای دیجیتال', icon: PenTool }
    ]
  }
];

export const FormBuilderCanvas: React.FC<FormBuilderCanvasProps> = ({ form, onChange }) => {
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    form.fields[0]?.id || null
  );
  const [activeStepId, setActiveStepId] = useState<string>(
    form.steps[0]?.id || 's1'
  );
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isLivePreview, setIsLivePreview] = useState(false);

  const activeField = form.fields.find(f => f.id === selectedFieldId);

  // Add field to form
  const handleAddField = (type: FieldType, label: string) => {
    const newField: FormField = {
      id: `f_${Date.now()}`,
      type,
      label: `سوال جدید ${form.fields.length + 1}: ${label}`,
      placeholder: 'متن راهنما را وارد کنید...',
      stepId: activeStepId,
      columnWidth: '100%',
      validation: { required: false },
      options: ['گزینه ۱', 'گزینه ۲', 'گزینه ۳'].map((lbl, idx) => ({
        id: `opt_${Date.now()}_${idx}`,
        label: lbl,
        value: `val_${idx + 1}`
      }))
    };

    const updatedFields = [...form.fields, newField];
    onChange({ ...form, fields: updatedFields });
    setSelectedFieldId(newField.id);
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

  // Update selected field property
  const handleUpdateActiveField = (key: string, val: any) => {
    if (!selectedFieldId) return;
    const updatedFields = form.fields.map(f => {
      if (f.id === selectedFieldId) {
        return { ...f, [key]: val };
      }
      return f;
    });
    onChange({ ...form, fields: updatedFields });
  };

  // Update field validation property
  const handleUpdateActiveFieldValidation = (key: string, val: any) => {
    if (!selectedFieldId || !activeField) return;
    const updatedValidation = { ...activeField.validation, [key]: val };
    handleUpdateActiveField('validation', updatedValidation);
  };

  // Add step
  const handleAddStep = () => {
    const newStep: FormStep = {
      id: `s_${Date.now()}`,
      title: `گام ${form.steps.length + 1}`,
      order: form.steps.length + 1
    };
    onChange({ ...form, steps: [...form.steps, newStep] });
    setActiveStepId(newStep.id);
  };

  const currentStepFields = form.fields.filter(
    f => f.stepId === activeStepId || (!f.stepId && activeStepId === form.steps[0]?.id)
  );

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-100 dark:bg-slate-950 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
      {/* Top Toolbar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500">حالت نمایشی:</span>
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setIsLivePreview(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !isLivePreview
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              🛠️ ویرایشگر دیداری
            </button>
            <button
              onClick={() => setIsLivePreview(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                isLivePreview
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-teal-600'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> پیش‌نمایش زنده کاربر
            </button>
          </div>
        </div>

        {/* Device Switcher for Preview */}
        {isLivePreview && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {[
              { id: 'desktop', icon: Monitor, label: 'رایانه' },
              { id: 'tablet', icon: Tablet, label: 'تبلت' },
              { id: 'mobile', icon: Smartphone, label: 'موبایل' }
            ].map(d => (
              <button
                key={d.id}
                onClick={() => setPreviewDevice(d.id as any)}
                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                  previewDevice === d.id
                    ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title={d.label}
              >
                <d.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        )}

        <div className="text-xs text-slate-500 font-medium">
          تعداد کل سؤالات: <span className="font-bold text-teal-600">{form.fields.length}</span>
        </div>
      </div>

      {/* Main Studio Body */}
      {isLivePreview ? (
        <div className="flex-1 overflow-y-auto p-6 bg-slate-200/60 dark:bg-slate-950 flex justify-center">
          <div
            className={`transition-all duration-300 w-full ${
              previewDevice === 'mobile'
                ? 'max-w-sm'
                : previewDevice === 'tablet'
                ? 'max-w-xl'
                : 'max-w-3xl'
            }`}
          >
            <FormRespondentView form={form} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Palette Sidebar */}
          <div className="w-64 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 overflow-y-auto p-4 space-y-6">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              مخزن اجزا و المان‌ها
            </h3>

            {FIELD_PALETTE.map((cat, idx) => (
              <div key={idx} className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {cat.category}
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {cat.items.map(item => (
                    <button
                      key={item.type}
                      onClick={() => handleAddField(item.type, item.label)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all text-right group"
                    >
                      <item.icon className="w-4 h-4 text-slate-400 group-hover:text-teal-600 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Center Canvas */}
          <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950/40 overflow-hidden">
            {/* Step Tabs Bar */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center gap-2 overflow-x-auto shrink-0">
              {form.steps.map(step => (
                <button
                  key={step.id}
                  onClick={() => setActiveStepId(step.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeStepId === step.id
                      ? 'bg-teal-50 border border-teal-500 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{step.title}</span>
                  <span className="w-4 h-4 bg-teal-200 dark:bg-teal-900 text-teal-800 dark:text-teal-200 text-[10px] rounded-full flex items-center justify-center font-mono">
                    {form.fields.filter(f => f.stepId === step.id).length}
                  </span>
                </button>
              ))}

              <button
                onClick={handleAddStep}
                className="px-3 py-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-teal-600 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> افزودن گام جدید
              </button>
            </div>

            {/* Questions List Canvas */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {currentStepFields.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-8">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400 flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                    هیچ سوالی در این گام وجود ندارد
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    از پنل سمت راست روی کامپوننت دلخواه کلیک کنید تا به فرم اضافه شود.
                  </p>
                </div>
              ) : (
                currentStepFields.map((field, idx) => {
                  const isSelected = selectedFieldId === field.id;

                  return (
                    <div
                      key={field.id}
                      onClick={() => setSelectedFieldId(field.id)}
                      className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'border-2 border-teal-500 shadow-md ring-2 ring-teal-500/10'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-400 cursor-grab" />
                          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-md">
                            سوال {idx + 1}
                          </span>
                          <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                            {field.label}
                          </h4>
                          {field.validation?.required && (
                            <span className="text-xs text-red-500 font-bold">* ضروری</span>
                          )}
                        </div>

                        {/* Quick actions */}
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDuplicateField(field);
                            }}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700"
                            title="کپی سؤال"
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

                      {/* Input visual simulation */}
                      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-400">
                        {field.type === 'text' && (
                          <span>[ ورودی متنی تک‌خطی - {field.placeholder} ]</span>
                        )}
                        {field.type === 'textarea' && <span>[ کادر توضیحات چندخطی ]</span>}
                        {field.type === 'select' && <span>[ لیست کشویی با گزینه‌های متعدد ]</span>}
                        {field.type === 'rating' && (
                          <div className="flex gap-1 text-amber-400">
                            <Star className="w-4 h-4 fill-amber-400" />
                            <Star className="w-4 h-4 fill-amber-400" />
                            <Star className="w-4 h-4 fill-amber-400" />
                            <Star className="w-4 h-4 text-slate-300" />
                            <Star className="w-4 h-4 text-slate-300" />
                          </div>
                        )}
                        {field.type === 'matrix' && <span>[ جدول ماتریسی طیف لیکرت ]</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Field Inspector Sidebar */}
          <div className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 overflow-y-auto p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Settings2 className="w-4 h-4 text-teal-600" />
              <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                تنظیمات فیلد انتخاب شده
              </h3>
            </div>

            {activeField ? (
              <div className="space-y-4 text-xs">
                {/* Title & Label */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان و صورت سوال:
                  </label>
                  <input
                    type="text"
                    value={activeField.label}
                    onChange={e => handleUpdateActiveField('label', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Placeholder */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    متن راهنما (Placeholder):
                  </label>
                  <input
                    type="text"
                    value={activeField.placeholder || ''}
                    onChange={e => handleUpdateActiveField('placeholder', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Column width */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عرض نمایش در صفحه (تعداد ستون):
                  </label>
                  <select
                    value={activeField.columnWidth || '100%'}
                    onChange={e => handleUpdateActiveField('columnWidth', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="100%">۱۰۰٪ (تمام عرض - تک ستونه)</option>
                    <option value="50%">۵۰٪ (نیم عرض - ۲ ستونه)</option>
                    <option value="33%">۳۳٪ (یک‌سوم - ۳ ستونه)</option>
                  </select>
                </div>

                {/* Validation - Required */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeField.validation?.required || false}
                      onChange={e => handleUpdateActiveFieldValidation('required', e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      پاسخ به این سوال الزامی است (Required)
                    </span>
                  </label>
                </div>

                {/* Points / Quiz Scoring */}
                {form.quizConfig.isQuiz && (
                  <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-2">
                    <label className="block font-bold text-indigo-900 dark:text-indigo-200">
                      نمره این سوال در آزمون:
                    </label>
                    <input
                      type="number"
                      value={activeField.points || 0}
                      onChange={e => handleUpdateActiveField('points', Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-indigo-300 dark:border-indigo-700 rounded-lg bg-white dark:bg-slate-800 font-bold"
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">
                یک فیلد را انتخاب کنید تا تنظیمات آن را مشاهده کنید.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
