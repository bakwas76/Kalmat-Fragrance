import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Plus, Check } from 'lucide-react';
import type { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useToast } from '@/contexts/ToastContext';
import { formatPrice, discountPercent } from '@/lib/format';
import RatingMeter from './RatingMeter';

interface ProductTileProps {
  product: Product;
  index?: number;
}

export default function ProductTile({ product, index = 0 }: ProductTileProps) {
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const { toast } = useToast();
  const [added, setAdded] = useState(false);
  const [toggling, setToggling] = useState(false);

  const wished = isWishlisted(product.id);
  const outOfStock = product.stock <= 0;
  const discount = discountPercent(product.price, product.compare_at_price);

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addItem(product, 1);
    setAdded(true);
    toast('Added to your bag');
    setTimeout(() => setAdded(false), 1600);
  };

  const onWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setToggling(true);
    await toggle(product);
    setToggling(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.08, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link to={`/product/${product.slug}`} className="group block">
        {/* Image */}
        <div className="kx-img-frame relative aspect-[4/5] border border-line-soft bg-ivory-2">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} loading="lazy" className="kx-img-zoom h-full w-full object-cover" />
          ) : (
            <div className="kx-img-zoom h-full w-full grid place-items-center" style={{ background: 'linear-gradient(160deg, #F3ECE0 0%, #ECE3D4 100%)' }}>
              <span className="font-display text-4xl italic text-gold/30">{product.brand?.charAt(0) || 'K'}</span>
            </div>
          )}

          {/* Badges — top left */}
          <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
            {product.is_new && !outOfStock && <span className="kx-badge-new">New</span>}
            {discount > 0 && !outOfStock && <span className="kx-badge-sale">−{discount}%</span>}
            {product.best_seller && !outOfStock && !product.is_new && <span className="kx-badge-best">Bestseller</span>}
            {outOfStock && <span className="kx-badge-out">Sold Out</span>}
          </div>

          {/* Wishlist — top right */}
          <button
            onClick={onWishlist}
            disabled={toggling}
            aria-label="Toggle wishlist"
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center border border-ivory/40 bg-charcoal/30 text-ivory backdrop-blur-md transition-all duration-300 hover:bg-charcoal/60 disabled:opacity-40"
          >
            <Heart size={15} fill={wished ? '#B89B5E' : 'none'} stroke={wished ? '#B89B5E' : '#FAF6EF'} strokeWidth={1.5} />
          </button>

          {/* Add to bag — bottom slide-up */}
          <div className="absolute inset-x-3 bottom-3 translate-y-[130%] opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 group-hover:opacity-100">
            <button
              onClick={onAdd}
              disabled={outOfStock || added}
              className="flex w-full items-center justify-center gap-2.5 bg-charcoal py-3.5 text-[10px] font-medium uppercase text-ivory transition-all duration-300 hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-50"
              style={{ letterSpacing: '0.28em' }}
            >
              {added ? (<><Check size={15} /> Added</>) : (<><Plus size={15} /> Add to Bag</>)}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-5 space-y-2">
          <p className="text-[10px] font-medium uppercase text-ink-mute" style={{ letterSpacing: '0.24em' }}>{product.brand}</p>
          <h3 className="font-display text-xl font-normal leading-tight text-charcoal transition-colors duration-300 group-hover:text-gold-deep">{product.name}</h3>
          <div className="flex items-center gap-3">
            <RatingMeter rating={product.rating} count={product.reviews_count} size={12} />
          </div>
          <div className="flex items-baseline gap-3 pt-1">
            <span className="font-display text-lg text-charcoal">{formatPrice(product.price)}</span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-sm text-ink-mute line-through">{formatPrice(product.compare_at_price)}</span>
            )}
          </div>
          <p className="text-[11px] font-light text-ink-mute">{product.volume_ml}ml · {product.gender}</p>
        </div>
      </Link>
    </motion.div>
  );
}
