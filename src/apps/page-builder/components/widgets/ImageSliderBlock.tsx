// ============================================================
// ImageSliderBlock — از WidgetRenderer.tsx استخراج شد (بخش «NEW STATIC BLOCKS»).
// اسلایدر تصویر — منبع رسانه (با عنوان) یا آدرس دستی؛ حالت اسلایدشو یا فهرست بندانگشتی + لایت‌باکس.
// ============================================================

import React, { useEffect, useState } from 'react';
import { Images, X, ChevronUp, ChevronDown } from 'lucide-react';
import type { WidgetInstance } from '../../builderTypes';
import { fetchDataSourceMedia } from '../../api';
import type { MediaFile } from '../../../gallery/types';
import { useSmartData } from '../../hooks/useSmartData';
import { parseLines } from '../../utils/textAndIcons';
import { SmartSkeleton } from './SmartWidgetStates';

export const ImageSliderBlock: React.FC<{
  widget: WidgetInstance;
  containerStyle: React.CSSProperties;
  isEditorPreview?: boolean;
}> = ({ widget, containerStyle, isEditorPreview = false }) => {
  const props = widget.settings.customProps || {};
  const sliderMode = props.sliderMode === 'thumbs' ? 'thumbs' : 'slideshow';
  const source = props.sliderSource || 'media';
  const limit = Number(props.sliderLimit) || 10;
  const manualImages: string[] =
    (props.images as string[]) ||
    parseLines(widget.content || '').map((p) => p[0]).filter(Boolean) ||
    [];
  const folderFilter =
    props.mediaFolder && props.mediaFolder !== 'all' ? String(props.mediaFolder) : null;

  const { data, error } = useSmartData<MediaFile>(
    () =>
      source === 'media'
        ? fetchDataSourceMedia({
            per_page: 100,
            folder_id: folderFilter,
            type: 'image'
          }).then((res) => res.data.slice(0, limit))
        : Promise.resolve([]),
    [source, folderFilter, limit]
  );

  // هر اسلاید: { url, title }
  const slides: { url: string; title: string }[] =
    source === 'media'
      ? (data || []).map((f) => ({ url: f.url, title: f.title || f.name }))
      : manualImages.map((u, i) => ({ url: u, title: `اسلاید ${i + 1}` }));

  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (isEditorPreview || sliderMode !== 'slideshow' || slides.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 3500);
    return () => clearInterval(t);
  }, [slides.length, sliderMode, isEditorPreview]);

  // بستن لایت‌باکس با کلید Escape
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setLightbox(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  const loading = source === 'media' && !data && !error;

  if (loading) {
    return (
      <div style={containerStyle} className="space-y-4">
        <SmartSkeleton variant={sliderMode === 'thumbs' ? 'gallery' : 'table'} count={4} />
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div style={containerStyle} className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 aspect-video text-slate-400 text-xs">
        <Images className="w-5 h-5" />
        تصاویری برای اسلایدر تنظیم نشده است
      </div>
    );
  }

  // ── حالت فهرست بندانگشتی + لایت‌باکس ──
  if (sliderMode === 'thumbs') {
    return (
      <div style={containerStyle}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {slides.map((s, i) => (
            <button
              key={`${s.url}-${i}`}
              type="button"
              onClick={() => {
                if (isEditorPreview) return; // در پیش‌نمایش ویرایشگر غیرفعال است
                setLightbox(i);
              }}
              className={`group relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800 shadow-xs transition-all focus:outline-none ${isEditorPreview ? 'cursor-default' : 'hover:border-teal-500/50 hover:shadow-md cursor-pointer'}`}
              title={s.title}
            >
              <img
                src={s.url}
                alt={s.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/30 transition-colors" />
              {s.title && (
                <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-slate-950/80 to-transparent">
                  <div className="text-[10px] font-bold text-white text-right truncate">{s.title}</div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* لایت‌باکس */}
        {lightbox !== null && slides[lightbox] && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4"
            onClick={() => setLightbox(null)}
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
              title="بستن"
            >
              <X className="w-5 h-5" />
            </button>
            <div
              className="relative max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={slides[lightbox].url}
                alt={slides[lightbox].title}
                className="w-full max-h-[75vh] object-contain rounded-xl"
              />
              {slides[lightbox].title && (
                <div className="mt-3 text-center text-white text-sm font-black">
                  {slides[lightbox].title}
                </div>
              )}
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setLightbox((lightbox - 1 + slides.length) % slides.length)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
                  title="قبلی"
                >
                  <ChevronUp className="w-5 h-5 rotate-90" />
                </button>
                <span className="text-white/80 text-xs font-bold tabular-nums">
                  {lightbox + 1} / {slides.length}
                </span>
                <button
                  type="button"
                  onClick={() => setLightbox((lightbox + 1) % slides.length)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
                  title="بعدی"
                >
                  <ChevronUp className="w-5 h-5 -rotate-90" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── حالت اسلایدشو ──
  return (
    <div style={containerStyle} className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 group">
      <img src={slides[index].url} alt={slides[index].title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
      {slides[index].title && (
        <div className="absolute bottom-3 right-4 text-white text-sm font-black drop-shadow">
          {slides[index].title}
        </div>
      )}
      <div className="absolute bottom-3 left-3 flex gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              if (isEditorPreview) return; // در پیش‌نمایش ویرایشگر غیرفعال است
              setIndex(i);
            }}
            className={`h-1.5 rounded-full transition-all ${isEditorPreview ? 'cursor-default' : 'cursor-pointer'} ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
            aria-label={`اسلاید ${i + 1}`}
          />
        ))}
      </div>
      <button
        onClick={() => {
          if (isEditorPreview) return; // در پیش‌نمایش ویرایشگر غیرفعال است
          setIndex((index - 1 + slides.length) % slides.length);
        }}
        className={`absolute top-1/2 right-2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/50 hover:bg-slate-950/75 text-white backdrop-blur-sm shadow-md transition-colors ${isEditorPreview ? 'cursor-default' : 'cursor-pointer'}`}
        aria-label="اسلاید قبلی"
      >
        <ChevronUp className="w-5 h-5 rotate-90" />
      </button>
      <button
        onClick={() => {
          if (isEditorPreview) return; // در پیش‌نمایش ویرایشگر غیرفعال است
          setIndex((index + 1) % slides.length);
        }}
        className={`absolute top-1/2 left-2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/50 hover:bg-slate-950/75 text-white backdrop-blur-sm shadow-md transition-colors ${isEditorPreview ? 'cursor-default' : 'cursor-pointer'}`}
        aria-label="اسلاید بعدی"
      >
        <ChevronDown className="w-5 h-5 rotate-90" />
      </button>
    </div>
  );
};
