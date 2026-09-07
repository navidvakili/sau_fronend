// ============================================================
// DedicatedPageFacultyHeroWidget — از WidgetRenderer.tsx استخراج شد
// (بخش «بلوک‌های اختصاصیِ صفحهٔ استاد»).
// ============================================================

import React, { useEffect, useState } from 'react';
import { Building2, Copy, ExternalLink, GraduationCap, MessageCircle, Printer, User } from 'lucide-react';
import { fetchDedicatedPageHeroForWidget, type DedicatedPageHeroSummary } from '../../../api';
import { SmartEmpty } from '../SmartWidgetStates';
import { DedicatedPageNotConfigured } from './shared';
import { DEFAULT_ACCENT_COLOR, accentWithAlpha, shadeAccentColor } from '../../../utils/styleResolvers';

/** ویجت هدر غنیِ صفحهٔ استاد — آواتار/رتبه/گروه/دکمه‌های کپی‌لینک،چاپ،Google Scholar + گرید آمار + دکمهٔ ارتباط با استاد */
export const DedicatedPageFacultyHeroWidget: React.FC<{
  containerStyle: React.CSSProperties;
  dedicatedPageId?: number | null;
  accentColor?: string;
}> = ({ containerStyle, dedicatedPageId, accentColor = DEFAULT_ACCENT_COLOR }) => {
  const [hero, setHero] = useState<DedicatedPageHeroSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!dedicatedPageId) return;
    let cancelled = false;
    setHero(null);
    setError(null);
    fetchDedicatedPageHeroForWidget(dedicatedPageId)
      .then((res) => { if (!cancelled) setHero(res); })
      .catch((err) => { if (!cancelled) setError(err?.message || 'خطا در دریافت اطلاعات هدر صفحه'); });
    return () => { cancelled = true; };
  }, [dedicatedPageId]);

  if (!dedicatedPageId) {
    return <div style={containerStyle}><DedicatedPageNotConfigured /></div>;
  }

  if (error) {
    return <div style={containerStyle}><SmartEmpty error={error} /></div>;
  }

  if (!hero) {
    return null;
  }

  const profile = hero.professorProfile;
  const stats = [
    { label: 'مقاله علمی معتبر', value: profile?.publications?.length || 0 },
    { label: 'کتاب تألیف‌شده', value: profile?.books?.length || 0 },
    { label: 'طرح پژوهشی', value: hero.projectsCount },
    { label: 'درس ارائه‌شده', value: hero.coursesCount }
  ];

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const heroBg = shadeAccentColor(accentColor, -55);
  const heroPanelBg = shadeAccentColor(accentColor, -68);
  const avatarBorder = shadeAccentColor(accentColor, -40);
  const badgeBg = accentWithAlpha(shadeAccentColor(accentColor, -25), 'cc');
  const ctaBg = accentColor;
  const ctaHoverBg = shadeAccentColor(accentColor, 15);

  return (
    <div style={{ ...containerStyle, backgroundColor: heroBg }} className="w-full text-white">
      <div className="py-6" style={{ backgroundColor: heroPanelBg }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative shrink-0">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden border-4 shadow-xl bg-slate-200 flex items-center justify-center" style={{ borderColor: avatarBorder }}>
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={hero.owner.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-slate-400" />
                )}
              </div>
              <div className="absolute -bottom-2 -left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow flex items-center gap-1" style={{ backgroundColor: ctaBg, borderWidth: 1, borderStyle: 'solid', borderColor: avatarBorder }}>
                <span className="w-2 h-2 rounded-full bg-white/70 animate-pulse" />
                <span>عضو رسمی هیئت علمی</span>
              </div>
            </div>

            <div className="flex-1 min-w-0 text-center md:text-right space-y-2.5">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                {profile?.rank && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border" style={{ backgroundColor: badgeBg, color: '#fff', borderColor: avatarBorder }}>
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>{profile.rank}</span>
                  </span>
                )}
                {profile?.department && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white/10 text-white/90 text-xs font-medium border border-white/10">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{profile.department}</span>
                  </span>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">{hero.owner.name}</h2>
              <p className="text-xs md:text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>{hero.owner.roleTitle}</p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
                <button
                  onClick={handleCopyLink}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/15 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'لینک کپی شد' : 'کپی لینک صفحه'}</span>
                </button>
                <button
                  onClick={() => window.print?.()}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/15 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>نسخه چاپی رزومه</span>
                </button>
                {profile?.scholarUrl && (
                  <a
                    href={profile.scholarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/10 hover:bg-white/20 text-white/90 text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/15 transition flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>پروفایل Google Scholar</span>
                  </a>
                )}
                <button
                  className="text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  style={{ backgroundColor: ctaBg }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = ctaHoverBg; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ctaBg; }}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>ارتباط با استاد</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 shrink-0 w-full max-w-[220px] md:w-auto">
              {stats.map((s, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                  <span className="block text-lg font-black font-mono">{s.value}</span>
                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.75)' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
