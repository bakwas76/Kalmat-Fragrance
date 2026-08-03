import { useEffect, useState, useCallback } from 'react';
import { Megaphone, Save, RotateCcw, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import BannerView from '@/components/BannerView';
import { useToast } from '@/contexts/ToastContext';
import type {
  AnnouncementBanner,
  BannerAnimation,
  BannerSpeed,
  BannerFontWeight,
  BannerTextAlign,
} from '@/types';

const ANIMATIONS: { value: BannerAnimation; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'marquee', label: 'Marquee (Scrolling)' },
  { value: 'fade', label: 'Fade' },
  { value: 'slide-left', label: 'Slide Left' },
  { value: 'slide-right', label: 'Slide Right' },
  { value: 'slide-up', label: 'Slide Up' },
  { value: 'slide-down', label: 'Slide Down' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'pulse', label: 'Pulse' },
];

const SPEEDS: { value: BannerSpeed; label: string }[] = [
  { value: 'slow', label: 'Slow' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Fast' },
];

const WEIGHTS: { value: BannerFontWeight; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'medium', label: 'Medium' },
  { value: 'bold', label: 'Bold' },
];

const ALIGNS: { value: BannerTextAlign; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

const EMPTY: AnnouncementBanner = {
  id: 1,
  enabled: false,
  text: '',
  bg_color: '#080808',
  text_color: '#C9A227',
  font_size: 13,
  font_weight: 'normal',
  height: 40,
  padding: 16,
  animation: 'none',
  speed: 'normal',
  text_align: 'center',
  updated_at: '',
};

export default function AdminAnnouncementBanner() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AnnouncementBanner>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('announcement_banner')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (error) {
      toast(error.message, 'error');
    }
    setSettings((data as AnnouncementBanner) || EMPTY);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const update = <K extends keyof AnnouncementBanner>(
    key: K,
    value: AnnouncementBanner[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    const payload = { ...settings, id: 1 };
    delete (payload as Partial<AnnouncementBanner>).updated_at;
    const { error } = await supabase
      .from('announcement_banner')
      .upsert(payload)
      .eq('id', 1);
    setSaving(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast('Announcement banner saved');
    load();
  };

  const reset = () => {
    setSettings((prev) => ({ ...EMPTY, enabled: prev.enabled }));
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="min-w-0">
        <h1 className="flex flex-wrap items-center gap-2 font-serif text-2xl text-white sm:gap-3 sm:text-3xl">
          <Megaphone size={24} className="shrink-0 text-gold sm:size-[26px]" /> Announcement Banner
        </h1>
        <p className="mt-1 break-words text-sm text-ink-400">
          Control the top announcement banner shown across the storefront.
        </p>
      </div>

      {loading ? (
        <p className="text-ink-500">Loading...</p>
      ) : (
        <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
          {/* SETTINGS */}
          <div className="min-w-0 space-y-5 sm:space-y-6">
            <section className="card-luxe overflow-hidden p-4 sm:p-6">
              <h2 className="mb-4 font-serif text-lg text-white sm:text-xl">General</h2>

              <div className="flex items-center justify-between gap-3 border border-ink-800 bg-black-soft p-3 sm:p-4">
                <div className="min-w-0">
                  <p className="break-words text-sm text-white">Enable Banner</p>
                  <p className="break-words text-xs text-ink-500">Show the announcement banner on the website</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.enabled}
                  onClick={() => update('enabled', !settings.enabled)}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors sm:h-6 sm:w-11 ${
                    settings.enabled ? 'bg-gold' : 'bg-ink-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform sm:h-5 sm:w-5 ${
                      settings.enabled ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="mt-4">
                <label className="label-luxe">Banner Text</label>
                <textarea
                  value={settings.text}
                  onChange={(e) => update('text', e.target.value)}
                  rows={3}
                  className="input-luxe resize-none break-words"
                  placeholder="Your announcement message..."
                />
              </div>
            </section>

            <section className="card-luxe overflow-hidden p-4 sm:p-6">
              <h2 className="mb-4 font-serif text-lg text-white sm:text-xl">Appearance</h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label className="label-luxe">Background Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.bg_color}
                      onChange={(e) => update('bg_color', e.target.value)}
                      className="h-12 w-14 shrink-0 cursor-pointer border border-ink-700 bg-transparent sm:h-10 sm:w-12"
                    />
                    <input
                      type="text"
                      value={settings.bg_color}
                      onChange={(e) => update('bg_color', e.target.value)}
                      className="input-luxe min-w-0"
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <label className="label-luxe">Text Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.text_color}
                      onChange={(e) => update('text_color', e.target.value)}
                      className="h-12 w-14 shrink-0 cursor-pointer border border-ink-700 bg-transparent sm:h-10 sm:w-12"
                    />
                    <input
                      type="text"
                      value={settings.text_color}
                      onChange={(e) => update('text_color', e.target.value)}
                      className="input-luxe min-w-0"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="label-luxe">
                  Font Size <span className="text-gold">{settings.font_size}px</span>
                </label>
                <input
                  type="range"
                  min={8}
                  max={28}
                  value={settings.font_size}
                  onChange={(e) => update('font_size', Number(e.target.value))}
                  className="kx-range w-full"
                />
              </div>

              <div className="mt-4">
                <label className="label-luxe">Font Weight</label>
                <div className="grid grid-cols-3 gap-2 sm:flex">
                  {WEIGHTS.map((w) => (
                    <button
                      key={w.value}
                      type="button"
                      onClick={() => update('font_weight', w.value)}
                      className={`min-h-[44px] border px-3 py-2.5 text-xs uppercase tracking-wide-sm transition-colors sm:flex-1 ${
                        settings.font_weight === w.value
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-ink-700 text-ink-300 hover:border-ink-500'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <label className="label-luxe">Banner Height (px)</label>
                  <input
                    type="number"
                    min={24}
                    max={120}
                    value={settings.height}
                    onChange={(e) => update('height', Number(e.target.value))}
                    className="input-luxe"
                  />
                </div>
                <div className="min-w-0">
                  <label className="label-luxe">Padding (px)</label>
                  <input
                    type="number"
                    min={0}
                    max={80}
                    value={settings.padding}
                    onChange={(e) => update('padding', Number(e.target.value))}
                    className="input-luxe"
                  />
                </div>
              </div>
            </section>

            <section className="card-luxe overflow-hidden p-4 sm:p-6">
              <h2 className="mb-4 font-serif text-lg text-white sm:text-xl">Animation</h2>

              <div>
                <label className="label-luxe">Animation Type</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ANIMATIONS.map((a) => (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => update('animation', a.value)}
                      className={`min-h-[44px] border px-2 py-2.5 text-xs transition-colors ${
                        settings.animation === a.value
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-ink-700 text-ink-300 hover:border-ink-500'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="label-luxe">Speed</label>
                <div className="grid grid-cols-3 gap-2 sm:flex">
                  {SPEEDS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => update('speed', s.value)}
                      className={`min-h-[44px] border px-3 py-2.5 text-xs uppercase tracking-wide-sm transition-colors sm:flex-1 ${
                        settings.speed === s.value
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-ink-700 text-ink-300 hover:border-ink-500'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="label-luxe">Text Alignment</label>
                <div className="grid grid-cols-3 gap-2 sm:flex">
                  {ALIGNS.map((a) => (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => update('text_align', a.value)}
                      className={`min-h-[44px] border px-3 py-2.5 text-xs uppercase tracking-wide-sm transition-colors sm:flex-1 ${
                        settings.text_align === a.value
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-ink-700 text-ink-300 hover:border-ink-500'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={save} disabled={saving} className="btn-gold min-h-[48px] w-full sm:flex-1">
                <Save size={14} /> {saving ? 'Saving...' : 'Save Banner'}
              </button>
              <button onClick={reset} className="btn-outline min-h-[48px] w-full sm:w-auto">
                <RotateCcw size={14} /> Reset Form
              </button>
            </div>
          </div>

          {/* PREVIEW */}
          <div className="min-w-0 space-y-5 sm:space-y-6 lg:sticky lg:top-24 lg:self-start">
            <section className="card-luxe overflow-hidden p-4 sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 font-serif text-lg text-white sm:text-xl">
                <Eye size={18} className="shrink-0 text-gold" /> Live Preview
              </h2>
              <p className="mb-4 break-words text-xs text-ink-500">
                This is how the banner will appear on the storefront.
              </p>

              <div className="w-full overflow-hidden border border-ink-800 bg-black">
                <BannerView
                  settings={settings}
                  placeholder="Your announcement text here"
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-ink-400">
                <div className="min-w-0 overflow-hidden border border-ink-800 bg-black-soft p-3">
                  <p className="break-words text-ink-500">Status</p>
                  <p className={`break-words ${settings.enabled ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {settings.enabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <div className="min-w-0 overflow-hidden border border-ink-800 bg-black-soft p-3">
                  <p className="break-words text-ink-500">Animation</p>
                  <p className="break-words text-white">
                    {ANIMATIONS.find((a) => a.value === settings.animation)?.label}
                  </p>
                </div>
              </div>

            </section>
          </div>
        </div>
      )}
    </div>
  );
}
