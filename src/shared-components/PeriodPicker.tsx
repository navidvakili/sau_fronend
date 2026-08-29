// ============================================================
// PeriodPicker — انتخابگر بازهٔ زمانی برای داشبوردهای تحلیلی
// دکمه‌های میان‌بر (امروز/دیروز/۷ روز/۳۰ روز/ماه جاری/ماه قبل) + بازهٔ دلخواه
// با تقویم جلالی (بر پایهٔ react-multi-date-picker، هم‌راستا با JalaliDatepicker)
// ============================================================

import { useRef } from 'react';
import DatePicker, { DateObject, type DatePickerRef } from 'react-multi-date-picker';
import 'react-multi-date-picker/styles/colors/teal.css';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import gregorian from 'react-date-object/calendars/gregorian';
import gregorian_en from 'react-date-object/locales/gregorian_en';
import { CalendarRange, X } from 'lucide-react';
import { toPersianDigits } from '@/src/shared-utils';

export type PeriodPreset = 'today' | 'yesterday' | '7d' | '30d' | 'this_month' | 'last_month' | 'custom';

export interface PeriodValue {
  preset: PeriodPreset;
  from?: string;
  to?: string;
}

interface PeriodPickerProps {
  preset: PeriodPreset;
  from?: string;
  to?: string;
  onChange: (value: PeriodValue) => void;
  className?: string;
}

const PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: 'today', label: 'امروز' },
  { key: 'yesterday', label: 'دیروز' },
  { key: '7d', label: '۷ روز اخیر' },
  { key: '30d', label: '۳۰ روز اخیر' },
  { key: 'this_month', label: 'ماه جاری' },
  { key: 'last_month', label: 'ماه قبل' },
  { key: 'custom', label: 'سفارشی' },
];

/** ISO (میلادی، YYYY-MM-DD) → DateObject جلالی برای نمایش در تقویم */
export function isoToJalali(iso?: string): DateObject | undefined {
  if (!iso) return undefined;
  try {
    return new DateObject({ date: iso, format: 'YYYY-MM-DD', calendar: gregorian, locale: gregorian_en }).convert(persian, persian_fa);
  } catch {
    return undefined;
  }
}

/** ماه میلادی (YYYY-MM) → DateObject جلالی (روز اول ماه) — برای برچسب نمودار ماهانه */
export function isoMonthToJalali(month?: string): DateObject | undefined {
  if (!month) return undefined;
  return isoToJalali(`${month}-01`);
}

/** DateObject جلالی → رشتهٔ ISO میلادی (YYYY-MM-DD) برای ارسال به بک‌اند */
function jalaliToIso(d: DateObject): string {
  return d.convert(gregorian, gregorian_en).format('YYYY-MM-DD');
}

export function PeriodPicker({ preset, from, to, onChange, className = '' }: PeriodPickerProps) {
  const datePickerRef = useRef<DatePickerRef>(null);

  const rangeValue: DateObject[] = [isoToJalali(from), isoToJalali(to)].filter(Boolean) as DateObject[];

  const handleRangeChange = (dates: DateObject | DateObject[] | null) => {
    if (!Array.isArray(dates) || dates.length < 2) return;
    const sorted = [...dates].sort((a, b) => a.toDate().getTime() - b.toDate().getTime());
    onChange({ preset: 'custom', from: jalaliToIso(sorted[0]), to: jalaliToIso(sorted[1]) });
  };

  const rangeLabel = from && to
    ? `${toPersianDigits(isoToJalali(from)?.format('YYYY/MM/DD') || '')} تا ${toPersianDigits(isoToJalali(to)?.format('YYYY/MM/DD') || '')}`
    : 'انتخاب بازه';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {PRESETS.map(p => (
        <button
          key={p.key}
          type="button"
          onClick={() => {
            if (p.key === 'custom') {
              onChange({ preset: 'custom', from, to });
              // منتظر رندر ورودی سفارشی می‌مانیم و سپس تقویم را به‌صورت خودکار باز می‌کنیم
              setTimeout(() => datePickerRef.current?.openCalendar(), 0);
            } else {
              onChange({ preset: p.key, from: undefined, to: undefined });
            }
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            preset === p.key
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'bg-gray-50 dark:bg-gray-850 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
          }`}
        >
          {p.label}
        </button>
      ))}

      {preset === 'custom' && (
        <DatePicker
          ref={datePickerRef}
          range
          calendar={persian}
          locale={persian_fa}
          value={rangeValue.length ? rangeValue : undefined}
          onChange={handleRangeChange}
          format="YYYY/MM/DD"
          calendarPosition="bottom-right"
          animations={[]}
          onOpenPickNewDate={false}
          render={
            <CustomRangeInput
              label={rangeLabel}
              hasValue={!!(from && to)}
              onClear={() => onChange({ preset: 'custom', from: undefined, to: undefined })}
            />
          }
        />
      )}
    </div>
  );
}

function CustomRangeInput({ openCalendar, label, hasValue, onClear }: any) {
  return (
    <div
      className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 cursor-pointer text-right"
      onClick={() => openCalendar?.()}
    >
      <CalendarRange className="w-4 h-4 text-teal-600 shrink-0" />
      <span className="font-sans text-gray-950 dark:text-white whitespace-nowrap">{label}</span>
      {hasValue && (
        <button
          type="button"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onClear();
          }}
          className="p-0.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          title="پاک کردن بازه"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default PeriodPicker;
