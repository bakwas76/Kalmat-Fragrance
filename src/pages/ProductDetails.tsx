import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Minus, Plus, Truck, ShieldCheck, RefreshCw, Share2, Star, ChevronRight, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Category, Collection, Review, ProductVariant } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { formatPrice, discountPercent } from '@/lib/format';
import ProductTile from '@/components/ProductTile';
import RatingMeter from '@/components/RatingMeter';
import SectionTitle from '@/components/SectionTitle';
import Seo from '@/components/Seo';

interface ReviewFormState { rating: number; title: string; comment: string; author_name: string; }

export default function ProductDetails() {
  const { slug } = useParams();
  const { toast } = useToast();
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'ingredients' | 'reviews'>('notes');
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const [reviewForm, setReviewForm] = useState<ReviewFormState>({ rating: 5, title: '', comment: '', author_name: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userExistingReview, setUserExistingReview] = useState<Review | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const { data: prod } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle();
      if (!prod) { setLoading(false); return; }
      const p = prod as Product;
      setProduct(p);

      const [cat, col, revs, rel, varRes] = await Promise.all([
        p.category_id ? supabase.from('categories').select('*').eq('id', p.category_id).maybeSingle() : Promise.resolve({ data: null }),
        p.collection_id ? supabase.from('collections').select('*').eq('id', p.collection_id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from('product_reviews').select('*').eq('product_id', p.id).eq('status', 'approved').order('created_at', { ascending: false }),
        supabase.from('products').select('*').neq('id', p.id).limit(4),
        supabase.from('product_variants').select('*').eq('product_id', p.id).order('sort_order', { ascending: true }),
      ]);
      const vList = (varRes.data as ProductVariant[]) || [];
      setVariants(vList);
      const def = vList.find((v) => v.is_default) || vList[0];
      setSelectedVariantId(def?.id ?? null);
      setCategory((cat.data as Category) || null);
      setCollection((col.data as Collection) || null);
      setReviews((revs.data as Review[]) || []);
      let relProducts = (rel.data as Product[]) || [];
      if (p.category_id) {
        const { data: catRel } = await supabase.from('products').select('*').eq('category_id', p.category_id).neq('id', p.id).limit(4);
        if (catRel && catRel.length > 0) relProducts = catRel as Product[];
      }
      setRelated(relProducts);
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (!product || !user) return;
    (async () => {
      const [revRes, ordersRes] = await Promise.all([
        supabase.from('product_reviews').select('*').eq('product_id', product.id).eq('user_id', user.id).maybeSingle(),
        supabase.from('orders').select('id, items, order_status').eq('user_id', user.id).in('order_status', ['confirmed', 'processing', 'shipped', 'delivered']),
      ]);
      setUserExistingReview((revRes.data as Review) || null);
      const orders = (ordersRes.data as { id: string; items: { product_id?: string; id?: string }[]; order_status: string }[]) || [];
      setHasPurchased(orders.some((o) => o.items.some((it) => (it.product_id || it.id) === product.id)));
    })();
  }, [product, user]);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border border-line border-t-gold" /></div>;
  }
  if (!product) {
    return (
      <div className="kx-container py-32 text-center">
        <p className="font-display text-4xl text-charcoal">Fragrance Not Found</p>
        <Link to="/shop" className="kx-btn-solid mt-8">Browse All Fragrances</Link>
      </div>
    );
  }

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) || null;

const displayPrice = selectedVariant ? selectedVariant.price : product.price;
const displayCompareAt = selectedVariant
  ? selectedVariant.compare_at_price
  : product.compare_at_price;

const displayStock = selectedVariant ? selectedVariant.stock : product.stock;
const displayVolume = selectedVariant ? selectedVariant.volume_ml : product.volume_ml;

const activeImage = selectedVariant?.image_url || product.image_url;

console.log("selectedVariantId:", selectedVariantId);
console.log("selectedVariant:", selectedVariant);
console.log("activeImage:", activeImage);

const outOfStock = displayStock <= 0;
const discount = discountPercent(displayPrice, displayCompareAt);
const wished = isWishlisted(product.id);

  const onAddToCart = () => {
    addItem(product, qty, selectedVariant);
    const sizeLabel = selectedVariant ? selectedVariant.size_label : `${product.volume_ml}ml`;
    toast(`${qty} × ${product.name} (${sizeLabel}) added to your bag`);
  };

  const onWishlist = async () => {
    await toggle(product);
    toast(wished ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const onShare = async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: product.name, url }); } catch { /* */ } }
    else { navigator.clipboard.writeText(url); toast('Link copied to clipboard'); }
  };

  const onZoomMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoomPos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  const refreshReviews = async () => {
    if (!product) return;
    const [revs, prod] = await Promise.all([
      supabase.from('product_reviews').select('*').eq('product_id', product.id).eq('status', 'approved').order('created_at', { ascending: false }),
      supabase.from('products').select('*').eq('id', product.id).maybeSingle(),
    ]);
    setReviews((revs.data as Review[]) || []);
    if (prod.data) setProduct(prod.data as Product);
  };

 const submitReview = async () => {
  if (!user || !product) return;

  if (!reviewForm.comment.trim()) {
    toast('Please write a review', 'error');
    return;
  }

  setSubmittingReview(true);

  try {
    if (editingReview) {
      const { error } = await supabase
        .from('product_reviews')
        .update({
          rating: reviewForm.rating,
          title: reviewForm.title || null,
          comment: reviewForm.comment,
          author_name: reviewForm.author_name || user.email || 'Anonymous',
          verified_purchase: hasPurchased,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingReview.id);

      if (error) {
        console.error('REVIEW UPDATE ERROR:', error);
        toast(error.message, 'error');
        return;
      }

      toast('Review updated — pending approval');
      setEditingReview(null);
    } else {
      const { error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: product.id,
          user_id: user.id,
          author_name: reviewForm.author_name || user.email || 'Anonymous',
          rating: reviewForm.rating,
          title: reviewForm.title || null,
          comment: reviewForm.comment,
          verified_purchase: hasPurchased,
          status: 'pending',
        });

      if (error) {
        console.error('REVIEW INSERT ERROR:', error);

        if (error.code === '23505') {
          toast('You have already reviewed this fragrance', 'error');
        } else {
          toast(error.message, 'error');
        }

        return;
      }

      toast('Review submitted — pending approval');
    }

    const { data: myRev, error: myRevError } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', product.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (myRevError) {
      console.error('FETCH REVIEW ERROR:', myRevError);
    }

    setUserExistingReview((myRev as Review) || null);

    setReviewForm({
      rating: 5,
      title: '',
      comment: '',
      author_name: '',
    });

    await refreshReviews();
  } catch (err) {
    console.error('REVIEW ERROR:', err);

    toast(
      err instanceof Error ? err.message : 'Could not submit review',
      'error'
    );
  } finally {
    setSubmittingReview(false);
  }
};

  return (
    <>
      <Seo title={product.name} description={product.description} image={product.image_url || undefined} />

      {/* Breadcrumb */}
      <div className="kx-container pt-24 lg:pt-28">
        <div className="flex items-center gap-2 text-[10px] uppercase text-ink-mute" style={{ letterSpacing: '0.2em' }}>
          <Link to="/" className="hover:text-gold-deep">Home</Link><ChevronRight size={12} />
          <Link to="/shop" className="hover:text-gold-deep">Shop</Link><ChevronRight size={12} />
          {category && <><Link to={`/shop?category=${category.slug}`} className="hover:text-gold-deep">{category.name}</Link><ChevronRight size={12} /></>}
          <span className="text-charcoal">{product.name}</span>
        </div>
      </div>

      {/* Main split */}
      <section className="kx-container py-10 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Gallery */}
          <div>
            <div
              className="kx-img-frame relative aspect-[4/5] cursor-crosshair border border-line bg-ivory-2"
              onMouseEnter={() => setZoomed(true)}
              onMouseLeave={() => setZoomed(false)}
              onMouseMove={onZoomMove}
            >

{activeImage ? (
  <img
    src={activeImage}
    alt={product.name}
    className="h-full w-full object-cover transition-transform duration-300"
    style={
      zoomed
        ? {
            transform: `scale(2)`,
            transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
          }
        : undefined
    }
  />
) : (
  <div
    className="grid h-full w-full place-items-center"
    style={{ background: "linear-gradient(160deg,#F3ECE0,#E6DCCB)" }}
  >
    <span className="font-display text-8xl italic text-gold/20">
      {product.brand?.charAt(0) || "K"}
    </span>
  </div>
)}
              {discount > 0 && <span className="kx-badge-sale absolute left-4 top-4">−{discount}%</span>}
            </div>
            {product.image_url && (
              <p className="mt-4 text-center text-[10px] uppercase text-ink-mute" style={{ letterSpacing: '0.3em' }}>Hover to zoom</p>
            )}
          </div>

          {/* Info — sticky */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-[10px] uppercase text-gold-deep" style={{ letterSpacing: '0.32em' }}>{product.brand}</p>
            <h1 className="mt-3 font-display text-4xl font-light leading-tight text-charcoal sm:text-5xl">{product.name}</h1>
            <div className="mt-5 flex items-center gap-4">
              <RatingMeter rating={product.rating} count={product.reviews_count} size={16} />
              <button onClick={() => setActiveTab('reviews')} className="text-xs text-ink-mute underline-offset-4 hover:text-gold-deep hover:underline">
                {product.reviews_count} review{product.reviews_count !== 1 ? 's' : ''}
              </button>
            </div>
            <div className="kx-gold-line mt-6" />
            <p className="mt-6 text-base font-light leading-relaxed text-ink-soft">{product.description}</p>

            <div className="mt-8 flex items-baseline gap-4">
              <span className="font-display text-3xl text-charcoal">{formatPrice(displayPrice)}</span>
              {displayCompareAt && displayCompareAt > displayPrice && (
                <span className="text-lg text-ink-mute line-through">{formatPrice(displayCompareAt)}</span>
              )}
              <span className="text-sm text-ink-mute">{displayVolume}ml</span>
            </div>

            {/* Variant selector */}
            {variants.length > 0 && (
              <div className="mt-7">
                <p className="kx-field-label">Choose Size</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {variants.map((v) => {
                    const selected = v.id === selectedVariantId;
                    const vOOS = v.stock <= 0;
                    return (
                      <button
                        key={v.id}
                        onClick={() => { setSelectedVariantId(v.id); setQty(1); }}
                        disabled={vOOS}
                        className={`relative min-w-[72px] border px-5 py-3 text-sm transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${
                          selected
                            ? 'border-gold bg-gold/5 text-charcoal'
                            : 'border-line text-ink-soft hover:border-gold/50'
                        }`}
                      >
                        {v.size_label}
                        {v.is_default && !selected && <span className="absolute -top-px -right-px h-1.5 w-1.5 rounded-full bg-gold" />}
                        {vOOS && <span className="block text-[9px] uppercase text-ink-mute">Sold out</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock indicator */}
            {!outOfStock && displayStock <= 10 && (
              <p className="mt-4 text-xs text-gold-deep">Only {displayStock} left in stock</p>
            )}

            {/* Quantity + Add */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-stretch">
              <div className="flex items-center border border-line">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={outOfStock} className="grid h-12 w-12 place-items-center text-charcoal transition-colors hover:text-gold-deep disabled:opacity-30"><Minus size={15} /></button>
                <span className="w-12 text-center font-display text-lg">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(displayStock, q + 1))} disabled={outOfStock || qty >= displayStock} className="grid h-12 w-12 place-items-center text-charcoal transition-colors hover:text-gold-deep disabled:opacity-30"><Plus size={15} /></button>
              </div>
              <button onClick={onAddToCart} disabled={outOfStock} className="kx-btn-solid flex-1">
                {outOfStock ? 'Sold Out' : <><ShoppingBag size={15} /> Add to Bag</>}
              </button>
              <button onClick={onWishlist} className="grid h-12 w-12 place-items-center border border-line transition-all hover:border-gold" aria-label="Wishlist">
                <Heart size={18} fill={wished ? '#B89B5E' : 'none'} stroke={wished ? '#B89B5E' : 'currentColor'} className={wished ? 'text-gold' : 'text-charcoal'} />
              </button>
            </div>

            {/* Assurances */}
            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-line-soft pt-7">
              {[{ Icon: Truck, t: 'Free over Rs 5,000' }, { Icon: ShieldCheck, t: '100% Authentic' }, { Icon: RefreshCw, t: 'Easy Returns' }].map((a) => (
                <div key={a.t} className="flex flex-col items-center gap-2 text-center">
                  <a.Icon size={18} className="text-gold" strokeWidth={1.3} />
                  <p className="text-[10px] font-light text-ink-soft">{a.t}</p>
                </div>
              ))}
            </div>

            {/* Share */}
            <button onClick={onShare} className="mt-7 inline-flex items-center gap-2 text-[10px] uppercase text-ink-mute transition-colors hover:text-gold-deep" style={{ letterSpacing: '0.24em' }}>
              <Share2 size={13} /> Share
            </button>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="border-t border-line bg-ivory-2">
        <div className="kx-container py-12 lg:py-16">
          <div className="flex gap-8 border-b border-line">
            {[
              { k: 'notes', l: 'Fragrance Notes' },
              { k: 'ingredients', l: 'Ingredients' },
              { k: 'reviews', l: `Reviews (${reviews.length})` },
            ].map((t) => (
              <button key={t.k} onClick={() => setActiveTab(t.k as typeof activeTab)} className={`relative pb-4 text-[11px] uppercase transition-colors ${activeTab === t.k ? 'text-charcoal' : 'text-ink-mute hover:text-charcoal'}`} style={{ letterSpacing: '0.24em' }}>
                {t.l}
                {activeTab === t.k && <span className="absolute -bottom-px left-0 right-0 h-px bg-gold" />}
              </button>
            ))}
          </div>

          <div className="mt-10">
            {activeTab === 'notes' && (
              <div className="grid gap-8 md:grid-cols-3">
                {[
                  { title: 'Top Notes', notes: product.top_notes, num: '01' },
                  { title: 'Heart Notes', notes: product.middle_notes, num: '02' },
                  { title: 'Base Notes', notes: product.base_notes, num: '03' },
                ].map((n) => (
                  <div key={n.title} className="border border-line bg-white p-8">
                    <span className="font-display text-sm italic text-gold/50">{n.num}</span>
                    <h3 className="mt-2 font-display text-2xl text-charcoal">{n.title}</h3>
                    <div className="kx-gold-line mt-3" />
                    {n.notes.length > 0 ? (
                      <ul className="mt-5 space-y-2">
                        {n.notes.map((note) => <li key={note} className="text-sm font-light text-ink-soft">{note}</li>)}
                      </ul>
                    ) : <p className="mt-5 text-sm text-ink-mute">Not specified</p>}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'ingredients' && (
              <div className="max-w-2xl">
                <p className="text-base font-light leading-relaxed text-ink-soft">{product.ingredients || 'Full ingredients list available upon request.'}</p>
                <div className="mt-8 grid grid-cols-2 gap-6 border-t border-line-soft pt-8 sm:grid-cols-4">
                  {[{ l: 'Volume', v: `${product.volume_ml}ml` }, { l: 'Gender', v: product.gender }, { l: 'SKU', v: product.sku || '—' }, { l: 'Collection', v: collection?.name || '—' }].map((d) => (
                    <div key={d.l}><p className="kx-label">{d.l}</p><p className="mt-1 text-sm text-charcoal">{d.v}</p></div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="grid gap-10 lg:grid-cols-3">
                {/* Reviews list */}
                <div className="lg:col-span-2">
                  {reviews.length === 0 ? (
                    <p className="py-16 text-center text-sm text-ink-mute">No reviews yet. Be the first to share your experience.</p>
                  ) : (
                    <div className="space-y-6">
                      {reviews.map((rev) => (
                        <div key={rev.id} className="border border-line bg-white p-7">
                          <div className="flex items-center justify-between">
                            <RatingMeter rating={rev.rating} size={14} showCount={false} />
                            {rev.verified_purchase && <span className="text-[10px] uppercase text-gold-deep" style={{ letterSpacing: '0.2em' }}>Verified</span>}
                          </div>
                          {rev.title && <h4 className="mt-3 font-display text-xl text-charcoal">{rev.title}</h4>}
                          <p className="mt-2 text-sm font-light leading-relaxed text-ink-soft">{rev.comment}</p>
                          <div className="mt-5 flex items-center gap-3 border-t border-line-soft pt-4">
                            <div className="grid h-9 w-9 place-items-center rounded-full border border-gold/25 bg-gold/5 font-display italic text-gold">{rev.author_name.charAt(0)}</div>
                            <div>
                              <p className="text-sm font-medium text-charcoal">{rev.author_name}</p>
                              <p className="text-[11px] text-ink-mute">{new Date(rev.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                          </div>
                          {rev.admin_reply && (
                            <div className="mt-4 ml-12 border-l-2 border-gold/30 bg-gold/5 px-4 py-3">
                              <p className="text-[10px] uppercase text-gold-deep" style={{ letterSpacing: '0.2em' }}>Kalmat responds</p>
                              <p className="mt-1 text-sm font-light text-ink-soft">{rev.admin_reply}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Review form / status */}
                <div>
                  {!user ? (
                    <div className="border border-line bg-white p-8 text-center">
                      <MessageSquare size={24} className="mx-auto text-gold/40" />
                      <p className="mt-4 font-display text-xl text-charcoal">Share Your Experience</p>
                      <p className="mt-3 text-sm text-ink-mute">Sign in to leave a review</p>
                      <Link to="/login" className="kx-btn-solid mt-6 w-full">Sign In</Link>
                    </div>
                  ) : userExistingReview && !editingReview ? (
                    <div className="border border-line bg-white p-8">
                      <p className="font-display text-xl text-charcoal">Your Review</p>
                      <div className="mt-4"><RatingMeter rating={userExistingReview.rating} size={14} showCount={false} /></div>
                      <p className="mt-3 text-sm font-light text-ink-soft">{userExistingReview.comment}</p>
                      <span className="mt-4 inline-block text-[10px] uppercase text-gold-deep" style={{ letterSpacing: '0.2em' }}>Status: {userExistingReview.status}</span>
                      <button onClick={() => { setEditingReview(userExistingReview); setReviewForm({ rating: userExistingReview.rating, title: userExistingReview.title || '', comment: userExistingReview.comment, author_name: userExistingReview.author_name }); }} className="kx-btn-ghost mt-6 w-full">Edit Review</button>
                    </div>
                  ) : hasPurchased || editingReview ? (
                    <div className="border border-line bg-white p-8">
                      <p className="font-display text-xl text-charcoal">{editingReview ? 'Edit Review' : 'Write a Review'}</p>
                      <div className="mt-5">
                        <p className="kx-label mb-2">Rating</p>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button key={n} onClick={() => setReviewForm((f) => ({ ...f, rating: n }))}>
                              <Star size={22} fill={n <= reviewForm.rating ? '#B89B5E' : 'none'} stroke="#B89B5E" strokeWidth={1} className={n <= reviewForm.rating ? '' : 'opacity-30'} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mt-5">
                        <p className="kx-field-label">Title (optional)</p>
                        <input value={reviewForm.title} onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))} className="kx-input" placeholder="Summarize your experience" />
                      </div>
                      <div className="mt-5">
                        <p className="kx-field-label">Your Review</p>
                        <textarea rows={4} value={reviewForm.comment} onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))} className="kx-textarea" placeholder="Describe the scent, longevity, and your impression" />
                      </div>
                      <button onClick={submitReview} disabled={submittingReview} className="kx-btn-solid mt-6 w-full">
                        {submittingReview ? 'Submitting...' : editingReview ? 'Update Review' : 'Submit Review'}
                      </button>
                      {editingReview && <button onClick={() => setEditingReview(null)} className="kx-btn-ghost mt-3 w-full">Cancel</button>}
                    </div>
                  ) : (
                    <div className="border border-line bg-white p-8 text-center">
                      <MessageSquare size={24} className="mx-auto text-gold/40" />
                      <p className="mt-4 font-display text-xl text-charcoal">Only verified buyers can review</p>
                      <p className="mt-3 text-sm text-ink-mute">Purchase this fragrance to share your thoughts.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="kx-section">
          <div className="kx-container">
            <SectionTitle eyebrow="You May Also Love" title="Related Fragrances" />
            <div className="mt-14 grid grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4 lg:gap-7">
              {related.map((p, i) => <ProductTile key={p.id} product={p} index={i} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
