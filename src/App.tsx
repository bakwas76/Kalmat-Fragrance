import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { ToastProvider } from '@/contexts/ToastContext';
import SiteLayout from '@/components/SiteLayout';
import AdminLayout from '@/components/AdminLayout';
import type { ReactNode } from 'react';

const Home = lazy(() => import('@/pages/Home'));
const Shop = lazy(() => import('@/pages/Shop'));
const Collections = lazy(() => import('@/pages/Collections'));
const ProductDetails = lazy(() => import('@/pages/ProductDetails'));
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const Wishlist = lazy(() => import('@/pages/Wishlist'));
const Cart = lazy(() => import('@/pages/Cart'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const OrderSuccess = lazy(() => import('@/pages/OrderSuccess'));
const TrackOrder = lazy(() => import('@/pages/TrackOrder'));
const Login = lazy(() => import('@/pages/Login'));
const Signup = lazy(() => import('@/pages/Signup'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Account = lazy(() => import('@/pages/Account'));
const OrderHistory = lazy(() => import('@/pages/OrderHistory'));
const Profile = lazy(() => import('@/pages/Profile'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const Terms = lazy(() => import('@/pages/Terms'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));
const CompleteProfile = lazy(() => import('@/pages/CompleteProfile'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Admin
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('@/pages/admin/Products'));
const AdminCategories = lazy(() => import('@/pages/admin/Categories'));
const AdminOrders = lazy(() => import('@/pages/admin/Orders'));
const AdminUsers = lazy(() => import('@/pages/admin/Users'));
const AdminCoupons = lazy(() => import('@/pages/admin/Coupons'));
const AdminReviews = lazy(() => import('@/pages/admin/Reviews'));
const AdminMessages = lazy(() => import('@/pages/admin/Messages'));
const AdminNewsletter = lazy(() => import('@/pages/admin/Newsletter'));
const AdminInventory = lazy(() => import('@/pages/admin/Inventory'));
const AdminAnnouncementBanner = lazy(() => import('@/pages/admin/AnnouncementBanner'));
const AdminHeroSlider = lazy(() => import('@/pages/admin/HeroSlider'));

function PageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-700 border-t-gold" />
        <p className="text-xs uppercase tracking-luxe text-ink-500">Loading</p>
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <WishlistProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route element={<SiteLayout />}>
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/complete-profile" element={<RequireAuth><CompleteProfile /></RequireAuth>} />
                    <Route path="/" element={<Home />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/collections" element={<Collections />} />
                    <Route path="/product/:slug" element={<ProductDetails />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order-success" element={<OrderSuccess />} />
                    <Route path="/track-order" element={<TrackOrder />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<Terms />} />

                    {/* Protected account routes */}
                    <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
                    <Route path="/account/orders" element={<RequireAuth><OrderHistory /></RequireAuth>} />
                    <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                  </Route>

                  {/* Admin */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="coupons" element={<AdminCoupons />} />
                    <Route path="reviews" element={<AdminReviews />} />
                    <Route path="messages" element={<AdminMessages />} />
                    <Route path="newsletter" element={<AdminNewsletter />} />
                    <Route path="inventory" element={<AdminInventory />} />
                    <Route path="announcement-banner" element={<AdminAnnouncementBanner />} />
                    <Route path="hero-slider" element={<AdminHeroSlider />} />
                  </Route>

                  <Route path="*" element={<SiteLayout />}>
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </Suspense>
            </WishlistProvider>
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
