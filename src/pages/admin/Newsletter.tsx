import { useEffect, useState } from 'react';
import { Mail, Trash2, Download, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { NewsletterSubscriber } from '@/types';
import { formatDate } from '@/lib/format';
import { useToast } from '@/contexts/ToastContext';

export default function AdminNewsletter() {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<NewsletterSubscriber | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false });
    setSubscribers((data as NewsletterSubscriber[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const doDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', confirmDelete.id);
    if (error) { toast(error.message, 'error'); return; }
    toast('Subscriber removed');
    setConfirmDelete(null);
    load();
  };

  const exportCsv = () => {
    const csv = ['email,subscribed_date', ...subscribers.map((s) => `${s.email},${formatDate(s.created_at)}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kalmat-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Subscriber list exported');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-white">Newsletter</h1>
          <p className="mt-1 text-sm text-ink-400">{subscribers.length} subscribers</p>
        </div>
        {subscribers.length > 0 && (
          <button onClick={exportCsv} className="btn-outline"><Download size={14} /> Export CSV</button>
        )}
      </div>

      {loading ? (
        <p className="text-ink-500">Loading...</p>
      ) : subscribers.length === 0 ? (
        <div className="border border-ink-800 bg-black-card p-12 text-center">
          <Mail className="mx-auto h-10 w-10 text-ink-600" />
          <p className="mt-3 text-sm text-ink-400">No subscribers yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-ink-800 bg-black-card">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-800 text-left text-xs uppercase tracking-wide-sm text-ink-500">
              <tr>
                <th className="p-4">Email</th>
                <th className="p-4">Subscribed</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id} className="border-b border-ink-800/60 last:border-0 hover:bg-black-soft">
                  <td className="p-4 text-white">{s.email}</td>
                  <td className="p-4 text-ink-300">{formatDate(s.created_at)}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => setConfirmDelete(s)} className="grid h-8 w-8 place-items-center border border-ink-700 text-ink-300 hover:border-rose-500 hover:text-rose-400 ml-auto" aria-label="Remove">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="max-w-sm border border-ink-700 bg-black-deep p-6" onClick={(e) => e.stopPropagation()}>
            <AlertCircle className="h-10 w-10 text-rose-400" />
            <h3 className="mt-4 font-serif text-xl text-white">Remove subscriber?</h3>
            <p className="mt-2 text-sm text-ink-400">{confirmDelete.email} will be removed from the newsletter list.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={doDelete} className="flex-1 border border-rose-500/50 bg-rose-500/10 py-3 text-xs uppercase tracking-wide-sm text-rose-300 hover:bg-rose-500/20">Remove</button>
              <button onClick={() => setConfirmDelete(null)} className="btn-outline flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
