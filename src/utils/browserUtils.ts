import { BrowserType, BrowserOption, BrowserNameMapping } from '@/types';

// Browser name mappings
export const BROWSER_NAMES: BrowserNameMapping = {
  chromium: 'Chrome',
  firefox: 'Firefox',
  webkit: 'Safari',
  msedge: 'Edge'
};

// Basic browser options (for simple selects)
export const BASIC_BROWSER_OPTIONS: BrowserOption[] = [
  { value: 'chromium' as BrowserType, label: 'Chrome' },
  { value: 'firefox' as BrowserType, label: 'Firefox' },
  { value: 'webkit' as BrowserType, label: 'Safari' },
  { value: 'msedge' as BrowserType, label: 'Edge' }
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