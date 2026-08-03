import { useEffect } from 'react';

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
}

const BASE_TITLE = 'Kalmat Fragrance — The Art of Luxury Perfumery';
const BASE_DESC =
  'Discover Kalmat Fragrance — handcrafted luxury perfumes with rare oud, rose, and amber. Shop our collections of artisanal fragrances crafted for the connoisseur.';

export default function Seo({ title, description, image, type = 'website' }: SeoProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} | Kalmat Fragrance` : BASE_TITLE;
    document.title = fullTitle;

    const setMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let el = document.head.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const desc = description || BASE_DESC;
    setMeta('description', desc);
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', desc, 'property');
    setMeta('og:type', type, 'property');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', desc);
    if (image) {
      setMeta('og:image', image, 'property');
      setMeta('twitter:image', image);
    }
  }, [title, description, image, type]);

  return null;
}
