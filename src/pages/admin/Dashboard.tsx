import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DollarSign, Package, Users, ShoppingBag, TrendingUp, AlertTriangle,
  ArrowRight, Star, Clock,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Order, Product, Profile } from '@/types';
import { formatPrice, formatDate } from '@/lib/format';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/constants';

interface DashboardData {
  revenue: number;
  orderCount: number;
  productCount: number;
  userCount: number;
  recentOrders: Order[];
  lowStock: Product[];
  pendingOrders: number;
  deliveredOrders: number;
  recentUsers: Profile[];
  totalReviews: number;
  avgRating: number;
  pendingReviews: number;
  approvedReviews: number;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [orders, products, users, recentOrders, reviews] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('products').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('product_reviews').select('rating, status'),
      ]);

      const allOrders = (orders.data as Order[]) || [];
      const allProducts = (products.data as Product[]) || [];
      const allUsers = (users.data as Profile[]) || [];
      const allReviews = (reviews.data as Array<{ rating: number; status: string }>) || [];
      const approvedReviews = allReviews.filter((r) => r.status === 'approved');

      setData({
        revenue: allOrders.filter((o) => o.order_status !== 'cancelled' && o.order_status !== 'declined' && o.order_status !== 'refund').reduce((s, o) => s + Number(o.total), 0),
        orderCount: allOrders.length,
        productCount: allProducts.length,
        userCount: allUsers.length,
        recentOrders: (recentOrders.data as Order[]) || [],
        lowStock: allProducts.filter((p) => p.stock <= 10).sort((a, b) => a.stock - b.stock).slice(0, 5),
        pendingOrders: allOrders.filter((o) => o.order_status === 'pending' || o.order_status === 'confirmed').length,
        deliveredOrders: allOrders.filter((o) => o.order_status === 'delivered').length,
        recentUsers: allUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5),
        totalReviews: allReviews.length,
        avgRating: approvedReviews.length > 0 ? approvedReviews.reduce((s, r) => s + r.rating, 0) / approvedReviews.length : 0,
        pendingReviews: allReviews.filter((r) => r.status === 'pending').length,
        approvedReviews: approvedReviews.length,
      });
      setLoading(false);
    })();
  }, []);

  if (loading || !data) {
    return <div className="grid h-64 place-items-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-700 border-t-gold" /></div>;
  }

  const stats = [
    { label: 'Total Revenue', value: formatPrice(data.revenue), Icon: DollarSign, color: 'text-gold' },
    { label: 'Total Orders', value: data.orderCount, Icon: ShoppingBag, color: 'text-sky-400' },
    { label: 'Pending Orders', value: data.pendingOrders, Icon: Clock, color: 'text-amber-400' },
    { label: 'Delivered Orders', value: data.deliveredOrders, Icon: Package, color: 'text-emerald-400' },
  ];
  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayOrders = data.recentOrders.length > 0 ? [] : [];
    return { label: d.toLocaleDateString('en-US', { weekday: 'short' }), value: dayOrders.length };
  });
  const allOrdersForGraph = data.recentOrders;
  const maxVal = Math.max(1, ...last7.map((d) => d.value));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-white">Dashboard</h1>
        <p className="mt-2 text-sm text-ink-400">Overview of your store's performance.</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="border border-ink-800 bg-black-card p-6"
          >
            <div className="flex items-center justify-between">
              <s.Icon className={`h-8 w-8 ${s.color}`} />
              <TrendingUp className="h-4 w-4 text-ink-600" />
            </div>
            <p className="mt-4 font-serif text-3xl text-white">{s.value}</p>
            <p className="mt-1 text-xs uppercase tracking-wide-sm text-ink-500">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Alerts */}
      {(data.pendingOrders > 0 || data.lowStock.length > 0 || data.pendingReviews > 0) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.pendingOrders > 0 && (
            <Link to="/admin/orders" className="flex items-center gap-4 border border-amber-500/30 bg-amber-500/5 p-5 transition-colors hover:bg-amber-500/10">
              <Clock className="h-8 w-8 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-white">{data.pendingOrders} order{data.pendingOrders !== 1 ? 's' : ''} need attention</p>
                <p className="text-xs text-ink-400">Review and update status</p>
              </div>
            </Link>
          )}
          {data.pendingReviews > 0 && (
            <Link to="/admin/reviews?status=pending" className="flex items-center gap-4 border border-amber-500/30 bg-amber-500/5 p-5 transition-colors hover:bg-amber-500/10">
              <Star className="h-8 w-8 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-white">{data.pendingReviews} review{data.pendingReviews !== 1 ? 's' : ''} pending approval</p>
                <p className="text-xs text-ink-400">Approve or reject customer reviews</p>
              </div>
            </Link>
          )}
          {data.lowStock.length > 0 && (
            <Link to="/admin/inventory" className="flex items-center gap-4 border border-rose-500/30 bg-rose-500/5 p-5 transition-colors hover:bg-rose-500/10">
              <AlertTriangle className="h-8 w-8 text-rose-400" />
              <div>
                <p className="text-sm font-medium text-white">{data.lowStock.length} product{data.lowStock.length !== 1 ? 's' : ''} low on stock</p>
                <p className="text-xs text-ink-400">Review inventory levels</p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Review stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Reviews', value: data.totalReviews, Icon: Star, color: 'text-gold' },
          { label: 'Average Rating', value: data.avgRating.toFixed(1), Icon: Star, color: 'text-gold' },
          { label: 'Pending Reviews', value: data.pendingReviews, Icon: Clock, color: 'text-amber-400' },
          { label: 'Approved Reviews', value: data.approvedReviews, Icon: Star, color: 'text-emerald-400' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="border border-ink-800 bg-black-card p-6"
          >
            <div className="flex items-center justify-between">
              <s.Icon className={`h-8 w-8 ${s.color}`} />
            </div>
            <p className="mt-4 font-serif text-3xl text-white">{s.value}</p>
            <p className="mt-1 text-xs uppercase tracking-wide-sm text-ink-500">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue graph (simple) */}
      <div className="border border-ink-800 bg-black-card p-6">
        <h2 className="mb-6 font-serif text-xl text-white">Recent Activity</h2>
        {allOrdersForGraph.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-500">No orders yet. Once orders come in, activity will appear here.</p>
        ) : (
          <div className="flex items-end justify-between gap-2" style={{ height: 200 }}>
            {last7.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-gold-dark to-gold transition-all duration-500"
                  style={{ height: `${(d.value / maxVal) * 100}%`, minHeight: d.value > 0 ? '8px' : '2px' }}
                />
                <span className="text-[10px] text-ink-500">{d.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <div className="border border-ink-800 bg-black-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl text-white">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-gold hover:text-gold-light">View All →</Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-500">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between border-b border-ink-800 pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-white">{o.order_number}</p>
                    <p className="text-xs text-ink-500">{o.customer_name} · {formatDate(o.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gold">{formatPrice(o.total)}</p>
                    <span className={`badge border ${ORDER_STATUS_COLORS[o.order_status]}`}>
                      {ORDER_STATUS_LABELS[o.order_status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="border border-ink-800 bg-black-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl text-white">Low Stock Alerts</h2>
            <Link to="/admin/inventory" className="text-xs text-gold hover:text-gold-light">View All →</Link>
          </div>
          {data.lowStock.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-500">All products well stocked.</p>
          ) : (
            <div className="space-y-3">
              {data.lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b border-ink-800 pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <p className="text-xs text-ink-500">{p.sku}</p>
                  </div>
                  <span className={`badge border ${p.stock === 0 ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Add Product', to: '/admin/products', Icon: Package },
          { label: 'Manage Orders', to: '/admin/orders', Icon: ShoppingBag },
          { label: 'View Reviews', to: '/admin/reviews', Icon: Star },
        ].map((a) => (
          <Link key={a.to} to={a.to} className="flex items-center justify-between border border-ink-800 bg-black-card p-5 transition-colors hover:border-gold/40">
            <div className="flex items-center gap-3">
              <a.Icon className="h-5 w-5 text-gold" />
              <span className="text-sm text-white">{a.label}</span>
            </div>
            <ArrowRight size={16} className="text-ink-500" />
          </Link>
        ))}
      </div>
    </div>
  );
}
