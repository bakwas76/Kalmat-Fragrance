import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';
import BrandMark from '@/components/BrandMark';
import Seo from '@/components/Seo';
import { AuthSplit } from './Login';

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error) { toast(error.message, 'error'); return; }
    setSent(true);
    toast('Reset link sent');
  };

  return (
    <AuthSplit>
      <Seo title="Forgot Password" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mx-auto w-full max-w-sm">
        <BrandMark size="compact" className="mb-10" />
        {sent ? (
          <div className="text-center">
            <CheckCircle2 size={40} className="mx-auto text-gold" strokeWidth={1.2} />
            <h1 className="mt-6 font-display text-3xl font-light text-charcoal">Check Your Email</h1>
            <div className="kx-gold-line mx-auto mt-5" />
            <p className="mt-6 text-sm font-light text-ink-soft">We've sent a password reset link to <span className="text-charcoal">{email}</span>. Follow the link to reset your password.</p>
            <Link to="/login" className="kx-btn-ghost mt-8">Back to Sign In</Link>
          </div>
        ) : (
          <>
            <p className="kx-eyebrow">Reset Access</p>
            <h1 className="mt-3 font-display text-4xl font-light text-charcoal">Forgot Password</h1>
            <div className="kx-gold-line mt-5" />
            <p className="mt-5 text-sm font-light text-ink-soft">Enter your email and we'll send you a link to reset your password.</p>
            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <div><p className="kx-field-label">Email</p><div className="relative"><Mail size={15} className="absolute left-0 top-3.5 text-ink-mute" /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="kx-input pl-7" placeholder="you@email.com" /></div></div>
              <button type="submit" disabled={busy} className="kx-btn-solid w-full">{busy ? <Loader2 size={14} className="animate-spin" /> : <>Send Reset Link <ArrowRight size={14} /></>}</button>
            </form>
            <p className="mt-8 text-center text-sm text-ink-soft"><Link to="/login" className="text-gold-deep underline-offset-4 hover:underline">Back to Sign In</Link></p>
          </>
        )}
      </motion.div>
    </AuthSplit>
  );
}
