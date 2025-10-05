'use client';

import React from 'react';

interface SnapLinesProps {
  snapEnabled: boolean;
  snapLines: {
    x: number[];
    y: number[];
  };
}

const SnapLines: React.FC<SnapLinesProps> = ({
  snapEnabled,
  snapLines
}) => {
  if (!snapEnabled) return null;

  return (
    <g>
      {/* Vertical snap lines */}
      {snapLines.x.map((x, index) => (
        <line
          key={`snap-x-${index}`}
          x1={x}
          y1={0}
          x2={x}
          y2="100%"
          stroke="var(--status-info)"
          strokeWidth="1"
          strokeDasharray="4,4"
          opacity="0.6"
        />
      ))}
      
      {/* Horizontal snap lines */}
      {snapLines.y.map((y, index) => (
        <line
          key={`snap-y-${index}`}
          x1={0}
          y1={y}
          x2="100%"
          y2={y}
          stroke="var(--status-info)"
          strokeWidth="1"
          strokeDasharray="4,4"
          opacity="0.6"
        />
      ))}
    </g>
  );
};

export default SnapLines; 