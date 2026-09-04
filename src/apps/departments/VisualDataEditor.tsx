// ============================================================
// VisualDataEditor — ویرایشگر بصریِ داده‌های یک گروه آموزشی (نسخهٔ نهایی):
// خودِ بومِ واقعی Page Builder (Canvas.tsx) در «حالت محدود» رندر می‌شود — همان چیدمان/استایلی
// که طراح ساخته، بدون امکان تغییر ساختار (drag/افزودن/حذف/جابه‌جایی بلوک) و شبیه خروجی واقعی
// سایت (بدون خط‌چین/دستگیرهٔ جابه‌جایی). فقط کنار بخش‌های داده‌محور یک آیکون ویرایش کوچک
// دیده می‌شود؛ کلیک روی آن یا یک پاپ‌آور کوچک کنار همان بلوک (برای فیلدهای متنی) یا یک دیالوگ
// کامل (برای فهرست رکوردها: رشته‌ها/مدرسان/فایل‌ها/دستهٔ خبری) باز می‌کند.
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Loader2, Save, LayoutTemplate, ArrowRight, AlertCircle, Sparkles, Plus, Trash2, Check, X,
  Settings2, Link2, Newspaper, CheckCircle2, FolderOpen, FileText,
} from 'lucide-react';
import type { AcademicDepartmentItem, AcademicFieldItem, PersonItem, InfoFileItem, NewsCategory } from '@/src/shared-types';
import {
  fetchDepartmentById,
  updateDepartment,
  createDepartmentFile,
  updateDepartmentFile,
  deleteDepartmentFile,
} from './api';
import { fetchFields, createField, updateField, deleteField } from '../fields/api';
import { fetchPeople } from '../people/api';
import { fetchCategories } from '../news/api';
import { getSmartPageForDedicatedPageType, fetchSmartPage } from '../page-builder/api';
import { Canvas } from '../page-builder/Canvas';
import { getColumnBlocks, type SmartPageSchema, type SectionInstance, type WidgetInstance } from '../page-builder/builderTypes';
import ToastNotification from '@/src/shared-components/ToastNotification';
import MediaManager from '@/src/shared-components/MediaManager';
import LinkLayoutDialog from '../dedicated_pages/LinkLayoutDialog';
import { ConfirmDialog } from '@/src/shared-components/ConfirmDialog';
import { useLanguage } from '@/src/shared-utils/LanguageContext';

interface VisualDataEditorProps {
  departmentId: number;
  onBack: () => void;
  onSaved: () => void;
  /** بازگشت به فرم تخت سنتی (مثلاً وقتی هنوز قالبی متصل نیست) */
  onUseFlatForm: () => void;
  onOpenTab?: (id: string, title: string, iconName: string, forceNewInstance?: boolean, initialProps?: Record<string, any>) => void;
  /** مجوز انتشار (departments.approve) — بدون آن، وضعیت همیشه پیش‌نویس ذخیره می‌شود */
  canApprove?: boolean;
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

/** ویجت «اخبار گروه» — news-feed با فیلتر دستهٔ خبریِ همین گروه (طبق فاز ۳) */
const isDeptNewsWidget = (widget: WidgetInstance): boolean =>
  widget.type === 'news-feed' && widget.settings?.binding?.categoryFilter === 'current-department';

interface ImageTokenMeta {
  label: string;
  stateKey: 'imageUrl' | 'headImageUrl' | 'expertImageUrl';
}

/** نگاشتِ توکنِ imageUrl یک ویجت image → فیلد واقعیِ گروه — همان قرارداد {{token}} که برای
 *  متن استفاده می‌شود، این‌بار روی فیلد imageUrl (نه content) */
const IMAGE_TOKEN_MAP: Record<string, ImageTokenMeta> = {
  image: { label: 'تصویر گروه', stateKey: 'imageUrl' },
  headImage: { label: 'تصویر مدیر گروه', stateKey: 'headImageUrl' },
  expertImage: { label: 'تصویر کارشناس گروه', stateKey: 'expertImageUrl' },
};

const IMAGE_TOKEN_RE = /^\{\{(\w+)\}\}$/;

/** اگر این ویجت یک تصویر متصل به فیلد واقعی گروه باشد، نام توکنش را برمی‌گرداند؛ وگرنه null */
const imageTokenOf = (widget: WidgetInstance): string | null => {
  if (widget.type !== 'image') return null;
  const m = IMAGE_TOKEN_RE.exec(widget.imageUrl || '');
  return m && m[1] in IMAGE_TOKEN_MAP ? m[1] : null;
};

const isDeptImageWidget = (widget: WidgetInstance): boolean => imageTokenOf(widget) !== null;

const isWidgetEditable = (widget: WidgetInstance): boolean =>
  DEPT_WIDGET_TYPES.has(widget.type) ||
  isDeptNewsWidget(widget) ||
  isDeptImageWidget(widget) ||
  knownTokensInWidget(widget).length > 0;

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

type ListDialogKind = 'fields' | 'instructors' | 'files' | 'news' | null;

export default function VisualDataEditor({ departmentId, onBack, onSaved, onUseFlatForm, onOpenTab, canApprove = false }: VisualDataEditorProps) {
  const { currentLang } = useLanguage();
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
  const [headImageUrl, setHeadImageUrl] = useState('');
  const [expertImageUrl, setExpertImageUrl] = useState('');
  const [instructorIds, setInstructorIds] = useState<number[]>([]);
  const [instructorPool, setInstructorPool] = useState<PersonItem[]>([]);
  const [instructorPoolLoaded, setInstructorPoolLoaded] = useState(false);
  const [instructorPoolLoading, setInstructorPoolLoading] = useState(false);
  const [fieldsList, setFieldsList] = useState<AcademicFieldItem[]>([]);
  const [filesList, setFilesList] = useState<InfoFileItem[]>([]);
  const [newsCategoryId, setNewsCategoryId] = useState<number | null>(null);
  const [newsCategories, setNewsCategories] = useState<NewsCategory[]>([]);
  const [statusChoice, setStatusChoice] = useState<'published' | 'draft'>('draft');

  // ===== انتخاب فعلی در بوم + پاپ‌آور ویرایش کنار همان بلوک (فقط برای فیلدهای متنی) =====
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const lastClickPosRef = useRef({ x: 0, y: 0 });
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);

  // ===== دیالوگ‌های کامل برای فهرست رکوردها (رشته‌ها/مدرسان/فایل‌ها/دستهٔ خبری) =====
  const [activeDialog, setActiveDialog] = useState<ListDialogKind>(null);

  // ===== دیالوگ تنظیمات نشانی (slug) =====
  const [showSlugDialog, setShowSlugDialog] = useState(false);
  const [slugDraft, setSlugDraft] = useState('');
  const [savingSlug, setSavingSlug] = useState(false);

  // ===== انتخاب تصویر (گروه/مدیر/کارشناس) از رسانه — pendingImageToken مشخص می‌کند کدام فیلد =====
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [pendingImageToken, setPendingImageToken] = useState<string | null>(null);

  // ===== انتخاب فایل اطلاعاتی گروه از رسانه (ز) — pendingFileIndex مشخص می‌کند کدام ردیف =====
  const [showFileMediaSelector, setShowFileMediaSelector] = useState(false);
  const [pendingFileIndex, setPendingFileIndex] = useState<number | null>(null);

  // ===== هشدار خروج بدون ذخیره — همانند صفحه‌ساز =====
  const [isDirty, setIsDirty] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const skipDirtyRef = useRef(true);

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
      setHeadImageUrl(dept.headImageUrl || '');
      setExpertImageUrl(dept.expertImageUrl || '');
      setInstructorIds((dept.instructors || []).map((i) => i.id));
      setFilesList(dept.infoFiles || []);
      setNewsCategoryId(dept.newsCategoryId ?? null);
      setStatusChoice(dept.status || 'draft');

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

      const [fields, categories] = await Promise.all([
        fetchFields({ department_id: departmentId, per_page: 200 }),
        fetchCategories(currentLang).catch(() => ({ data: [] as NewsCategory[] })),
      ]);
      setFieldsList(fields.data || []);
      setNewsCategories(categories.data || []);
      skipDirtyRef.current = true;
      setIsDirty(false);
    } catch (err: any) {
      setToast({ text: err.message || 'خطا در بارگذاری اطلاعات گروه', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [departmentId]);

  // ردیابی تغییرات ذخیره‌نشده — هر تغییری در دادهٔ اسکالر/تصاویر/مدرسان/رشته‌ها/فایل‌ها/دستهٔ
  // خبری/وضعیت انتشار، بعد از بارگذاری اولیه، dirty را true می‌کند؛ با ذخیره یا بارگذاری مجدد ریست می‌شود
  useEffect(() => {
    if (skipDirtyRef.current) { skipDirtyRef.current = false; return; }
    setIsDirty(true);
  }, [scalarForm, imageUrl, headImageUrl, expertImageUrl, instructorIds, fieldsList, filesList, newsCategoryId, statusChoice]);

  /** فهرست مدرسان — سنگین است (تا ۵۰۰ نفر)، پس فقط وقتی دیالوگ «مدرسان» واقعاً باز می‌شود
   *  بارگذاری می‌شود، نه هنگام باز شدن ویرایشگر (طبق درخواست: بدون دادهٔ پیش‌فرض/اضافه) */
  const ensureInstructorPoolLoaded = async () => {
    if (instructorPoolLoaded || instructorPoolLoading) return;
    setInstructorPoolLoading(true);
    try {
      const [faculty, visiting] = await Promise.all([
        fetchPeople({ type: 'faculty_member', per_page: 500 }),
        fetchPeople({ type: 'visiting_professor', per_page: 500 }),
      ]);
      const seen = new Set<number>();
      const merged: PersonItem[] = [];
      [...(faculty?.data || []), ...(visiting?.data || [])].forEach((p) => {
        if (!seen.has(p.id)) { seen.add(p.id); merged.push(p); }
      });
      setInstructorPool(merged);
      setInstructorPoolLoaded(true);
    } catch (err: any) {
      setToast({ text: err.message || 'خطا در بارگذاری فهرست اساتید', type: 'error' });
    } finally {
      setInstructorPoolLoading(false);
    }
  };

  const variables = useMemo(
    () => {
      const imageValues: Record<string, string> = { imageUrl, headImageUrl, expertImageUrl };
      return {
        ...Object.fromEntries(Object.entries(TOKEN_FIELD_MAP).map(([token, meta]) => [token, scalarForm[meta.formKey] || ''])),
        ...Object.fromEntries(Object.entries(IMAGE_TOKEN_MAP).map(([token, meta]) => [token, imageValues[meta.stateKey] || ''])),
      };
    },
    [scalarForm, imageUrl, headImageUrl, expertImageUrl]
  );

  const selectedNewsCategoryName = useMemo(
    () => newsCategories.find((c) => c.id === newsCategoryId)?.name || null,
    [newsCategories, newsCategoryId]
  );

  const selectedWidget = useMemo(
    () => (layoutSchema && selectedWidgetId ? findWidgetById(layoutSchema.sections, selectedWidgetId) : null),
    [layoutSchema, selectedWidgetId]
  );

  // ===== باز/بسته‌کردن پاپ‌آور (فقط برای فیلدهای متنی) =====
  const closePopover = () => { setPopoverPos(null); setSelectedWidgetId(null); };
  const closeDialog = () => { setActiveDialog(null); setSelectedWidgetId(null); };

  const handleSelectWidget = (widgetId: string) => {
    const widget = layoutSchema ? findWidgetById(layoutSchema.sections, widgetId) : null;
    if (!widget) {
      setSelectedWidgetId(null);
      setPopoverPos(null);
      return;
    }
    // فهرستِ رکوردها (رشته‌ها/مدرسان/فایل‌ها) و دستهٔ خبری — با یک دیالوگ کامل مدیریت می‌شوند،
    // نه پاپ‌آور کوچک، چون به فضای بیشتری برای «ثبت» نیاز دارند
    if (widget.type === 'dept-fields') {
      setSelectedWidgetId(widgetId);
      setPopoverPos(null);
      setActiveDialog('fields');
      return;
    }
    if (widget.type === 'dept-instructors') {
      setSelectedWidgetId(widgetId);
      setPopoverPos(null);
      setActiveDialog('instructors');
      ensureInstructorPoolLoaded();
      return;
    }
    if (widget.type === 'dept-files') {
      setSelectedWidgetId(widgetId);
      setPopoverPos(null);
      setActiveDialog('files');
      return;
    }
    if (isDeptNewsWidget(widget)) {
      setSelectedWidgetId(widgetId);
      setPopoverPos(null);
      setActiveDialog('news');
      return;
    }
    const imgToken = imageTokenOf(widget);
    if (imgToken) {
      setSelectedWidgetId(widgetId);
      setPopoverPos(null);
      setPendingImageToken(imgToken);
      setShowMediaSelector(true);
      return;
    }
    if (knownTokensInWidget(widget).length === 0) {
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

  const openSlugDialog = () => {
    setSlugDraft(department?.slug || '');
    setShowSlugDialog(true);
  };

  const handleSaveSlug = async () => {
    const trimmed = slugDraft.trim();
    if (!trimmed) {
      setToast({ text: 'نشانی صفحه نمی‌تواند خالی باشد.', type: 'error' });
      return;
    }
    setSavingSlug(true);
    try {
      const res = await updateDepartment(departmentId, {
        name: scalarForm.name,
        slug: trimmed,
        status: department?.status || 'draft',
      });
      setDepartment(res.data);
      setShowSlugDialog(false);
      setToast({ text: 'نشانی صفحهٔ گروه به‌روزرسانی شد.', type: 'success' });
    } catch (err: any) {
      setToast({ text: err.message || 'خطا در تغییر نشانی', type: 'error' });
    } finally {
      setSavingSlug(false);
    }
  };

  /** ذخیرهٔ همهٔ تغییرات — فیلدهای اسکالر گروه از طریق updateDepartment، رشته‌ها و فایل‌ها
   *  هرکدام از طریق APIِ رکورد واقعی خودشان — طبق تصمیم «انتشار فوری»، اگر گروه از قبل
   *  published باشد این بلافاصله روی سایت عمومی هم اثر می‌گذارد. */
  const handleSave = async () => {
    setSaving(true);
    try {
      // بدون مجوز انتشار (departments.approve)، وضعیت همیشه پیش‌نویس ذخیره می‌شود —
      // دقیقاً همان قاعده‌ای که فرم تخت هم رعایت می‌کند
      const finalStatus: 'published' | 'draft' = canApprove ? statusChoice : 'draft';
      const res = await updateDepartment(departmentId, {
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
        head_image_url: headImageUrl || null,
        expert_image_url: expertImageUrl || null,
        instructor_ids: instructorIds,
        news_category_id: newsCategoryId,
        status: finalStatus,
      });

      // فایل‌هایی که هنوز آدرس واقعی ندارند (مثلاً «افزودن فایل» زده شده ولی هنوز از رسانه
      // انتخاب نشده) نباید کل ذخیره را با خطای اعتبارسنجی/دیتابیس متوقف کنند — نادیده گرفته
      // می‌شوند و کاربر با پیامی مطلع می‌شود تا برایشان فایل انتخاب یا حذفشان کند
      const incompleteFiles = filesList.filter((f) => !f.url || !f.url.trim());
      const completeFiles = filesList.filter((f) => f.url && f.url.trim());

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
        ...completeFiles.map((f) => (f.id ? updateDepartmentFile(f.id, { title: f.title, url: f.url }) : Promise.resolve())),
      ]);

      skipDirtyRef.current = true;
      setDepartment(res.data);
      setStatusChoice(res.data.status || 'draft');
      setIsDirty(false);
      setToast(
        incompleteFiles.length > 0
          ? { text: `اطلاعات گروه ذخیره شد. ${incompleteFiles.length} فایل بدون آدرس نادیده گرفته شد — برایشان از رسانه فایل انتخاب کنید یا حذفشان کنید.`, type: 'error' }
          : { text: 'اطلاعات گروه با موفقیت ذخیره شد.', type: 'success' }
      );
      onSaved();
    } catch (err: any) {
      setToast({ text: err.message || 'خطا در ذخیرهٔ اطلاعات', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (isDirty) {
      setShowLeaveConfirm(true);
      return;
    }
    onBack();
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
  const dialogShellCls = 'fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4';
  const dialogCardCls = 'w-[480px] max-w-full max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl overflow-hidden text-right flex flex-col';

  return (
    <div className="flex flex-col h-full">
      <ToastNotification toast={toast} />

      {/* Header — هم‌سبک با هدر صفحه‌ساز (page-builder) */}
      <header className="h-16 px-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-xs rounded-t-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
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
            onClick={openSlugDialog}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="تنظیم نشانی (slug) صفحهٔ عمومی گروه"
          >
            <Settings2 className="w-4 h-4 text-indigo-500" />
          </button>
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
          {canApprove ? (
            <button
              onClick={() => setStatusChoice((s) => (s === 'published' ? 'draft' : 'published'))}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border ${
                statusChoice === 'published'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/40'
              }`}
              title="کلیک کنید تا وضعیت انتشار تغییر کند (با «ذخیره تغییرات» اعمال می‌شود)"
            >
              {statusChoice === 'published' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{statusChoice === 'published' ? 'منتشر شده' : 'پیش‌نویس'}</span>
            </button>
          ) : (
            <span
              className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/40 flex items-center gap-1.5"
              title="شما مجوز انتشار (departments.approve) ندارید — این گروه به‌صورت پیش‌نویس ذخیره می‌شود تا توسط مدیر منتشر شود."
            >
              <AlertCircle className="w-4 h-4" />
              <span>پیش‌نویس</span>
            </span>
          )}
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
            departmentNewsCategoryName={selectedNewsCategoryName}
          />
        </div>
      )}

      {/* پاپ‌آور ویرایش محتوا — فقط برای فیلدهای متنی، درست کنار بلوک کلیک‌شده روی خودِ بوم */}
      {popoverPos && selectedWidget && (
        <div
          ref={popoverRef}
          className="fixed z-50 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl flex flex-col select-none rtl text-right"
          style={{ left: popoverPos.x, top: popoverPos.y, width: POPOVER_WIDTH, maxHeight: POPOVER_MAX_HEIGHT }}
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-slate-800 shrink-0">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">ویرایش محتوا</h4>
            <button onClick={closePopover} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-3 overflow-y-auto">
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
        </div>
      )}

      {/* ===== دیالوگ رشته‌های تحصیلی ===== */}
      {activeDialog === 'fields' && (
        <div className={dialogShellCls} onClick={closeDialog}>
          <div className={dialogCardCls} onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
              <span className="text-sm font-black text-slate-900 dark:text-white">رشته‌های تحصیلی گروه</span>
              <button onClick={closeDialog} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto">
              <button
                type="button"
                onClick={handleCreateField}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                افزودن رشتهٔ جدید
              </button>
              {fieldsList.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">هنوز رشته‌ای زیر این گروه ثبت نشده است.</p>
              )}
              {fieldsList.map((f) => (
                <div key={f.id} className="flex items-center gap-2">
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
                    className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white cursor-pointer shrink-0"
                    title="حذف رشته"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end px-5 py-3.5 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] shrink-0">
              <button
                onClick={closeDialog}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black transition-colors cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== دیالوگ مدرسان مدعو ===== */}
      {activeDialog === 'instructors' && (
        <div className={dialogShellCls} onClick={closeDialog}>
          <div className={dialogCardCls} onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
              <span className="text-sm font-black text-slate-900 dark:text-white">اساتید مدعو شاخص گروه</span>
              <button onClick={closeDialog} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{instructorIds.length} نفر انتخاب شده</label>
              {instructorPoolLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                </div>
              ) : instructorPool.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">هیچ عضوی از نوع هیات علمی یا استاد مدعو یافت نشد.</p>
              ) : (
                <div className="space-y-1.5">
                  {instructorPool.map((p) => {
                    const selected = instructorIds.includes(p.id);
                    const label = [p.title, p.firstName, p.lastName].filter(Boolean).join(' ') || `#${p.id}`;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleToggleInstructor(p.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-right transition-colors cursor-pointer border ${
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
            <div className="flex items-center justify-end px-5 py-3.5 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] shrink-0">
              <button
                onClick={closeDialog}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black transition-colors cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== دیالوگ فایل‌های اطلاعاتی ===== */}
      {activeDialog === 'files' && (
        <div className={dialogShellCls} onClick={closeDialog}>
          <div className={dialogCardCls} onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
              <span className="text-sm font-black text-slate-900 dark:text-white">فایل‌های اطلاعاتی گروه</span>
              <button onClick={closeDialog} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto">
              <button
                type="button"
                onClick={handleCreateFile}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                افزودن فایل جدید
              </button>
              {filesList.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">موردی ثبت نشده است.</p>
              )}
              {filesList.map((file, i) => (
                <div key={file.id ?? i} className="rounded-xl border border-gray-200 dark:border-slate-800 p-3 space-y-2">
                  <input
                    type="text"
                    value={file.title}
                    onChange={(e) => handleFileChange(i, { title: e.target.value })}
                    placeholder="عنوان فایل"
                    className={inputCls}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setPendingFileIndex(i); setShowFileMediaSelector(true); }}
                      className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-right cursor-pointer hover:border-teal-500 transition-colors ${
                        file.url ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'
                      }`}
                    >
                      <FolderOpen className="w-3.5 h-3.5 shrink-0 text-teal-500" />
                      <span className="truncate">{file.url ? file.url.split('/').pop() : 'انتخاب فایل از رسانه...'}</span>
                    </button>
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
            <div className="flex items-center justify-end px-5 py-3.5 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] shrink-0">
              <button
                onClick={closeDialog}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black transition-colors cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== دیالوگ انتخاب دستهٔ خبریِ گروه ===== */}
      {activeDialog === 'news' && (
        <div className={dialogShellCls} onClick={closeDialog}>
          <div className={dialogCardCls} onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
              <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-emerald-500" />
                دستهٔ خبریِ گروه
              </span>
              <button onClick={closeDialog} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-2 overflow-y-auto">
              <p className="text-[11px] text-slate-400 mb-2">
                اخباری که در این دسته ثبت می‌شوند، در بلوک «اخبار گروه» این صفحه نمایش داده می‌شوند.
              </p>
              <button
                type="button"
                onClick={() => { setNewsCategoryId(null); closeDialog(); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-right transition-colors cursor-pointer border ${
                  newsCategoryId === null
                    ? 'bg-emerald-500/10 border-emerald-400 text-emerald-700 dark:text-emerald-400'
                    : 'bg-slate-50 dark:bg-slate-950 border-transparent text-slate-600 dark:text-slate-300'
                }`}
              >
                <Check className={`w-3.5 h-3.5 shrink-0 ${newsCategoryId === null ? 'opacity-100' : 'opacity-0'}`} />
                <span>بدون اتصال (بلوک اخبار خالی می‌ماند)</span>
              </button>
              {newsCategories.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">هیچ دستهٔ خبری‌ای یافت نشد.</p>
              ) : (
                newsCategories.map((c) => {
                  const selected = newsCategoryId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setNewsCategoryId(c.id); closeDialog(); }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-right transition-colors cursor-pointer border ${
                        selected
                          ? 'bg-emerald-500/10 border-emerald-400 text-emerald-700 dark:text-emerald-400'
                          : 'bg-slate-50 dark:bg-slate-950 border-transparent text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 shrink-0 ${selected ? 'opacity-100' : 'opacity-0'}`} />
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: c.color || '#10b981' }}
                      />
                      <span className="truncate">{c.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== دیالوگ تنظیم نشانی (slug) صفحهٔ عمومی گروه ===== */}
      {showSlugDialog && (
        <div className={dialogShellCls} onClick={() => setShowSlugDialog(false)}>
          <div className="w-[420px] max-w-full bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl overflow-hidden text-right" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Link2 className="w-4 h-4 text-indigo-500" />
                نشانی صفحهٔ عمومی گروه
              </span>
              <button onClick={() => setShowSlugDialog(false)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300">نشانی (slug)</label>
              <input
                type="text"
                dir="ltr"
                autoFocus
                value={slugDraft}
                onChange={(e) => setSlugDraft(e.target.value)}
                placeholder="comp-eng"
                className={`${inputCls} text-left`}
              />
              <p className="text-[11px] text-slate-400 break-all" dir="ltr">
                /departments/{slugDraft.trim() || '...'}
              </p>
              <p className="text-[11px] text-slate-400">
                در صورت خالی گذاشتنِ این نشانی هنگام ایجاد گروه، به‌صورت خودکار از روی نام گروه ساخته می‌شود؛ در صورت تکراری بودن، به‌طور خودکار یکتا می‌شود.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
              <button
                onClick={() => setShowSlugDialog(false)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveSlug}
                disabled={savingSlug}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {savingSlug ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                ذخیره نشانی
              </button>
            </div>
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

      <MediaManager
        open={showMediaSelector}
        filter="image"
        onClose={() => { setShowMediaSelector(false); setSelectedWidgetId(null); setPendingImageToken(null); }}
        onSelect={(url) => {
          const stateKey = pendingImageToken ? IMAGE_TOKEN_MAP[pendingImageToken]?.stateKey : null;
          if (stateKey === 'headImageUrl') setHeadImageUrl(url);
          else if (stateKey === 'expertImageUrl') setExpertImageUrl(url);
          else setImageUrl(url);
          setShowMediaSelector(false);
          setSelectedWidgetId(null);
          setPendingImageToken(null);
        }}
      />

      <MediaManager
        open={showFileMediaSelector}
        filter="all"
        onClose={() => { setShowFileMediaSelector(false); setPendingFileIndex(null); }}
        onSelect={(url, mediaFile) => {
          if (pendingFileIndex !== null) {
            const autoTitle = filesList[pendingFileIndex]?.title;
            handleFileChange(pendingFileIndex, {
              url,
              title: autoTitle || mediaFile?.title || mediaFile?.name || url.split('/').pop() || 'فایل',
            });
          }
          setShowFileMediaSelector(false);
          setPendingFileIndex(null);
        }}
      />

      <ConfirmDialog
        open={showLeaveConfirm}
        title="تغییرات ذخیره نشده"
        message="تغییرات این گروه هنوز ذخیره نشده‌اند. آیا می‌خواهید بدون ذخیره خارج شوید؟"
        confirmLabel="خروج بدون ذخیره"
        cancelLabel="ادامه ویرایش"
        danger={false}
        onConfirm={() => { setShowLeaveConfirm(false); onBack(); }}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </div>
  );
}
