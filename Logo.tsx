import React from 'react';

interface LogoProps {
  className?: string;
  disableGradient?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10", disableGradient = false }) => {
  const uniqueId = React.useId();
  const gradientId = `logo_gradient_${uniqueId}`;

  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3b82f6" /> {/* Blue-500 */}
          <stop offset="50%" stopColor="#8b5cf6" /> {/* Violet-500 */}
          <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan-500 */}
        </linearGradient>
      </defs>
      
      {/* Abstract Brain / M Shape */}
      <path
        d="M25 60 C 25 45, 30 30, 50 30 C 70 30, 75 45, 75 60"
        stroke={disableGradient ? "currentColor" : `url(#${gradientId})`}
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M25 60 L 25 75"
        stroke={disableGradient ? "currentColor" : `url(#${gradientId})`}
        strokeWidth="8"
        strokeLinecap="round"
      />
       <path
        d="M75 60 L 75 75"
        stroke={disableGradient ? "currentColor" : `url(#${gradientId})`}
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M25 60 L 50 80 L 75 60"
        stroke={disableGradient ? "currentColor" : `url(#${gradientId})`}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Neural Dots */}
      <circle cx="50" cy="30" r="5" fill={disableGradient ? "currentColor" : `url(#${gradientId})`} />
      <circle cx="25" cy="75" r="5" fill={disableGradient ? "currentColor" : `url(#${gradientId})`} />
      <circle cx="75" cy="75" r="5" fill={disableGradient ? "currentColor" : `url(#${gradientId})`} />
    </svg>
  );
};

export default Logo;