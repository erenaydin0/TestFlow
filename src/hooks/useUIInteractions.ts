import { useState, useRef, useEffect, useCallback } from 'react';

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

