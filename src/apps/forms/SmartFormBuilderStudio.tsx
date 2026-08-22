import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Plus,
  Sparkles,
  Search,
  CheckCircle,
  Copy,
  Trash2,
  Edit,
  Share2,
  Inbox,
  BarChart2,
  Wand2,
  Filter,
  Layers,
  Award,
  Settings2,
  GitBranch,
  Palette,
  Eye,
  ArrowLeft,
  Clock,
  ShieldCheck,
  Tag,
  HelpCircle,
  MessageSquare,
  Play,
  Grid,
  Code,
  Type,
  AlignLeft,
  CheckSquare,
  Star,
  Table,
  Upload,
  Calendar,
  PenTool,
  CheckCircle2,
  Hash,
  Mail,
  Phone,
  ListFilter,
  CircleDot,
  SlidersHorizontal,
  LayoutGrid,
  Users,
  Activity,
  Sliders
} from 'lucide-react';
import { FormDefinition, FormField, FormSubmission, FormStatus, FormType, FieldType } from './types';
import { sampleForms, sampleSubmissions, formTemplates, defaultTheme } from './mockData';
import { FormBuilderCanvas } from './FormBuilderCanvas';
import { FormLogicEditor } from './FormLogicEditor';
import { FormQuizScoring } from './FormQuizScoring';
import { FormThemeEditor } from './FormThemeEditor';
import { SubmissionsManager } from './SubmissionsManager';
import { FormAnalyticsDashboard } from './FormAnalyticsDashboard';
import { FormResultSharingStudio } from './FormResultSharingStudio';
import { PublicFormResultDashboard } from './PublicFormResultDashboard';
import { AiFormAssistantModal } from './AiFormAssistantModal';
import { FormPublishModal } from './FormPublishModal';
import FormTemplateLibraryModal from './FormTemplateLibraryModal';
import FormCodeExportModal from './FormCodeExportModal';
import { FormRespondentView } from './FormRespondentView';

interface SmartFormBuilderStudioProps {
  onOpenTab?: (tabId: string, title?: string) => void;
}

export const SmartFormBuilderStudio: React.FC<SmartFormBuilderStudioProps> = () => {
  const [forms, setForms] = useState<FormDefinition[]>(sampleForms);
  const [submissions, setSubmissions] = useState<FormSubmission[]>(sampleSubmissions);
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [scrollToFieldId, setScrollToFieldId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'builder' | 'logic' | 'quiz' | 'theme' | 'submissions' | 'analytics' | 'sharing'>('builder');

  // Breakpoints / Viewport width
  const [activeBreakpoint, setActiveBreakpoint] = useState<'1240' | '1024' | '768' | '380'>('1240');

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPublicPreviewOpen, setIsPublicPreviewOpen] = useState(false);

  // Filters for forms manager list
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | FormType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | FormStatus>('all');

  const activeForm = forms.find(f => f.id === activeFormId) || null;

  // Handle Form Update
  const handleUpdateActiveForm = (updatedForm: FormDefinition) => {
    setForms(prev => prev.map(f => (f.id === updatedForm.id ? updatedForm : f)));
  };

  // Create new blank form
  const handleCreateNewForm = (type: FormType = 'form') => {
    const newForm: FormDefinition = {
      id: `form_${Date.now()}`,
      title: type === 'quiz' ? 'آزمون آنلاین جدید' : type === 'survey' ? 'پرسشنامه جدید' : 'فرم داده‌آمای جدید',
      description: 'لطفاً توضیحات و راهنمای تکمیل فرم را اینجا وارد کنید...',
      type,
      status: 'draft',
      category: 'عمومی',
      tags: ['جدید'],
      ownerName: 'مدیر سامانه',
      version: 1,
      createdAt: '۱۴۰۵/۰۵/۱۰',
      updatedAt: '۱۴۰۵/۰۵/۱۰',
      steps: [{ id: 's1', title: 'گام نخست', order: 1 }],
      fields: [
        {
          id: `f_${Date.now()}_1`,
          type: 'text',
          label: 'نام و نام خانوادگی',
          placeholder: 'مثال: علیرضا محمدی',
          stepId: 's1',
          columnWidth: '50%',
          validation: { required: true }
        },
        {
          id: `f_${Date.now()}_2`,
          type: 'email',
          label: 'پست الکترونیک',
          placeholder: 'name@domain.com',
          stepId: 's1',
          columnWidth: '50%',
          validation: { required: true }
        }
      ],
      logicRules: [],
      quizConfig: {
        isQuiz: type === 'quiz',
        showInstantResult: type === 'quiz',
        allowNegativeScore: false,
        randomizeQuestions: false,
        gradeThresholds: []
      },
      theme: defaultTheme,
      settings: {
        allowAnonymous: true,
        limitOnePerUser: false,
        requireAuth: false,
        enableCaptcha: true,
        enableAutoSave: true,
        showProgressBar: true,
        customSuccessMessage: 'اطلاعات شما با موفقیت ثبت شد.',
        generateTrackingCode: true,
        trackingCodePrefix: 'FRM-2026',
        sendEmailNotification: false,
        sendSmsNotification: false
      },
      auditLogs: [{ id: `al_${Date.now()}`, userName: 'کاربر سیستم', action: 'ایجاد اولیه فرم', timestamp: 'هم‌اکنون' }],
      viewsCount: 0,
      submissionsCount: 0,
      avgCompletionTimeSeconds: 0
    };

    setForms([newForm, ...forms]);
    setActiveFormId(newForm.id);
    setActiveTab('builder');
  };

  // Quick Insert Field from Subtoolbar
  const handleQuickInsertField = (type: FieldType, label: string) => {
    if (!activeForm) return;
    const activeStep = activeForm.steps[0]?.id || 's1';
    const newField: FormField = {
      id: `f_${Date.now()}`,
      type,
      label: `سوال جدید ${activeForm.fields.length + 1}: ${label}`,
      placeholder: 'متن راهنما را وارد کنید...',
      stepId: activeStep,
      columnWidth: '100%',
      validation: { required: false },
      options: ['گزینه ۱', 'گزینه ۲', 'گزینه ۳'].map((lbl, idx) => ({
        id: `opt_${Date.now()}_${idx}`,
        label: lbl,
        value: `val_${idx + 1}`
      }))
    };

    handleUpdateActiveForm({
      ...activeForm,
      fields: [...activeForm.fields, newField]
    });
    setScrollToFieldId(newField.id);
    setActiveTab('builder');
  };

  // Clone Form
  const handleCloneForm = (formToClone: FormDefinition) => {
    const cloned: FormDefinition = {
      ...formToClone,
      id: `form_${Date.now()}`,
      title: `${formToClone.title} (نسخه کپی)`,
      status: 'draft',
      createdAt: '۱۴۰۵/۰۵/۱۰',
      updatedAt: '۱۴۰۵/۰۵/۱۰',
      viewsCount: 0,
      submissionsCount: 0
    };
    setForms([cloned, ...forms]);
  };

  // Delete Form
  const handleDeleteForm = (formId: string) => {
    setForms(forms.filter(f => f.id !== formId));
    if (activeFormId === formId) {
      setActiveFormId(null);
    }
  };

  // Filtered forms list
  const filteredForms = forms.filter(f => {
    const matchesSearch =
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || f.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white font-sans overflow-hidden select-none rtl text-right transition-colors">
      {/* 1. TOP STUDIO HEADER TOOLBAR */}
      <div className="h-14 border-b border-gray-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 flex items-center justify-between px-4 z-20 shadow-xs shrink-0">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          {activeForm && (
            <button
              onClick={() => setActiveFormId(null)}
              className="p-2 rounded-xl bg-teal-50 dark:bg-teal-500/20 hover:bg-teal-100 dark:hover:bg-teal-500/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 transition-colors cursor-pointer"
              title="بازگشت به فهرست فرم‌ها"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          )}
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-600 dark:from-teal-500 dark:to-indigo-500 flex items-center justify-center font-black text-lg text-white shadow-md shadow-teal-500/20">
            F
          </div>
          <div>
            <h1 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>سیستم هوشمند فرم‌ساز و پرسشنامه‌ساز دیداری</span>
              <span className="px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-[10px] border border-teal-200 dark:border-teal-500/30 font-mono font-bold">
                v2.4 Pro
              </span>
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {activeForm ? activeForm.title : 'Visual Form & Survey Intelligence Engine'}
            </p>
          </div>
        </div>

        {/* Center Breakpoint & Design Mode Badge */}
        {activeForm && (
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 text-[11px] font-extrabold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Design Mode</span>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-gray-200 dark:border-slate-800 text-xs">
              {(['1240', '1024', '768', '380'] as const).map(bp => (
                <button
                  key={bp}
                  onClick={() => setActiveBreakpoint(bp)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    activeBreakpoint === bp
                      ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {bp}px
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Grid className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>کتابخانه قالب‌ها</span>
          </button>

          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Wand2 className="w-4 h-4 text-amber-500" />
            <span>دستیار هوش مصنوعی</span>
          </button>

          {activeForm && (
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Code className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>دریافت کد</span>
            </button>
          )}

          {activeForm && (
            <button
              onClick={() => setIsPreviewModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-400 text-white dark:text-slate-950 font-black text-xs transition-all shadow-md shadow-teal-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>پیش‌نمایش زنده</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. SUB-TOOLBAR FOR PALETTE SHORTCUTS & STUDIO WORKSPACE TABS */}
      <div className="h-11 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 flex items-center justify-between text-xs z-10 shrink-0">
        {/* Left Quick Add Elements Menu */}
        {activeForm ? (
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-slate-500 font-bold text-[11px] ml-2 shrink-0">افزودن سریع:</span>
            <button
              onClick={() => handleQuickInsertField('text', 'متن کوتاه')}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer border border-gray-200 dark:border-slate-800 shadow-xs shrink-0"
            >
              <Type className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>متن</span>
            </button>
            <button
              onClick={() => handleQuickInsertField('textarea', 'توضیحات')}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer border border-gray-200 dark:border-slate-800 shadow-xs shrink-0"
            >
              <AlignLeft className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>توضیحات</span>
            </button>
            <button
              onClick={() => handleQuickInsertField('select', 'منوی کشویی')}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer border border-gray-200 dark:border-slate-800 shadow-xs shrink-0"
            >
              <ListFilter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>کشویی</span>
            </button>
            <button
              onClick={() => handleQuickInsertField('rating', 'رتبه‌بندی ستاره‌ای')}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer border border-gray-200 dark:border-slate-800 shadow-xs shrink-0"
            >
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span>امتیاز</span>
            </button>
            <button
              onClick={() => handleQuickInsertField('matrix', 'جدول ماتریسی')}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer border border-gray-200 dark:border-slate-800 shadow-xs shrink-0"
            >
              <Table className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>ماتریس</span>
            </button>
            <button
              onClick={() => handleQuickInsertField('file', 'بارگذاری فایل')}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer border border-gray-200 dark:border-slate-800 shadow-xs shrink-0"
            >
              <Upload className="w-3.5 h-3.5 text-orange-500" />
              <span>فایل</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold text-[11px]">فهرست تمام فرم‌ها و پرسشنامه‌های فعال</span>
          </div>
        )}

        {/* Right Form Tabs / Switcher */}
        {activeForm ? (
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'builder', label: 'طراح دیداری', icon: FileText },
              { id: 'logic', label: 'منطق شرطی', icon: GitBranch },
              { id: 'quiz', label: 'آزمون و نمره', icon: Award },
              { id: 'theme', label: 'پوسته', icon: Palette },
              { id: 'submissions', label: `پاسخ‌ها (${submissions.filter(s => s.formId === activeForm.id).length})`, icon: Inbox },
              { id: 'analytics', label: 'آمار', icon: BarChart2 },
              { id: 'sharing', label: 'اشتراک و انتشار', icon: ShieldCheck }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 text-[11px] shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 font-black shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-gray-200 dark:border-slate-800'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCreateNewForm('survey')}
              className="px-3 py-1 rounded-xl bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ساخت پرسشنامه جدید</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. MAIN WORKSPACE / TAB CONTENT */}
      {activeForm ? (
        <div className="flex-1 flex overflow-hidden relative">
          {activeTab === 'builder' && (
            <FormBuilderCanvas
              form={activeForm}
              onChange={handleUpdateActiveForm}
              activeBreakpoint={activeBreakpoint}
              scrollToFieldId={scrollToFieldId}
            />
          )}

          {activeTab === 'logic' && (
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
              <FormLogicEditor form={activeForm} onChange={handleUpdateActiveForm} />
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
              <FormQuizScoring form={activeForm} onChange={handleUpdateActiveForm} />
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
              <FormThemeEditor form={activeForm} onChange={handleUpdateActiveForm} />
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
              <SubmissionsManager
                form={activeForm}
                submissions={submissions.filter(s => s.formId === activeForm.id)}
              />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
              <FormAnalyticsDashboard
                form={activeForm}
                submissions={submissions.filter(s => s.formId === activeForm.id)}
              />
            </div>
          )}

          {activeTab === 'sharing' && (
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
              <FormResultSharingStudio
                form={activeForm}
                onChange={handleUpdateActiveForm}
                onOpenPublicPreview={() => setIsPublicPreviewOpen(true)}
              />
            </div>
          )}
        </div>
      ) : (
        /* FORM MANAGER / DASHBOARD LIST VIEW */
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40 space-y-6">
          {/* Top Banner Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">کل فرم‌های فعال</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{forms.length}</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">کل پاسخ‌های ثبت‌شده</span>
                <span className="text-2xl font-black text-teal-600 dark:text-teal-400 font-mono">
                  {forms.reduce((acc, f) => acc + f.submissionsCount, 0)}
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Inbox className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">کل بازدیدهای یکتا</span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {forms.reduce((acc, f) => acc + f.viewsCount, 0)}
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">نرخ تکمیل میانگین</span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">۸۴.۲٪</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <BarChart2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search and Filters Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="جستجو در نام فرم، دسته‌بندی و برچسب‌ها..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-bold">نوع:</span>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 font-bold"
              >
                <option value="all">همه انواع فرم‌ها</option>
                <option value="survey">پرسشنامه / نظرسنجی</option>
                <option value="quiz">آزمون آنلاین نمره‌دار</option>
                <option value="registration">فرم ثبت‌نام رویداد</option>
                <option value="form">فرم عمومی و تماس</option>
              </select>

              <span className="text-slate-500 font-bold mr-2">وضعیت:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 font-bold"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="published">منتشر شده</option>
                <option value="draft">پیش‌نویس</option>
              </select>
            </div>
          </div>

          {/* Forms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredForms.map(formItem => (
              <div
                key={formItem.id}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 hover:border-teal-500 dark:hover:border-teal-500 transition-all hover:shadow-xl flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-0.5 rounded-full text-[10px] font-bold ${
                        formItem.status === 'published'
                          ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                          : 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                      }`}
                    >
                      {formItem.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      v{formItem.version} • {formItem.updatedAt}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1">
                      {formItem.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {formItem.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-gray-100 dark:border-slate-800/80">
                    <span className="font-bold flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-teal-600" />
                      {formItem.fields.length} سوال
                    </span>
                    <span>•</span>
                    <span className="font-bold flex items-center gap-1">
                      <Inbox className="w-3.5 h-3.5 text-indigo-600" />
                      {formItem.submissionsCount} پاسخ
                    </span>
                    <span>•</span>
                    <span className="font-bold flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      {formItem.viewsCount} بازدید
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCloneForm(formItem)}
                      className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                      title="کپی فرم"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteForm(formItem.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                      title="حذف فرم"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setActiveFormId(formItem.id);
                      setActiveTab('builder');
                    }}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-teal-500/20 cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                    <span>ویرایش در بوم استودیو</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MODALS */}
      {/* Template Library Modal */}
      <FormTemplateLibraryModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectForm={f => {
          setForms([f, ...forms]);
          setActiveFormId(f.id);
          setActiveTab('builder');
        }}
        currentForm={activeForm}
      />

      {/* Code Export Modal */}
      {activeForm && (
        <FormCodeExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          form={activeForm}
        />
      )}

      {/* AI Assistant Modal */}
      <AiFormAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onFormGenerated={newAiForm => {
          const generatedForm: FormDefinition = {
            ...sampleForms[0],
            ...newAiForm,
            id: `form_${Date.now()}`,
            createdAt: '۱۴۰۵/۰۵/۱۰',
            updatedAt: '۱۴۰۵/۰۵/۱۰',
            fields: newAiForm.fields || [],
            steps: newAiForm.steps || [{ id: 's_ai', title: 'گام اصلی فرم', order: 1 }],
            auditLogs: [],
            viewsCount: 0,
            submissionsCount: 0,
            avgCompletionTimeSeconds: 0
          };
          setForms([generatedForm, ...forms]);
          setActiveFormId(generatedForm.id);
          setActiveTab('builder');
        }}
      />

      {/* Publish & Share Modal */}
      {activeForm && (
        <FormPublishModal
          form={activeForm}
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
        />
      )}

      {/* Public Results Modal */}
      {activeForm && isPublicPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setIsPublicPreviewOpen(false)}
              className="absolute left-6 top-6 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900"
            >
              ✕
            </button>
            <PublicFormResultDashboard
              form={activeForm}
              submissions={submissions.filter(s => s.formId === activeForm.id)}
            />
          </div>
        </div>
      )}

      {/* Interactive Live Preview Modal (Matching SliderStudio InteractivePreviewModal) */}
      {activeForm && isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col p-4 animate-in fade-in select-none rtl text-right">
          <div className="w-full max-w-4xl mx-auto flex items-center justify-between py-2 px-4 bg-slate-900 border border-slate-800 rounded-2xl mb-4 text-white">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-black">پیش‌نمایش زنده و آزمایشی فرم کاربر</span>
            </div>
            <button
              onClick={() => setIsPreviewModalOpen(false)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl text-slate-300 hover:text-white"
            >
              بستن پیش‌نمایش
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto pb-12">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-slate-800 shadow-2xl">
              <FormRespondentView form={activeForm} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
