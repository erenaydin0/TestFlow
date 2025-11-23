'use client';

import { useState, useEffect, useCallback } from 'react';

// Global state (module-level) - tüm hook instance'ları aynı state'i paylaşır
let globalSidebarState = {
  isCollapsed: false,
  isModalOpen: false
};

const listeners = new Set<(state: { isCollapsed: boolean; isModalOpen: boolean }) => void>();

// State değişikliklerini tüm listener'lara bildir
const notifyListeners = (state: { isCollapsed: boolean; isModalOpen: boolean }) => {
  globalSidebarState = { ...state };
  listeners.forEach(listener => listener(globalSidebarState));
};

/**
 * Sidebar hook
 * Sidebar durumunu yönetir (collapsed/expanded, modal open/closed)
 * Global state kullanarak tüm component'ler arasında senkronize çalışır
 */
export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(globalSidebarState.isCollapsed);
  const [isModalOpen, setIsModalOpen] = useState(globalSidebarState.isModalOpen);

  // Global state değişikliklerini dinle
  useEffect(() => {
    const listener = (state: { isCollapsed: boolean; isModalOpen: boolean }) => {
      setIsCollapsed(state.isCollapsed);
      setIsModalOpen(state.isModalOpen);
    };
    
    listeners.add(listener);
    
    // İlk değerleri set et
    setIsCollapsed(globalSidebarState.isCollapsed);
    setIsModalOpen(globalSidebarState.isModalOpen);
    
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setCollapsed = useCallback((collapsed: boolean) => {
    notifyListeners({ ...globalSidebarState, isCollapsed: collapsed });
  }, []);

  const setModalOpen = useCallback((open: boolean) => {
    notifyListeners({ ...globalSidebarState, isModalOpen: open });
  }, []);

  return {
    isCollapsed,
    setIsCollapsed: setCollapsed,
    isModalOpen,
    setIsModalOpen: setModalOpen
  };
}

