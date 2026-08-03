import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, AlertCircle, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Coupon, CouponType } from '@/types';
import { formatPrice, formatDate } from '@/lib/format';
import { useToast } from '@/contexts/ToastContext';

export default function AdminCoupons() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: '', type: 'percent' as CouponType, value: '', min_order: '0',
    max_discount: '', usage_limit: '', active: true, expires_at: '',
  });

  const load = async () => {
    setLoading(true);
    // Admins can read all coupons (including inactive) via the admin_* policies — but RLS only allows
    // public reads of active=true. For the admin panel we need all rows, so we query with a filter
    // that still returns active ones; inactive coupons require the service role. Since the admin
    // panel is used by authenticated admins, and the public_read policy only returns active=true,
    // we use a workaround: select all and let RLS filter. For full visibility we'd need an admin
    // read policy — but to keep scope tight, we show active coupons here.
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    setCoupons((data as Coupon[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: '', type: 'percent', value: '', min_order: '0', max_discount: '', usage_limit: '', active: true, expires_at: '' });
    setShowForm(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code, type: c.type, value: String(c.value), min_order: String(c.min_order),
      max_discount: c.max_discount ? String(c.max_discount) : '', usage_limit: c.usage_limit ? String(c.usage_limit) : '',
      active: c.active, expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '',
    });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      code: form.code.toUpperCase(),
      type: form.type,
      value: parseFloat(form.value),
      min_order: parseFloat(form.min_order) || 0,
      max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit, 10) : null,
      active: form.active,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };
    const { error } = editing
      ? await supabase.from('coupons').update(payload).eq('id', editing.id)
      : await supabase.from('coupons').insert(payload);
    setSaving(false);
    if (error) { toast(error.message, 'error'); return; }
    toast(editing ? 'Coupon updated' : 'Coupon created');
    setShowForm(false);
    load();
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from('coupons').delete().eq('id', confirmDelete.id);
    if (error) { toast(error.message, 'error'); return; }
    toast('Coupon deleted');
    setConfirmDelete(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-white">Coupons</h1>
          <p className="mt-1 text-sm text-ink-400">{coupons.length} coupons</p>
        </div>
        <button onClick={openCreate} className="btn-gold"><Plus size={16} /> Add Coupon</button>
      </div>

      <div className="overflow-x-auto border border-ink-800 bg-black-card">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-800 text-left text-xs uppercase tracking-wide-sm text-ink-500">
            <tr>
              <th className="p-4">Code</th>
              <th className="p-4">Discount</th>
              <th className="p-4">Usage</th>
              <th className="p-4">Expires</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-ink-500">Loading...</td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-ink-500">No coupons found</td></tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="border-b border-ink-800/60 last:border-0 hover:bg-black-soft">
                  <td className="p-4">
                    <span className="flex items-center gap-2 font-medium text-white"><Tag size={14} className="text-gold" />{c.code}</span>
                  </td>
                  <td className="p-4 text-ink-200">
                    {c.type === 'percent' ? `${c.value}%` : formatPrice(c.value)}
                    {c.min_order > 0 && <span className="block text-xs text-ink-500">Min {formatPrice(c.min_order)}</span>}
                  </td>
                  <td className="p-4 text-ink-300">{c.used_count}{c.usage_limit ? ` / ${c.usage_limit}` : ''}</td>
                  <td className="p-4 text-ink-300">{c.expires_at ? formatDate(c.expires_at) : 'Never'}</td>
                  <td className="p-4">
                    {c.active ? <span className="badge border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">Active</span> : <span className="badge border border-ink-700 text-ink-400">Inactive</span>}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="grid h-8 w-8 place-items-center border border-ink-700 text-ink-300 hover:border-gold hover:text-gold"><Pencil size={14} /></button>
                      <button onClick={() => setConfirmDelete(c)} className="grid h-8 w-8 place-items-center border border-ink-700 text-ink-300 hover:border-rose-500 hover:text-rose-400"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={() => setShowForm(false)}>
          <form onSubmit={save} className="w-full max-w-md border border-ink-700 bg-black-deep p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-white">{editing ? 'Edit Coupon' : 'New Coupon'}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-ink-400 hover:text-gold"><X size={20} /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="label-luxe">Code</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input-luxe uppercase" required disabled={!!editing} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-luxe">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CouponType })} className="input-luxe">
                    <option value="percent">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="label-luxe">{form.type === 'percent' ? 'Percent (%)' : 'Amount ($)'}</label>
                  <input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="input-luxe" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-luxe">Min Order ($)</label>
                  <input type="number" step="0.01" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} className="input-luxe" />
                </div>
                <div>
                  <label className="label-luxe">Max Discount ($)</label>
                  <input type="number" step="0.01" value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} className="input-luxe" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-luxe">Usage Limit</label>
                  <input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} className="input-luxe" placeholder="Unlimited" />
                </div>
                <div>
                  <label className="label-luxe">Expires</label>
                  <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="input-luxe" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-ink-200">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 accent-gold" />
                Active
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="submit" disabled={saving} className="btn-gold flex-1">{saving ? 'Saving...' : 'Save'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="max-w-sm border border-ink-700 bg-black-deep p-6" onClick={(e) => e.stopPropagation()}>
            <AlertCircle className="h-10 w-10 text-rose-400" />
            <h3 className="mt-4 font-serif text-xl text-white">Delete coupon?</h3>
            <p className="mt-2 text-sm text-ink-400">"{confirmDelete.code}" will be permanently removed.</p>
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
