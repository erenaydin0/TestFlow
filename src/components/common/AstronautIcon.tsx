import React from 'react';

interface AstronautIconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const AstronautIcon: React.FC<AstronautIconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Astronot kaskı */}
      <circle
        cx="12"
        cy="12"
        r="8"
        fill={color}
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.9"
      />
      
      {/* Kask vizörü */}
      <ellipse
        cx="12"
        cy="12"
        rx="5.5"
        ry="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.7"
      />
      
      {/* Kask detayları - gözler */}
      <circle
        cx="9"
        cy="10"
        r="1"
        fill="currentColor"
        opacity="0.6"
      />
      <circle
        cx="15"
        cy="10"
        r="1"
        fill="currentColor"
        opacity="0.6"
      />
      
      {/* Kask detayları - anten */}
      <line
        x1="12"
        y1="4"
        x2="12"
        y2="2"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.8"
      />
      <circle
        cx="12"
        cy="1.5"
        r="0.5"
        fill="currentColor"
        opacity="0.6"
      />
      
      {/* Kask detayları - yan çizgiler */}
      <line
        x1="6"
        y1="8"
        x2="4"
        y2="8"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
      <line
        x1="18"
        y1="8"
        x2="20"
        y2="8"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
      
      {/* Uzay detayları - yıldızlar */}
      <circle
        cx="4"
        cy="4"
        r="0.5"
        fill="currentColor"
        opacity="0.6"
      />
      <circle
        cx="20"
        cy="6"
        r="0.3"
        fill="currentColor"
        opacity="0.4"
      />
      <circle
        cx="6"
        cy="20"
        r="0.4"
        fill="currentColor"
        opacity="0.5"
      />
      <circle
        cx="18"
        cy="20"
        r="0.3"
        fill="currentColor"
        opacity="0.4"
      />
    </svg>
  );
};

export default AstronautIcon;
