import { type ClassValue, clsx } from 'clsx';
import { CSSProperties } from 'react';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Re-export config from centralized config file
export { config, API_URL, WS_URL } from './config';

// ============================================================================
// COLOR UTILITIES
// ============================================================================

// Types
export interface ColorPalette {
  primary: string;
  secondary: string;
  tertiary?: string;
}

export interface StatusColors extends ColorPalette {
  success: string;
  error: string;
  warning: string;
  info: string;
  purple: string;
}

// Constants
const COSMIC_COLORS = [
  '#D07E47', // Orange
  '#a66794', // Purple
  '#e89558', // Light Orange
  '#b87aa6', // Light Purple
  '#d88575', // Coral
  '#c96d3d', // Dark Orange
  '#955b84', // Dark Purple
  '#d88446', // Amber
  '#6b9bd1', // Blue
  '#88b87a', // Green
  '#c77435', // Brown Orange
  '#845075', // Deep Purple
  '#7daee0', // Light Blue
  '#9bc98d', // Light Green
  '#b85e34', // Rust
  '#a66794', // Mauve
] as const;

// Default color values for SSR
const DEFAULT_COLORS = {
  status: {
    primary: '#D07E47',
    success: '#88b87a',
    error: '#d87575',
    warning: '#e89558',
    info: '#6b9bd1',
    purple: '#a66794',
  },
  text: {
    primary: '#2a2520',
    secondary: '#6b5d52',
    tertiary: '#9a8a7d',
  },
  border: {
    primary: '#e8e3df',
    secondary: '#d4ccc4',
  },
  background: {
    primary: '#ffffff',
    secondary: '#faf9f8',
    tertiary: '#f5f3f1',
  },
} as const;

// Utility functions
const isServerSide = (): boolean => typeof window === 'undefined';

const getComputedColor = (property: string): string => {
  if (isServerSide()) return '';
  return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
};

const createColorGetter = <T extends Record<string, string>>(
  cssPrefix: string,
  defaultColors: T
): () => T => {
  return () => {
    if (isServerSide()) return defaultColors;
    
    const result = {} as T;
    for (const key in defaultColors) {
      (result as any)[key] = getComputedColor(`--${cssPrefix}-${key}`);
    }
    return result;
  };
};

/**
 * String'den tutarlı bir renk üretir (aynı string her zaman aynı rengi verir)
 * @param str - Renk üretilecek string (örn: test grubu adı)
 * @returns Cosmic tema renginden bir renk kodu
 */
export function getConsistentColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32-bit integer'a dönüştür
  }
  
  const index = Math.abs(hash) % COSMIC_COLORS.length;
  return COSMIC_COLORS[index];
}

// Color getter functions
export const getChartColors = createColorGetter('status', DEFAULT_COLORS.status) as () => StatusColors;
export const getTextColors = createColorGetter('text', DEFAULT_COLORS.text) as () => ColorPalette;
export const getBorderColors = createColorGetter('border', DEFAULT_COLORS.border) as () => ColorPalette;
export const getBgColors = createColorGetter('bg', DEFAULT_COLORS.background) as () => ColorPalette;

// ============================================================================
// DROPDOWN STYLES
// ============================================================================

type DropdownPosition = 'top' | 'bottom';

interface FixedPosition {
  top?: number;
  left: number;
  width: number;
}

/**
 * Dropdown container için ortak stil döndürür
 */
export const getDropdownContainerStyle = (
  dropdownPosition: DropdownPosition,
  additionalStyles?: CSSProperties,
  fixedPosition?: FixedPosition | null
): CSSProperties => {
  const baseStyles: CSSProperties = {
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-primary)',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
    ...additionalStyles
  };

  // Fixed position kullanılıyorsa
  if (fixedPosition) {
    return {
      ...baseStyles,
      position: 'fixed',
      top: fixedPosition.top,
      left: fixedPosition.left,
      width: fixedPosition.width
    };
  }

  // Absolute position (default)
  return {
    ...baseStyles,
    position: 'absolute',
    ...(dropdownPosition === 'top' 
      ? { bottom: '100%', marginBottom: '0.25rem' }
      : { top: '100%', marginTop: '0.25rem' }
    ),
    left: 0,
    right: 0
  };
};

/**
 * Dropdown option için hover efektli stil döndürür
 */
export const getDropdownOptionHandlers = (isSelected: boolean) => ({
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelected) {
      e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
    }
  },
  onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelected) {
      e.currentTarget.style.backgroundColor = 'transparent';
    }
  }
});

/**
 * Dropdown button için hover efektli stil döndürür
 */
export const getButtonHoverHandlers = (isOpen: boolean) => ({
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isOpen) {
      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
    }
  },
  onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isOpen) {
      e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
    }
  }
});

// ============================================================================
// GENERAL UTILITIES
// ============================================================================

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function formatDate(date: Date, locale: string = 'tr'): string {
  return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}



// Get schedule description from cron expression
export function getScheduleDescription(schedule: string, t?: (key: string, params?: Record<string, any>) => string): string {
  // If no translation function provided, return the schedule as is
  if (!t) {
    return schedule;
  }

  const scheduleMap: { [key: string]: string } = {
    '0 9 * * *': t('schedule.dailyAt') + ' 09:00',
    '0 2 * * 1': t('schedule.mondayAt') + ' 02:00',
    '0 0 * * 0': t('schedule.sundayAt') + ' 00:00',
    '0 */6 * * *': t('schedule.everyHours', { hours: 6 }),
    '0 0 1 * *': t('schedule.monthlyOn', { day: 1 }),
    '0 * * * *': t('schedule.hourly'),
    '0 0 * * *': t('schedule.dailyAtMidnight'),
    '0 12 * * *': t('schedule.dailyAtNoon')
  };

  if (scheduleMap[schedule]) {
    return scheduleMap[schedule];
  }

  // Parse cron expression
  const parts = schedule.split(' ');
  if (parts.length >= 5) {
    const [min, hour, day, month, weekday] = parts;
    
    // Hourly - specific hours
    if (hour.includes(',') && !hour.includes('*') && !hour.includes('/')) {
      const hours = hour.split(',').map(h => `${h.padStart(2, '0')}:${min.padStart(2, '0')}`).join(', ');
      return t('schedule.dailyAtTime', { time: hours });
    }
    
    // Hourly - specific intervals
    if (hour.includes('/')) {
      const interval = hour.split('/')[1];
      return t('schedule.everyHours', { hours: interval });
    }
    
    // Minutely
    if (min.includes('/') && hour === '*') {
      const interval = min.split('/')[1];
      return t('schedule.everyMinutes', { minutes: interval });
    }
    
    // Daily
    if (hour !== '*' && !hour.includes('/') && !hour.includes(',') && day === '*' && weekday === '*') {
      return t('schedule.dailyAtSpecificTime', { time: `${hour.padStart(2, '0')}:${min.padStart(2, '0')}` });
    }
    
    // Weekly
    if (weekday !== '*') {
      const days = [
        t('schedule.days.sunday'),
        t('schedule.days.monday'),
        t('schedule.days.tuesday'),
        t('schedule.days.wednesday'),
        t('schedule.days.thursday'),
        t('schedule.days.friday'),
        t('schedule.days.saturday')
      ];
      const dayNames = weekday.split(',').map(d => days[parseInt(d)]).join(', ');
      return t('schedule.weeklyOn', { days: dayNames, time: `${hour.padStart(2, '0')}:${min.padStart(2, '0')}` });
    }
    
    // Monthly
    if (day !== '*' && !day.includes(',')) {
      return t('schedule.monthlyOnDay', { day, time: `${hour.padStart(2, '0')}:${min.padStart(2, '0')}` });
    }
    
    // Monthly - multiple days
    if (day.includes(',')) {
      const days = day.split(',').join(', ');
      return t('schedule.monthlyOnDays', { days, time: `${hour.padStart(2, '0')}:${min.padStart(2, '0')}` });
    }
  }

  return schedule;
}

export function formatRelativeTime(date: Date | string | null | undefined, t?: (key: string, params?: Record<string, any>) => string, locale?: string): string {
  if (!date) {
    return t ? t('common.unknown') : 'Bilinmiyor';
  }

  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(parsedDate.getTime())) {
    return t ? t('common.invalidDate') : 'Geçersiz tarih';
  }

  const now = new Date();
  const diffInMs = now.getTime() - parsedDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return t ? t('common.now') : 'Şimdi';
  } else if (diffInMinutes < 60) {
    return t ? t('common.minutesAgo', { count: diffInMinutes }) : `${diffInMinutes} dakika önce`;
  } else if (diffInHours < 24) {
    return t ? t('common.hoursAgo', { count: diffInHours }) : `${diffInHours} saat önce`;
  } else if (diffInDays < 7) {
    return t ? t('common.daysAgo', { count: diffInDays }) : `${diffInDays} gün önce`;
  } else {
    return formatDate(parsedDate, locale);
  }
}

// Format date for tooltip with locale support
export function formatDateForTooltip(date: Date | string | null | undefined, locale: string = 'tr'): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  const isTurkish = locale === 'tr';
  
  return dateObj.toLocaleString(isTurkish ? 'tr-TR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'long'
  });
}

