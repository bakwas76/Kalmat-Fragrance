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
    (async () => {
      const { data } = await supabase
        .from('hero_banner')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      setBanner((data as HeroBanner) || null);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="h-[90vh] min-h-[560px] bg-charcoal" />;
  }

  const desktop = banner?.desktop_image_url ?? null;
  const mobile = banner?.mobile_image_url ?? desktop;
  const overlay = banner?.overlay_opacity ?? 45;
  const height = banner?.banner_height ?? 90;
  const hasImage = !!desktop;

  return (
    <section
      className="relative overflow-hidden bg-charcoal"
      style={{ height: `${height}vh`, minHeight: '560px' }}
    >
      {/* Background banner image — absolutely positioned behind all content */}
      {hasImage && (
        <picture className="absolute inset-0 z-0 block h-full w-full">
          {banner!.mobile_image_url && (
            <source media="(max-width: 768px)" srcSet={mobile} />
          )}
          <img
            src={desktop}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
        </picture>
      )}

      {/* Dark overlay — sits above the image, below the text */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: `linear-gradient(to bottom, rgba(0,0,0,${(overlay / 100) * 0.45}) 0%, rgba(0,0,0,${(overlay / 100) * 0.6}) 50%, rgba(0,0,0,${(overlay / 100) * 0.75}) 100%)`,
        }}
      />

      {/* Hero content — heading, description, Discover button */}
      <div className="relative z-10 flex h-full items-center justify-center">
        <div className="kx-container py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <p className="text-[10px] font-medium uppercase text-gold-light" style={{ letterSpacing: '0.5em' }}>
              The Maison
            </p>
            <h1 className="mt-5 max-w-4xl font-display text-5xl font-light leading-[1.02] text-ivory drop-shadow-lg sm:text-6xl lg:text-7xl xl:text-8xl">
              Where Scent Becomes Story
            </h1>
            <div className="kx-gold-line mt-7" />
            <p className="mt-7 max-w-xl text-base font-light leading-relaxed text-ivory/85 drop-shadow-md sm:text-lg lg:text-xl">
              Handcrafted compositions distilled from the rarest essences on earth — each fragrance a journey, a memory, a signature.
            </p>
            <Link
              to="/shop"
              className="mt-9 inline-flex items-center gap-3 border-b border-gold pb-1.5 text-[11px] font-medium uppercase text-gold-light transition-all duration-300 hover:gap-5"
              style={{ letterSpacing: '0.32em' }}
            >
              Discover the Collection <ArrowRight size={15} />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
