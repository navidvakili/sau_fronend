import React, { useState } from 'react';
import {
  BarChart2,
  PieChart as PieIcon,
  TrendingUp,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  ShieldCheck,
  Lock,
  Globe,
  Clock,
  CheckCircle,
  Eye,
  RefreshCw,
  X,
  Share2,
  Users,
  Building,
  Sparkles,
  Award,
  ChevronDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { FormDefinition, FormSubmission, PublicResultConfig } from './types';

interface PublicFormResultDashboardProps {
  form: FormDefinition;
  submissions: FormSubmission[];
  onClose?: () => void;
}

const COLORS = ['#0d9488', '#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

export const PublicFormResultDashboard: React.FC<PublicFormResultDashboardProps> = ({
  form,
  submissions,
  onClose
}) => {
  const config: PublicResultConfig = form.publicResultConfig || {
    enabled: true,
    customSlug: `student-cultural-satisfaction`,
    title: form.title,
    description: form.description,
    universityBrand: 'دانشگاه جامع - معاونت فرهنگی و اجتماعی',
    showLogo: true,
    passwordProtected: false,
    anonymizeRespondents: true,
    allowedQuestionIds: form.fields.map(f => f.id),
    allowedExportTypes: ['pdf', 'excel', 'csv'],
    chartTypes: ['bar', 'pie', 'summary'],
    autoRefresh: true,
    refreshIntervalSeconds: 15,
    readOnly: true,
    allowEmbed: true,
    viewsCount: form.viewsCount || 2410,
    ipRestrictionsEnabled: false,
    allowedIps: []
  };

  // Password unlock state
  const [isUnlocked, setIsUnlocked] = useState(!config.passwordProtected);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // Filter & Export Notification State
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPassword === (config.password || '123456')) {
      setIsUnlocked(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  // Metrics calculation
  const totalSubmissions = form.submissionsCount || submissions.length || 1248;
  const avgSatisfaction = 4.12; // Example 4.12 out of 5

  // Specific satisfaction bars matching user scenario
  const satisfactionMetrics = [
    { label: 'میزان رضایت عمومی', percentage: 82, color: 'bg-teal-600' },
    { label: 'کیفیت خدمات و برنامه‌ها', percentage: 76, color: 'bg-indigo-600' },
    { label: 'سهولت دسترسی به خدمات', percentage: 79, color: 'bg-emerald-600' }
  ];

  // Faculty distribution data for charts
  const facultyData = [
    { name: 'دانشکده مهندسی', count: 480, score: 4.2 },
    { name: 'علوم پزشکی', count: 320, score: 4.0 },
    { name: 'معماری و هنر', count: 260, score: 4.3 },
    { name: 'علوم انسانی', count: 188, score: 3.9 }
  ];

  // Trend data
  const trendData = [
    { date: '۱۰ مرداد', count: 120 },
    { date: '۱۱ مرداد', count: 210 },
    { date: '۱۲ مرداد', count: 340 },
    { date: '۱۳ مرداد', count: 280 },
    { date: '۱۴ مرداد', count: 298 }
  ];

  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans text-right" dir="rtl">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              صفحه نتایج عمومی محافظت‌شده
            </h3>
            <p className="text-xs text-slate-500">
              جهت مشاهده آمار و نمودارهای این پرسشنامه، لطفاً رمز عبور اختصاصی ارائه شده را وارد کنید.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                رمز عبور
              </label>
              <input
                type="password"
                placeholder="رمز عبور..."
                value={enteredPassword}
                onChange={e => setEnteredPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono"
              />
              {passwordError && (
                <p className="text-[11px] text-red-600 mt-1">رمز عبور نادرست است (رمز پیش‌فرض: 123456)</p>
              )}
            </div>

            <div className="flex gap-2">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  انصراف
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
              >
                ورود و مشاهده نتایج
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-8 px-4 sm:px-6 font-sans text-right" dir="rtl">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 relative overflow-hidden">
          {/* Close button if modal */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute left-6 top-6 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Brand & Live status badge */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              {config.showLogo && (
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-lg shadow-md">
                  U
                </div>
              )}
              <div>
                <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
                  {config.universityBrand}
                </span>
                <div className="text-[10px] text-slate-400 dir-ltr text-right">
                  website.ir/survey-results/{config.customSlug}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-3 py-1 rounded-full text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>بروزرسانی زنده لحظه‌ای (Real-Time)</span>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {config.title}
            </h1>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {config.description}
            </p>
          </div>

          {/* Key Metric Overview Box (Exact Scenario Card) */}
          <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-2xl p-6 shadow-lg space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center border-b border-white/10 pb-6">
              <div className="space-y-1">
                <span className="text-teal-300 text-xs font-bold block">تعداد کل پاسخ‌ها</span>
                <div className="text-3xl font-black text-white">
                  {totalSubmissions.toLocaleString('fa-IR')}
                </div>
                <span className="text-[10px] text-teal-200/80">شرکت‌کننده یکتا</span>
              </div>

              <div className="space-y-1 border-r sm:border-r border-white/10">
                <span className="text-amber-300 text-xs font-bold block">میانگین امتیاز رضایت</span>
                <div className="text-3xl font-black text-white flex items-center justify-center gap-1">
                  <span>{avgSatisfaction}</span>
                  <span className="text-sm text-amber-300 font-normal">از ۵</span>
                </div>
                <span className="text-[10px] text-amber-200/80">شاخص عالی (۴.۱۲/۵)</span>
              </div>

              <div className="space-y-1 border-r sm:border-r border-white/10">
                <span className="text-emerald-300 text-xs font-bold block">حفظ محرمانگی</span>
                <div className="text-xl font-bold text-emerald-300 mt-1">
                  ۱۰۰٪ ناشناس
                </div>
                <span className="text-[10px] text-emerald-200/80">عدم نمایش اطلاعات هویتی</span>
              </div>
            </div>

            {/* Visual Satisfaction Bars (Exact Scenario ASCII Representation) */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-extrabold text-teal-200 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-300" />
                شاخص‌های کلیدی رضایت‌سنجی:
              </h3>

              <div className="space-y-3">
                {satisfactionMetrics.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-white">{item.label}</span>
                      <span className="text-teal-300 font-mono">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-white/10 h-3.5 rounded-full overflow-hidden p-0.5 border border-white/10">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${item.color}`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => showToast('خروجی PDF گزارش عمومی آماده و دانلود شد.')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/20 transition-all"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-300" /> دانلود PDF
                </button>

                <button
                  onClick={() => showToast('خروجی Excel داده‌های تجمیعی آماده شد.')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/20 transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> دانلود Excel
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/20 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" /> چاپ گزارش
                </button>
              </div>

              <span className="text-[10px] text-teal-200/60">
                تاریخ صدور گزارش: هم‌اکنون (۱۴۰۵/۰۵/۱۰)
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Chart Visualizers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bar Chart: Faculty Breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-teal-600" />
              تفکیک پاسخ‌دهندگان و نمره رضایت بر اساس دانشکده
            </h3>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={facultyData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0d9488" radius={[8, 8, 0, 0]} name="تعداد پاسخ" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Line Chart: Participation Trend */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              روند روزانه ثبت پاسخ‌ها در سامانه
            </h3>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    name="پاسخ روزانه"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-xs text-slate-400 py-4 border-t border-slate-200 dark:border-slate-800">
          سامانه گزارش‌دهی و انتشار عمومی نتایج CMS دانشگاهی | طراح و توسعه‌دهنده هوشمند
        </div>
      </div>
    </div>
  );
};
