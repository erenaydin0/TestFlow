import { BrowserType, BrowserOption, BrowserNameMapping, BrowserColorMapping } from '@/types';

// Browser name mappings
export const BROWSER_NAMES: BrowserNameMapping = {
  chromium: 'Chrome',
  firefox: 'Firefox',
  webkit: 'Safari',
  msedge: 'Edge'
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
    color: 'var(--status-info)' 
  },
  { 
    value: 'firefox' as BrowserType, 
    label: 'Firefox', 
    color: 'var(--status-warning)' 
  },
  { 
    value: 'webkit' as BrowserType, 
    label: 'Safari', 
    color: 'var(--status-info)' 
  },
  { 
    value: 'msedge' as BrowserType, 
    label: 'Edge', 
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