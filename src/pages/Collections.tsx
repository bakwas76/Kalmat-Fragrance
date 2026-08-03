import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Collection, Product } from '@/types';
import ProductTile from '@/components/ProductTile';
import SectionTitle from '@/components/SectionTitle';
import Seo from '@/components/Seo';

export default function Collections() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSlug = searchParams.get('c') || '';
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('collections').select('*').order('created_at');
      setCollections((data as Collection[]) || []);
    })();
  }, []);

  useEffect(() => {
    setLoading(true);
    (async () => {
      let query = supabase.from('products').select('*');
      if (activeSlug) {
        const col = collections.find((c) => c.slug === activeSlug);
        if (col) query = query.eq('collection_id', col.id);
      }
      const { data } = await query.order('featured', { ascending: false });
      setProducts((data as Product[]) || []);
      setLoading(false);
    })();
  }, [activeSlug, collections]);

  const active = collections.find((c) => c.slug === activeSlug);

  return (
    <>
      <Seo title="Collections" description="Explore curated collections of luxury fragrances from Kalmat." />

      {/* Hero — full bleed under transparent header */}
      <section className="relative min-h-[56vh] overflow-hidden bg-charcoal">
        <div className="absolute inset-0 kx-grain-dark opacity-40" />
        <div className="absolute left-1/2 top-1/2 h-[50vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/8 blur-[120px]" />
        <div className="kx-container relative flex min-h-[56vh] flex-col items-center justify-center pt-20 text-center">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-[10px] uppercase text-gold-light" style={{ letterSpacing: '0.5em' }}>Curated Worlds</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} className="mt-5 font-display text-5xl font-light text-ivory sm:text-6xl lg:text-7xl">Our Collections</motion.h1>
          <div className="kx-center-rule mt-7"><span className="text-gold-light/60">✦</span></div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }} className="mx-auto mt-6 max-w-xl text-sm font-light leading-relaxed text-ivory/60">Each collection tells a story — explore worlds composed from royal oud to golden bloom.</motion.p>
        </div>
      </section>

      {/* Editorial collection cards */}
      {collections.length > 0 && (
        <section className="kx-container py-16 lg:py-24">
          <div className="grid gap-5 md:grid-cols-2 lg:gap-6">
            {collections.map((col, i) => {
              const isActive = activeSlug === col.slug;
              return (
                <motion.button
                  key={col.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => setSearchParams(isActive ? new URLSearchParams() : new URLSearchParams({ c: col.slug }))}
                  className={`group relative aspect-[16/10] overflow-hidden border text-left transition-all duration-500 ${isActive ? 'border-gold shadow-elevate' : 'border-line hover:border-gold/40 hover:shadow-elevate'}`}
                >
                  <div className="kx-img-frame absolute inset-0">
                    {col.image_url ? (
                      <img src={col.image_url} alt={col.name} className="kx-img-zoom h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center" style={{ background: 'linear-gradient(160deg,#F3ECE0,#E6DCCB)' }}>
                        <ImageIcon size={36} className="text-gold/25" />
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/25 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-10">
                    <p className="text-[9px] uppercase text-gold-light" style={{ letterSpacing: '0.32em' }}>Collection</p>
                    <h3 className="mt-2 font-display text-3xl text-ivory lg:text-4xl">{col.name}</h3>
                    <p className="mt-3 line-clamp-2 max-w-md text-sm font-light text-ivory/65">{col.description}</p>
                    <span className={`mt-5 inline-flex items-center gap-2 text-[10px] uppercase text-gold-light transition-all duration-300 group-hover:gap-4 ${isActive ? 'gap-4' : ''}`} style={{ letterSpacing: '0.28em' }}>
                      {isActive ? 'Now Viewing' : 'View Collection'} <ArrowRight size={13} />
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>
      )}

      {/* Active collection products */}
      {activeSlug && (
        <section className="bg-ivory-2 py-16 lg:py-24">
          <div className="kx-container">
            <SectionTitle eyebrow={active?.name || 'Collection'} title={active?.name || 'Collection'} subtitle={active?.description || undefined} />
            {loading ? (
              <div className="mt-12 grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4 lg:gap-9">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse bg-ivory-3" />)}
              </div>
            ) : products.length === 0 ? (
              <div className="mt-12 py-16 text-center">
                <p className="font-display text-2xl text-charcoal">No fragrances in this collection yet</p>
                <Link to="/shop" className="kx-btn-ghost mt-6">Browse All Fragrances</Link>
              </div>
            ) : (
              <div className="mt-12 grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4 lg:gap-7">
                {products.map((p, i) => <ProductTile key={p.id} product={p} index={i} />)}
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
