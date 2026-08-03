import Seo from '@/components/Seo';
import { BRAND } from '@/lib/constants';

const SECTIONS = [
  { title: 'Information We Collect', body: 'We collect information you provide directly to us — such as your name, email, phone number, shipping address, and payment details when you place an order or create an account. We also automatically collect certain technical data including your IP address, browser type, and browsing activity on our website.' },
  { title: 'How We Use Your Information', body: 'We use your information to process and ship your orders, communicate with you about your purchases, send marketing communications (with your consent), improve our website and services, and comply with legal obligations.' },
  { title: 'Information Sharing', body: 'We do not sell, trade, or rent your personal information to third parties. We may share your data with trusted service providers who assist us in operating our website and fulfilling orders — such as payment processors and shipping companies — under strict confidentiality agreements.' },
  { title: 'Data Security', body: 'We implement industry-standard security measures to protect your personal information, including SSL encryption for data transmission and secure storage systems. However, no method of transmission over the internet is completely secure.' },
  { title: 'Cookies', body: 'We use cookies and similar technologies to enhance your browsing experience, remember your preferences, and analyze website traffic. You can control cookies through your browser settings.' },
  { title: 'Your Rights', body: 'You have the right to access, correct, or delete your personal information. You may also opt out of marketing communications at any time. To exercise these rights, please contact us using the information below.' },
  { title: 'Children\'s Privacy', body: 'Our website is not intended for individuals under the age of 16. We do not knowingly collect personal information from children.' },
  { title: 'Changes to This Policy', body: 'We may update this privacy policy from time to time. We will notify you of any significant changes by posting the new policy on this page with a revised date.' },
];

export default function PrivacyPolicy() {
  return (
    <>
      <Seo title="Privacy Policy" />
      <section className="kx-container py-12 lg:py-16">
        <p className="kx-eyebrow">Legal</p>
        <h1 className="mt-3 font-display text-5xl font-light text-charcoal">Privacy Policy</h1>
        <div className="kx-gold-line mt-5" />
        <p className="mt-6 text-sm text-ink-mute">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="mt-12 max-w-3xl space-y-10">
          <p className="text-base font-light leading-relaxed text-ink-soft">At {BRAND.name}, we are committed to protecting your privacy and ensuring the security of your personal information. This privacy policy explains how we collect, use, and safeguard your data.</p>
          {SECTIONS.map((s, i) => (
            <div key={i}>
              <div className="flex items-baseline gap-3">
                <span className="font-display text-sm italic text-gold/50">{String(i + 1).padStart(2, '0')}</span>
                <h2 className="font-display text-2xl text-charcoal">{s.title}</h2>
              </div>
              <div className="kx-gold-line mt-3" />
              <p className="mt-4 text-sm font-light leading-relaxed text-ink-soft">{s.body}</p>
            </div>
          ))}
          <div className="border-t border-line pt-8">
            <p className="text-sm font-light text-ink-soft">For privacy-related inquiries, contact us at <a href={`mailto:${BRAND.email}`} className="text-gold-deep">{BRAND.email}</a>.</p>
          </div>
        </div>
      </section>
    </>
  );
}
