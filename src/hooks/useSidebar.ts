'use client';

import { useState, useEffect, useCallback } from 'react';

// Global state (module-level) - tüm hook instance'ları aynı state'i paylaşır
let globalSidebarState = {
  isCollapsed: false,
  isModalOpen: false
};

let isInitialized = false; // Track if we've set the initial state

const listeners = new Set<(state: { isCollapsed: boolean; isModalOpen: boolean }) => void>();

// State değişikliklerini tüm listener'lara bildir
const notifyListeners = (state: { isCollapsed: boolean; isModalOpen: boolean }) => {
  globalSidebarState = { ...state };

  // Save collapsed state to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('sidebar-collapsed', state.isCollapsed.toString());
  }

  listeners.forEach(listener => listener(globalSidebarState));
};

/**
 * Sidebar hook
 * Sidebar durumunu yönetir (collapsed/expanded, modal open/closed)
 * Global state kullanarak tüm component'ler arasında senkronize çalışır
 * Responsive: ≤1440px ekranlarda otomatik collapsed başlar ama kullanıcı tercihini kaydeder
 */
export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(globalSidebarState.isCollapsed);
  const [isModalOpen, setIsModalOpen] = useState(globalSidebarState.isModalOpen);

  // Combine listener setup and initialization
  useEffect(() => {
    // Setup listener first
    const listener = (state: { isCollapsed: boolean; isModalOpen: boolean }) => {
      //console.log('[useSidebar] Listener triggered, new state:', state);
      setIsCollapsed(state.isCollapsed);
      setIsModalOpen(state.isModalOpen);
    };

    listeners.add(listener);

    // Then initialize if needed (only once, on first mount)
    if (!isInitialized && typeof window !== 'undefined') {
      isInitialized = true;

      const savedPreference = localStorage.getItem('sidebar-collapsed');
      const screenWidth = window.innerWidth;

      //console.log('[useSidebar] Initializing:', {
      //  savedPreference,
      //  screenWidth,
      //  isSmallScreen: screenWidth <= 1440
      //});

      let shouldCollapse = false;

      if (savedPreference !== null) {
        shouldCollapse = savedPreference === 'true';
        //console.log('[useSidebar] Using saved preference:', shouldCollapse);
      } else {
        shouldCollapse = screenWidth <= 1440;
        //console.log('[useSidebar] No saved preference, using screen size:', shouldCollapse);
      }

      // Always notify to ensure state is set correctly
      //console.log('[useSidebar] Setting initial collapsed state to:', shouldCollapse);
      notifyListeners({ ...globalSidebarState, isCollapsed: shouldCollapse });
    }

    // Set current state
    setIsCollapsed(globalSidebarState.isCollapsed);
    setIsModalOpen(globalSidebarState.isModalOpen);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setCollapsed = useCallback((collapsed: boolean) => {
    //console.log('[useSidebar] User toggled collapsed to:', collapsed);
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

