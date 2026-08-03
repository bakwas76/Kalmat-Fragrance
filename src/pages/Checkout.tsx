import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Lock, Banknote, ChevronRight, Loader2, Smartphone, MessageCircle, Upload, X, Copy, Check } from 'lucide-react';
import type { AddressData, OrderItem, PaymentMethod } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { formatPrice, generateOrderNumber, slugify } from '@/lib/format';
import { generateInvoicePdf } from '@/lib/invoice';
import { PAKISTAN_CITIES, MANUAL_PAYMENT } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import Seo from '@/components/Seo';

interface CheckoutForm {
  customer_name: string;
  email: string;
  phone: string;
  shipping_address_line: string;
  shipping_city: string;
  shipping_country: string;
  shipping_postal_code: string;
  same_as_shipping: boolean;
  billing_address_line: string;
  billing_city: string;
  billing_country: string;
  billing_postal_code: string;
  payment_method: PaymentMethod;
  notes: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { items, subtotal, discount, shippingCost, tax, total, couponCode, clearCart } = useCart();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutForm>({
    defaultValues: { customer_name: '', email: user?.email || '', same_as_shipping: true, payment_method: 'manual', shipping_country: 'Pakistan', billing_country: 'Pakistan' },
  });

  const sameAsShipping = watch('same_as_shipping');
  const paymentMethod = watch('payment_method');
  const [placing, setPlacing] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (items.length === 0) {
    return (
      <>
        <Seo title="Checkout" />
        <div className="kx-container py-32 text-center">
          <h1 className="font-display text-4xl font-light text-charcoal">Your Bag is Empty</h1>
          <p className="mt-4 text-sm text-ink-soft">Add a fragrance before checking out.</p>
          <Link to="/shop" className="kx-btn-solid mt-8">Browse Fragrances</Link>
        </div>
      </>
    );
  }

  const handleReceiptSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Please select an image file', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { toast('Receipt image must be under 5MB', 'error'); return; }
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  };

  const removeReceipt = () => {
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptFile(null); setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyAccount = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1800);
    toast(`${label} copied`);
  };

  const onSubmit = async (data: CheckoutForm) => {
    setPlacing(true);
    const orderNumber = generateOrderNumber();
    const shippingAddress: AddressData = { full_name: data.customer_name, phone: data.phone, email: data.email, address_line: data.shipping_address_line, city: data.shipping_city, country: 'Pakistan', postal_code: data.shipping_postal_code };
    const billingAddress: AddressData = data.same_as_shipping ? shippingAddress : { full_name: data.customer_name, phone: data.phone, email: data.email, address_line: data.billing_address_line, city: data.billing_city, country: 'Pakistan', postal_code: data.billing_postal_code };
    const orderItems: OrderItem[] = items.map((item) => ({
      product_id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      price: item.variant ? item.variant.price : item.product.price,
      quantity: item.quantity,
      bottle_shape: item.product.bottle_shape,
      bottle_glass: item.product.bottle_glass,
      bottle_cap: item.product.bottle_cap,
      bottle_label: item.product.bottle_label,
      volume_ml: item.variant ? item.variant.volume_ml : item.product.volume_ml,
      image_url: item.product.image_url,
      variant_id: item.variant?.id ?? null,
      variant_label: item.variant?.size_label ?? null,
    }));

    let pdfBase64: string | undefined;
    try {
      const doc = await generateInvoicePdf({ orderNumber, customerName: data.customer_name, email: data.email, phone: data.phone, shippingAddress, billingAddress, items: orderItems, subtotal, discount, shippingCost, tax, total, paymentMethod: data.payment_method, notes: data.notes || null, createdAt: new Date().toISOString() });
      const ab = doc.output('arraybuffer');
      pdfBase64 = btoa(new Uint8Array(ab).reduce((s, b) => s + String.fromCharCode(b), ''));
    } catch (err) { console.error('PDF failed', err); }

    if (data.payment_method !== 'cod' && !receiptFile) { toast('Please upload your payment receipt', 'error'); setPlacing(false); return; }

    let receiptUrl: string | null = null;
    if (receiptFile) {
      setUploading(true);
      const ext = receiptFile.name.split('.').pop() || 'jpg';
      const fileName = `receipt-${slugify(data.customer_name || 'customer')}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('payment-receipts').upload(fileName, receiptFile, { cacheControl: '3600' });
      setUploading(false);
      if (upErr) { toast(`Receipt upload failed: ${upErr.message}`, 'error'); setPlacing(false); return; }
      const { data: pub } = supabase.storage.from('payment-receipts').getPublicUrl(fileName);
      receiptUrl = pub.publicUrl;
    }

    // const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/place-order`;
    const functionUrl =
  `${import.meta.env.VITE_SUPABASE_URL || "https://dwcckjvpzobpabielbsz.supabase.co"}/functions/v1/place-order`;
    const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3Y2NranZwem9icGFiaWVsYnN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMjk2MjEsImV4cCI6MjEwMDcwNTYyMX0.ikenSo4oHY9_V9h7WHlpnPLnJ2-kZD6cNARaazN5DHI";

    
    try {
      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ order_number: orderNumber, user_id: user?.id || null, customer_name: data.customer_name, email: data.email, phone: data.phone, billing_address: billingAddress, shipping_address: shippingAddress, items: orderItems, subtotal, discount, shipping_cost: shippingCost, tax, total, payment_method: data.payment_method, payment_receipt_url: receiptUrl, coupon_code: couponCode, notes: data.notes || null, pdf_base64: pdfBase64 }),
      });
      if (!res.ok) { const eb = await res.json().catch(() => ({})); throw new Error(eb.error || `Request failed (${res.status})`); }
      const result = (await res.json()) as { order: { id: string; order_number: string }; whatsapp_url: string };
      sessionStorage.setItem('last_order', JSON.stringify({ orderNumber: result.order.order_number, orderId: result.order.id, whatsappUrl: result.whatsapp_url, pdfBase64, total, email: data.email, customerName: data.customer_name, paymentMethod: data.payment_method, phone: data.phone, address: data.shipping_address_line, city: data.shipping_city, items: orderItems.map((i) => ({ name: i.name, quantity: i.quantity })), orderTime: new Date().toISOString() }));
      clearCart();
      navigate('/order-success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Order failed. Please try again.', 'error');
    } finally { setPlacing(false); }
  };

  return (
    <>
      <Seo title="Checkout" />
      <section className="kx-container py-12 lg:py-16">
        <div className="flex items-center gap-2 text-[10px] uppercase text-ink-mute" style={{ letterSpacing: '0.2em' }}>
          <Link to="/cart" className="hover:text-gold-deep">Bag</Link><ChevronRight size={12} /><span className="text-charcoal">Checkout</span>
        </div>
        <h1 className="mt-4 font-display text-5xl font-light text-charcoal">Checkout</h1>
        <div className="kx-gold-line mt-5" />

        <form onSubmit={handleSubmit(onSubmit)} className="mt-12 grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-14">
          <div className="space-y-10">
            {/* Contact */}
            <FormSection num="01" title="Contact Information">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full Name" error={errors.customer_name?.message} className="sm:col-span-2">
                  <input {...register('customer_name', { required: 'Name is required' })} className="kx-input" placeholder="e.g. Ahmed Khan" />
                </Field>
                <Field label="Email" error={errors.email?.message}>
                  <input type="email" {...register('email', { required: 'Email is required' })} className="kx-input" placeholder="you@email.com" />
                </Field>
                <Field label="Phone" error={errors.phone?.message}>
                  <input {...register('phone', { required: 'Phone is required' })} className="kx-input" placeholder="03XX-XXXXXXX" />
                </Field>
              </div>
            </FormSection>

            {/* Shipping */}
            <FormSection num="02" title="Shipping Address">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Street Address" error={errors.shipping_address_line?.message} className="sm:col-span-2">
                  <input {...register('shipping_address_line', { required: 'Address is required' })} className="kx-input" placeholder="House #, Street, Area" />
                </Field>
                <Field label="City" error={errors.shipping_city?.message}>
                  <select {...register('shipping_city', { required: 'City is required' })} className="kx-select" defaultValue="">
                    <option value="" disabled>Select your city</option>
                    {PAKISTAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Postal Code" error={errors.shipping_postal_code?.message}>
                  <input {...register('shipping_postal_code', { required: 'Postal code is required' })} className="kx-input" placeholder="e.g. 54000" />
                </Field>
                <Field label="Country" className="sm:col-span-2">
                  <input value="Pakistan" disabled className="kx-input opacity-50" />
                  <input type="hidden" {...register('shipping_country')} value="Pakistan" />
                </Field>
              </div>
            </FormSection>

            {/* Billing */}
            <FormSection num="03" title="Billing Address">
              <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-soft">
                <input type="checkbox" {...register('same_as_shipping')} className="h-4 w-4 accent-gold" />
                Billing address is the same as shipping
              </label>
              {!sameAsShipping && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Field label="Street Address" className="sm:col-span-2"><input {...register('billing_address_line', { required: !sameAsShipping })} className="kx-input" placeholder="House #, Street, Area" /></Field>
                  <Field label="City"><select {...register('billing_city', { required: !sameAsShipping })} className="kx-select" defaultValue=""><option value="" disabled>Select city</option>{PAKISTAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
                  <Field label="Postal Code"><input {...register('billing_postal_code', { required: !sameAsShipping })} className="kx-input" placeholder="e.g. 54000" /></Field>
                  <Field label="Country" className="sm:col-span-2"><input value="Pakistan" disabled className="kx-input opacity-50" /><input type="hidden" {...register('billing_country')} value="Pakistan" /></Field>
                </motion.div>
              )}
            </FormSection>

            {/* Payment */}
            <FormSection num="04" title="Payment Method">
              <div className="space-y-3">
                <label className="kx-radio-card" data-active={paymentMethod === 'cod'}>
                  <input type="radio" value="cod" {...register('payment_method')} className="accent-gold" />
                  <Banknote className="h-5 w-5 text-gold-deep" />
                  <div className="flex-1"><p className="text-sm font-medium text-charcoal">Cash on Delivery</p><p className="text-xs text-ink-mute">Pay in cash when your order arrives</p></div>
                </label>
                <label className="kx-radio-card" data-active={paymentMethod === 'manual'}>
                  <input type="radio" value="manual" {...register('payment_method')} className="accent-gold" />
                  <Smartphone className="h-5 w-5 text-gold-deep" />
                  <div className="flex-1"><p className="text-sm font-medium text-charcoal">Manual Payment (JazzCash / Easypaisa / Bank)</p><p className="text-xs text-ink-mute">Pay via mobile transfer or bank deposit</p></div>
                </label>
              </div>

              {paymentMethod === 'manual' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-5 overflow-hidden">
                  <div className="border border-gold/25 bg-gold/5 p-5">
                    <p className="text-[10px] uppercase text-gold-deep" style={{ letterSpacing: '0.24em' }}>Payment Details</p>
                    <div className="mt-4 space-y-4 text-sm">
                      <DetailRow label="Receiver Name" value={MANUAL_PAYMENT.accountHolder} onCopy={() => copyAccount(MANUAL_PAYMENT.accountHolder, 'Receiver name')} copied={copied === 'Receiver name'} />
                      <div className="kx-rule-soft" />
                      <DetailRow label="JazzCash Number" value={MANUAL_PAYMENT.jazzcashNumber} onCopy={() => copyAccount(MANUAL_PAYMENT.jazzcashNumber, 'JazzCash number')} copied={copied === 'JazzCash number'} />
                      <div className="kx-rule-soft" />
                      <DetailRow label="Amount to Send" value={formatPrice(total)} onCopy={() => copyAccount(String(total), 'Amount')} copied={copied === 'Amount'} valueClass="text-gold-deep" />
                    </div>
                    <p className="mt-4 border-t border-line-soft pt-4 text-xs leading-relaxed text-ink-soft">You can send the payment using JazzCash, Easypaisa, or any Pakistani bank account/app. The payment must be transferred to the JazzCash account above.</p>
                  </div>

                  <div className="mt-4 border border-success/20 bg-success/5 p-5">
                    <div className="flex items-start gap-2">
                      <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <p className="text-xs leading-relaxed text-ink-soft">After sending the payment, upload your receipt and send it on WhatsApp for verification. Your order will be processed after verification.</p>
                    </div>
                    <a href={MANUAL_PAYMENT.whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-4 flex w-full items-center justify-center gap-2 border border-success/40 bg-success/10 py-3 text-sm text-success transition-colors hover:bg-success/20">
                      <MessageCircle size={16} /> Send Receipt on WhatsApp
                    </a>
                  </div>

                  <div className="mt-5">
                    <p className="kx-field-label">Upload Payment Receipt <span className="text-danger">*</span></p>
                    <p className="mb-3 text-xs text-ink-mute">Upload a screenshot of your payment confirmation</p>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleReceiptSelect} className="hidden" />
                    {receiptPreview ? (
                      <div className="relative overflow-hidden border border-gold/30 bg-ivory-2">
                        <img src={receiptPreview} alt="Receipt" className="max-h-56 w-full object-contain" />
                        <button type="button" onClick={removeReceipt} className="absolute right-2 top-2 grid h-7 w-7 place-items-center bg-charcoal text-ivory hover:text-danger"><X size={14} /></button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex w-full flex-col items-center gap-2 border border-dashed border-line bg-ivory-2 py-10 text-ink-mute transition-colors hover:border-gold hover:text-gold-deep">
                        {uploading ? <><Loader2 size={24} className="animate-spin" /><span className="text-xs">Uploading...</span></> : <><Upload size={24} /><span className="text-xs">Click to upload receipt image</span></>}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              <div className="mt-5">
                <p className="kx-field-label">Order Notes (optional)</p>
                <textarea rows={3} {...register('notes')} className="kx-textarea" placeholder="Delivery instructions, gift wrap, etc." />
              </div>
            </FormSection>
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="border border-line bg-white p-7">
              <h2 className="font-display text-xl text-charcoal">Order Summary</h2>
              <div className="kx-rule mt-4" />
              <div className="mt-5 space-y-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-4">
                    <div className="h-16 w-12 shrink-0 overflow-hidden border border-line bg-ivory-2">
                      {item.product.image_url ? <img src={item.product.image_url} alt={item.product.name} className="h-full w-full object-cover" /> : <div className="h-full w-full" style={{ background: 'var(--ivory-3)' }} />}
                    </div>
                    <div className="flex-1"><p className="text-sm text-charcoal line-clamp-1">{item.product.name}</p><p className="text-xs text-ink-mute">Qty {item.quantity} · {item.variant?.size_label || `${item.product.volume_ml}ml`}</p></div>
                    <span className="text-sm text-charcoal">{formatPrice((item.variant?.price ?? item.product.price) * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-3 border-t border-line-soft pt-5 text-sm">
                <div className="flex justify-between"><span className="text-ink-soft">Subtotal</span><span className="text-charcoal">{formatPrice(subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between text-gold-deep"><span>Discount{couponCode && ` (${couponCode})`}</span><span>−{formatPrice(discount)}</span></div>}
                <div className="flex justify-between"><span className="text-ink-soft">Shipping</span><span className={shippingCost === 0 ? 'text-gold-deep' : 'text-charcoal'}>{shippingCost === 0 ? 'Complimentary' : formatPrice(shippingCost)}</span></div>
                {tax > 0 && <div className="flex justify-between"><span className="text-ink-soft">Tax</span><span className="text-charcoal">{formatPrice(tax)}</span></div>}
              </div>
              <div className="mt-5 flex justify-between border-t border-line-soft pt-5">
                <span className="font-display text-lg text-charcoal">Total</span>
                <span className="font-display text-xl text-gold-deep">{formatPrice(total)}</span>
              </div>
              <button type="submit" disabled={placing || uploading} className="kx-btn-solid mt-6 w-full">
                {placing || uploading ? <><Loader2 size={15} className="animate-spin" /> {uploading ? 'Uploading receipt...' : 'Placing Order...'}</> : <><Lock size={14} /> Place Order</>}
              </button>
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] uppercase text-ink-mute" style={{ letterSpacing: '0.2em' }}>
                <Lock size={11} /> Secure checkout · Pakistan delivery
              </div>
            </div>
          </div>
        </form>
      </section>
    </>
  );
}

function FormSection({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line pt-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="font-display text-sm italic text-gold/50">{num}</span>
        <h2 className="font-display text-2xl text-charcoal">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, error, children, className = '' }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="kx-field-label">{label}</p>
      {children}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}

function DetailRow({ label, value, onCopy, copied, valueClass = '' }: { label: string; value: string; onCopy: () => void; copied: boolean; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div><p className="text-[10px] uppercase text-ink-mute" style={{ letterSpacing: '0.2em' }}>{label}</p><p className={`mt-0.5 ${valueClass || 'text-charcoal'}`}>{value}</p></div>
      <button type="button" onClick={onCopy} className="shrink-0 text-ink-mute hover:text-gold-deep">{copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}</button>
    </div>
  );
}
