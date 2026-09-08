import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Package,
  Loader2,
  MapPin,
  Phone,
  Check,
  Truck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';
import { formatPrice, formatDate } from '@/lib/format';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_FLOW,
  NON_PROGRESSIVE_STATUSES,
} from '@/lib/constants';
import type { Order } from '@/types';
import Seo from '@/components/Seo';

export default function TrackOrder() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [orderNumber, setOrderNumber] = useState(
    searchParams.get('order') || ''
  );

  const [email, setEmail] = useState(() => {
    const emailFromUrl = searchParams.get('email');

    if (emailFromUrl) {
      return emailFromUrl;
    }

    try {
      const raw = sessionStorage.getItem('last_order');

      if (raw) {
        return (JSON.parse(raw) as { email?: string }).email || '';
      }
    } catch {
      // ignore
    }

    return '';
  });

  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderNumber.trim() || !email.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const { data, error: rpcError } =
        await supabase.functions.invoke('track-order', {
          body: {
            order_num: orderNumber.trim().toUpperCase(),
            email_input: email.trim().toLowerCase(),
          },
        });

      if (rpcError) {
        toast(
          'Could not find your order. Please check your details.',
          'error'
        );
        setOrder(null);
      } else if (!data) {
        toast('No order found with those details.', 'error');
        setOrder(null);
      } else {
        setOrder(data as Order);
      }
    } catch {
      toast('Something went wrong. Try again.', 'error');
      setOrder(null);
    }

    setLoading(false);
  };

  const currentStep = order
    ? ORDER_STATUS_FLOW.indexOf(order.order_status)
    : -1;

  const isNonProgressive = order
    ? NON_PROGRESSIVE_STATUSES.includes(order.order_status)
    : false;

  return (
    <>
      <Seo title="Track Order" />

      <section className="kx-container w-full max-w-full overflow-x-hidden py-12 lg:py-16">
        <p className="kx-eyebrow">Order Tracking</p>

        <h1 className="mt-3 font-display text-5xl font-light text-charcoal">
          Track Your Order
        </h1>

        <div className="kx-gold-line mt-5" />

        {/* Search */}
        <div className="mx-auto mt-12 w-full max-w-lg">
          <form
            onSubmit={onSearch}
            className="border border-line bg-white p-6 sm:p-8"
          >
            <div className="space-y-5">
              <div>
                <p className="kx-field-label">Order Number</p>

                <input
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="kx-input w-full max-w-full"
                  placeholder="e.g. KLM-ABCDE1234"
                />
              </div>

              <div>
                <p className="kx-field-label">Email Address</p>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="kx-input w-full max-w-full"
                  placeholder="The email used at checkout"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="kx-btn-solid w-full"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={14} />
                    Track Order
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Order */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto mt-10 w-full max-w-2xl"
          >
            <div className="w-full max-w-full overflow-hidden border border-line bg-white p-5 sm:p-8">
              {/* Header */}
              <div className="flex flex-col gap-4 border-b border-line-soft pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="break-all font-display text-2xl text-charcoal">
                    {order.order_number}
                  </p>

                  <p className="text-xs text-ink-mute">
                    {formatDate(order.created_at)}
                  </p>
                </div>

                <span
                  className={`badge w-fit px-3 py-1 text-[10px] uppercase ${
                    ORDER_STATUS_COLORS[order.order_status] || ''
                  }`}
                  style={{ letterSpacing: '0.2em' }}
                >
                  {ORDER_STATUS_LABELS[order.order_status]}
                </span>
              </div>

              {/* Stepper / status notice */}
              {isNonProgressive ? (
                <div
                  className={`mt-8 flex items-start gap-3 border p-4 ${
                    ORDER_STATUS_COLORS[order.order_status]
                  }`}
                >
                  <Package size={20} className="mt-0.5 shrink-0" />

                  <p className="text-sm font-medium">
                    This order has been marked as{' '}
                    {ORDER_STATUS_LABELS[order.order_status]}.
                  </p>
                </div>
              ) : (
                /*
                 * RESPONSIVE ORDER STEPPER
                 *
                 * Mobile:
                 * 3 columns × 2 rows
                 *
                 * Desktop:
                 * 6 columns in one row
                 */
                <div className="mt-8 w-full max-w-full overflow-hidden">
                  <div className="grid w-full grid-cols-3 gap-x-1 gap-y-7 sm:flex sm:items-start sm:justify-between sm:gap-0">
                    {ORDER_STATUS_FLOW.map((status, i) => {
                      const isCompleted = i < currentStep;
                      const isCurrent = i === currentStep;
                      const isActive = i <= currentStep;

                      return (
                        <div
                          key={status}
                          className="flex min-w-0 flex-col items-center text-center sm:flex-1"
                        >
                          {/* Circle */}
                          <div
                            className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-all duration-300 sm:h-10 sm:w-10 ${
                              isActive
                                ? 'border-gold bg-gold text-ivory'
                                : 'border-line bg-white text-ink-mute'
                            }`}
                          >
                            {isCompleted ? (
                              <Check size={14} />
                            ) : isCurrent ? (
                              <Package size={14} />
                            ) : (
                              <span className="text-[10px]">
                                {i + 1}
                              </span>
                            )}
                          </div>

                          {/* Label */}
                          <p
                            className={`mt-3 w-full max-w-[90px] break-words text-center text-[8px] uppercase leading-[1.35] sm:max-w-[110px] sm:text-[9px] ${
                              isActive
                                ? 'text-charcoal'
                                : 'text-ink-mute'
                            }`}
                            style={{
                              letterSpacing: '0.12em',
                            }}
                          >
                            {ORDER_STATUS_LABELS[status]}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="mt-8 border-t border-line-soft pt-6">
                <p className="kx-label mb-4">Items</p>

                <div className="space-y-4">
                  {order.items.map((it, i) => (
                    <div
                      key={i}
                      className="flex min-w-0 items-center gap-3 sm:gap-4"
                    >
                      {/* Product image */}
                      <div className="h-14 w-11 shrink-0 overflow-hidden border border-line bg-ivory-2">
                        {it.image_url ? (
                          <img
                            src={it.image_url}
                            alt={it.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div
                            className="h-full w-full"
                            style={{
                              background: 'var(--ivory-3)',
                            }}
                          />
                        )}
                      </div>

                      {/* Product info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-charcoal">
                          {it.name}
                        </p>

                        <p className="text-xs text-ink-mute">
                          Qty {it.quantity} ·{' '}
                          {it.variant_label ||
                            `${it.volume_ml}ml`}
                        </p>
                      </div>

                      {/* Price */}
                      <span className="shrink-0 text-sm text-charcoal">
                        {formatPrice(it.price * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping */}
              <div className="mt-6 grid gap-5 border-t border-line-soft pt-6 sm:grid-cols-2">
                <div className="min-w-0">
                  <p className="kx-label mb-2">
                    Shipping Address
                  </p>

                  <div className="flex items-start gap-2 text-sm text-ink-soft">
                    <MapPin
                      size={14}
                      className="mt-0.5 shrink-0 text-gold"
                    />

                    <span className="break-words">
                      {order.shipping_address.address_line},{' '}
                      {order.shipping_address.city},{' '}
                      {order.shipping_address.postal_code}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
                    <Phone
                      size={14}
                      className="shrink-0 text-gold"
                    />

                    <span>{order.phone}</span>
                  </div>
                </div>

                <div className="min-w-0 sm:text-right">
                  <p className="kx-label mb-2">Order Total</p>

                  <p className="break-words font-display text-2xl text-gold-deep">
                    {formatPrice(order.total)}
                  </p>
                </div>
              </div>

              {/* Courier tracking */}
              {order.courier_tracking_url && (
                <div className="mt-6 border-t border-line-soft pt-6">
                  <a
                    href={order.courier_tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="kx-btn-solid flex w-full items-center justify-center gap-2"
                  >
                    <Truck size={14} />
                    Track with Courier
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* No order */}
        {searched && !order && !loading && (
          <div className="mx-auto mt-8 w-full max-w-lg border border-line bg-ivory-2 py-12 text-center">
            <Package
              size={32}
              className="mx-auto text-gold/30"
            />

            <p className="mt-4 px-6 text-sm text-ink-mute">
              No order found. Please check your order number and
              email.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
