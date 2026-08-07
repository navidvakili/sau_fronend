// ============================================================
// PdfViewer — مشاهده PDF (جایگزین EmbedPDF)
// ============================================================
// مانند پروژه HRM، فایل PDF با <iframe> در مرورگر (PDF Viewer داخلی
// کروم/فایرفاکس) نمایش داده می‌شود؛ برخلاف EmbedPDF به fetch/CORS،
// WebAssembly یا CSP خاصی نیاز ندارد و آدرس /storage/ مستقیم کار می‌کند.

import React from 'react';

interface PdfViewerProps {
  /** آدرس مستقیم فایل PDF */
  src: string;
  /** کلاس روی ظرف (سایزدهی) */
  className?: string;
  /** استایل سفارشی */
  style?: React.CSSProperties;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ src, className, style }) => (
  <div className={className} style={{ width: '100%', height: '100%', ...style }}>
    <iframe
      src={src}
      title="PDF Viewer"
      className="w-full h-full border-0 bg-white"
      style={{ width: '100%', height: '100%' }}
    />
  </div>
);
