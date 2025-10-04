import { useState, useCallback } from 'react';
import { TestStep } from '@/types';

interface UseConnectionsReturn {
  // Connection state
  isConnecting: boolean;
  setIsConnecting: (connecting: boolean) => void;
  connectionStart: string | null;
  setConnectionStart: (start: string | null) => void;
  connectionType: 'normal' | 'true' | 'false';
  setConnectionType: (type: 'normal' | 'true' | 'false') => void;
  
  // Connection operations
  startConnection: (stepId: string, type?: 'normal' | 'true' | 'false') => void;
  endConnection: (stepId: string, testSteps: TestStep[], setTestSteps: (steps: TestStep[]) => void, saveToHistory: (steps: TestStep[]) => void) => void;
  removeConnection: (fromStepId: string, toStepId: string, type: 'normal' | 'true' | 'false', testSteps: TestStep[], setTestSteps: (steps: TestStep[]) => void, saveToHistory: (steps: TestStep[]) => void) => void;
  
  // Helper functions
  getStepCenter: (step: TestStep) => { x: number; y: number };
  getConnectionStyle: (type: 'normal' | 'true' | 'false') => { color: string; strokeWidth: number; opacity: number; label: string };
}

const useConnections = (): UseConnectionsReturn => {
  // Connection state
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [connectionType, setConnectionType] = useState<'normal' | 'true' | 'false'>('normal');

  // Start connection
  const startConnection = useCallback((stepId: string, type: 'normal' | 'true' | 'false' = 'normal') => {
    setIsConnecting(true);
    setConnectionStart(stepId);
    setConnectionType(type);
  }, []);

  // End connection - Enhanced for IF steps
  const endConnection = useCallback((
    stepId: string,
    testSteps: TestStep[],
    setTestSteps: (steps: TestStep[]) => void,
    saveToHistory: (steps: TestStep[]) => void
  ) => {
    if (!connectionStart || connectionStart === stepId) {
      setIsConnecting(false);
      setConnectionStart(null);
      return;
    }

    const sourceStep = testSteps.find(s => s.id === connectionStart);
    
    const newSteps = testSteps.map(step => {
      if (step.id === connectionStart) {
        // Handle IF step connections
        if (sourceStep?.type === 'if' && connectionType !== 'normal') {
          return {
            ...step,
            [connectionType === 'true' ? 'trueConnection' : 'falseConnection']: stepId
          };
        } else {
          // Handle normal connections
          const connections = step.connections || [];
          if (!connections.includes(stepId)) {
            return {
              ...step,
              connections: [...connections, stepId]
            };
          }
        }
      }
      return step;
    });

    setTestSteps(newSteps);
    saveToHistory(newSteps);
    setIsConnecting(false);
    setConnectionStart(null);
  }, [connectionStart, connectionType]);

  // Remove connection - Enhanced for IF steps
  const removeConnection = useCallback((
    fromStepId: string,
    toStepId: string,
    type: 'normal' | 'true' | 'false',
    testSteps: TestStep[],
    setTestSteps: (steps: TestStep[]) => void,
    saveToHistory: (steps: TestStep[]) => void
  ) => {
    const newSteps = testSteps.map(step => {
      if (step.id === fromStepId) {
        if (type === 'true') {
          return { ...step, trueConnection: undefined };
        } else if (type === 'false') {
          return { ...step, falseConnection: undefined };
        } else if (step.connections) {
          return {
            ...step,
            connections: step.connections.filter(id => id !== toStepId)
          };
        }
      }
      return step;
    });

    setTestSteps(newSteps);
    saveToHistory(newSteps);
  }, []);

  // Get step center position
  const getStepCenter = useCallback((step: TestStep) => {
    return {
      x: step.x + 96, // 12rem / 2 = 96px
      y: step.y + 40  // Approximate center height
    };
  }, []);

  // Get connection style based on type
  const getConnectionStyle = useCallback((type: 'normal' | 'true' | 'false') => {
    switch (type) {
      case 'true':
        return { 
          color: '#22c55e', // Green for true connections
          strokeWidth: 2.5,
          opacity: 0.8,
          label: 'TRUE'
        };
      case 'false':
        return { 
          color: '#ef4444', // Red for false connections
          strokeWidth: 2.5,
          opacity: 0.8,
          label: 'FALSE'
        };
      default:
        return { 
          color: '#6b7280', // Gray for normal connections
          strokeWidth: 2,
          opacity: 0.7,
          label: ''
        };
    }
  }, []);

  return {
    // Connection state
    isConnecting,
    setIsConnecting,
    connectionStart,
    setConnectionStart,
    connectionType,
    setConnectionType,
    
    // Connection operations
    startConnection,
    endConnection,
    removeConnection,
    
    // Helper functions
    getStepCenter,
    getConnectionStyle
  };
};

export default useConnections; 