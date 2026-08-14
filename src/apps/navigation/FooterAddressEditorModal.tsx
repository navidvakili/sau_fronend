import React, { useState } from 'react';
import { X, Check, MapPin, Building2, Phone, Printer } from 'lucide-react';
import { NavigationItem } from './types';

interface FooterAddressEditorModalProps {
  item: NavigationItem;
  onSave: (updatedItem: NavigationItem) => void;
  onClose: () => void;
}

export const FooterAddressEditorModal: React.FC<FooterAddressEditorModalProps> = ({
  item,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState(item.title);
  const [address, setAddress] = useState(item.settings.address || '');
  const [phone, setPhone] = useState(item.settings.phone || '');
  const [fax, setFax] = useState(item.settings.fax || '');
  const [mapText, setMapText] = useState(item.settings.mapButton?.text || 'نمایش روی نقشه');
  const [mapIcon, setMapIcon] = useState(item.settings.mapButton?.icon || 'MapPin');
  const [mapUrl, setMapUrl] = useState(item.settings.mapButton?.url || '/campus-map');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSave({
      ...item,
      title,
      settings: {
        ...item.settings,
        footerItemType: 'address',
        address,
        phone,
        fax,
        mapButton: {
          text: mapText,
          icon: mapIcon,
          action: 'show_map',
          url: mapUrl,
        },
      },
    });
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans text-right"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                ویرایش آدرس دانشکده
              </h3>
              <p className="text-xs text-slate-500">
                عنوان، آدرس، تلفن، فکس و لینک نمایش روی نقشه
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              نام دانشکده *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              آدرس پستی
            </label>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                تلفن
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(035) 38264080-9"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs dir-ltr text-left"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                فکس
              </label>
              <input
                type="text"
                value={fax}
                onChange={e => setFax(e.target.value)}
                placeholder="(035) 38264090"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs dir-ltr text-left"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-3">
            <h4 className="font-extrabold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              دکمه نمایش روی نقشه
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  متن دکمه
                </label>
                <input
                  type="text"
                  value={mapText}
                  onChange={e => setMapText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام آیکون (Lucide)
                </label>
                <input
                  type="text"
                  value={mapIcon}
                  onChange={e => setMapIcon(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                لینک نقشه (URL) *
              </label>
              <input
                type="text"
                required
                value={mapUrl}
                onChange={e => setMapUrl(e.target.value)}
                placeholder="/campus-map?faculty=engineering"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono dir-ltr text-left"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              ذخیره آدرس دانشکده
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
