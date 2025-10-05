'use client';

import React from 'react';

interface SelectionBoxProps {
  selectionBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  opacity?: number;
}

const SelectionBox: React.FC<SelectionBoxProps> = ({
  selectionBox,
  fillColor = "rgba(59, 130, 246, 0.1)",
  strokeColor = "var(--color-selected)",
  strokeWidth = 1,
  strokeDasharray = "4,4",
  opacity = 0.8
}) => {
  if (!selectionBox) return null;

  return (
    <rect
      x={selectionBox.x}
      y={selectionBox.y}
      width={selectionBox.width}
      height={selectionBox.height}
      fill={fillColor}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      opacity={opacity}
    />
  );
};

export default SelectionBox; 