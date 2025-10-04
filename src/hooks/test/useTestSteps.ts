import { useState, useCallback } from 'react';
import { TestStep } from '@/types';

interface UseTestStepsReturn {
  testSteps: TestStep[];
  setTestSteps: (steps: TestStep[]) => void;
  history: TestStep[][];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  saveToHistory: (newSteps: TestStep[]) => void;
  undo: (clearSelections?: () => void) => void;
  redo: (clearSelections?: () => void) => void;
  addStep: (step: TestStep) => void;
  deleteStep: (stepId: string, clearSelections?: () => void) => void;
  updateStepProperty: (stepId: string, property: string, value: any) => void;
  autoArrangeSteps: () => void;
  generateId: () => string;
}

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

  const autoArrangeSteps = useCallback(() => {
    if (testSteps.length === 0) return;

    const arrangedSteps = [...testSteps];
    const visited = new Set<string>();
    let currentX = 100;
    const Y_POSITION = 100;
    const STEP_SPACING = 250;

    const arrangeFromStep = (stepId: string, column: number): number => {
      if (visited.has(stepId)) return column;
      visited.add(stepId);

      const step = arrangedSteps.find(s => s.id === stepId);
      if (!step) return column;

      // Position current step
      step.x = currentX;
      step.y = Y_POSITION;
      currentX += STEP_SPACING;

      let maxColumn = column;

      // Handle normal connections
      if (step.connections) {
        for (const connectionId of step.connections) {
          maxColumn = Math.max(maxColumn, arrangeFromStep(connectionId, column + 1));
        }
      }

      // Handle If step branches
      if (step.type === 'if') {
        if (step.trueConnection) {
          maxColumn = Math.max(maxColumn, arrangeFromStep(step.trueConnection, column + 1));
        }
        if (step.falseConnection) {
          maxColumn = Math.max(maxColumn, arrangeFromStep(step.falseConnection, column + 1));
        }
      }

      return maxColumn;
    };

    // Find root steps (steps with no incoming connections)
    const hasIncomingConnection = new Set<string>();
    arrangedSteps.forEach(step => {
      step.connections?.forEach(id => hasIncomingConnection.add(id));
      if (step.type === 'if') {
        if (step.trueConnection) hasIncomingConnection.add(step.trueConnection);
        if (step.falseConnection) hasIncomingConnection.add(step.falseConnection);
      }
    });

    const rootSteps = arrangedSteps.filter(step => !hasIncomingConnection.has(step.id));

    // Arrange from root steps
    rootSteps.forEach(step => {
      arrangeFromStep(step.id, 0);
    });

    // Arrange remaining unvisited steps
    arrangedSteps.forEach(step => {
      if (!visited.has(step.id)) {
        step.x = currentX;
        step.y = Y_POSITION;
        currentX += STEP_SPACING;
      }
    });

    setTestSteps(arrangedSteps);
    saveToHistory(arrangedSteps);
  }, [testSteps, saveToHistory]);

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
    autoArrangeSteps,
    generateId
  };
};

export default useTestSteps; 