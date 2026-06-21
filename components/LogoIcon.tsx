import React from 'react';

interface LogoIconProps {
  className?: string;
  size?: number;
}

const LogoIcon: React.FC<LogoIconProps> = ({ className = "", size = 40 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="100" height="100" rx="20" fill="var(--color-secondary)"/>
      <text 
        x="50" 
        y="55" 
        fontFamily="Cormorant Garamond, serif" 
        fontSize="50" 
        fontWeight="700" 
        fill="var(--color-primary)" 
        textAnchor="middle" 
        dominantBaseline="middle"
      >
        RF
      </text>
    </svg>
  );
};

export default LogoIcon;
