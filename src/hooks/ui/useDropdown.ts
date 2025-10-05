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
  const dropdownRef = useRef<HTMLDivElement>(null);

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
  const calculatePosition = () => {
    if (buttonRef.current && dropdownRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = dropdownRef.current.offsetHeight;
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;

      // Güvenli bir margin ekle (20px)
      const safeMargin = 20;
      const requiredSpace = dropdownHeight + safeMargin;
      
      // Sayfanın scroll edilebilir yüksekliğini kontrol et
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const viewportBottom = scrollTop + window.innerHeight;
      const spaceToDocumentEnd = documentHeight - viewportBottom;

      // Dropdown'ı aşağıda açmak için yeterli alan var mı kontrol et
      // Eğer dropdown açıldığında sayfa scroll olacaksa (document sonuna yakınsa), yukarıda aç
      const willCausePageScroll = spaceToDocumentEnd < requiredSpace;
      
      if (willCausePageScroll && spaceAbove >= requiredSpace) {
        setDropdownPosition('top');
      } else if (spaceBelow >= requiredSpace) {
        setDropdownPosition('bottom');
      } else if (spaceAbove >= requiredSpace) {
        setDropdownPosition('top');
      } else {
        // Her iki tarafta da yeterli alan yoksa, daha fazla alan olan tarafı seç
        if (spaceBelow >= spaceAbove) {
          setDropdownPosition('bottom');
        } else {
          setDropdownPosition('top');
        }
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Dropdown'ın DOM'a eklenmesini bekle ve pozisyonu hesapla
      const checkAndCalculate = () => {
        if (dropdownRef.current) {
          calculatePosition();
        } else {
          // Henüz ref set edilmediyse tekrar dene
          requestAnimationFrame(checkAndCalculate);
        }
      };
      
      requestAnimationFrame(checkAndCalculate);
    }
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
    dropdownRef,
    handleClose,
    handleToggle,
    setIsOpen,
    calculatePosition,
    getAnimationStyle
  };
};
