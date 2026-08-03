import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

interface RatingMeterProps {
  rating: number;
  count?: number;
  size?: number;
  showCount?: boolean;
  tone?: 'dark' | 'light';
}

export default function RatingMeter({ rating, count, size = 14, showCount = true, tone = 'dark' }: RatingMeterProps) {
  const full = Math.floor(rating);
  const empty = 5 - full;
  const starColor = '#B89B5E';
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: full }).map((_, i) => (
          <Star key={`f${i}`} size={size} fill={starColor} strokeWidth={0} />
        ))}
        {Array.from({ length: empty }).map((_, i) => (
          <Star key={`e${i}`} size={size} stroke={starColor} strokeWidth={1} opacity={0.35} />
        ))}
      </div>
      {showCount && (
        <span className={`text-[11px] font-light ${tone === 'light' ? 'text-ivory/60' : 'text-ink-mute'}`}>
          {rating.toFixed(1)}{count !== undefined ? ` (${count})` : ''}
        </span>
      )}
    </div>
  );
}
