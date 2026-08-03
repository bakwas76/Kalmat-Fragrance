import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User as UserIcon, Phone, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import GoogleButton from '@/components/GoogleButton';
import BrandMark from '@/components/BrandMark';
import Seo from '@/components/Seo';
import { AuthSplit } from './Login';

export default function Signup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && user) navigate('/account', { replace: true }); }, [user, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast('Passwords do not match', 'error'); return; }
    if (form.password.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password, options: { data: { full_name: form.full_name, phone: form.phone } } });
    setBusy(false);
    if (error) { toast(error.message, 'error'); return; }
    if (data.user) { toast('Account created — welcome to Kalmat'); navigate('/account', { replace: true }); }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <AuthSplit>
      <Seo title="Create Account" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mx-auto w-full max-w-sm">
        <BrandMark size="compact" className="mb-10" />
        <p className="kx-eyebrow">Begin Your Journey</p>
        <h1 className="mt-3 font-display text-4xl font-light text-charcoal">Create Account</h1>
        <div className="kx-gold-line mt-5" />
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div><p className="kx-field-label">Full Name</p><div className="relative"><UserIcon size={15} className="absolute left-0 top-3.5 text-ink-mute" /><input required value={form.full_name} onChange={set('full_name')} className="kx-input pl-7" placeholder="Your name" /></div></div>
          <div><p className="kx-field-label">Email</p><div className="relative"><Mail size={15} className="absolute left-0 top-3.5 text-ink-mute" /><input type="email" required value={form.email} onChange={set('email')} className="kx-input pl-7" placeholder="you@email.com" /></div></div>
          <div><p className="kx-field-label">Phone</p><div className="relative"><Phone size={15} className="absolute left-0 top-3.5 text-ink-mute" /><input value={form.phone} onChange={set('phone')} className="kx-input pl-7" placeholder="03XX-XXXXXXX" /></div></div>
          <div><p className="kx-field-label">Password</p><div className="relative"><Lock size={15} className="absolute left-0 top-3.5 text-ink-mute" /><input type="password" required value={form.password} onChange={set('password')} className="kx-input pl-7" placeholder="Min 6 characters" /></div></div>
          <div><p className="kx-field-label">Confirm Password</p><div className="relative"><Lock size={15} className="absolute left-0 top-3.5 text-ink-mute" /><input type="password" required value={form.confirm} onChange={set('confirm')} className="kx-input pl-7" placeholder="Repeat password" /></div></div>
          <button type="submit" disabled={busy} className="kx-btn-solid w-full">{busy ? <Loader2 size={14} className="animate-spin" /> : <>Create Account <ArrowRight size={14} /></>}</button>
        </form>
        <div className="my-7 flex items-center gap-4"><div className="h-px flex-1 bg-line" /><span className="text-[10px] uppercase text-ink-mute" style={{ letterSpacing: '0.24em' }}>or</span><div className="h-px flex-1 bg-line" /></div>
        <GoogleButton />
        <p className="mt-8 text-center text-sm text-ink-soft">Already have an account? <Link to="/login" className="text-gold-deep underline-offset-4 hover:underline">Sign in</Link></p>
      </motion.div>
    </AuthSplit>
  );
}
