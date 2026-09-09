import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumbs from '@/components/Breadcrumbs';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, HandHeart, Globe2, Award, Check } from 'lucide-react';
import { BRAND } from '@/lib/constants';
import SectionTitle from '@/components/SectionTitle';
import Seo from '@/components/Seo';
import { useReveal } from '@/hooks/useReveal';
import { supabase } from '@/lib/supabase';

const VALUES = [
  { Icon: Sparkles, title: 'Rare Essences', desc: 'We source the world\'s most precious oils and absolutes — from Bulgarian rose to Cambodian oud.' },
  { Icon: HandHeart, title: 'Handcrafted', desc: 'Each composition is blended by hand in small batches, ensuring unmatched quality and character.' },
  { Icon: Globe2, title: 'Global Inspiration', desc: 'Our perfumer travels the world for inspiration, from spice markets to flower fields.' },
  { Icon: Award, title: 'Uncompromising', desc: 'We never compromise on ingredients, concentration, or the time it takes to perfect a scent.' },
];

const ABOUT_AUDIENCE_POINTS = [
  'Buyers who want to know who is actually behind Kalmat Fragrance before ordering',
  'Shoppers comparing our handcrafted, small-batch process against mass-produced perfume brands',
  'Gift buyers and returning customers who want to understand our sourcing and authenticity standards',
];

const CONCENTRATION_FACTS = [
  { type: 'Eau de Parfum (EDP)', concentration: '15–20%', longevity: '6–8 hours on skin' },
  { type: 'Eau de Toilette (EDT)', concentration: '5–15%', longevity: '3–5 hours on skin' },
  { type: 'Parfum / Extrait', concentration: '20–30%', longevity: '8+ hours on skin' },
];

const ABOUT_PROOF_POINTS = [
  'Every fragrance is hand-blended in small batches at our own atelier in Karachi — never outsourced to a third-party filler.',
  'Each batch rests before bottling, so the notes settle and blend the way they are meant to before it reaches a customer.',
  'Product ratings and reviews across the site come only from verified buyers who purchased directly from us.',
  'Every order ships with a trackable courier link and a 7-day, no-questions-asked return on unopened bottles.',
];

const ABOUT_FAQS = [
  {
    question: 'What is Kalmat Fragrance?',
    answer: 'Kalmat Fragrance is a Karachi-based, Pakistan-owned perfume house that hand-blends luxury oud, rose, and amber fragrances in small batches at our own atelier.',
  },
  {
    question: 'Where are Kalmat Fragrance perfumes made?',
    answer: 'Every fragrance is composed and hand-blended at our atelier in Karachi, Sindh, Pakistan — not manufactured overseas or relabeled from a third-party supplier.',
  },
  {
    question: 'What is the difference between Eau de Parfum and Eau de Toilette?',
    answer: 'Eau de Parfum contains roughly 15–20% fragrance concentration and lasts 6–8 hours, while Eau de Toilette contains about 5–15% and lasts 3–5 hours. We list the concentration on each product page.',
  },
  {
    question: 'Are your ingredients natural or synthetic?',
    answer: 'We source a mix of natural absolutes and oils — such as Bulgarian rose and Cambodian oud — alongside high-quality synthetic aroma compounds used to stabilize and extend a scent\'s life on skin.',
  },
];

const ABOUT_FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: ABOUT_FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
};

const ABOUT_WEBPAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Meet the Team & Atelier Behind Our Perfumes | Kalmat Fragrance',
  description:
    'Meet the team behind Kalmat Fragrance — our Karachi atelier, sourcing process, and the hand-blending craft behind every oud, rose, and amber perfume we make.',
  url: 'https://www.kalmatfragrance.store/about',
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

const ABOUT_ORGANIZATION_SCHEMA = {
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

export default function About() {
  const storyRef = useReveal<HTMLDivElement>();
  const valuesRef = useReveal<HTMLDivElement>();
  const [liveStats, setLiveStats] = useState<{ productCount: number; reviewCount: number } | null>(null);

  // Live, real-time counts pulled directly from our own database — not a static or invented figure
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const [products, reviews] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('product_reviews').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      ]);
      if (isMounted) {
        setLiveStats({
          productCount: products.count || 0,
          reviewCount: reviews.count || 0,
        });
      }
    })();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <Seo
        title="Meet the Team & Atelier Behind Our Perfumes"
        description="Meet the team behind Kalmat Fragrance — our Karachi atelier, sourcing process, and the hand-blending craft behind every oud, rose, and amber perfume we make."
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ABOUT_ORGANIZATION_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ABOUT_WEBPAGE_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ABOUT_FAQ_SCHEMA) }} />
      <Breadcrumbs items={[{ label: 'About' }]} />

      {/* Hero */}
      <section className="relative min-h-[52vh] overflow-hidden bg-charcoal">
        <div className="absolute inset-0 kx-grain-dark opacity-40" />
        <div className="absolute left-1/2 top-1/2 h-[50vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/8 blur-[120px]" />
        <div className="kx-container relative flex min-h-[52vh] flex-col items-center justify-center pt-20 text-center">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-[10px] uppercase text-gold-light" style={{ letterSpacing: '0.5em' }}>Our Story</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} className="mt-5 font-display text-5xl font-light text-ivory sm:text-6xl lg:text-7xl">The Art of Luxury Perfumery</motion.h1>
          <div className="kx-center-rule mt-7"><span className="text-gold-light/60">✦</span></div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }} className="mx-auto mt-6 max-w-xl text-sm font-light leading-relaxed text-ivory">
            <strong className="font-medium text-ivory">In short:</strong> Kalmat Fragrance is a Karachi-based
            perfume house that hand-blends every oud, rose, and amber fragrance in small batches at our own
            atelier — born from a passion for rare essences and the ancient craft of perfumery.
          </motion.p>
        </div>
      </section>

      {/* Who this page is for (audience clarity for AEO/GEO) */}
      <section className="kx-container py-14 lg:py-16">
        <p className="kx-eyebrow">Who It's For</p>
        <h2 className="mt-3 font-display text-2xl font-light text-charcoal">Who This Page Is For</h2>
        <div className="kx-gold-line mt-4" />
        <p className="mt-6 max-w-3xl text-sm font-light leading-relaxed text-ink-soft">
          This About page is built for buyers in Pakistan's luxury perfume industry who want to verify
          who is behind Kalmat Fragrance and how we source and blend each fragrance. The use case is
          simple: use this page to decide whether our handcrafted, small-batch process meets your
          standards before ordering, before comparing us to mass-produced perfume brands, or before
          buying a bottle as a gift.
        </p>
        <ul className="mt-6 max-w-2xl space-y-3">
          {ABOUT_AUDIENCE_POINTS.map((point) => (
            <li key={point} className="flex items-start gap-3 text-sm font-light leading-relaxed text-ink-soft">
              <Check size={15} className="mt-0.5 shrink-0 text-gold" />
              {point}
            </li>
          ))}
        </ul>
      </section>

      {/* Story */}
      <section className="kx-section">
        <div ref={storyRef} className="reveal-hidden kx-container">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="kx-eyebrow">The Beginning</p>
              <h2 className="mt-5 font-display text-4xl font-light leading-[1.05] text-charcoal sm:text-5xl">A Story Written in Scent</h2>
              <div className="kx-gold-line mt-6" />
              <p className="mt-8 text-base font-light leading-[1.8] text-ink-soft">Kalmat Fragrance was born from a simple belief: that a fragrance should not merely smell beautiful — it should tell a story, evoke a memory, and become an inseparable part of who you are.</p>
              <p className="mt-5 text-base font-light leading-[1.8] text-ink-soft">From sun-drenched fields of Bulgarian rose to the deep, smoky woods of Cambodia, we travel the world to source the rarest essences. Each composition is a journey — crafted by hand, refined with patience, and composed with intention.</p>
              <p className="mt-5 text-base font-light leading-[1.8] text-ink-soft">We believe in the old ways: small batches, natural ingredients, and the time it takes to perfect a scent. This is not fast fashion. This is the art of perfumery, written and maintained by the Kalmat Fragrance team in Karachi.</p>
              <p className="mt-5 text-base font-light leading-[1.8] text-ink-soft">
                We test every batch first-hand, ourselves, before it is approved: each blend is checked
                on blotter strips and on skin over several hours, at our own atelier in Karachi, to
                confirm it opens, settles, and lasts the way it was designed to. This is not a
                specification sheet copied from a factory — it is judged in person, batch by batch, by
                the same team that hand-blends it.
              </p>
              <p className="mt-5 text-base font-light leading-[1.8] text-ink-soft">
                Every composition is developed in our own Karachi atelier, tested across multiple small
                batches, and only bottled once the blend rests and settles the way it is meant to — the
                same first-hand process behind every order shipped from our{' '}
                <Link to="/shop" className="underline decoration-gold/40 underline-offset-2 hover:text-gold-deep">
                  shop
                </Link>{' '}
                and{' '}
                <Link to="/collections" className="underline decoration-gold/40 underline-offset-2 hover:text-gold-deep">
                  collections
                </Link>
                .
              </p>
            </div>
            <div className="relative">
              <div className="absolute -inset-6 bg-gold/5 blur-3xl" />
              <div className="kx-img-frame relative aspect-[4/5] border border-line">
                <div className="kx-img-frame relative aspect-[4/5] overflow-hidden border border-line">
  <img
    src="/atelier.png"
    alt="Kalmat Fragrance Atelier"
    className="h-full w-full object-cover"
  />
</div>
              </div>
              <div className="absolute -bottom-5 -left-5 grid h-24 w-24 place-items-center border border-gold/30 bg-ivory shadow-elevate"><span className="font-display text-4xl italic text-gold">K</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="kx-section bg-ivory-2">
        <div ref={valuesRef} className="reveal-hidden kx-container">
          <SectionTitle eyebrow="What We Stand For" title="Our Principles" subtitle="Four values that guide every composition we create." />
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1 }} className="group border border-line bg-white p-8 transition-all duration-500 hover:border-gold/40 hover:shadow-elevate">
                <v.Icon className="h-8 w-8 text-gold transition-transform duration-500 group-hover:scale-110" strokeWidth={1.2} />
                <h3 className="mt-5 font-display text-xl text-charcoal">{v.title}</h3>
                <div className="kx-gold-line mt-3" />
                <p className="mt-4 text-sm font-light leading-relaxed text-ink-soft">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What is the difference between EDP and EDT — definition + data/stats + comparison table */}
      <section className="kx-container py-14 lg:py-16">
        <p className="kx-eyebrow">Know Your Fragrance</p>
        <h2 className="mt-3 font-display text-2xl font-light text-charcoal">What Is the Difference Between Eau de Parfum and Eau de Toilette?</h2>
        <div className="kx-gold-line mt-4" />
        <p className="mt-6 max-w-3xl text-sm font-light leading-relaxed text-ink-soft">
          Fragrance concentration is the percentage of aromatic oil in a bottle, and it directly determines
          how long a scent lasts on skin. Here is how the main types compare:
        </p>
        <div className="mt-6 max-w-3xl overflow-hidden border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-white">
              <tr>
                <th className="p-4 font-display text-charcoal">Type</th>
                <th className="p-4 font-display text-charcoal">Concentration</th>
                <th className="p-4 font-display text-charcoal">Typical Longevity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {CONCENTRATION_FACTS.map((row) => (
                <tr key={row.type}>
                  <td className="p-4 font-light text-ink-soft">{row.type}</td>
                  <td className="p-4 font-light text-ink-soft">{row.concentration}</td>
                  <td className="p-4 font-light text-ink-soft">{row.longevity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 max-w-3xl text-xs font-light text-ink-mute">
          Source:{' '}
          <a
            href="https://en.wikipedia.org/wiki/Perfume#Types"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-gold/40 underline-offset-2 hover:text-gold-deep"
          >
            perfume concentration and classification
          </a>{' '}
          standards used across the global perfumery industry — we list each product's concentration on
          its own product page.
        </p>
      </section>

      {/* Why trust us — proof, ownership, and first-hand process (GEO trust signals) */}
      <section className="kx-container py-14 lg:py-16">
        <div className="border border-line bg-white p-8 sm:p-10">
          <p className="kx-eyebrow">Trust & Transparency</p>
          <h2 className="mt-3 font-display text-2xl font-light text-charcoal">Why Buyers Trust Kalmat Fragrance</h2>
          <div className="kx-gold-line mt-5" />
          <p className="mt-6 text-sm font-light leading-relaxed text-ink-soft">
            Kalmat Fragrance is a Karachi-based, Pakistan-owned perfume house — every bottle is composed
            and hand-blended in-house, not relabeled from a third-party manufacturer. This page and our{' '}
            <Link to="/shop" className="underline decoration-gold/40 underline-offset-2 hover:text-gold-deep">
              full shop
            </Link>{' '}
            are curated and written by the Kalmat Fragrance team in Karachi.
          </p>
          {liveStats && (
            <p className="mt-4 text-sm font-light leading-relaxed text-ink-soft">
              As of today, we have {liveStats.productCount} fragrance{liveStats.productCount !== 1 ? 's' : ''} live
              on the site and {liveStats.reviewCount} verified-buyer review{liveStats.reviewCount !== 1 ? 's' : ''} approved
              across them — a live count pulled directly from our own order and review records, not a
              marketing estimate.
            </p>
          )}
          <ul className="mt-7 space-y-5">
            {ABOUT_PROOF_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm font-light leading-relaxed text-ink-soft">
                <Check size={15} className="mt-0.5 shrink-0 text-gold" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ — question-style headings + answers for AI/answer-engine visibility */}
      <section className="kx-section bg-ivory-2">
        <div className="kx-container">
          <p className="kx-eyebrow">Questions & Answers</p>
          <h2 className="mt-3 font-display text-3xl font-light text-charcoal">Frequently Asked Questions</h2>
          <div className="kx-gold-line mt-5" />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {ABOUT_FAQS.map((faq) => (
              <div key={faq.question} className="border border-line bg-white p-7">
                <h3 className="text-sm font-medium text-charcoal">{faq.question}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-ink-mute">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="kx-section text-center">
        <div className="kx-container">
          <p className="kx-eyebrow">Get in Touch</p>
          <h2 className="mt-4 font-display text-4xl font-light text-charcoal sm:text-5xl">Begin a Conversation</h2>
          <div className="kx-gold-line mx-auto mt-6" />
          <p className="mx-auto mt-6 max-w-lg text-sm font-light text-ink-soft">Have a question or seeking a custom composition? Our concierge is here for you.</p>
          <Link to="/contact" className="kx-btn-solid mt-10">Contact Us <ArrowRight size={14} /></Link>
        </div>
      </section>
    </div>
  );
}
