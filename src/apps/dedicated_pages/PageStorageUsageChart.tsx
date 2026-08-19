// ============================================================
// PageStorageUsageChart — نمودار حجم استفاده‌شدهٔ صفحه، به‌صورت نوار
// پشته‌ای (stack) تفکیک‌شده براساس نوع فایل
// ============================================================
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { HardDrive, Loader2 } from 'lucide-react';
import { fetchPageMediaUsage, type MediaUsage } from './api';

const TYPE_COLORS: Record<string, string> = {
  image: '#3b82f6',
  pdf: '#ef4444',
  document: '#f59e0b',
  other: '#94a3b8'
};

const REMAINING_COLOR_LIGHT = '#e2e8f0';

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} گیگابایت`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} کیلوبایت`;
  return `${bytes} بایت`;
}

interface PageStorageUsageChartProps {
  pageId: string;
}

export default function PageStorageUsageChart({ pageId }: PageStorageUsageChartProps) {
  const [usage, setUsage] = useState<MediaUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetchPageMediaUsage(pageId)
      .then(data => {
        if (!cancelled) setUsage(data);
      })
      .catch(e => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'خطا در دریافت وضعیت فضای ذخیره‌سازی.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pageId]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-slate-400 py-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>در حال دریافت وضعیت فضای مصرفی...</span>
      </div>
    );
  }

  if (error || !usage) {
    return <p className="text-[11px] text-rose-500">{error || 'وضعیت فضای مصرفی در دسترس نیست.'}</p>;
  }

  const chartData = [
    {
      name: 'usage',
      ...Object.fromEntries(usage.breakdown.map(b => [b.type, b.bytes])),
      remaining: usage.remaining_bytes
    }
  ];

  return (
    <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
          <HardDrive className="w-3.5 h-3.5" />
          <span>وضعیت فعلی مصرف</span>
        </span>
        <span className="text-[10px] text-slate-500 tabular-nums">
          {formatBytes(usage.used_bytes)} از {formatBytes(usage.quota_bytes)} ({usage.percent_used}%)
        </span>
      </div>

      <ResponsiveContainer width="100%" height={40}>
        <BarChart layout="vertical" data={chartData} barSize={22} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <XAxis type="number" domain={[0, usage.quota_bytes]} hide />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip
            formatter={((value: number, key: string) => [
              formatBytes(value),
              key === 'remaining' ? 'فضای آزاد' : usage.breakdown.find(b => b.type === key)?.label || key
            ]) as (value: unknown, name: unknown) => [string, string]}
            cursor={{ fill: 'transparent' }}
          />
          {usage.breakdown.map(b => (
            <Bar key={b.type} dataKey={b.type} stackId="a" fill={TYPE_COLORS[b.type]} radius={0} />
          ))}
          <Bar dataKey="remaining" stackId="a" fill={REMAINING_COLOR_LIGHT} radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-1.5">
        {usage.breakdown.map(b => (
          <div key={b.type} className="flex items-center gap-1.5 text-[10px]">
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: TYPE_COLORS[b.type] }} />
            <span className="text-slate-600 dark:text-slate-300 font-bold truncate">{b.label}</span>
            <span className="text-slate-400 tabular-nums mr-auto">{formatBytes(b.bytes)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
