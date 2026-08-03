import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import GoogleButton from '@/components/GoogleButton';
import BrandMark from '@/components/BrandMark';
import Seo from '@/components/Seo';

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const redirectTo = params.get('redirect') || '/account';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && user) navigate(redirectTo, { replace: true }); }, [user, loading, navigate, redirectTo]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { toast(error.message === 'Invalid login credentials' ? 'Invalid email or password' : error.message, 'error'); return; }
    toast('Welcome back');
    navigate(redirectTo, { replace: true });
  };

  return (
    <AuthSplit>
      <Seo title="Sign In" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mx-auto w-full max-w-sm">
        <BrandMark size="compact" className="mb-10" />
        <p className="kx-eyebrow">Welcome Back</p>
        <h1 className="mt-3 font-display text-4xl font-light text-charcoal">Sign In</h1>
        <div className="kx-gold-line mt-5" />
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div><p className="kx-field-label">Email</p><div className="relative"><Mail size={15} className="absolute left-0 top-3.5 text-ink-mute" /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="kx-input pl-7" placeholder="you@email.com" /></div></div>
          <div><p className="kx-field-label">Password</p><div className="relative"><Lock size={15} className="absolute left-0 top-3.5 text-ink-mute" /><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="kx-input pl-7" placeholder="••••••••" /></div></div>
          <div className="flex justify-end"><Link to="/forgot-password" className="text-xs text-ink-mute hover:text-gold-deep">Forgot password?</Link></div>
          <button type="submit" disabled={busy} className="kx-btn-solid w-full">{busy ? <Loader2 size={14} className="animate-spin" /> : <>Sign In <ArrowRight size={14} /></>}</button>
        </form>
        <div className="my-7 flex items-center gap-4"><div className="h-px flex-1 bg-line" /><span className="text-[10px] uppercase text-ink-mute" style={{ letterSpacing: '0.24em' }}>or</span><div className="h-px flex-1 bg-line" /></div>
        <GoogleButton />
        <p className="mt-8 text-center text-sm text-ink-soft">New to Kalmat? <Link to="/signup" className="text-gold-deep underline-offset-4 hover:underline">Create an account</Link></p>
      </motion.div>
    </AuthSplit>
  );
}

export function AuthSplit({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center bg-ivory px-6 py-16 lg:px-12">{children}</div>
      <div className="relative hidden overflow-hidden bg-charcoal lg:block">
        <div className="absolute inset-0 kx-grain-dark opacity-40" />
        <div className="absolute left-1/2 top-1/2 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-[140px]" />
        <div className="relative flex h-full flex-col items-center justify-center p-20 text-center">
          <span className="font-display text-9xl italic text-gold/15">K</span>
          <p className="mt-6 max-w-sm text-sm font-light leading-relaxed text-ivory/55">"A fragrance is a story you wear. Each note a chapter, each wear a new beginning."</p>
          <div className="mt-8 h-px w-16 bg-gradient-to-r from-transparent via-gold to-transparent" />
          <p className="mt-8 text-[10px] uppercase text-gold-light/60" style={{ letterSpacing: '0.4em' }}>Kalmat Fragrance</p>
        </div>
      </div>
    </div>
  );
}
