'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// UI Context Interface
interface UIContextType {
  // Sidebar
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;

  // Settings Modal
  isSettingsOpen: boolean;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  // Sidebar State
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Settings Modal Functions
  const openSettingsModal = () => setIsSettingsOpen(true);
  const closeSettingsModal = () => setIsSettingsOpen(false);

  return (
    <UIContext.Provider value={{
      // Sidebar
      isCollapsed,
      setIsCollapsed,
      isModalOpen,
      setIsModalOpen,
      
      // Settings Modal
      isSettingsOpen,
      openSettingsModal,
      closeSettingsModal
    }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}

// Individual hooks for backward compatibility
export function useSidebar() {
  const { isCollapsed, setIsCollapsed, isModalOpen, setIsModalOpen } = useUI();
  return { isCollapsed, setIsCollapsed, isModalOpen, setIsModalOpen };
}

export function useSettingsModal() {
  const { isSettingsOpen, openSettingsModal, closeSettingsModal } = useUI();
  return { isSettingsOpen, openSettingsModal, closeSettingsModal };
}
