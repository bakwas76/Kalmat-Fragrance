import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Download, MessageCircle, Clock, ArrowRight, Loader2, Package, Check } from 'lucide-react';
import Seo from '@/components/Seo';
import { formatPrice, formatDateTime } from '@/lib/format';

function WhatsAppIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

interface OrderItemSummary { name: string; quantity: number; }

interface LastOrder {
  orderNumber: string;
  orderId: string;
  whatsappUrl: string;
  pdfBase64?: string;
  total: number;
  email: string;
  customerName: string;
  paymentMethod?: string;
  phone?: string;
  address?: string;
  city?: string;
  items?: OrderItemSummary[];
  orderTime?: string;
}

const ADMIN_WHATSAPP = '923219247773';

function buildAdminWhatsAppUrl(order: LastOrder): string {
  const paymentLabel = order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Manual Payment';
  const products = (order.items || []).map((i) => `- ${i.name} × ${i.quantity}`).join('\n');
  const orderTime = order.orderTime ? formatDateTime(order.orderTime) : formatDateTime(new Date());
  const message =
    '📦 New Order\n\n' +
    `Order ID: ${order.orderNumber}\n` +
    `Customer Name: ${order.customerName}\n` +
    `Phone: ${order.phone || ''}\n` +
    `Email: ${order.email}\n` +
    `Address: ${order.address || ''}\n` +
    `City: ${order.city || ''}\n` +
    `Payment Method: ${paymentLabel}\n` +
    `Order Total: ${formatPrice(order.total)}\n\n` +
    `Products:\n${products}\n\n` +
    `Order Date & Time: ${orderTime}`;
  return `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [order, setOrder] = useState<LastOrder | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [adminWaUrl, setAdminWaUrl] = useState('');
  const [waSent, setWaSent] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('last_order');
    if (!raw) { navigate('/', { replace: true }); return; }
    const parsed = JSON.parse(raw) as LastOrder;
    setOrder(parsed);
    const url = buildAdminWhatsAppUrl(parsed);
    setAdminWaUrl(url);
    const autoKey = `wa_auto_${parsed.orderNumber}`;
    if (!sessionStorage.getItem(autoKey)) {
      sessionStorage.setItem(autoKey, '1');
      const t = setTimeout(() => window.open(url, '_blank', 'noopener,noreferrer'), 1200);
      return () => clearTimeout(t);
    }
  }, [navigate]);

  const handleSendWhatsApp = useCallback(() => {
    if (!adminWaUrl) return;
    window.open(adminWaUrl, '_blank', 'noopener,noreferrer');
    setWaSent(true);
  }, [adminWaUrl]);

  if (!order) return null;

  const downloadPdf = () => {
    if (!order.pdfBase64) return;
    setDownloading(true);
    try {
      const bytes = Uint8Array.from(atob(order.pdfBase64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `invoice-${order.orderNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
    setDownloading(false);
  };

  const isManual = order.paymentMethod && order.paymentMethod !== 'cod';

  return (
    <>
      <Seo title="Order Confirmed" />
      <section className="kx-container py-20 lg:py-28">
        <div className="mx-auto max-w-xl text-center">
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-gold/30 bg-gold/5">
            <CheckCircle2 size={36} className="text-gold" strokeWidth={1.2} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <p className="mt-8 text-[10px] uppercase text-gold-deep" style={{ letterSpacing: '0.4em' }}>Order Confirmed</p>
            <h1 className="mt-4 font-display text-5xl font-light text-charcoal">Thank You{order.customerName ? `, ${order.customerName.split(' ')[0]}` : ''}</h1>
            <div className="kx-gold-line mx-auto mt-6" />
            <p className="mt-6 text-sm font-light leading-relaxed text-ink-soft">Your order <span className="font-medium text-charcoal">{order.orderNumber}</span> has been received. A confirmation has been sent to <span className="text-charcoal">{order.email}</span>.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }} className="mt-6 border border-success/30 bg-success/5 p-5">
            <div className="flex items-start gap-3">
              <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <p className="text-xs leading-relaxed text-ink-soft">Your order has been placed successfully. Please tap 'Send on WhatsApp' to instantly notify our team and speed up order processing.</p>
            </div>
          </motion.div>

          {adminWaUrl && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
              <button onClick={handleSendWhatsApp} className="group mt-4 flex w-full items-center justify-center gap-2.5 border border-success/40 bg-success/10 py-3.5 text-sm font-medium text-success transition-all hover:border-success/60 hover:bg-success/20 hover:shadow-[0_0_24px_-8px_rgba(34,197,94,0.5)]">
                <WhatsAppIcon size={18} className="transition-transform group-hover:scale-110" /> Send Order on WhatsApp
              </button>
              {waSent && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.3 }} className="mt-3 flex items-center justify-center gap-2 border border-success/20 bg-success/5 px-4 py-2.5">
                  <Check size={14} className="shrink-0 text-success" />
                  <p className="text-xs leading-relaxed text-ink-soft">Once you've sent the WhatsApp message, our team will begin processing your order.</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {isManual && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }} className="mt-8 border border-gold/30 bg-gold/5 p-6 text-left">
              <div className="flex items-start gap-3"><Clock className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" /><div><p className="text-sm font-medium text-charcoal">Payment Verification Pending</p><p className="mt-1 text-xs text-ink-soft">Your order will be processed once we verify your payment receipt on WhatsApp.</p></div></div>
              {order.whatsappUrl && <a href={order.whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-4 flex w-full items-center justify-center gap-2 border border-success/40 bg-success/10 py-3 text-sm text-success transition-colors hover:bg-success/20"><MessageCircle size={16} /> Send Receipt on WhatsApp</a>}
            </motion.div>
          )}

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {order.pdfBase64 && <button onClick={downloadPdf} disabled={downloading} className="kx-btn-ghost">{downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Download Invoice</button>}
            <button onClick={() => navigate(`/track-order?order=${encodeURIComponent(order.orderNumber)}`)} className="kx-btn-ghost"><Package size={14} /> Track Order</button>
            <a href="/shop" className="kx-btn-solid">Continue Shopping <ArrowRight size={14} /></a>
          </div>
        </div>
      </section>
    </>
  );
}
