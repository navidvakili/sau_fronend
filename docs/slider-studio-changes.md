# Slider Studio — فهرست اصلاحات (Changes Log)

> Documented 2026-08-01 · تاریخچهٔ کامل تغییرات ماژول Slider Studio بهصورت دستهبندیشده + تایملاین
> (دوزبانه — Bilingual: فارسی / English)

---

## ۱) جدول خلاصهٔ دستهبندیشده (Category Summary)

| دسته | Category | تغییر (فارسی) | Change (English) | وضعیت | Status |
|---|---|---|---|---|---|
| اشکال هندسی | Shapes | تبدیل ۲۶ شکل از clip-path به SVG با هندسهٔ بهبودیافته | 26 geometric shapes converted from clip-path to inline-SVG | ✅ | Done |
| اشکال هندسی | Shapes | اشکال متقارن در لایههای غیرمربعی اعوجاج پیدا نکنند | Symmetric shapes never distort on non-square layers (`preserveAspectRatio`) | ✅ | Done |
| اشکال هندسی | Shapes | حذف blob (تکراری با ابر) و cross (تکراری با جمع) | Removed `blob` (duplicated cloud) and `cross` (duplicated plus) | ✅ | Done |
| اشکال هندسی | Shapes | صافسازی ابر / حباب گفتگو / حباب فکر | Smoothed cloud, speech & thought bubble paths | ✅ | Done |
| اشکال هندسی | Shapes | اصلاح divide، multiply و علامت ممنوع | Fixed divide, multiply and not-allowed geometry | ✅ | Done |
| اشکال هندسی | Shapes | علامت ممنوع: دایرهٔ توخالی + خط مورب متصل | Not-allowed: hollow circle + connected diagonal slash | ✅ | Done |
| اشکال هندسی | Shapes | رنگ علامت ممنوع از fill لایه (بهجای رنگ ثابت) | Not-allowed color follows layer fill | ✅ | Done |
| اشکال هندسی | Shapes | خطوط افقی/عمودی نازک و کشسان (ضخامت با ابعاد لایه) | Stretchable thin horizontal/vertical lines (thickness = 8% of perpendicular side) | ✅ | Done |
| اشکال هندسی | Shapes | **بدنهٔ علامت ممنوع از fill + border اختیاری روی آن** | **Not-allowed body from fill + optional border on top (final design)** | ✅ | Done |
| مسیر حرکت | Motion Path | انیمیشن حرکت روی مسیر + پیشتنظیمهای مسیر | Motion-path animation with path presets | ✅ | Done |
| مسیر حرکت | Motion Path | نمایش مسیر روی بوم با نقاط انتهایی قابلکشیدن | Motion path on canvas with draggable endpoints | ✅ | Done |
| مسیر حرکت | Motion Path | نقاط انتهایی برچسبدار و همیشه قابلدیدن | Labeled endpoints, path always visible | ✅ | Done |
| مسیر حرکت | Motion Path | اشکال در طول مسیر عمودی بمانند (نچرخند) | Shapes stay upright while moving (offset-rotate: 0deg) | ✅ | Done |
| مسیر حرکت | Motion Path | دستههای تغییر مقیاس یکنواخت برای کل مسیر | Uniform scale handles for the whole path | ✅ | Done |
| تایملاین | Timeline | اسکرول افقی برای اسلایدهای زیاد + پلیهد قابلکشیدن | Horizontal scroll, draggable/clickable playhead, bilingual labels | ✅ | Done |
| تایملاین | Timeline | پنل نمایش لایهها، نوارها و پیشنمایش زنده | Layer visibility panel, thumbnails, live preview | ✅ | Done |
| تایملاین | Timeline | فریز انیمیشنها هنگام توقف (نه پرش به حالت نهایی) | Freeze animations on pause instead of jumping | ✅ | Done |
| تعویض اسلاید | Slide Switcher | جمعشدن تبهای اسلاید در dropdown هنگام سرریز | Tabs collapse into a dropdown on overflow | ✅ | Done |
| تعویض اسلاید | Slide Switcher | دکمهٔ حذف همیشه نمایان + dropdown داخل viewport | Always-visible delete button, dropdown clamped in viewport | ✅ | Done |
| ویدیو | Video | پشتیبانی مطمئن ویدیو برای پسزمینه و لایهها | Reliable video support for backgrounds & layers | ✅ | Done |
| ویدیو | Video | پخش ویدیو فقط هنگام پخش تایملاین/پیشنمایش | Videos play only during playback/live preview | ✅ | Done |
| ویدیو | Video | ادامه از جای توقف بهجای پخش دوباره | Resume from paused position instead of restarting | ✅ | Done |
| کنترل لایه | Layer Controls | کنترلهای Border و Padding برای لایهها | Border & padding controls, rendered in canvas/preview/export | ✅ | Done |
| همگامسازی | Sync | اعمال تغییرات در HomeSlider سایت عمومی sau | Changes synced to sau/public `HomeSlider.tsx` | ✅ | Done |
| همگامسازی | Sync | اعمال تغییرات در frontend و public یزدگرد | Changes synced to yazdrud/frontend + yazdrud/public `Hero.tsx` | ✅ | Done |

---

## ۲) تایملاین کامل اصلاحات (Timeline — sau/frontend، قدیمی ← جدید)

| # | تاریخ | Date | Commit | تغییر (فارسی) | Change (English) |
|---|---|---|---|---|---|
| 1 | 2026-08-01 | — | `0018cac` | اسکلت اولیهٔ پروژه | Initial project |
| 2 | 2026-08-01 | — | `dac9cbc` | اسکرول افقی تایملاین + پلیهد قابلکشیدن + برچسبهای دوزبانه | Timeline horizontal scroll, draggable playhead, bilingual labels |
| 3 | 2026-08-01 | — | `7f3376a` | اصلاح تایملاین: پنل لایهها، نوارها، پیشنمایش زنده | Timeline layer visibility, thumbnails, live preview |
| 4 | 2026-08-01 | — | `37593a6` | جمعشدن تبهای اسلاید در dropdown هنگام سرریز | Slide tabs → dropdown on overflow |
| 5 | 2026-08-01 | — | `a9b1659` | نمایش دائمی dropdown تعویض اسلاید + دکمهٔ حذف | Always-visible slide dropdown + delete button |
| 6 | 2026-08-01 | — | `3705c76` | ثابت نگهداشتن dropdown داخل viewport | Keep slide dropdown in viewport |
| 7 | 2026-08-01 | — | `22bffc9` | محدودکردن dropdown داخل ناحیهٔ محتوا | Clamp dropdown inside content area |
| 8 | 2026-08-01 | — | `4b72442` | فریز انیمیشنها هنگام توقف تایملاین | Freeze animations on pause |
| 9 | 2026-08-01 | — | `e111320` | ادامهٔ ویدیو از جای توقف بهجای پخش دوباره | Resume videos from paused position |
| 10 | 2026-08-01 | — | `cc9c27b` | کنترل Border و Padding برای لایهها | Border & padding layer controls |
| 11 | 2026-08-01 | — | `10af68f` | پشتیبانی مطمئن ویدیو برای پسزمینه و لایهها | Reliable video support |
| 12 | 2026-08-01 | — | `26302bb` | پخش ویدیو فقط هنگام پخش/پیشنمایش | Videos only during playback/preview |
| 13 | 2026-08-01 | — | `1d46a66` | ۲۶ شکل هندسی با clip-path و کنترل خط دور | 26 shape layers (clip-path + outline) |
| 14 | 2026-08-01 | — | `1a2bc33` | جابهجایی fill شکل تا حلقهٔ outline دیده شود | Inset shape fill so outline ring stays visible |
| 15 | 2026-08-01 | — | `583ab2a` | اشکال SVG + انیمیشن مسیر حرکت + پیشتنظیمهای جدید | SVG shapes + motion-path animation + presets |
| 16 | 2026-08-01 | — | `7a4df88` | نمایش مسیر روی بوم با نقاط انتهایی قابلکشیدن | Motion path on canvas, draggable endpoints |
| 17 | 2026-08-01 | — | `f2c1cb6` | مسیر همیشه نمایان + نقاط برچسبدار | Path always visible, labeled endpoints |
| 18 | 2026-08-01 | — | `66fe2ae` | اندازهٔ SVG مسیر هماهنگ با استیج + عمودماندن اشکال | Path SVG sized to stage, shapes upright |
| 19 | 2026-08-01 | — | `21db622` | دستههای مقیاس یکنواخت کل مسیر | Uniform scale handles for the path |
| 20 | 2026-08-01 | — | `e2ab5e3` | رندر همهٔ اشکال بهصورت SVG + بهبود هندسه | All shapes as SVG + geometry improvements |
| 21 | 2026-08-01 | — | `a0289a7` | اشکال متقارن بدون اعوجاج + اصلاح ابر و آیکونها + حذف blob | Symmetric undistorted, cloud fixes, remove blob |
| 22 | 2026-08-01 | — | `bed8c62` | صافسازی ابر/حبابها + اصلاح divide، ممنوع، ضرب + حذف cross | Smoothed bubbles, fixed divide/not-allowed/multiply, remove cross |
| 23 | 2026-08-01 | — | `d753d77` | مسیر ابر نرمتر + علامت ممنوع دولایه | Smoother cloud + layered not-allowed |
| 24 | 2026-08-01 | — | `8de0c1d` | علامت ممنوع: دایرهٔ توخالی + خط مورب متصل | Not-allowed: hollow circle + connected slash |
| 25 | 2026-08-01 | — | `748215b` | رنگ ممنوع از fill لایه + اضافهشدن خطوط افقی/عمودی | Not-allowed fill color + H/V line shapes |
| 26 | 2026-08-01 | — | `ff23db1` | خطوط نازک کشسان (ضخامت با resize) | Stretchable thin lines (resize controls thickness) |
| 27 | 2026-08-01 | — | `afb6b11` | **بدنهٔ ممنوع از fill + border اختیاری (طراحی نهایی)** | **Not-allowed from fill + optional border (final)** |

---

## ۳) تایملاین همگامسازی سایتهای عمومی (Sync Timeline)

| # | تاریخ | Commit (sau/public) | تغییر (فارسی) | Change (English) |
|---|---|---|---|---|
| 1 | 2026-08-01 | `8df22a0` | رندر پروژهٔ slider studio در صفحهٔ اصلی | Render slider studio project on hero |
| 2 | 2026-08-01 | `acc9b52` | حذف صفحهٔ قدیمی hero + اصلاح لایهبندی پسزمینه | Remove old hero, fix bg layering & scaled canvas |
| 3 | 2026-08-01 | `2e992bc` | پسزمینهٔ لایه تا شروع انیمیشن مخفی بماند | Hide layer bg until entrance starts |
| 4 | 2026-08-01 | `4051dbb` | رندر اشکال با clip-path و خط دور | Render shapes with clip-path + outline |
| 5 | 2026-08-01 | `c2d36d2` | جابهجایی fill شکل (هماهنگ با ویرایشگر) | Inset shape fill (sync with editor) |
| 6 | 2026-08-01 | `0319b6a` | رندر ذرات، اشکال SVG و انیمیشن مسیر | Render particles, SVG shapes, motion-path |
| 7 | 2026-08-01 | `e33310f` | عمودماندن اشکال روی مسیر حرکت | Keep shapes upright on motion path |
| 8 | 2026-08-01 | `f8ccb32` | همگامسازی رندر SVG اشکال | Sync SVG shape rendering |
| 9 | 2026-08-01 | `11c1319` | همگامسازی اشکال متقارن + ابر/آیکونها | Sync symmetric shapes + cloud/icon fixes |
| 10 | 2026-08-01 | `06e93ed` | همگامسازی حبابهای خمیده و آیکونها | Sync curved bubbles + icon fixes |
| 11 | 2026-08-01 | `5cd342f` | همگامسازی مسیر ابر و علامت ممنوع | Sync cloud path + not-allowed |
| 12 | 2026-08-01 | `fc700e6` | همگامسازی علامت ممنوع توخالی | Sync hollow not-allowed |
| 13 | 2026-08-01 | `ba7d549` | همگامسازی رنگ fill ممنوع + خطوط جدید | Sync not-allowed fill + line shapes |
| 14 | 2026-08-01 | `8efb5a7` | همگامسازی خطوط نازک کشسان | Sync stretchable thin lines |
| 15 | 2026-08-01 | `7f9dd93` | **همگامسازی طراحی نهایی ممنوع (fill + border)** | **Sync final not-allowed (fill + border)** |

---

## ۴) وضعیت همگامسازی بین پروژهها (Sync Status)

| پروژه | Project | فایل/پوشه | وضعیت | Status |
|---|---|---|---|---|
| sau/frontend | (منبع اصلی — Source of Truth) | `src/apps/slider-studio/` (۱۷ فایل) | ✅ کامل | Full |
| yazdrud/frontend | کپی کامل ویرایشگر | `src/apps/slider-studio/` (۱۷ فایل) | ✅ بایتبهبایت یکسان | Byte-identical |
| sau/public | رندر عمومی | `src/components/HomeSlider.tsx` | ✅ بخش اشکال یکسان | Shape section identical |
| yazdrud/public | رندر عمومی | `src/components/Hero.tsx` | ✅ بخش اشکال یکسان | Shape section identical |
| yazdrud/demo_frontend | فقط ارجاع ماژول | — | ✅ کد اشکال ندارد | No shape code |

---

## ۵) درسهای کلیدی (Key Takeaways — برای یادگیری)

1. **رندر اشکال:** همهٔ ۳۶+ شکل از قالبهای SVG درونخطی با viewBox مشترک ۰..۱۰۰ ساخته میشوند (نه clip-path).
2. **اشکال متقارن:** با `preserveAspectRatio="xMidYMid meet"` رندر میشوند تا در لایهٔ غیرمربعی اعوجاج نگیرند؛ بقیه `none` دارند و کش میآیند.
3. **خط دور (border):** استروک واقعی SVG با `vector-effect="non-scaling-stroke"` — پیکسل یکنواخت در هر سمت، حتی وقتی viewBox غیریکنواخت کشیده میشود.
4. **علامت ممنوع (notAllowed):** بدنه (حلقهٔ توخالی + خط مورب) از **fill** لایه با ضخامت ذاتی ۱۰ ساخته میشود؛ border اختیاری، خطِ ضخیمتر پشت بدنه است (`۱۰ + ۲×عرض`) — رنگ بدنه هرگز از border نمیآید.
5. **multiply:** دو مستطیل چرخیده (±۴۵°) — از polygon خودمتداخل evenodd پرهیز کن (سوراخ وسط میاندازد).
6. **خطوط افقی/عمودی:** ضخامت = ۸٪ از بعد عمود؛ با تغییر ابعاد لایه کنترل میشود (در SYMMETRIC نیستند → `preserveAspectRatio=none`).
7. **مسیر حرکت:** `offset-path` به موقعیت خود لایه لنگر است؛ `offset-anchor: 0% 0%` برای ردیابی گوشهٔ بالا-چپ؛ `offset-rotate: 0deg` تا شکل نچرخد.
8. **SVG سراسری:** یک `<svg>` با `position:absolute; inset:0` بدون width/height → ۳۰۰×۱۵۰ پیشفرض میگیرد؛ همیشه `width:100%; height:100%` بده.
9. **همگامسازی:** منبع حقیقت `sau/frontend/.../constants/shapes.ts` است؛ هر اصلاح باید در هر ۴ نسخه اعمال شود (۲ ویرایشگر + ۲ رندر عمومی).
10. **تایملاین:** فریز انیمیشن در pause؛ ویدیو فقط هنگام پخش/پیشنمایش؛ ادامه از جای توقف.
