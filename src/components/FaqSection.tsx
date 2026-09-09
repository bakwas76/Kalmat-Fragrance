// import { useState } from 'react';
// import { ChevronDown } from 'lucide-react';

// const FAQS = [
//   {
//     question: 'How long does shipping take?',
//     answer: 'Orders within Pakistan typically arrive within 3–5 business days. You will receive a tracking link via email once your order ships.',
//   },
//   {
//     question: 'What is your return policy?',
//     answer: 'We accept returns within 7 days of delivery for unopened, unused products. Please contact our concierge team to initiate a return.',
//   },
//   {
//     question: 'How can I track my order?',
//     answer: 'You can track your order anytime using our Track Order page with your order number and email address.',
//   },
//   {
//     question: 'Are your fragrances suitable for sensitive skin?',
//     answer: 'Our fragrances are crafted with premium ingredients. If you have known sensitivities or allergies, we recommend a patch test before full application.',
//   },
//   {
//     question: 'What payment methods do you accept?',
//     answer: 'We accept major debit/credit cards, bank transfer, and cash on delivery in select areas. All online payments are processed securely.',
//   },
// ];

// export default function FaqSection() {
//   const [openIndex, setOpenIndex] = useState<number | null>(null);

//   return (
//     <div className="mt-16">
//       <p className="kx-eyebrow">Questions & Answers</p>
//       <h2 className="mt-3 font-display text-3xl font-light text-charcoal">Frequently Asked Questions</h2>
//       <div className="kx-gold-line mt-5" />

//       <div className="mt-10 divide-y divide-line">
//         {FAQS.map((faq, i) => {
//           const isOpen = openIndex === i;
//           return (
//             <div key={i} className="py-5">
//               <button
//                 onClick={() => setOpenIndex(isOpen ? null : i)}
//                 className="flex w-full items-center justify-between text-left"
//               >
//                 <span className="text-sm font-medium text-charcoal">{faq.question}</span>
//                 <ChevronDown
//                   size={16}
//                   className={`shrink-0 text-gold transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
//                 />
//               </button>
//               {isOpen && (
//                 <p className="mt-3 text-sm font-light leading-relaxed text-ink-mute">{faq.answer}</p>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }


import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    question: 'What makes Kalmat Fragrance perfumes different?',
    answer: 'Kalmat Fragrance handcrafts every perfume using rare oud, rose, and amber essences, composed in small batches for a richer, longer-lasting scent than mass-market fragrances.',
  },
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

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
};

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
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
                aria-expanded={isOpen}
              >
                <h3 className="text-sm font-medium text-charcoal">{faq.question}</h3>
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-gold transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {/* Answer stays in the DOM at all times (grid-rows collapse) so search
                  engines and AI crawlers can read it even before the user clicks. */}
              <div
                className={`grid transition-all duration-300 ${isOpen ? 'mt-3 grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
              >
                <p className="overflow-hidden text-sm font-light leading-relaxed text-ink-mute">{faq.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
