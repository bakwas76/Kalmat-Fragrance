import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice, formatDate } from '@/lib/format';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/constants';
import type { Order } from '@/types';
import Seo from '@/components/Seo';

export default function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setOrders((data as Order[]) || []);
      setLoading(false);
    })();
  }, [user]);

  if (!user) return null;

  return (
    <>
      <Seo title="Order History" />
      <section className="kx-container py-12 lg:py-16">
        <p className="kx-eyebrow">Your Purchases</p>
        <h1 className="mt-3 font-display text-5xl font-light text-charcoal">Order History</h1>
        <div className="kx-gold-line mt-5" />

        {loading ? (
          <div className="mt-12 space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse bg-ivory-2" />)}</div>
        ) : orders.length === 0 ? (
          <div className="mt-12 border border-line bg-ivory-2 py-20 text-center">
            <Package size={36} className="mx-auto text-gold/30" />
            <p className="mt-5 font-display text-2xl text-charcoal">No Orders Yet</p>
            <p className="mt-3 text-sm text-ink-mute">When you place your first order, it will appear here.</p>
            <Link to="/shop" className="kx-btn-solid mt-8">Browse Fragrances</Link>
          </div>
        ) : (
          <div className="mt-12 space-y-4">
            {orders.map((o) => (
              <Link key={o.id} to="/track-order" className="group block border border-line bg-white p-6 transition-all duration-300 hover:border-gold/30 hover:shadow-elevate">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-5">
                    <div className="grid h-12 w-12 place-items-center border border-line bg-ivory-2"><Package size={18} className="text-gold" /></div>
                    <div>
                      <p className="font-display text-lg text-charcoal group-hover:text-gold-deep">{o.order_number}</p>
                      <p className="text-xs text-ink-mute">{formatDate(o.created_at)}</p>
                    </div>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    {o.items.slice(0, 3).map((it, i) => (
                      <div key={i} className="h-12 w-10 overflow-hidden border border-line bg-ivory-2">
                        {it.image_url ? <img src={it.image_url} alt={it.name} className="h-full w-full object-cover" /> : <div className="h-full w-full" style={{ background: 'var(--ivory-3)' }} />}
                      </div>
                    ))}
                    {o.items.length > 3 && <span className="text-xs text-ink-mute">+{o.items.length - 3}</span>}
                  </div>
                  <span className={`badge px-3 py-1 text-[10px] uppercase ${ORDER_STATUS_COLORS[o.order_status] || ''}`} style={{ letterSpacing: '0.2em' }}>{ORDER_STATUS_LABELS[o.order_status]}</span>
                  <span className="font-display text-lg text-gold-deep">{formatPrice(o.total)}</span>
                  <ChevronRight size={18} className="text-ink-mute transition-transform group-hover:translate-x-1 group-hover:text-gold-deep" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
