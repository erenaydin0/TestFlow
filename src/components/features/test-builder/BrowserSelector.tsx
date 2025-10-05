'use client';

import { BrowserType } from '@/types';
import { CustomSelect } from '@/components/common';

interface BrowserSelectorProps {
  selectedBrowser: BrowserType;
  onBrowserChange: (browser: BrowserType) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

const browserOptions = [
  { value: 'chromium' as BrowserType, label: 'Chrome' },    
  { value: 'firefox' as BrowserType, label: 'Firefox' },
  { value: 'webkit' as BrowserType, label: 'Safari' },
  { value: 'msedge' as BrowserType, label: 'Edge' }
];

export default function BrowserSelector({ 
  selectedBrowser, 
  onBrowserChange, 
  disabled = false,
  size = 'sm',
  style = {}
}: BrowserSelectorProps) {
  return (
    <div style={{ width: '100%', opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto', ...style }}>
      <CustomSelect
        value={selectedBrowser}
        onChange={(value) => onBrowserChange(value as BrowserType)}
        options={browserOptions}
        placeholder="Chrome"
        style={{border: 'none', backgroundColor: 'transparent'}}
      />
    </div>
  );
}
