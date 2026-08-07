import { useEffect, useMemo, useState } from 'react';
import {
  Star, Trash2, AlertCircle, Check, X, Search, MessageSquare,
  BadgeCheck, Pencil, Send,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Review, ReviewStatus, ReviewWithProduct } from '@/types';
import { formatDate } from '@/lib/format';
import { useToast } from '@/contexts/ToastContext';

const STATUS_OPTIONS: { value: 'all' | ReviewStatus; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_BADGE: Record<ReviewStatus, string> = {
  pending: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  approved: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  rejected: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
};

export default function AdminReviews() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState<ReviewWithProduct | null>(null);
  const [replyTarget, setReplyTarget] = useState<ReviewWithProduct | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySaving, setReplySaving] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const load = async () => {
    setLoading(true);
    const [revRes, prodRes] = await Promise.all([
      supabase
        .from('product_reviews')
        .select('*, product:products(id, name, slug, image_url)')
        .order('created_at', { ascending: false }),
      supabase.from('products').select('id, name').order('name', { ascending: true }),
    ]);
    setReviews((revRes.data as ReviewWithProduct[]) || []);
    setProducts((prodRes.data as { id: string; name: string }[]) || []);
    setPendingCount(((revRes.data as Review[]) || []).filter((r) => r.status === 'pending').length);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

const updateStatus = async (review: ReviewWithProduct, status: ReviewStatus) => {
  const { data, error } = await supabase
    .from('product_reviews')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', review.id)
    .select('id, status');

  console.log('UPDATE RESULT:', { data, error });

  if (error) {
    console.error('UPDATE REVIEW ERROR:', error);
    toast(error.message, 'error');
    return;
  }

  if (!data || data.length === 0) {
    toast('pls check RLS policy', 'error');
    return;
  }

  toast(`Review ${status}`);
  await load();
};

  const submitReply = async () => {
    if (!replyTarget) return;
    setReplySaving(true);
    const { error } = await supabase
      .from('product_reviews')
      .update({
        admin_reply: replyText,
        admin_replied_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', replyTarget.id);
    setReplySaving(false);
    if (error) { toast(error.message, 'error'); return; }
    toast('Reply posted');
    setReplyTarget(null);
    setReplyText('');
    load();
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from('product_reviews').delete().eq('id', confirmDelete.id);
    if (error) { toast(error.message, 'error'); return; }
    toast('Review deleted');
    setConfirmDelete(null);
    load();
  };

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (productFilter !== 'all' && r.product_id !== productFilter) return false;
      if (ratingFilter !== 'all' && String(r.rating) !== ratingFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = `${r.author_name} ${r.email || ''} ${r.title || ''} ${r.comment} ${r.product?.name || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [reviews, productFilter, ratingFilter, statusFilter, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-white">Reviews</h1>
          <p className="mt-1 text-sm text-ink-400">
            {reviews.length} total reviews
            {pendingCount > 0 && (
              <span className="ml-2 text-amber-400">· {pendingCount} pending approval</span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-3 border border-ink-800 bg-black-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews..."
            className="input-luxe pl-9"
          />
        </div>
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="input-luxe"
        >
          <option value="all">All Products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="input-luxe"
        >
          <option value="all">All Ratings</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={String(n)}>{n} Star{n > 1 ? 's' : ''}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-luxe"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-ink-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="border border-ink-800 bg-black-card p-12 text-center">
          <Star className="mx-auto h-10 w-10 text-ink-600" />
          <p className="mt-3 text-sm text-ink-400">No reviews match your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <div key={r.id} className="border border-ink-800 bg-black-card p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                {/* Product info */}
                <div className="flex items-center gap-3 lg:w-56 lg:shrink-0">
                  <div className="h-12 w-10 shrink-0 overflow-hidden bg-black-soft">
                    {r.product?.image_url ? (
                      <img src={r.product.image_url} alt={r.product?.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-ink-600">
                        <Star size={16} />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gold">{r.product?.name || 'Unknown product'}</p>
                    <span className={`badge border mt-1 inline-block ${STATUS_BADGE[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                </div>

                {/* Review content */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < r.rating ? 'text-gold' : 'text-ink-700'}
                          fill="currentColor"
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-white">{r.author_name}</span>
                    {r.verified_purchase && (
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide-sm text-emerald-400">
                        <BadgeCheck size={12} /> Verified Purchase
                      </span>
                    )}
                    <span className="text-xs text-ink-500">{formatDate(r.created_at)}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-500">{r.email}</p>
                  {r.title && <h3 className="mt-2 font-serif text-lg text-white">{r.title}</h3>}
                  <p className="mt-2 text-sm text-ink-300">{r.comment}</p>
                  {r.admin_reply && (
                    <div className="mt-3 border-l-2 border-gold/40 bg-black-soft p-3">
                      <p className="flex items-center gap-2 text-xs uppercase tracking-wide-sm text-gold">
                        <MessageSquare size={12} /> Admin Reply
                      </p>
                      <p className="mt-2 text-sm text-ink-200">{r.admin_reply}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                  {r.status !== 'approved' && (
                    <button
                      onClick={() => updateStatus(r, 'approved')}
                      className="flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 transition-colors hover:bg-emerald-500/20"
                    >
                      <Check size={14} /> Approve
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button
                      onClick={() => updateStatus(r, 'rejected')}
                      className="flex items-center gap-1.5 border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 transition-colors hover:bg-rose-500/20"
                    >
                      <X size={14} /> Reject
                    </button>
                  )}
                  <button
                    onClick={() => { setReplyTarget(r); setReplyText(r.admin_reply || ''); }}
                    className="flex items-center gap-1.5 border border-ink-700 px-3 py-1.5 text-xs text-ink-300 transition-colors hover:border-gold hover:text-gold"
                  >
                    <MessageSquare size={14} /> Reply
                  </button>
                  <button
                    onClick={() => setConfirmDelete(r)}
                    className="flex items-center gap-1.5 border border-ink-700 px-3 py-1.5 text-xs text-ink-300 transition-colors hover:border-rose-500 hover:text-rose-400"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply modal */}
      {replyTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={() => setReplyTarget(null)}>
          <div className="w-full max-w-lg border border-ink-700 bg-black-deep p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl text-white">Reply to Review</h3>
              <button onClick={() => setReplyTarget(null)} className="text-ink-400 hover:text-gold"><X size={20} /></button>
            </div>
            <div className="mt-4 border border-ink-800 bg-black-soft p-4">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} className={i < replyTarget.rating ? 'text-gold' : 'text-ink-700'} fill="currentColor" />
                  ))}
                </div>
                <span className="text-sm text-white">{replyTarget.author_name}</span>
              </div>
              <p className="mt-2 text-sm text-ink-400">{replyTarget.comment}</p>
            </div>
            <div className="mt-4">
              <label className="label-luxe">Your Reply</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                placeholder="Write a response as Kalmat Fragrance..."
                className="input-luxe resize-none"
              />
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={submitReply} disabled={replySaving || !replyText.trim()} className="btn-gold flex-1">
                <Send size={14} /> {replySaving ? 'Posting...' : 'Post Reply'}
              </button>
              <button onClick={() => setReplyTarget(null)} className="btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="max-w-sm border border-ink-700 bg-black-deep p-6" onClick={(e) => e.stopPropagation()}>
            <AlertCircle className="h-10 w-10 text-rose-400" />
            <h3 className="mt-4 font-serif text-xl text-white">Delete review?</h3>
            <p className="mt-2 text-sm text-ink-400">"{confirmDelete.title || confirmDelete.comment.slice(0, 60)}" by {confirmDelete.author_name} will be permanently removed.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={doDelete} className="flex-1 border border-rose-500/50 bg-rose-500/10 py-3 text-xs uppercase tracking-wide-sm text-rose-300 hover:bg-rose-500/20">Delete</button>
              <button onClick={() => setConfirmDelete(null)} className="btn-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
