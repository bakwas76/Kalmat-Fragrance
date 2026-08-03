import Seo from '@/components/Seo';
import { BRAND } from '@/lib/constants';

const SECTIONS = [
  { title: 'Acceptance of Terms', body: 'By accessing and using our website, you accept and agree to be bound by these terms and conditions. If you do not agree with any part of these terms, you must not use our website.' },
  { title: 'Products & Pricing', body: 'All products are subject to availability. We reserve the right to modify or discontinue any product without notice. Prices are listed in Pakistani Rupees (PKR) and are subject to change. We strive for accuracy in pricing but reserve the right to correct errors.' },
  { title: 'Orders', body: 'When you place an order, you receive an order confirmation email. All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order. Payment must be received before orders are shipped, unless Cash on Delivery is selected.' },
  { title: 'Shipping & Delivery', body: 'We ship across Pakistan. Delivery times are estimates and may vary. Complimentary shipping is offered on orders above Rs 5,000. Risk of loss passes to you upon delivery.' },
  { title: 'Returns & Refunds', body: 'Due to the nature of fragrance products, we accept returns only for damaged or incorrect items, reported within 7 days of delivery. Refunds are processed to the original payment method.' },
  { title: 'Intellectual Property', body: 'All content on this website — including text, graphics, logos, and images — is the property of Kalmat Fragrance and protected by intellectual property laws. You may not reproduce or distribute our content without permission.' },
  { title: 'User Conduct', body: 'You agree to use our website only for lawful purposes and in a manner that does not infringe the rights of others. You must not attempt to gain unauthorized access to our systems or use automated tools to scrape data.' },
  { title: 'Limitation of Liability', body: 'Kalmat Fragrance shall not be liable for any indirect, incidental, or consequential damages arising from the use of our website or products. Our total liability shall not exceed the amount you paid for the relevant order.' },
  { title: 'Governing Law', body: 'These terms are governed by the laws of Pakistan. Any disputes shall be resolved in the courts of Lahore, Punjab, Pakistan.' },
];

export default function Terms() {
  return (
    <>
      <Seo title="Terms & Conditions" />
      <section className="kx-container py-12 lg:py-16">
        <p className="kx-eyebrow">Legal</p>
        <h1 className="mt-3 font-display text-5xl font-light text-charcoal">Terms & Conditions</h1>
        <div className="kx-gold-line mt-5" />
        <p className="mt-6 text-sm text-ink-mute">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="mt-12 max-w-3xl space-y-10">
          <p className="text-base font-light leading-relaxed text-ink-soft">Welcome to {BRAND.name}. By using our website and services, you agree to the following terms and conditions. Please read them carefully.</p>
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
            <p className="text-sm font-light text-ink-soft">For questions about these terms, contact us at <a href={`mailto:${BRAND.email}`} className="text-gold-deep">{BRAND.email}</a>.</p>
          </div>
        </div>
      </section>
    </>
  );
}
