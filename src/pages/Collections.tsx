import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Breadcrumbs from '@/components/Breadcrumbs';
import { motion } from 'framer-motion';
import { ArrowRight, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Collection, Product } from '@/types';
import ProductTile from '@/components/ProductTile';
import SectionTitle from '@/components/SectionTitle';
import Seo from '@/components/Seo';
import { BRAND } from '@/lib/constants';

const COLLECTIONS_AUDIENCE_POINTS = [
  'Shoppers who want a curated set of complementary scents instead of picking one bottle at a time',
  'Gift buyers looking for a boxed, occasion-ready perfume set for a birthday, wedding, or festival',
  'Buyers who already know a mood or fragrance family they love and want more of it, in one collection',
];

const HOW_TO_CHOOSE_COLLECTION_STEPS = [
  'Decide the occasion first: everyday wear calls for lighter, more wearable sets; gifting and special occasions suit richer, statement collections.',
  'Pick a lead note family — oud, rose, or amber — and choose the collection built around it, since each collection groups scents that share a mood.',
  'Check whether the set is for one person or for gifting; some collections are boxed specifically as gift sets with presentation packaging.',
  'Open a collection below and use featured/best-seller sorting on its product grid to see which items inside it buyers pick most.',
];

const COLLECTIONS_FAQS = [
  {
    question: 'How do I choose the right fragrance collection?',
    answer: 'Start with the occasion and a lead note family. Everyday wear suits lighter oud or amber sets, while gifting and special occasions suit richer, more concentrated collections.',
  },
  {
    question: 'What is a fragrance collection?',
    answer: 'A fragrance collection is a curated group of perfumes assembled around a shared mood, note family, or occasion, so you can shop a theme instead of one bottle at a time.',
  },
  {
    question: 'Are collections available as gift sets?',
    answer: 'Many of our collections are boxed and presented as gift-ready sets. Open any collection below to see which products inside it are included and how they are packaged.',
  },
  {
    question: 'Do collections ship nationwide in Pakistan?',
    answer: 'Yes. Every product inside every collection ships nationwide across Pakistan with trackable courier delivery, and complimentary shipping on orders over Rs 5,000.',
  },
];

export const COLLECTIONS_FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: COLLECTIONS_FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
};

export const COLLECTIONS_WEBPAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Gift-Ready Perfume Collections in Pakistan | Kalmat Fragrance',
  description:
    "Shop Kalmat Fragrance's curated perfume collections in Pakistan — signature oud, rose and amber gift sets, boxed with a clear story and occasion in mind.",
  url: 'https://www.kalmatfragrance.store/collections',
  dateModified: new Date().toISOString().slice(0, 10),
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

export const COLLECTIONS_SEO_TITLE = 'Gift-Ready Perfume Collections in Pakistan';
export const COLLECTIONS_SEO_DESCRIPTION =
  "Shop Kalmat Fragrance's curated perfume collections in Pakistan — signature oud, rose and amber gift sets, boxed with a clear story and occasion in mind.";

export const COLLECTIONS_ORGANIZATION_SCHEMA = {
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

export default function Collections() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSlug = searchParams.get('c') || '';
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [collectionsLoaded, setCollectionsLoaded] = useState(false);

  // Fetch collections once on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { data } = await supabase.from('collections').select('*').order('created_at');
      if (isMounted) {
        setCollections((data as Collection[]) || []);
        setCollectionsLoaded(true);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Fetch products conditionally when collections or activeSlug change
  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      if (!activeSlug) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const activeCollection = collections.find((c) => c.slug === activeSlug);

      if (!activeCollection) {
        if (isMounted) {
          setProducts([]);
          setLoading(false);
        }
        return;
      }

      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('collection_id', activeCollection.id)
        .order('featured', { ascending: false });

      if (isMounted) {
        setProducts((data as Product[]) || []);
        setLoading(false);
      }
    };

    fetchProducts();
    return () => { isMounted = false; };
  }, [activeSlug, collections]);

  const active = collections.find((c) => c.slug === activeSlug);

  return (
    <>
      <Seo
        title={COLLECTIONS_SEO_TITLE}
        description={COLLECTIONS_SEO_DESCRIPTION}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(COLLECTIONS_ORGANIZATION_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(COLLECTIONS_WEBPAGE_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(COLLECTIONS_FAQ_SCHEMA) }} />
      <Breadcrumbs items={[{ label: 'Collections' }]} />

      {/* Hero Section */}
      <section className="relative min-h-[56vh] overflow-hidden bg-charcoal">
        <div className="absolute inset-0 kx-grain-dark opacity-40" />
        <div className="absolute left-1/2 top-1/2 h-[50vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/8 blur-[120px]" />
        <div className="kx-container relative flex min-h-[56vh] flex-col items-center justify-center pt-20 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[10px] uppercase text-gold-light tracking-[0.5em]"
          >
            Curated Worlds
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 font-display text-5xl font-light text-ivory sm:text-6xl lg:text-7xl"
          >
            Our Collections
          </motion.h1>
          <div className="kx-center-rule mt-7">
            <span className="text-gold-light/60">✦</span>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mx-auto mt-6 max-w-xl text-sm font-light leading-relaxed text-ivory"
          >
            <strong className="font-medium text-ivory">In short:</strong> browse curated, gift-ready
            perfume sets grouped by mood and note family below, open a collection to see what's
            inside, and every order ships nationwide across Pakistan with a trackable courier link.
          </motion.p>
        </div>
      </section>

      {/* Editorial Collection Cards */}
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
                  className={`group relative aspect-[16/10] w-full overflow-hidden border text-left transition-all duration-500 ${
                    isActive ? 'border-gold shadow-elevate' : 'border-line hover:border-gold/40 hover:shadow-elevate'
                  }`}
                >
                  <div className="kx-img-frame absolute inset-0">
                    {col.image_url ? (
                      <img src={col.image_url} alt={col.name} className="kx-img-zoom h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[#F3ECE0] to-[#E6DCCB]">
                        <ImageIcon size={36} className="text-gold/25" />
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-10">
                    <p
                      className="text-[9px] uppercase tracking-[0.32em]"
                      style={{
                        color: col.slug_color || '#C9A961',
                        textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                      }}
                    >
                      Collection
                    </p>
                    <h3
                      className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl"
                      style={{
                        color: col.name_color || '#FFFFFF',
                        textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                      }}
                    >
                      {col.name}
                    </h3>
                    <p
                      className="mt-3 line-clamp-2 max-w-md text-xs sm:text-sm font-light leading-relaxed"
                      style={{
                        color: col.description_color || '#E8E4DD',
                        textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                      }}
                    >
                      {col.description}
                    </p>
                    <span
                      className={`mt-5 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-gold-light transition-all duration-300 group-hover:gap-4 ${
                        isActive ? 'gap-4' : ''
                      }`}
                    >
                      {isActive ? 'Now Viewing' : 'View Collection'} <ArrowRight size={13} />
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>
      )}

      {/* Selected Collection Products grid */}
      {activeSlug && (
        <section className="bg-ivory-2 py-16 lg:py-24">
          <div className="kx-container">
            <SectionTitle
              eyebrow={active?.name || 'Collection'}
              title={active?.name || 'Collection'}
              subtitle={active?.description || undefined}
            />
            {loading ? (
              <div className="mt-12 grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4 lg:gap-9">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[4/5] animate-pulse bg-ivory-3" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="mt-12 py-16 text-center">
                <p className="font-display text-2xl text-charcoal">No fragrances in this collection yet</p>
                <Link to="/shop" className="kx-btn-ghost mt-6 inline-block">
                  Browse All Fragrances
                </Link>
              </div>
            ) : (
              <div className="mt-12 grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4 lg:gap-7">
                {products.map((p, i) => (
                  <ProductTile key={p.id} product={p} index={i} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Who these collections are for / how to choose / why shop them (compact — helps AI/answer engines extract a direct answer) */}
      <section className="kx-section-sm bg-ivory-2">
        <div className="kx-container">
          <div className="max-w-3xl border-l-2 border-gold/50 pl-6 sm:pl-8">
            <p className="text-base font-light leading-relaxed text-ink-soft sm:text-lg">
              <strong className="font-medium text-charcoal">Who these are for:</strong> a fragrance
              collection is a curated group of perfumes assembled around a shared mood, note family,
              or occasion — built for shoppers who want a theme, not just a single bottle.
            </p>
            <div className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-3">
              {COLLECTIONS_AUDIENCE_POINTS.map((point) => (
                <p key={point} className="border-t border-line pt-3 text-xs font-light leading-relaxed text-ink-soft">
                  {point}
                </p>
              ))}
            </div>
          </div>

          <div className="mt-14 grid gap-8 border-t border-line pt-12 sm:grid-cols-2 sm:gap-12">
            <div>
              <h3 className="font-display text-lg font-light text-charcoal">How Do I Choose the Right Collection?</h3>
              <p className="mt-3 text-sm font-light leading-relaxed text-ink-soft">
                What is the difference between our collections, and how do you pick one? Here is how:
              </p>
              <ol className="mt-4 space-y-2.5">
                {HOW_TO_CHOOSE_COLLECTION_STEPS.map((step, i) => (
                  <li key={step} className="flex gap-3 text-sm font-light leading-relaxed text-ink-soft">
                    <span className="shrink-0 font-display text-xs italic text-gold-deep">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-xs font-light text-ink-mute">
                Source:{' '}
                <a
                  href="https://en.wikipedia.org/wiki/Perfume#Classification"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-gold/40 underline-offset-2 hover:text-gold-deep"
                >
                  fragrance family classification
                </a>{' '}
                as used across the global perfumery industry, applied to how we group each collection.
              </p>
            </div>
            <div>
              <h3 className="font-display text-lg font-light text-charcoal">Why Shop Our Collections</h3>
              <p className="mt-4 text-sm font-light leading-relaxed text-ink-soft">
                Every collection on this page is grouped and hand-blended by the Kalmat Fragrance team
                at our own atelier in Karachi — not assembled from third-party stock or a generic
                supplier catalog. Read more about{' '}
                <a href="/about" className="underline decoration-gold/40 underline-offset-2 hover:text-gold-deep">
                  our story and process
                </a>
                , or browse the{' '}
                <a href="/shop" className="underline decoration-gold/40 underline-offset-2 hover:text-gold-deep">
                  full shop
                </a>{' '}
                if you would rather choose one fragrance at a time.
              </p>
              {collectionsLoaded && (
                <p className="mt-3 text-sm font-light leading-relaxed text-ink-soft">
                  Right now we have {collections.length} curated collection{collections.length !== 1 ? 's' : ''}{' '}
                  live on the site — curated and written by the Kalmat Fragrance team in Karachi, based
                  on what is actually available today.
                </p>
              )}
              <p className="mt-3 text-sm font-light leading-relaxed text-ink-soft">
                Every order ships nationwide with a trackable courier link, and any unopened, unused
                bottle can be returned within 7 days, no questions asked.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ — question-style headings + answers for AI/answer-engine visibility */}
      <section className="kx-section bg-ivory-2">
        <div className="kx-container">
          <p className="kx-eyebrow">Questions & Answers</p>
          <h2 className="mt-3 font-display text-3xl font-light text-charcoal">Frequently Asked Questions</h2>
          <div className="kx-gold-line mt-5" />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {COLLECTIONS_FAQS.map((faq) => (
              <div key={faq.question} className="border border-line bg-white p-7">
                <h3 className="text-sm font-medium text-charcoal">{faq.question}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-ink-mute">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
