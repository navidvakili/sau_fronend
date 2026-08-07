import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Play,
  Pause,
  Download,
  Info,
  HardDrive,
  Calendar
} from 'lucide-react';
import { GalleryAsset, formatDate } from './types';
import { VideoPlayer } from './VideoPlayer';

interface LightboxModalProps {
  assets: GalleryAsset[];
  initialAssetId: string;
  onClose: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  assets,
  initialAssetId,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = assets.findIndex((a) => a.id === initialAssetId);
    return idx >= 0 ? idx : 0;
  });

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInfoOverlay, setShowInfoOverlay] = useState(false);

  const currentAsset = assets[currentIndex] || assets[0];

  // Auto slideshow timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % assets.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isPlaying, assets.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handlePrev();
      if (e.key === 'ArrowLeft') handleNext();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = () => {
    setZoom(1);
    setRotation(0);
    setCurrentIndex((prev) => (prev + 1) % assets.length);
  };

  const handlePrev = () => {
    setZoom(1);
    setRotation(0);
    setCurrentIndex((prev) => (prev - 1 + assets.length) % assets.length);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col justify-between overflow-hidden select-none text-white rtl">
      {/* Lightbox Top Control Bar */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 z-10">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold bg-white/10 px-3 py-1 rounded-full text-slate-300">
            {currentIndex + 1} از {assets.length}
          </span>
          <h3 className="text-xs font-black text-white truncate max-w-xs sm:max-w-md">
            {currentAsset?.name}
          </h3>
        </div>

        {/* Toolbar Center / Left Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.5, 4))}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            title="بزرگنمایی"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => setZoom((z) => Math.max(z - 0.5, 1))}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            title="کوچک‌نمایی"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            title="چرخش"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying((p) => !p)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isPlaying ? 'bg-teal-500 text-white' : 'bg-white/10 hover:bg-white/20'
            }`}
            title="اسلایدشو خودکار"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowInfoOverlay((p) => !p)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              showInfoOverlay ? 'bg-teal-600 text-white' : 'bg-white/10 hover:bg-white/20'
            }`}
            title="اطلاعات فایل"
          >
            <Info className="w-4 h-4" />
          </button>

          <a
            href={currentAsset?.url}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            title="دانلود"
          >
            <Download className="w-4 h-4" />
          </a>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer mr-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Center Area */}
      <div className="relative flex-1 flex items-center justify-center p-6 overflow-hidden">
        {/* Nav Prev Button */}
        <button
          onClick={handlePrev}
          className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all cursor-pointer z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Media Viewport */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAsset?.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="max-w-full max-h-full flex items-center justify-center"
          >
            {currentAsset?.fileType === 'image' && (
              <img
                src={currentAsset.url}
                alt={currentAsset.name}
                className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-xl transition-all duration-200"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`
                }}
              />
            )}

            {currentAsset?.fileType === 'video' && (
              <div className="w-[min(80vw,1200px)] aspect-video max-w-full max-h-[80vh]">
                <VideoPlayer
                  key={currentAsset.id}
                  src={currentAsset.url}
                  autoPlay
                  className="w-full h-full rounded-xl shadow-2xl overflow-hidden"
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Nav Next Button */}
        <button
          onClick={handleNext}
          className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all cursor-pointer z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* File Info Overlay Card */}
        {showInfoOverlay && currentAsset && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-6 right-6 p-4 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 text-xs space-y-2 max-w-sm z-10"
          >
            <h4 className="font-extrabold text-teal-400">اطلاعات فایل</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono text-slate-300">
              <div className="flex items-center gap-1.5">
                <HardDrive className="w-3 h-3 text-teal-400" />
                حجم: {currentAsset.sizeFormatted}
              </div>
              <div>فرمت: {currentAsset.type}</div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-teal-400" />
                بارگذاری: {formatDate(currentAsset.created_at)}
              </div>
              <div>شناسه: {currentAsset.id.slice(0, 12)}...</div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Lightbox Bottom Thumbnails Track */}
      <div className="p-3 border-t border-white/10 bg-black/60 flex items-center justify-center gap-2 overflow-x-auto z-10">
        {assets.map((ast, idx) => (
          <button
            key={ast.id}
            onClick={() => {
              setCurrentIndex(idx);
              setZoom(1);
            }}
            className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
              idx === currentIndex
                ? 'border-teal-500 scale-105 shadow-lg shadow-teal-500/30'
                : 'border-transparent opacity-50 hover:opacity-100'
            }`}
          >
            {ast.fileType === 'image' ? (
              <img src={ast.url} alt={ast.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400">
                <span className="text-[8px] font-mono font-bold">{ast.fileType}</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
