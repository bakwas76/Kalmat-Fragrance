import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  to?: string; // agar to nahi diya to ye current page maana jayega (clickable nahi hoga)
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div className="kx-container pt-24 lg:pt-28">
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
