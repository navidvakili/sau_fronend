import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Crop,
  RotateCw,
  FlipHorizontal,
  Sliders,
  Type,
  Save,
  Undo,
  ImageOff,
  Trash2
} from 'lucide-react';
import { GalleryAsset, toGalleryAsset } from './types';
import { getMediaStreamUrl, uploadMediaFile } from './api';

interface ImageEditorModalProps {
  asset: GalleryAsset | null;
  folderId?: string | null;
  onClose: () => void;
  onSave: (updatedAsset: GalleryAsset) => void;
}

type EditorTab = 'transform' | 'adjust' | 'watermark' | 'export';

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type CropDragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se';
type EditorCropRatio = 'free' | '16:9' | '4:3' | '1:1' | '9:16';

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  asset,
  folderId = null,
  onClose,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<EditorTab>('transform');

  // Transform states
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [cropPreset, setCropPreset] = useState<EditorCropRatio>('free');

  // Adjustments states
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [blur, setBlur] = useState(0);
  const [hue, setHue] = useState(0);

  // Watermark states
  const [watermarkText, setWatermarkText] = useState('© متن واترمارک');
  const [watermarkPos, setWatermarkPos] = useState<'bottom-right' | 'bottom-left' | 'center' | 'top-right' | 'custom'>('bottom-right');
  const [watermarkOpacity, setWatermarkOpacity] = useState(75);
  const [watermarkX, setWatermarkX] = useState(100);
  const [watermarkY, setWatermarkY] = useState(100);

  // Crop states (percentages relative to the image box)
  const [cropRect, setCropRect] = useState<CropRect>({ x: 0, y: 0, w: 100, h: 100 });
  const [naturalDims, setNaturalDims] = useState<{ w: number; h: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewW, setPreviewW] = useState(0);
  const dragRef = useRef<{
    mode: CropDragMode | null;
    start: CropRect | null;
    last: { x: number; y: number } | null;
  }>({ mode: null, start: null, last: null });
  const wmDraggingRef = useRef(false);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Reset editor state whenever a different asset is opened
  useEffect(() => {
    if (!asset) return;
    setActiveTab('transform');
    setRotation(0);
    setFlipH(false);
    setCropPreset('free');
    setCropRect({ x: 0, y: 0, w: 100, h: 100 });
    setNaturalDims(null);
    setWatermarkPos('bottom-right');
    setWatermarkX(100);
    setWatermarkY(100);
    setBrightness(100);
    setContrast(100);
    setSaturate(100);
    setBlur(0);
    setHue(0);
    setExporting(false);
    setExportError(null);
  }, [asset?.id]);

  // Track the preview area width so rotated images can be fitted without clipping
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setPreviewW(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleResetAll = () => {
    setRotation(0);
    setFlipH(false);
    setBrightness(100);
    setContrast(100);
    setSaturate(100);
    setBlur(0);
    setHue(0);
  };

  const RATIO_VALUES: Record<string, number> = {
    '16:9': 16 / 9,
    '4:3': 4 / 3,
    '1:1': 1,
    '9:16': 9 / 16
  };

  const cropActive =
    cropRect.x > 0 || cropRect.y > 0 || cropRect.w < 100 || cropRect.h < 100;
  const ratioValue = cropPreset === 'free' ? null : RATIO_VALUES[cropPreset];
  const imgAspect =
    naturalDims && naturalDims.h ? naturalDims.w / naturalDims.h : null;
  const ratioPct = ratioValue && imgAspect ? ratioValue / imgAspect : null;

  const PREVIEW_MAX_H = 480;

  // Compute the fitted display size of the image (the layout box BEFORE the CSS rotation
  // is applied). The scale is computed against the *rotated* (effective) dimensions so that
  // after the transform rotates the image, its whole visible box fits inside the preview area.
  const computeFitted = () => {
    const natW = naturalDims?.w ?? 0;
    const natH = naturalDims?.h ?? 0;
    if (!natW || !natH) return null;
    const rotated = rotation % 180 !== 0;
    const effW = rotated ? natH : natW;
    const effH = rotated ? natW : natH;
    const availW = previewW || effW;
    const availH = PREVIEW_MAX_H;
    const scale = Math.min(availW / effW, availH / effH, 1);
    return {
      rotated,
      dispW: effW * scale,
      dispH: effH * scale
    };
  };

  // Convert a screen point to image-local percentages (inverse of the CSS rotate/flip transform)
  const imagePointToPercent = (clientX: number, clientY: number) => {
    const el = wrapperRef.current;
    if (!el) return { x: 50, y: 50 };
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = clientX - cx;
    const dy = clientY - cy;
    let ix = dx * cos + dy * sin;
    let iy = -dx * sin + dy * cos;
    if (flipH) ix = -ix;
    const fitted = computeFitted();
    const w = fitted ? fitted.dispW : rect.width;
    const h = fitted ? fitted.dispH : rect.height;
    return {
      x: Math.max(0, Math.min(100, ((ix / (w / 2 || 1)) + 1) * 50)),
      y: Math.max(0, Math.min(100, ((iy / (h / 2 || 1)) + 1) * 50))
    };
  };

  const clampRect = (r: CropRect): CropRect => {
    const w = Math.max(5, Math.min(100, r.w));
    const h = Math.max(5, Math.min(100, r.h));
    return {
      x: Math.max(0, Math.min(100 - w, r.x)),
      y: Math.max(0, Math.min(100 - h, r.y)),
      w,
      h
    };
  };

  const handleCropPreset = (ratio: EditorCropRatio) => {
    setCropPreset(ratio);
    if (ratio === 'free' || !imgAspect) {
      setCropRect({ x: 0, y: 0, w: 100, h: 100 });
      return;
    }
    const r = RATIO_VALUES[ratio] / imgAspect; // fw / fh
    let fw: number;
    let fh: number;
    if (r >= 1) {
      fw = 1;
      fh = 1 / r;
    } else {
      fh = 1;
      fw = r;
    }
    const w = fw * 100;
    const h = fh * 100;
    setCropRect({ x: (100 - w) / 2, y: (100 - h) / 2, w, h });
  };

  const startCropDrag = (e: React.PointerEvent, mode: CropDragMode) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // pointer capture unavailable — fall back to element-level move handlers
    }
    dragRef.current = {
      mode,
      start: { ...cropRect },
      last: imagePointToPercent(e.clientX, e.clientY)
    };
  };

  const moveCropDrag = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || !d.mode || !d.start) return;
    const p = imagePointToPercent(e.clientX, e.clientY);
    const s = d.start;
    if (d.mode === 'move') {
      const dx = p.x - (d.last?.x ?? p.x);
      const dy = p.y - (d.last?.y ?? p.y);
      setCropRect(clampRect({ x: s.x + dx, y: s.y + dy, w: s.w, h: s.h }));
      return;
    }
    // The fixed opposite corner (the corner NOT being dragged)
    const fixedX = d.mode.includes('w') ? s.x + s.w : s.x;
    const fixedY = d.mode.includes('n') ? s.y + s.h : s.y;
    let w = d.mode.includes('w') ? fixedX - p.x : p.x - fixedX;
    let h = d.mode.includes('n') ? fixedY - p.y : p.y - fixedY;
    const maxW = d.mode.includes('w') ? fixedX : 100 - fixedX;
    const maxH = d.mode.includes('n') ? fixedY : 100 - fixedY;
    w = Math.max(5, Math.min(w, maxW));
    h = Math.max(5, Math.min(h, maxH));
    if (ratioPct) {
      if (w / Math.max(h, 0.001) > ratioPct) w = h * ratioPct;
      else h = w / ratioPct;
      if (w > maxW) {
        w = maxW;
        h = w / ratioPct;
      }
      if (h > maxH) {
        h = maxH;
        w = h * ratioPct;
      }
      // keep the box above the 5% floor while preserving the ratio
      if (w < 5) {
        const k = 5 / w;
        w = 5;
        h *= k;
      }
      if (h < 5) {
        const k = 5 / h;
        h = 5;
        w *= k;
      }
    }
    setCropRect(
      clampRect({
        x: d.mode.includes('w') ? fixedX - w : fixedX,
        y: d.mode.includes('n') ? fixedY - h : fixedY,
        w,
        h
      })
    );
  };

  const endCropDrag = () => {
    dragRef.current = { mode: null, start: null, last: null };
  };

  // Watermark drag & drop (درگ و دراپ)
  const startWmDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // pointer capture unavailable — fall back to element-level move handlers
    }
    wmDraggingRef.current = true;
    const p = imagePointToPercent(e.clientX, e.clientY);
    setWatermarkPos('custom');
    setWatermarkX(p.x);
    setWatermarkY(p.y);
  };

  const moveWmDrag = (e: React.PointerEvent) => {
    if (!wmDraggingRef.current) return;
    const p = imagePointToPercent(e.clientX, e.clientY);
    setWatermarkX(p.x);
    setWatermarkY(p.y);
  };

  const endWmDrag = () => {
    wmDraggingRef.current = false;
  };

  // Render the edited image onto a canvas and upload it to the server as a NEW file.
  const handleExportSave = () => {
    if (!asset) return;
    setExporting(true);
    setExportError(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        // Crop region in the source image's pixel space (percentages of the original)
        const sx = img.naturalWidth * (cropRect.x / 100);
        const sy = img.naturalHeight * (cropRect.y / 100);
        const sw = img.naturalWidth * (cropRect.w / 100);
        const sh = img.naturalHeight * (cropRect.h / 100);
        const rotated = rotation % 180 !== 0;
        const canvas = document.createElement('canvas');
        canvas.width = rotated ? sh : sw;
        canvas.height = rotated ? sw : sh;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas-unsupported');

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(flipH ? -1 : 1, 1);
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) blur(${blur}px) hue-rotate(${hue}deg)`;
        ctx.drawImage(img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);

        if (watermarkText) {
          ctx.filter = 'none';
          ctx.globalAlpha = watermarkOpacity / 100;
          ctx.font = 'bold 28px Vazirmatn, Tahoma, sans-serif';
          ctx.fillStyle = '#ffffff';
          const pad = 24;
          if (watermarkPos === 'custom') {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
              watermarkText,
              sw * (watermarkX / 100) - sw / 2,
              sh * (watermarkY / 100) - sh / 2
            );
          } else {
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            const textWidth = ctx.measureText(watermarkText).width;
            let x = sw / 2 - pad;
            let y = sh / 2 - pad;
            if (watermarkPos === 'bottom-left') {
              x = -sw / 2 + pad + textWidth;
              y = sh / 2 - pad;
            } else if (watermarkPos === 'top-right') {
              x = sw / 2 - pad;
              y = -sh / 2 + pad + 30;
            } else if (watermarkPos === 'center') {
              x = textWidth / 2;
              y = 10;
            }
            ctx.fillText(watermarkText, x, y);
          }
        }

        canvas.toBlob(async (blob) => {
          if (!blob) {
            setExportError('خطا در ساخت تصویر خروجی.');
            setExporting(false);
            return;
          }
          try {
            const fileName = (asset.name || 'image').replace(/\.[^.]+$/, '') + '-edited.png';
            const file = new File([blob], fileName, { type: 'image/png' });
            const targetFolderId =
              folderId === undefined || folderId === null || folderId === ''
                ? null
                : Number(folderId);
            const res = await uploadMediaFile(file, targetFolderId);
            setExporting(false);
            onSave(toGalleryAsset(res.data));
          } catch (e: any) {
            setExportError(e?.message || 'خطا در ذخیره روی سرور.');
            setExporting(false);
          }
        }, 'image/png');
      } catch (e) {
        setExportError('خطا در ساخت تصویر خروجی (ممکن است بارگذاری تصویر با محدودیت CORS مواجه شده باشد).');
        setExporting(false);
      }
    };
    img.onerror = () => {
      setExportError('امکان بارگذاری تصویر اصلی وجود ندارد.');
      setExporting(false);
    };
    // آدرس stream هدر CORS دارد تا canvas با crossOrigin قابل استفاده باشد
    img.src = getMediaStreamUrl(asset);
  };

  const filterStyle = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) blur(${blur}px) hue-rotate(${hue}deg)`;
  const fitted = computeFitted();

  return (
    <AnimatePresence>
      {asset && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-[96vw] lg:max-w-6xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
          >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                ویرایشگر تصویر
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                فایل: {asset.name} ({asset.type})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetAll}
              className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Undo className="w-3.5 h-3.5" />
              <span>بازنشانی تغییرات</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Main Interactive Canvas Preview */}
          <div ref={previewRef} className="lg:col-span-8 bg-slate-950/90 relative flex items-center justify-center p-6 overflow-hidden min-h-[380px]">
            <div className="relative max-w-full max-h-[520px] flex items-center justify-center overflow-hidden transition-all duration-300">
              <div
                ref={wrapperRef}
                className="relative min-w-0 flex items-center justify-center"
                style={
                  fitted
                    ? {
                        width: fitted.rotated ? fitted.dispH : fitted.dispW,
                        height: fitted.rotated ? fitted.dispW : fitted.dispH
                      }
                    : undefined
                }
              >
                <img
                  src={asset.url}
                  alt={asset.name}
                  onLoad={(e) => {
                    const el = e.currentTarget;
                    if (el.naturalWidth) {
                      setNaturalDims({ w: el.naturalWidth, h: el.naturalHeight });
                    }
                  }}
                  className="block shrink-0 max-w-full max-h-[480px] w-auto h-auto object-contain rounded-xl shadow-2xl transition-all duration-200"
                  style={{
                    ...(fitted
                      ? { width: fitted.dispW, height: fitted.dispH, maxWidth: 'none', maxHeight: 'none' }
                      : {}),
                    transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`,
                    filter: filterStyle
                  }}
                />

                {/* Crop overlay — rotates/flips together with the image */}
                {(activeTab === 'transform' || cropActive) && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})` }}
                  >
                    <div
                      className="absolute border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
                      style={{
                        left: `${cropRect.x}%`,
                        top: `${cropRect.y}%`,
                        width: `${cropRect.w}%`,
                        height: `${cropRect.h}%`
                      }}
                    >
                      {activeTab === 'transform' && (
                        <div
                          className="absolute inset-0 cursor-move touch-none select-none pointer-events-auto"
                          onPointerDown={(e) => startCropDrag(e, 'move')}
                          onPointerMove={moveCropDrag}
                          onPointerUp={endCropDrag}
                          onPointerCancel={endCropDrag}
                        >
                          {/* Rule-of-thirds grid */}
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/40" />
                            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/40" />
                            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/40" />
                            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/40" />
                          </div>
                          {/* Corner handles */}
                          {(
                            [
                              { mode: 'nw', cls: '-left-1.5 -top-1.5', cur: 'nwse-resize' },
                              { mode: 'ne', cls: '-right-1.5 -top-1.5', cur: 'nesw-resize' },
                              { mode: 'sw', cls: '-left-1.5 -bottom-1.5', cur: 'nesw-resize' },
                              { mode: 'se', cls: '-right-1.5 -bottom-1.5', cur: 'nwse-resize' }
                            ] as { mode: CropDragMode; cls: string; cur: string }[]
                          ).map((h) => (
                            <div
                              key={h.mode}
                              className={`absolute w-3 h-3 rounded-sm bg-white border-2 border-teal-500 shadow-md touch-none ${h.cur} ${h.cls}`}
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                startCropDrag(e, h.mode);
                              }}
                              onPointerMove={moveCropDrag}
                              onPointerUp={endCropDrag}
                              onPointerCancel={endCropDrag}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Watermark overlay preview — always visible while text is set (درگ و دراپ) */}
                {watermarkText && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})` }}
                  >
                    <div
                      className={`absolute p-3 rounded-lg bg-black/60 backdrop-blur-xs text-white font-black text-xs select-none cursor-grab active:cursor-grabbing touch-none pointer-events-auto flex items-center gap-2 ${
                        watermarkPos === 'top-right'
                          ? 'top-4 right-4'
                          : watermarkPos === 'bottom-left'
                          ? 'bottom-4 left-4'
                          : watermarkPos === 'center'
                          ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                          : watermarkPos === 'custom'
                          ? ''
                          : 'bottom-4 right-4'
                      }`}
                      style={{
                        opacity: watermarkOpacity / 100,
                        ...(watermarkPos === 'custom'
                          ? {
                              left: `${watermarkX}%`,
                              top: `${watermarkY}%`,
                              transform: 'translate(-50%, -50%)'
                            }
                          : {})
                      }}
                      onPointerDown={startWmDrag}
                      onPointerMove={moveWmDrag}
                      onPointerUp={endWmDrag}
                      onPointerCancel={endWmDrag}
                    >
                      <span>{watermarkText}</span>
                      <button
                        type="button"
                        title="حذف واترمارک"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => setWatermarkText('')}
                        className="shrink-0 p-0.5 rounded-md bg-white/25 hover:bg-red-500/90 text-white transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Canvas Badge */}
            <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-[11px] flex items-center gap-2">
              <span>چرخش: {rotation}°</span>
              <span>•</span>
              <span>روشنایی: {brightness}%</span>
            </div>
          </div>

          {/* Right Controls Panel */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col h-full overflow-y-auto">
            {/* Control Tabs */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-950/40">
              <button
                onClick={() => setActiveTab('transform')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'transform'
                    ? 'bg-teal-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="چرخش و برش"
              >
                <Crop className="w-4 h-4" />
                <span>برش</span>
              </button>

              <button
                onClick={() => setActiveTab('adjust')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'adjust'
                    ? 'bg-teal-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="تنظیم رنگ و نور"
              >
                <Sliders className="w-4 h-4" />
                <span>تنظیمات</span>
              </button>

              <button
                onClick={() => setActiveTab('watermark')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'watermark'
                    ? 'bg-teal-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="واترمارک"
              >
                <Type className="w-4 h-4" />
                <span>واترمارک</span>
              </button>

              <button
                onClick={() => setActiveTab('export')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'export'
                    ? 'bg-teal-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="ذخیره در سرور"
              >
                <Save className="w-4 h-4" />
                <span>ذخیره</span>
              </button>
            </div>

            {/* Controls Content */}
            <div className="p-5 flex-1 space-y-5">
              {activeTab === 'transform' && (
                <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                    چرخش و قرینه‌سازی
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-500 hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCw className="w-4 h-4" />
                      <span>چرخش ۹۰ درجه</span>
                    </button>

                    <button
                      onClick={() => setFlipH((f) => !f)}
                      className={`p-3 rounded-2xl transition-all text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                        flipH
                          ? 'bg-teal-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <FlipHorizontal className="w-4 h-4" />
                      <span>قرینه‌سازی افقی</span>
                    </button>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-slate-800">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      نسبت ابعاد برش (Aspect Ratio):
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['free', '16:9', '4:3', '1:1', '9:16'] as const).map((ratio) => (
                        <button
                          key={ratio}
                          onClick={() => handleCropPreset(ratio)}
                          className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            cropPreset === ratio
                              ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400 font-black'
                              : 'border-gray-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {ratio === 'free' ? 'آزاد' : ratio}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      برای برش، گوشه‌های کادر را بکشید؛ برای جابجایی کادر، داخل آن را بکشید. انتخاب نسبت ابعاد، کادر برش را محدود می‌کند.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'adjust' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                    تنظیمات نور و فیلترهای رنگی
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        <span>روشنایی (Brightness)</span>
                        <span className="text-teal-600">{brightness}%</span>
                      </div>
                      <input
                        type="range"
                        dir="ltr"
                        min="50"
                        max="150"
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="w-full accent-teal-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        <span>کنتراست (Contrast)</span>
                        <span className="text-teal-600">{contrast}%</span>
                      </div>
                      <input
                        type="range"
                        dir="ltr"
                        min="50"
                        max="150"
                        value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                        className="w-full accent-teal-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        <span>غلظت رنگ (Saturation)</span>
                        <span className="text-teal-600">{saturate}%</span>
                      </div>
                      <input
                        type="range"
                        dir="ltr"
                        min="0"
                        max="200"
                        value={saturate}
                        onChange={(e) => setSaturate(Number(e.target.value))}
                        className="w-full accent-teal-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        <span>ماتی و محوشدگی (Blur)</span>
                        <span className="text-teal-600">{blur}px</span>
                      </div>
                      <input
                        type="range"
                        dir="ltr"
                        min="0"
                        max="10"
                        value={blur}
                        onChange={(e) => setBlur(Number(e.target.value))}
                        className="w-full accent-teal-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        <span>چرخش رنگ (Hue)</span>
                        <span className="text-teal-600">{hue}°</span>
                      </div>
                      <input
                        type="range"
                        dir="ltr"
                        min="0"
                        max="360"
                        value={hue}
                        onChange={(e) => setHue(Number(e.target.value))}
                        className="w-full accent-teal-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'watermark' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                    درج واترمارک اختصاصی سازمان
                  </h4>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                      متن واترمارک:
                    </label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="متن حقوق کپی‌رایت..."
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                      موقعیت درج روی تصویر:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'bottom-right', label: 'پایین راست' },
                        { id: 'bottom-left', label: 'پایین چپ' },
                        { id: 'top-right', label: 'بالا راست' },
                        { id: 'center', label: 'مرکز تصویر' }
                      ].map((pos) => (
                        <button
                          key={pos.id}
                          onClick={() => setWatermarkPos(pos.id as any)}
                          className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            watermarkPos === pos.id
                              ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400 font-black'
                              : 'border-gray-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">
                      برای جابجایی دقیق‌تر، واترمارک را می‌توانید مستقیماً روی تصویر بکشید.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      <span>شفافیت (Opacity)</span>
                      <span className="text-teal-600">{watermarkOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      dir="ltr"
                      min="10"
                      max="100"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                      className="w-full accent-teal-500 cursor-pointer"
                    />
                  </div>

                  {watermarkText && (
                    <button
                      type="button"
                      onClick={() => setWatermarkText('')}
                      className="w-full py-2 px-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      حذف واترمارک
                    </button>
                  )}
                </div>
              )}

              {activeTab === 'export' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                    ذخیره تصویر ویرایش‌شده در سرور
                  </h4>

                  <div className="p-3 rounded-2xl bg-teal-500/5 border border-teal-500/20 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2">
                    <Save className="w-4 h-4 shrink-0 mt-0.5 text-teal-500" />
                    <p>
                      تمام تغییرات (چرخش، قرینه، فیلترها و واترمارک) اعمال و به‌صورت یک
                      فایل <span className="font-bold">PNG</span> جدید در سرور ذخیره می‌شود.
                    </p>
                  </div>

                  {exportError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                      <ImageOff className="w-4 h-4 shrink-0" />
                      <span>{exportError}</span>
                    </div>
                  )}

                  <button
                    onClick={handleExportSave}
                    disabled={exporting}
                    className="w-full py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {exporting ? 'در حال ذخیره روی سرور...' : 'ذخیره تصویر ویرایش‌شده در سرور (PNG)'}
                  </button>

                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    نسخه ویرایش‌شده به‌صورت یک فایل جدید در مخزن ذخیره می‌شود؛ نسخه اصلی دست‌نخورده باقی می‌ماند.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2">
              <button
                onClick={onClose}
                className="w-full py-2 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
