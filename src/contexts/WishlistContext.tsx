import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types';
import { useAuth } from './AuthContext';

interface WishlistContextValue {
  productIds: string[];
  products: Record<string, Product>;
  loading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggle: (product: Product) => Promise<void>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

const LOCAL_KEY = 'kalmat_wishlist_local';

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [productIds, setProductIds] = useState<string[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(false);

  // Load local wishlist on mount (used for guests + before login loads)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) setProductIds(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  // Persist locally whenever ids change (guest safety net)
  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(productIds));
  }, [productIds]);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('wishlists')
      .select('product_id, product:products(*)')
      .eq('user_id', user.id);
    if (error) {
      console.error('wishlist load failed', error);
      setLoading(false);
      return;
    }
    const ids = (data || []).map((r) => r.product_id);
    const map: Record<string, Product> = {};
    (data || []).forEach((r) => {
      const p = (r as unknown as { product?: Product }).product;
      if (p) map[r.product_id] = p;
    });
    setProductIds(ids);
    setProducts(map);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      refresh();
    } else {
      // keep local ids but clear loaded products
      setProducts({});
    }
  }, [user, refresh]);

  const isWishlisted = (productId: string) => productIds.includes(productId);

  const toggle = useCallback(
    async (product: Product) => {
      if (user) {
        if (productIds.includes(product.id)) {
          await supabase
            .from('wishlists')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', product.id);
          setProductIds((prev) => prev.filter((id) => id !== product.id));
          setProducts((prev) => {
            const next = { ...prev };
            delete next[product.id];
            return next;
          });
        } else {
          await supabase
            .from('wishlists')
            .insert({ user_id: user.id, product_id: product.id });
          setProductIds((prev) => [...prev, product.id]);
          setProducts((prev) => ({ ...prev, [product.id]: product }));
        }
      } else {
        // guest toggle locally
        setProductIds((prev) =>
          prev.includes(product.id)
            ? prev.filter((id) => id !== product.id)
            : [...prev, product.id]
        );
        setProducts((prev) => {
          if (prev[product.id]) {
            const next = { ...prev };
            delete next[product.id];
            return next;
          }
          return { ...prev, [product.id]: product };
        });
      }
    },
    [user, productIds]
  );

  const value: WishlistContextValue = {
    productIds,
    products,
    loading,
    isWishlisted,
    toggle,
    refresh,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
