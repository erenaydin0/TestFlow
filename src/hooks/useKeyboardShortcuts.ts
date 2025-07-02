import { useEffect } from 'react';
import { TestStep } from '@/types';

interface UseKeyboardShortcutsProps {
  isModalOpen: boolean;
  selectedSteps: Set<string>;
  copiedSteps: TestStep[];
  testSteps: TestStep[];
  generateId: () => string;
  copySteps: (steps: TestStep[]) => void;
  pasteSteps: (
    steps: TestStep[], 
    generateId: () => string, 
    callback: (newSteps: TestStep[]) => void
  ) => void;
  duplicateSteps: (
    steps: TestStep[], 
    generateId: () => string, 
    callback: (newSteps: TestStep[]) => void
  ) => void;
  selectAllSteps: (steps: TestStep[]) => void;
  deleteSelectedSteps: () => void;
  clearSelection: () => void;
  undo: (callback?: () => void) => void;
  redo: (callback?: () => void) => void;
  setTestSteps: (steps: TestStep[]) => void;
  saveToHistory: (steps: TestStep[]) => void;
  setSelectedSteps: (steps: Set<string>) => void;
  setSelectedStep: (step: TestStep | null) => void;
}

const useKeyboardShortcuts = ({
  isModalOpen,
  selectedSteps,
  copiedSteps,
  testSteps,
  generateId,
  copySteps,
  pasteSteps,
  duplicateSteps,
  selectAllSteps,
  deleteSelectedSteps,
  clearSelection,
  undo,
  redo,
  setTestSteps,
  saveToHistory,
  setSelectedSteps,
  setSelectedStep
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when modal is open or input is focused
      if (isModalOpen || (e.target as HTMLElement).tagName === 'INPUT') return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'c':
            e.preventDefault();
            copySteps(testSteps);
            break;
          case 'v':
            e.preventDefault();
            pasteSteps(testSteps, generateId, (newSteps) => {
              setTestSteps(newSteps);
              saveToHistory(newSteps);
            });
            break;
          case 'd':
            e.preventDefault();
            duplicateSteps(testSteps, generateId, (newSteps) => {
              setTestSteps(newSteps);
              saveToHistory(newSteps);
            });
            break;
          case 'a':
            e.preventDefault();
            selectAllSteps(testSteps);
            break;
          case 'z':
            e.preventDefault();
            undo(() => {
              setSelectedSteps(new Set());
              setSelectedStep(null);
            });
            break;
          case 'y':
            e.preventDefault();
            redo(() => {
              setSelectedSteps(new Set());
              setSelectedStep(null);
            });
            break;
        }
      } else {
        switch (e.key) {
          case 'Delete':
          case 'Backspace':
            e.preventDefault();
            deleteSelectedSteps();
            break;
          case 'Escape':
            e.preventDefault();
            clearSelection();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    isModalOpen,
    selectedSteps,
    copiedSteps,
    testSteps,
    generateId,
    copySteps,
    pasteSteps,
    duplicateSteps,
    selectAllSteps,
    deleteSelectedSteps,
    clearSelection,
    undo,
    redo,
    setTestSteps,
    saveToHistory,
    setSelectedSteps,
    setSelectedStep
  ]);
};

export default useKeyboardShortcuts; 