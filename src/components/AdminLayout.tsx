import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, FolderTree, Tags, ShoppingBag, Users,
  Mail, Star, AlertTriangle, ClipboardList, ChevronLeft, Menu, X, Megaphone, GalleryHorizontalEnd,
} from 'lucide-react';
import BrandMark from './BrandMark';

const ADMIN_NAV = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Products', to: '/admin/products', icon: Package },
  { label: 'Inventory', to: '/admin/inventory', icon: ClipboardList },
  { label: 'Categories', to: '/admin/categories', icon: FolderTree },
  { label: 'Orders', to: '/admin/orders', icon: ShoppingBag },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Reviews', to: '/admin/reviews', icon: Star },
  { label: 'Coupons', to: '/admin/coupons', icon: Tags },
  { label: 'Messages', to: '/admin/messages', icon: Mail },
  { label: 'Newsletter', to: '/admin/newsletter', icon: Mail },
  { label: 'Announcement Banner', to: '/admin/announcement-banner', icon: Megaphone },
  { label: 'Hero Slider', to: '/admin/hero-slider', icon: GalleryHorizontalEnd },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (to: string, end?: boolean) =>
    end ? pathname === to : pathname.startsWith(to);

  const Sidebar = (
    <div className="flex h-full flex-col">
      <Link to="/admin" className="flex items-center justify-center border-b border-line p-6">
        <BrandMark size="compact" />
      </Link>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {ADMIN_NAV.map((item) => {
          const active = isActive(item.to, item.end);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center gap-3 rounded-luxe px-4 py-3 text-sm transition-all duration-200 ${
                active
                  ? 'bg-gold/8 font-medium text-gold'
                  : 'text-ink-300 hover:bg-bg-soft hover:text-ink-100'
              }`}
            >
              <item.icon
                size={18}
                className={`transition-colors ${active ? 'text-gold' : 'text-ink-400 group-hover:text-ink-200'}`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-line p-4">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-luxe px-4 py-2.5 text-sm text-ink-400 transition-colors hover:bg-bg-soft hover:text-ink-100"
        >
          <ChevronLeft size={16} /> Back to Store
        </Link>
      </div>
    </div>
  );

  return (
    <div className="admin-theme min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 border-r border-line bg-bg-card lg:block">
        {Sidebar}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-0 top-0 z-50 h-full w-72 border-r border-line bg-bg-card lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-4 top-6 text-ink-400 transition-colors hover:text-gold"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
              {Sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-bg-card/95 px-4 backdrop-blur-md lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-ink-300 transition-colors hover:text-gold lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <p className="hidden font-serif text-lg text-ink-100 lg:block">Admin Panel</p>
          <Link to="/" className="text-xs uppercase tracking-wide-sm text-ink-400 transition-colors hover:text-gold">
            View Store →
          </Link>
        </header>

        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
