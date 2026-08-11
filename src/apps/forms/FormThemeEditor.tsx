import React from 'react';
import { Palette, Image as ImageIcon, Layout, Type, Check } from 'lucide-react';
import { FormDefinition, FormTheme } from './types';

interface FormThemeEditorProps {
  form: FormDefinition;
  onChange: (updatedForm: FormDefinition) => void;
}

const COLOR_PRESETS = [
  { name: 'فیروزه‌ای نیما (Teal)', color: '#0d9488' },
  { name: 'نیلی دانشگاهی (Indigo)', color: '#6366f1' },
  { name: 'زمردی (Emerald)', color: '#059669' },
  { name: 'یاقوتی (Rose)', color: '#e11d48' },
  { name: 'کهربایی (Amber)', color: '#d97706' },
  { name: 'بنفش سلطنتی (Purple)', color: '#9333ea' }
];

export const FormThemeEditor: React.FC<FormThemeEditorProps> = ({ form, onChange }) => {
  const theme = form.theme;

  const handleUpdateTheme = (key: keyof FormTheme, value: any) => {
    onChange({
      ...form,
      theme: {
        ...theme,
        [key]: value
      }
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              طراحی پوسته، رنگ‌بندی و هویت بصری فرم (Theming & Style)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              سفارشی‌سازی رنگ اصلی، لوگوی دانشگاه/سازمان، شعاع انحنای دکمه‌ها و فونت
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Color Palette Picker */}
        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            رنگ اصلی و برندینگ فرم (Primary Color):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {COLOR_PRESETS.map(p => (
              <button
                key={p.color}
                onClick={() => handleUpdateTheme('primaryColor', p.color)}
                className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                  theme.primaryColor === p.color
                    ? 'border-2 border-slate-900 dark:border-white shadow'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <span
                  className="w-5 h-5 rounded-full shadow-inner shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                <span className="truncate">{p.name}</span>
                {theme.primaryColor === p.color && <Check className="w-4 h-4 mr-auto text-teal-600" />}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 mt-4">
              یا کد رنگ دلخواه (HEX Code):
            </label>
            <input
              type="text"
              value={theme.primaryColor}
              onChange={e => handleUpdateTheme('primaryColor', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 font-mono text-xs text-left dir-ltr"
            />
          </div>
        </div>

        {/* Logo & Border Radius Settings */}
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
              لوگوی سازمان / برند در بالای فرم:
            </label>
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={theme.showLogo}
                onChange={e => handleUpdateTheme('showLogo', e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                نمایش لوگوی رسمی در هدر فرم
              </span>
            </label>

            {theme.showLogo && (
              <input
                type="text"
                placeholder="آدرس تصویر لوگو (URL)..."
                value={theme.logoUrl || ''}
                onChange={e => handleUpdateTheme('logoUrl', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs dir-ltr text-right"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
              شعاع انحنای زوایا (Border Radius):
            </label>
            <div className="flex gap-2">
              {[
                { id: 'none', label: 'تيز (0px)' },
                { id: 'sm', label: 'ملایم (6px)' },
                { id: 'lg', label: 'گرد (16px)' },
                { id: 'full', label: 'کپسولی (Pill)' }
              ].map(b => (
                <button
                  key={b.id}
                  onClick={() => handleUpdateTheme('borderRadius', b.id as any)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    theme.borderRadius === b.id
                      ? 'bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
