import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import BannerView from './BannerView';
import type { AnnouncementBanner as BannerSettings } from '@/types';

const FALLBACK: BannerSettings = {
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

export default function AnnouncementBanner() {
  const [settings, setSettings] = useState<BannerSettings | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase
        .from('announcement_banner')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (mounted) setSettings((data as BannerSettings) || null);
    };
    load();

    const channel = supabase
      .channel('announcement_banner_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcement_banner' },
        () => load(),
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // if (!settings || !settings.enabled || !settings.text.trim()) return null;

  console.log("Banner Data:", settings);

if (!settings) {
  return (
    <div style={{background:"red",color:"white",padding:"10px"}}>
      Banner not loading
    </div>
  );
}

return <BannerView settings={settings} />;

  

  return <BannerView settings={settings} />;
}

export { FALLBACK };



