import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import BrandMark from '@/components/BrandMark';
import Seo from '@/components/Seo';

export default function NotFound() {
  return (
    <>
      <Seo title="Page Not Found" />
      <section className="kx-container flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
        <BrandMark size="compact" className="mb-12" />
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-display text-8xl font-light text-gold/30">404</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4 font-display text-4xl font-light text-charcoal">Page Not Found</motion.h1>
        <div className="kx-gold-line mx-auto mt-6" />
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-6 max-w-md text-sm font-light text-ink-soft">The page you're looking for has drifted away like a forgotten scent. Let's guide you back.</motion.p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link to="/" className="kx-btn-solid">Return Home <ArrowRight size={14} /></Link>
          <Link to="/shop" className="kx-btn-ghost">Browse Fragrances</Link>
        </motion.div>
      </section>
    </>
  );
}
