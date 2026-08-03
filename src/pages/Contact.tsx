import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, MessageCircle, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';
import { BRAND } from '@/lib/constants';
import Seo from '@/components/Seo';

interface ContactForm { name: string; email: string; phone: string; subject: string; message: string; }

export default function Contact() {
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactForm>();
  const [busy, setBusy] = useState(false);

  const onSubmit = async (data: ContactForm) => {
    setBusy(true);
    const { error } = await supabase.from('contact_messages').insert({ name: data.name, email: data.email, phone: data.phone || null, subject: data.subject, message: data.message });
    setBusy(false);
    if (error) { toast('Could not send your message', 'error'); return; }
    toast('Message sent. We will be in touch shortly.');
    reset();
  };

  return (
    <>
      <Seo title="Contact" description="Get in touch with the Kalmat Fragrance concierge." />
      <section className="kx-container py-12 lg:py-16">
        <p className="kx-eyebrow">We're Here to Help</p>
        <h1 className="mt-3 font-display text-5xl font-light text-charcoal">Contact Us</h1>
        <div className="kx-gold-line mt-5" />

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_400px] lg:gap-16">
          {/* Form */}
          <motion.form onSubmit={handleSubmit(onSubmit)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div><p className="kx-field-label">Name</p><input {...register('name', { required: 'Name is required' })} className="kx-input" placeholder="Your name" />{errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}</div>
              <div><p className="kx-field-label">Email</p><input type="email" {...register('email', { required: 'Email is required' })} className="kx-input" placeholder="you@email.com" />{errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}</div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div><p className="kx-field-label">Phone (optional)</p><input {...register('phone')} className="kx-input" placeholder="03XX-XXXXXXX" /></div>
              <div><p className="kx-field-label">Subject</p><input {...register('subject', { required: 'Subject is required' })} className="kx-input" placeholder="How can we help?" />{errors.subject && <p className="mt-1 text-xs text-danger">{errors.subject.message}</p>}</div>
            </div>
            <div><p className="kx-field-label">Message</p><textarea rows={6} {...register('message', { required: 'Message is required' })} className="kx-textarea" placeholder="Tell us more..." />{errors.message && <p className="mt-1 text-xs text-danger">{errors.message.message}</p>}</div>
            <button type="submit" disabled={busy} className="kx-btn-solid">{busy ? <Loader2 size={14} className="animate-spin" /> : <><Send size={14} /> Send Message</>}</button>
          </motion.form>

          {/* Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="space-y-6">
            <div className="border border-line bg-ivory-2 p-7">
              <p className="kx-label mb-4">The Maison</p>
              <div className="space-y-5">
                <InfoRow Icon={MapPin} label="Address" value={BRAND.address} />
                <InfoRow Icon={Phone} label="Phone" value={BRAND.phone} href={`tel:${BRAND.phone}`} />
                <InfoRow Icon={Mail} label="Email" value={BRAND.email} href={`mailto:${BRAND.email}`} />
              </div>
            </div>
            <a href={BRAND.whatsapp ? `https://wa.me/${BRAND.whatsapp}` : '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 border border-success/30 bg-success/5 p-7 transition-colors hover:bg-success/10">
              <MessageCircle className="h-6 w-6 text-success" strokeWidth={1.3} />
              <div><p className="text-sm font-medium text-charcoal">Chat on WhatsApp</p><p className="text-xs text-ink-mute">Fastest way to reach our concierge</p></div>
            </a>
          </motion.div>
        </div>
      </section>
    </>
  );
}

function InfoRow({ Icon, label, value, href }: { Icon: React.ElementType; label: string; value: string; href?: string }) {
  const content = (
    <div className="flex items-start gap-3">
      <Icon size={16} className="mt-0.5 shrink-0 text-gold" />
      <div><p className="text-[10px] uppercase text-ink-mute" style={{ letterSpacing: '0.2em' }}>{label}</p><p className="mt-0.5 text-sm text-charcoal">{value}</p></div>
    </div>
  );
  return href ? <a href={href} className="block transition-opacity hover:opacity-70">{content}</a> : content;
}
