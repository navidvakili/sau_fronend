import React, { useState, useEffect, useRef } from 'react';
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
  MessageSquare
} from 'lucide-react';
import { FormDefinition, FormSubmission, FormStatus, FormType } from './types';
import { formTemplates, defaultTheme } from './mockData';
import {
  fetchForms,
  createForm,
  updateForm,
  updateFormStatus,
  cloneForm,
  deleteForm,
  fetchSubmissions,
  updateSubmissionStatus
} from './api';
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

interface SmartFormBuilderStudioProps {
  onOpenTab?: (tabId: string, title?: string) => void;
}

export const SmartFormBuilderStudio: React.FC<SmartFormBuilderStudioProps> = () => {
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'builder' | 'logic' | 'quiz' | 'theme' | 'submissions' | 'analytics' | 'sharing'>('builder');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isPublicPreviewOpen, setIsPublicPreviewOpen] = useState(false);

  // Filters for forms manager list
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | FormType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | FormStatus>('all');

  const activeForm = forms.find(f => f.id === activeFormId);

  // بارگذاری فهرست فرم‌ها از وب‌سرویس واقعی هنگام باز شدن ماژول
  useEffect(() => {
    fetchForms({ per_page: 100 })
      .then(res => setForms(res.data))
      .catch(() => setLoadError('بارگذاری فهرست فرم‌ها از سرور ناموفق بود.'))
      .finally(() => setIsLoadingForms(false));
  }, []);

  // بارگذاری پاسخ‌های فرم فعال — برای تب‌های «پاسخ‌ها» و «داشبورد آمار»
  useEffect(() => {
    if (!activeFormId) {
      setSubmissions([]);
      return;
    }
    fetchSubmissions(activeFormId, { per_page: 500 })
      .then(res => setSubmissions(res.data))
      .catch(() => setSubmissions([]));
  }, [activeFormId]);

  // ذخیرهٔ خودکار تغییرات فرم فعال روی سرور — با تاخیر کوتاه تا در هر ضربه کلید درخواست نزند
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistFormChange = (updatedForm: FormDefinition) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      updateForm(updatedForm.id, updatedForm).catch(() => setSaveError('ذخیرهٔ تغییرات این فرم روی سرور ناموفق بود.'));
    }, 700);
  };

  // Handle Form Update
  const handleUpdateActiveForm = (updatedForm: FormDefinition) => {
    setForms(prev => prev.map(f => (f.id === updatedForm.id ? updatedForm : f)));
    persistFormChange(updatedForm);
  };

  // Create new blank form
  const handleCreateNewForm = (type: FormType = 'form') => {
    const draft: Partial<FormDefinition> & { title: string } = {
      title: type === 'quiz' ? 'آزمون آنلاین جدید' : type === 'survey' ? 'پرسشنامه جدید' : 'فرم داده‌آمای جدید',
      description: 'لطفاً توضیحات و راهنمای تکمیل فرم را اینجا وارد کنید...',
      type,
      status: 'draft',
      category: 'عمومی',
      tags: ['جدید'],
      steps: [{ id: 's1', title: 'گام نخست', order: 1 }],
      fields: [],
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
        trackingCodePrefix: 'FRM',
        sendEmailNotification: false,
        sendSmsNotification: false
      }
    };

    createForm(draft)
      .then(newForm => {
        setForms(prev => [newForm, ...prev]);
        setActiveFormId(newForm.id);
        setActiveTab('builder');
      })
      .catch(() => setSaveError('ایجاد فرم جدید روی سرور ناموفق بود.'));
  };

  // Clone Form
  const handleCloneForm = (formToClone: FormDefinition) => {
    cloneForm(formToClone.id)
      .then(cloned => setForms(prev => [cloned, ...prev]))
      .catch(() => setSaveError('کپی کردن فرم ناموفق بود.'));
  };

  // Delete Form
  const handleDeleteForm = (formId: string) => {
    deleteForm(formId)
      .then(() => {
        setForms(prev => prev.filter(f => f.id !== formId));
        if (activeFormId === formId) setActiveFormId(null);
      })
      .catch(() => setSaveError('حذف فرم ناموفق بود.'));
  };

  // انتشار فرم — نشانی عمومی واقعی فقط پس از این فعال می‌شود
  const handlePublishForm = (formId: string) => {
    updateFormStatus(formId, 'published')
      .then(updated => setForms(prev => prev.map(f => (f.id === updated.id ? updated : f))))
      .catch(() => setSaveError('انتشار فرم ناموفق بود.'));
  };

  // تغییر وضعیت بررسی یک پاسخ (تایید/رد/یادداشت کارشناس)
  const handleUpdateSubmissionStatus = (subId: string, status: FormSubmission['status'], note?: string) => {
    if (!activeFormId) return;
    updateSubmissionStatus(activeFormId, subId, { status, internal_notes: note })
      .then(updated => setSubmissions(prev => prev.map(s => (s.id === updated.id ? updated : s))))
      .catch(() => setSaveError('به‌روزرسانی وضعیت پاسخ ناموفق بود.'));
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
    <div className="space-y-6 pb-12 font-sans text-right" dir="rtl">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-teal-200 text-xs font-extrabold border border-white/10">
            <Sparkles className="w-4 h-4 text-amber-300" /> ماژول حرفه‌ای CMS Enterprise
          </div>
          <h1 className="text-2xl md:text-3xl font-black leading-tight">
            سامانه جامع فرم‌ساز و پرسشنامه‌ساز هوشمند
          </h1>
          <p className="text-xs md:text-sm text-teal-100/90 leading-relaxed">
            ایجاد انواع فرم‌های تماس، پرسشنامه‌های ارزیابی اساتید، آزمون‌های آنلاین نمره‌دار و فرم‌های چندمرحله‌ای همایش‌ها همراه با منطق شرطی، تحلیل آمار و هوش مصنوعی.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-5 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-9 font-extrabold rounded-2xl text-xs flex items-center gap-2 shadow-lg hover:shadow-amber-500/20 transition-all text-slate-900"
          >
            <Wand2 className="w-4 h-4" /> ساخت هوشمند با AI
          </button>

          <button
            onClick={() => handleCreateNewForm('survey')}
            className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-extrabold rounded-2xl text-xs backdrop-blur-md flex items-center gap-2 border border-white/20 transition-all"
          >
            <Plus className="w-4 h-4" /> ساخت پرسشنامه جدید
          </button>
        </div>
      </div>

      {/* نوار خطای ذخیره/بارگذاری — روی سرویس واقعی */}
      {(loadError || saveError) && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-2xl p-3.5 flex items-center justify-between gap-3">
          <span>{loadError || saveError}</span>
          <button onClick={() => { setLoadError(null); setSaveError(null); }} className="text-rose-500 hover:text-rose-700 shrink-0">
            &times;
          </button>
        </div>
      )}

      {/* Main Studio Work Area */}
      {isLoadingForms ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-xs text-slate-400 font-bold">
          در حال بارگذاری فرم‌ها...
        </div>
      ) : activeForm ? (
        /* Active Form Editor Layout */
        <div className="space-y-6">
          {/* Editor Header Navigation Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveFormId(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
                title="بازگشت به فهرست فرم‌ها"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {activeForm.title}
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      activeForm.status === 'published'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {activeForm.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  آخرین بروزرسانی: {activeForm.updatedAt} | نسخه {activeForm.version}
                </p>
              </div>
            </div>

            {/* Top Navigation Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold overflow-x-auto">
              {[
                { id: 'builder', label: 'طراح دیداری', icon: FileText },
                { id: 'logic', label: 'منطق شرطی', icon: GitBranch },
                { id: 'quiz', label: 'آزمون و نمره‌دهی', icon: Award },
                { id: 'theme', label: 'پوسته و ظاهر', icon: Palette },
                { id: 'submissions', label: 'پاسخ‌ها', icon: Inbox },
                { id: 'analytics', label: 'داشبورد آمار', icon: BarChart2 },
                { id: 'sharing', label: 'دسترسی و انتشار نتایج', icon: ShieldCheck }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPublicPreviewOpen(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all"
                title="نمایش صفحه عمومی نتایج"
              >
                <Eye className="w-4 h-4" /> صفحه عمومی نتایج
              </button>

              <button
                onClick={() => setIsPublishModalOpen(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all"
              >
                <Share2 className="w-4 h-4" /> انتشار و جاگذاری
              </button>
            </div>
          </div>

          {/* Active Tab View */}
          {activeTab === 'builder' && (
            <FormBuilderCanvas form={activeForm} onChange={handleUpdateActiveForm} />
          )}

          {activeTab === 'logic' && (
            <FormLogicEditor form={activeForm} onChange={handleUpdateActiveForm} />
          )}

          {activeTab === 'quiz' && (
            <FormQuizScoring form={activeForm} onChange={handleUpdateActiveForm} />
          )}

          {activeTab === 'theme' && (
            <FormThemeEditor form={activeForm} onChange={handleUpdateActiveForm} />
          )}

          {activeTab === 'submissions' && (
            <SubmissionsManager
              form={activeForm}
              submissions={submissions.filter(s => s.formId === activeForm.id)}
              onUpdateSubmissionStatus={handleUpdateSubmissionStatus}
            />
          )}

          {activeTab === 'analytics' && (
            <FormAnalyticsDashboard
              form={activeForm}
              submissions={submissions.filter(s => s.formId === activeForm.id)}
            />
          )}

          {activeTab === 'sharing' && (
            <FormResultSharingStudio
              form={activeForm}
              onChange={handleUpdateActiveForm}
              onOpenPublicPreview={() => setIsPublicPreviewOpen(true)}
            />
          )}
        </div>
      ) : (
        /* Form Manager Dashboard / List of Forms */
        <div className="space-y-8">
          {/* Filters & Search */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="جستجو در بین فرم‌ها، پرسشنامه‌ها و گروه‌ها..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              <span>نوع:</span>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as any)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="all">همه موارد</option>
                <option value="survey">پرسشنامه / نظرسنجی</option>
                <option value="quiz">کوئیز / آزمون آنلاین</option>
                <option value="registration">فرم ثبت‌نام</option>
                <option value="form">فرم عمومی</option>
              </select>

              <span>وضعیت:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="published">منتشر شده</option>
                <option value="draft">پیش‌نویس</option>
              </select>
            </div>
          </div>

          {/* Forms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredForms.map(formItem => (
              <div
                key={formItem.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        formItem.type === 'survey'
                          ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                          : formItem.type === 'quiz'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {formItem.type === 'survey'
                        ? 'پرسشنامه'
                        : formItem.type === 'quiz'
                        ? 'آزمون آنلاین'
                        : 'فرم ثبت‌نام'}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                        formItem.status === 'published'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {formItem.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1 group-hover:text-teal-600 transition-colors">
                      {formItem.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {formItem.description}
                    </p>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-teal-600" />
                      <span>{formItem.viewsCount} بازدید</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Inbox className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{formItem.submissionsCount} پاسخ</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setActiveFormId(formItem.id);
                      setActiveTab('builder');
                    }}
                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow"
                  >
                    <Edit className="w-3.5 h-3.5" /> ویرایش و مدیریت
                  </button>

                  <button
                    onClick={() => handleCloneForm(formItem)}
                    className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-xl transition-colors"
                    title="کپی/کپچر"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteForm(formItem.id)}
                    className="p-2.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Template Library Section */}
          <div className="pt-8 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-600" /> کتابخانه قالب‌های پیش‌ساخته آماده (Ready Templates)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formTemplates.map(tpl => (
                <div
                  key={tpl.id}
                  onClick={() => handleCreateNewForm('survey')}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 cursor-pointer transition-all hover:shadow-lg flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{tpl.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">{tpl.description}</p>
                    <span className="text-[10px] text-teal-600 font-bold mt-2 block">
                      استفاده از این قالب ➔
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Modal */}
      <AiFormAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onFormGenerated={generatedForm => {
          const draft: Partial<FormDefinition> & { title: string } = {
            title: generatedForm.title || 'فرم هوشمند تولید شده',
            description: generatedForm.description || '',
            type: generatedForm.type || 'survey',
            status: 'draft',
            category: 'تولید شده با AI',
            tags: ['هوش مصنوعی'],
            steps: generatedForm.steps || [{ id: 's1', title: 'گام اصلی', order: 1 }],
            fields: generatedForm.fields || [],
            logicRules: generatedForm.logicRules || [],
            quizConfig: generatedForm.quizConfig || {
              isQuiz: false,
              showInstantResult: false,
              allowNegativeScore: false,
              randomizeQuestions: false,
              gradeThresholds: []
            },
            theme: defaultTheme,
            settings: generatedForm.settings || {
              allowAnonymous: true,
              limitOnePerUser: false,
              requireAuth: false,
              enableCaptcha: true,
              enableAutoSave: true,
              showProgressBar: true,
              customSuccessMessage: 'اطلاعات با موفقیت ثبت شد.',
              generateTrackingCode: true,
              trackingCodePrefix: 'AI',
              sendEmailNotification: false,
              sendSmsNotification: false
            }
          };

          createForm(draft)
            .then(newForm => {
              setForms(prev => [newForm, ...prev]);
              setActiveFormId(newForm.id);
              setActiveTab('builder');
            })
            .catch(() => setSaveError('ایجاد فرم تولیدشده با AI روی سرور ناموفق بود.'));
        }}
      />

      {/* Embed Publish Modal */}
      {activeForm && (
        <FormPublishModal
          form={activeForm}
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          onPublish={() => handlePublishForm(activeForm.id)}
        />
      )}

      {/* Public Results Dashboard Overlay Modal */}
      {activeForm && isPublicPreviewOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 overflow-y-auto">
          <PublicFormResultDashboard
            form={activeForm}
            submissions={submissions.filter(s => s.formId === activeForm.id)}
            onClose={() => setIsPublicPreviewOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
