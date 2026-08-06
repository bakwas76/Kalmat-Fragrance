import type { OrderStatus } from '@/types';

export const BRAND = {
  name: 'Kalmat Fragrance',
  tagline: 'The Art of Luxury Perfumery',
  email: 'concierge@kalmatfragrance.com',
  phone: '+92 321 9247773',
  whatsapp: '03219247773',
  address: 'Garden West, Karachi, Sindh, Pakistan',
  instagram: 'https://instagram.com',
  facebook: 'https://facebook.com',
  twitter: 'https://twitter.com',
};

// Admin email where order PDF invoices are sent
export const ADMIN_EMAIL = 'idpes5504@gmail.com';

export const CURRENCY = 'PKR';

export const SHIPPING_FLAT_RATE = 250; // PKR
export const FREE_SHIPPING_THRESHOLD = 5000; // PKR
export const TAX_RATE = 0; // No sales tax for Pakistani retail perfume

export const PAKISTAN_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Multan', 'Peshawar', 'Quetta', 'Hyderabad', 'Sialkot',
  'Gujranwala', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana',
  'Mardan', 'Sahiwal', 'Okara', 'Abbottabad', 'Rahim Yar Khan',
  'Jhelum', 'Gujrat', 'Murree', 'Muzaffarabad', 'Other',
];

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'packed',
  'out_for_delivery',
  'delivered',
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  packed: 'Packed',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  declined: 'Declined',
  refund: 'Refund',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
  confirmed: 'bg-sky-500/15 text-sky-700 border-sky-500/30',
  processing: 'bg-violet-500/15 text-violet-700 border-violet-500/30',
  packed: 'bg-indigo-500/15 text-indigo-700 border-indigo-500/30',
  out_for_delivery: 'bg-orange-500/15 text-orange-700 border-orange-500/30',
  delivered: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  cancelled: 'bg-rose-500/15 text-rose-700 border-rose-500/30',
  declined: 'bg-red-500/15 text-red-700 border-red-500/30',
  refund: 'bg-gray-500/15 text-gray-700 border-gray-500/30',
};

export const ALL_ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'packed',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'declined',
  'refund',
];

export const NON_PROGRESSIVE_STATUSES: OrderStatus[] = [
  'cancelled',
  'declined',
  'refund',
];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery',
  manual: 'Manual Payment',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  pending_verification: 'Pending Verification',
  verified: 'Verified',
  rejected: 'Rejected',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
  pending_verification: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
  verified: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  rejected: 'bg-rose-500/15 text-rose-700 border-rose-500/30',
  paid: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  failed: 'bg-rose-500/15 text-rose-700 border-rose-500/30',
  refunded: 'bg-sky-500/15 text-sky-700 border-sky-500/30',
};

export const PAYMENT_VERIFICATION_STATUSES = ['pending_verification', 'verified', 'rejected'] as const;

// Manual payment account details (Pakistan)
export const MANUAL_PAYMENT = {
  accountHolder: 'Nazeer Ahmed',
  jazzcashNumber: '03219247773',
  whatsappUrl: 'https://wa.me/923219247773',
};
