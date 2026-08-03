import { useId, useLayoutEffect, useRef, useState } from 'react';
import type {
  AnnouncementBanner as BannerSettings,
  BannerAnimation,
  BannerSpeed,
  BannerFontWeight,
} from '@/types';

const FONT_WEIGHT_NUM: Record<BannerFontWeight, number> = {
  normal: 400,
  medium: 500,
  bold: 700,
};

const SPEED_FACTOR: Record<BannerSpeed, number> = {
  slow: 1.6,
  normal: 1,
  fast: 0.6,
};

// Fixed animation duration (seconds) per speed setting. These produce a
// consistent perceived speed regardless of viewport width or text length.
const MARQUEE_DURATION: Record<BannerSpeed, number> = {
  slow: 28, // ~25-30s range
  normal: 19, // ~18-20s range
  fast: 11, // ~10-12s range
};

function keyframes(uid: string): string {
  return `
@keyframes ${uid}-marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes ${uid}-fade {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
@keyframes ${uid}-slide-left {
  0% { transform: translateX(40px); opacity: 0; }
  15% { transform: translateX(0); opacity: 1; }
  85% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(-40px); opacity: 0; }
}
@keyframes ${uid}-slide-right {
  0% { transform: translateX(-40px); opacity: 0; }
  15% { transform: translateX(0); opacity: 1; }
  85% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(40px); opacity: 0; }
}
@keyframes ${uid}-slide-up {
  0% { transform: translateY(8px); opacity: 0; }
  15% { transform: translateY(0); opacity: 1; }
  85% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-8px); opacity: 0; }
}
@keyframes ${uid}-slide-down {
  0% { transform: translateY(-8px); opacity: 0; }
  15% { transform: translateY(0); opacity: 1; }
  85% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(8px); opacity: 0; }
}
@keyframes ${uid}-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
@keyframes ${uid}-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.04); opacity: 0.85; }
}`;
}

function animString(uid: string, animation: BannerAnimation, speed: BannerSpeed): string {
  const f = SPEED_FACTOR[speed] ?? 1;
  switch (animation) {
    case 'none':
      return 'none';
    case 'fade':
      return `${uid}-fade ${(3 * f).toFixed(2)}s ease-in-out infinite`;
    case 'slide-left':
      return `${uid}-slide-left ${(4 * f).toFixed(2)}s ease-in-out infinite`;
    case 'slide-right':
      return `${uid}-slide-right ${(4 * f).toFixed(2)}s ease-in-out infinite`;
    case 'slide-up':
      return `${uid}-slide-up ${(3 * f).toFixed(2)}s ease-in-out infinite`;
    case 'slide-down':
      return `${uid}-slide-down ${(3 * f).toFixed(2)}s ease-in-out infinite`;
    case 'bounce':
      return `${uid}-bounce ${(2 * f).toFixed(2)}s ease-in-out infinite`;
    case 'pulse':
      return `${uid}-pulse ${(2 * f).toFixed(2)}s ease-in-out infinite`;
    default:
      return 'none';
  }
}

interface BannerViewProps {
  settings: BannerSettings;
  placeholder?: string;
}

interface MarqueeProps {
  text: string;
  settings: BannerSettings;
  uid: string;
  containerStyle: React.CSSProperties;
  textStyle: React.CSSProperties;
  fontWeight: number;
}

function Marquee({ text, settings, uid, containerStyle, textStyle, fontWeight }: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [perHalf, setPerHalf] = useState(1);

  const gap = settings.padding * 2;

  useLayoutEffect(() => {
    const compute = () => {
      const container = containerRef.current;
      const measure = measureRef.current;
      if (!container || !measure) return;
      const viewportWidth = container.clientWidth;
      const singleWidth = measure.getBoundingClientRect().width;
      if (singleWidth <= 0 || viewportWidth <= 0) return;
      // Copies per half must cover the viewport so the second half is already
      // filling the screen when the first half scrolls out -> no gap. +1 adds
      // a safety buffer for sub-pixel rounding.
      const count = Math.max(2, Math.ceil(viewportWidth / singleWidth) + 1);
      setPerHalf(count);
    };

    compute();
    const ro = new ResizeObserver(compute);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [text, settings.padding, settings.font_size, settings.font_weight, gap]);

  const totalCopies = perHalf * 2;
  // Fixed duration per speed setting: Slow=28s, Normal=19s, Fast=11s.
  // This keeps the perceived scroll speed consistent regardless of text
  // length or number of copies.
  const duration = MARQUEE_DURATION[settings.speed] ?? 19;

  return (
    <div
      className="relative w-full overflow-hidden kx-marquee-container"
      style={containerStyle}
      ref={containerRef}
    >
      {/* Hidden measuring span: width == one copy (text + gap), used to compute
          how many copies are needed to fill the viewport. */}
      <span
        ref={measureRef}
        aria-hidden
        style={{
          position: 'absolute',
          visibility: 'hidden',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          left: 0,
          top: 0,
          fontSize: `${settings.font_size}px`,
          fontWeight,
        }}
      >
        <span style={{ paddingRight: `${gap}px` }}>{text}</span>
      </span>

      <div
        className={`${uid}-marquee-track`}
        style={{
          ...textStyle,
          paddingLeft: 0,
          paddingRight: 0,
          display: 'inline-flex',
          alignItems: 'center',
          flexWrap: 'nowrap',
          whiteSpace: 'nowrap',
          width: 'max-content',
          minWidth: 'max-content',
          height: '100%',
          willChange: 'transform',
        }}
      >
        {Array.from({ length: totalCopies }, (_, i) => (
          <span
            key={i}
            style={{ paddingRight: `${gap}px`, flexShrink: 0 }}
            aria-hidden={i >= perHalf}
          >
            {text}
          </span>
        ))}
      </div>

      <style>{`
        .${uid}-marquee-track {
          animation: ${uid}-marquee ${duration.toFixed(2)}s linear infinite;
        }
        .kx-marquee-container:hover .${uid}-marquee-track {
          animation-play-state: paused;
        }
        ${keyframes(uid)}
      `}</style>
    </div>
  );
}

export default function BannerView({ settings, placeholder }: BannerViewProps) {
  const rawId = useId();
  const uid = `bv${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;

  const text = settings.text.trim() ? settings.text : placeholder ?? '';
  if (!text) return null;

  const fontWeight = FONT_WEIGHT_NUM[settings.font_weight] ?? 400;
  const isMarquee = settings.animation === 'marquee';

  const containerStyle: React.CSSProperties = {
    backgroundColor: settings.bg_color,
    height: `${settings.height}px`,
  };

  const textStyle: React.CSSProperties = {
    color: settings.text_color,
    fontSize: `${settings.font_size}px`,
    fontWeight,
    textAlign: settings.text_align,
    paddingLeft: `${settings.padding}px`,
    paddingRight: `${settings.padding}px`,
    boxSizing: 'border-box',
  };

  if (isMarquee) {
    return (
      <Marquee
        text={text}
        settings={settings}
        uid={uid}
        containerStyle={containerStyle}
        textStyle={textStyle}
        fontWeight={fontWeight}
      />
    );
  }

  const anim = animString(uid, settings.animation, settings.speed);

  return (
    <div
      className="relative flex w-full items-center overflow-hidden"
      style={containerStyle}
    >
      <div
        className={anim !== 'none' ? `${uid}-anim` : undefined}
        style={{
          ...textStyle,
          width: '100%',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          animation: anim !== 'none' ? anim : undefined,
          willChange: anim !== 'none' ? 'transform' : undefined,
        }}
      >
        {text}
      </div>
      <style>{keyframes(uid)}</style>
    </div>
  );
}
