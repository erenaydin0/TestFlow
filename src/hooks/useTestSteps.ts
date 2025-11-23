import { useState, useCallback } from 'react';
import { TestStep, UseTestStepsReturn } from '@/types';

const useTestSteps = (): UseTestStepsReturn => {
  const [testSteps, setTestSteps] = useState<TestStep[]>([]);
  const [history, setHistory] = useState<TestStep[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const generateId = useCallback(() => {
    // Generate readable step ID
    const timestamp = Date.now().toString().slice(-6);
    return `step-${timestamp}`;
  }, []);

  const saveToHistory = useCallback((newSteps: TestStep[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push([...newSteps]);
      // Keep only last 50 operations for memory efficiency
      if (newHistory.length > 50) {
        newHistory.shift();
      } else {
        setHistoryIndex(newHistory.length - 1);
      }
      return newHistory;
    });
  }, [historyIndex]);

  const undo = useCallback((clearSelections?: () => void) => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setTestSteps([...history[newIndex]]);
      if (clearSelections) clearSelections();
    }
  }, [canUndo, historyIndex, history]);

  const redo = useCallback((clearSelections?: () => void) => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setTestSteps([...history[newIndex]]);
      if (clearSelections) clearSelections();
    }
  }, [canRedo, historyIndex, history]);

  const addStep = useCallback((step: TestStep) => {
    const newSteps = [...testSteps, step];
    setTestSteps(newSteps);
    saveToHistory(newSteps);
  }, [testSteps, saveToHistory]);

  const deleteStep = useCallback((stepId: string, clearSelections?: () => void) => {
    const newSteps = testSteps.filter(s => s.id !== stepId);
    setTestSteps(newSteps);
    saveToHistory(newSteps);
    if (clearSelections) clearSelections();
  }, [testSteps, saveToHistory]);

  const updateStepProperty = useCallback((stepId: string, property: string, value: any) => {
    const newSteps = testSteps.map(step => {
      if (step.id === stepId) {
        return { ...step, [property]: value };
      }
      return step;
    });
    setTestSteps(newSteps);
    saveToHistory(newSteps);
  }, [testSteps, saveToHistory]);

  // autoArrangeSteps removed as it is no longer needed for list view

  return {
    testSteps,
    setTestSteps,
    history,
    historyIndex,
    canUndo,
    canRedo,
    saveToHistory,
    undo,
    redo,
    addStep,
    deleteStep,
    updateStepProperty,
    generateId
  };
};

export default useTestSteps; 