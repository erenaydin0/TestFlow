import { useState, useRef, useEffect } from 'react';

interface UseDropdownOptions {
  animationDuration?: number;
  onClose?: () => void;
}

export const useDropdown = (options: UseDropdownOptions = {}) => {
  const { animationDuration = 150, onClose } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      onClose?.();
    }, animationDuration);
  };

  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      setIsOpen(true);
    }
  };

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
  }, [isOpen]);

  // Calculate dropdown position
  const calculatePosition = (dropdownHeight: number = 250) => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
  };

  useEffect(() => {
    calculatePosition();
  }, [isOpen]);

  const getAnimationStyle = (fadeInDuration?: number) => ({
    animation: isClosing 
      ? `fadeOut ${animationDuration}ms ease-in forwards` 
      : `fadeInScale ${fadeInDuration || animationDuration}ms ease-out forwards`,
    transformOrigin: dropdownPosition === 'top' ? 'bottom' : 'top'
  });

  return {
    isOpen,
    isClosing,
    dropdownPosition,
    containerRef,
    buttonRef,
    handleClose,
    handleToggle,
    setIsOpen,
    calculatePosition,
    getAnimationStyle
  };
};
