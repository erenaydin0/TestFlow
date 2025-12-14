'use client';

import { useState, useEffect, useCallback } from 'react';

export type SettingsTab = 'app' | 'account' | 'workspace';

interface SettingsModalState {
  isOpen: boolean;
  initialTab: SettingsTab;
  selectedWorkspaceId: string | null;
}

// Global state (module-level) - tüm hook instance'ları aynı state'i paylaşır
let globalSettingsModalState: SettingsModalState = {
  isOpen: false,
  initialTab: 'app',
  selectedWorkspaceId: null,
};

const listeners = new Set<(value: SettingsModalState) => void>();

// State değişikliklerini tüm listener'lara bildir
const notifyListeners = (value: SettingsModalState) => {
  globalSettingsModalState = value;
  listeners.forEach(listener => listener(value));
};

/**
 * Settings Modal hook
 * Settings modal durumunu yönetir (open/closed)
 * Global state kullanarak tüm component'ler arasında senkronize çalışır
 */
export function useSettingsModal() {
  const [state, setState] = useState<SettingsModalState>(globalSettingsModalState);

  // Global state değişikliklerini dinle
  useEffect(() => {
    const listener = (value: SettingsModalState) => {
      setState(value);
    };
    
    listeners.add(listener);
    
    // İlk değeri set et
    setState(globalSettingsModalState);
    
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const openSettingsModal = useCallback((tab: SettingsTab = 'app', workspaceId: string | null = null) => {
    notifyListeners({
      isOpen: true,
      initialTab: tab,
      selectedWorkspaceId: workspaceId,
    });
  }, []);

  const closeSettingsModal = useCallback(() => {
    notifyListeners({
      isOpen: false,
      initialTab: 'app',
      selectedWorkspaceId: null,
    });
  }, []);

  const setSelectedWorkspaceId = useCallback((workspaceId: string | null) => {
    notifyListeners({
      ...globalSettingsModalState,
      selectedWorkspaceId: workspaceId,
    });
  }, []);

  return {
    isSettingsOpen: state.isOpen,
    initialTab: state.initialTab,
    selectedWorkspaceId: state.selectedWorkspaceId,
    openSettingsModal,
    closeSettingsModal,
    setSelectedWorkspaceId,
  };
}

