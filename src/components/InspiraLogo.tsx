import React from 'react';

interface InspiraLogoProps {
  className?: string;
  size?: number;
}

export const InspiraLogo: React.FC<InspiraLogoProps> = ({ className = 'w-10 h-10', size }) => {
  const dimensionProps = size ? { width: size, height: size } : {};
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      {...dimensionProps}
    >
      <rect width="48" height="48" rx="12" fill="#0B3B60" />
      <circle cx="24" cy="24" r="14" stroke="#38BDF8" strokeWidth="2.5" strokeDasharray="3 3" />
      <path d="M24 14V34M14 24H34" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="24" r="5" fill="#FFFFFF" />
    </svg>
  );
};
