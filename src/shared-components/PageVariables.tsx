// ============================================================
// PageVariables — دکمهٔ «درج متغیر» و ابزار درج در محل نشانگر
// (همانند دکمهٔ درج آیکون: یک توکن {{...}} در محل نشانگر درج می‌کند
// که در نمایش نهایی، با مقدار واقعی صفحه جایگزین می‌شود)
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { Braces, ChevronDown } from 'lucide-react';

export interface PageContentVariable {
  key: string;
  label: string;
  token: string;
}

export const PAGE_CONTENT_VARIABLES: PageContentVariable[] = [
  { key: 'pageType', label: 'نوع صفحه', token: '{{pageType}}' },
  { key: 'title', label: 'عنوان کامل صفحه', token: '{{title}}' },
  { key: 'shortTitle', label: 'عنوان کوتاه', token: '{{shortTitle}}' },
  { key: 'shortDescription', label: 'توضیح کوتاه / شعار', token: '{{shortDescription}}' },
  { key: 'fullDescription', label: 'توضیحات کامل و معرفی اهداف', token: '{{fullDescription}}' },
  { key: 'url', label: 'آدرس صفحه', token: '{{url}}' },
  { key: 'ownerName', label: 'نام و نام خانوادگی مسئول صفحه', token: '{{ownerName}}' },
  { key: 'ownerRole', label: 'سمت مسئول صفحه', token: '{{ownerRole}}' },
  { key: 'ownerPhone', label: 'شماره تلفن مسئول صفحه', token: '{{ownerPhone}}' },
  { key: 'ownerEmail', label: 'پست الکترونیک مسئول صفحه', token: '{{ownerEmail}}' }
];

/** درج یک رشته در محل نشانگر (cursor) داخل input/textarea، با حفظ موقعیت نشانگر پس از درج */
export function insertAtCursor(
  el: HTMLInputElement | HTMLTextAreaElement | null,
  current: string,
  token: string,
  setValue: (next: string) => void
): void {
  if (!el) {
    setValue(current + token);
    return;
  }
  const start = el.selectionStart ?? current.length;
  const end = el.selectionEnd ?? current.length;
  const next = current.slice(0, start) + token + current.slice(end);
  setValue(next);
  requestAnimationFrame(() => {
    el.focus();
    const pos = start + token.length;
    el.setSelectionRange(pos, pos);
  });
}

interface VariableInsertButtonProps {
  onInsert: (token: string) => void;
  label?: string;
}

/** دکمه «درج متغیر» — همانند دکمه درج آیکون؛ منویی از متغیرهای صفحه اختصاصی باز می‌کند */
export function VariableInsertButton({ onInsert, label = 'درج متغیر' }: VariableInsertButtonProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-[11px] font-bold flex items-center gap-1 transition-colors"
        title="درج متغیر صفحه اختصاصی — در نمایش نهایی با مقدار واقعی جایگزین می‌شود"
      >
        <Braces className="w-3 h-3" />
        {label}
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-72 max-h-72 overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-right">
          {PAGE_CONTENT_VARIABLES.map(v => (
            <button
              key={v.key}
              type="button"
              onClick={() => {
                onInsert(v.token);
                setOpen(false);
              }}
              className="w-full px-3 py-2 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 transition-colors"
            >
              <span>{v.label}</span>
              <span className="font-mono text-[10px] text-slate-400 dir-ltr">{v.token}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
