import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import ProductTile from '@/components/ProductTile';
import Seo from '@/components/Seo';
import EmptyGraphic from '@/components/EmptyGraphic';

export default function Wishlist() {
  const { user } = useAuth();
  const { products: wishProducts, productIds } = useWishlist();
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (user) {
        setDbProducts(Object.values(wishProducts));
      } else {
        if (productIds.length === 0) { setDbProducts([]); setLoading(false); return; }
        const { data } = await supabase.from('products').select('*').in('id', productIds);
        setDbProducts((data as Product[]) || []);
      }
      setLoading(false);
    })();
  }, [user, wishProducts, productIds]);

  return (
    <>
      <Seo title="Wishlist" />
      <section className="kx-container py-12 lg:py-16">
        <p className="kx-eyebrow">Saved For Later</p>
        <h1 className="mt-3 font-display text-5xl font-light text-charcoal">Your Wishlist</h1>
        <div className="kx-gold-line mt-5" />

        {loading ? (
          <div className="mt-14 grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4 lg:gap-7">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse bg-ivory-2" />)}
          </div>
        ) : dbProducts.length === 0 ? (
          <div className="py-24 text-center">
            <EmptyGraphic className="mx-auto" />
            <h2 className="mt-8 font-display text-3xl font-light text-charcoal">Your Wishlist Awaits</h2>
            <p className="mt-4 text-sm text-ink-soft">Save the fragrances you love to revisit them anytime.</p>
            <Link to="/shop" className="kx-btn-solid mt-10">Discover Fragrances <ArrowRight size={14} /></Link>
          </div>
        ) : (
          <>
            <p className="mt-6 text-sm text-ink-mute">{dbProducts.length} fragrance{dbProducts.length !== 1 ? 's' : ''} saved</p>
            <div className="mt-10 grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4 lg:gap-7">
              {dbProducts.map((p, i) => <ProductTile key={p.id} product={p} index={i} />)}
            </div>
          </>
        )}
      </section>
    </>
  );
}
