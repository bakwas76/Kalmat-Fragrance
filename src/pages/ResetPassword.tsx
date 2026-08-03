import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';
import BrandMark from '@/components/BrandMark';
import Seo from '@/components/Seo';
import { AuthSplit } from './Login';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast('Passwords do not match', 'error'); return; }
    if (password.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast(error.message, 'error'); return; }
    toast('Password updated');
    navigate('/login', { replace: true });
  };

  return (
    <AuthSplit>
      <Seo title="Reset Password" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mx-auto w-full max-w-sm">
        <BrandMark size="compact" className="mb-10" />
        <p className="kx-eyebrow">Set New Password</p>
        <h1 className="mt-3 font-display text-4xl font-light text-charcoal">Reset Password</h1>
        <div className="kx-gold-line mt-5" />
        {!ready ? (
          <p className="mt-8 text-sm font-light text-ink-soft">Verifying your reset link... If this persists, request a new reset link.</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div><p className="kx-field-label">New Password</p><div className="relative"><Lock size={15} className="absolute left-0 top-3.5 text-ink-mute" /><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="kx-input pl-7" placeholder="Min 6 characters" /></div></div>
            <div><p className="kx-field-label">Confirm Password</p><div className="relative"><Lock size={15} className="absolute left-0 top-3.5 text-ink-mute" /><input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="kx-input pl-7" placeholder="Repeat password" /></div></div>
            <button type="submit" disabled={busy} className="kx-btn-solid w-full">{busy ? <Loader2 size={14} className="animate-spin" /> : <>Update Password <ArrowRight size={14} /></>}</button>
          </form>
        )}
      </motion.div>
    </AuthSplit>
  );
}
