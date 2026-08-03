import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User as UserIcon, Phone, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import BrandMark from '@/components/BrandMark';
import Seo from '@/components/Seo';
import { AuthSplit } from './Login';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile]);

  useEffect(() => {
    if (!loading && profile?.phone && profile.phone.trim()) navigate('/', { replace: true });
  }, [loading, profile, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { toast('Please enter your name', 'error'); return; }
    if (phone.replace(/[^\d]/g, '').length < 10) { toast('Please enter a valid phone number', 'error'); return; }
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName.trim(), phone: phone.trim() }).eq('id', user.id);
    setBusy(false);
    if (error) { toast('Could not save. Try again.', 'error'); return; }
    await refreshProfile();
    toast('Profile completed');
    navigate('/', { replace: true });
  };

  return (
    <AuthSplit>
      <Seo title="Complete Profile" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mx-auto w-full max-w-sm">
        <BrandMark size="compact" className="mb-10" />
        <p className="kx-eyebrow">Almost There</p>
        <h1 className="mt-3 font-display text-4xl font-light text-charcoal">Complete Your Profile</h1>
        <div className="kx-gold-line mt-5" />
        <p className="mt-5 text-sm font-light text-ink-soft">Tell us a bit more so we can personalize your Kalmat experience.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div><p className="kx-field-label">Full Name</p><div className="relative"><UserIcon size={15} className="absolute left-0 top-3.5 text-ink-mute" /><input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="kx-input pl-7" placeholder="Your name" /></div></div>
          <div><p className="kx-field-label">Phone Number</p><div className="relative"><Phone size={15} className="absolute left-0 top-3.5 text-ink-mute" /><input required value={phone} onChange={(e) => setPhone(e.target.value)} className="kx-input pl-7" placeholder="03XX-XXXXXXX" /></div></div>
          <button type="submit" disabled={busy} className="kx-btn-solid w-full">{busy ? <Loader2 size={14} className="animate-spin" /> : <>Continue <ArrowRight size={14} /></>}</button>
        </form>
      </motion.div>
    </AuthSplit>
  );
}
