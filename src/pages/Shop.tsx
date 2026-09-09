import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown, Search, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Breadcrumbs from '@/components/Breadcrumbs';
import type { Product, Category, Collection } from '@/types';
import ProductTile from '@/components/ProductTile';
import Seo from '@/components/Seo';
import { BRAND } from '@/lib/constants';

const PAGE_SIZE = 12;

const FRAGRANCE_FAMILIES = [
  { name: 'Oud', desc: 'A rare, precious wood-derived resin — deep, smoky, and long-lasting. The signature base of luxury Middle Eastern and South Asian perfumery.' },
  { name: 'Rose', desc: 'A rich, romantic floral note prized for centuries. Adds warmth and elegance to both everyday and special-occasion fragrances.' },
  { name: 'Amber', desc: 'A warm, resinous, slightly sweet base note that gives a fragrance depth and lasting power on the skin.' },
];

const SHOP_AUDIENCE_POINTS = [
  'Buyers comparing oud, rose, and amber fragrance families before choosing one',
  'Shoppers in Pakistan who want an authentic, handcrafted perfume delivered nationwide',
  'Gift buyers looking for an elegant, long-lasting signature scent for someone else',
];

const HOW_TO_CHOOSE_STEPS = [
  'Think about the mood you want: oud for deep and smoky, rose for romantic and floral, amber for warm and sweet.',
  'Consider where you will wear it — office and daily wear suit lighter rose or amber blends, while evenings and special occasions suit stronger oud compositions.',
  'Check the gender listing (Men, Women, or Unisex) if you are buying for yourself or as a gift.',
  'Use the price filter to shop within your budget, then sort by Best Sellers or Top Rated to see what other buyers prefer.',
];

const SHOP_PROOF_POINTS = [
  'Every fragrance is handcrafted at our own atelier in Karachi, not mass-produced or outsourced.',
  'Product ratings and reviews on this page come only from verified buyers who purchased directly from us.',
  'Each order is dispatched with a trackable courier link, visible end-to-end from our Track Order page.',
  'Not the right fit? Return any unopened, unused bottle within 7 days — no questions asked.',
];

const SHOP_FAQS = [
  {
    question: 'How do I choose the right fragrance family?',
    answer: 'If you prefer deep, smoky, long-lasting scents, start with oud. For a romantic, floral character, choose rose. For warm, sweet, cozy fragrances, amber is a great starting point.',
  },
  {
    question: 'Do you ship nationwide in Pakistan?',
    answer: 'Yes. We deliver across Pakistan with trackable courier shipping, and complimentary shipping on orders over Rs 5,000.',
  },
  {
    question: "What if I don't like the scent after ordering?",
    answer: 'You can return any unopened, unused product within 7 days of delivery — no questions asked. See our return policy for details.',
  },
  {
    question: 'Are Kalmat Fragrance perfumes authentic?',
    answer: 'Yes. Every bottle sold on this site comes with a 100% authentic guarantee and is handcrafted directly by the Kalmat Fragrance atelier.',
  },
];

const SHOP_FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: SHOP_FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
};

const SHOP_WEBPAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Handcrafted Oud Perfumes Online | Kalmat Fragrance',
  description:
    "Shop Kalmat Fragrance's full collection of handcrafted luxury perfumes — oud, rose, and amber scents for men, women, and unisex, delivered nationwide in Pakistan.",
  url: 'https://www.kalmatfragrance.store/shop',
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

const SHOP_ORGANIZATION_SCHEMA = {
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

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const categorySlug = searchParams.get('category') || '';
  const collectionSlug = searchParams.get('collection') || '';
  const gender = searchParams.get('gender') || '';
  const brand = searchParams.get('brand') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sort = searchParams.get('sort') || 'featured';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const [cats, cols] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('collections').select('*'),
      ]);
      setCategories((cats.data as Category[]) || []);
      setCollections((cols.data as Collection[]) || []);
    })();
  }, []);

  useEffect(() => {
    setPage(1);
    setLoading(true);
    (async () => {
      let query = supabase
  .from('products')
  .select(`
    *,
    variants:product_variants(*)
  `);
      if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,brand.ilike.%${q}%`);
      if (categorySlug) {
        const cat = categories.find((c) => c.slug === categorySlug);
        if (cat) query = query.eq('category_id', cat.id);
      }
      if (collectionSlug) {
        const col = collections.find((c) => c.slug === collectionSlug);
        if (col) query = query.eq('collection_id', col.id);
      }
      if (gender) query = query.eq('gender', gender);
      if (brand) query = query.ilike('brand', `%${brand}%`);
      if (minPrice) query = query.gte('price', parseFloat(minPrice));
      if (maxPrice) query = query.lte('price', parseFloat(maxPrice));

      if (sort === 'new') query = query.order('is_new', { ascending: false }).order('created_at', { ascending: false });
      else if (sort === 'price-asc') query = query.order('price', { ascending: true });
      else if (sort === 'price-desc') query = query.order('price', { ascending: false });
      else if (sort === 'rating') query = query.order('rating', { ascending: false });
      else if (sort === 'best') query = query.order('best_seller', { ascending: false }).order('reviews_count', { ascending: false });
      else query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });

      const { data } = await query;
      setProducts((data as Product[]) || []);
      setLoading(false);
    })();
  }, [q, categorySlug, collectionSlug, gender, brand, minPrice, maxPrice, sort, categories, collections]);

  const brands = Array.from(new Set(products.map((p) => p.brand))).sort();
  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const paged = products.slice((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next);
  };
  const clearFilters = () => setSearchParams(new URLSearchParams());
  const activeCount = [categorySlug, collectionSlug, gender, brand, minPrice, maxPrice].filter(Boolean).length;

  const SORTS = [
    { v: 'featured', l: 'Featured' },
    { v: 'new', l: 'New Arrivals' },
    { v: 'best', l: 'Best Sellers' },
    { v: 'price-asc', l: 'Price: Low to High' },
    { v: 'price-desc', l: 'Price: High to Low' },
    { v: 'rating', l: 'Top Rated' },
  ];

  const Sidebar = (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <p className="font-display text-xl text-charcoal">Filters</p>
        {activeCount > 0 && (
          <button onClick={clearFilters} className="text-[10px] uppercase text-gold-deep transition-colors hover:text-charcoal" style={{ letterSpacing: '0.24em' }}>Clear All</button>
        )}
      </div>

      {/* Categories */}
      <div>
        <p className="kx-label mb-3">Category</p>
        <div>
          <FilterRow label="All Fragrances" active={!categorySlug} onClick={() => updateParam('category', '')} />
          {categories.map((c) => (
            <FilterRow key={c.id} label={c.name} active={categorySlug === c.slug} onClick={() => updateParam('category', c.slug)} />
          ))}
        </div>
      </div>

      {/* Collections */}
      {collections.length > 0 && (
        <div>
          <p className="kx-label mb-3">Collection</p>
          <div>
            <FilterRow label="All" active={!collectionSlug} onClick={() => updateParam('collection', '')} />
            {collections.map((c) => (
              <FilterRow key={c.id} label={c.name} active={collectionSlug === c.slug} onClick={() => updateParam('collection', c.slug)} />
            ))}
          </div>
        </div>
      )}

      {/* Gender */}
      <div>
        <p className="kx-label mb-3">For</p>
        <div>
          <FilterRow label="Everyone" active={!gender} onClick={() => updateParam('gender', '')} />
          <FilterRow label="Men" active={gender === 'men'} onClick={() => updateParam('gender', 'men')} />
          <FilterRow label="Women" active={gender === 'women'} onClick={() => updateParam('gender', 'women')} />
          <FilterRow label="Unisex" active={gender === 'unisex'} onClick={() => updateParam('gender', 'unisex')} />
        </div>
      </div>

      {/* Brand */}
      {brands.length > 0 && (
        <div>
          <p className="kx-label mb-3">Brand</p>
          <div>
            <FilterRow label="All Brands" active={!brand} onClick={() => updateParam('brand', '')} />
            {brands.map((b) => (
              <FilterRow key={b} label={b} active={brand === b} onClick={() => updateParam('brand', b)} />
            ))}
          </div>
        </div>
      )}

      {/* Price */}
      <div>
        <p className="kx-label mb-3">Price Range</p>
        <div className="flex items-center gap-3">
          <input type="number" placeholder="Min" value={minPrice} onChange={(e) => updateParam('minPrice', e.target.value)} className="kx-input text-sm" />
          <span className="text-ink-mute">—</span>
          <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => updateParam('maxPrice', e.target.value)} className="kx-input text-sm" />
        </div>
      </div>
    </div>
  );
return (
    <>
      <Seo
        title="Handcrafted Oud Perfumes Online"
        description="Shop Kalmat Fragrance's full collection of handcrafted luxury perfumes — oud, rose, and amber scents for men, women, and unisex, delivered nationwide in Pakistan."
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SHOP_ORGANIZATION_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SHOP_WEBPAGE_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SHOP_FAQ_SCHEMA) }} />
      <Breadcrumbs items={[{ label: 'Shop' }]} />

      {/* Page header */}
      <section className="border-b border-line bg-ivory-2 pt-14 pb-10 lg:pt-20 lg:pb-14">
        <div className="kx-container">
          <p className="kx-eyebrow">The Boutique</p>
          <h1 className="mt-3 font-display text-5xl font-light text-charcoal sm:text-6xl">{q ? `Results for "${q}"` : 'Shop All Fragrances — Oud, Rose & Amber Perfumes'}</h1>
          <div className="kx-gold-line mt-6" />
          <p className="mt-6 max-w-2xl text-sm font-light leading-relaxed text-ink-soft">
            <strong className="font-medium text-charcoal">In short:</strong> Browse our full range of handcrafted
            oud, rose, and amber perfumes below, filter by category, gender, or price, and every order ships with
            an authentic guarantee and trackable nationwide delivery in Pakistan.
          </p>
        </div>
      </section>

      {/* Who this shop is for + fragrance family guide + buying guide + proof (helps buyers decide, and helps AI/answer engines) */}
      <section className="kx-container py-12 lg:py-14">
        <p className="kx-eyebrow">Who It's For</p>
        <h2 className="mt-3 font-display text-2xl font-light text-charcoal">Who This Shop Is For</h2>
        <div className="kx-gold-line mt-4" />
        <p className="mt-6 max-w-3xl text-sm font-light leading-relaxed text-ink-soft">
          This shop page is built for shoppers in Pakistan comparing fragrance families and deciding which
          scent to buy — whether the use case is daily wear, a special occasion, or gifting.
        </p>
        <ul className="mt-6 max-w-2xl space-y-3">
          {SHOP_AUDIENCE_POINTS.map((point) => (
            <li key={point} className="flex items-start gap-3 text-sm font-light leading-relaxed text-ink-soft">
              <Check size={15} className="mt-0.5 shrink-0 text-gold" />
              {point}
            </li>
          ))}
        </ul>

        <h2 className="mt-14 font-display text-2xl font-light text-charcoal">Shop by Fragrance Family</h2>
        <div className="kx-gold-line mt-4" />
        <ul className="mt-6 grid gap-6 sm:grid-cols-3">
          {FRAGRANCE_FAMILIES.map((f) => (
            <li key={f.name} className="border border-line bg-white p-6">
              <p className="font-display text-lg text-gold-deep">{f.name}</p>
              <p className="mt-2 text-sm font-light leading-relaxed text-ink-soft">{f.desc}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-3xl text-xs font-light text-ink-mute">
          Source:{' '}
          <a
            href="https://en.wikipedia.org/wiki/Perfume#Classification"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-gold/40 underline-offset-2 hover:text-gold-deep"
          >
            fragrance family classification
          </a>{' '}
          as used across the global perfumery industry.
        </p>

        <div className="mt-16 grid gap-6 border-t border-line pt-14 md:grid-cols-2 md:gap-8">
          <div className="border border-line bg-white p-8 sm:p-10">
            <p className="kx-eyebrow">Buying Guide</p>
            <h2 className="mt-3 font-display text-2xl font-light text-charcoal">How to Choose the Right Fragrance</h2>
            <div className="kx-gold-line mt-5" />
            <p className="mt-6 text-sm font-light leading-relaxed text-ink-soft">
              What is the difference between oud, rose, and amber, and how to choose between them? Here is how:
            </p>
            <ol className="mt-6 space-y-5">
              {HOW_TO_CHOOSE_STEPS.map((step, i) => (
                <li key={step} className="flex items-start gap-4 text-sm font-light leading-relaxed text-ink-soft">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gold/40 font-display text-xs italic text-gold-deep">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="border border-line bg-white p-8 sm:p-10">
            <p className="kx-eyebrow">Trust & Transparency</p>
            <h2 className="mt-3 font-display text-2xl font-light text-charcoal">Why Shop With Us</h2>
            <div className="kx-gold-line mt-5" />
            <p className="mt-6 text-sm font-light leading-relaxed text-ink-soft">
              We hand-blend every fragrance ourselves, in small batches, at our own atelier in Karachi —
              then let each blend rest before it is bottled, labeled, and gift-wrapped for dispatch. It is
              the same process behind every single order we send out, not a mass-produced formula relabeled
              for the shelf. Read more about{' '}
              <a href="/about" className="underline decoration-gold/40 underline-offset-2 hover:text-gold-deep">
                our story and process
              </a>
              .
            </p>
            {!loading && (
              <p className="mt-4 text-sm font-light leading-relaxed text-ink-soft">
                Right now we have {products.length} fragrance{products.length !== 1 ? 's' : ''} in stock across
                our oud, rose, and amber collections — curated and written by the Kalmat Fragrance team in
                Karachi, based on what is actually on our shelves today, not a generic catalog description.
              </p>
            )}
            <ul className="mt-7 space-y-5">
              {SHOP_PROOF_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm font-light leading-relaxed text-ink-soft">
                  <Check size={15} className="mt-0.5 shrink-0 text-gold" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="kx-container py-12 lg:py-16">
        {/* Mobile filter toggle */}
        <div className="mb-8 flex items-center justify-between lg:hidden">
          <button onClick={() => setMobileFiltersOpen(true)} className="inline-flex items-center gap-2 border border-line px-5 py-3 text-[10px] uppercase text-charcoal" style={{ letterSpacing: '0.24em' }}>
            <SlidersHorizontal size={14} /> Filters {activeCount > 0 && <span className="text-gold-deep">({activeCount})</span>}
          </button>
          <SortSelect sort={sort} onChange={(v) => updateParam('sort', v)} options={SORTS} />
        </div>

        <div className="grid gap-12 lg:grid-cols-[240px_1fr] lg:gap-16">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">{Sidebar}</div>
          </aside>

          {/* Grid */}
          <div>
            <div className="mb-8 hidden items-center justify-between border-b border-line-soft pb-5 lg:flex">
              <p className="text-sm text-ink-mute">{loading ? 'Loading...' : `${products.length} fragrance${products.length !== 1 ? 's' : ''}`}</p>
              <SortSelect sort={sort} onChange={(v) => updateParam('sort', v)} options={SORTS} />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse bg-ivory-2" />)}
              </div>
            ) : paged.length === 0 ? (
              <div className="py-24 text-center">
                <p className="font-display text-3xl text-charcoal">No fragrances found</p>
                <p className="mt-3 text-sm text-ink-mute">Try adjusting your filters</p>
                <button onClick={clearFilters} className="kx-btn-ghost mt-8">Clear All Filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7">
                {paged.map((p, i) => <ProductTile key={p.id} product={p} index={i} />)}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-16 flex items-center justify-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 text-[10px] uppercase text-ink-soft transition-colors hover:text-gold-deep disabled:opacity-30" style={{ letterSpacing: '0.2em' }}>‹ Prev</button>
                <div className="flex items-center">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)} data-active={page === i + 1} className="kx-page-btn">{i + 1}</button>
                  ))}
                </div>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 text-[10px] uppercase text-ink-soft transition-colors hover:text-gold-deep disabled:opacity-30" style={{ letterSpacing: '0.2em' }}>Next ›</button>
              </div>
            )}
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
            {SHOP_FAQS.map((faq) => (
              <div key={faq.question} className="border border-line bg-white p-7">
                <h3 className="text-sm font-medium text-charcoal">{faq.question}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-ink-mute">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[70] bg-charcoal/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileFiltersOpen(false)}>
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-0 h-full w-[88vw] max-w-sm overflow-y-auto bg-ivory p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <p className="font-display text-2xl text-charcoal">Filters</p>
              <button onClick={() => setMobileFiltersOpen(false)}><X size={22} className="text-charcoal hover:text-gold-deep" /></button>
            </div>
            {Sidebar}
            <button onClick={() => setMobileFiltersOpen(false)} className="kx-btn-solid mt-10 w-full">Show Results ({products.length})</button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}

function FilterRow({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} data-active={active} className="kx-filter-row w-full text-left">
      <span>{label}</span>
      {active && <span className="h-1.5 w-1.5 rounded-full bg-gold" />}
    </button>
  );
}

function SortSelect({ sort, onChange, options }: { sort: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div className="relative">
      <select value={sort} onChange={(e) => onChange(e.target.value)} className="kx-select text-[11px] uppercase" style={{ letterSpacing: '0.2em' }}>
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}
