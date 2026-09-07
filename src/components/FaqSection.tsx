import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    question: 'How long does shipping take?',
    answer: 'Orders within Pakistan typically arrive within 3–5 business days. You will receive a tracking link via email once your order ships.',
  },
  {
    question: 'What is your return policy?',
    answer: 'We accept returns within 7 days of delivery for unopened, unused products. Please contact our concierge team to initiate a return.',
  },
  {
    question: 'How can I track my order?',
    answer: 'You can track your order anytime using our Track Order page with your order number and email address.',
  },
  {
    question: 'Are your fragrances suitable for sensitive skin?',
    answer: 'Our fragrances are crafted with premium ingredients. If you have known sensitivities or allergies, we recommend a patch test before full application.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept major debit/credit cards, bank transfer, and cash on delivery in select areas. All online payments are processed securely.',
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mt-16">
      <p className="kx-eyebrow">Questions & Answers</p>
      <h2 className="mt-3 font-display text-3xl font-light text-charcoal">Frequently Asked Questions</h2>
      <div className="kx-gold-line mt-5" />

      <div className="mt-10 divide-y divide-line">
        {FAQS.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} className="py-5">
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="text-sm font-medium text-charcoal">{faq.question}</span>
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-gold transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <p className="mt-3 text-sm font-light leading-relaxed text-ink-mute">{faq.answer}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
