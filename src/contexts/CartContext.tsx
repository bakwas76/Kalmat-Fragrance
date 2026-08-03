import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartItem, Product, ProductVariant, Coupon } from '@/types';
import { SHIPPING_FLAT_RATE, FREE_SHIPPING_THRESHOLD, TAX_RATE } from '@/lib/constants';

function cartKey(productId: string, variantId?: string | null) {
  return variantId ? `${productId}::${variantId}` : productId;
}

function effectivePrice(item: CartItem): number {
  if (item.variant) return item.variant.price;
  return item.product.price;
}

function effectiveCompareAt(item: CartItem): number | null {
  if (item.variant) return item.variant.compare_at_price;
  return item.product.compare_at_price;
}

function effectiveStock(item: CartItem): number {
  if (item.variant) return item.variant.stock;
  return item.product.stock;
}

function effectiveVolume(item: CartItem): number {
  if (item.variant) return item.variant.volume_ml;
  return item.product.volume_ml;
}

export interface CartLineSnapshot {
  productId: string;
  variantId: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  volumeMl: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, variant?: ProductVariant | null) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string | null) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  appliedCoupon: Coupon | null;
  couponCode: string | null;
  applyCoupon: (coupon: Coupon) => void;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = 'kalmat_cart';
const COUPON_KEY = 'kalmat_coupon';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    try {
      const raw = localStorage.getItem(COUPON_KEY);
      return raw ? (JSON.parse(raw) as Coupon) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem(COUPON_KEY, JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem(COUPON_KEY);
    }
  }, [appliedCoupon]);

  const addItem = (product: Product, quantity = 1, variant: ProductVariant | null = null) => {
    setItems((prev) => {
      const key = cartKey(product.id, variant?.id);
      const existing = prev.find((i) => cartKey(i.product.id, i.variant?.id) === key);
      const stock = variant ? variant.stock : product.stock;
      if (existing) {
        return prev.map((i) =>
          cartKey(i.product.id, i.variant?.id) === key
            ? { ...i, quantity: Math.min(i.quantity + quantity, stock) }
            : i
        );
      }
      return [...prev, { product, quantity: Math.min(quantity, stock), variant }];
    });
  };

  const removeItem = (productId: string, variantId: string | null = null) => {
    const key = cartKey(productId, variantId);
    setItems((prev) => prev.filter((i) => cartKey(i.product.id, i.variant?.id) !== key));
  };

  const updateQuantity = (productId: string, quantity: number, variantId: string | null = null) => {
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }
    const key = cartKey(productId, variantId);
    setItems((prev) =>
      prev.map((i) => {
        if (cartKey(i.product.id, i.variant?.id) !== key) return i;
        const stock = i.variant ? i.variant.stock : i.product.stock;
        return { ...i, quantity: Math.min(quantity, stock) };
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = (coupon: Coupon) => setAppliedCoupon(coupon);
  const removeCoupon = () => setAppliedCoupon(null);

  const { subtotal, itemCount, discount, shippingCost, tax, total } = useMemo(() => {
    const sub = items.reduce((sum, i) => sum + effectivePrice(i) * i.quantity, 0);
    const count = items.reduce((sum, i) => sum + i.quantity, 0);

    let disc = 0;
    if (appliedCoupon && sub >= appliedCoupon.min_order) {
      if (appliedCoupon.type === 'percent') {
        disc = (sub * appliedCoupon.value) / 100;
        if (appliedCoupon.max_discount) {
          disc = Math.min(disc, appliedCoupon.max_discount);
        }
      } else {
        disc = Math.min(appliedCoupon.value, sub);
      }
    }

    const afterDiscount = Math.max(sub - disc, 0);
    const shipping =
      afterDiscount === 0 ? 0 : afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
    const taxAmt = afterDiscount * TAX_RATE;
    const grand = afterDiscount + shipping + taxAmt;

    return {
      subtotal: sub,
      itemCount: count,
      discount: disc,
      shippingCost: shipping,
      tax: taxAmt,
      total: grand,
    };
  }, [items, appliedCoupon]);

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    itemCount,
    subtotal,
    discount,
    shippingCost,
    tax,
    total,
    appliedCoupon,
    couponCode: appliedCoupon?.code ?? null,
    applyCoupon,
    removeCoupon,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const getCartLineSnapshot = (item: CartItem): CartLineSnapshot => ({
  productId: item.product.id,
  variantId: item.variant?.id ?? null,
  price: effectivePrice(item),
  compareAtPrice: effectiveCompareAt(item),
  stock: effectiveStock(item),
  volumeMl: effectiveVolume(item),
  quantity: item.quantity,
});

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components
export function getCartItemPrice(item: CartItem): number {
  return effectivePrice(item);
}

// eslint-disable-next-line react-refresh/only-export-components
export function getCartItemStock(item: CartItem): number {
  return effectiveStock(item);
}

// eslint-disable-next-line react-refresh/only-export-components
export function getCartItemVolume(item: CartItem): number {
  return effectiveVolume(item);
}
