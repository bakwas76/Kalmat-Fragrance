import { useEffect, useState, useCallback } from 'react';
import {
  Search, Eye, X, Download, Copy, Phone, ArrowUpDown, Loader2,
  Image as ImageIcon, ChevronDown, Package,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import type { Order, OrderStatus } from '@/types';
import { formatPrice, formatDateTime } from '@/lib/format';
import { generateInvoicePdf } from '@/lib/invoice';
import {
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS,
  PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS,
  PAYMENT_VERIFICATION_STATUSES,
  ALL_ORDER_STATUSES,
} from '@/lib/constants';
import { useToast } from '@/contexts/ToastContext';

type SortKey = 'newest' | 'oldest' | 'highest' | 'lowest';

const QUICK_FILTERS: { label: string; value: string }[] = [
  { label: 'All Orders', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Declined', value: 'declined' },
];

interface InvoiceableOrder extends Order {
  pdfBase64?: string;
}

export default function AdminOrders() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [viewing, setViewing] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[Admin Orders] Failed to load orders:', error.message, error);
      toast(`Failed to load orders: ${error.message}`, 'error');
    } else {
      setOrders((data as Order[]) || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    load();

    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        () => load(),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

const updateStatus = async (id: string, status: OrderStatus) => {
  setUpdatingId(id);

  try {
    const currentOrder = orders.find((o) => o.id === id);

    if (!currentOrder) {
      toast('Order not found', 'error');
      return;
    }

    const previousStatus = currentOrder.order_status;

    // Stock sirf pehli dafa "processing" par jane par minus hoga
    const shouldDeductStock =
      status === 'processing' &&
      previousStatus !== 'processing' &&
      previousStatus !== 'packed' &&
      previousStatus !== 'shipped' &&
      previousStatus !== 'out_for_delivery' &&
      previousStatus !== 'delivered';

    if (shouldDeductStock) {
      for (const item of currentOrder.items) {
        if (!item.variant_id) continue;

        const { data: variant, error: variantError } = await supabase
          .from('product_variants')
          .select('id, stock')
          .eq('id', item.variant_id)
          .single();

        if (variantError || !variant) {
          throw new Error(
            `Variant not found for ${item.name} (${item.variant_label || `${item.volume_ml}ml`})`
          );
        }

        const newStock = Math.max(
          0,
          Number(variant.stock) - Number(item.quantity)
        );

        const { error: stockError } = await supabase
          .from('product_variants')
          .update({ stock: newStock })
          .eq('id', item.variant_id);

        if (stockError) {
          throw new Error(
            `Stock update failed for ${item.name}: ${stockError.message}`
          );
        }
      }
    }

    // Order status update
    const { error } = await supabase
      .from('orders')
      .update({ order_status: status })
      .eq('id', id);

    if (error) {
      throw error;
    }

    toast(`Order status updated to ${ORDER_STATUS_LABELS[status]}`);

    const updatedOrder = {
      ...currentOrder,
      order_status: status,
    };

    setOrders((prev) =>
      prev.map((o) => (o.id === id ? updatedOrder : o))
    );

    if (viewing?.id === id) {
      setViewing(updatedOrder);
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Something went wrong';

    toast(message, 'error');
  } finally {
    setUpdatingId(null);
  }
};

  const updatePaymentStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('orders').update({ payment_status: status }).eq('id', id);
    if (error) { toast(error.message, 'error'); return; }
    toast(`Payment status updated to ${PAYMENT_STATUS_LABELS[status] || status}`);
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, payment_status: status as Order['payment_status'] } : o));
    if (viewing?.id === id) setViewing({ ...viewing, payment_status: status as Order['payment_status'] });
  };

  const copyText = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast(`${label} copied to clipboard`),
      () => toast('Failed to copy', 'error'),
    );
  }, [toast]);

  const downloadInvoice = useCallback(async (order: InvoiceableOrder) => {
    setDownloadingInvoice(order.id);
    try {
      if (order.pdfBase64) {
        const bytes = Uint8Array.from(atob(order.pdfBase64), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `invoice-${order.order_number}.pdf`; a.click();
        URL.revokeObjectURL(url);
      } else {
        const doc = await generateInvoicePdf({
          orderNumber: order.order_number,
          customerName: order.customer_name,
          email: order.email,
          phone: order.phone,
          shippingAddress: order.shipping_address,
          billingAddress: order.shipping_address,
          items: order.items,
          subtotal: order.subtotal,
          discount: order.discount,
          shippingCost: order.shipping_cost,
          tax: order.tax,
          total: order.total,
          paymentMethod: order.payment_method,
          notes: order.notes,
          createdAt: order.created_at,
        });
        doc.save(`invoice-${order.order_number}.pdf`);
      }
      toast('Invoice downloaded');
    } catch {
      toast('Could not generate invoice', 'error');
    }
    setDownloadingInvoice(null);
  }, [toast]);

  // Merge quick filter into status filter (quick filter takes priority when set)
  const activeStatusFilter = quickFilter || statusFilter;

  const filtered = orders
    .filter((o) => {
      const q = search.toLowerCase();
      const matchSearch =
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q);
      const matchStatus = !activeStatusFilter || o.order_status === activeStatusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      switch (sortKey) {
        case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'highest': return b.total - a.total;
        case 'lowest': return a.total - b.total;
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-white">Orders</h1>
        <p className="mt-1 text-sm text-ink-400">{orders.length} total orders · {filtered.length} shown</p>
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setQuickFilter(f.value); setStatusFilter(''); }}
            className={`border px-3 py-1.5 text-xs transition-colors ${
              quickFilter === f.value
                ? 'border-gold bg-gold/10 text-gold'
                : 'border-ink-700 text-ink-400 hover:border-ink-600 hover:text-ink-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search + sort + full status dropdown */}
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, name, phone, email..."
            className="input-luxe pl-10"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setQuickFilter(''); }}
            className="input-luxe lg:w-44"
          >
            <option value="">All Statuses</option>
            {ALL_ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
          </select>
          <div className="relative">
            <ArrowUpDown size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="input-luxe cursor-pointer pl-9 lg:w-40"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto border border-ink-800 bg-black-card lg:block">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-800 text-left text-xs uppercase tracking-wide-sm text-ink-500">
            <tr>
              <th className="whitespace-nowrap p-4">Order ID</th>
              <th className="whitespace-nowrap p-4">Customer Name</th>
              <th className="whitespace-nowrap p-4">Phone</th>
              <th className="whitespace-nowrap p-4">Email</th>
              <th className="whitespace-nowrap p-4">Full Address</th>
              <th className="whitespace-nowrap p-4">City</th>
              <th className="whitespace-nowrap p-4">Payment Method</th>
              <th className="whitespace-nowrap p-4">Payment Status</th>
              <th className="whitespace-nowrap p-4">Date & Time</th>
              <th className="whitespace-nowrap p-4">Total</th>
              <th className="whitespace-nowrap p-4">Status</th>
              <th className="whitespace-nowrap p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} className="p-8 text-center text-ink-500">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={12} className="p-8 text-center text-ink-500">No orders found</td></tr>
            ) : (
              filtered.map((o) => (
                <tr key={o.id} className="border-b border-ink-800/60 last:border-0 hover:bg-black-soft">
                  <td className="whitespace-nowrap p-4 font-medium text-white">{o.order_number}</td>
                  <td className="whitespace-nowrap p-4 text-white">{o.customer_name}</td>
                  <td className="whitespace-nowrap p-4 text-ink-300">{o.phone}</td>
                  <td className="whitespace-nowrap p-4 text-ink-300">{o.email}</td>
                  <td className="max-w-[200px] truncate p-4 text-ink-300" title={o.shipping_address.address_line}>{o.shipping_address.address_line}</td>
                  <td className="whitespace-nowrap p-4 text-ink-300">{o.shipping_address.city}</td>
                  <td className="whitespace-nowrap p-4 text-xs text-ink-300">{PAYMENT_METHOD_LABELS[o.payment_method] || o.payment_method}</td>
                  <td className="whitespace-nowrap p-4">
                    <span className={`badge border text-[10px] ${PAYMENT_STATUS_COLORS[o.payment_status] || ''}`}>{PAYMENT_STATUS_LABELS[o.payment_status] || o.payment_status}</span>
                  </td>
                  <td className="whitespace-nowrap p-4 text-ink-300">{formatDateTime(o.created_at)}</td>
                  <td className="whitespace-nowrap p-4 text-gold">{formatPrice(o.total)}</td>
                  <td className="whitespace-nowrap p-4">
                    <StatusSelect
                      value={o.order_status}
                      updating={updatingId === o.id}
                      onChange={(s) => updateStatus(o.id, s)}
                      paymentMethod={o.payment_method}
                    />
                  </td>
                  <td className="whitespace-nowrap p-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => setViewing(o)} className="grid h-8 w-8 place-items-center border border-ink-700 text-ink-300 hover:border-gold hover:text-gold" aria-label="View order"><Eye size={14} /></button>
                      <button onClick={() => downloadInvoice(o)} disabled={downloadingInvoice === o.id} className="grid h-8 w-8 place-items-center border border-ink-700 text-ink-300 hover:border-gold hover:text-gold disabled:opacity-50" aria-label="Download invoice">
                        {downloadingInvoice === o.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      </button>
                      <button onClick={() => copyText(o.order_number, 'Order ID')} className="grid h-8 w-8 place-items-center border border-ink-700 text-ink-300 hover:border-gold hover:text-gold" aria-label="Copy order ID"><Copy size={14} /></button>
                      <button onClick={() => copyText(o.phone, 'Phone number')} className="grid h-8 w-8 place-items-center border border-ink-700 text-ink-300 hover:border-gold hover:text-gold" aria-label="Copy phone"><Phone size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile / tablet cards */}
      <div className="space-y-3 lg:hidden">
        {loading ? (
          <div className="border border-ink-800 bg-black-card p-8 text-center text-sm text-ink-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="border border-ink-800 bg-black-card p-8 text-center text-sm text-ink-500">No orders found</div>
        ) : (
          filtered.map((o) => (
            <div key={o.id} className="border border-ink-800 bg-black-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{o.order_number}</p>
                  <p className="mt-0.5 text-xs text-ink-500">{formatDateTime(o.created_at)}</p>
                </div>
                <span className={`badge border text-[10px] ${ORDER_STATUS_COLORS[o.order_status]}`}>{ORDER_STATUS_LABELS[o.order_status]}</span>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <p className="text-white">{o.customer_name}</p>
                <p className="text-xs text-ink-400">{o.email}</p>
                <p className="text-xs text-ink-400">{o.phone}</p>
                <p className="text-xs text-ink-400">{o.shipping_address.address_line}, {o.shipping_address.city}</p>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-ink-800 pt-3">
                <div>
                  <p className="text-xs text-ink-500">{PAYMENT_METHOD_LABELS[o.payment_method] || o.payment_method}</p>
                  <span className={`badge border text-[10px] ${PAYMENT_STATUS_COLORS[o.payment_status] || ''}`}>{PAYMENT_STATUS_LABELS[o.payment_status] || o.payment_status}</span>
                  <p className="mt-1 text-sm text-gold">{formatPrice(o.total)}</p>
                </div>
                <StatusSelect value={o.order_status} updating={updatingId === o.id} onChange={(s) => updateStatus(o.id, s)} paymentMethod={o.payment_method} />
              </div>
              <div className="mt-3 flex items-center gap-1.5 border-t border-ink-800 pt-3">
                <button onClick={() => setViewing(o)} className="flex flex-1 items-center justify-center gap-1.5 border border-ink-700 py-2 text-xs text-ink-300 hover:border-gold hover:text-gold"><Eye size={13} /> View</button>
                <button onClick={() => downloadInvoice(o)} disabled={downloadingInvoice === o.id} className="flex flex-1 items-center justify-center gap-1.5 border border-ink-700 py-2 text-xs text-ink-300 hover:border-gold hover:text-gold disabled:opacity-50">
                  {downloadingInvoice === o.id ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Invoice
                </button>
                <button onClick={() => copyText(o.order_number, 'Order ID')} className="grid h-8 w-8 place-items-center border border-ink-700 text-ink-300 hover:border-gold hover:text-gold" aria-label="Copy order ID"><Copy size={13} /></button>
                <button onClick={() => copyText(o.phone, 'Phone number')} className="grid h-8 w-8 place-items-center border border-ink-700 text-ink-300 hover:border-gold hover:text-gold" aria-label="Copy phone"><Phone size={13} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order detail modal */}
      <AnimatePresence>
        {viewing && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4" onClick={() => setViewing(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="mx-auto my-8 max-w-2xl border border-ink-700 bg-black-deep" onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-ink-800 p-5">
                <div>
                  <h2 className="font-serif text-xl text-white">{viewing.order_number}</h2>
                  <p className="text-xs text-ink-500">{formatDateTime(viewing.created_at)}</p>
                </div>
                <button onClick={() => setViewing(null)} className="text-ink-400 hover:text-gold"><X size={20} /></button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto p-6">
                {/* Customer + Shipping */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <h3 className="mb-3 text-xs uppercase tracking-wide-sm text-gold">Customer Information</h3>
                    <p className="text-sm text-white">{viewing.customer_name}</p>
                    <p className="text-sm text-ink-300">{viewing.email}</p>
                    <p className="text-sm text-ink-300">{viewing.phone}</p>
                  </div>
                  <div>
                    <h3 className="mb-3 text-xs uppercase tracking-wide-sm text-gold">Shipping Address</h3>
                    <p className="text-sm text-ink-300">{viewing.shipping_address.address_line}</p>
                    <p className="text-sm text-ink-300">{viewing.shipping_address.city}, {viewing.shipping_address.postal_code}</p>
                    <p className="text-sm text-ink-300">{viewing.shipping_address.country}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="mt-6 border-t border-ink-800 pt-6">
                  <h3 className="mb-3 text-xs uppercase tracking-wide-sm text-gold">Ordered Products</h3>
                  <div className="space-y-3">
                    {viewing.items.map((item, i) => (
                      <div key={i} className="flex justify-between border-b border-ink-800/60 pb-3 text-sm">
                        <div>
                          <p className="text-white">{item.name} ({item.variant_label || `${item.volume_ml}ml`})</p>
                          <p className="text-xs text-ink-500">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                        </div>
                        <span className="text-white">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="mt-6 space-y-2 border-t border-ink-800 pt-6 text-sm">
                  <div className="flex justify-between text-ink-300"><span>Subtotal</span><span className="text-white">{formatPrice(viewing.subtotal)}</span></div>
                  {viewing.discount > 0 && <div className="flex justify-between text-emerald-400"><span>Discount</span><span>-{formatPrice(viewing.discount)}</span></div>}
                  <div className="flex justify-between text-ink-300"><span>Shipping</span><span className="text-white">{formatPrice(viewing.shipping_cost)}</span></div>
                  <div className="flex justify-between text-ink-300"><span>Tax</span><span className="text-white">{formatPrice(viewing.tax)}</span></div>
                  <div className="flex justify-between border-t border-ink-800 pt-2 font-serif text-lg"><span className="text-white">Total</span><span className="text-gold">{formatPrice(viewing.total)}</span></div>
                </div>

                {/* Payment + status */}
                <div className="mt-6 grid gap-4 border-t border-ink-800 pt-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide-sm text-ink-500">Payment Method</p>
                    <p className="mt-1 text-sm text-white">{PAYMENT_METHOD_LABELS[viewing.payment_method] || viewing.payment_method}</p>
                    <div className="mt-2">
                      <p className="text-xs uppercase tracking-wide-sm text-ink-500">Payment Status</p>
                      <select
                        value={viewing.payment_status}
                        onChange={(e) => updatePaymentStatus(viewing.id, e.target.value)}
                        className={`mt-1 cursor-pointer border bg-transparent px-2 py-1 text-xs ${PAYMENT_STATUS_COLORS[viewing.payment_status] || ''}`}
                      >
                        {(viewing.payment_method === 'manual' ? PAYMENT_VERIFICATION_STATUSES : []).map((s) => (
                          <option key={s} value={s} className="bg-black-card text-white">{PAYMENT_STATUS_LABELS[s]}</option>
                        ))}
                        {(['pending','paid','failed','refunded'] as const).map((s) => (
                          <option key={s} value={s} className="bg-black-card text-white">{PAYMENT_STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide-sm text-ink-500">Order Status</p>
                    <div className="mt-1">
                      <StatusSelect value={viewing.order_status} updating={updatingId === viewing.id} onChange={(s) => updateStatus(viewing.id, s)} paymentMethod={viewing.payment_method} />
                    </div>
                  </div>
                </div>

                {/* Payment receipt */}
                {viewing.payment_receipt_url && (
                  <div className="mt-6 border-t border-ink-800 pt-6">
                    <p className="mb-2 text-xs uppercase tracking-wide-sm text-gold">Payment Receipt</p>
                    <div className="overflow-hidden border border-ink-700 bg-black-soft">
                      <a href={viewing.payment_receipt_url} target="_blank" rel="noopener noreferrer">
                        <img src={viewing.payment_receipt_url} alt="Payment receipt" className="max-h-80 w-full object-contain" />
                      </a>
                    </div>
                    <p className="mt-2 text-xs text-ink-500">Click image to open full size</p>
                  </div>
                )}
                {!viewing.payment_receipt_url && viewing.payment_method !== 'cod' && (
                  <div className="mt-6 border-t border-ink-800 pt-6">
                    <p className="text-xs uppercase tracking-wide-sm text-ink-500">Payment Receipt</p>
                    <p className="mt-2 flex items-center gap-2 text-sm text-ink-400"><ImageIcon size={16} /> No receipt uploaded</p>
                  </div>
                )}

                {/* Notes */}
                <div className="mt-6 border-t border-ink-800 pt-6">
                  <p className="text-xs uppercase tracking-wide-sm text-ink-500">Order Notes</p>
                  {viewing.notes ? (
                    <p className="mt-1 text-sm text-ink-300">{viewing.notes}</p>
                  ) : (
                    <p className="mt-1 text-sm text-ink-600">No notes for this order.</p>
                  )}
                </div>

                {/* Invoice download */}
                <div className="mt-6 border-t border-ink-800 pt-6">
                  <button
                    onClick={() => downloadInvoice(viewing)}
                    disabled={downloadingInvoice === viewing.id}
                    className="flex w-full items-center justify-center gap-2 border border-gold/40 bg-gold/10 py-3 text-sm font-medium text-gold transition-colors hover:bg-gold/20 disabled:opacity-50"
                  >
                    {downloadingInvoice === viewing.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Download Invoice
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusSelect({ value, updating, onChange, paymentMethod }: { value: OrderStatus; updating: boolean; onChange: (s: OrderStatus) => void; paymentMethod: Order['payment_method']; }) {
  const available = ALL_ORDER_STATUSES.filter((s) => {
    if (s === 'pending_verification' && paymentMethod !== 'manual') return false;
    return true;
  });
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as OrderStatus)}
        disabled={updating}
        className={`cursor-pointer appearance-none border bg-transparent py-1 pl-2 pr-7 text-[10px] ${ORDER_STATUS_COLORS[value]} disabled:cursor-wait`}
        aria-label="Change order status"
      >
        {available.map((s) => (
          <option key={s} value={s} className="bg-black-card text-white">{ORDER_STATUS_LABELS[s]}</option>
        ))}
      </select>
      <ChevronDown size={12} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-ink-500" />
      {updating && <Loader2 size={12} className="ml-1 animate-spin text-gold" />}
    </div>
  );
}
