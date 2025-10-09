import React from 'react';
import { Chrome, Globe } from 'lucide-react';
import { BrowserType, BrowserOption, BrowserNameMapping, BrowserIconMapping, BrowserColorMapping } from '@/types';

// Browser name mappings
export const BROWSER_NAMES: BrowserNameMapping = {
  chromium: 'Chrome',
  firefox: 'Firefox',
  webkit: 'Safari',
  msedge: 'Edge'
};

// Browser icon mappings
export const BROWSER_ICONS: BrowserIconMapping = {
  chromium: Chrome,
  firefox: Globe,
  webkit: Globe,
  msedge: Globe
};

// Browser color mappings
export const BROWSER_COLORS: BrowserColorMapping = {
  chromium: 'var(--status-info)',
  firefox: 'var(--status-warning)',
  webkit: 'var(--status-info)',
  msedge: 'var(--status-info)'
};

// Basic browser options (for simple selects)
export const BASIC_BROWSER_OPTIONS: BrowserOption[] = [
  { value: 'chromium' as BrowserType, label: 'Chrome' },
  { value: 'firefox' as BrowserType, label: 'Firefox' },
  { value: 'webkit' as BrowserType, label: 'Safari' },
  { value: 'msedge' as BrowserType, label: 'Edge' }
];

// Extended browser options (with icons and colors)
export const EXTENDED_BROWSER_OPTIONS: BrowserOption[] = [
  { 
    value: 'chromium' as BrowserType, 
    label: 'Chrome', 
    icon: Chrome, 
    color: 'var(--status-info)' 
  },
  { 
    value: 'firefox' as BrowserType, 
    label: 'Firefox', 
    icon: Globe, 
    color: 'var(--status-warning)' 
  },
  { 
    value: 'webkit' as BrowserType, 
    label: 'Safari', 
    icon: Globe, 
    color: 'var(--status-info)' 
  },
  { 
    value: 'msedge' as BrowserType, 
    label: 'Edge', 
    icon: Globe, 
    color: 'var(--status-info)' 
  }
];

// Settings modal browser options (with full names)
export const SETTINGS_BROWSER_OPTIONS: BrowserOption[] = [
  { value: 'chromium' as BrowserType, label: 'Chrome/Chromium' },
  { value: 'firefox' as BrowserType, label: 'Firefox' },
  { value: 'webkit' as BrowserType, label: 'Safari/WebKit' },
  { value: 'msedge' as BrowserType, label: 'Microsoft Edge' }
];

// Utility functions
export const getBrowserName = (browserType?: BrowserType): string => {
  return browserType ? BROWSER_NAMES[browserType] || browserType : 'Chrome';
};

export const getBrowserIcon = (browserType: BrowserType) => {
  return BROWSER_ICONS[browserType] || Globe;
};

export const getBrowserColor = (browserType: BrowserType): string => {
  return BROWSER_COLORS[browserType] || 'var(--status-info)';
};

// Get browser display name for UI
export const getBrowserDisplayName = (browserType: BrowserType): string => {
  return BROWSER_NAMES[browserType] || browserType;
};

// Get browser icon component with size
export const getBrowserIconComponent = (browserType: BrowserType, size: number = 16) => {
  const IconComponent = getBrowserIcon(browserType);
  return React.createElement(IconComponent, { 
    size, 
    style: { color: getBrowserColor(browserType) } 
  });
};
