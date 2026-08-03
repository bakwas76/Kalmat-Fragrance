import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Instagram, Facebook, Twitter, ArrowUpRight, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';
import { BRAND } from '@/lib/constants';
import BrandMark from './BrandMark';

export default function SiteFooter() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('newsletter_subscribers').insert({ email: email.trim() });
    setBusy(false);
    if (error) {
      toast(error.code === '23505' ? 'You are already on the list' : 'Could not subscribe. Try again.', 'error');
      return;
    }
    toast('Welcome to the Kalmat circle');
    setEmail('');
  };

  return (
    <footer className="bg-charcoal text-ivory">
      {/* Newsletter band */}
      <div className="relative overflow-hidden border-b border-ivory/10">
        <div className="absolute inset-0 kx-grain-dark opacity-50" />
        <div className="absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 -translate-y-1/3 rounded-full bg-gold/10 blur-[120px]" />
        <div className="kx-container relative py-20 lg:py-28">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-[10px] font-medium uppercase text-gold-light" style={{ letterSpacing: '0.4em' }}>The Inner Circle</p>
            <h2 className="mt-5 font-display text-4xl font-light text-ivory sm:text-5xl">Become a Connoisseur</h2>
            <div className="kx-center-rule mt-7"><span className="text-gold-light/60 text-sm">✦</span></div>
            <p className="mt-6 text-sm font-light leading-relaxed text-ivory/60">
              Private previews, rare compositions, and the stories behind every scent — delivered with intention.
            </p>
            <form onSubmit={subscribe} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full border-b border-ivory/25 bg-transparent py-3 text-sm text-ivory placeholder:text-ivory/40 focus:border-gold focus:outline-none sm:w-72"
              />
              <button type="submit" disabled={busy} className="group inline-flex items-center justify-center gap-2.5 border border-ivory/30 px-8 py-3.5 text-[11px] font-medium uppercase text-ivory transition-all duration-500 hover:border-gold hover:text-gold-light disabled:opacity-40" style={{ letterSpacing: '0.28em' }}>
                {busy ? 'Joining...' : 'Subscribe'}
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="kx-container py-20">
        <div className="grid gap-14 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand story */}
          <div className="lg:col-span-1">
            <BrandMark size="footer" tone="light" />
            <p className="mt-7 max-w-xs text-sm font-light leading-relaxed text-ivory/55">
              Handcrafted luxury fragrances composed with the world's rarest essences. The art of perfumery, refined for the modern connoisseur.
            </p>
            <div className="mt-8 flex gap-3">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a key={i} href={[BRAND.instagram, BRAND.facebook, BRAND.twitter][i]} target="_blank" rel="noopener noreferrer" className="grid h-10 w-10 place-items-center border border-ivory/15 text-ivory/60 transition-all duration-300 hover:border-gold hover:text-gold-light">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="mb-7 text-[10px] font-medium uppercase text-gold-light" style={{ letterSpacing: '0.32em' }}>Explore</h3>
            <ul className="space-y-4">
              {[{ l: 'Shop All', t: '/shop' }, { l: 'Collections', t: '/collections' }, { l: 'Best Sellers', t: '/shop?sort=best' }, { l: 'New Arrivals', t: '/shop?sort=new' }, { l: 'Track Order', t: '/track-order' }].map((i) => (
                <li key={i.t}><Link to={i.t} className="text-sm font-light text-ivory/55 transition-colors duration-300 hover:text-gold-light">{i.l}</Link></li>
              ))}
            </ul>
          </div>

          {/* Care */}
          <div>
            <h3 className="mb-7 text-[10px] font-medium uppercase text-gold-light" style={{ letterSpacing: '0.32em' }}>Client Care</h3>
            <ul className="space-y-4">
              {[{ l: 'My Account', t: '/account' }, { l: 'Order History', t: '/account/orders' }, { l: 'Wishlist', t: '/wishlist' }, { l: 'Privacy Policy', t: '/privacy-policy' }, { l: 'Terms & Conditions', t: '/terms' }].map((i) => (
                <li key={i.t}><Link to={i.t} className="text-sm font-light text-ivory/55 transition-colors duration-300 hover:text-gold-light">{i.l}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-7 text-[10px] font-medium uppercase text-gold-light" style={{ letterSpacing: '0.32em' }}>Maison</h3>
            <ul className="space-y-5 text-sm font-light text-ivory/55">
              <li className="flex items-start gap-3"><MapPin size={16} className="mt-0.5 shrink-0 text-gold-light" /><span>{BRAND.address}</span></li>
              <li className="flex items-center gap-3"><Phone size={16} className="shrink-0 text-gold-light" /><a href={`tel:${BRAND.phone}`} className="transition-colors hover:text-gold-light">{BRAND.phone}</a></li>
              <li className="flex items-center gap-3"><Mail size={16} className="shrink-0 text-gold-light" /><a href={`mailto:${BRAND.email}`} className="transition-colors hover:text-gold-light">{BRAND.email}</a></li>
            </ul>
            <Link to="/contact" className="mt-7 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase text-gold-light transition-all hover:gap-2.5" style={{ letterSpacing: '0.28em' }}>
              Contact <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-ivory/10">
        <div className="kx-container flex flex-col items-center justify-between gap-4 py-8 text-center sm:flex-row sm:text-left">
          <p className="text-xs font-light text-ivory/40">© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
          <div className="h-px w-20 bg-gradient-to-r from-transparent via-gold to-transparent" />
          <p className="text-xs font-light text-ivory/40">Composed with intention in Pakistan.</p>
        </div>
      </div>
    </footer>
  );
}
