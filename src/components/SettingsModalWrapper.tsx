'use client';

import { useSettingsModal } from '@/contexts';
import SettingsModal from './SettingsModal';

export default function SettingsModalWrapper() {
  const { isOpen, closeModal } = useSettingsModal();
  
  return <SettingsModal isOpen={isOpen} onClose={closeModal} />;
}