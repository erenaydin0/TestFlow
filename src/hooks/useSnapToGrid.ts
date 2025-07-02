import { useState, useCallback } from 'react';
import { TestStep } from '@/types';

interface SnapLines {
  x: number[];
  y: number[];
}

interface SnapResult {
  x: number;
  y: number;
  snapLines: SnapLines;
}

interface UseSnapToGridReturn {
  // Snap state
  snapEnabled: boolean;
  setSnapEnabled: (enabled: boolean) => void;
  snapLines: SnapLines;
  setSnapLines: (lines: SnapLines) => void;
  
  // Snap operations
  snapToPosition: (x: number, y: number, testSteps: TestStep[], excludeStepId?: string) => SnapResult;
  clearSnapLines: () => void;
  toggleSnap: () => void;
}

const useSnapToGrid = (): UseSnapToGridReturn => {
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapLines, setSnapLines] = useState<SnapLines>({ x: [], y: [] });

  const clearSnapLines = useCallback(() => {
    setSnapLines({ x: [], y: [] });
  }, []);

  const toggleSnap = useCallback(() => {
    setSnapEnabled(prev => !prev);
  }, []);

  const snapToPosition = useCallback((
    x: number, 
    y: number, 
    testSteps: TestStep[], 
    excludeStepId?: string
  ): SnapResult => {
    if (!snapEnabled) {
      return { x, y, snapLines: { x: [], y: [] } };
    }

    const SNAP_THRESHOLD = 15; // pixels
    const GRID_SIZE = 20; // Grid snap size
    let snappedX = x;
    let snappedY = y;
    const activeSnapLines = { x: [] as number[], y: [] as number[] };

    // Snap to grid
    const gridX = Math.round(x / GRID_SIZE) * GRID_SIZE;
    const gridY = Math.round(y / GRID_SIZE) * GRID_SIZE;
    
    if (Math.abs(x - gridX) < SNAP_THRESHOLD) {
      snappedX = gridX;
    }
    if (Math.abs(y - gridY) < SNAP_THRESHOLD) {
      snappedY = gridY;
    }

    // Snap to other steps
    const otherSteps = testSteps.filter(step => step.id !== excludeStepId);
    
    for (const step of otherSteps) {
      const stepCenterX = step.x + 96; // Step width/2 (12rem = 192px, so 96px)
      const stepCenterY = step.y + 40; // Step height/2 (5rem = 80px, so 40px)
      const stepLeft = step.x;
      const stepRight = step.x + 192; // Step width (12rem = 192px)
      const stepTop = step.y;
      const stepBottom = step.y + 80; // Step height (5rem = 80px)

      // Horizontal alignment (Y-axis)
      if (Math.abs(y - step.y) < SNAP_THRESHOLD) {
        snappedY = step.y; // Top alignment
        activeSnapLines.y.push(step.y);
      } else if (Math.abs(y - stepCenterY) < SNAP_THRESHOLD) {
        snappedY = stepCenterY - 40; // Center alignment
        activeSnapLines.y.push(stepCenterY);
      } else if (Math.abs(y - stepBottom) < SNAP_THRESHOLD) {
        snappedY = stepBottom; // Bottom alignment
        activeSnapLines.y.push(stepBottom);
      }

      // Vertical alignment (X-axis)  
      if (Math.abs(x - step.x) < SNAP_THRESHOLD) {
        snappedX = step.x; // Left alignment
        activeSnapLines.x.push(step.x);
      } else if (Math.abs(x - stepCenterX) < SNAP_THRESHOLD) {
        snappedX = stepCenterX - 96; // Center alignment
        activeSnapLines.x.push(stepCenterX);
      } else if (Math.abs(x - stepRight) < SNAP_THRESHOLD) {
        snappedX = stepRight; // Right alignment
        activeSnapLines.x.push(stepRight);
      }

      // Spacing alignment (common distances)
      const COMMON_SPACING = [50, 100, 150, 200, 250]; // Common spacing values
      for (const spacing of COMMON_SPACING) {
        // Horizontal spacing
        if (Math.abs(x - (stepRight + spacing)) < SNAP_THRESHOLD) {
          snappedX = stepRight + spacing;
          activeSnapLines.x.push(stepRight + spacing);
        }
        if (Math.abs(x - (stepLeft - spacing - 192)) < SNAP_THRESHOLD) {
          snappedX = stepLeft - spacing - 192;
          activeSnapLines.x.push(stepLeft - spacing);
        }

        // Vertical spacing
        if (Math.abs(y - (stepBottom + spacing)) < SNAP_THRESHOLD) {
          snappedY = stepBottom + spacing;
          activeSnapLines.y.push(stepBottom + spacing);
        }
        if (Math.abs(y - (stepTop - spacing - 80)) < SNAP_THRESHOLD) {
          snappedY = stepTop - spacing - 80;
          activeSnapLines.y.push(stepTop - spacing);
        }
      }
    }

    return { 
      x: Math.max(0, snappedX), 
      y: Math.max(0, snappedY), 
      snapLines: activeSnapLines 
    };
  }, [snapEnabled]);

  return {
    snapEnabled,
    setSnapEnabled,
    snapLines,
    setSnapLines,
    snapToPosition,
    clearSnapLines,
    toggleSnap
  };
};

export default useSnapToGrid; 