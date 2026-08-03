import { useEffect, useState } from 'react';
import { Mail, Trash2, Check, AlertCircle, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ContactMessage } from '@/types';
import { formatDateTime } from '@/lib/format';
import { useToast } from '@/contexts/ToastContext';

export default function AdminMessages() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<ContactMessage | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    setMessages((data as ContactMessage[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (m: ContactMessage) => {
    const { error } = await supabase.from('contact_messages').update({ is_read: true }).eq('id', m.id);
    if (error) { toast(error.message, 'error'); return; }
    load();
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from('contact_messages').delete().eq('id', confirmDelete.id);
    if (error) { toast(error.message, 'error'); return; }
    toast('Message deleted');
    setConfirmDelete(null);
    load();
  };

  const filtered = messages.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.subject.toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-white">Messages</h1>
        <p className="mt-1 text-sm text-ink-400">{messages.length} messages · {unreadCount} unread</p>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search messages..." className="input-luxe pl-10" />
      </div>

      {loading ? (
        <p className="text-ink-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="border border-ink-800 bg-black-card p-12 text-center">
          <Mail className="mx-auto h-10 w-10 text-ink-600" />
          <p className="mt-3 text-sm text-ink-400">No messages found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((m) => (
            <div key={m.id} className={`border bg-black-card p-5 ${m.is_read ? 'border-ink-800' : 'border-gold/30'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {!m.is_read && <span className="h-2 w-2 rounded-full bg-gold" />}
                    <p className="text-sm font-medium text-white">{m.name}</p>
                    <span className="text-xs text-ink-500">{formatDateTime(m.created_at)}</span>
                  </div>
                  <a href={`mailto:${m.email}`} className="mt-1 block text-xs text-gold hover:underline">{m.email}</a>
                  {m.phone && <p className="text-xs text-ink-400">{m.phone}</p>}
                  <h3 className="mt-3 font-serif text-lg text-white">{m.subject}</h3>
                  <p className="mt-2 text-sm text-ink-300">{m.message}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {!m.is_read && (
                    <button onClick={() => markRead(m)} className="grid h-8 w-8 place-items-center border border-ink-700 text-ink-300 hover:border-emerald-500 hover:text-emerald-400" aria-label="Mark read">
                      <Check size={14} />
                    </button>
                  )}
                  <button onClick={() => setConfirmDelete(m)} className="grid h-8 w-8 place-items-center border border-ink-700 text-ink-300 hover:border-rose-500 hover:text-rose-400" aria-label="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="max-w-sm border border-ink-700 bg-black-deep p-6" onClick={(e) => e.stopPropagation()}>
            <AlertCircle className="h-10 w-10 text-rose-400" />
            <h3 className="mt-4 font-serif text-xl text-white">Delete message?</h3>
            <p className="mt-2 text-sm text-ink-400">This message from {confirmDelete.name} will be permanently removed.</p>
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
