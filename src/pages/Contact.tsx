import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import Breadcrumbs from '@/components/Breadcrumbs';
import FaqSection from '@/components/FaqSection';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, MessageCircle, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';
import { BRAND } from '@/lib/constants';
import Seo from '@/components/Seo';

interface ContactForm { name: string; email: string; phone: string; subject: string; message: string; }

const CONTACT_AUDIENCE_POINTS = [
  'Buyers with a question about an existing order, delivery, or return',
  'Shoppers who want product advice before choosing a fragrance or collection',
  'Anyone with a general question, partnership inquiry, or feedback for our team',
];

const HOW_TO_CONTACT_STEPS = [
  'For urgent order or delivery questions, message us on WhatsApp — it is usually the fastest way to reach our concierge.',
  'For detailed questions, attachments, or documentation, email us and we will reply as soon as possible.',
  "If your question is about a specific order, have your order number ready — find it in your order confirmation email or on our Track Order page.",
  'If you would rather talk it through, call us directly using the number below.',
];

export const CONTACT_WEBPAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'How to Reach Kalmat Fragrance Support | Kalmat Fragrance',
  description:
    "Reach Kalmat Fragrance's concierge team in Karachi by phone, WhatsApp, or email — for order help, returns, and product questions across Pakistan.",
  url: 'https://www.kalmatfragrance.store/contact',
  dateModified: new Date().toISOString().slice(0, 10),
  isPartOf: {
    '@type': 'WebSite',
    name: BRAND.name,
    url: 'https://www.kalmatfragrance.store/',
  },
  about: {
    '@type': 'Organization',
    name: BRAND.name,
  },
};

export const CONTACT_SEO_TITLE = 'How to Reach Kalmat Fragrance Support';
export const CONTACT_SEO_DESCRIPTION =
  "Reach Kalmat Fragrance's concierge team in Karachi by phone, WhatsApp, or email — for order help, returns, and product questions across Pakistan.";

export const CONTACT_ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: BRAND.name,
  url: 'https://www.kalmatfragrance.store/',
  logo: 'https://www.kalmatfragrance.store/logo_1.png',
  email: BRAND.email,
  telephone: BRAND.phone,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Karachi',
    addressRegion: 'Sindh',
    addressCountry: 'PK',
  },
  sameAs: [BRAND.instagram, BRAND.facebook, BRAND.twitter].filter(
    (url) => url && !url.match(/^https?:\/\/(www\.)?(instagram|facebook|twitter|x)\.com\/?$/),
  ),
};

export default function Contact() {
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactForm>();
  const [busy, setBusy] = useState(false);
  const [reviewCount, setReviewCount] = useState<number | null>(null);

  // Live count pulled directly from our own database — a real, verifiable trust signal
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { count } = await supabase
        .from('product_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');
      if (isMounted) setReviewCount(count || 0);
    })();
    return () => { isMounted = false; };
  }, []);

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
      <Seo
       title={CONTACT_SEO_TITLE}
       description={CONTACT_SEO_DESCRIPTION}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(CONTACT_ORGANIZATION_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(CONTACT_WEBPAGE_SCHEMA) }} />
      <Breadcrumbs items={[{ label: 'Contact' }]} />
      <section className="kx-container py-12 lg:py-16">
        <p className="kx-eyebrow">We're Here to Help</p>
        <h1 className="mt-3 font-display text-5xl font-light text-charcoal">Contact Us</h1>
        <div className="kx-gold-line mt-5" />
        <p className="mt-6 max-w-2xl text-sm font-light leading-relaxed text-ink-soft">
          <strong className="font-medium text-charcoal">In short:</strong> our concierge team is a real
          team based in Karachi — reach us on WhatsApp for the fastest reply, by email for detailed
          questions, or by phone if you would rather talk it through. See the form and details below.
        </p>
        <p className="mt-3 text-xs font-light text-ink-mute">
          Page last updated:{' '}
          {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}.
        </p>

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

        {/* Who this page is for / how to contact / why reach out (compact — helps AI/answer engines extract a direct answer) */}
        <div className="mt-16 border-t border-line pt-14">
          <div className="grid gap-10 sm:grid-cols-2 sm:gap-14">
            <div>
              <h3 className="font-display text-lg font-light text-charcoal">Who Should Use This Page</h3>
              <p className="mt-4 text-sm font-light leading-relaxed text-ink-soft">
                Anyone in Pakistan's luxury perfume market who needs to reach the Kalmat Fragrance team
                directly — whether that means resolving an order, asking a product question, or getting
                in touch for another reason.
              </p>
              <div className="mt-6 space-y-3">
                {CONTACT_AUDIENCE_POINTS.map((point) => (
                  <p key={point} className="border-t border-line pt-3 text-xs font-light leading-relaxed text-ink-soft">
                    {point}
                  </p>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-display text-lg font-light text-charcoal">How Do I Contact Kalmat Fragrance?</h3>
              <p className="mt-3 text-sm font-light leading-relaxed text-ink-soft">
                What is the quickest way to reach us, and when should you use each channel? Here is how:
              </p>
              <ol className="mt-4 space-y-2.5">
                {HOW_TO_CONTACT_STEPS.map((step, i) => (
                  <li key={step} className="flex gap-3 text-sm font-light leading-relaxed text-ink-soft">
                    <span className="shrink-0 font-display text-xs italic text-gold-deep">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-14 border-t border-line pt-12">
            <h3 className="font-display text-lg font-light text-charcoal">Why Reach Out to Us Directly</h3>
            <p className="mt-4 max-w-3xl text-sm font-light leading-relaxed text-ink-soft">
              This page is staffed and written by the Kalmat Fragrance team in Karachi. When you message
              us, you are reaching the same people who first-hand hand-blend and test every bottle — for
              example, if you ask about a specific note or batch, the person answering has actually
              smelled and checked it, not read it off a script. Before you write to us, you can also
              browse our{' '}
              <Link to="/shop" className="underline decoration-gold/40 underline-offset-2 hover:text-gold-deep">
                shop
              </Link>{' '}
              or read{' '}
              <Link to="/about" className="underline decoration-gold/40 underline-offset-2 hover:text-gold-deep">
                our story
              </Link>{' '}
              to see who you would be talking to.
            </p>
            {reviewCount !== null && (
              <p className="mt-3 max-w-3xl text-sm font-light leading-relaxed text-ink-soft">
                Our concierge team stands behind {reviewCount} verified-buyer review{reviewCount !== 1 ? 's' : ''}{' '}
                approved across the site — a live count pulled directly from our own review records.
              </p>
            )}
            <p className="mt-3 max-w-3xl text-sm font-light leading-relaxed text-ink-soft">
              Every order ships nationwide across Pakistan (typically within 3–5 business days) with a
              trackable courier link, and any unopened, unused product can be returned within 7 days, no
              questions asked.
            </p>
          </div>
        </div>

        <FaqSection />
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
