// ============================================================
// AcademicFieldsFeedWidget — از WidgetRenderer.tsx استخراج شد (بخش «SMART WIDGETS»).
// ============================================================

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import type { WidgetInstance, WidgetDataBinding } from '../../builderTypes';
import { fetchDataSourceAcademicFields } from '../../api';
import type { AcademicFieldItem } from '@/src/shared-types';
import { useSmartData } from '../../hooks/useSmartData';
import { SmartEmpty, SmartSkeleton } from './SmartWidgetStates';

/** «همهٔ کلمات» — مثلاً برای «مهندسی کامپیوتر» باید «کارشناسی ارشد مهندسی و علم کامپیوتر» هم
 *  نتیجه بدهد، نه فقط رشته‌هایی که دقیقاً همین عبارت را پشت‌سرهم دارند. */
const matchesAllWords = (haystack: string, query: string): boolean => {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const normalizedHaystack = haystack.toLowerCase();
  return words.every((w) => normalizedHaystack.includes(w));
};

const DEGREE_LEVEL_ORDER = ['phd', 'master', 'bachelor_continuous', 'bachelor_non_continuous', 'associate'] as const;
const DEGREE_LEVEL_LABELS: Record<string, string> = {
  phd: 'دکتری تخصصی',
  master: 'کارشناسی ارشد',
  bachelor_continuous: 'کارشناسی پیوسته',
  bachelor_non_continuous: 'کارشناسی ناپیوسته',
  associate: 'کاردانی'
};
const DEGREE_LEVEL_BADGE_EN: Record<string, string> = {
  phd: 'Phd',
  master: 'Master',
  bachelor_continuous: 'Bachelor',
  bachelor_non_continuous: 'Non-Continuous',
  associate: 'Associate'
};

/** فیلد description هر رشته حاصل ترکیب عنوان انگلیسی + شرایط پذیرش + توضیح + دانشکده است
 *  (با «\n\n» جدا شده، هنگام مهاجرت داده ساخته شده) — این‌جا برای بازسازی سبک کارت قدیم
 *  دوباره از هم جدا می‌شود. */
const parseFieldDescription = (description?: string | null) => {
  const paragraphs = (description || '').split('\n\n').map((p) => p.trim()).filter(Boolean);
  let entitle: string | undefined;
  let admission: string | undefined;
  let campus: string | undefined;
  const descParts: string[] = [];
  paragraphs.forEach((p, idx) => {
    if (p.startsWith('شرایط پذیرش:')) {
      admission = p.replace('شرایط پذیرش:', '').trim();
    } else if (p.startsWith('دانشکده:')) {
      campus = p;
    } else if (idx === 0 && /^[A-Za-z]/.test(p)) {
      entitle = p;
    } else {
      descParts.push(p);
    }
  });
  return { entitle, admission, desc: descParts.join(' '), campus };
};

/** کارت رشته به سبک همان کارت‌های استاتیک صفحهٔ قدیمی fields-study (رنگ/تایپوگرافی یکسان) */
const AcademicFieldCard: React.FC<{ field: AcademicFieldItem }> = ({ field }) => {
  const { entitle, admission, desc, campus } = parseFieldDescription(field.description);
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs space-y-1 h-full flex flex-col">
      <div style={{ color: '#6b21a8', fontWeight: 900, fontSize: 11 }}>
        {DEGREE_LEVEL_BADGE_EN[field.degreeLevel || ''] || field.degreeLevel}
        {field.department?.name ? `   ·   ${field.department.name}` : ''}
        {field.code ? `   ·   کد ${field.code}` : ''}
      </div>
      <div style={{ color: '#0f172a', fontSize: 17, fontWeight: 900 }}>{field.name}</div>
      {entitle && <div style={{ color: '#94a3b8', fontSize: 11 }}>{entitle}</div>}
      {admission && (
        <span
          className="inline-block w-fit"
          style={{ color: '#7e22ce', backgroundColor: '#f3e8ff', borderRadius: 8, fontSize: 11, fontWeight: 700, padding: '4px 10px' }}
        >
          {admission}
        </span>
      )}
      {desc && <p style={{ color: '#475569', fontSize: 12, lineHeight: 1.7 }} className="flex-1">{desc}</p>}
      {campus && <div style={{ color: '#64748b', fontSize: 11 }}>{campus}</div>}
    </div>
  );
};

/** نوار جستجو (عنوان) + فیلتر مقطع/دانشکده — نسخهٔ پیش‌نمایش ادمین، فقط با state محلی (بدون
 *  اتصال به URL چون این‌جا بومِ ویرایشگر است؛ نسخهٔ واقعی متصل به URL در public/SmartPageView است) */
const AcademicFieldsSearchBarPreview: React.FC<{
  facultyOptions: string[];
  q: string;
  degree: string;
  faculty: string;
  onChange: (key: 'q' | 'degree' | 'faculty', value: string) => void;
}> = ({ facultyOptions, q, degree, faculty, onChange }) => (
  <div className="flex flex-wrap items-center gap-3 mb-6">
    <div className="relative flex-1 min-w-[220px]">
      <input
        type="text"
        value={q}
        onChange={(e) => onChange('q', e.target.value)}
        placeholder="جستجو در رشته‌ها (نام فارسی یا انگلیسی)..."
        className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl ps-9 pe-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500 transition"
      />
      <Search className="w-4 h-4 text-slate-400 absolute start-3 top-3" />
    </div>
    <select
      value={degree}
      onChange={(e) => onChange('degree', e.target.value)}
      className="bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
    >
      <option value="">همهٔ مقاطع</option>
      {DEGREE_LEVEL_ORDER.map((level) => (
        <option key={level} value={level}>{DEGREE_LEVEL_LABELS[level]}</option>
      ))}
    </select>
    {facultyOptions.length > 0 && (
      <select
        value={faculty}
        onChange={(e) => onChange('faculty', e.target.value)}
        className="bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
      >
        <option value="">همهٔ دانشکده‌ها</option>
        {facultyOptions.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>
    )}
  </div>
);

/** ویجت لیست رشته‌های تحصیلی — اتصال زنده به همهٔ رشته‌های همهٔ گروه‌های آموزشی، با نوار
 *  جستجوی متنی + فیلتر مقطع + فیلتر دانشکده، به‌علاوهٔ فیلتر ثابت گروه (binding.categoryFilter)
 *  و مقطع (binding.degreeLevelFilter) از تنظیمات ادمین. وقتی مقطع «همه» است، رشته‌ها مثل
 *  صفحهٔ قدیمی زیر سربرگ هر مقطع دسته‌بندی می‌شوند. لینک واقعی هر کارت به صفحهٔ گروه آموزشی
 *  والدش فقط در رندر عمومی (public) ساخته می‌شود؛ این‌جا فقط پیش‌نمایش است. */
export const AcademicFieldsFeedWidget: React.FC<{
  widget: WidgetInstance;
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
}> = ({ widget, binding, containerStyle }) => {
  const departmentId =
    binding.categoryFilter && binding.categoryFilter !== 'all' ? Number(binding.categoryFilter) || null : null;
  const boundDegreeLevel =
    binding.degreeLevelFilter && binding.degreeLevelFilter !== 'all' ? binding.degreeLevelFilter : null;

  const { data, error, retry } = useSmartData<AcademicFieldItem>(() =>
    fetchDataSourceAcademicFields({
      per_page: binding.limit || 200,
      department_id: departmentId,
      degree_level: boundDegreeLevel,
      status: 'published'
    }).then((res) => res.data),
    [binding.limit, departmentId, boundDegreeLevel]
  );

  const [q, setQ] = useState('');
  const [degreeFilter, setDegreeFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');

  const allFields = data || [];
  const facultyOptions = Array.from(
    new Set(allFields.map((f) => f.department?.faculty).filter((f): f is string => !!f))
  ).sort();

  const fields = allFields.filter((f) => {
    if (degreeFilter && f.degreeLevel !== degreeFilter) return false;
    if (facultyFilter && f.department?.faculty !== facultyFilter) return false;
    if (q.trim() && !matchesAllWords(f.name, q)) return false;
    return true;
  });

  const effectiveDegreeLevel = boundDegreeLevel || degreeFilter || null;
  const cols = binding.columnsCount || 3;
  const gridClass =
    cols === 2
      ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
      : cols === 1
        ? 'grid grid-cols-1 gap-3'
        : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3';

  const groups = !effectiveDegreeLevel
    ? DEGREE_LEVEL_ORDER.map((level) => ({ level, items: fields.filter((f) => f.degreeLevel === level) })).filter(
        (g) => g.items.length > 0
      )
    : null;

  return (
    <div style={containerStyle}>
      {!boundDegreeLevel && (
        <AcademicFieldsSearchBarPreview
          facultyOptions={facultyOptions}
          q={q}
          degree={degreeFilter}
          faculty={facultyFilter}
          onChange={(key, value) => {
            if (key === 'q') setQ(value);
            else if (key === 'degree') setDegreeFilter(value);
            else setFacultyFilter(value);
          }}
        />
      )}
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !data ? (
        <SmartSkeleton variant="cards" count={binding.limit || 6} />
      ) : fields.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-10">رشته‌ای مطابق با جستجوی شما یافت نشد.</p>
      ) : groups ? (
        <div className="space-y-8">
          {groups.map((g) => (
            <div key={g.level}>
              <div style={{ color: '#7e22ce', fontWeight: 900, fontSize: 14 }} className="mb-3">
                {DEGREE_LEVEL_LABELS[g.level]}
              </div>
              <div className={gridClass}>
                {g.items.map((field) => (
                  <AcademicFieldCard key={field.id} field={field} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={gridClass}>
          {fields.map((field) => (
            <AcademicFieldCard key={field.id} field={field} />
          ))}
        </div>
      )}
    </div>
  );
};
