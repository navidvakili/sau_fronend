// ============================================================
// ویجت‌های «حقایق پروفایل استاد» — تحصیلات/افتخارات/علایق پژوهشی/مقالات/کتب.
// همگی از همان یک پروفایل علمی (useDedicatedPageProfileField) می‌خوانند، هرکدام فقط یک
// فیلد را نمایش می‌دهند — به همین دلیل در یک فایل نگه داشته شدند. از WidgetRenderer.tsx
// استخراج شد (بخش «بلوک‌های اختصاصیِ صفحهٔ استاد»).
// ============================================================

import React, { useState } from 'react';
import { Award, BookOpen, CheckCircle2, Copy, ExternalLink, FileText, GraduationCap, Tag } from 'lucide-react';
import { fetchDedicatedPageProfessorProfileForWidget, type DedicatedPageProfessorProfile } from '../../../api';
import { useDedicatedPageProfileField, useSmartData } from '../../../hooks/useSmartData';
import { SmartEmpty, SmartSkeleton } from '../SmartWidgetStates';
import { DedicatedPageNotConfigured } from './shared';
import { DEFAULT_ACCENT_COLOR, accentWithAlpha } from '../../../utils/styleResolvers';

/** ویجت تحصیلات — از رکورد Person متصل به صفحه (ماژول اعضای دانشگاه) */
export const DedicatedPageEducationWidget: React.FC<{
  containerStyle: React.CSSProperties;
  dedicatedPageId?: number | null;
  accentColor?: string;
}> = ({ containerStyle, dedicatedPageId, accentColor = DEFAULT_ACCENT_COLOR }) => {
  const { data, error, retry } = useDedicatedPageProfileField(dedicatedPageId, (p) => p.education);

  if (!dedicatedPageId) {
    return <div style={containerStyle}><DedicatedPageNotConfigured /></div>;
  }

  return (
    <div style={containerStyle} className="space-y-2.5">
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !data ? (
        <SmartSkeleton variant="list" count={3} />
      ) : data.length === 0 ? (
        <SmartEmpty error="هنوز سابقهٔ تحصیلی برای این استاد ثبت نشده است" />
      ) : (
        data.map((edu, i) => (
          <div key={i} className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 transition group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform" style={{ backgroundColor: accentWithAlpha(accentColor, '1a'), color: accentColor }}>
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-bold text-slate-900 dark:text-white">{edu.degree}{edu.field ? ` — ${edu.field}` : ''}</div>
                {edu.year && (
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0" style={{ backgroundColor: accentWithAlpha(accentColor, '1a'), color: accentColor }}>{edu.year}</span>
                )}
              </div>
              {edu.institution && <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{edu.institution}</div>}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

/** ویجت افتخارات و جوایز علمی — از رکورد Person (awards) */
export const DedicatedPageAwardsWidget: React.FC<{
  containerStyle: React.CSSProperties;
  dedicatedPageId?: number | null;
}> = ({ containerStyle, dedicatedPageId }) => {
  const { data, error, retry } = useDedicatedPageProfileField(dedicatedPageId, (p) => p.awards);

  if (!dedicatedPageId) {
    return <div style={containerStyle}><DedicatedPageNotConfigured /></div>;
  }

  return (
    <div style={containerStyle} className="space-y-2.5">
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !data ? (
        <SmartSkeleton variant="list" count={3} />
      ) : data.length === 0 ? (
        <SmartEmpty error="هنوز افتخار یا جایزه‌ای برای این استاد ثبت نشده است" />
      ) : (
        data.map((award, i) => (
          <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-900 dark:text-white">{award.title}</div>
              {award.year && <div className="text-[11px] text-slate-500 dark:text-slate-400">{award.year}</div>}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

/** ویجت علایق پژوهشی — نمایش تگی/پیلی از رکورد Person */
export const DedicatedPageResearchInterestsWidget: React.FC<{
  containerStyle: React.CSSProperties;
  dedicatedPageId?: number | null;
  accentColor?: string;
}> = ({ containerStyle, dedicatedPageId, accentColor = DEFAULT_ACCENT_COLOR }) => {
  const { data, error, retry } = useDedicatedPageProfileField(dedicatedPageId, (p) => p.researchInterests);
  const [selected, setSelected] = useState<string | null>(null);

  if (!dedicatedPageId) {
    return <div style={containerStyle}><DedicatedPageNotConfigured /></div>;
  }

  return (
    <div style={containerStyle}>
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !data ? (
        <SmartSkeleton variant="list" count={2} />
      ) : data.length === 0 ? (
        <SmartEmpty error="هنوز علاقهٔ پژوهشی‌ای برای این استاد ثبت نشده است" />
      ) : (
        <div className="flex flex-wrap gap-2">
          {data.map((interest, i) => {
            const isSelected = selected === interest;
            return (
              <button
                key={i}
                onClick={() => setSelected(isSelected ? null : interest)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer"
                style={
                  isSelected
                    ? { backgroundColor: accentColor, color: '#fff', borderColor: accentColor }
                    : { backgroundColor: accentWithAlpha(accentColor, '0d'), color: accentColor, borderColor: accentWithAlpha(accentColor, '33') }
                }
              >
                <Tag className="w-3 h-3" style={{ color: isSelected ? '#fff' : accentColor }} />
                <span>{interest}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/** ویجت مقالات منتشرشده — از رکورد Person (publications) */
export const DedicatedPagePublicationsWidget: React.FC<{
  containerStyle: React.CSSProperties;
  dedicatedPageId?: number | null;
  accentColor?: string;
}> = ({ containerStyle, dedicatedPageId, accentColor = DEFAULT_ACCENT_COLOR }) => {
  const { data: profiles, error, retry } = useSmartData<DedicatedPageProfessorProfile>(
    () => (dedicatedPageId ? fetchDedicatedPageProfessorProfileForWidget(dedicatedPageId).then((p) => (p ? [p] : [])) : Promise.resolve([])),
    [dedicatedPageId]
  );
  const [copiedId, setCopiedId] = useState<number | null>(null);

  if (!dedicatedPageId) {
    return <div style={containerStyle}><DedicatedPageNotConfigured /></div>;
  }

  const profile = profiles?.[0];
  const data = profile?.publications;

  const handleCopyDoi = (doi: string, idx: number) => {
    navigator.clipboard?.writeText(`https://doi.org/${doi}`);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={containerStyle} className="space-y-3.5">
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !profiles ? (
        <SmartSkeleton variant="list" count={3} />
      ) : !data || data.length === 0 ? (
        <SmartEmpty error="هنوز مقاله‌ای برای این استاد ثبت نشده است" />
      ) : (
        <>
          {data.map((pub, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800/60 transition group flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform" style={{ backgroundColor: accentWithAlpha(accentColor, '1a'), color: accentColor }}>
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug transition">{pub.title}</h4>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {pub.journal && <span className="font-semibold text-slate-700 dark:text-slate-300">{pub.journal}</span>}
                  {pub.year && <span className="font-mono bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded text-[10px]">{pub.year}</span>}
                  {typeof pub.citations === 'number' && (
                    <span className="font-bold px-2 py-0.5 rounded-full border" style={{ backgroundColor: accentWithAlpha(accentColor, '0d'), color: accentColor, borderColor: accentWithAlpha(accentColor, '33') }}>{pub.citations} استناد</span>
                  )}
                </div>
                {pub.doi && (
                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-slate-400 truncate max-w-[200px]" dir="ltr">DOI: {pub.doi}</span>
                    <button
                      onClick={() => handleCopyDoi(pub.doi!, i)}
                      className="font-semibold flex items-center gap-1 transition cursor-pointer"
                      style={{ color: copiedId === i ? undefined : accentColor }}
                    >
                      {copiedId === i ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === i ? 'کپی شد' : 'کپی پیوند'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {profile?.scholarUrl && (
            <div className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">فهرست کامل مقالات در گوگل اسکولار:</span>
              <a
                href={profile.scholarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold flex items-center gap-1 transition"
                style={{ color: accentColor }}
              >
                <span>Google Scholar</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/** ویجت کتب تألیف‌شده — از رکورد Person (books) */
export const DedicatedPageBooksWidget: React.FC<{
  containerStyle: React.CSSProperties;
  dedicatedPageId?: number | null;
}> = ({ containerStyle, dedicatedPageId }) => {
  const { data, error, retry } = useDedicatedPageProfileField(dedicatedPageId, (p) => p.books);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  if (!dedicatedPageId) {
    return <div style={containerStyle}><DedicatedPageNotConfigured /></div>;
  }

  const handleCopyIsbn = (isbn: string, idx: number) => {
    navigator.clipboard?.writeText(isbn);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={containerStyle} className="space-y-3.5">
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !data ? (
        <SmartSkeleton variant="list" count={3} />
      ) : data.length === 0 ? (
        <SmartEmpty error="هنوز کتابی برای این استاد ثبت نشده است" />
      ) : (
        data.map((book, i) => (
          <div key={i} className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800/60 hover:border-amber-200 transition group flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug group-hover:text-amber-800 dark:group-hover:text-amber-300 transition">{book.title}</h4>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                {book.publisher && <span className="font-semibold text-slate-700 dark:text-slate-300">{book.publisher}</span>}
                {book.year && <span className="font-mono bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded text-[10px]">سال انتشار: {book.year}</span>}
                {book.pages && <span>{book.pages} صفحه</span>}
              </div>
              {book.isbn && (
                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px]" dir="ltr">{book.isbn}</span>
                  <button
                    onClick={() => handleCopyIsbn(book.isbn!, i)}
                    className="text-amber-700 dark:text-amber-300 hover:text-amber-900 font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    {copiedId === i ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === i ? 'شابک کپی شد' : 'کپی شابک'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
