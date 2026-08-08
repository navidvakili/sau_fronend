import React, { useState } from 'react';
import { SmartPageSchema, Breakpoint, getColumnWidth } from './builderTypes';
import { WidgetRenderer } from './WidgetRenderer';
import {
  X,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles
} from 'lucide-react';

interface PreviewModalProps {
  pageSchema: SmartPageSchema;
  onClose: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  pageSchema,
  onClose
}) => {
  const [deviceSize, setDeviceSize] = useState<Breakpoint>('desktop');

  const getContainerWidth = () => {
    switch (deviceSize) {
      case 'tablet':
        return 'max-w-[768px] shadow-2xl rounded-3xl my-8 border border-gray-300 dark:border-slate-800';
      case 'mobile':
        return 'max-w-[390px] shadow-2xl rounded-3xl my-8 border border-gray-300 dark:border-slate-800';
      default:
        return 'w-full min-h-full';
    }
  };

  const globalStyles = pageSchema.globalStyles;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-xl text-slate-900 dark:text-white font-sans rtl text-right transition-colors">
      {/* Top Preview Controls Bar */}
      <div className="flex items-center justify-between p-4 px-6 border-b border-gray-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white">{pageSchema.title} - پیش‌نمایش زنده</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              صفحه با شناسه /page/{pageSchema.slug} (وضعیت: {pageSchema.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'})
            </p>
          </div>
        </div>

        {/* Device Breakpoint Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-gray-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setDeviceSize('desktop')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer ${
              deviceSize === 'desktop' ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-md' : 'text-slate-500'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>دسکتاپ</span>
          </button>
          <button
            onClick={() => setDeviceSize('tablet')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer ${
              deviceSize === 'tablet' ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-md' : 'text-slate-500'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>تبلت</span>
          </button>
          <button
            onClick={() => setDeviceSize('mobile')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer ${
              deviceSize === 'mobile' ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-md' : 'text-slate-500'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>موبایل</span>
          </button>
        </div>

        {/* Close Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Preview Content Canvas — قاب خودش اسکرول می‌خورد تا محتوای بلند قابل مشاهده باشد */}
      <div className="flex-1 overflow-hidden flex justify-center p-4 bg-slate-200 dark:bg-slate-950/80">
        <div
          className={`bg-white dark:bg-slate-900 transition-all duration-300 overflow-y-auto ${getContainerWidth()}`}
          style={{
            fontFamily: globalStyles.fontFamily,
            color: globalStyles.textColor
          }}
        >
          {pageSchema.sections.map((sec) => {
            // Check responsiveness visibility
            if (!sec.visibility[deviceSize]) return null;

            return (
              <div
                key={sec.id}
                id={sec.bookmark || sec.id}
                style={{
                  backgroundColor: sec.backgroundColor || undefined,
                  backgroundImage: sec.backgroundImage
                    ? `url("${sec.backgroundImage}")`
                    : sec.backgroundGradient || undefined,
                  backgroundPosition: sec.backgroundPosition || undefined,
                  backgroundSize: sec.backgroundSize || undefined,
                  backgroundRepeat: sec.backgroundRepeat || undefined,
                  paddingTop: `${sec.paddingTop}px`,
                  paddingBottom: `${sec.paddingBottom}px`,
                  // شعاع گوشه‌های جداگانه (مانند فتوشاپ) — ترتیب CSS: TL TR BR BL
                  borderRadius: sec.borderRadius
                    ? [sec.borderRadius.topLeft, sec.borderRadius.topRight, sec.borderRadius.bottomRight, sec.borderRadius.bottomLeft]
                        .map((v) => (v ? `${v}px` : '0px'))
                        .join(' ')
                    : undefined
                }}
              >
                <div className={sec.layout === 'boxed' ? 'max-w-[1200px] mx-auto px-4 md:px-6' : 'w-full px-4'}>
                  <div className="grid grid-cols-12 gap-4 md:gap-6">
                    {sec.columns.map((col) => (
                      <div
                        key={col.id}
                        style={{
                          gridColumn: `span ${getColumnWidth(col, deviceSize)} / span ${getColumnWidth(col, deviceSize)}`
                        }}
                        className="space-y-4"
                      >
                        {col.widgets.map((widget) => {
                          if (!widget.settings.visibility[deviceSize]) return null;

                          return (
                            <WidgetRenderer
                              key={widget.id}
                              widget={widget}
                              currentUserRole="all"
                              isEditorPreview={false}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
