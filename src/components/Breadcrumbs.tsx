import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  to?: string; // agar to nahi diya to ye current page maana jayega (clickable nahi hoga)
}

const SITE_URL = 'https://www.kalmatfragrance.store';

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      ...items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: item.label,
        item: `${SITE_URL}${item.to || (typeof window !== 'undefined' ? window.location.pathname : '')}`,
      })),
    ],
  };

  return (
    <div className="kx-container pt-24 lg:pt-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="flex items-center gap-2 text-[10px] uppercase text-ink-mute" style={{ letterSpacing: '0.2em' }}>
        <Link to="/" className="hover:text-gold-deep">Home</Link>
        <ChevronRight size={12} />
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-2">
            {item.to ? (
              <Link to={item.to} className="hover:text-gold-deep">{item.label}</Link>
            ) : (
              <span className="text-charcoal">{item.label}</span>
            )}
            {i < items.length - 1 && <ChevronRight size={12} />}
          </span>
        ))}
      </div>
    </div>
  );
}
