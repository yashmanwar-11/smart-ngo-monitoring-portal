import React from 'react';

interface EmblemOfIndiaProps {
  className?: string;
  size?: number | string;
  variant?: 'gold' | 'bronze' | 'navy' | 'monochrome' | 'white' | 'badge' | 'transparent' | 'raw';
  showText?: boolean;
}

export const EmblemOfIndia: React.FC<EmblemOfIndiaProps> = ({
  className = '',
  size,
  variant = 'badge',
}) => {
  // Compute style dimensions if size is provided or provide fallback sizing
  const hasWidthClass = /\bw-\[?\w+\]?/.test(className);
  const hasHeightClass = /\bh-\[?\w+\]?/.test(className);

  const styleObj: React.CSSProperties = {};
  if (size !== undefined) {
    const widthVal = typeof size === 'number' ? `${size}px` : size;
    const heightVal = typeof size === 'number' ? `${Math.round(size * 1.35)}px` : size;
    styleObj.width = widthVal;
    styleObj.height = heightVal;
    styleObj.maxWidth = widthVal;
    styleObj.maxHeight = heightVal;
  } else if (!hasWidthClass && !hasHeightClass) {
    styleObj.width = '44px';
    styleObj.height = '60px';
  }

  // If variant is transparent or white, use the keyed transparent PNG
  if (variant === 'transparent' || variant === 'white') {
    return (
      <div
        style={styleObj}
        className={`inline-flex items-center justify-center shrink-0 select-none overflow-hidden ${className}`}
      >
        <img
          src="/emblem-of-india-transparent.png"
          alt="State Emblem of India - Ashoka Lion Capital with Satyameva Jayate"
          className="w-full h-full max-w-full max-h-full object-contain drop-shadow-xs block"
        />
      </div>
    );
  }

  // If variant is raw (unwrapped image)
  if (variant === 'raw') {
    return (
      <div
        style={styleObj}
        className={`inline-flex items-center justify-center shrink-0 select-none overflow-hidden ${className}`}
      >
        <img
          src="/emblem-of-india.jpg"
          alt="State Emblem of India - Ashoka Lion Capital with Satyameva Jayate"
          className="w-full h-full max-w-full max-h-full object-contain block"
        />
      </div>
    );
  }

  // Default: Royal Navy Crest Badge (Official Government Plaque Format)
  // Perfectly framing the user's exact uploaded emblem image
  return (
    <div
      style={styleObj}
      className={`inline-flex items-center justify-center shrink-0 select-none overflow-hidden ${className}`}
    >
      <div className="w-full h-full rounded-lg bg-[#011F4D] p-0.5 border border-[#1E3A8A]/60 shadow-xs flex items-center justify-center overflow-hidden hover:border-amber-400/80 transition-colors">
        <img
          src="/emblem-of-india.jpg"
          alt="State Emblem of India - Ashoka Lion Capital with Satyameva Jayate"
          className="w-full h-full max-w-full max-h-full object-contain block"
        />
      </div>
    </div>
  );
};
