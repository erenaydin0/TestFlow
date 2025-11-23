'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TestStep } from '@/types';
import { useI18n } from '@/hooks';

// ============================================================================
// useDropdown Hook
// ============================================================================

interface UseDropdownOptions {
  animationDuration?: number;
  onClose?: () => void;
  useFixedPosition?: boolean; // Tablo içinde kullanım için
}

const SAFE_MARGIN = 20; // Dropdown için güvenlik marjı

export const useDropdown = (options: UseDropdownOptions = {}) => {
  const { animationDuration = 150, onClose, useFixedPosition = false } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const [fixedPosition, setFixedPosition] = useState<{ top?: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setFixedPosition(null);
      onClose?.();
    }, animationDuration);
  }, [animationDuration, onClose]);

  const handleToggle = useCallback(() => {
    if (isOpen) {
      handleClose();
    } else {
      setIsOpen(true);
    }
  }, [isOpen, handleClose]);

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClose]);

  // Calculate dropdown position
  const calculatePosition = useCallback(() => {
    if (!buttonRef.current || !dropdownRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = dropdownRef.current.offsetHeight;
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    const requiredSpace = dropdownHeight + SAFE_MARGIN;

    // Fixed position için koordinatları hesapla
    if (useFixedPosition) {
      const left = buttonRect.left;
      const width = buttonRect.width;
      
      if (spaceBelow >= requiredSpace) {
        setDropdownPosition('bottom');
        setFixedPosition({
          top: buttonRect.bottom + 4, // 0.25rem margin
          left,
          width
        });
      } else if (spaceAbove >= requiredSpace) {
        setDropdownPosition('top');
        setFixedPosition({
          top: buttonRect.top - dropdownHeight - 4, // 0.25rem margin
          left,
          width
        });
      } else {
        // Daha fazla alan olan tarafı seç
        if (spaceBelow >= spaceAbove) {
          setDropdownPosition('bottom');
          setFixedPosition({
            top: buttonRect.bottom + 4,
            left,
            width
          });
        } else {
          setDropdownPosition('top');
          setFixedPosition({
            top: buttonRect.top - dropdownHeight - 4,
            left,
            width
          });
        }
      }
    } else {
      // Absolute position için sadece yön belirle
      if (spaceBelow >= requiredSpace) {
        setDropdownPosition('bottom');
      } else if (spaceAbove >= requiredSpace) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition(spaceBelow >= spaceAbove ? 'bottom' : 'top');
      }
    }
  }, [useFixedPosition]);

  // Dropdown açıldığında pozisyonu hesapla
  useEffect(() => {
    if (!isOpen) return;

    const checkAndCalculate = () => {
      if (dropdownRef.current) {
        calculatePosition();
      } else {
        requestAnimationFrame(checkAndCalculate);
      }
    };
    
    requestAnimationFrame(checkAndCalculate);
  }, [isOpen, calculatePosition]);

  // Scroll ve resize olaylarında pozisyonu güncelle (fixed position için)
  useEffect(() => {
    if (!isOpen || !useFixedPosition) return;

    const handleUpdate = () => {
      calculatePosition();
    };

    window.addEventListener('scroll', handleUpdate, true); // capture phase
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isOpen, useFixedPosition, calculatePosition]);

  const getAnimationStyle = useCallback((fadeInDuration?: number) => ({
    animation: isClosing 
      ? `fadeOut ${animationDuration}ms ease-in forwards` 
      : `fadeInScale ${fadeInDuration || animationDuration}ms ease-out forwards`,
    transformOrigin: dropdownPosition === 'top' ? 'bottom' : 'top'
  }), [isClosing, animationDuration, dropdownPosition]);

  return {
    isOpen,
    isClosing,
    dropdownPosition,
    fixedPosition,
    containerRef,
    buttonRef,
    dropdownRef,
    handleClose,
    handleToggle,
    getAnimationStyle
  };
};

// ============================================================================
// useModal Hook
// ============================================================================

interface UseModalOptions {
  animationDuration?: number;
  onClose?: () => void;
}

export const useModal = (isOpen: boolean, options: UseModalOptions = {}) => {
  const { animationDuration = 200, onClose } = options;
  
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else if (isVisible) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
        onClose?.();
      }, animationDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isVisible, animationDuration, onClose]);

  const getOverlayStyle = () => ({
    animation: isClosing 
      ? `fadeOut ${animationDuration}ms ease-in forwards` 
      : `fadeIn ${animationDuration}ms ease-out forwards`
  });

  const getModalStyle = () => ({
    animation: isClosing 
      ? `modalSlideOut ${animationDuration}ms ease-in forwards` 
      : `modalSlideIn ${animationDuration}ms ease-out forwards`
  });

  return {
    isVisible,
    isClosing,
    getOverlayStyle,
    getModalStyle
  };
};

// ============================================================================
// useUnsavedChanges Hook
// ============================================================================

interface UseUnsavedChangesProps {
  testSteps: TestStep[];
  onSave?: () => Promise<void>;
  canUndo?: boolean; // Undo history kontrolü için
}

interface UseUnsavedChangesReturn {
  hasUnsavedChanges: boolean;
  showUnsavedDialog: boolean;
  pendingNavigation: string | null;
  handleNavigation: (url: string) => void;
  confirmNavigation: () => void;
  cancelNavigation: () => void;
  saveAndNavigate: () => Promise<void>;
  markAsSaved: () => void;
  resetUnsavedChanges: () => void;
}

export const useUnsavedChanges = ({
  testSteps,
  onSave,
  canUndo = true
}: UseUnsavedChangesProps): UseUnsavedChangesReturn => {
  const { t } = useI18n();
  const router = useRouter();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  
  // Başlangıç durumunu kaydet
  const initialStepsRef = useRef<TestStep[]>([]);
  const lastSavedStepsRef = useRef<TestStep[]>([]);
  const isInitialized = useRef(false);

  // Test steps değişikliklerini izle
  useEffect(() => {
    // İlk kez çalıştığında referansları başlat
    if (!isInitialized.current) {
      initialStepsRef.current = [...testSteps];
      lastSavedStepsRef.current = [...testSteps];
      isInitialized.current = true;
      
      // İlk durumda değişiklik yok
      setHasUnsavedChanges(false);
      return;
    }

    // Değişiklik kontrolü - canUndo false ise değişiklik yok sayılır
    const stepsChanged = JSON.stringify(testSteps) !== JSON.stringify(lastSavedStepsRef.current);
    const hasRealChanges = stepsChanged && canUndo;
    
    // Değişiklik var mı kontrol et
    setHasUnsavedChanges(hasRealChanges);
  }, [testSteps, canUndo]);

  // Navigation handler
  const handleNavigation = useCallback((url: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(url);
      setShowUnsavedDialog(true);
    } else {
      router.push(url);
    }
  }, [hasUnsavedChanges, router]);

  // Navigation onaylama
  const confirmNavigation = useCallback(() => {
    if (pendingNavigation) {
      setShowUnsavedDialog(false);
      setPendingNavigation(null);
      setHasUnsavedChanges(false);
      router.push(pendingNavigation);
    }
  }, [pendingNavigation, router]);

  // Navigation iptal etme
  const cancelNavigation = useCallback(() => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  }, []);

  // Kaydet ve navigation
  const saveAndNavigate = useCallback(async () => {
    if (onSave && pendingNavigation) {
      try {
        await onSave();
        lastSavedStepsRef.current = [...testSteps];
        setHasUnsavedChanges(false);
        setShowUnsavedDialog(false);
        router.push(pendingNavigation);
        setPendingNavigation(null);
      } catch (error) {
        console.error('Kaydetme hatası:', error);
        // Eğer kullanıcı save dialog'unu iptal ettiyse, UnsavedChanges dialog'unu da kapat
        if (error instanceof Error && error.message === 'Save canceled by user') {
          setShowUnsavedDialog(false);
          setPendingNavigation(null);
        }
        // Diğer hatalarda dialog açık kalır
      }
    }
  }, [onSave, pendingNavigation, testSteps, router]);

  // Manual olarak kaydedildi olarak işaretle
  const markAsSaved = useCallback(() => {
    lastSavedStepsRef.current = [...testSteps];
    setHasUnsavedChanges(false);
  }, [testSteps]);

  // Workflow yüklendiğinde unsaved changes'i sıfırla
  const resetUnsavedChanges = useCallback(() => {
    lastSavedStepsRef.current = [...testSteps];
    setHasUnsavedChanges(false);
  }, [testSteps]);

  // Browser navigation engelleme
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = t('unsavedChanges.browserWarning');
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, t]);

  return {
    hasUnsavedChanges,
    showUnsavedDialog,
    pendingNavigation,
    handleNavigation,
    confirmNavigation,
    cancelNavigation,
    saveAndNavigate,
    markAsSaved,
    resetUnsavedChanges
  };
};

