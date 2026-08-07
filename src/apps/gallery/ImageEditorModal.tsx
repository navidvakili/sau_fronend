import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Crop,
  RotateCw,
  FlipHorizontal,
  Sliders,
  Type,
  Download,
  Undo,
  ImageOff
} from 'lucide-react';
import { GalleryAsset } from './types';

interface ImageEditorModalProps {
  asset: GalleryAsset;
  onClose: () => void;
  onSave: (updatedAsset: GalleryAsset) => void;
}

type EditorTab = 'transform' | 'adjust' | 'watermark' | 'export';

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  asset,
  onClose,
  // onSave is kept for API compatibility; edits are preview-only (client-side)
  // and the final result is downloaded as PNG.
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<EditorTab>('transform');

  // Transform states
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [cropPreset, setCropPreset] = useState<'free' | '16:9' | '4:3' | '1:1' | '9:16'>('free');

  // Adjustments states
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [blur, setBlur] = useState(0);
  const [hue, setHue] = useState(0);

  // Watermark states
  const [watermarkText, setWatermarkText] = useState('© دانشگاه علوم و فناوری');
  const [watermarkPos, setWatermarkPos] = useState<'bottom-right' | 'bottom-left' | 'center' | 'top-right'>('bottom-right');
  const [watermarkOpacity, setWatermarkOpacity] = useState(75);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleResetAll = () => {
    setRotation(0);
    setFlipH(false);
    setBrightness(100);
    setContrast(100);
    setSaturate(100);
    setBlur(0);
    setHue(0);
  };

  // Render the edited image onto a canvas and download it as PNG.
  const handleExportDownload = () => {
    setExporting(true);
    setExportError(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const rotated = rotation % 180 !== 0;
        const canvas = document.createElement('canvas');
        canvas.width = rotated ? img.naturalHeight : img.naturalWidth;
        canvas.height = rotated ? img.naturalWidth : img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas-unsupported');

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(flipH ? -1 : 1, 1);
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) blur(${blur}px) hue-rotate(${hue}deg)`;
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

        if (watermarkText) {
          ctx.globalAlpha = watermarkOpacity / 100;
          ctx.font = 'bold 28px Vazirmatn, Tahoma, sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          const pad = 24;
          const textWidth = ctx.measureText(watermarkText).width;
          let x = canvas.width - pad;
          let y = canvas.height - pad;
          if (watermarkPos === 'bottom-left') {
            x = pad + textWidth;
            y = canvas.height - pad;
          } else if (watermarkPos === 'top-right') {
            x = canvas.width - pad;
            y = pad + 30;
          } else if (watermarkPos === 'center') {
            x = canvas.width / 2 + textWidth / 2;
            y = canvas.height / 2 + 10;
          }
          ctx.fillText(watermarkText, x, y);
        }

        const link = document.createElement('a');
        link.download = (asset.name || 'image').replace(/\.[^.]+$/, '') + '-edited.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        setExporting(false);
      } catch (e) {
        setExportError('خطا در ساخت تصویر خروجی (ممکن است بارگذاری تصویر با محدودیت CORS مواجه شده باشد).');
        setExporting(false);
      }
    };
    img.onerror = () => {
      setExportError('امکان بارگذاری تصویر اصلی وجود ندارد.');
      setExporting(false);
    };
    img.src = asset.url;
  };

  const filterStyle = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) blur(${blur}px) hue-rotate(${hue}deg)`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
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
          <div className="lg:col-span-8 bg-slate-950/90 relative flex items-center justify-center p-6 overflow-hidden min-h-[380px]">
            <div className="relative max-w-full max-h-[520px] flex items-center justify-center overflow-hidden transition-all duration-300">
              <img
                src={asset.url}
                alt={asset.name}
                className="max-w-full max-h-[480px] object-contain rounded-xl shadow-2xl transition-all duration-200"
                style={{
                  transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`,
                  filter: filterStyle
                }}
              />

              {/* Watermark overlay preview */}
              {watermarkText && activeTab === 'watermark' && (
                <div
                  className={`absolute p-3 rounded-lg bg-black/60 backdrop-blur-xs text-white font-black text-xs pointer-events-none select-none transition-all ${
                    watermarkPos === 'top-right'
                      ? 'top-4 right-4'
                      : watermarkPos === 'bottom-left'
                      ? 'bottom-4 left-4'
                      : watermarkPos === 'center'
                      ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                      : 'bottom-4 right-4'
                  }`}
                  style={{ opacity: watermarkOpacity / 100 }}
                >
                  {watermarkText}
                </div>
              )}
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
                title="خروجی و دانلود"
              >
                <Download className="w-4 h-4" />
                <span>خروجی</span>
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
                          onClick={() => setCropPreset(ratio)}
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
                      برش تعاملی (درگ روی تصویر) در نسخه فعلی پشتیبانی نمی‌شود؛ این نسبت برای خروجی نهایی اعمال می‌گردد.
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
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      <span>شفافیت (Opacity)</span>
                      <span className="text-teal-600">{watermarkOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                      className="w-full accent-teal-500 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'export' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                    خروجی تصویر ویرایش‌شده
                  </h4>

                  <div className="p-3 rounded-2xl bg-teal-500/5 border border-teal-500/20 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2">
                    <Download className="w-4 h-4 shrink-0 mt-0.5 text-teal-500" />
                    <p>
                      تمام تغییرات (چرخش، قرینه، فیلترها و واترمارک) به‌صورت محلی روی مرورگر اعمال و به‌صورت
                      فایل <span className="font-bold">PNG</span> دانلود می‌شود.
                    </p>
                  </div>

                  {exportError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                      <ImageOff className="w-4 h-4 shrink-0" />
                      <span>{exportError}</span>
                    </div>
                  )}

                  <button
                    onClick={handleExportDownload}
                    disabled={exporting}
                    className="w-full py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    {exporting ? 'در حال ساخت تصویر...' : 'دانلود تصویر ویرایش‌شده (PNG)'}
                  </button>

                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    نکته: نسخه اصلی فایل روی سرور بدون تغییر باقی می‌ماند. در صورت نیاز می‌توانید نسخه
                    ویرایش‌شده را جداگانه در مخزن آپلود کنید.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2">
              <button
                onClick={handleExportDownload}
                disabled={exporting}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>دانلود نسخه ویرایش‌شده</span>
              </button>

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
  );
};
