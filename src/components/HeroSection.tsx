import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { HeroBanner } from '@/types';

export default function HeroSection() {
  const [banner, setBanner] = useState<HeroBanner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBanner = async () => {
      const { data, error } = await supabase
        .from('hero_banner')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('HERO BANNER:', data);
      console.log('HERO ERROR:', error);

      setBanner((data as HeroBanner) || null);
      setLoading(false);
    };

    loadBanner();
  }, []);

  if (loading) {
    return (
      <section className="relative min-h-[560px] bg-charcoal">
        <div className="flex h-full min-h-[560px] items-center justify-center">
          <div className="h-8 w-8 animate-pulse rounded-full bg-gold/30" />
        </div>
      </section>
    );
  }

  const desktop = banner?.desktop_image_url || banner?.image_url || null;
  const mobile = banner?.mobile_image_url || desktop;

  const overlayOpacity = Number(banner?.overlay_opacity ?? 0.4);

  const rawHeight = String(banner?.banner_height ?? '90vh');

  const height = rawHeight.endsWith('vh')
    ? rawHeight
    : `${rawHeight}vh`;

  const hasImage = Boolean(desktop);

  return (
    <section
      className="relative overflow-hidden bg-charcoal"
      style={{
        height,
        minHeight: '560px',
      }}
    >
      {/* Desktop image */}
      {desktop && (
        <img
          src={desktop}
          alt={banner?.title || 'Kalmat Fragrance'}
          className="absolute inset-0 z-0 hidden h-full w-full object-cover md:block"
        />
      )}

      {/* Mobile image */}
      {mobile && (
        <img
          src={mobile}
          alt={banner?.title || 'Kalmat Fragrance'}
          className="absolute inset-0 z-0 h-full w-full object-cover md:hidden"
        />
      )}

      {/* Fallback background */}
      {!hasImage && (
        <div className="absolute inset-0 z-0 bg-charcoal" />
      )}

      {/* Dark overlay */}
      {hasImage && (
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background: `rgba(0,0,0,${Math.min(
              Math.max(overlayOpacity, 0),
              1
            )})`,
          }}
        />
      )}

      {/* Hero content */}
      <div className="relative z-10 flex h-full items-center justify-center">
        <div className="kx-container py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="flex flex-col items-center"
          >
            <p
              className="text-[10px] font-medium uppercase text-gold-light"
              style={{ letterSpacing: '0.5em' }}
            >
              {banner?.subtitle || 'The Maison'}
            </p>

            <h1 className="mt-5 max-w-4xl font-display text-5xl font-light leading-[1.02] text-ivory drop-shadow-lg sm:text-6xl lg:text-7xl xl:text-8xl">
              {banner?.title || 'Where Scent Becomes Story'}
            </h1>

            <div className="kx-gold-line mt-7" />

            <p className="mt-7 max-w-xl text-base font-light leading-relaxed text-ivory/85 drop-shadow-md sm:text-lg lg:text-xl">
              Handcrafted compositions distilled from the rarest essences on earth — each fragrance a journey, a memory, a signature.
            </p>

            <Link
              to={banner?.button_link || '/shop'}
              className="mt-9 inline-flex items-center gap-3 border-b border-gold pb-1.5 text-[11px] font-medium uppercase text-gold-light transition-all duration-300 hover:gap-5"
              style={{ letterSpacing: '0.32em' }}
            >
              {banner?.button_text || 'Discover the Collection'}
              <ArrowRight size={15} />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
