'use client';

import { BrowserType } from '@/types';
import { CustomSelect } from '@/components/common';
import { BASIC_BROWSER_OPTIONS } from '@/lib/browserUtils';

interface BrowserSelectorProps {
  selectedBrowser: BrowserType;
  onBrowserChange: (browser: BrowserType) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
  useFixedPosition?: boolean; // Tablo içinde kullanım için
}

const browserOptions = BASIC_BROWSER_OPTIONS;

export default function BrowserSelector({ 
  selectedBrowser, 
  onBrowserChange, 
  disabled = false,
  size = 'sm',
  style = {},
  useFixedPosition = false
}: BrowserSelectorProps) {
  return (
    <div style={{ width: '100%', opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto', ...style }}>
      <CustomSelect
        value={selectedBrowser}
        onChange={(value) => onBrowserChange(value as BrowserType)}
        options={browserOptions}
        placeholder="Chrome"
        style={{border: 'none', backgroundColor: 'transparent'}}
        useFixedPosition={useFixedPosition}
      />
    </div>
  );
}
