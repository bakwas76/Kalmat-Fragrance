import { useEffect, useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { HeroBanner } from '@/types';
import { useToast } from '@/contexts/ToastContext';

const BUCKET = 'hero-images';

export default function AdminHeroSlider() {
  const { toast } = useToast();
  const desktopRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'desktop' | 'mobile' | null>(null);

  const [desktopUrl, setDesktopUrl] = useState<string | null>(null);
  const [mobileUrl, setMobileUrl] = useState<string | null>(null);
  const [overlay, setOverlay] = useState(40);
  const [height, setHeight] = useState(90);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('hero_banner')
        .select('*')
        .limit(1)
        .maybeSingle();
      const b = data as HeroBanner | null;
      if (b) {
        setDesktopUrl(b.desktop_image_url);
        setMobileUrl(b.mobile_image_url);
        setOverlay(b.overlay_opacity);
        setHeight(b.banner_height);
      }
      setLoading(false);
    })();
  }, []);

  const uploadImage = async (file: File, which: 'desktop' | 'mobile') => {
    if (!file.type.startsWith('image/')) {
      toast('Please select an image file', 'error');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast('Image must be under 8MB', 'error');
      return;
    }
    setUploading(which);
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${which}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file, { cacheControl: '3600', upsert: true });
    if (upErr) {
      setUploading(null);
      toast(`Upload failed: ${upErr.message}`, 'error');
      return;
    }
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    setUploading(null);
    if (which === 'desktop') setDesktopUrl(pub.publicUrl);
    else setMobileUrl(pub.publicUrl);
    toast('Image uploaded — remember to Save');
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, which: 'desktop' | 'mobile') => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file, which);
  };

const save = async () => {
  setSaving(true);

  try {
    // Pehle existing hero banner record check karo
    const { data: existing, error: fetchError } = await supabase
      .from('hero_banner')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('FETCH HERO ERROR:', fetchError);
      toast(fetchError.message, 'error');
      return;
    }

    const bannerData = {
      desktop_image_url: desktopUrl,
      mobile_image_url: mobileUrl,
      overlay_opacity: overlay / 100,
      banner_height: `${height}vh`,
      updated_at: new Date().toISOString(),
    };

    let error;

    if (existing?.id) {
      // Existing row update karo
      const result = await supabase
        .from('hero_banner')
        .update(bannerData)
        .eq('id', existing.id);

      error = result.error;
    } else {
      // Agar row nahi hai to new row create karo
      const result = await supabase
        .from('hero_banner')
        .insert(bannerData);

      error = result.error;
    }

    if (error) {
      console.error('SAVE HERO ERROR:', error);
      toast(error.message, 'error');
      return;
    }

    toast('Hero banner saved successfully');
  } catch (err) {
    console.error('SAVE HERO ERROR:', err);

    toast(
      err instanceof Error ? err.message : 'Could not save hero banner',
      'error'
    );
  } finally {
    setSaving(false);
  }
};

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl text-white">Hero Banner</h1>
        <p className="text-ink-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-white">Hero Banner</h1>
        <p className="mt-1 text-sm text-ink-400">
          A single full-width image displayed at the top of the homepage.
        </p>
      </div>

      {/* Desktop image */}
      <div className="border border-ink-800 bg-black-card p-5">
        <label className="label-luxe">Hero Banner Image (Desktop) *</label>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="h-32 w-full shrink-0 overflow-hidden border border-ink-700 bg-black-soft sm:w-56">
            {desktopUrl ? (
              <img src={desktopUrl} alt="Desktop preview" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-ink-600">
                <ImageIcon size={28} />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={desktopRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e, 'desktop')}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => desktopRef.current?.click()}
              disabled={uploading !== null}
              className="btn-outline flex items-center gap-2"
            >
              {uploading === 'desktop' ? (
                'Uploading…'
              ) : (
                <><Upload size={14} /> {desktopUrl ? 'Replace Image' : 'Upload Image'}</>
              )}
            </button>
            {desktopUrl && (
              <button
                type="button"
                onClick={() => {
                  setDesktopUrl(null);
                  if (desktopRef.current) desktopRef.current.value = '';
                }}
                className="flex items-center gap-1 text-xs text-ink-400 hover:text-rose-300"
              >
                <X size={12} /> Remove image
              </button>
            )}
            <p className="text-xs text-ink-500">Recommended: 1920×1080px or larger. Covers the full hero area.</p>
          </div>
        </div>
      </div>

      {/* Mobile image */}
      <div className="border border-ink-800 bg-black-card p-5">
        <label className="label-luxe">Hero Banner Image (Mobile) — Optional</label>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="h-32 w-24 shrink-0 overflow-hidden border border-ink-700 bg-black-soft">
            {mobileUrl ? (
              <img src={mobileUrl} alt="Mobile preview" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-ink-600">
                <ImageIcon size={22} />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={mobileRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e, 'mobile')}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => mobileRef.current?.click()}
              disabled={uploading !== null}
              className="btn-outline flex items-center gap-2"
            >
              {uploading === 'mobile' ? (
                'Uploading…'
              ) : (
                <><Upload size={14} /> {mobileUrl ? 'Replace Image' : 'Upload Image'}</>
              )}
            </button>
            {mobileUrl && (
              <button
                type="button"
                onClick={() => {
                  setMobileUrl(null);
                  if (mobileRef.current) mobileRef.current.value = '';
                }}
                className="flex items-center gap-1 text-xs text-ink-400 hover:text-rose-300"
              >
                <X size={12} /> Remove image
              </button>
            )}
            <p className="text-xs text-ink-500">Portrait crop for mobile. If empty, the desktop image is used.</p>
          </div>
        </div>
      </div>

      {/* Overlay + height */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border border-ink-800 bg-black-card p-5">
          <label className="label-luxe">Overlay Opacity: {overlay}%</label>
          <input
            type="range"
            min={0}
            max={100}
            value={overlay}
            onChange={(e) => setOverlay(Number(e.target.value))}
            className="kx-range mt-4 w-full"
          />
          <p className="mt-2 text-xs text-ink-500">Darkens the image. 0 = no overlay, 100 = fully black.</p>
        </div>

        <div className="border border-ink-800 bg-black-card p-5">
          <label className="label-luxe">Banner Height: {height}%</label>
          <input
            type="range"
            min={40}
            max={100}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="kx-range mt-4 w-full"
          />
          <p className="mt-2 text-xs text-ink-500">Height as a percentage of the screen.</p>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={save} disabled={saving || uploading !== null} className="btn-gold flex items-center gap-2">
          {saving ? 'Saving...' : <><Save size={16} /> Save Banner</>}
        </button>
      </div>
    </div>
  );
}
