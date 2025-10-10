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

  const autoArrangeSteps = useCallback(() => {
    if (testSteps.length === 0) return;

    const arrangedSteps = [...testSteps];
    const visited = new Set<string>();
    const STEPS_PER_ROW = 6;
    const STEP_SPACING_X = 200;
    const STEP_SPACING_Y = 120;
    const START_X = 100;
    const START_Y = 100;

    // Her dal için ayrı pozisyon takibi
    const branchPositions = new Map<string, { x: number; y: number }>();
    const branchQueues = new Map<string, string[]>();

    // Gelen bağlantıları hesapla
    const hasIncomingConnection = new Set<string>();
    arrangedSteps.forEach(step => {
      step.connections?.forEach(id => hasIncomingConnection.add(id));
      if (step.type === 'if') {
        if (step.trueConnection) hasIncomingConnection.add(step.trueConnection);
        if (step.falseConnection) hasIncomingConnection.add(step.falseConnection);
      }
    });

    // Root step'leri bul
    const rootSteps = arrangedSteps.filter(step => !hasIncomingConnection.has(step.id));

    // Ana akışı düzenle (zigzag)
    let mainIndex = 0;
    const getZigzagPosition = (index: number) => {
      const row = Math.floor(index / STEPS_PER_ROW);
      const col = index % STEPS_PER_ROW;
      const isEvenRow = row % 2 === 0;
      const actualCol = isEvenRow ? col : (STEPS_PER_ROW - 1 - col);
      
      return {
        x: START_X + (actualCol * STEP_SPACING_X),
        y: START_Y + (row * STEP_SPACING_Y)
      };
    };

    // Ana akışı yerleştir
    const arrangeMainFlow = (stepId: string) => {
      if (visited.has(stepId)) return;
      visited.add(stepId);

      const step = arrangedSteps.find(s => s.id === stepId);
      if (!step) return;

      // Ana akış pozisyonu
      const position = getZigzagPosition(mainIndex);
      step.x = position.x;
      step.y = position.y;
      mainIndex++;

      // IF step'i ise dalları başlat
      if (step.type === 'if') {
        if (step.trueConnection) {
          branchPositions.set(step.trueConnection, {
            x: step.x,
            y: step.y + STEP_SPACING_Y
          });
          branchQueues.set(step.trueConnection, [step.trueConnection]);
        }
        if (step.falseConnection) {
          branchPositions.set(step.falseConnection, {
            x: step.x,
            y: step.y + (STEP_SPACING_Y * 2)
          });
          branchQueues.set(step.falseConnection, [step.falseConnection]);
        }
      } else {
        // Normal bağlantıları devam ettir
        if (step.connections) {
          step.connections.forEach(connectionId => {
            arrangeMainFlow(connectionId);
          });
        }
      }
    };

    // Dalları yerleştir
    const arrangeBranch = (branchId: string) => {
      const queue = branchQueues.get(branchId);
      if (!queue) return;

      let branchIndex = 0;
      const branchStartPos = branchPositions.get(branchId);
      if (!branchStartPos) return;

      while (queue.length > 0) {
        const stepId = queue.shift()!;
        if (visited.has(stepId)) continue;
        visited.add(stepId);

        const step = arrangedSteps.find(s => s.id === stepId);
        if (!step) continue;

        // Dal pozisyonu
        step.x = branchStartPos.x + (branchIndex * STEP_SPACING_X);
        step.y = branchStartPos.y;
        branchIndex++;

        // Bu daldan devam eden bağlantıları ekle
        if (step.connections) {
          step.connections.forEach(connectionId => {
            if (!visited.has(connectionId) && !queue.includes(connectionId)) {
              queue.push(connectionId);
            }
          });
        }

        // IF step'i ise yeni dallar başlat
        if (step.type === 'if') {
          if (step.trueConnection) {
            const newBranchId = `${branchId}-true-${step.trueConnection}`;
            branchPositions.set(newBranchId, {
              x: step.x,
              y: step.y + STEP_SPACING_Y
            });
            branchQueues.set(newBranchId, [step.trueConnection]);
            arrangeBranch(newBranchId);
          }
          if (step.falseConnection) {
            const newBranchId = `${branchId}-false-${step.falseConnection}`;
            branchPositions.set(newBranchId, {
              x: step.x,
              y: step.y + (STEP_SPACING_Y * 2)
            });
            branchQueues.set(newBranchId, [step.falseConnection]);
            arrangeBranch(newBranchId);
          }
        }
      }
    };

    // Ana akışı başlat
    rootSteps.forEach(step => {
      arrangeMainFlow(step.id);
    });

    // Dalları yerleştir
    branchQueues.forEach((queue, branchId) => {
      arrangeBranch(branchId);
    });

    // Kalan adımları yerleştir
    arrangedSteps.forEach(step => {
      if (!visited.has(step.id)) {
        const position = getZigzagPosition(mainIndex);
        step.x = position.x;
        step.y = position.y;
        mainIndex++;
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