import React, { useEffect, useRef, useState } from 'react';
import { FileText, Loader2, AlertCircle, Printer, ExternalLink } from 'lucide-react';
import { isDocxName, isPptxName, isXlsxName } from './pdf/pdfEngine';

interface OfficePreviewProps {
  src: string; // آدرس استریم
  name: string;
  downloadUrl?: string;
}

/**
 * پیش‌نمایش اسناد اداری (Word / PowerPoint / Excel) در لایت‌باکس.
 * - docx:  docx-preview (renderAsync)
 * - pptx:  pptx-preview (init + preview با حالت list)
 * - xlsx:  ساخت HTML جدول با SheetJS
 * دکمهٔ «تبدیل به PDF» پیش‌نمایش را در پنجرهٔ چاپ مرورگر باز می‌کند (Save as PDF).
 */
export const OfficePreview: React.FC<OfficePreviewProps> = ({ src, name, downloadUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pptxRef = useRef<{ destroy: () => void } | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);

  const isDocx = isDocxName(name);
  const isPptx = isPptxName(name);
  const isXlsx = isXlsxName(name);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError(null);
    (async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error('خطا در دریافت فایل از سرور.');
        const buf = new Uint8Array(await res.arrayBuffer());
        if (cancelled) return;
        setBytes(buf);
        setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        setStatus('error');
        setError(e instanceof Error ? e.message : 'خطا در بارگذاری سند.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src]);

  /* رندر سند پس از دریافت بایت‌ها */
  useEffect(() => {
    if (!bytes || status !== 'ready') return;
    let cancelled = false;
    (async () => {
      try {
        if (isDocx) {
          const { renderAsync } = await import('docx-preview');
          if (!containerRef.current) return;
          await renderAsync(new Blob([bytes]), containerRef.current, undefined, {
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            breakPages: true,
            renderHeaders: true,
            renderFooters: true,
            renderFootnotes: true,
            renderEndnotes: true
          });
        } else if (isPptx) {
          const { init } = await import('pptx-preview');
          if (!containerRef.current) return;
          containerRef.current.innerHTML = '';
          const previewer = init(containerRef.current, { width: 960, height: 540, mode: 'list' });
          pptxRef.current = previewer as unknown as { destroy: () => void };
          await previewer.preview(bytes.slice().buffer as ArrayBuffer);
          if (cancelled) pptxRef.current?.destroy?.();
        } else if (isXlsx) {
          const XLSX = await import('xlsx');
          const wb = XLSX.read(bytes, { type: 'array' });
          if (!containerRef.current) return;
          let html = '';
          for (const sname of wb.SheetNames) {
            const rows = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[sname], { header: 1 });
            html += `<div class="xlsx-sheet"><h3>${sname}</h3><table>`;
            rows.slice(0, 500).forEach((r, ri) => {
              html += `<tr>${(r || []).map((c) => `<td>${String(c ?? '').replace(/</g, '&lt;')}</td>`).join('')}</tr>`;
            });
            html += '</table></div>';
          }
          containerRef.current.innerHTML = html;
        } else {
          throw new Error('فرمت سند پشتیبانی نمی‌شود.');
        }
        if (cancelled) return;
        setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        setStatus('error');
        setError(e instanceof Error ? e.message : 'خطا در نمایش سند.');
      }
    })();
    return () => {
      cancelled = true;
      pptxRef.current?.destroy?.();
      pptxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bytes, status, isDocx, isPptx, isXlsx]);

  const handlePrintToPdf = () => {
    const container = containerRef.current;
    if (!container) return;
    const win = window.open('', '_blank', 'width=1000,height=800');
    if (!win) return;
    win.document.write(
      `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>${name}</title>
      <style>
        @page { size: A4; margin: 12mm; }
        body { margin: 0; padding: 24px; font-family: Vazirmatn, 'Segoe UI', sans-serif; color: #111; }
        img { max-width: 100%; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 24px; }
        td, th { border: 1px solid #ccc; padding: 4px 6px; }
        .slide { page-break-after: always; }
        .docx-wrapper { background: #fff !important; }
      </style></head><body>${container.innerHTML}</body></html>`
    );
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden">
      {/* نوار ابزار */}
      <div className="px-3 py-2 bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 flex items-center gap-2 shrink-0">
        <FileText className="w-4 h-4 text-sky-500 shrink-0" />
        <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 truncate flex-1">{name}</span>
        <button
          onClick={handlePrintToPdf}
          disabled={status !== 'ready'}
          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Printer className="w-3 h-3" />
          تبدیل به PDF (چاپ)
        </button>
        {downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            دانلود
          </a>
        )}
      </div>

      {/* بدنهٔ پیش‌نمایش */}
      <div className="flex-1 min-h-0 overflow-auto p-3">
        {status === 'loading' && (
          <div className="h-full flex items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
            <span className="text-[11px] font-bold">در حال بارگذاری سند...</span>
          </div>
        )}
        {status === 'error' && (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center px-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-[11px] font-bold text-red-500">{error}</p>
            <p className="text-[10px] text-slate-400">
              پیش‌نمایش در دسترس نیست؛ برای مشاهده، فایل را دانلود کنید.
            </p>
          </div>
        )}
        {status === 'ready' && (
          <div
            ref={containerRef}
            className="mx-auto max-w-full bg-white dark:bg-slate-950 rounded-lg shadow-sm p-4 min-h-full"
            dir="auto"
          />
        )}
      </div>
    </div>
  );
};
