export const getChartColors = () => {
  if (typeof window === 'undefined') {
    // Server-side rendering için cosmic default değerler
    return {
      primary: '#D07E47',
      success: '#88b87a',
      error: '#d87575',
      warning: '#e89558',
      info: '#6b9bd1',
      purple: '#a66794',
    };
  }

  const computedStyle = getComputedStyle(document.documentElement);
  
  return {
    primary: computedStyle.getPropertyValue('--status-primary').trim(),
    success: computedStyle.getPropertyValue('--status-success').trim(),
    error: computedStyle.getPropertyValue('--status-error').trim(),
    warning: computedStyle.getPropertyValue('--status-warning').trim(),
    info: computedStyle.getPropertyValue('--status-info').trim(),
    purple: computedStyle.getPropertyValue('--status-purple').trim(),
  };
};

export const getTextColors = () => {
  if (typeof window === 'undefined') {
    return {
      primary: '#2a2520',
      secondary: '#6b5d52',
      tertiary: '#9a8a7d',
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
      primary: '#e8e3df',
      secondary: '#d4ccc4',
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
      secondary: '#faf9f8',
      tertiary: '#f5f3f1',
    };
  }

  const computedStyle = getComputedStyle(document.documentElement);
  
  return {
    primary: computedStyle.getPropertyValue('--bg-primary').trim(),
    secondary: computedStyle.getPropertyValue('--bg-secondary').trim(),
    tertiary: computedStyle.getPropertyValue('--bg-tertiary').trim(),
  };
}; 