import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, MapPin, Plus, Trash2, Check, Loader2, Star, Phone, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { PAKISTAN_CITIES } from '@/lib/constants';
import type { SavedAddress } from '@/types';
import Seo from '@/components/Seo';

interface ProfileForm { full_name: string; phone: string; }
interface AddressForm { label: string; full_name: string; phone: string; address_line: string; city: string; postal_code: string; is_default: boolean; }

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);
  const [addrId, setAddrId] = useState<string | null>(null);

  const profileForm = useForm<ProfileForm>({ defaultValues: { full_name: profile?.full_name || '', phone: profile?.phone || '' } });
  const addrForm = useForm<AddressForm>({ defaultValues: { city: '', is_default: false } });

  useEffect(() => {
    if (profile) { profileForm.reset({ full_name: profile.full_name || '', phone: profile.phone || '' }); }
  }, [profile, profileForm]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('addresses').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setAddresses((data as SavedAddress[]) || []);
    })();
  }, [user]);

  if (!user) return null;

  const onProfileSubmit = async (data: ProfileForm) => {
    setSavingProfile(true);
    const { error } = await supabase.from('profiles').update({ full_name: data.full_name, phone: data.phone }).eq('id', user.id);
    setSavingProfile(false);
    if (error) { toast('Could not save profile', 'error'); return; }
    await refreshProfile();
    toast('Profile updated');
  };

  const loadAddresses = async () => {
    const { data } = await supabase.from('addresses').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setAddresses((data as SavedAddress[]) || []);
  };

  const onAddrSubmit = async (data: AddressForm) => {
    setSavingAddr(true);
    if (data.is_default) {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
    }
    if (addrId) {
      const { error } = await supabase.from('addresses').update({ label: data.label, full_name: data.full_name, phone: data.phone, address_line: data.address_line, city: data.city, country: 'Pakistan', postal_code: data.postal_code, is_default: data.is_default }).eq('id', addrId);
      if (error) { toast('Could not update address', 'error'); setSavingAddr(false); return; }
      toast('Address updated');
    } else {
      const { error } = await supabase.from('addresses').insert({ user_id: user.id, label: data.label, full_name: data.full_name, phone: data.phone, address_line: data.address_line, city: data.city, country: 'Pakistan', postal_code: data.postal_code, is_default: data.is_default });
      if (error) { toast('Could not save address', 'error'); setSavingAddr(false); return; }
      toast('Address added');
    }
    await loadAddresses();
    setSavingAddr(false);
    setShowAddrForm(false);
    setAddrId(null);
    addrForm.reset({ city: '', is_default: false });
  };

  const deleteAddr = async (id: string) => {
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    if (error) { toast('Could not delete', 'error'); return; }
    setAddresses((a) => a.filter((x) => x.id !== id));
    toast('Address removed');
  };

  const setDefault = async (id: string) => {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    await loadAddresses();
    toast('Default address updated');
  };

  const editAddr = (a: SavedAddress) => {
    setAddrId(a.id);
    setShowAddrForm(true);
    addrForm.reset({ label: a.label, full_name: a.full_name, phone: a.phone, address_line: a.address_line, city: a.city, postal_code: a.postal_code, is_default: a.is_default });
  };

  return (
    <>
      <Seo title="Profile" />
      <section className="kx-container py-12 lg:py-16">
        <p className="kx-eyebrow">Account Settings</p>
        <h1 className="mt-3 font-display text-5xl font-light text-charcoal">My Profile</h1>
        <div className="kx-gold-line mt-5" />

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Profile */}
          <div>
            <div className="flex items-center gap-3"><User className="h-5 w-5 text-gold" /><h2 className="font-display text-2xl text-charcoal">Personal Information</h2></div>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="mt-6 space-y-5">
              <div><p className="kx-field-label">Full Name</p><input {...profileForm.register('full_name')} className="kx-input" /></div>
              <div><p className="kx-field-label">Phone</p><input {...profileForm.register('phone')} className="kx-input" placeholder="03XX-XXXXXXX" /></div>
              <div className="flex items-center gap-3 pt-2 text-sm text-ink-mute"><Mail size={15} /><span>{user.email}</span></div>
              <button type="submit" disabled={savingProfile} className="kx-btn-solid">{savingProfile ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Check size={14} /> Save Changes</>}</button>
            </form>
          </div>

          {/* Addresses */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-gold" /><h2 className="font-display text-2xl text-charcoal">Saved Addresses</h2></div>
              {!showAddrForm && <button onClick={() => { setAddrId(null); setShowAddrForm(true); addrForm.reset({ city: '', is_default: false }); }} className="kx-btn-ghost"><Plus size={14} /> Add</button>}
            </div>

            {showAddrForm ? (
              <form onSubmit={addrForm.handleSubmit(onAddrSubmit)} className="mt-6 space-y-4 border border-line bg-ivory-2 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><p className="kx-field-label">Label</p><input {...addrForm.register('label', { required: true })} className="kx-input" placeholder="Home, Office..." /></div>
                  <div><p className="kx-field-label">Recipient Name</p><input {...addrForm.register('full_name', { required: true })} className="kx-input" /></div>
                  <div><p className="kx-field-label">Phone</p><input {...addrForm.register('phone', { required: true })} className="kx-input" placeholder="03XX-XXXXXXX" /></div>
                  <div><p className="kx-field-label">Postal Code</p><input {...addrForm.register('postal_code', { required: true })} className="kx-input" /></div>
                </div>
                <div><p className="kx-field-label">Street Address</p><input {...addrForm.register('address_line', { required: true })} className="kx-input" placeholder="House #, Street, Area" /></div>
                <div><p className="kx-field-label">City</p><select {...addrForm.register('city', { required: true })} className="kx-select" defaultValue=""><option value="" disabled>Select city</option>{PAKISTAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft"><input type="checkbox" {...addrForm.register('is_default')} className="h-4 w-4 accent-gold" /> Set as default address</label>
                <div className="flex gap-3">
                  <button type="submit" disabled={savingAddr} className="kx-btn-solid flex-1">{savingAddr ? <Loader2 size={14} className="animate-spin" /> : 'Save'}</button>
                  <button type="button" onClick={() => { setShowAddrForm(false); setAddrId(null); }} className="kx-btn-ghost">Cancel</button>
                </div>
              </form>
            ) : addresses.length === 0 ? (
              <div className="mt-6 border border-line bg-ivory-2 py-12 text-center"><MapPin size={28} className="mx-auto text-gold/30" /><p className="mt-4 text-sm text-ink-mute">No saved addresses</p></div>
            ) : (
              <div className="mt-6 space-y-4">
                {addresses.map((a) => (
                  <div key={a.id} className="group border border-line bg-white p-5">
                    <div className="flex items-start justify-between">
                      <div><p className="text-sm font-medium text-charcoal">{a.label} {a.is_default && <span className="ml-2 text-[10px] uppercase text-gold-deep" style={{ letterSpacing: '0.2em' }}>Default</span>}</p><p className="mt-1 text-sm font-light text-ink-soft">{a.full_name} · {a.phone}</p><p className="mt-1 text-sm font-light text-ink-soft">{a.address_line}, {a.city}</p></div>
                      <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={() => editAddr(a)} className="text-ink-mute hover:text-gold-deep"><Star size={15} /></button>
                        <button onClick={() => deleteAddr(a.id)} className="text-ink-mute hover:text-danger"><Trash2 size={15} /></button>
                      </div>
                    </div>
                    {!a.is_default && <button onClick={() => setDefault(a.id)} className="mt-3 text-[10px] uppercase text-gold-deep hover:text-charcoal" style={{ letterSpacing: '0.2em' }}>Set as default</button>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
