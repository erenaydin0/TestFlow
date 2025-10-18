export type BrowserType = 'chromium' | 'firefox' | 'webkit' | 'msedge';

export interface BrowserOption {
  value: BrowserType;
  label: string;
}

export const BROWSER_OPTIONS: BrowserOption[] = [
  { value: 'chromium', label: 'Chrome' },
  { value: 'firefox', label: 'Firefox' },
  { value: 'webkit', label: 'Safari' },
  { value: 'msedge', label: 'Edge' }
];

export const getBrowserName = (browserType?: BrowserType): string => 
  BROWSER_OPTIONS.find(b => b.value === browserType)?.label || 'Chrome';
