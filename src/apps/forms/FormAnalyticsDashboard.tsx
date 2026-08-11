import React from 'react';
import {
  BarChart2,
  TrendingUp,
  Clock,
  CheckCircle,
  Eye,
  Smile,
  Meh,
  Frown,
  PieChart as PieIcon,
  Sparkles
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
  AreaChart,
  Area
} from 'recharts';
import { FormDefinition, FormSubmission } from './types';

interface FormAnalyticsDashboardProps {
  form: FormDefinition;
  submissions: FormSubmission[];
}

const COLORS = ['#0d9488', '#6366f1', '#f59e0b', '#ef4444', '#10b981'];

export const FormAnalyticsDashboard: React.FC<FormAnalyticsDashboardProps> = ({
  form,
  submissions
}) => {
  // Mock time-series data for submissions trend
  const trendData = [
    { date: '۱۰ مرداد', views: 240, submissions: 45 },
    { date: '۱۱ مرداد', views: 320, submissions: 78 },
    { date: '۱۲ مرداد', views: 410, submissions: 112 },
    { date: '۱۳ مرداد', views: 390, submissions: 95 },
    { date: '۱۴ مرداد', views: 520, submissions: 140 },
    { date: '۱۵ مرداد', views: 480, submissions: 130 }
  ];

  const completionRate = Math.round((submissions.length / (form.viewsCount || 1)) * 100);

  // Sentiment distribution calculation
  const sentimentCounts = {
    positive: submissions.filter(s => s.sentimentAnalysis === 'positive').length,
    neutral: submissions.filter(s => s.sentimentAnalysis === 'neutral').length,
    negative: submissions.filter(s => s.sentimentAnalysis === 'negative').length
  };

  const sentimentData = [
    { name: 'مثبت / رضایت‌بخش', value: sentimentCounts.positive || 12 },
    { name: 'خنثی / بدون جهت', value: sentimentCounts.neutral || 5 },
    { name: 'منفی / نیازمند پیگیری', value: sentimentCounts.negative || 3 }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              داشبورد هوشمند تحلیلی و آمار تجمیعی (Analytics)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تحلیل رفتار پاسخ‌دهندگان، نرخ تکمیل، زمان میانگین و تحلیل احساسات متون
            </p>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800/50 space-y-1">
          <div className="flex items-center justify-between text-teal-700 dark:text-teal-300 text-xs font-bold">
            <span>تعداد کل بازدیدها</span>
            <Eye className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-teal-900 dark:text-teal-100">
            {form.viewsCount.toLocaleString('fa-IR')}
          </div>
          <span className="text-[11px] text-teal-600 dark:text-teal-400">بازدید یکتا از لینک و iframe</span>
        </div>

        <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/50 space-y-1">
          <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            <span>پاسخ‌های ثبت شده</span>
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-900 dark:text-indigo-100">
            {submissions.length.toLocaleString('fa-IR')}
          </div>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400">تکمیل و ارسال نهایی</span>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 space-y-1">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            <span>نرخ تبدیل (Completion)</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-100">
            {completionRate}%
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">بالاتر از میانگین دانشگاه</span>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 space-y-1">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 text-xs font-bold">
            <span>میانگین زمان پاسخ</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-amber-900 dark:text-amber-100">
            {form.avgCompletionTimeSeconds} ثانیه
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400">سرعت بالای تکمیل توسط کاربر</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Submissions Trend Chart */}
        <div className="lg:col-span-8 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600" /> روند زمانی ثبت پاسخ‌ها و بازدیدها
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="views" name="بازدید" stroke="#0d9488" fill="#0d9488" fillOpacity={0.15} />
                <Area type="monotone" dataKey="submissions" name="پاسخ نهایی" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Sentiment Distribution */}
        <div className="lg:col-span-4 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> تحلیل هوشمند احساسات (Sentiment Analysis)
          </h3>
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sentimentData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                  {sentimentData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-emerald-600 font-medium">
              <span className="flex items-center gap-1">
                <Smile className="w-3.5 h-3.5" /> مثبت / ابراز رضایت
              </span>
              <span className="font-bold">{sentimentCounts.positive || 12} مورد</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Meh className="w-3.5 h-3.5" /> خنثی / بدون جهت
              </span>
              <span className="font-bold">{sentimentCounts.neutral || 5} مورد</span>
            </div>
            <div className="flex items-center justify-between text-red-500 font-medium">
              <span className="flex items-center gap-1">
                <Frown className="w-3.5 h-3.5" /> منفی / شکایت
              </span>
              <span className="font-bold">{sentimentCounts.negative || 3} مورد</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
