import { useState, useCallback } from 'react';
import { TestStep } from '@/types';

interface UseCopyPasteReturn {
  // Selection state
  selectedSteps: Set<string>;
  setSelectedSteps: (steps: Set<string>) => void;
  selectedStep: TestStep | null;
  setSelectedStep: (step: TestStep | null) => void;
  
  // Copied steps state
  copiedSteps: TestStep[];
  setCopiedSteps: (steps: TestStep[]) => void;
  
  // Selection operations
  selectAllSteps: (allSteps: TestStep[]) => void;
  clearSelection: () => void;
  toggleStepSelection: (stepId: string, ctrlKey?: boolean) => void;
  
  // Copy/Paste operations
  copySteps: (testSteps: TestStep[]) => void;
  pasteSteps: (testSteps: TestStep[], generateId: () => string, onStepsChange: (steps: TestStep[]) => void) => void;
  duplicateSteps: (testSteps: TestStep[], generateId: () => string, onStepsChange: (steps: TestStep[]) => void) => void;
}

const useCopyPaste = (): UseCopyPasteReturn => {
  const [selectedSteps, setSelectedSteps] = useState<Set<string>>(new Set());
  const [selectedStep, setSelectedStep] = useState<TestStep | null>(null);
  const [copiedSteps, setCopiedSteps] = useState<TestStep[]>([]);

  const selectAllSteps = useCallback((allSteps: TestStep[]) => {
    const allStepIds = new Set(allSteps.map(step => step.id));
    setSelectedSteps(allStepIds);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSteps(new Set());
    setSelectedStep(null);
  }, []);

  const toggleStepSelection = useCallback((stepId: string, ctrlKey: boolean = false) => {
    setSelectedSteps(prev => {
      const newSet = new Set(prev);
      
      if (ctrlKey) {
        // Multi-select with Ctrl
        if (newSet.has(stepId)) {
          newSet.delete(stepId);
        } else {
          newSet.add(stepId);
        }
      } else {
        // Single select
        newSet.clear();
        newSet.add(stepId);
      }
      
      return newSet;
    });
  }, []);

  const copySteps = useCallback((testSteps: TestStep[]) => {
    if (selectedSteps.size === 0) return;
    
    const stepsToCopy = testSteps.filter(step => selectedSteps.has(step.id));
    setCopiedSteps(stepsToCopy);
  }, [selectedSteps]);

  const pasteSteps = useCallback((
    testSteps: TestStep[], 
    generateId: () => string, 
    onStepsChange: (steps: TestStep[]) => void
  ) => {
    if (copiedSteps.length === 0) return;

    // Find the bounding box of copied steps
    const minX = Math.min(...copiedSteps.map(step => step.x));
    const minY = Math.min(...copiedSteps.map(step => step.y));

    // Offset for pasted steps
    const offsetX = 50;
    const offsetY = 50;

    const pastedSteps = copiedSteps.map(step => ({
      ...step,
      id: generateId(), // Generate new ID
      x: step.x - minX + offsetX, // Relative positioning
      y: step.y - minY + offsetY,
      // Clear connections for pasted steps to avoid conflicts
      connections: undefined,
      trueConnection: undefined,
      falseConnection: undefined
    }));

    const newSteps = [...testSteps, ...pastedSteps];
    onStepsChange(newSteps);
    
    // Select the newly pasted steps
    const newStepIds = new Set(pastedSteps.map(step => step.id));
    setSelectedSteps(newStepIds);
  }, [copiedSteps]);

  const duplicateSteps = useCallback((
    testSteps: TestStep[], 
    generateId: () => string, 
    onStepsChange: (steps: TestStep[]) => void
  ) => {
    if (selectedSteps.size === 0) return;
    
    const stepsToDuplicate = testSteps.filter(step => selectedSteps.has(step.id));
    
    const duplicatedSteps = stepsToDuplicate.map(step => ({
      ...step,
      id: generateId(),
      x: step.x + 50, // Offset by 50px
      y: step.y + 50,
      // Clear connections for duplicated steps
      connections: undefined,
      trueConnection: undefined,
      falseConnection: undefined
    }));

    const newSteps = [...testSteps, ...duplicatedSteps];
    onStepsChange(newSteps);
    
    // Select the newly duplicated steps
    const newStepIds = new Set(duplicatedSteps.map(step => step.id));
    setSelectedSteps(newStepIds);
  }, [selectedSteps]);

  return {
    selectedSteps,
    setSelectedSteps,
    selectedStep,
    setSelectedStep,
    copiedSteps,
    setCopiedSteps,
    selectAllSteps,
    clearSelection,
    toggleStepSelection,
    copySteps,
    pasteSteps,
    duplicateSteps
  };
};

export default useCopyPaste; 