import { motion } from 'framer-motion';

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  tone?: 'dark' | 'light';
  index?: string;
}

export default function SectionTitle({ eyebrow, title, subtitle, align = 'center', tone = 'dark', index }: SectionTitleProps) {
  const isCenter = align === 'center';
  return (
    <div className={`flex flex-col ${isCenter ? 'items-center text-center' : 'items-start text-left'}`}>
      {index && <span className="mb-3 font-display text-sm italic text-gold/50">{index}</span>}
      {eyebrow && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="kx-eyebrow"
        >
          {eyebrow}
        </motion.p>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className={`mt-4 font-display text-4xl font-light leading-[1.05] sm:text-5xl lg:text-[3.5rem] ${tone === 'light' ? 'text-ivory' : 'text-charcoal'}`}
      >
        {title}
      </motion.h2>
      {isCenter && <div className="kx-gold-line mt-6" />}
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`mt-5 max-w-xl text-sm font-light leading-relaxed ${tone === 'light' ? 'text-ivory/60' : 'text-ink-soft'} ${isCenter ? 'mx-auto' : ''}`}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
