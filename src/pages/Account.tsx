import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Package, Heart, ShoppingBag, ArrowRight, MapPin, ShieldCheck, LayoutGrid } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { formatPrice, formatDate } from '@/lib/format';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/constants';
import type { Order, SavedAddress } from '@/types';
import Seo from '@/components/Seo';

export default function Account() {
  const { user, profile, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const { productIds } = useWishlist();
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [ords, addrs] = await Promise.all([
        supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('addresses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      setOrders((ords.data as Order[]) || []);
      setAddresses((addrs.data as SavedAddress[]) || []);
    })();
  }, [user]);

  if (!user) return null;

  const initials = (profile?.full_name || user.email || 'K').charAt(0).toUpperCase();

  return (
    <>
      <Seo title="My Account" />
      <section className="kx-container py-12 lg:py-16">
        {/* Header card */}
        <div className="flex flex-col items-start gap-6 border-b border-line pb-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="grid h-16 w-16 place-items-center rounded-full border border-gold/30 bg-gold/5 font-display text-2xl italic text-gold">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name || ''} className="h-full w-full rounded-full object-cover" /> : initials}
            </div>
            <div>
              <p className="text-[10px] uppercase text-gold-deep" style={{ letterSpacing: '0.32em' }}>Welcome back</p>
              <h1 className="mt-1 font-display text-3xl font-light text-charcoal">{profile?.full_name || 'Member'}</h1>
              <p className="text-sm text-ink-mute">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/profile" className="kx-btn-ghost">Edit Profile</Link>
            {isAdmin && <Link to="/admin" className="kx-btn-solid"><LayoutGrid size={14} /> Admin</Link>}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { Icon: Package, label: 'Orders', value: orders.length, to: '/account/orders' },
            { Icon: Heart, label: 'Wishlist', value: productIds.length, to: '/wishlist' },
            { Icon: ShoppingBag, label: 'In Bag', value: itemCount, to: '/cart' },
            { Icon: MapPin, label: 'Addresses', value: addresses.length, to: '/profile' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06 }}>
              <Link to={s.to} className="group flex items-center gap-4 border border-line bg-white p-5 transition-all duration-300 hover:border-gold/30 hover:shadow-elevate">
                <s.Icon className="h-6 w-6 text-gold" strokeWidth={1.3} />
                <div><p className="font-display text-2xl text-charcoal">{s.value}</p><p className="text-[10px] uppercase text-ink-mute" style={{ letterSpacing: '0.24em' }}>{s.label}</p></div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Recent orders */}
        <div className="mt-12">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display text-2xl text-charcoal">Recent Orders</h2>
            <Link to="/account/orders" className="kx-arrow-link">View All <ArrowRight size={13} /></Link>
          </div>
          {orders.length === 0 ? (
            <div className="border border-line bg-ivory-2 py-16 text-center">
              <Package size={32} className="mx-auto text-gold/30" />
              <p className="mt-4 text-sm text-ink-mute">No orders yet</p>
              <Link to="/shop" className="kx-btn-ghost mt-5">Start Shopping</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <Link key={o.id} to={`/track-order`} className="group block border border-line bg-white p-5 transition-all duration-300 hover:border-gold/30 hover:shadow-elevate">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-display text-lg text-charcoal group-hover:text-gold-deep">{o.order_number}</p>
                      <p className="text-xs text-ink-mute">{formatDate(o.created_at)} · {o.items.length} item{o.items.length !== 1 ? 's' : ''}</p>
                    </div>
                    <span className={`badge px-3 py-1 text-[10px] uppercase ${ORDER_STATUS_COLORS[o.order_status] || ''}`} style={{ letterSpacing: '0.2em' }}>{ORDER_STATUS_LABELS[o.order_status]}</span>
                    <span className="font-display text-lg text-gold-deep">{formatPrice(o.total)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
