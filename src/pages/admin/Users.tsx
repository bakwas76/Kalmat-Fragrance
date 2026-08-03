import { useEffect, useState } from 'react';
import { ShieldCheck, Search, Mail, Phone, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import { formatDate } from '@/lib/format';
import { useToast } from '@/contexts/ToastContext';

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) {
      // profiles RLS may block non-admins, but admin layout already guards
      setLoading(false);
      return;
    }
    setUsers((data as Profile[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleAdmin = async (u: Profile) => {
    const { error } = await supabase.from('profiles').update({ is_admin: !u.is_admin }).eq('id', u.id);
    if (error) { toast(error.message, 'error'); return; }
    toast(`${u.full_name || 'User'} ${u.is_admin ? 'is no longer an admin' : 'is now an admin'}`);
    load();
  };

  const filtered = users.filter((u) =>
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.id).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-white">Users</h1>
        <p className="mt-1 text-sm text-ink-400">{users.length} registered users</p>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name..." className="input-luxe pl-10" />
      </div>

      <div className="overflow-x-auto border border-ink-800 bg-black-card">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-800 text-left text-xs uppercase tracking-wide-sm text-ink-500">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Joined</th>
              <th className="p-4">Role</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-ink-500">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-ink-500">No users found</td></tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="border-b border-ink-800/60 last:border-0 hover:bg-black-soft">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-gold/10 font-serif text-gold">
                        {u.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-white">{u.full_name || 'Unnamed'}</p>
                        <p className="flex items-center gap-1 text-xs text-ink-500"><Mail size={11} /> {u.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-ink-300"><span className="flex items-center gap-1"><Phone size={12} />{u.phone || '—'}</span></td>
                  <td className="p-4 text-ink-300"><span className="flex items-center gap-1"><Calendar size={12} />{formatDate(u.created_at)}</span></td>
                  <td className="p-4">
                    {u.is_admin ? (
                      <span className="badge border border-gold/30 bg-gold/15 text-gold"><ShieldCheck size={11} /> Admin</span>
                    ) : (
                      <span className="badge border border-ink-700 text-ink-400">Customer</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => toggleAdmin(u)}
                      className={`text-xs uppercase tracking-wide-sm transition-colors ${u.is_admin ? 'text-rose-400 hover:text-rose-300' : 'text-gold hover:text-gold-light'}`}
                    >
                      {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
