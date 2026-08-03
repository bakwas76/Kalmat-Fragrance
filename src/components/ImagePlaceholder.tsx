import { ImageIcon } from 'lucide-react';

interface ImagePlaceholderProps {
  label?: string;
  iconSize?: number;
  className?: string;
  rounded?: string;
  showLabel?: boolean;
}

export default function ImagePlaceholder({
  label = 'No Image Uploaded',
  iconSize = 28,
  className = '',
  rounded = 'rounded-[20px]',
  showLabel = true,
}: ImagePlaceholderProps) {
  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center gap-3 overflow-hidden border border-black/[0.06] ${rounded}`}
      style={{
        background: 'linear-gradient(160deg, #F7F4EE 0%, #ECE7DE 55%, #E3DDD2 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-[42%] h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(200,169,106,0.14) 0%, transparent 68%)',
        }}
      />
      <div className="relative grid place-items-center rounded-full border border-black/[0.08] bg-white/60 text-ink-mute backdrop-blur-sm"
        style={{ width: iconSize + 20, height: iconSize + 20 }}
      >
        <ImageIcon size={iconSize} strokeWidth={1.4} />
      </div>
      {showLabel && (
        <p className="relative text-center text-[10px] uppercase tracking-[0.22em] text-ink-mute">
          {label}
        </p>
      )}
    </div>
  );
}
