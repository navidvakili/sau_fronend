// ============================================================
// InteractiveMapBlock — نقشه تعاملی: سوئیچ بین چند embed آماده.
// از WidgetRenderer.tsx استخراج شد.
// ============================================================

import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import type { WidgetInstance } from '../../builderTypes';
import { buildOsmEmbedUrl } from './StaticBlocks';

export const InteractiveMapBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const [active, setActive] = useState(0);
  const locations: { id: string; label: string; latitude?: number; longitude?: number; embedUrl?: string; address?: string }[] =
    widget.settings.customProps?.locations || [];

  if (locations.length === 0) {
    return (
      <div style={containerStyle} className="p-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 text-center text-xs text-slate-400">
        هنوز هیچ مکانی برای این نقشه تعریف نشده است.
      </div>
    );
  }

  const activeLoc = locations[Math.min(active, locations.length - 1)];
  const activeEmbedUrl =
    activeLoc && typeof activeLoc.latitude === 'number' && typeof activeLoc.longitude === 'number'
      ? buildOsmEmbedUrl(activeLoc.latitude, activeLoc.longitude)
      : activeLoc?.embedUrl;

  return (
    <div style={containerStyle} className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {locations.map((loc, i) => (
          <button
            key={loc.id}
            type="button"
            onClick={() => setActive(i)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              i === active ? 'bg-slate-900 text-amber-400 shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <MapPin className={`w-3.5 h-3.5 ${i === active ? 'text-amber-400' : 'text-slate-400'}`} />
            {loc.label}
          </button>
        ))}
      </div>
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-800 bg-slate-900 h-[360px]">
        {activeEmbedUrl && (
          <iframe
            title={activeLoc.label}
            src={activeEmbedUrl}
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
        {activeLoc?.address && (
          <div className="absolute bottom-3 right-3 max-w-sm bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl px-3 py-2 shadow-lg border border-gray-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            {activeLoc.address}
          </div>
        )}
      </div>
    </div>
  );
};
