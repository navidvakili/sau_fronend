// ============================================================
// DedicatedPageContactInfoWidget — از WidgetRenderer.tsx استخراج شد
// (بخش «بلوک‌های اختصاصیِ صفحهٔ استاد»).
// ============================================================

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Copy, Hash, Mail, MapPin, Phone } from 'lucide-react';
import { fetchDedicatedPageContactInfoForWidget, type DedicatedPageContactInfo } from '../../../api';
import { SmartEmpty, SmartSkeleton } from '../SmartWidgetStates';
import { DedicatedPageNotConfigured } from './shared';
import { DEFAULT_ACCENT_COLOR, accentWithAlpha } from '../../../utils/styleResolvers';

export const DedicatedPageContactInfoWidget: React.FC<{
  containerStyle: React.CSSProperties;
  dedicatedPageId?: number | null;
  accentColor?: string;
}> = ({ containerStyle, dedicatedPageId, accentColor = DEFAULT_ACCENT_COLOR }) => {
  const [info, setInfo] = useState<DedicatedPageContactInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!dedicatedPageId) return;
    let cancelled = false;
    setInfo(null);
    setError(null);
    fetchDedicatedPageContactInfoForWidget(dedicatedPageId)
      .then((res) => { if (!cancelled) setInfo(res); })
      .catch((err) => { if (!cancelled) setError(err?.message || 'خطا در دریافت اطلاعات تماس'); });
    return () => { cancelled = true; };
  }, [dedicatedPageId]);

  if (!dedicatedPageId) {
    return (
      <div style={containerStyle}>
        <DedicatedPageNotConfigured />
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <SmartEmpty error={error} />
      </div>
    );
  }

  if (!info) {
    return (
      <div style={containerStyle}>
        <SmartSkeleton variant="list" count={3} />
      </div>
    );
  }

  const rows = [
    { key: 'email', icon: Mail, label: 'ایمیل', value: info.email, copyable: true },
    { key: 'phone', icon: Phone, label: 'تلفن', value: info.phone, copyable: true },
    { key: 'extension', icon: Hash, label: 'داخلی', value: info.extension, copyable: true },
    { key: 'location', icon: MapPin, label: 'آدرس دفتر', value: info.location, copyable: true },
    { key: 'officeHours', icon: Clock, label: 'ساعات مشاوره', value: info.officeHours, copyable: false }
  ].filter((r) => r.value);

  if (rows.length === 0) {
    return (
      <div style={containerStyle}>
        <SmartEmpty error="هنوز اطلاعات تماسی برای این صفحه ثبت نشده است" />
      </div>
    );
  }

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard?.writeText(value);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div style={containerStyle} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-3">
      {rows.map((r) => (
        <div key={r.key} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: accentWithAlpha(accentColor, '1a'), color: accentColor }}>
            <r.icon className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-slate-400">{r.label}</div>
            <div className="text-xs font-bold text-slate-800 dark:text-white truncate" dir={r.label === 'آدرس دفتر' || r.label === 'ساعات مشاوره' ? 'rtl' : 'ltr'}>{r.value}</div>
          </div>
          {r.copyable && (
            <button
              onClick={() => handleCopy(r.key, r.value || '')}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
              title="کپی"
            >
              {copiedField === r.key ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" style={{ color: accentColor }} />}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
