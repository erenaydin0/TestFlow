import { useState, useEffect } from 'react';

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
