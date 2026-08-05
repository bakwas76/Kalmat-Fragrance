import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, ShieldCheck, Sparkles, Gift, Quote, Instagram, Image as ImageIcon } from 'lucide-react';
import HeroSection from '@/components/HeroSection';
import ProductTile from '@/components/ProductTile';
import SectionTitle from '@/components/SectionTitle';
import RatingMeter from '@/components/RatingMeter';
import { supabase } from '@/lib/supabase';
import { BRAND } from '@/lib/constants';
import type { Product, Category, Collection, Review } from '@/types';
import { useReveal } from '@/hooks/useReveal';
import Seo from '@/components/Seo';

const NOTES = [
  { name: 'Top', desc: 'The first impression — bright citrus and spice that opens the composition.', examples: 'Bergamot · Saffron · Pink Pepper' },
  { name: 'Heart', desc: 'The soul of the fragrance — rich florals and resins that define its character.', examples: 'Rose · Oud · Jasmine' },
  { name: 'Base', desc: 'The lasting memory — warm woods, amber, and musk that linger on skin.', examples: 'Sandalwood · Amber · Leather' },
];

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const storyRef = useReveal<HTMLDivElement>();

  useEffect(() => {
    (async () => {
      const [feat, best, fresh, cats, cols, revs] = await Promise.all([
        supabase.from('products').select(`*,product_variants(*)`).eq('featured', true).limit(4),
        supabase.from('products').select('*').eq('best_seller', true).limit(8),
        supabase.from('products').select('*').eq('is_new', true).limit(4),
        supabase.from('categories').select('*').limit(6),
        supabase.from('collections').select('*').limit(3),
        supabase.from('product_reviews').select('*').order('created_at', { ascending: false }).limit(3),
      ]);
      setFeatured((feat.data as Product[]) || []);
      setBestSellers((best.data as Product[]) || []);
      setNewArrivals((fresh.data as Product[]) || []);
      setCategories((cats.data as Category[]) || []);
      setCollections((cols.data as Collection[]) || []);
      setReviews((revs.data as Review[]) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <Seo />
      <HeroSection />

      {/* Trust bar */}
      <section className="border-y border-line bg-ivory-2">
        <div className="kx-container grid grid-cols-2 lg:grid-cols-4">
          {[
            { Icon: Truck, title: 'Complimentary Shipping', desc: 'On orders over Rs 5,000' },
            { Icon: ShieldCheck, title: 'Authentic Guarantee', desc: '100% genuine product' },
            { Icon: Sparkles, title: 'Rare Essences', desc: 'Sourced with intention' },
            { Icon: Gift, title: 'Signature Gift Wrap', desc: 'On every order' },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group flex items-center gap-4 px-6 py-7 transition-colors duration-300 hover:bg-ivory-3 lg:px-8"
            >
              <f.Icon className="h-6 w-6 shrink-0 text-gold transition-transform duration-500 group-hover:scale-110" strokeWidth={1.3} />
              <div>
                <p className="text-[13px] font-medium text-charcoal">{f.title}</p>
                <p className="text-xs font-light text-ink-mute">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Collections — large editorial */}
      {collections.length > 0 && (
        <section className="kx-section">
          <div className="kx-container">
            <SectionTitle eyebrow="Curated Worlds" title="Featured Collections" subtitle="Each a study in restraint and opulence — compositions that transcend the ordinary." />
            <div className="mt-14 grid gap-5 md:grid-cols-3 lg:gap-6">
              {collections.map((col, i) => (
                <motion.div
                  key={col.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link to={`/collections?c=${col.slug}`} className="group block">
                    <div className="kx-img-frame relative aspect-[3/4] border border-line-soft bg-ivory-2">
                      {col.image_url ? (
                        <img src={col.image_url} alt={col.name} className="kx-img-zoom h-full w-full object-cover" />
                      ) : (
                        <div className="kx-img-zoom grid h-full w-full place-items-center" style={{ background: 'linear-gradient(160deg,#F3ECE0,#E6DCCB)' }}>
                          <ImageIcon size={32} className="text-gold/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-7">
                        <p className="text-[9px] uppercase text-gold-light" style={{ letterSpacing: '0.32em' }}>Collection</p>
                        <h3 className="mt-2 font-display text-2xl text-ivory lg:text-3xl">{col.name}</h3>
                        <p className="mt-2 line-clamp-2 text-xs font-light text-ivory/65">{col.description}</p>
                        <span className="mt-5 inline-flex items-center gap-2 text-[10px] uppercase text-gold-light transition-all duration-300 group-hover:gap-4" style={{ letterSpacing: '0.28em' }}>
                          Discover <ArrowRight size={13} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers */}
      <section className="kx-section bg-ivory-2">
        <div className="kx-container">
          <div className="flex items-end justify-between">
            <SectionTitle eyebrow="Loved by Many" title="Best Sellers" align="left" />
            <Link to="/shop?sort=best" className="kx-arrow-link hidden sm:inline-flex">View All <ArrowRight size={14} /></Link>
          </div>
          {loading ? (
            <div className="mt-14 grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4 lg:gap-7">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse bg-ivory-3" />)}
            </div>
          ) : (
            <div className="mt-14 grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4 lg:gap-7">
              {bestSellers.slice(0, 4).map((p, i) => <ProductTile key={p.id} product={p} index={i} />)}
            </div>
          )}
          <div className="mt-12 text-center sm:hidden">
            <Link to="/shop?sort=best" className="kx-arrow-link">View All <ArrowRight size={14} /></Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="kx-section">
          <div className="kx-container">
            <SectionTitle eyebrow="Find Your Signature" title="Shop by Category" subtitle="From radiant florals to deep, smoky woods — find the family that speaks to you." />
            <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  <Link to={`/shop?category=${cat.slug}`} className="group flex flex-col items-center gap-4 py-6 text-center">
                    <div className="kx-img-frame h-20 w-20 rounded-full border border-line bg-ivory-2">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} className="kx-img-zoom h-full w-full rounded-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center rounded-full" style={{ background: 'var(--ivory-3)' }}>
                          <ImageIcon size={22} className="text-gold/30" />
                        </div>
                      )}
                    </div>
                    <p className="font-display text-base text-charcoal transition-colors duration-300 group-hover:text-gold-deep">{cat.name}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      <section className="kx-section bg-charcoal">
        <div className="kx-container">
          <div className="flex items-end justify-between">
            <SectionTitle eyebrow="Just Arrived" title="New Arrivals" align="left" tone="light" />
            <Link to="/shop?sort=new" className="kx-arrow-link hidden text-gold-light sm:inline-flex">View All <ArrowRight size={14} /></Link>
          </div>
          {loading ? (
            <div className="mt-14 grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4 lg:gap-7">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse bg-charcoal-2" />)}
            </div>
          ) : (
            <div className="mt-14 grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4 lg:gap-7">
              {(newArrivals.length > 0 ? newArrivals : featured.slice(0, 4)).map((p, i) => <ProductTile key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      </section>

      {/* Brand Story — editorial split */}
      <section className="kx-section">
        <div ref={storyRef} className="reveal-hidden kx-container">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="kx-eyebrow">Our Heritage</p>
              <h2 className="mt-5 font-display text-4xl font-light leading-[1.05] text-charcoal sm:text-5xl lg:text-6xl">The Art of Luxury Perfumery</h2>
              <div className="kx-gold-line mt-6" />
              <p className="mt-8 text-base font-light leading-[1.8] text-ink-soft">
                Born from a passion for rare essences and the ancient craft of perfumery, Kalmat Fragrance creates compositions that transcend the ordinary. Each scent is a journey — from sun-drenched fields to the hands of those who appreciate true artistry.
              </p>
              <p className="mt-5 text-base font-light leading-[1.8] text-ink-soft">
                We believe a fragrance should not merely smell beautiful; it should tell a story, evoke a memory, and become an inseparable part of who you are.
              </p>
              <Link to="/about" className="mt-10 kx-btn-solid">Discover Our Story <ArrowRight size={14} /></Link>
            </div>
            <div className="relative">
              <div className="absolute -inset-6 bg-gold/5 blur-3xl" />
              <div className="kx-img-frame relative aspect-[4/5] border border-line">
                <div className="grid h-full w-full place-items-center" style={{ background: 'linear-gradient(160deg,#F3ECE0,#E6DCCB)' }}>
                  <div className="text-center">
                    <span className="font-display text-7xl italic text-gold/25">K</span>
                    <p className="mt-3 text-[10px] uppercase text-gold/40" style={{ letterSpacing: '0.4em' }}>The Atelier</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-5 grid h-24 w-24 place-items-center border border-gold/30 bg-ivory shadow-elevate">
                <span className="font-display text-4xl italic text-gold">K</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Perfume Notes */}
      <section className="kx-section bg-ivory-2">
        <div className="kx-container">
          <SectionTitle eyebrow="The Architecture of Scent" title="Understanding Perfume Notes" subtitle="Every great fragrance unfolds in three movements. Discover the structure behind the art." />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {NOTES.map((note, i) => (
              <motion.div
                key={note.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="group border border-line bg-white p-10 text-center transition-all duration-500 hover:border-gold/40 hover:shadow-elevate"
              >
                <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full border border-gold/30 transition-all duration-500 group-hover:border-gold/60">
                  <span className="font-display text-xl italic text-gold">{i + 1}</span>
                </div>
                <h3 className="font-display text-2xl text-charcoal">{note.name} Notes</h3>
                <div className="kx-gold-line mx-auto mt-4" />
                <p className="mt-5 text-sm font-light leading-relaxed text-ink-soft">{note.desc}</p>
                <p className="mt-5 text-[10px] uppercase text-gold-deep" style={{ letterSpacing: '0.24em' }}>{note.examples}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      {reviews.length > 0 && (
        <section className="kx-section">
          <div className="kx-container">
            <SectionTitle eyebrow="What They Say" title="Words From Our Connoisseurs" />
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {reviews.map((rev, i) => (
                <motion.div
                  key={rev.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="group relative border border-line bg-white p-9 transition-all duration-500 hover:border-gold/30 hover:shadow-elevate"
                >
                  <Quote className="absolute right-7 top-7 h-8 w-8 text-gold/10 transition-colors duration-500 group-hover:text-gold/20" />
                  <RatingMeter rating={rev.rating} size={15} />
                  {rev.title && <h3 className="mt-4 font-display text-xl text-charcoal">{rev.title}</h3>}
                  <p className="mt-3 text-sm font-light leading-relaxed text-ink-soft">"{rev.comment}"</p>
                  <div className="mt-7 flex items-center gap-3 border-t border-line-soft pt-5">
                    <div className="grid h-10 w-10 place-items-center rounded-full border border-gold/25 bg-gold/5 font-display italic text-gold transition-all duration-500 group-hover:border-gold/50">
                      {rev.author_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-charcoal">{rev.author_name}</p>
                      <p className="text-[11px] text-ink-mute">Verified Buyer</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Instagram Gallery */}
      <section className="kx-section bg-ivory-2">
        <div className="kx-container">
          <SectionTitle eyebrow="@kalmatfragrance" title="Follow Our World" subtitle="A glimpse into the Kalmat atelier — bottles, notes, and the craft behind each composition." />
          <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.a
                key={i}
                href={BRAND.instagram}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group kx-img-frame relative aspect-square border border-line bg-ivory-2"
              >
                <div className="grid h-full w-full place-items-center" style={{ background: 'linear-gradient(160deg,#F3ECE0,#E6DCCB)' }}>
                  <ImageIcon size={28} className="text-gold/20" />
                </div>
                <div className="absolute inset-0 grid place-items-center bg-charcoal/0 transition-colors duration-500 group-hover:bg-charcoal/40">
                  <Instagram className="h-7 w-7 text-gold-light opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Fragrances */}
      {featured.length > 0 && (
        <section className="kx-section">
          <div className="kx-container">
            <div className="flex items-end justify-between">
              <SectionTitle eyebrow="Signature Pieces" title="Featured Fragrances" align="left" />
              <Link to="/shop" className="kx-arrow-link hidden sm:inline-flex">Shop All <ArrowRight size={14} /></Link>
            </div>
            <div className="mt-14 grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4 lg:gap-7">
              {featured.map((p, i) => <ProductTile key={p.id} product={p} index={i} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
