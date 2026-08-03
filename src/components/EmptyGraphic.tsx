interface EmptyGraphicProps {
  className?: string;
}

export default function EmptyGraphic({ className = '' }: EmptyGraphicProps) {
  return (
    <div className={`relative grid place-items-center ${className}`}>
      <svg viewBox="0 0 120 120" className="h-24 w-24" fill="none" aria-hidden="true">
        <circle cx="60" cy="60" r="54" stroke="var(--line)" strokeWidth="0.8" />
        <circle cx="60" cy="60" r="40" stroke="var(--gold)" strokeWidth="0.6" opacity="0.4" />
        <path d="M60 28 L72 36 L72 56 Q72 70 60 78 Q48 70 48 56 L48 36 Z" stroke="var(--gold)" strokeWidth="1" opacity="0.5" />
        <text x="60" y="62" textAnchor="middle" fontFamily="Cormorant Garamond" fontSize="20" fontStyle="italic" fill="var(--gold)" opacity="0.5">K</text>
      </svg>
    </div>
  );
}
