'use client';

import React from 'react';

interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  align?: 'start' | 'center' | 'end' | 'stretch';
  wrap?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  orientation = 'horizontal',
  spacing = 'sm',
  align = 'start',
  wrap = false,
  className,
  style
}) => {
  const getSpacing = (spacing: string) => {
    switch (spacing) {
      case 'none': return '0';
      case 'xs': return '0.25rem';
      case 'sm': return '0.5rem';
      case 'md': return '0.75rem';
      case 'lg': return '1rem';
      default: return '0.5rem';
    }
  };

  const getAlignment = (align: string) => {
    switch (align) {
      case 'start': return 'flex-start';
      case 'center': return 'center';
      case 'end': return 'flex-end';
      case 'stretch': return 'stretch';
      default: return 'flex-start';
    }
  };

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: orientation === 'horizontal' ? 'row' : 'column',
    gap: getSpacing(spacing),
    alignItems: orientation === 'horizontal' ? 'center' : 'stretch',
    justifyContent: orientation === 'horizontal' ? getAlignment(align) : 'flex-start',
    flexWrap: wrap ? 'wrap' : 'nowrap',
    ...style
  };

  return (
    <div style={containerStyles} className={className}>
      {children}
    </div>
  );
};

export default ButtonGroup;
