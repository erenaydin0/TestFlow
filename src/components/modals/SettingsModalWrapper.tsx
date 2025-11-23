'use client';

import dynamic from 'next/dynamic';

// Lazy load SettingsModal (heavy component) in a client component
const SettingsModal = dynamic(() => import('./SettingsModal').then(mod => ({ default: mod.default })), {
  ssr: false
});

export default function SettingsModalWrapper() {
  return <SettingsModal />;
}

