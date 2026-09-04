// ============================================================
// VisualDataEditor — ویرایشگر بصریِ داده‌های یک گروه آموزشی (نسخهٔ نهایی):
// خودِ بومِ واقعی Page Builder (Canvas.tsx) در «حالت محدود» رندر می‌شود — همان چیدمان/استایلی
// که طراح ساخته، بدون امکان تغییر ساختار (drag/افزودن/حذف/جابه‌جایی بلوک). کلیک روی هر بلوک
// دادهٔ‌محور، یک پاپ‌آور کوچک درست کنار همان بلوک (روی خودِ بوم) باز می‌کند — بدون سایدبار
// جداگانه — که فقط ورودی‌های متصل به فیلد واقعیِ گروه را نشان می‌دهد.
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Save, LayoutTemplate, ArrowRight, AlertCircle, Sparkles, Plus, Trash2, Check, X } from 'lucide-react';
import type { AcademicDepartmentItem, AcademicFieldItem, PersonItem, InfoFileItem } from '@/src/shared-types';
import {
  fetchDepartmentById,
  updateDepartment,
  createDepartmentFile,
  updateDepartmentFile,
  deleteDepartmentFile,
} from './api';
import { fetchFields, createField, updateField, deleteField } from '../fields/api';
import { fetchPeople } from '../people/api';
import { getSmartPageForDedicatedPageType, fetchSmartPage } from '../page-builder/api';
import { Canvas } from '../page-builder/Canvas';
import { getColumnBlocks, type SmartPageSchema, type SectionInstance, type WidgetInstance } from '../page-builder/builderTypes';
import ToastNotification from '@/src/shared-components/ToastNotification';
import LinkLayoutDialog from '../dedicated_pages/LinkLayoutDialog';

interface VisualDataEditorProps {
  departmentId: number;
  onBack: () => void;
  onSaved: () => void;
  /** بازگشت به فرم تخت سنتی (مثلاً وقتی هنوز قالبی متصل نیست) */
  onUseFlatForm: () => void;
  onOpenTab?: (id: string, title: string, iconName: string, forceNewInstance?: boolean, initialProps?: Record<string, any>) => void;
}

interface TokenFieldMeta {
  label: string;
  formKey: string;
}

/** نگاشتِ توکن {{...}} در قالب Page-Builder → فیلد واقعیِ گروه آموزشی — قرارداد رسمیِ
 *  «کدام توکن به کدام ستون واقعی وصل است»؛ هم دکمهٔ «درج متغیر» (فاز ۵) و هم این ویرایشگر
 *  از همین یک نگاشت می‌خوانند — منبع حقیقت واحد. */
export const TOKEN_FIELD_MAP: Record<string, TokenFieldMeta> = {
  name: { label: 'نام گروه', formKey: 'name' },
  faculty: { label: 'دانشکده', formKey: 'faculty' },
  description: { label: 'توضیحات گروه', formKey: 'description' },
  headName: { label: 'نام مدیر گروه', formKey: 'head_name' },
  headTitle: { label: 'عنوان مدیر گروه', formKey: 'head_title' },
  headPhone: { label: 'تلفن مدیر گروه', formKey: 'head_phone' },
  headInternal: { label: 'داخلی مدیر گروه', formKey: 'head_internal' },
  headEmail: { label: 'ایمیل مدیر گروه', formKey: 'head_email' },
  expertName: { label: 'نام کارشناس گروه', formKey: 'expert_name' },
  expertPhone: { label: 'تلفن کارشناس گروه', formKey: 'expert_phone' },
  expertInternal: { label: 'داخلی کارشناس گروه', formKey: 'expert_internal' },
  expertEmail: { label: 'ایمیل کارشناس گروه', formKey: 'expert_email' },
  office: { label: 'اتاق گروه', formKey: 'office' },
  email: { label: 'ایمیل گروه', formKey: 'email' },
  phone: { label: 'تلفن گروه', formKey: 'phone' },
};

const EMPTY_SCALAR_FORM: Record<string, string> = {
  name: '', faculty: '', description: '',
  head_name: '', head_title: '', head_phone: '', head_internal: '', head_email: '',
  expert_name: '', expert_phone: '', expert_internal: '', expert_email: '',
  office: '', email: '', phone: '',
};

const DEPT_TOKEN_RE = /\{\{(\w+)\}\}/g;
const DEPT_WIDGET_TYPES = new Set(['dept-fields', 'dept-instructors', 'dept-files']);
const POPOVER_WIDTH = 360;
const POPOVER_MAX_HEIGHT = 440;

/** توکن‌های شناخته‌شدهٔ داخل محتوای یک ویجت متنی (heading/text/accordion) */
const knownTokensInWidget = (widget: WidgetInstance): string[] => {
  if (widget.type !== 'heading' && widget.type !== 'text' && widget.type !== 'accordion') return [];
  const content = widget.content || '';
  const found: string[] = [];
  let m: RegExpExecArray | null;
  DEPT_TOKEN_RE.lastIndex = 0;
  while ((m = DEPT_TOKEN_RE.exec(content))) {
    if (!found.includes(m[1]) && m[1] in TOKEN_FIELD_MAP) found.push(m[1]);
  }
  return found;
};

const isWidgetEditable = (widget: WidgetInstance): boolean =>
  DEPT_WIDGET_TYPES.has(widget.type) || knownTokensInWidget(widget).length > 0;

/** جست‌وجوی بازگشتیِ یک ویجت با شناسه در همهٔ سکشن‌ها/زیربلوک‌ها */
const findWidgetById = (sections: SectionInstance[], widgetId: string): WidgetInstance | null => {
  for (const sec of sections) {
    for (const col of sec.columns) {
      for (const block of getColumnBlocks(col)) {
        if (block.kind === 'widget') {
          if (block.widget.id === widgetId) return block.widget;
        } else {
          const found = findWidgetById([block.section], widgetId);
          if (found) return found;
        }
      }
    }
  }
  return null;
};

export default function VisualDataEditor({ departmentId, onBack, onSaved, onUseFlatForm, onOpenTab }: VisualDataEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [department, setDepartment] = useState<AcademicDepartmentItem | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // ===== قالب لایوت متصل (اگر باشد) =====
  const [layoutLinked, setLayoutLinked] = useState(false);
  const [layoutSchema, setLayoutSchema] = useState<SmartPageSchema | null>(null);
  const [showLayoutDialog, setShowLayoutDialog] = useState(false);

  // ===== دادهٔ اسکالر گروه =====
  const [scalarForm, setScalarForm] = useState<Record<string, string>>(EMPTY_SCALAR_FORM);
  const [imageUrl, setImageUrl] = useState('');
  const [instructorIds, setInstructorIds] = useState<number[]>([]);
  const [instructorPool, setInstructorPool] = useState<PersonItem[]>([]);
  const [fieldsList, setFieldsList] = useState<AcademicFieldItem[]>([]);
  const [filesList, setFilesList] = useState<InfoFileItem[]>([]);

  // ===== انتخاب فعلی در بوم + پاپ‌آور ویرایش کنار همان بلوک =====
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const lastClickPosRef = useRef({ x: 0, y: 0 });
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const dept = await fetchDepartmentById(departmentId);
      setDepartment(dept);
      setScalarForm({
        name: dept.name || '', faculty: dept.faculty || '', description: dept.description || '',
        head_name: dept.headName || '', head_title: dept.headTitle || '', head_phone: dept.headPhone || '',
        head_internal: dept.headInternal || '', head_email: dept.headEmail || '',
        expert_name: dept.expertName || '', expert_phone: dept.expertPhone || '', expert_internal: dept.expertInternal || '',
        expert_email: dept.expertEmail || '', office: dept.office || '', email: dept.email || '', phone: dept.phone || '',
      });
      setImageUrl(dept.image_url || '');
      setInstructorIds((dept.instructors || []).map((i) => i.id));
      setFilesList(dept.infoFiles || []);

      const linkedLayout = await getSmartPageForDedicatedPageType('academic_department');
      if (linkedLayout && linkedLayout.status === 'published') {
        const full = await fetchSmartPage(linkedLayout.id);
        const schema = (full.schema ?? {}) as unknown as SmartPageSchema;
        const merged: SmartPageSchema = {
          ...schema,
          id: `page-${full.id}`,
          title: full.title ?? schema.title ?? 'قالب گروه آموزشی',
          slug: full.slug ?? schema.slug,
          status: full.status ?? schema.status ?? 'draft',
        };
        setLayoutSchema(merged);
        setLayoutLinked(true);
        setSelectedSectionId(merged.sections?.[0]?.id ?? null);
        setSelectedColumnId(merged.sections?.[0]?.columns?.[0]?.id ?? null);
        setSelectedWidgetId(null);
      } else {
        setLayoutSchema(null);
        setLayoutLinked(false);
      }

      const [faculty, visiting, fields] = await Promise.all([
        fetchPeople({ type: 'faculty_member', per_page: 500 }),
        fetchPeople({ type: 'visiting_professor', per_page: 500 }),
        fetchFields({ department_id: departmentId, per_page: 200 }),
      ]);
      const seenP = new Set<number>();
      const mergedPeople: PersonItem[] = [];
      [...(faculty?.data || []), ...(visiting?.data || [])].forEach((p) => {
        if (!seenP.has(p.id)) { seenP.add(p.id); mergedPeople.push(p); }
      });
      setInstructorPool(mergedPeople);
      setFieldsList(fields.data || []);
    } catch (err: any) {
      setToast({ text: err.message || 'خطا در بارگذاری اطلاعات گروه', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [departmentId]);

  const variables = useMemo(
    () => Object.fromEntries(Object.entries(TOKEN_FIELD_MAP).map(([token, meta]) => [token, scalarForm[meta.formKey] || ''])),
    [scalarForm]
  );

  const selectedWidget = useMemo(
    () => (layoutSchema && selectedWidgetId ? findWidgetById(layoutSchema.sections, selectedWidgetId) : null),
    [layoutSchema, selectedWidgetId]
  );

  // ===== باز/بسته‌کردن پاپ‌آور =====
  const closePopover = () => { setPopoverPos(null); setSelectedWidgetId(null); };

  const handleSelectWidget = (widgetId: string) => {
    const widget = layoutSchema ? findWidgetById(layoutSchema.sections, widgetId) : null;
    if (!widget || !isWidgetEditable(widget)) {
      setSelectedWidgetId(null);
      setPopoverPos(null);
      return;
    }
    setSelectedWidgetId(widgetId);
    const raw = lastClickPosRef.current;
    const x = Math.min(Math.max(8, raw.x), window.innerWidth - POPOVER_WIDTH - 8);
    const y = Math.min(Math.max(8, raw.y), window.innerHeight - 80);
    setPopoverPos({ x, y });
  };

  const handleSelectColumn = (columnId: string) => {
    setSelectedColumnId(columnId);
    // کلیک روی فضای خالی ستون (نه یک ویجت قابل‌ویرایش) → پاپ‌آور بسته شود
    setPopoverPos(null);
    setSelectedWidgetId(null);
  };

  // بستن پاپ‌آور با کلیک بیرون از بوم/پاپ‌آور (مثلاً روی هدر)
  useEffect(() => {
    if (!popoverPos) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (canvasWrapRef.current?.contains(target)) return;
      closePopover();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popoverPos]);

  // ===== رشته‌های تحصیلی — افزودن/حذف بلافاصله API واقعی؛ ویرایش نام/مدیر در «ذخیره» دسته‌ای =====
  const handleFieldChange = (id: number, patch: Partial<AcademicFieldItem>) => {
    setFieldsList((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };
  const handleCreateField = async () => {
    try {
      const res = await createField({ department_id: departmentId, name: 'رشتهٔ جدید', status: 'published' });
      setFieldsList((prev) => [...prev, res.data]);
    } catch (err: any) {
      setToast({ text: err.message || 'خطا در افزودن رشته', type: 'error' });
    }
  };
  const handleDeleteField = async (id: number) => {
    try {
      await deleteField(id);
      setFieldsList((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      setToast({ text: err.message || 'خطا در حذف رشته', type: 'error' });
    }
  };

  // ===== فایل‌های اطلاعاتی — همان الگو (academic_department_files، رکورد واقعی) =====
  const handleFileChange = (index: number, patch: Partial<InfoFileItem>) => {
    setFilesList((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };
  const handleCreateFile = async () => {
    try {
      const res = await createDepartmentFile({ department_id: departmentId, title: 'فایل جدید', url: '#' });
      setFilesList((prev) => [...prev, { id: res.data.id, title: res.data.title || '', url: res.data.url }]);
    } catch (err: any) {
      setToast({ text: err.message || 'خطا در افزودن فایل', type: 'error' });
    }
  };
  const handleDeleteFile = async (index: number) => {
    const file = filesList[index];
    if (!file) return;
    try {
      if (file.id) await deleteDepartmentFile(file.id);
      setFilesList((prev) => prev.filter((_, i) => i !== index));
    } catch (err: any) {
      setToast({ text: err.message || 'خطا در حذف فایل', type: 'error' });
    }
  };

  const handleToggleInstructor = (id: number) => {
    setInstructorIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleScalarChange = (formKey: string, value: string) => {
    setScalarForm((prev) => ({ ...prev, [formKey]: value }));
  };

  /** ذخیرهٔ همهٔ تغییرات — فیلدهای اسکالر گروه از طریق updateDepartment، رشته‌ها و فایل‌ها
   *  هرکدام از طریق APIِ رکورد واقعی خودشان — طبق تصمیم «انتشار فوری»، اگر گروه از قبل
   *  published باشد این بلافاصله روی سایت عمومی هم اثر می‌گذارد. */
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDepartment(departmentId, {
        name: scalarForm.name,
        faculty: scalarForm.faculty || null,
        description: scalarForm.description || null,
        head_name: scalarForm.head_name || null,
        head_title: scalarForm.head_title || null,
        head_phone: scalarForm.head_phone || null,
        head_internal: scalarForm.head_internal || null,
        head_email: scalarForm.head_email || null,
        expert_name: scalarForm.expert_name || null,
        expert_phone: scalarForm.expert_phone || null,
        expert_internal: scalarForm.expert_internal || null,
        expert_email: scalarForm.expert_email || null,
        office: scalarForm.office || null,
        email: scalarForm.email || null,
        phone: scalarForm.phone || null,
        image_url: imageUrl || null,
        instructor_ids: instructorIds,
        status: department?.status || 'draft',
      });

      await Promise.all([
        ...fieldsList.map((f) =>
          updateField(f.id, {
            name: f.name,
            department_id: departmentId,
            manager_name: f.managerName || null,
            manager_phone: f.managerPhone || null,
            manager_internal: f.managerInternal || null,
            status: f.status,
          })
        ),
        ...filesList.map((f) => (f.id ? updateDepartmentFile(f.id, { title: f.title, url: f.url }) : Promise.resolve())),
      ]);

      setToast({ text: 'اطلاعات گروه با موفقیت ذخیره شد.', type: 'success' });
      onSaved();
    } catch (err: any) {
      setToast({ text: err.message || 'خطا در ذخیرهٔ اطلاعات', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!department) return null;

  const inputCls = 'w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500';

  return (
    <div className="flex flex-col h-full">
      <ToastNotification toast={toast} />

      {/* Header — هم‌سبک با هدر صفحه‌ساز (page-builder) */}
      <header className="h-16 px-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-xs rounded-t-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="بازگشت به فهرست گروه‌ها"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 dark:text-white">{department.name}</div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="px-1.5 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/20">
                  ویرایشگر بصری
                </span>
                <span>روی هر بخش کلیک کنید تا همان‌جا ویرایشش کنید</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLayoutDialog(true)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title={layoutLinked ? 'تغییر قالب' : 'اتصال قالب'}
          >
            <LayoutTemplate className="w-4 h-4 text-indigo-500" />
          </button>
          <button
            onClick={onUseFlatForm}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            فرم کامل
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white dark:text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>ذخیره تغییرات</span>
          </button>
        </div>
      </header>

      {!layoutLinked || !layoutSchema ? (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-5 flex items-start gap-3 m-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-black text-amber-800 dark:text-amber-300">هنوز قالبی برای صفحهٔ گروه‌های آموزشی متصل نشده</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              می‌توانید از دکمهٔ اتصال قالب یک صفحهٔ Page Builder را طراحی/انتخاب کنید، یا فعلاً از «فرم کامل» برای ثبت اطلاعات استفاده کنید.
            </p>
          </div>
        </div>
      ) : (
        <div
          ref={canvasWrapRef}
          className="flex-1 min-h-0 overflow-hidden"
          onClickCapture={(e) => { lastClickPosRef.current = { x: e.clientX, y: e.clientY }; }}
        >
          <Canvas
            pageSchema={layoutSchema}
            pageId={null}
            pageSlug={department.slug}
            activeBreakpoint="desktop"
            selectedSectionId={selectedSectionId}
            selectedColumnId={selectedColumnId}
            selectedWidgetId={selectedWidgetId}
            currentUserRole="all"
            onSelectSection={setSelectedSectionId}
            onSelectColumn={handleSelectColumn}
            onSelectWidget={handleSelectWidget}
            onAddWidget={() => {}}
            onAddSection={() => {}}
            onDeleteSection={() => {}}
            onDeleteWidget={() => {}}
            onMoveWidget={() => {}}
            restrictedMode
            isWidgetEditable={isWidgetEditable}
            variables={variables}
            departmentFields={fieldsList}
            departmentInstructors={instructorPool.filter((p) => instructorIds.includes(p.id))}
            departmentInfoFiles={filesList}
          />
        </div>
      )}

      {/* پاپ‌آور ویرایش محتوا — درست کنار بلوک کلیک‌شده، روی خودِ بوم (بدون سایدبار) */}
      {popoverPos && selectedWidget && (
        <div
          ref={popoverRef}
          className="fixed z-50 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl flex flex-col select-none rtl text-right"
          style={{ left: popoverPos.x, top: popoverPos.y, width: POPOVER_WIDTH, maxHeight: POPOVER_MAX_HEIGHT }}
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-slate-800 shrink-0">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">
              {selectedWidget.type === 'dept-fields' ? 'رشته‌های تحصیلی گروه'
                : selectedWidget.type === 'dept-instructors' ? 'اساتید مدعو شاخص گروه'
                : selectedWidget.type === 'dept-files' ? 'فایل‌های اطلاعاتی گروه'
                : 'ویرایش محتوا'}
            </h4>
            <button onClick={closePopover} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-3 overflow-y-auto">
            {selectedWidget.type === 'dept-fields' ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{fieldsList.length} رشته</label>
                  <button
                    type="button"
                    onClick={handleCreateField}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white text-[10px] font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    افزودن رشته
                  </button>
                </div>
                {fieldsList.length === 0 && (
                  <p className="text-[11px] text-slate-400">هنوز رشته‌ای زیر این گروه ثبت نشده است.</p>
                )}
                {fieldsList.map((f) => (
                  <div key={f.id} className="rounded-xl border border-gray-200 dark:border-slate-800 p-2.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={f.name}
                        onChange={(e) => handleFieldChange(f.id, { name: e.target.value })}
                        placeholder="نام رشته"
                        className={`flex-1 ${inputCls} font-bold`}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteField(f.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white cursor-pointer shrink-0"
                        title="حذف رشته"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={f.managerName || ''}
                      onChange={(e) => handleFieldChange(f.id, { managerName: e.target.value })}
                      placeholder="نام مدیر رشته"
                      className={inputCls}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={f.managerPhone || ''}
                        onChange={(e) => handleFieldChange(f.id, { managerPhone: e.target.value })}
                        placeholder="تلفن"
                        className={inputCls}
                      />
                      <input
                        type="text"
                        value={f.managerInternal || ''}
                        onChange={(e) => handleFieldChange(f.id, { managerInternal: e.target.value })}
                        placeholder="داخلی"
                        className={inputCls}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedWidget.type === 'dept-instructors' ? (
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {instructorIds.length} انتخاب شده
                </label>
                {instructorPool.length === 0 ? (
                  <p className="text-[11px] text-slate-400">هیچ عضوی از نوع هیات علمی یا استاد مدعو یافت نشد.</p>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-auto pr-1">
                    {instructorPool.map((p) => {
                      const selected = instructorIds.includes(p.id);
                      const label = [p.title, p.firstName, p.lastName].filter(Boolean).join(' ') || `#${p.id}`;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleToggleInstructor(p.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-right transition-colors cursor-pointer border ${
                            selected
                              ? 'bg-emerald-500/10 border-emerald-400 text-emerald-700 dark:text-emerald-400'
                              : 'bg-slate-50 dark:bg-slate-950 border-transparent text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <Check className={`w-3.5 h-3.5 shrink-0 ${selected ? 'opacity-100' : 'opacity-0'}`} />
                          <span className="truncate">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : selectedWidget.type === 'dept-files' ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">فایل‌های اطلاعاتی گروه</label>
                  <button
                    type="button"
                    onClick={handleCreateFile}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white text-[10px] font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    افزودن فایل
                  </button>
                </div>
                {filesList.length === 0 && (
                  <p className="text-[11px] text-slate-400">موردی ثبت نشده است.</p>
                )}
                {filesList.map((file, i) => (
                  <div key={file.id ?? i} className="space-y-1.5">
                    <input
                      type="text"
                      value={file.title}
                      onChange={(e) => handleFileChange(i, { title: e.target.value })}
                      placeholder="عنوان فایل"
                      className={inputCls}
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={file.url}
                        onChange={(e) => handleFileChange(i, { url: e.target.value })}
                        placeholder="آدرس فایل"
                        className={`flex-1 ${inputCls}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteFile(i)}
                        className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white cursor-pointer shrink-0"
                        title="حذف فایل"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {knownTokensInWidget(selectedWidget).map((token) => {
                  const meta = TOKEN_FIELD_MAP[token];
                  const isTextarea = token === 'description';
                  return (
                    <div key={token} className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{meta.label}</label>
                      {isTextarea ? (
                        <textarea
                          rows={4}
                          value={scalarForm[meta.formKey] || ''}
                          onChange={(e) => handleScalarChange(meta.formKey, e.target.value)}
                          className={`${inputCls} leading-relaxed`}
                        />
                      ) : (
                        <input
                          type="text"
                          value={scalarForm[meta.formKey] || ''}
                          onChange={(e) => handleScalarChange(meta.formKey, e.target.value)}
                          className={inputCls}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {showLayoutDialog && (
        <LinkLayoutDialog
          pageType="academic_department"
          pageTypeLabel="گروه آموزشی"
          onClose={() => { setShowLayoutDialog(false); load(); }}
          onOpenBuilder={(smartPageId) => {
            setShowLayoutDialog(false);
            onOpenTab?.('page-builder', 'صفحه‌ساز هوشمند', 'LayoutTemplate', false, { initialPageId: smartPageId });
          }}
        />
      )}
    </div>
  );
}
