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
}) => {
  const hasWidthClass = /\bw-\[?\w+\]?/.test(className);
  const hasHeightClass = /\bh-\[?\w+\]?/.test(className);

  const styleObj: React.CSSProperties = {};
  if (size !== undefined) {
    const widthVal = typeof size === 'number' ? `${size}px` : size;
    const heightVal = typeof size === 'number' ? `${size}px` : size;
    styleObj.width = widthVal;
    styleObj.height = heightVal;
    styleObj.maxWidth = widthVal;
    styleObj.maxHeight = heightVal;
  } else if (!hasWidthClass && !hasHeightClass) {
    styleObj.width = '40px';
    styleObj.height = '40px';
  }

  return (
    <div
      style={styleObj}
      className={`inline-flex items-center justify-center shrink-0 select-none overflow-hidden ${className}`}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className="w-full h-full object-contain"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="INSPIRA Prototype Monogram"
      >
        <rect width="48" height="48" rx="12" fill="#0B3B60" />
        <circle cx="24" cy="24" r="14" stroke="#38BDF8" strokeWidth="2.5" strokeDasharray="3 3" />
        <path d="M24 14V34M14 24H34" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="24" cy="24" r="5" fill="#FFFFFF" />
      </svg>
    </div>
  );
};
