interface BrandMarkProps {
  className?: string;
  showWordmark?: boolean;
  tone?: 'dark' | 'light';
  size?: 'nav' | 'compact' | 'footer';
}

const SIZE_CLASSES: Record<NonNullable<BrandMarkProps['size']>, string> = {
  nav: 'h-[40px] sm:h-[48px] lg:h-[56px]',
  compact: 'h-[52px] sm:h-[64px] lg:h-[78px]',
  footer: 'h-[78px] sm:h-[100px] lg:h-[130px]',
};

export default function BrandMark({ className = '', size = 'nav' }: BrandMarkProps) {
  return (
    <img
      src="/image.svg"
      alt="Kalmat Fragrance"
      className={`${SIZE_CLASSES[size]} w-auto max-w-full object-contain select-none ${className}`.trim()}
      draggable={false}
    />
  );
}
