import React from 'react';
import { Award, Clock, Percent, ShieldAlert, Plus, Trash2, CheckCircle } from 'lucide-react';
import { FormDefinition, GradeThreshold } from './types';

interface FormQuizScoringProps {
  form: FormDefinition;
  onChange: (updatedForm: FormDefinition) => void;
}

export const FormQuizScoring: React.FC<FormQuizScoringProps> = ({ form, onChange }) => {
  const quizConfig = form.quizConfig;

  const handleToggleQuizMode = (enabled: boolean) => {
    onChange({
      ...form,
      quizConfig: {
        ...quizConfig,
        isQuiz: enabled
      }
    });
  };

  const handleUpdateQuiz = (key: string, val: any) => {
    onChange({
      ...form,
      quizConfig: {
        ...quizConfig,
        [key]: val
      }
    });
  };

  const handleAddGradeThreshold = () => {
    const newGt: GradeThreshold = {
      id: `gt_${Date.now()}`,
      minScore: 0,
      maxScore: 50,
      gradeLabel: 'نیازمند تلاش',
      feedbackText: 'لطفاً منابع آموزشی را مجدداً مطالعه فرمایید.',
      color: '#ef4444'
    };
    handleUpdateQuiz('gradeThresholds', [...(quizConfig.gradeThresholds || []), newGt]);
  };

  const handleDeleteGradeThreshold = (id: string) => {
    handleUpdateQuiz(
      'gradeThresholds',
      quizConfig.gradeThresholds.filter(g => g.id !== id)
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              تنظیمات آزمون آنلاین، سیستم نمره‌دهی و صدور کارنامه
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تبدیل فرم به آزمون هوشمند با کلید پاسخ، سقف زمانی، بازه نمراتی و بازخورد اختصاصی
            </p>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-4 py-2 rounded-xl">
          <input
            type="checkbox"
            checked={quizConfig.isQuiz}
            onChange={e => handleToggleQuizMode(e.target.checked)}
            className="w-5 h-5 text-indigo-600 rounded"
          />
          <span className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200">
            فعال‌سازی حالت آزمون و نمره‌دهی
          </span>
        </label>
      </div>

      {quizConfig.isQuiz && (
        <div className="space-y-6 animate-in fade-in">
          {/* General Quiz Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" /> سقف زمان آزمون (دقیقه):
              </label>
              <input
                type="number"
                value={quizConfig.timeLimitMinutes || 15}
                onChange={e => handleUpdateQuiz('timeLimitMinutes', Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
              />
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-emerald-600" /> حدنصاب قبولی (Pass Threshold):
              </label>
              <input
                type="number"
                value={quizConfig.passScore || 70}
                onChange={e => handleUpdateQuiz('passScore', Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
              />
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" /> نمایش بلافاصله نتیجه:
              </label>
              <select
                value={quizConfig.showInstantResult ? 'yes' : 'no'}
                onChange={e => handleUpdateQuiz('showInstantResult', e.target.value === 'yes')}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
              >
                <option value="yes">بله - نمایش کارنامه و نمره بلافاصله پس از ثبت</option>
                <option value="no">خیر - نیاز به تأیید استاد یا مدیر آزمون</option>
              </select>
            </div>
          </div>

          {/* Grade Thresholds Manager */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                سطوح نمره‌دهی و بازخوردهای ارزیابی (Grade Ranges)
              </h3>
              <button
                onClick={handleAddGradeThreshold}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> افزودن رده نمره‌ای
              </button>
            </div>

            <div className="space-y-3">
              {quizConfig.gradeThresholds?.map(gt => (
                <div
                  key={gt.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs"
                >
                  <div className="md:col-span-2">
                    <label className="font-bold text-slate-500 block mb-1">حداقل نمره:</label>
                    <input
                      type="number"
                      value={gt.minScore}
                      onChange={e => {
                        const updated = quizConfig.gradeThresholds.map(item =>
                          item.id === gt.id ? { ...item, minScore: Number(e.target.value) } : item
                        );
                        handleUpdateQuiz('gradeThresholds', updated);
                      }}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="font-bold text-slate-500 block mb-1">حداکثر نمره:</label>
                    <input
                      type="number"
                      value={gt.maxScore}
                      onChange={e => {
                        const updated = quizConfig.gradeThresholds.map(item =>
                          item.id === gt.id ? { ...item, maxScore: Number(e.target.value) } : item
                        );
                        handleUpdateQuiz('gradeThresholds', updated);
                      }}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="font-bold text-slate-500 block mb-1">عنوان رتبه (Grade Label):</label>
                    <input
                      type="text"
                      value={gt.gradeLabel}
                      onChange={e => {
                        const updated = quizConfig.gradeThresholds.map(item =>
                          item.id === gt.id ? { ...item, gradeLabel: e.target.value } : item
                        );
                        handleUpdateQuiz('gradeThresholds', updated);
                      }}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 font-bold"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="font-bold text-slate-500 block mb-1">متن بازخورد / کارنامه:</label>
                    <input
                      type="text"
                      value={gt.feedbackText}
                      onChange={e => {
                        const updated = quizConfig.gradeThresholds.map(item =>
                          item.id === gt.id ? { ...item, feedbackText: e.target.value } : item
                        );
                        handleUpdateQuiz('gradeThresholds', updated);
                      }}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  <div className="md:col-span-1 flex justify-end">
                    <button
                      onClick={() => handleDeleteGradeThreshold(gt.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
