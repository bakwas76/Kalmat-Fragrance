import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, Loader2, Sparkles } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import Seo from '@/components/Seo';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';

interface WaitlistForm {
  email: string;
}

export default function Waitlist() {
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<WaitlistForm>();
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (data: WaitlistForm) => {
    setBusy(true);
    const { error } = await supabase.from('waitlist_subscribers').insert({ email: data.email });
    setBusy(false);

    if (error) {
      if (error.code === '23505') {
        toast("You're already on the waitlist!", 'error');
      } else {
        toast('Could not join the waitlist', 'error');
      }
      return;
    }

    setSubmitted(true);
    reset();
  };

  return (
    <>
      <Seo
        title="Waitlist"
        description="Join the Kalmat Fragrance waitlist to be the first to know about upcoming drops and limited releases."
      />
      <Breadcrumbs items={[{ label: 'Waitlist' }]} />
      <section className="kx-container py-12 lg:py-16">
        <p className="kx-eyebrow">Coming Soon</p>
        <h1 className="mt-3 font-display text-5xl font-light text-charcoal">Join the Waitlist</h1>
        <div className="kx-gold-line mt-5" />
        <p className="mt-6 max-w-xl text-sm text-ink-mute">
          Be the first to hear about new arrivals, limited-edition scents, and exclusive early access
          before they launch.
        </p>

        <div className="mt-12 max-w-md">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-start gap-4 border border-success/30 bg-success/5 p-7"
            >
              <Sparkles className="h-6 w-6 shrink-0 text-success" strokeWidth={1.3} />
              <div>
                <p className="text-sm font-medium text-charcoal">You're on the list!</p>
                <p className="mt-1 text-xs text-ink-mute">
                  We'll email you the moment new scents drop.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleSubmit(onSubmit)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-5"
            >
              <div>
                <p className="kx-field-label">Email</p>
                <input
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  className="kx-input"
                  placeholder="you@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
                )}
              </div>
              <button type="submit" disabled={busy} className="kx-btn-solid">
                {busy ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <Mail size={14} /> Join Waitlist
                  </>
                )}
              </button>
            </motion.form>
          )}
        </div>
      </section>
    </>
  );
}
