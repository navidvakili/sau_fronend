// ============================================================
// PeopleManagement — سیستم مدیریت اعضای دانشگاه
// شامل: هیات علمی، اساتید مدعو، کارکنان و دانشجویان
// ثبت دستی + ورود انبوه از فایل اکسل
// در سایت عمومی (sau public) نمایش داده می‌شوند
// ============================================================

import { useState, useEffect, useCallback, useRef, type ReactNode, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import {
  Users, Plus, Search, Edit3, Trash2, Image as ImageIcon,
  Send, Loader2, X, CheckCircle2, AlertCircle, Globe,
  GraduationCap, Briefcase, BookOpen, Upload, FileSpreadsheet,
  Download, Mail, Phone, MapPin, UserRound,
} from 'lucide-react';
import type { PersonItem, PersonPayload, PersonType, User } from '@/src/shared-types';
import ToastNotification from '@/src/shared-components/ToastNotification';
import MediaManager from '@/src/shared-components/MediaManager';
import {
  fetchPeople, fetchPersonById, createPerson, updatePerson, deletePerson, importPeople,
} from './api';
import { useAppPermissions } from '@/src/shared-utils/PermissionsContext';
import { useLanguage } from '@/src/shared-utils/LanguageContext';

interface PeopleManagementProps {
  user?: User | null;
  activeTabId?: string;
  moduleId?: string;
  onOpenTab?: (id: string, title: string, iconName: string) => void;
}

type SubTab = 'list' | 'editor';

// ===== Type tabs =====
const TYPE_TABS: Array<{ type: PersonType; label: string; icon: ReactNode; desc: string }> = [
  { type: 'faculty_member', label: 'هیات علمی', icon: <GraduationCap size={16} />, desc: 'اعضای هیات علمی تمام‌وقت' },
  { type: 'visiting_professor', label: 'اساتید مدعو', icon: <UserRound size={16} />, desc: 'اساتید حقالتدریس و مدعو' },
  { type: 'staff', label: 'کارکنان', icon: <Briefcase size={16} />, desc: 'کارکنان و پرسنل اداری' },
  { type: 'student', label: 'دانشجویان', icon: <BookOpen size={16} />, desc: 'دانشجویان و دانش‌آموختگان' },
];

const TYPE_LABEL: Record<PersonType, string> = {
  faculty_member: 'هیات علمی',
  visiting_professor: 'اساتید مدعو',
  staff: 'کارکنان',
  student: 'دانشجویان',
};

const RANK_OPTIONS = ['استاد', 'دانشیار', 'استادیار', 'مربی'];

/**
 * Business rule: a person may have multiple roles ONLY as
 * visiting_professor + staff, or staff + student.
 * faculty_member is always solo.
 */
const canAddType = (current: PersonType[], next: PersonType): boolean => {
  if (current.length === 0) return true;
  if (current.length >= 2) return false;
  if (current.includes('faculty_member')) return false;
  const pair = [current[0], next].sort() as PersonType[];
  return (
    (pair[0] === 'staff' && pair[1] === 'student') ||
    (pair[0] === 'staff' && pair[1] === 'visiting_professor')
  );
};

// ===== Excel header aliases (Persian + English) → snake_case =====
const HEADER_ALIASES: Record<string, string> = {
  first_name: 'first_name', 'نام': 'first_name', 'نام کوچک': 'first_name',
  last_name: 'last_name', 'نام خانوادگی': 'last_name', 'نام خانوادگي': 'last_name',
  title: 'title', 'عنوان': 'title', 'پیشوند': 'title',
  rank: 'rank', 'رتبه علمی': 'rank', 'مرتبه علمی': 'rank',
  specialization: 'specialization', 'تخصص': 'specialization', 'گرایش': 'specialization',
  department: 'department', 'گروه علمی': 'department', 'دانشکده': 'department', 'واحد': 'department',
  position: 'position', 'سمت': 'position', 'پست سازمانی': 'position',
  email: 'email', 'ایمیل': 'email', 'پست الکترونیک': 'email',
  phone: 'phone', 'تلفن': 'phone', 'موبایل': 'phone', 'شماره تماس': 'phone',
  office: 'office', 'اتاق': 'office', 'دفتر': 'office', 'اتاق کار': 'office',
  student_number: 'student_number', 'شماره دانشجویی': 'student_number',
  degree_level: 'degree_level', 'مقطع': 'degree_level', 'مقطع تحصیلی': 'degree_level',
  field_of_study: 'field_of_study', 'رشته': 'field_of_study', 'رشته تحصیلی': 'field_of_study',
  entry_year: 'entry_year', 'سال ورود': 'entry_year',
  image_url: 'image_url', 'تصویر': 'image_url', 'آدرس تصویر': 'image_url',
  bio: 'bio', 'بیوگرافی': 'bio', 'شرح': 'bio',
  status: 'status', 'وضعیت': 'status',
  sort_order: 'sort_order', 'ترتیب': 'sort_order',
  types: 'types', 'انواع': 'types', 'نقش‌ها': 'types', 'نقش ها': 'types',
};

function normalizeHeader(raw: string): string | null {
  const key = String(raw ?? '').trim();
  if (!key) return null;
  if (HEADER_ALIASES[key]) return HEADER_ALIASES[key];
  const lower = key.toLowerCase().replace(/[_\s-]+/g, '_');
  if (HEADER_ALIASES[lower]) return HEADER_ALIASES[lower];
  // fuzzy contains match
  for (const [alias, field] of Object.entries(HEADER_ALIASES)) {
    if (alias.length > 2 && lower.includes(alias.toLowerCase())) return field;
  }
  return null;
}

export default function PeopleManagement({ user }: PeopleManagementProps) {
  const { can } = useAppPermissions();
  const { currentLang, getLanguage } = useLanguage();
  const activeLanguage = getLanguage(currentLang);
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('support');
  const isEditor = user?.roles?.includes('editor');
  const roleCanEdit = isAdmin || isEditor;
  const permCanEdit = can('people.create') || can('people.edit');
  const permCanDelete = can('people.delete');
  const canApprove = can('people.approve') || isAdmin;
  const canEdit = roleCanEdit || permCanEdit;
  const canDelete = roleCanEdit || permCanDelete;

  // ===== Sub-tab state =====
  const [activeTab, setActiveTab] = useState<SubTab>('list');

  // ===== Type filter =====
  const [activeType, setActiveType] = useState<PersonType>('faculty_member');

  // ===== Data state =====
  const [people, setPeople] = useState<PersonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // ===== Filter state =====
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // ===== Editor State =====
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formRank, setFormRank] = useState('');
  const [formSpecialization, setFormSpecialization] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formOffice, setFormOffice] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formStatus, setFormStatus] = useState<'published' | 'draft'>('published');
  const [formTypes, setFormTypes] = useState<PersonType[]>([activeType]);
  const [formStudentNumber, setFormStudentNumber] = useState('');
  const [formDegreeLevel, setFormDegreeLevel] = useState('');
  const [formFieldOfStudy, setFormFieldOfStudy] = useState('');
  const [formEntryYear, setFormEntryYear] = useState('');
  // JSON array editors
  const [formEducation, setFormEducation] = useState<Array<{ degree: string; field: string; institution: string; year: string }>>([]);
  const [formResearchInterests, setFormResearchInterests] = useState<string[]>([]);
  const [formPublications, setFormPublications] = useState<Array<{ title: string; journal: string; year: string; citations: string }>>([]);
  const [formCourses, setFormCourses] = useState<string[]>([]);
  const [formAwards, setFormAwards] = useState<Array<{ title: string; year: string }>>([]);

  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [formMessage, setFormMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // ===== Toast state =====
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ===== Delete Confirmation state =====
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // ===== Import state =====
  const [importOpen, setImportOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importRows, setImportRows] = useState<Record<string, any>[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importMessage, setImportMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== Metrics =====
  const publishedCount = people.filter(p => p.status === 'published').length;
  const draftCount = people.filter(p => p.status === 'draft').length;

  // ===== Roles selected in the editor form → which sections are shown =====
  const formIsFaculty = formTypes.includes('faculty_member') || formTypes.includes('visiting_professor');
  const formIsStaff = formTypes.includes('staff');
  const formIsStudent = formTypes.includes('student');

  // ===== Fetch data =====
  const loadPeople = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        per_page: 100,
        lang: currentLang,
        type: activeType,
      };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;

      const data = await fetchPeople(params);
      setPeople(data.data);
      setTotal(data.total);
    } catch (err: any) {
      console.error('Error loading people:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, currentLang, activeType]);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPeople();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, activeType]);

  // ===== Handlers =====
  const handleStartEdit = async (item: PersonItem) => {
    setFormMessage(null);
    setActiveTab('editor');
    setFormLoading(true);
    try {
      const detail = await fetchPersonById(item.id);
      fillForm(detail);
    } catch (err: any) {
      fillForm(item);
      showToast(err.message || 'خطا در بارگذاری جزئیات عضو', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const fillForm = (p: PersonItem) => {
    setEditingId(p.id);
    setActiveType(p.type);
    setFormTitle(p.title || '');
    setFormFirstName(p.firstName || '');
    setFormLastName(p.lastName || '');
    setFormRank(p.rank || '');
    setFormSpecialization(p.specialization || '');
    setFormDepartment(p.department || '');
    setFormPosition(p.position || '');
    setFormEmail(p.email || '');
    setFormPhone(p.phone || '');
    setFormOffice(p.office || '');
    setFormImageUrl(p.image_url || '');
    setFormBio(p.bio || '');
    setFormStatus(p.status);
    setFormTypes((p.types && p.types.length ? p.types : [p.type]) as PersonType[]);
    setFormStudentNumber(p.studentNumber || '');
    setFormDegreeLevel(p.degreeLevel || '');
    setFormFieldOfStudy(p.fieldOfStudy || '');
    setFormEntryYear(p.entryYear || '');
    setFormEducation((p.education || []).map(e => ({ degree: e.degree || '', field: e.field || '', institution: e.institution || '', year: e.year || '' })));
    setFormResearchInterests(p.researchInterests || []);
    setFormPublications((p.publications || []).map(pub => ({ title: pub.title || '', journal: pub.journal || '', year: pub.year || '', citations: pub.citations != null ? String(pub.citations) : '' })));
    setFormCourses(p.courses || []);
    setFormAwards((p.awards || []).map(a => ({ title: a.title || '', year: a.year || '' })));
  };

  const handleResetForm = () => {
    setEditingId(null);
    setFormTitle(''); setFormFirstName(''); setFormLastName('');
    setFormRank(''); setFormSpecialization(''); setFormDepartment(''); setFormPosition('');
    setFormEmail(''); setFormPhone(''); setFormOffice(''); setFormImageUrl(''); setFormBio('');
    setFormStatus('published');
    setFormTypes([activeType]);
    setFormStudentNumber(''); setFormDegreeLevel(''); setFormFieldOfStudy(''); setFormEntryYear('');
    setFormEducation([]); setFormResearchInterests([]); setFormPublications([]); setFormCourses([]); setFormAwards([]);
    setFormMessage(null);
  };

  const buildPayload = (): PersonPayload => {
    const types = formTypes.length ? formTypes : [activeType];
    const payload: PersonPayload = {
      type: types[0],
      types,
      title: formTitle || undefined,
      first_name: formFirstName || undefined,
      last_name: formLastName || undefined,
      rank: formRank || undefined,
      specialization: formSpecialization || undefined,
      department: formDepartment || undefined,
      position: formPosition || undefined,
      email: formEmail || undefined,
      phone: formPhone || undefined,
      office: formOffice || undefined,
      image_url: formImageUrl || undefined,
      bio: formBio || undefined,
      status: formStatus,
      lang: currentLang,
      education: formEducation.filter(e => e.degree || e.institution).map(e => ({ degree: e.degree, field: e.field || undefined, institution: e.institution, year: e.year || undefined })),
      research_interests: formResearchInterests.filter(Boolean),
      publications: formPublications.filter(p => p.title).map(p => ({ title: p.title, journal: p.journal || undefined, year: p.year || undefined, citations: p.citations ? Number(p.citations) : undefined })),
      courses: formCourses.filter(Boolean),
      awards: formAwards.filter(a => a.title).map(a => ({ title: a.title, year: a.year || undefined })),
      student_number: formStudentNumber || undefined,
      degree_level: formDegreeLevel || undefined,
      field_of_study: formFieldOfStudy || undefined,
      entry_year: formEntryYear || undefined,
    };
    return payload;
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!formFirstName.trim() && !formLastName.trim()) {
      setFormMessage({ text: 'لطفاً حداقل نام یا نام خانوادگی را وارد نمایید.', type: 'error' });
      return;
    }

    setFormLoading(true);

    try {
      // If user cannot approve, force draft (backend also enforces this)
      const finalStatus: 'published' | 'draft' = canApprove ? formStatus : 'draft';
      const payload = { ...buildPayload(), status: finalStatus } as PersonPayload;

      if (editingId) {
        await updatePerson(editingId, payload);
        setFormMessage({ text: 'تغییرات عضو با موفقیت ذخیره گردید.', type: 'success' });
      } else {
        await createPerson(payload);
        setFormMessage({ text: 'عضو جدید با موفقیت ثبت شد.', type: 'success' });
      }

      setTimeout(() => {
        setActiveTab('list');
        handleResetForm();
        loadPeople();
      }, 1200);
    } catch (err: any) {
      if (err.errors) {
        const firstErr = Object.values(err.errors).flat()[0];
        setFormMessage({ text: firstErr as string, type: 'error' });
      } else {
        setFormMessage({ text: err.message || 'خطا در ذخیره عضو', type: 'error' });
      }
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePerson(deleteId);
      setPeople(prev => prev.filter(p => p.id !== deleteId));
      showToast('عضو با موفقیت حذف شد.', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در حذف عضو', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  // ===== Excel helpers =====
  const handleImportFile = async (file: File) => {
    setImportLoading(true);
    setImportMessage(null);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      // Normalize headers
      const rows = raw.map(row => {
        const out: Record<string, any> = {};
        for (const [header, value] of Object.entries(row)) {
          const field = normalizeHeader(header);
          if (field && value !== '' && value !== null) out[field] = String(value).trim();
        }
        return out;
      });

      setImportRows(rows);
      setImportFileName(file.name);
      if (rows.length === 0) {
        setImportMessage({ text: 'هیچ ردیف قابل خواندنی در فایل پیدا نشد.', type: 'error' });
      }
    } catch (err: any) {
      setImportMessage({ text: 'خطا در خواندن فایل اکسل: ' + (err.message || ''), type: 'error' });
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportSubmit = async () => {
    if (importRows.length === 0) return;
    setImportLoading(true);
    setImportMessage(null);
    try {
      const res = await importPeople(activeType, importRows, currentLang);
      setImportMessage({ text: res.message || 'ورود اطلاعات انجام شد.', type: 'success' });
      showToast(res.message || 'ورود اطلاعات انجام شد.', 'success');
      setImportRows([]);
      setImportFileName('');
      loadPeople();
    } catch (err: any) {
      setImportMessage({ text: err.message || 'خطا در ورود اطلاعات', type: 'error' });
    } finally {
      setImportLoading(false);
    }
  };

  const downloadTemplate = () => {
    const isStudent = activeType === 'student';
    const isStaff = activeType === 'staff';
    const headers = isStudent
      ? ['first_name', 'last_name', 'student_number', 'degree_level', 'field_of_study', 'entry_year', 'email', 'phone', 'department', 'bio', 'status']
      : isStaff
        ? ['first_name', 'last_name', 'position', 'department', 'email', 'phone', 'office', 'bio', 'status']
        : ['title', 'first_name', 'last_name', 'rank', 'specialization', 'department', 'email', 'phone', 'office', 'bio', 'status'];
    const sample: Record<string, any> = {};
    headers.forEach(h => { sample[h] = ''; });
    if (activeType === 'student') {
      sample.first_name = 'علی'; sample.last_name = 'محمدی'; sample.student_number = '401123456';
      sample.degree_level = 'کارشناسی'; sample.field_of_study = 'مهندسی کامپیوتر'; sample.entry_year = '1401';
    } else if (activeType === 'staff') {
      sample.first_name = 'مریم'; sample.last_name = 'حسینی'; sample.position = 'کارشناس آموزش';
      sample.department = 'معاونت آموزشی';
    } else {
      sample.title = 'دکتر'; sample.first_name = 'رضا'; sample.last_name = 'کریمی';
      sample.rank = 'دانشیار'; sample.specialization = 'هوش مصنوعی'; sample.department = 'گروه کامپیوتر';
    }
    sample.status = 'published';

    const ws = XLSX.utils.json_to_sheet([sample], { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, TYPE_LABEL[activeType]);
    XLSX.writeFile(wb, `people-${activeType}-template.xlsx`);
  };

  const typeIcon = (t: PersonType, size = 18) => {
    const found = TYPE_TABS.find(tab => tab.type === t);
    return found ? found.icon : <Users size={size} />;
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-right rtl">
      {/* ===== Module Header Banner ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-emerald-500/20">
        <div className="absolute top-0 left-0 translate-x-[-10%] translate-y-[-20%] w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              <Users className="w-4 h-4" />
              <span>سامانه اعضای دانشگاه</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              مدیریت اعضای دانشگاه
              {activeLanguage && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/20 text-[11px] font-black font-sans uppercase">
                  <Globe className="w-3.5 h-3.5 text-emerald-300" />
                  {activeLanguage.code} • {activeLanguage.name}
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
              مدیریت اعضای هیات علمی، اساتید مدعو، کارکنان و دانشجویان — به‌صورت دستی یا ورود انبوه از اکسل. اعضای منتشرشده در سایت عمومی نمایش داده می‌شوند
            </p>
          </div>

          {canEdit && (
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <button
                onClick={() => setImportOpen(true)}
                className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs border border-white/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>ورود از اکسل</span>
              </button>
              <button
                onClick={() => { handleResetForm(); setActiveTab('editor'); }}
                className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت عضو جدید</span>
              </button>
            </div>
          )}
        </div>

        {/* Type tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.type}
              onClick={() => { setActiveType(tab.type); setSearchQuery(''); setStatusFilter('all'); }}
              className={`rounded-2xl p-3.5 border transition-all cursor-pointer text-right ${
                activeType === tab.type
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-white'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {tab.icon}
                <span className="text-sm font-black">{tab.label}</span>
              </div>
              <span className="text-[10px] text-gray-400">{tab.desc}</span>
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{total}</div>
              <div className="text-[11px] text-gray-300">کل {TYPE_LABEL[activeType]}</div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{publishedCount}</div>
              <div className="text-[11px] text-gray-300">منتشر شده</div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{draftCount}</div>
              <div className="text-[11px] text-gray-300">پیش‌نویس</div>
            </div>
          </div>
        </div>
      </div>

      <ToastNotification toast={toast} />

      {/* ===== List View ===== */}
      {activeTab === 'list' && (
        <div className="space-y-5">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-[#161618] rounded-2xl p-4 border border-gray-100 dark:border-white/10 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`جستجو در نام، تخصص، سمت یا ایمیل ${TYPE_LABEL[activeType]}...`}
                className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'published', 'draft'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-emerald-500 text-emerald-950 shadow'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                >
                  {st === 'all' ? 'همه' : st === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : people.length === 0 ? (
            <div className="bg-white dark:bg-[#161618] rounded-3xl border border-gray-100 dark:border-white/10 p-16 text-center">
              <Users className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
                موردی از {TYPE_LABEL[activeType]} یافت نشد
              </h3>
              <p className="text-sm text-gray-400 mb-6">برای شروع، اولین عضو را ثبت کنید یا از اکسل وارد کنید.</p>
              {canEdit && (
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <button
                    onClick={() => { handleResetForm(); setActiveTab('editor'); }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-emerald-950 font-black text-xs hover:bg-emerald-400 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    ثبت دستی
                  </button>
                  <button
                    onClick={() => setImportOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-black text-xs hover:bg-gray-200 dark:hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    ورود از اکسل
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {people.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-3xl overflow-hidden bg-white dark:bg-[#161618] border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Image */}
                  <div className="relative h-44 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={`${item.firstName} ${item.lastName}`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-slate-800 to-indigo-950 flex items-center justify-center">
                        <div className="bg-emerald-500/20 backdrop-blur-md w-14 h-14 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                          {typeIcon(item.type, 24)}
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                    {/* Status badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black backdrop-blur-md border ${
                        item.status === 'published'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>
                        {item.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black backdrop-blur-md border bg-white/10 text-white border-white/20">
                        {TYPE_LABEL[item.type]}
                      </span>
                      {(item.types && item.types.length > 0 ? item.types : [item.type]).slice(1).slice(0, 2).map((t) => (
                        <span key={t} className="px-2.5 py-1 rounded-full text-[10px] font-black backdrop-blur-md border bg-white/10 text-white border-white/20">
                          {TYPE_LABEL[t]}
                        </span>
                      ))}
                      {((item.types?.length ?? 1) - 1) > 2 && (
                        <span className="px-2 py-1 rounded-full text-[10px] font-black backdrop-blur-md border bg-white/10 text-white border-white/20">
                          +{((item.types?.length ?? 1) - 1) - 2}
                        </span>
                      )}
                    </div>

                    {/* Type icon over image */}
                    <div className="absolute bottom-3 right-4 bg-emerald-500/20 backdrop-blur-md w-11 h-11 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                      {typeIcon(item.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-base font-black text-gray-900 dark:text-white mb-1.5 leading-tight line-clamp-1">
                      {[item.title, item.firstName, item.lastName].filter(Boolean).join(' ')}
                    </h3>
                    {(item.rank || item.specialization || item.position || item.fieldOfStudy) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-1">
                        {item.rank || item.position || item.specialization || item.fieldOfStudy}
                      </p>
                    )}
                    {item.department && (
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 line-clamp-1 mb-3">{item.department}</p>
                    )}

                    {/* Contact */}
                    <div className="space-y-1.5 mb-4">
                      {item.email && (
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{item.email}</span>
                        </div>
                      )}
                      {(item.phone || item.office) && (
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                          {item.phone ? <Phone className="w-3.5 h-3.5 shrink-0" /> : <MapPin className="w-3.5 h-3.5 shrink-0" />}
                          <span className="truncate">{item.phone || item.office}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-4">
                      {item.author_name ? `ثبت توسط ${item.author_name}` : item.author_username}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-white/5">
                      {canEdit && (
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          ویرایش
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          حذف
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== Editor View ===== */}
      {activeTab === 'editor' && (
        <form onSubmit={handleSave} className="bg-white dark:bg-[#161618] rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
          {/* Editor header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
            <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit3 className="w-4 h-4 text-emerald-500" />
                  ویرایش عضو دانشگاه
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-emerald-500" />
                  ثبت اعضای دانشگاه
                </>
              )}
            </h2>
            <button
              type="button"
              onClick={() => { setActiveTab('list'); handleResetForm(); }}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {formMessage && (
              <div className={`px-4 py-3 rounded-2xl text-xs font-bold ${
                formMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              }`}>
                {formMessage.text}
              </div>
            )}

            {/* Type selector (multi-select — a person may have several roles, e.g. visiting professor AND staff) */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">
                نوع عضو <span className="text-rose-500">*</span>
                <span className="text-[10px] font-normal text-gray-400"> — یک نفر می‌تواند چند نقش داشته باشد</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TYPE_TABS.map((tab) => {
                  const selected = formTypes.includes(tab.type);
                  return (
                    <button
                      key={tab.type}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          // Keep at least one role selected
                          setFormTypes(prev => (prev.length > 1 ? prev.filter(t => t !== tab.type) : prev));
                          return;
                        }
                        if (tab.type === 'faculty_member') {
                          // Faculty member is always a single role
                          setFormTypes(['faculty_member']);
                          return;
                        }
                        if (canAddType(formTypes, tab.type)) {
                          // Valid combination — keep existing roles and add this one
                          setFormTypes(prev => [...prev, tab.type]);
                        } else {
                          // Combination not allowed — switch to the clicked role instead of blocking
                          setFormTypes([tab.type]);
                        }
                      }}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        selected
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                          : 'border-gray-100 dark:border-white/10 text-gray-400 hover:border-emerald-500/30 hover:text-emerald-500'
                      }`}
                    >
                      {tab.icon}
                      <span className="text-[10px] font-bold">{tab.label}</span>
                      {selected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 mt-2">
                {formTypes.map(t => TYPE_LABEL[t]).join('، ') || 'یک نوع انتخاب کنید'} — فقط استاد مدعو می‌تواند کارمند باشد و فقط کارمند می‌تواند دانشجو باشد
              </p>
            </div>

            {/* Name + title */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">عنوان</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="دکتر / مهندس / ..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">
                  نام <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formFirstName}
                  onChange={(e) => setFormFirstName(e.target.value)}
                  placeholder="نام"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">
                  نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formLastName}
                  onChange={(e) => setFormLastName(e.target.value)}
                  placeholder="نام خانوادگی"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            {/* Faculty / staff specific */}
            {formIsFaculty && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">مرتبه علمی</label>
                  <select
                    value={formRank}
                    onChange={(e) => setFormRank(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
                  >
                    <option value="">بدون مرتبه</option>
                    {RANK_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">تخصص</label>
                  <input
                    type="text"
                    value={formSpecialization}
                    onChange={(e) => setFormSpecialization(e.target.value)}
                    placeholder="مثلاً هوش مصنوعی"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">گروه علمی / دانشکده</label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    placeholder="گروه کامپیوتر"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
            )}

            {/* Staff specific */}
            {formIsStaff && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">سمت سازمانی</label>
                  <input
                    type="text"
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    placeholder="کارشناس آموزش"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">واحد / معاونت</label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    placeholder="معاونت آموزشی"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
            )}

            {/* Student specific */}
            {formIsStudent && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">شماره دانشجویی</label>
                  <input
                    type="text"
                    value={formStudentNumber}
                    onChange={(e) => setFormStudentNumber(e.target.value)}
                    placeholder="401123456"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">مقطع</label>
                  <input
                    type="text"
                    value={formDegreeLevel}
                    onChange={(e) => setFormDegreeLevel(e.target.value)}
                    placeholder="کارشناسی / ارشد / دکتری"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">رشته تحصیلی</label>
                  <input
                    type="text"
                    value={formFieldOfStudy}
                    onChange={(e) => setFormFieldOfStudy(e.target.value)}
                    placeholder="مهندسی کامپیوتر"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">سال ورود</label>
                  <input
                    type="text"
                    value={formEntryYear}
                    onChange={(e) => setFormEntryYear(e.target.value)}
                    placeholder="1401"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
            )}

            {/* Contact */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">ایمیل</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="name@sau.ac.ir"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">تلفن</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="035-3111..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">دفتر / اتاق</label>
                <input
                  type="text"
                  value={formOffice}
                  onChange={(e) => setFormOffice(e.target.value)}
                  placeholder="اتاق 204"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            {/* Image */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">تصویر پروفایل</label>
              <div className="flex items-start gap-4">
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 shrink-0">
                  {formImageUrl ? (
                    <img src={formImageUrl} alt="پیش‌نمایش" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 dark:text-gray-600">
                      <ImageIcon className="w-8 h-8 mb-1" />
                      <span className="text-[10px] font-bold">بدون تصویر</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => setShowMediaSelector(true)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-colors cursor-pointer w-fit"
                  >
                    انتخاب از رسانه
                  </button>
                  {formImageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormImageUrl('')}
                      className="px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-colors cursor-pointer w-fit"
                    >
                      حذف تصویر
                    </button>
                  )}
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="یا آدرس تصویر را وارد کنید..."
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">بیوگرافی / توضیحات</label>
              <textarea
                value={formBio}
                onChange={(e) => setFormBio(e.target.value)}
                rows={4}
                placeholder="شرح مختصری درباره این عضو..."
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {/* Faculty arrays */}
            {formIsFaculty && (
              <>
                {/* Education */}
                <div className="rounded-2xl border border-gray-100 dark:border-white/10 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-gray-600 dark:text-gray-300">تحصیلات</label>
                    <button
                      type="button"
                      onClick={() => setFormEducation(prev => [...prev, { degree: '', field: '', institution: '', year: '' }])}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> افزودن
                    </button>
                  </div>
                  {formEducation.length === 0 && <p className="text-[10px] text-gray-400">موردی ثبت نشده است.</p>}
                  {formEducation.map((edu, i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                      <input type="text" value={edu.degree} onChange={(e) => { const next = [...formEducation]; next[i] = { ...next[i], degree: e.target.value }; setFormEducation(next); }} placeholder="مدرک (دکتری)" className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                      <input type="text" value={edu.field} onChange={(e) => { const next = [...formEducation]; next[i] = { ...next[i], field: e.target.value }; setFormEducation(next); }} placeholder="گرایش" className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                      <input type="text" value={edu.institution} onChange={(e) => { const next = [...formEducation]; next[i] = { ...next[i], institution: e.target.value }; setFormEducation(next); }} placeholder="دانشگاه" className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                      <div className="flex gap-2">
                        <input type="text" value={edu.year} onChange={(e) => { const next = [...formEducation]; next[i] = { ...next[i], year: e.target.value }; setFormEducation(next); }} placeholder="سال" className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                        <button type="button" onClick={() => setFormEducation(prev => prev.filter((_, idx) => idx !== i))} className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Research interests + courses (line-based) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">حوزه‌های پژوهشی (هر خط یک مورد)</label>
                    <textarea
                      value={formResearchInterests.join('\n')}
                      onChange={(e) => setFormResearchInterests(e.target.value.split('\n'))}
                      rows={3}
                      placeholder={'هوش مصنوعی\nیادگیری ماشین'}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">دروس تدریس شده (هر خط یک درس)</label>
                    <textarea
                      value={formCourses.join('\n')}
                      onChange={(e) => setFormCourses(e.target.value.split('\n'))}
                      rows={3}
                      placeholder={'هوش مصنوعی\nپایگاه داده'}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>

                {/* Publications */}
                <div className="rounded-2xl border border-gray-100 dark:border-white/10 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-gray-600 dark:text-gray-300">منتخب مقالات</label>
                    <button
                      type="button"
                      onClick={() => setFormPublications(prev => [...prev, { title: '', journal: '', year: '', citations: '' }])}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> افزودن
                    </button>
                  </div>
                  {formPublications.length === 0 && <p className="text-[10px] text-gray-400">موردی ثبت نشده است.</p>}
                  {formPublications.map((pub, i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                      <input type="text" value={pub.title} onChange={(e) => { const next = [...formPublications]; next[i] = { ...next[i], title: e.target.value }; setFormPublications(next); }} placeholder="عنوان مقاله" className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                      <input type="text" value={pub.journal} onChange={(e) => { const next = [...formPublications]; next[i] = { ...next[i], journal: e.target.value }; setFormPublications(next); }} placeholder="مجله" className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                      <input type="text" value={pub.year} onChange={(e) => { const next = [...formPublications]; next[i] = { ...next[i], year: e.target.value }; setFormPublications(next); }} placeholder="سال" className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                      <div className="flex gap-2">
                        <input type="text" value={pub.citations} onChange={(e) => { const next = [...formPublications]; next[i] = { ...next[i], citations: e.target.value }; setFormPublications(next); }} placeholder="استناد" className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                        <button type="button" onClick={() => setFormPublications(prev => prev.filter((_, idx) => idx !== i))} className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Awards */}
                <div className="rounded-2xl border border-gray-100 dark:border-white/10 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-gray-600 dark:text-gray-300">افتخارات و جوایز</label>
                    <button
                      type="button"
                      onClick={() => setFormAwards(prev => [...prev, { title: '', year: '' }])}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> افزودن
                    </button>
                  </div>
                  {formAwards.length === 0 && <p className="text-[10px] text-gray-400">موردی ثبت نشده است.</p>}
                  {formAwards.map((award, i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                      <input type="text" value={award.title} onChange={(e) => { const next = [...formAwards]; next[i] = { ...next[i], title: e.target.value }; setFormAwards(next); }} placeholder="عنوان جایزه" className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                      <input type="text" value={award.year} onChange={(e) => { const next = [...formAwards]; next[i] = { ...next[i], year: e.target.value }; setFormAwards(next); }} placeholder="سال" className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                      <button type="button" onClick={() => setFormAwards(prev => prev.filter((_, idx) => idx !== i))} className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer justify-self-start">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">وضعیت انتشار</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormStatus('published')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    formStatus === 'published'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-500 border border-transparent'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  انتشار (نمایش در سایت عمومی)
                </button>
                <button
                  type="button"
                  onClick={() => setFormStatus('draft')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    formStatus === 'draft'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/40'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-500 border border-transparent'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  پیش‌نویس
                </button>
              </div>
              {!canApprove && (
                <p className="text-[10px] text-gray-400 mt-2">
                  شما مجوز انتشار ندارید — این عضو به‌صورت پیش‌نویس ذخیره می‌شود تا توسط مدیر منتشر شود.
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
            <button
              type="button"
              onClick={() => { setActiveTab('list'); handleResetForm(); }}
              className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {formLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {editingId ? 'ذخیره تغییرات' : 'ثبت عضو'}
            </button>
          </div>
        </form>
      )}

      {/* ===== Excel Import Modal ===== */}
      <AnimatePresence>
        {importOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => { setImportOpen(false); setImportRows([]); setImportFileName(''); setImportMessage(null); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white dark:bg-[#161618] rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                  ورود انبوه {TYPE_LABEL[activeType]} از اکسل
                </h3>
                <button
                  onClick={() => { setImportOpen(false); setImportRows([]); setImportFileName(''); setImportMessage(null); }}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Type selector inside import */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {TYPE_TABS.map((tab) => (
                  <button
                    key={tab.type}
                    onClick={() => setActiveType(tab.type)}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                      activeType === tab.type
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                        : 'border-gray-100 dark:border-white/10 text-gray-400 hover:border-emerald-500/30'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {importMessage && (
                <div className={`px-4 py-3 rounded-2xl text-xs font-bold mb-4 ${
                  importMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}>
                  {importMessage.text}
                </div>
              )}

              {/* File pick */}
              <div
                className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">
                  {importFileName || 'فایل اکسل را انتخاب کنید (xlsx / xls)'}
                </p>
                <p className="text-[11px] text-gray-400 mb-4">ستون‌های فایل می‌توانند فارسی یا انگلیسی باشند (نام، نام خانوادگی، تخصص، سمت، ایمیل و...)</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    انتخاب فایل
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
                    className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    دانلود نمونه
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImportFile(file);
                    e.target.value = '';
                  }}
                />
              </div>

              {/* Preview */}
              {importRows.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">
                    پیش‌نمایش: {importRows.length} ردیف خوانده شد
                  </p>
                  <div className="max-h-48 overflow-auto rounded-xl border border-gray-100 dark:border-white/10">
                    <table className="w-full text-[11px]">
                      <thead className="bg-gray-50 dark:bg-white/5 sticky top-0">
                        <tr>
                          {Object.keys(importRows[0]).slice(0, 6).map((key) => (
                            <th key={key} className="px-3 py-2 text-right font-black text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/10">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importRows.slice(0, 8).map((row, i) => (
                          <tr key={i} className="border-b border-gray-50 dark:border-white/5">
                            {Object.keys(row).slice(0, 6).map((key) => (
                              <td key={key} className="px-3 py-2 text-gray-600 dark:text-gray-300 truncate max-w-[150px]">{String(row[key] ?? '')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
                <button
                  onClick={() => { setImportOpen(false); setImportRows([]); setImportFileName(''); setImportMessage(null); }}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  بستن
                </button>
                <button
                  onClick={handleImportSubmit}
                  disabled={importRows.length === 0 || importLoading}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  {importLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {importLoading ? 'در حال ورود...' : `ورود ${importRows.length} ردیف`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== Media Manager ===== */}
      <MediaManager
        open={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={(url: string) => { setFormImageUrl(url); setShowMediaSelector(false); }}
      />

      {/* ===== Delete Confirmation Modal ===== */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white dark:bg-[#161618] rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-white/10"
            >
              <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-4">
                <Trash2 className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="text-base font-black text-gray-900 dark:text-white mb-2">حذف عضو</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                آیا از حذف این عضو مطمئن هستید؟ این عمل قابل بازگشت نیست.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-black hover:bg-rose-400 transition-colors cursor-pointer"
                >
                  حذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
