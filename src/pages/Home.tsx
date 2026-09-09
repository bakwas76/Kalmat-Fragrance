import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, ShieldCheck, Sparkles, Gift, Quote, Instagram, Image as ImageIcon, Check } from 'lucide-react';
import HeroSection from '@/components/HeroSection';
import ProductTile from '@/components/ProductTile';
import SectionTitle from '@/components/SectionTitle';
import RatingMeter from '@/components/RatingMeter';
import FaqSection from '@/components/FaqSection';
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

const AUDIENCE_POINTS = [
  'Perfume lovers looking for an authentic, handcrafted oud, rose, or amber fragrance',
  'Shoppers in Pakistan who want genuine luxury perfume delivered to their door',
  'Gift buyers looking for an elegant, long-lasting signature scent',
];

const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: BRAND.name,
  url: 'https://www.kalmatfragrance.store/',
  logo: 'https://www.kalmatfragrance.store/logo_1.png',
  email: BRAND.email,
  telephone: BRAND.phone,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Karachi',
    addressRegion: 'Sindh',
    addressCountry: 'PK',
  },
  sameAs: [BRAND.instagram, BRAND.facebook, BRAND.twitter].filter(
    (url) => url && !url.match(/^https?:\/\/(www\.)?(instagram|facebook|twitter|x)\.com\/?$/),
  ),
};

const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Kalmat Fragrance — The Art of Luxury Perfumery',
  description:
    'Handcrafted luxury perfumes with rare oud, rose, and amber. Shop authentic fragrance collections online in Pakistan.',
  url: 'https://www.kalmatfragrance.store/',
  isPartOf: {
    '@type': 'WebSite',
    name: BRAND.name,
    url: 'https://www.kalmatfragrance.store/',
  },
  about: {
    '@type': 'Organization',
    name: BRAND.name,
  },
};

const BREADCRUMB_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://www.kalmatfragrance.store/',
    },
  ],
};

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewers, setReviewers] = useState<
  Record<string, { full_name: string; avatar_url: string | null }>
>({});
  const [loading, setLoading] = useState(true);

  const storyRef = useReveal<HTMLDivElement>();

  useEffect(() => {
    (async () => {
      const [feat, best, fresh, cats, cols, revs] = await Promise.all([
        supabase.from('products').select(`*,variants:product_variants(*)`).eq('featured', true).limit(4),
        supabase.from('products').select(`*,variants:product_variants(*)`).eq('best_seller', true).limit(8),
        supabase.from('products').select(`*,variants:product_variants(*)`).eq('is_new', true).limit(4),
        supabase.from('categories').select('*').limit(6),
        supabase.from('collections').select('*').limit(3),
        supabase.from('product_reviews').select('*').order('created_at', { ascending: false }).limit(3),
      ]);
      setFeatured((feat.data as any) || []);
      setBestSellers((best.data as any) || []);
      setNewArrivals((fresh.data as any) || []);
      setCategories((cats.data as Category[]) || []);
      setCollections((cols.data as Collection[]) || []);
      const reviewList = (revs.data as Review[]) || [];
setReviews(reviewList);

const userIds = reviewList
  .map((rev) => rev.user_id)
  .filter(Boolean);

if (userIds.length > 0) {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds);

  const map: Record<
  string,
  { full_name: string; avatar_url: string | null }
> = {};

  (profiles || []).forEach((profile) => {
  map[profile.id] = {
    full_name: profile.full_name || '',
    avatar_url: profile.avatar_url || null,
  };
});

  setReviewers(map);
}

setLoading(false);
    })();
  }, []);

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <Seo />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_SCHEMA) }} />
      <HeroSection />

      {/* Quick summary — who this is for (helps AI/answer engines extract a direct answer) */}
      <section className="kx-section pb-0">
        <div className="kx-container">
          <p className="max-w-3xl text-base font-light leading-[1.8] text-ink-soft">
            <strong className="font-medium text-charcoal">In short:</strong> Kalmat Fragrance is a Pakistan-based
            perfume house that handcrafts luxury fragrances using rare oud, rose, and amber essences — sold online
            with nationwide delivery.
          </p>

          <p className="mt-6 max-w-3xl text-sm font-light leading-relaxed text-ink-soft">
            <strong className="font-medium text-charcoal">This page is for:</strong> anyone in Pakistan who wants to
            buy an authentic, handcrafted oud, rose, or amber perfume online — whether for personal daily wear,
            a special occasion, or as a gift.
          </p>
          <ul className="mt-3 max-w-2xl space-y-2">
            {AUDIENCE_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm font-light leading-relaxed text-ink-soft">
                <Check size={15} className="mt-0.5 shrink-0 text-gold" />
                {point}
              </li>
            ))}
          </ul>

          <div className="mt-10 grid gap-10 border-t border-line-soft pt-10 md:grid-cols-2">
            <div>
              <p className="text-sm font-light uppercase tracking-wide-sm text-gold-deep">How ordering works</p>
              <ol className="mt-3 space-y-2">
                {[
                  'Browse fragrances by family — oud, rose, or amber — and pick your signature scent.',
                  'Place your order online with cash on delivery or card payment.',
                  'We handcraft, gift-wrap, and dispatch your order with a trackable courier link.',
                  'Not satisfied? Return it within 7 days, no questions asked.',
                ].map((step, i) => (
                  <li key={step} className="flex items-start gap-3 text-sm font-light leading-relaxed text-ink-soft">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-gold/40 text-[11px] text-gold-deep">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="text-sm font-light uppercase tracking-wide-sm text-gold-deep">Why shoppers trust us</p>
              <ul className="mt-3 space-y-2">
                {[
                  '100% authentic guarantee on every bottle we sell.',
                  'Real, verified-buyer reviews from customers who purchased directly from us.',
                  `Reach a real person any time at ${BRAND.phone} or ${BRAND.email}.`,
                  'Every order is trackable end-to-end from our Track Order page.',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm font-light leading-relaxed text-ink-soft">
                    <Check size={15} className="mt-0.5 shrink-0 text-gold" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

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
              <p className="mt-5 text-sm font-light leading-relaxed text-ink-mute">
                Every fragrance sold on this site is composed, quality-checked, and shipped directly by the {BRAND.name} team from {BRAND.address}.
              </p>
              <Link to="/about" className="mt-10 kx-btn-solid">Discover Our Story <ArrowRight size={14} /></Link>
            </div>
            <div className="relative">
              <div className="absolute -inset-6 bg-gold/5 blur-3xl" />
              <div className="kx-img-frame relative aspect-[4/5] border border-line">
                <div className="kx-img-frame relative aspect-[4/5] border border-line">
  <img
    src="/atelier.png"
    alt="The Atelier"
    className="h-full w-full object-cover"
  />
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
          <p className="mt-8 text-xs font-light text-ink-mute">
            Source:{' '}
            <a
              href="https://en.wikipedia.org/wiki/Perfume"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-gold/40 underline-offset-2 hover:text-gold-deep"
            >
              the classic top/heart/base fragrance pyramid
            </a>{' '}
            used across the perfumery industry.
          </p>
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
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-gold/25 bg-gold/5">

                      {rev.user_id && reviewers[rev.user_id]?.avatar_url ? (
  <img
    src={reviewers[rev.user_id].avatar_url!}
    alt="Customer"
    className="h-full w-full object-cover"
  />
) : (
  <div className="grid h-full w-full place-items-center font-display italic text-gold">
    {(rev.author_name || 'C').charAt(0).toUpperCase()}
  </div>
)}
</div>

                    <div>
  <p className="text-sm font-medium text-charcoal">
    {rev.user_id && reviewers[rev.user_id]?.full_name
      ? reviewers[rev.user_id].full_name
      : rev.author_name}
  </p>

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

      {/* FAQ — question-style headings + answers help AI/answer-engine visibility */}
      <section className="kx-section bg-ivory-2">
        <div className="kx-container max-w-3xl">
          <FaqSection />
        </div>
      </section>
    </div>
  );
}
