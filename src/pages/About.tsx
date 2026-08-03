import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, HandHeart, Globe2, Award } from 'lucide-react';
import { BRAND } from '@/lib/constants';
import SectionTitle from '@/components/SectionTitle';
import Seo from '@/components/Seo';
import { useReveal } from '@/hooks/useReveal';

const VALUES = [
  { Icon: Sparkles, title: 'Rare Essences', desc: 'We source the world\'s most precious oils and absolutes — from Bulgarian rose to Cambodian oud.' },
  { Icon: HandHeart, title: 'Handcrafted', desc: 'Each composition is blended by hand in small batches, ensuring unmatched quality and character.' },
  { Icon: Globe2, title: 'Global Inspiration', desc: 'Our perfumer travels the world for inspiration, from spice markets to flower fields.' },
  { Icon: Award, title: 'Uncompromising', desc: 'We never compromise on ingredients, concentration, or the time it takes to perfect a scent.' },
];

export default function About() {
  const storyRef = useReveal<HTMLDivElement>();
  const valuesRef = useReveal<HTMLDivElement>();

  return (
    <>
      <Seo title="About" description="The story behind Kalmat Fragrance — the art of luxury perfumery." />

      {/* Hero */}
      <section className="relative min-h-[52vh] overflow-hidden bg-charcoal">
        <div className="absolute inset-0 kx-grain-dark opacity-40" />
        <div className="absolute left-1/2 top-1/2 h-[50vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/8 blur-[120px]" />
        <div className="kx-container relative flex min-h-[52vh] flex-col items-center justify-center pt-20 text-center">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-[10px] uppercase text-gold-light" style={{ letterSpacing: '0.5em' }}>Our Story</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} className="mt-5 font-display text-5xl font-light text-ivory sm:text-6xl lg:text-7xl">The Art of Luxury Perfumery</motion.h1>
          <div className="kx-center-rule mt-7"><span className="text-gold-light/60">✦</span></div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }} className="mx-auto mt-6 max-w-xl text-sm font-light leading-relaxed text-ivory/60">Born from a passion for rare essences and the ancient craft of perfumery.</motion.p>
        </div>
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
              <p className="mt-5 text-base font-light leading-[1.8] text-ink-soft">We believe in the old ways: small batches, natural ingredients, and the time it takes to perfect a scent. This is not fast fashion. This is the art of perfumery.</p>
            </div>
            <div className="relative">
              <div className="absolute -inset-6 bg-gold/5 blur-3xl" />
              <div className="kx-img-frame relative aspect-[4/5] border border-line">
                <div className="grid h-full w-full place-items-center" style={{ background: 'linear-gradient(160deg,#F3ECE0,#E6DCCB)' }}>
                  <div className="text-center"><span className="font-display text-8xl italic text-gold/25">K</span><p className="mt-3 text-[10px] uppercase text-gold/40" style={{ letterSpacing: '0.4em' }}>The Atelier</p></div>
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
    </>
  );
}
