export const getChartColors = () => {
  if (typeof window === 'undefined') {
    // Server-side rendering için default değerler
    return {
      primary: '#2563eb',
      success: '#059669',
      error: '#dc2626',
      warning: '#d97706',
      info: '#0891b2',
      purple: '#7c3aed',
    };
  }

  const computedStyle = getComputedStyle(document.documentElement);
  
  return {
    primary: computedStyle.getPropertyValue('--chart-primary').trim(),
    success: computedStyle.getPropertyValue('--chart-success').trim(),
    error: computedStyle.getPropertyValue('--chart-error').trim(),
    warning: computedStyle.getPropertyValue('--chart-warning').trim(),
    info: computedStyle.getPropertyValue('--chart-info').trim(),
    purple: computedStyle.getPropertyValue('--chart-purple').trim(),
  };
};

export const getTextColors = () => {
  if (typeof window === 'undefined') {
    return {
      primary: '#111827',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
    };
  }

  const computedStyle = getComputedStyle(document.documentElement);
  
  return {
    primary: computedStyle.getPropertyValue('--text-primary').trim(),
    secondary: computedStyle.getPropertyValue('--text-secondary').trim(),
    tertiary: computedStyle.getPropertyValue('--text-tertiary').trim(),
  };
};

export const getBorderColors = () => {
  if (typeof window === 'undefined') {
    return {
      primary: '#e5e7eb',
      secondary: '#d1d5db',
    };
  }

  const computedStyle = getComputedStyle(document.documentElement);
  
  return {
    primary: computedStyle.getPropertyValue('--border-primary').trim(),
    secondary: computedStyle.getPropertyValue('--border-secondary').trim(),
  };
};

export const getBgColors = () => {
  if (typeof window === 'undefined') {
    return {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
    };
  }

  const computedStyle = getComputedStyle(document.documentElement);
  
  return {
    primary: computedStyle.getPropertyValue('--bg-primary').trim(),
    secondary: computedStyle.getPropertyValue('--bg-secondary').trim(),
    tertiary: computedStyle.getPropertyValue('--bg-tertiary').trim(),
  };
}; 