// ============================================================
// Text / icon token helpers — [icon:name] و {{variable}} توکن‌های متن، و نگاشت آیکون‌ها.
// از WidgetRenderer.tsx استخراج شد.
// ============================================================

import React, { cloneElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  MapPin,
  Phone,
  Mail,
  Share2,
  MessageCircle,
  Link2,
  Type,
  Columns,
  Rows,
  Images,
  Gauge,
  Compass,
  Code2,
  Quote,
  Info,
  Send,
  Globe,
  Hash,
  Heart,
  Clock,
  CheckCircle2,
  ArrowLeft,
  User,
  Users,
  BadgeDollarSign,
  ExternalLink,
  UsersRound,
  BookOpen,
  Award,
  LockOpen,
  Lock,
  GraduationCap,
  Sparkles,
  ChartNoAxesColumn,
  Monitor,
  FileCheck,
  BookmarkCheck,
  Layers,
  Box,
  ShieldCheck,
  UserCheck,
  FileText,
  CircleHelp,
  Linkedin,
  Instagram,
  X,
  Youtube,
} from 'lucide-react';
import {
  EitaaIcon,
  BaleIcon,
  CafeBazaarIcon,
  EnamadIcon,
  GapIcon,
  SappIcon,
  ShetabIcon,
  AdobeAcrobatReaderIcon,
  AdobeAfterEffectsIcon,
  AdobeAuditionIcon,
  AdobeIcon,
  AparatIcon,
} from '../components/BrandIcons';

/** آیکون‌های قابل انتخاب برای کارت اطلاعاتی / متن‌های دارای آیکون */
export const iconMap: Record<string, React.ReactNode> = {
  map: <MapPin className="w-5 h-5" />,
  phone: <Phone className="w-5 h-5" />,
  mail: <Mail className="w-5 h-5" />,
  share: <Share2 className="w-5 h-5" />,
  chat: <MessageCircle className="w-5 h-5" />,
  link: <Link2 className="w-5 h-5" />,
  type: <Type className="w-5 h-5" />,
  columns: <Columns className="w-5 h-5" />,
  rows: <Rows className="w-5 h-5" />,
  images: <Images className="w-5 h-5" />,
  gauge: <Gauge className="w-5 h-5" />,
  compass: <Compass className="w-5 h-5" />,
  code: <Code2 className="w-5 h-5" />,
  quote: <Quote className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
  send: <Send className="w-5 h-5" />,
  globe: <Globe className="w-5 h-5" />,
  hash: <Hash className="w-5 h-5" />,
  heart: <Heart className="w-5 h-5" />,
  clock: <Clock className="w-5 h-5" />,
  check: <CheckCircle2 className="w-5 h-5" />,
  arrow: <ArrowLeft className="w-5 h-5" />,
  user: <User className="w-5 h-5" />,
  users: <Users className="w-5 h-5" />,
  dollar: <BadgeDollarSign className="w-5 h-5" />,
  external: <ExternalLink className="w-5 h-5" />,
  students: <UsersRound className="w-5 h-5" />,
  book: <BookOpen className="w-5 h-5" />,
  award: <Award className="w-5 h-5" />,
  unlock: <LockOpen className="w-5 h-5" />,
  lock: <Lock className="w-5 h-5" />,
  grad: <GraduationCap className="w-5 h-5" />,
  sparkles: <Sparkles className="w-5 h-5" />,
  stat: <ChartNoAxesColumn className="w-5 h-5" />,
  monitor: <Monitor className="w-5 h-5" />,
  'file-check': <FileCheck className="w-5 h-5" />,
  'bookmark-check': <BookmarkCheck className="w-5 h-5" />,
  layers: <Layers className="w-5 h-5" />,
  box: <Box className="w-5 h-5" />,
  'shield-check': <ShieldCheck className="w-5 h-5" />,
  'user-check': <UserCheck className="w-5 h-5" />,
  'file-text': <FileText className="w-5 h-5" />,
  'circle-question-mark': <CircleHelp className="w-5 h-5" />,
  linkedin: <Linkedin className="w-5 h-5" />,
  instagram: <Instagram className="w-5 h-5" />,
  x: <X className="w-5 h-5" />,
  youtube: <Youtube className="w-5 h-5" />,
  telegram: <Send className="w-5 h-5" />,
  aparat: <AparatIcon className="w-5 h-5" />,
  bale: <BaleIcon className="w-5 h-5" />,
  eitaa: <EitaaIcon className="w-5 h-5" />,
  cafebazaar: <CafeBazaarIcon className="w-5 h-5" />,
  enamad: <EnamadIcon className="w-5 h-5" />,
  gap: <GapIcon className="w-5 h-5" />,
  sapp: <SappIcon className="w-5 h-5" />,
  shetab: <ShetabIcon className="w-5 h-5" />,
  adobeacrobatreader: <AdobeAcrobatReaderIcon className="w-5 h-5" />,
  adobeaftereffects: <AdobeAfterEffectsIcon className="w-5 h-5" />,
  adobeaudition: <AdobeAuditionIcon className="w-5 h-5" />,
  adobe: <AdobeIcon className="w-5 h-5" />,
};

/** استخراج گزینه‌ها از محتوای متنی (هر خط: برچسب|مقدار|...) */
export const parseLines = (content: string, separators = '|،,;'): string[][] =>
  (content || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(new RegExp(`[${separators}]`)).map((p) => p.trim()));

// ────────────────────────────────────────────────
// رندر آیکون‌ها (توکن [icon:name]) و متغیرهای صفحهٔ اختصاصی (توکن {{key}}) درج‌شده در متن
// ────────────────────────────────────────────────
export const ICON_TOKEN_RE = /\[icon:([a-zA-Z-]+)\]/g;
export const VARIABLE_TOKEN_RE = /\{\{(\w+)\}\}/g;

/** اندازه آیکون داخل متن */
export const inlineIconClass = 'inline-block w-4 h-4 align-middle mx-1 shrink-0';

/** جایگزینی توکن‌های {{key}} با مقدار واقعی — اگر variables داده نشده باشد، متن دست‌نخورده می‌ماند */
export const resolveVariableTokens = (text: string, variables?: Record<string, string>): string => {
  const content = text || '';
  if (!variables) return content;
  return content.replace(VARIABLE_TOKEN_RE, (match, key) => (key in variables ? variables[key] : match));
};

/** جایگزینی توکن‌های [icon:name] در متن ساده با کامپوننت آیکون (پس از حل متغیرها) */
export const renderTextWithIcons = (content: string, variables?: Record<string, string>): ReactNode => {
  const parts = resolveVariableTokens(content, variables).split(ICON_TOKEN_RE);
  // split با گروه ضبط‌شده: [متن, نام, متن, نام, ...]
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      const el = iconMap[part];
      if (!el) return `[icon:${part}]`;
      return cloneElement(el as ReactElement<any, any>, { className: inlineIconClass, key: `ic-${i}` });
    }
    return part;
  });
};

/** جایگزینی توکن‌های [icon:name] در HTML (ریش‌تکست) با SVG درون‌خطی (پس از حل متغیرها) */
export const renderHtmlWithIcons = (html: string, variables?: Record<string, string>): string => {
  return resolveVariableTokens(html, variables).replace(ICON_TOKEN_RE, (match, name: string) => {
    const el = iconMap[name];
    if (!el) return match;
    try {
      return renderToStaticMarkup(cloneElement(el as ReactElement<any, any>, { className: inlineIconClass }));
    } catch {
      return match;
    }
  });
};
