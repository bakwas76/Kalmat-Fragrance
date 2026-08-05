export type Gender = 'men' | 'women' | 'unisex';

export type BottleShape = 'classic' | 'flask' | 'round' | 'square';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size_label: string;
  volume_ml: number;
  price: number;
  compare_at_price: number | null;
  stock: number;
  sku: string | null;
  weight: string | null;
  sort_order: number;
  is_default: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
  collection_id: string | null;
  brand: string;
  gender: Gender;
  volume_ml: number;
  stock: number;
  featured: boolean;
  is_new: boolean;
  best_seller: boolean;
  rating: number;
  reviews_count: number;
  top_notes: string[];
  middle_notes: string[];
  base_notes: string[];
  ingredients: string | null;
  bottle_shape: string;
  bottle_glass: string;
  bottle_cap: string;
  bottle_label: string;
  sku: string | null;
  image_url: string | null;
  created_at: string;
  product_variants?: ProductVariant[];
}

export interface ProductWithRelations extends Product {
  category?: Category | null;
  collection?: Collection | null;
  product_variants?: ProductVariant[];
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  product_id: string;
  user_id: string | null;
  author_name: string;
  email: string | null;
  rating: number;
  title: string | null;
  comment: string;
  status: ReviewStatus;
  verified_purchase: boolean;
  admin_reply: string | null;
  admin_replied_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewWithProduct extends Review {
  product?: { id: string; name: string; slug: string; image_url: string | null } | null;
}

export type CouponType = 'percent' | 'fixed';

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  min_order: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}

export type OrderStatus =
  | 'pending'
  | 'pending_verification'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'declined'
  | 'refunded';

export type PaymentMethod = 'cod' | 'manual';
export type PaymentStatus = 'pending' | 'pending_verification' | 'verified' | 'rejected' | 'paid' | 'failed' | 'refunded';

export interface AddressData {
  full_name: string;
  phone: string;
  email?: string;
  address_line: string;
  city: string;
  country: string;
  postal_code: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  bottle_shape: string;
  bottle_glass: string;
  bottle_cap: string;
  bottle_label: string;
  volume_ml: number;
  image_url?: string | null;
  variant_id?: string | null;
  variant_label?: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  email: string;
  phone: string;
  billing_address: AddressData;
  shipping_address: AddressData;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping_cost: number;
  tax: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_receipt_url: string | null;
  order_status: OrderStatus;
  coupon_code: string | null;
  notes: string | null;
  created_at: string;
}

export interface SavedAddress {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  country: string;
  postal_code: string;
  is_default: boolean;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  product?: Product;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: ProductVariant | null;
}

export type BannerAnimation =
  | 'none'
  | 'marquee'
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'bounce'
  | 'pulse';

export type BannerSpeed = 'slow' | 'normal' | 'fast';
export type BannerFontWeight = 'normal' | 'medium' | 'bold';
export type BannerTextAlign = 'left' | 'center' | 'right';

export interface AnnouncementBanner {
  id: number;
  enabled: boolean;
  text: string;
  bg_color: string;
  text_color: string;
  font_size: number;
  font_weight: BannerFontWeight;
  height: number;
  padding: number;
  animation: BannerAnimation;
  speed: BannerSpeed;
  text_align: BannerTextAlign;
  updated_at: string;
}

export interface HeroBanner {
  id: number;
  desktop_image_url: string | null;
  mobile_image_url: string | null;
  overlay_opacity: number;
  banner_height: number;
  updated_at: string;
}
