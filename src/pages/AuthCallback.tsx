import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import BrandMark from '@/components/BrandMark';
import Seo from '@/components/Seo';

export default function AuthCallback() {
  const navigate = useNavigate();
  const ran = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const errParam = params.get('error');
      const errDesc = params.get('error_description');
      const errCode = params.get('error_code');
      const code = params.get('code');

      if (errParam) {
        setError(errDesc || errParam || `OAuth error (${errCode || 'unknown'})`);
        return;
      }

      if (code) {
        const { data, error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exErr || !data.session) { setError(exErr?.message || 'Could not complete sign-in.'); return; }
        const u = data.session.user;
        const fullName = u.user_metadata?.full_name || u.user_metadata?.name || (u.email ? u.email.split('@')[0] : 'Member');
        const avatarUrl = u.user_metadata?.avatar_url || u.user_metadata?.picture || null;
        await supabase.from('profiles').upsert({ id: u.id, email: u.email ?? null, full_name: fullName, avatar_url: avatarUrl }, { onConflict: 'id', ignoreDuplicates: true });
        const { data: existing } = await supabase.from('profiles').select('phone, is_admin').eq('id', u.id).maybeSingle();
        const phoneMissing = !(existing?.phone && String(existing.phone).trim());
        setTimeout(() => navigate(phoneMissing ? '/complete-profile' : '/', { replace: true }), 300);
        return;
      }

      const { data: sess } = await supabase.auth.getSession();
      if (sess.session) {
        const { data: existing } = await supabase.from('profiles').select('phone').eq('id', sess.session.user.id).maybeSingle();
        const phoneMissing = !(existing?.phone && String(existing.phone).trim());
        navigate(phoneMissing ? '/complete-profile' : '/', { replace: true });
      } else {
        setError('No session found. Please try signing in again.');
      }
    })();
  }, [navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-ivory">
      <Seo title="Authenticating" />
      <div className="text-center">
        <BrandMark size="compact" className="mb-8 justify-center" />
        {error ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md">
            <AlertCircle size={40} className="mx-auto text-danger" strokeWidth={1.2} />
            <h1 className="mt-6 font-display text-3xl font-light text-charcoal">Sign-in Issue</h1>
            <div className="kx-gold-line mx-auto mt-5" />
            <p className="mt-6 text-sm font-light text-ink-soft">{error}</p>
            <p className="mt-4 text-xs text-ink-mute">If this persists, ensure your redirect URL is set to <span className="text-charcoal">{window.location.origin}/auth/callback</span></p>
            <a href="/login" className="kx-btn-ghost mt-8">Back to Sign In</a>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
            <Loader2 size={36} className="animate-spin text-gold" />
            <p className="mt-6 text-sm text-ink-soft">Completing your sign-in...</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
