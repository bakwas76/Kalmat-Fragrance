import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, X, Tag, ArrowRight, Truck, ShoppingBag } from 'lucide-react';
import { useCart, getCartItemPrice, getCartItemStock } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants';
import type { Coupon } from '@/types';
import Seo from '@/components/Seo';
import EmptyGraphic from '@/components/EmptyGraphic';

export default function Cart() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items, removeItem, updateQuantity, subtotal, discount, shippingCost, tax, total, appliedCoupon, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const applyCode = async () => {
    if (!code.trim()) return;
    setBusy(true);
    const upper = code.trim().toUpperCase();
    const { data, error } = await supabase.from('coupons').select('*').eq('code', upper).eq('active', true).maybeSingle();
    if (error || !data) { toast('Invalid or expired coupon', 'error'); setBusy(false); return; }
    const coupon = data as Coupon;
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) { toast('This coupon has expired', 'error'); setBusy(false); return; }
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) { toast('This coupon has reached its usage limit', 'error'); setBusy(false); return; }
    if (subtotal < coupon.min_order) { toast(`Minimum order of ${formatPrice(coupon.min_order)} required`, 'error'); setBusy(false); return; }
    applyCoupon(coupon);
    toast('Coupon applied');
    setCode('');
    setBusy(false);
  };

  if (items.length === 0) {
    return (
      <>
        <Seo title="Your Bag" />
        <div className="kx-container py-32 text-center">
          <EmptyGraphic className="mx-auto" />
          <h1 className="mt-8 font-display text-4xl font-light text-charcoal">Your Bag is Empty</h1>
          <p className="mt-4 text-sm text-ink-soft">Discover a fragrance that tells your story.</p>
          <Link to="/shop" className="kx-btn-solid mt-10">Browse Fragrances <ArrowRight size={14} /></Link>
        </div>
      </>
    );
  }

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <>
      <Seo title="Your Bag" />
      <section className="kx-container py-12 lg:py-16">
        <p className="kx-eyebrow">The Bag</p>
        <h1 className="mt-3 font-display text-5xl font-light text-charcoal">Your Selection</h1>
        <div className="kx-gold-line mt-5" />

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
          {/* Items */}
          <div>
            {/* Free shipping progress */}
            <div className="mb-8 border border-line bg-ivory-2 p-5">
              <div className="flex items-center gap-2 text-sm text-ink-soft">
                <Truck size={16} className="text-gold" />
                {remaining > 0 ? <p>Add <span className="font-medium text-charcoal">{formatPrice(remaining)}</span> more for complimentary shipping</p> : <p className="text-gold-deep">You've unlocked complimentary shipping</p>}
              </div>
              <div className="mt-3 h-1 w-full bg-line">
                <div className="h-full bg-gold transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {items.map((item) => (
              <div key={`${item.product.id}-${item.variant?.id ?? 'default'}`} className="group flex gap-5 border-b border-line-soft py-6">
                <Link to={`/product/${item.product.slug}`} className="kx-img-frame h-32 w-24 shrink-0 border border-line bg-ivory-2">
                  {item.product.image_url ? (
                    <img src={item.product.image_url} alt={item.product.name} className="kx-img-zoom h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center" style={{ background: 'var(--ivory-3)' }}>
                      <span className="font-display text-2xl italic text-gold/30">{item.product.brand?.charAt(0)}</span>
                    </div>
                  )}
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] uppercase text-ink-mute" style={{ letterSpacing: '0.24em' }}>{item.product.brand}</p>
                      <Link to={`/product/${item.product.slug}`} className="font-display text-xl text-charcoal transition-colors hover:text-gold-deep">{item.product.name}</Link>
                      <p className="mt-1 text-xs text-ink-mute">{(item.variant?.size_label || `${item.product.volume_ml}ml`)} · {item.product.gender}</p>
                    </div>
                    <button onClick={() => removeItem(item.product.id, item.variant?.id ?? null)} className="text-ink-mute transition-colors hover:text-danger"><X size={18} /></button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <div className="flex items-center border border-line">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant?.id ?? null)} className="grid h-9 w-9 place-items-center text-charcoal transition-colors hover:text-gold-deep"><Minus size={13} /></button>
                      <span className="w-9 text-center text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant?.id ?? null)} disabled={item.quantity >= getCartItemStock(item)} className="grid h-9 w-9 place-items-center text-charcoal transition-colors hover:text-gold-deep disabled:opacity-30"><Plus size={13} /></button>
                    </div>
                    <span className="font-display text-lg text-charcoal">{formatPrice(getCartItemPrice(item) * item.quantity)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="border border-line bg-white p-8">
              <h2 className="font-display text-2xl text-charcoal">Order Summary</h2>
              <div className="kx-rule mt-5" />

              {/* Coupon */}
              {appliedCoupon ? (
                <div className="mt-6 flex items-center justify-between border border-gold/30 bg-gold/5 p-4">
                  <div className="flex items-center gap-2">
                    <Tag size={15} className="text-gold-deep" />
                    <div>
                      <p className="text-sm font-medium text-charcoal">{appliedCoupon.code}</p>
                      <p className="text-xs text-gold-deep">Discount applied</p>
                    </div>
                  </div>
                  <button onClick={removeCoupon} className="text-xs text-ink-mute hover:text-danger">Remove</button>
                </div>
              ) : (
                <div className="mt-6">
                  <p className="kx-field-label">Promo Code</p>
                  <div className="flex gap-2">
                    <input value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyCode()} placeholder="Enter code" className="kx-input text-sm uppercase" />
                    <button onClick={applyCode} disabled={busy} className="kx-btn-ghost px-5 py-3">{busy ? '...' : 'Apply'}</button>
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-3 text-sm">
                <Row label="Subtotal" value={formatPrice(subtotal)} />
                {discount > 0 && <Row label={`Discount${appliedCoupon ? ` (${appliedCoupon.code})` : ''}`} value={`−${formatPrice(discount)}`} className="text-gold-deep" />}
                <Row label="Shipping" value={shippingCost === 0 ? 'Complimentary' : formatPrice(shippingCost)} className={shippingCost === 0 ? 'text-gold-deep' : ''} />
                {tax > 0 && <Row label="Tax" value={formatPrice(tax)} />}
              </div>

              <div className="mt-5 flex justify-between border-t border-line-soft pt-5">
                <span className="font-display text-lg text-charcoal">Total</span>
                <span className="font-display text-xl text-gold-deep">{formatPrice(total)}</span>
              </div>

              <button onClick={() => navigate('/checkout')} className="kx-btn-solid mt-6 w-full">Proceed to Checkout <ArrowRight size={14} /></button>
              <Link to="/shop" className="mt-4 block text-center text-xs text-ink-mute underline-offset-4 hover:text-gold-deep hover:underline">Continue Shopping</Link>

              <div className="mt-6 flex items-center justify-center gap-2 text-[10px] uppercase text-ink-mute" style={{ letterSpacing: '0.2em' }}>
                <ShoppingBag size={12} /> Secure Checkout · Pakistan Delivery
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Row({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return <div className="flex justify-between"><span className="text-ink-soft">{label}</span><span className={className || 'text-charcoal'}>{value}</span></div>;
}
