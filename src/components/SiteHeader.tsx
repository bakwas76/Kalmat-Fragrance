import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart, ShoppingBag, User, Menu, X, ChevronDown, ArrowRight, LogOut, Package, LayoutGrid } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/format';
import BrandMark from './BrandMark';

import AnnouncementBanner from './AnnouncementBanner';

const NAV = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Collections', to: '/collections' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

const TRANSPARENT_PATHS = ['/', '/collections'];

export default function SiteHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { itemCount } = useCart();
  const { productIds } = useWishlist();
  const { user, profile, isAdmin, signOut } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const transparent = TRANSPARENT_PATHS.includes(location.pathname) && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 56);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 60);
  }, [searchOpen]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%`)
        .limit(6);
      setResults((data as Product[]) || []);
      setSearching(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => { setMobileOpen(false); setAccountOpen(false); }, [location.pathname]);

  const onSignOut = async () => {
    await signOut();
    setAccountOpen(false);
    navigate('/');
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery('');
    }
  };

  const tone = transparent ? 'light' : 'dark';
  const iconCls = transparent ? 'text-white hover:text-gold-light' : 'text-charcoal hover:text-gold-deep';

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <AnnouncementBanner />
        <div className={`transition-all duration-500 ${transparent ? 'bg-transparent' : 'kx-glass border-b border-line/60'}`}>
        <div className="kx-container">
          <nav className={`flex items-center justify-between transition-all duration-500 ${transparent ? 'py-3' : 'py-2'}`}>
            {/* Brand */}
            <Link to="/" className="flex shrink-0 items-center lg:mr-12" aria-label="Kalmat Fragrance home">
              <BrandMark size="nav" tone={tone} />
            </Link>

            {/* Desktop nav — centered between brand and actions */}
            <ul className="hidden flex-1 items-center justify-center gap-10 lg:flex">
              {NAV.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className={transparent ? 'kx-navlink-light' : 'kx-navlink'}>{l.label}</Link>
                </li>
              ))}
            </ul>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1 sm:gap-2.5">
              <button onClick={() => setSearchOpen(true)} className={`grid h-10 w-10 place-items-center ${iconCls} transition-all duration-300 hover:scale-105`} aria-label="Search">
                <Search size={20} strokeWidth={1.4} />
              </button>

              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => (user ? setAccountOpen((o) => !o) : navigate('/login'))}
                  className={`grid h-10 w-10 place-items-center ${iconCls} transition-all duration-300 hover:scale-105`}
                  aria-label="Account"
                >
                  <User size={20} strokeWidth={1.4} />
                </button>
                <AnimatePresence>
                  {accountOpen && user && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: [0.16,1,0.3,1] }}
                    className="absolute right-0 top-12 w-60 border border-line bg-white shadow-elevate"
                  >
                    <div className="border-b border-line-soft bg-ivory-2 px-5 py-4">
                      <p className="font-display text-lg text-charcoal">{profile?.full_name || 'Member'}</p>
                      <p className="truncate text-xs text-ink-mute">{user.email}</p>
                    </div>
                    <div className="p-2">
                      <Link to="/account" onClick={() => setAccountOpen(false)} className="kx-account-link"><User size={15} /> Profile</Link>
                      <Link to="/account/orders" onClick={() => setAccountOpen(false)} className="kx-account-link"><Package size={15} /> Orders</Link>
                      <Link to="/wishlist" onClick={() => setAccountOpen(false)} className="kx-account-link"><Heart size={15} /> Wishlist</Link>
                      {isAdmin && <Link to="/admin" onClick={() => setAccountOpen(false)} className="kx-account-link"><LayoutGrid size={15} /> Admin</Link>}
                      <button onClick={onSignOut} className="kx-account-link w-full text-left text-danger"><LogOut size={15} /> Sign Out</button>
                    </div>
                  </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link to="/wishlist" className={`relative grid h-10 w-10 place-items-center ${iconCls} transition-all duration-300 hover:scale-105`} aria-label="Wishlist">
                <Heart size={20} strokeWidth={1.4} />
                {productIds.length > 0 && <Dot count={productIds.length} />}
              </Link>

              <Link to="/cart" className={`relative grid h-10 w-10 place-items-center ${iconCls} transition-all duration-300 hover:scale-105`} aria-label="Cart">
                <ShoppingBag size={20} strokeWidth={1.4} />
                {itemCount > 0 && <Dot count={itemCount} />}
              </Link>

              <button className={`lg:hidden grid h-10 w-10 place-items-center ${iconCls} transition-all duration-300 hover:scale-105`} onClick={() => setMobileOpen(true)} aria-label="Menu">
                <Menu size={22} strokeWidth={1.5} />
              </button>
            </div>
          </nav>
        </div>
      </div>
      </header>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-charcoal/60 backdrop-blur-md"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              className="kx-container pt-28 lg:pt-32"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={submitSearch} className="flex items-center gap-4 border-b border-gold/40 pb-5">
                <Search size={26} className="text-gold-light" strokeWidth={1.4} />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the maison..."
                  className="flex-1 bg-transparent font-display text-3xl text-ivory placeholder:text-ivory/35 focus:outline-none sm:text-5xl"
                />
                <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close">
                  <X size={26} className="text-ivory/60 hover:text-gold-light" />
                </button>
              </form>
              <div className="mt-5 max-h-[58vh] overflow-y-auto bg-white shadow-luxe">
                {!query && <p className="py-16 text-center text-sm text-ink-mute">Type to explore our fragrances, notes & collections</p>}
                {searching && <p className="py-16 text-center text-sm text-ink-mute">Searching...</p>}
                {!searching && query && results.length === 0 && <p className="py-16 text-center text-sm text-ink-mute">No results for "{query}"</p>}
                {results.map((p) => (
                  <Link key={p.id} to={`/product/${p.slug}`} onClick={() => setSearchOpen(false)} className="group flex items-center gap-5 border-b border-line-soft px-5 py-4 transition-all duration-300 hover:bg-ivory-2 hover:pl-7">
                    <div className="h-16 w-16 shrink-0 overflow-hidden border border-line bg-ivory-2">
                      {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" /> : <div className="h-full w-full" style={{ background: 'var(--ivory-3)' }} />}
                    </div>
                    <div className="flex-1">
                      <p className="font-display text-lg text-charcoal transition-colors group-hover:text-gold-deep">{p.name}</p>
                      <p className="text-xs text-ink-mute">{p.brand} · {p.volume_ml}ml</p>
                    </div>
                    <span className="font-display text-base text-gold-deep">{formatPrice(p.price)}</span>
                    <ArrowRight size={16} className="text-ink-mute transition-all group-hover:translate-x-1 group-hover:text-gold-deep" />
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-charcoal/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.42, ease: [0.16,1,0.3,1] }}
              className="fixed left-0 top-0 z-[80] h-full w-[84vw] max-w-sm border-r border-line bg-ivory lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-line-soft px-6 py-5">
                <BrandMark size="compact" />
                <button onClick={() => setMobileOpen(false)} aria-label="Close" className="text-charcoal hover:text-gold-deep"><X size={22} /></button>
              </div>
              <nav className="flex flex-col px-6">
                {NAV.map((l, i) => (
                  <motion.div key={l.to} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + i * 0.05 }}>
                    <Link to={l.to} onClick={() => setMobileOpen(false)} className="flex items-center justify-between border-b border-line-soft py-4 font-display text-2xl text-charcoal transition-colors hover:text-gold-deep">
                      {l.label}
                      <ChevronDown size={18} className="-rotate-90 text-ink-mute" />
                    </Link>
                  </motion.div>
                ))}
                <div className="mt-8 flex flex-col gap-3">
                  {user ? (
                    <>
                      <Link to="/account" onClick={() => setMobileOpen(false)} className="kx-btn-ghost w-full">My Account</Link>
                      {isAdmin && <Link to="/admin" onClick={() => setMobileOpen(false)} className="kx-btn-ghost w-full">Admin Panel</Link>}
                      <button onClick={onSignOut} className="kx-btn-ghost w-full text-danger">Sign Out</button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setMobileOpen(false)} className="kx-btn-solid w-full">Sign In</Link>
                      <Link to="/signup" onClick={() => setMobileOpen(false)} className="kx-btn-ghost w-full">Create Account</Link>
                    </>
                  )}
                </div>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function Dot({ count }: { count: number }) {
  return (
    <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center bg-gold px-1 text-[9px] font-semibold text-ivory">{count}</span>
  );
}
