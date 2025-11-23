'use client';

import { useState, useEffect, useCallback } from 'react';

// Global state (module-level) - tüm hook instance'ları aynı state'i paylaşır
let globalSettingsModalState = false;
const listeners = new Set<(value: boolean) => void>();

// State değişikliklerini tüm listener'lara bildir
const notifyListeners = (value: boolean) => {
  globalSettingsModalState = value;
  listeners.forEach(listener => listener(value));
};

/**
 * Settings Modal hook
 * Settings modal durumunu yönetir (open/closed)
 * Global state kullanarak tüm component'ler arasında senkronize çalışır
 */
export function useSettingsModal() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(globalSettingsModalState);

  // Global state değişikliklerini dinle
  useEffect(() => {
    const listener = (value: boolean) => {
      setIsSettingsOpen(value);
    };
    
    listeners.add(listener);
    
    // İlk değeri set et
    setIsSettingsOpen(globalSettingsModalState);
    
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const openSettingsModal = useCallback(() => {
    notifyListeners(true);
  }, []);

  const closeSettingsModal = useCallback(() => {
    notifyListeners(false);
  }, []);

  return {
    isSettingsOpen,
    openSettingsModal,
    closeSettingsModal
  };
}

