// ============================================================
// Static blocks — بلوک‌های استاتیک صفحه‌ساز (متن غنی، کارت اطلاعاتی، دربرگیرنده، شمارنده،
// پیمایشگر، نوار راهبری، نقشه، اطلاعات تماس، HTML دلخواه، لینک‌های اجتماعی، دکمه‌های
// اشتراک، جدول قیمت، نظر کاربر). از WidgetRenderer.tsx استخراج شد (بخش «NEW STATIC BLOCKS»).
// این بلوک‌ها هرکدام کوچک‌اند (اغلب زیر ۵۰ خط) و در یک فایل نگه داشته شدند تا تعداد فایل‌ها
// برای واحدهای غیرمستقل بی‌دلیل زیاد نشود — برخلاف ویجت‌های هوشمند/صفحهٔ اختصاصی که هرکدام
// state/فچ دادهٔ مستقل و واقعاً جدا دارند.
// ============================================================

import React, { cloneElement, type ReactElement, type ReactNode } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Compass,
  FileText,
  Mail,
  MapPin,
  Phone,
  Clock,
  Quote,
  Share2,
  Sparkles,
  Layers,
} from 'lucide-react';
import type { WidgetInstance } from '../../builderTypes';
import { iconMap, parseLines, renderHtmlWithIcons } from '../../utils/textAndIcons';
// ContainerBlock رندر بازگشتی ویجت‌های فرزند را به WidgetRenderer می‌سپارد — همان چرخهٔ
// متقابلی که در فایل اصلی هم وجود داشت (بلوک‌ها می‌توانند ویجت/سکشن تودرتو داشته باشند).
// eslint-disable-next-line import/no-cycle
import { WidgetRenderer } from '../../WidgetRenderer';

/** بلوک متن غنی WYSIWYG (محتوای HTML) */
export const RichTextBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties; variables?: Record<string, string> }> = ({ widget, containerStyle, variables }) => (
  <div
    style={containerStyle}
    className="transition-all richtext-content"
    dangerouslySetInnerHTML={{
      __html:
        renderHtmlWithIcons(
          widget.content ||
            '<p>متن غنی خود را اینجا بنویسید — از HTML برای تیتر، پاراگراف، لینک و آیکون استفاده کنید.</p>',
          variables
        )
    }}
  />
);

/** کارت اطلاعاتی — آیکون + عنوان + متن با چیدمان‌ها و تنظیمات رنگی/سایزی */
export const IconBoxBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const icon = iconMap[props.iconName || widget.iconName || 'sparkles'] || <Sparkles className="w-5 h-5" />;
  // چیدمان: stack (پیش‌فرض) | row (آیکون کنار عنوان، RTL) | row-reverse (LTR) | center (وسط‌چین)
  const layout = props.layout || 'stack';
  const isRow = layout === 'row' || layout === 'row-reverse';
  const iconSize = props.iconSize ?? 24;
  const titleSize = props.titleSize ?? 16;
  const descSize = props.descSize ?? 12;
  const rowIcon = cloneElement(icon as ReactElement<any, any>, {
    style: {
      width: iconSize,
      height: iconSize,
      color: props.iconColor || undefined
    },
    className: 'shrink-0'
  });
  const stackIcon = cloneElement(icon as ReactElement<any, any>, {
    style: {
      width: iconSize,
      height: iconSize,
      color: props.iconColor || undefined
    }
  });
  const iconWrap = (iconNode: ReactNode) => {
    const borderWidth = (props.iconBorderWidth ?? 1) > 0 ? (props.iconBorderWidth ?? 1) : 0;
    return (
      <div
        className="rounded-2xl flex items-center justify-center shrink-0"
        style={{
          width: iconSize + 24,
          height: iconSize + 24,
          backgroundColor: props.iconBgColor === 'transparent' ? undefined : props.iconBgColor || 'rgba(20,184,166,0.1)',
          color: props.iconColor || undefined,
          borderWidth,
          borderStyle: borderWidth > 0 ? 'solid' : undefined,
          borderColor: props.iconBorderColor === 'transparent' ? 'transparent' : props.iconBorderColor || 'rgba(20,184,166,0.2)'
        }}
      >
        {iconNode}
      </div>
    );
  };
  const titleEl = (
    <h3
      className="font-black"
      style={{
        color: props.titleColor || undefined,
        fontSize: titleSize,
        fontFamily: props.titleFont || undefined
      }}
    >
      {widget.title || 'عنوان کارت اطلاعاتی'}
    </h3>
  );
  const descEl = (
    <p
      className="leading-relaxed"
      style={{
        color: props.descColor || undefined,
        fontSize: descSize,
        fontFamily: props.descFont || undefined
      }}
    >
      {widget.content || 'توضیحات کوتاه این باکس در این بخش نمایش داده می‌شود.'}
    </p>
  );
  const buttonEl = props.buttonUrl && (
    <a
      href={props.buttonUrl}
      target={props.buttonTarget === 'new' ? '_blank' : undefined}
      rel={props.buttonTarget === 'new' ? 'noopener noreferrer' : undefined}
      className="mt-1 inline-flex items-center gap-1 font-black hover:gap-2 transition-all cursor-pointer"
      style={{ color: props.iconColor || undefined, fontSize: descSize }}
    >
      {props.buttonText || 'بیشتر بدانید'} <ArrowLeft className="w-3.5 h-3.5" />
    </a>
  );
  const textBlock = (
    <div className={`flex flex-col gap-1 ${isRow ? 'min-w-0' : ''}`} style={{ textAlign: layout === 'center' ? 'center' : undefined }}>
      {titleEl}
      {descEl}
      {buttonEl}
    </div>
  );
  // موقعیت کل کارت در ستون (راست/وسط/چپ/تمام‌عرض) — در RTL راست = شروع
  // maxWidth: وقتی متن بلندتر از ستون باشد fit-content کل عرض ستون را می‌گیرد و تراز دیده نمی‌شود؛
  // با این سقف کارت به پهنای ~عرض خواهر خودش می‌ماند و به سمت انتخابی می‌چسبد
  // فاصلهٔ خارجی دستی کاربر (margin-left/right) بر تراز cardAlign مقدم است — cardAlign فقط
  // سمتِ auto را پیشنهاد می‌کند؛ اگر کاربر همان سمت را دستی ست کرده باشد مقدارش حفظ می‌شود
  // (قبلاً marginInline: '0 auto' مقدار margin-left کاربر را نادیده می‌گرفت و در خروجی auto می‌ماند)
  const cardAlign = props.cardAlign || 'full';
  const wStyle = widget.settings.style || {};
  const mLeft = wStyle.marginLeft !== undefined ? `${wStyle.marginLeft}px` : undefined;
  const mRight = wStyle.marginRight !== undefined ? `${wStyle.marginRight}px` : undefined;
  const cardPosStyle: React.CSSProperties =
    cardAlign === 'center'
      ? { width: 'fit-content', maxWidth: 'calc(100% - 3.5rem)', minWidth: 'min-content', marginLeft: mLeft ?? 'auto', marginRight: mRight ?? 'auto' }
      : cardAlign === 'left'
        ? { width: 'fit-content', maxWidth: 'calc(100% - 3.5rem)', minWidth: 'min-content', marginRight: mRight ?? 'auto', marginLeft: mLeft ?? 0 }
        : cardAlign === 'right'
          ? { width: 'fit-content', maxWidth: 'calc(100% - 3.5rem)', minWidth: 'min-content', marginRight: mRight ?? 0, marginLeft: mLeft ?? 'auto' }
          : {};
  return (
    <div
      style={{ ...containerStyle, ...cardPosStyle }}
      className="p-6 rounded-2xl transition-all"
    >
      {layout === 'stack' && (
        <div className="flex flex-col items-start gap-3 text-right">
          {iconWrap(stackIcon)}
          {textBlock}
        </div>
      )}
      {layout === 'center' && (
        <div className="flex flex-col items-center gap-3 text-center">
          {iconWrap(stackIcon)}
          {textBlock}
        </div>
      )}
      {isRow && (
        <div className={`flex gap-4 text-right ${layout === 'row-reverse' ? 'flex-row-reverse' : 'flex-row'} items-start`}>
          {iconWrap(rowIcon)}
          {textBlock}
        </div>
      )}
    </div>
  );
};

/** دربرگیرنده (Container) — عمودی یا افقی؛ شامل زیربلوک‌ها */
export const ContainerBlock: React.FC<{
  widget: WidgetInstance;
  containerStyle: React.CSSProperties;
  vertical: boolean;
  depth: number;
  isEditorPreview: boolean;
  variables?: Record<string, string>;
}> = ({ widget, containerStyle, vertical, depth, isEditorPreview, variables }) => {
  const children: WidgetInstance[] = (widget.settings.customProps?.children as WidgetInstance[]) || [];
  const gap = (widget.settings.customProps?.gap as number) ?? 16;

  return (
    <div
      style={{
        ...containerStyle,
        display: 'flex',
        flexDirection: vertical ? 'column' : 'row',
        gap: `${gap}px`,
        flexWrap: vertical ? undefined : 'wrap',
      }}
      className={`rounded-2xl p-4 transition-all ${
        vertical
          ? 'flex-col'
          : 'flex-row items-stretch'
      }`}
    >
      {children.length === 0 ? (
        <div className="flex-1 min-h-[80px] rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs text-slate-400">
          <Layers className="w-4 h-4 ml-1.5" />
          دربرگیرنده خالی — از پنل تنظیمات زیربلوک‌ها را مدیریت کنید
        </div>
      ) : (
        children.map((child) => (
          <div key={child.id} style={vertical ? undefined : { flex: 1, minWidth: 180 }} className={vertical ? undefined : 'flex'}>
            <WidgetRenderer
              widget={child}
              currentUserRole="all"
              isEditorPreview={isEditorPreview}
              depth={depth + 1}
              variables={variables}
            />
          </div>
        ))
      )}
    </div>
  );
};

/** پیمایشگر — فهرستی از نوشته‌ها/برگه‌ها/پست‌های تایپ‌های دلخواه */
export const NavigatorBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const postType = props.postType || 'صفحه';
  const items: { label: string; url: string }[] =
    (props.items as { label: string; url: string }[]) ||
    parseLines(widget.content || '').map((p) => ({ label: p[0] || 'مورد', url: p[1] || '#' }));

  return (
    <div style={containerStyle} className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center gap-2">
        <Compass className="w-4 h-4 text-indigo-500" />
        <span className="text-xs font-black text-slate-900 dark:text-white">{widget.title || 'پیمایش سریع'}</span>
        <span className="mr-auto text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">{postType}</span>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-slate-800">
        {(items.length ? items : [{ label: 'نمونه نوشته ۱', url: '#' }, { label: 'نمونه برگه ۲', url: '#' }]).map((item, i) => (
          <a
            key={i}
            href={item.url || '#'}
            className="flex items-center gap-2.5 px-4 py-3 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
          >
            <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </span>
            <span className="flex-1 font-bold">{item.label}</span>
            <ArrowLeft className="w-3.5 h-3.5 text-slate-300" />
          </a>
        ))}
      </div>
    </div>
  );
};

/** شمارنده — عدد متحرک با پیشوند/پسوند + آیکون و استایل کامل (رنگ/اندازه عدد، کپشن) */
export const CounterBlock: React.FC<{
  widget: WidgetInstance;
  containerStyle: React.CSSProperties;
  isEditorPreview?: boolean;
}> = ({ widget, containerStyle, isEditorPreview = false }) => {
  const props = widget.settings.customProps || {};
  const style = widget.settings.style || {};
  const target = Number(props.target ?? (parseFloat(widget.content) || 100));
  const prefix = props.prefix || '';
  const suffix = props.suffix || '+';
  const duration = Number(props.duration) || 1200;
  // رنگ عدد — تنظیم اختصاصی شمارنده یا رنگ متن عمومی ویجت
  const numberColor = props.numberColor || style.textColor || '#0f172a';
  const numberFontSize = props.numberFontSize ? `${props.numberFontSize}px` : undefined;
  const captionColor = props.captionColor || style.textColor || '#64748b';
  const captionFontSize = props.captionFontSize ? `${props.captionFontSize}px` : undefined;
  // کپشن: متن ویجت (content) اولویت دارد؛ وگرنه عنوان ویجت
  const hasRealContent = !!widget.content && widget.content !== 'محتوای اولیه این ویجت در ویرایشگر قرار گرفته است.';
  const caption = hasRealContent ? widget.content : (widget.title || 'شمارنده آماری');
  const icon = props.icon ? iconMap[props.icon] : null;
  const iconColor = props.iconColor || numberColor;
  const iconSize = Number(props.iconSize) || 32;
  const layout = props.layout || 'stacked';
  const align = props.align || 'center';
  const alignCls =
    align === 'center' ? 'items-center text-center'
    : align === 'start' ? 'items-start text-start'
    : 'items-end text-end';
  // فاصله بین اجزا — تنظیم «فاصله بین اجزا (px)» در پنل
  const gap = Number(props.gap) || 6;
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    // در ویرایشگر (استودیو) انیمیشن شمارش اجرا نمی‌شود — عدد نهایی بلافاصله نمایش داده می‌شود
    if (isEditorPreview) {
      setValue(target);
      return;
    }
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, isEditorPreview]);

  // عدد نهایی (شبح نامرئی) — باکس در طول انیمیشن کوچک/بزرگ نمی‌شود و از کارت بیرون نمی‌زند
  const finalStr = `${prefix}${target.toLocaleString('fa-IR')}${suffix}`;
  // صفرپرشدن به تعداد رقم‌های هدف — رقم‌ها سر جای خودشان عوض می‌شوند و پرش افقی/عمودی نمی‌کنند
  const digitCount = String(target).length;
  const toFaDigits = (s: string) => s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]).replace(/,/g, '٬');
  const padded = String(value).padStart(digitCount, '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const displayStr = `${prefix}${toFaDigits(padded)}${suffix}`;
  const iconEl = icon
    ? cloneElement(icon as ReactElement<any, any>, { className: '', style: { width: iconSize, height: iconSize } })
    : null;
  const numberBox = (
    <div
      className="relative font-black leading-none"
      style={{
        color: numberColor,
        fontSize: numberFontSize || undefined,
        maxWidth: '100%',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap'
      }}
    >
      <span className="invisible">{finalStr}</span>
      <span className="absolute inset-0 flex items-center justify-center" style={{ color: numberColor }}>
        {displayStr}
      </span>
    </div>
  );

  return (
    <div style={{ ...containerStyle, gap: `${gap}px` }} className={`p-6 rounded-2xl bg-gradient-to-br from-teal-500/10 to-indigo-500/10 border border-teal-500/20 flex flex-col ${alignCls}`}>
      {layout === 'inline' ? (
        <div className={`flex items-center ${align === 'center' ? 'justify-center' : ''}`} style={{ gap: `${gap}px` }}>
          {iconEl}
          {numberBox}
        </div>
      ) : (
        <>
          {iconEl ? (
            <div style={{ color: iconColor }} className="mb-1 flex items-center justify-center">
              {iconEl}
            </div>
          ) : null}
          {numberBox}
        </>
      )}
      {caption ? (
        <span className="font-bold whitespace-pre-line" style={{ color: captionColor, fontSize: captionFontSize || undefined }}>
          {caption}
        </span>
      ) : null}
    </div>
  );
};

/** نوار راهبری — برند + لینک‌های منو با استایل کامل (رنگ/سایز/انیمیشن هر آیتم) */
export const NavMenuBlock: React.FC<{
  widget: WidgetInstance;
  containerStyle: React.CSSProperties;
  isEditorPreview?: boolean;
}> = ({ widget, containerStyle, isEditorPreview = false }) => {
  const props = widget.settings.customProps || {};
  const brand = props.brand || widget.title;
  const brandColor = props.brandColor || '#ffffff';
  const brandFontSize = props.brandFontSize ? `${props.brandFontSize}px` : undefined;
  const brandPosition = props.brandPosition || 'start';
  const menuPosition = props.menuPosition || 'start';
  const defaultItemColor = props.itemColor || '#e2e8f0';
  const defaultItemFontSize = props.itemFontSize || 13;
  const hoverColor = props.itemHoverColor || '#ffffff';
  const defaultAnimation = props.itemAnimation || 'underline';
  // آیتم‌های منو — اولویت: customProps.items ساختاریافته ← fallback: content (هر خط عنوان|لینک) ← legacy items
  const hasRealContent = !!widget.content && widget.content !== 'محتوای اولیه این ویجت در ویرایشگر قرار گرفته است.';
  const contentItems = parseLines(widget.content || '').map((p) => ({ label: p[0] || 'مورد', url: p[1] || '#' }));
  const items: { label: string; url: string; color?: string; fontSize?: number; animation?: string; bold?: boolean }[] =
    (props.items as any[]) && (props.items as any[]).length > 0
      ? (props.items as any[])
      : hasRealContent && contentItems.length > 0
        ? contentItems
        : [];

  // استایل‌های داینامیک (هاور + انیمیشن) — اسکوپ‌شده با شناسهٔ ویجت
  const uid = `nm-${String(widget.id).replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const animCss = `
.${uid} .nm-item{position:relative;transition:color .2s ease,transform .2s ease,opacity .2s ease}
.${uid} .nm-item:hover{color:${hoverColor}!important}
.${uid} .nm-anim-underline::after{content:'';position:absolute;bottom:-3px;right:0;width:0;height:2px;background:${hoverColor};transition:width .25s ease}
.${uid} .nm-anim-underline:hover::after{width:100%}
.${uid} .nm-anim-fade:hover{opacity:.6}
.${uid} .nm-anim-slide:hover{transform:translateY(-2px)}
${isEditorPreview ? '' : `.${uid} .nm-anim-pulse{animation:${uid}-pulse 2.2s ease-in-out infinite}
@keyframes ${uid}-pulse{0%,100%{opacity:1}50%{opacity:.55}}
`}`;

  // ترازبندی — برند در راست/وسط/چپ و تراز نوار منو
  let navCls = 'flex items-center gap-4 flex-wrap';
  if (brandPosition === 'center') {
    navCls += '';
  } else if (menuPosition === 'center') {
    navCls += ' mx-auto';
  } else if (menuPosition === 'end') {
    navCls += ' me-auto';
  } else {
    navCls += ' ms-auto';
  }

  return (
    <>
      <style>{animCss}</style>
      <div
        style={containerStyle}
        className={`flex items-center gap-4 flex-wrap py-1.5 ${brandPosition === 'center' ? 'justify-center' : ''}`}
      >
        {brand && brandPosition !== 'end' ? (
          <strong
            className="font-black whitespace-nowrap"
            style={{ color: brandColor, fontSize: brandFontSize }}
          >
            {brand}
          </strong>
        ) : null}
        <nav className={navCls}>
          {items.map((item, i) => {
            const anim = item.animation || defaultAnimation;
            const cls = [
              'nm-item',
              'font-bold',
              'cursor-pointer',
              anim && anim !== 'none' ? `nm-anim-${anim}` : ''
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <a
                key={i}
                href={item.url || '#'}
                className={cls}
                style={{
                  color: item.color || defaultItemColor,
                  fontSize: item.fontSize ? `${item.fontSize}px` : `${defaultItemFontSize}px`,
                  fontWeight: item.bold ? 900 : undefined
                }}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
        {brand && brandPosition === 'end' ? (
          <strong
            className="font-black whitespace-nowrap"
            style={{ color: brandColor, fontSize: brandFontSize }}
          >
            {brand}
          </strong>
        ) : null}
      </div>
    </>
  );
};

/** آدرس جاسازی نقشه OpenStreetMap از روی مختصات دقیق (بدون نیاز به کلید API) */
export const buildOsmEmbedUrl = (lat: number, lng: number, delta = 0.01): string => {
  const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
};

/** نقشه — جاسازی نقشه گوگل */
export const MapBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const hasCoords = typeof props.latitude === 'number' && typeof props.longitude === 'number';
  const embedUrl = hasCoords
    ? buildOsmEmbedUrl(props.latitude, props.longitude)
    : props.embedUrl || widget.content || 'https://www.google.com/maps?q=Yazd&output=embed';

  return (
    <div style={containerStyle} className="rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-800">
      <iframe
        src={embedUrl}
        title={widget.title || 'نقشه'}
        className="w-full h-72 border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="px-4 py-2.5 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-rose-500" />
        {props.address || widget.title || 'نشانی روی نقشه'}
      </div>
    </div>
  );
};

/** اطلاعات تماس */
export const ContactInfoBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const rows: { icon: React.ReactNode; label: string; value: string; href?: string }[] = [
    { icon: <Phone className="w-4 h-4" />, label: 'تلفن', value: props.phone || '۰۳۵-۳۱۲۳۴۵۶۷', href: `tel:${props.phone || ''}` },
    { icon: <Mail className="w-4 h-4" />, label: 'ایمیل', value: props.email || 'info@example.ac.ir', href: `mailto:${props.email || ''}` },
    { icon: <MapPin className="w-4 h-4" />, label: 'نشانی', value: props.address || 'یزد، بلوار دانشگاه، دانشگاه علم و هنر' },
    { icon: <Clock className="w-4 h-4" />, label: 'ساعات کاری', value: props.workHours || 'شنبه تا چهارشنبه ۸ تا ۱۶' },
  ];

  return (
    <div style={containerStyle} className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 space-y-3">
      <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
        <Phone className="w-4 h-4 text-teal-500" />
        {widget.title || 'اطلاعات تماس'}
      </h3>
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-3 text-xs">
          <span className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">{row.icon}</span>
          <span className="text-slate-400 w-16 shrink-0 font-bold">{row.label}</span>
          {row.href ? (
            <a href={row.href} className="font-bold text-slate-700 dark:text-slate-200 hover:text-teal-600 transition-colors cursor-pointer" dir="auto">
              {row.value}
            </a>
          ) : (
            <span className="font-bold text-slate-700 dark:text-slate-200" dir="auto">{row.value}</span>
          )}
        </div>
      ))}
    </div>
  );
};

/** HTML دلخواه */
export const CustomHtmlBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => (
  <div
    style={containerStyle}
    className="transition-all custom-html-block"
    dangerouslySetInnerHTML={{
      __html:
        widget.content ||
        '<div style="padding:24px;border:2px dashed #94a3b8;border-radius:12px;text-align:center;color:#94a3b8;font-size:13px">HTML دلخواه خود را در پنل تنظیمات وارد کنید</div>'
    }}
  />
);

/** لینک‌های اجتماعی */
export const SocialLinksBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const networks = ['telegram', 'instagram', 'twitter', 'linkedin', 'youtube', 'whatsapp'];
  const labels: Record<string, string> = { telegram: 'تلگرام', instagram: 'اینستاگرام', twitter: 'توییتر', linkedin: 'لینکدین', youtube: 'یوتیوب', whatsapp: 'واتساپ' };
  const colors: Record<string, string> = { telegram: 'bg-sky-500', instagram: 'bg-pink-600', twitter: 'bg-sky-600', linkedin: 'bg-blue-700', youtube: 'bg-rose-600', whatsapp: 'bg-emerald-500' };
  const urls = props.urls as Record<string, string> | undefined;

  return (
    <div style={containerStyle} className="flex items-center gap-2.5">
      <span className="text-xs font-black text-slate-600 dark:text-slate-300">{widget.title || 'ما را دنبال کنید'}</span>
      {networks.map((n) => {
        const url = urls?.[n] || '#';
        return (
          <a
            key={n}
            href={url}
            title={labels[n]}
            className={`w-9 h-9 rounded-full ${colors[n]} text-white flex items-center justify-center hover:scale-110 hover:shadow-lg transition-all cursor-pointer`}
          >
            <Share2 className="w-4 h-4" />
          </a>
        );
      })}
    </div>
  );
};

/** دکمه‌های اشتراک‌گذاری */
export const ShareButtonsBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const url = props.pageUrl || (typeof window !== 'undefined' ? window.location.href : '#');
  const encoded = encodeURIComponent(url);
  const title = encodeURIComponent(widget.title || 'صفحه');
  const shareItems = [
    { label: 'تلگرام', color: 'bg-sky-500', href: `https://t.me/share/url?url=${encoded}&text=${title}` },
    { label: 'واتساپ', color: 'bg-emerald-500', href: `https://wa.me/?text=${title}%20${encoded}` },
    { label: 'توییتر', color: 'bg-sky-600', href: `https://twitter.com/intent/tweet?url=${encoded}&text=${title}` },
    { label: 'لینکدین', color: 'bg-blue-700', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}` },
    { label: 'ایمیل', color: 'bg-slate-500', href: `mailto:?subject=${title}&body=${encoded}` },
  ];

  return (
    <div style={containerStyle} className="flex items-center gap-2">
      <span className="text-xs font-black text-slate-600 dark:text-slate-300 flex items-center gap-1">
        <Share2 className="w-3.5 h-3.5 text-teal-500" />
        اشتراک‌گذاری:
      </span>
      {shareItems.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          title={item.label}
          className="px-2.5 py-1.5 rounded-lg text-[10px] font-black text-white hover:scale-105 transition-all cursor-pointer shadow-sm"
          style={{ backgroundColor: item.color }}
        >
          {item.label}
        </a>
      ))}
    </div>
  );
};

/** جدول قیمت */
export const PricingTableBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const plans: { name: string; price: string; features: string[]; highlight?: boolean }[] =
    (props.plans as { name: string; price: string; features: string[]; highlight?: boolean }[]) ||
    [
      { name: 'پایه', price: 'رایگان', features: ['۱ نوشته', 'پشتیبانی ایمیل'] },
      { name: 'حرفه‌ای', price: '۱٬۵۰۰٬۰۰۰ تومان', features: ['۱۰ نوشته', 'پشتیبانی ۲۴/۷', 'گزارش پیشرفته'], highlight: true },
      { name: 'سازمانی', price: 'تماس بگیرید', features: ['نامحدود', 'مشاور اختصاصی'] },
    ];

  return (
    <div style={containerStyle}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan, i) => (
          <div
            key={i}
            className={`rounded-2xl p-5 border flex flex-col gap-3 transition-all ${
              plan.highlight
                ? 'border-teal-500 bg-gradient-to-b from-teal-500/10 to-transparent shadow-lg -translate-y-1'
                : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-white">{plan.name}</span>
              {plan.highlight && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-teal-600 text-white">پیشنهادی</span>}
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{plan.price}</div>
            <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
              {plan.features.map((f, j) => (
                <li key={j} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="#"
              className={`mt-auto text-center py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                plan.highlight
                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-teal-500 hover:text-white text-slate-700 dark:text-slate-200'
              }`}
            >
              انتخاب این پلن
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

/** نظر کاربر (Testimonial) */
export const TestimonialBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  return (
    <div style={containerStyle} className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-3">
      <Quote className="w-8 h-8 text-teal-500/40" />
      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
        {widget.content || 'تجربه کاربری یا نظر یک نفر از مخاطبان شما در این بخش نمایش داده می‌شود.'}
      </p>
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-slate-800">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-500 text-white flex items-center justify-center font-black text-sm">
          {(props.author || 'ک').slice(0, 1)}
        </div>
        <div>
          <div className="text-xs font-black text-slate-900 dark:text-white">{props.author || 'کاربر نمونه'}</div>
          <div className="text-[10px] text-slate-400">{props.role || 'دانشجوی دانشگاه'}</div>
        </div>
      </div>
    </div>
  );
};
