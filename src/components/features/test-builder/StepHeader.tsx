'use client';

import React from 'react';
import { CheckCircle, XCircle, GitBranch, Trash2 } from 'lucide-react';
import { TestStep } from '@/types';
import { ActionType } from '@/lib/actions';

interface StepHeaderProps {
  step: TestStep;
  action: ActionType;
  isConnecting: boolean;
  connectionStart: string | null;
  connectionType: 'normal' | 'true' | 'false';
  
  // Event handlers
  onStartConnection: (stepId: string, type?: 'normal' | 'true' | 'false') => void;
  onEndConnection: (stepId: string, testSteps: TestStep[], setTestSteps: (steps: TestStep[]) => void, saveToHistory: (steps: TestStep[]) => void) => void;
  onDeleteStep: (stepId: string, callback: () => void) => void;
  
  // State setters
  setIsConnecting: (connecting: boolean) => void;
  setConnectionStart: (start: string | null) => void;
  setConnectionType: (type: 'normal' | 'true' | 'false') => void;
  setSelectedSteps: (steps: Set<string>) => void;
  setSelectedStep: (step: TestStep | null) => void;
  
  // Selection state
  selectedSteps: Set<string>;
  selectedStep: TestStep | null;
  
  // Test steps data
  testSteps: TestStep[];
  setTestSteps: (steps: TestStep[]) => void;
  saveToHistory: (steps: TestStep[]) => void;
}

const StepHeader: React.FC<StepHeaderProps> = ({
  step,
  action,
  isConnecting,
  connectionStart,
  connectionType,
  onStartConnection,
  onEndConnection,
  onDeleteStep,
  setIsConnecting,
  setConnectionStart,
  setConnectionType,
  setSelectedSteps,
  setSelectedStep,
  selectedSteps,
  selectedStep,
  testSteps,
  setTestSteps,
  saveToHistory
}) => {
  const Icon = action.icon;

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      marginBottom: '0.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          padding: '0.25rem',
          backgroundColor: `${action.color}15`,
          borderRadius: '0.25rem'
        }}>
          <Icon size={14} color={action.color} />
        </div>
        <span style={{ 
          fontSize: '0.75rem', 
          fontWeight: 500, 
          color: 'var(--text-primary)'
        }}>
          {action.title}
        </span>
      </div>
      
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {/* If step special connection buttons */}
        {step.type === 'if' ? (
          <>
            {/* True branch button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isConnecting && connectionStart === step.id && connectionType === 'true') {
                  setIsConnecting(false);
                  setConnectionStart(null);
                  setConnectionType('normal');
                } else if (isConnecting && connectionStart !== step.id) {
                  onEndConnection(step.id, testSteps, setTestSteps, saveToHistory);
                } else {
                  onStartConnection(step.id, 'true');
                }
              }}
              style={{
                padding: '0.25rem',
                backgroundColor: isConnecting && connectionStart === step.id && connectionType === 'true'
                  ? '#22c55e' 
                  : 'transparent',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                color: isConnecting && connectionStart === step.id && connectionType === 'true'
                  ? 'white' 
                  : '#22c55e',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!(isConnecting && connectionStart === step.id && connectionType === 'true')) {
                  e.currentTarget.style.backgroundColor = '#dcfce7';
                  e.currentTarget.style.color = '#16a34a';
                }
              }}
              onMouseLeave={(e) => {
                if (!(isConnecting && connectionStart === step.id && connectionType === 'true')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#22c55e';
                }
              }}
              title={isConnecting && connectionStart === step.id && connectionType === 'true'
                ? 'TRUE bağlantısını iptal et' 
                : isConnecting 
                  ? 'TRUE dalına bağla' 
                  : 'TRUE dalı bağlantısı başlat'}
            >
              <CheckCircle size={12} />
            </button>
            
            {/* False branch button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isConnecting && connectionStart === step.id && connectionType === 'false') {
                  setIsConnecting(false);
                  setConnectionStart(null);
                  setConnectionType('normal');
                } else if (isConnecting && connectionStart !== step.id) {
                  onEndConnection(step.id, testSteps, setTestSteps, saveToHistory);
                } else {
                  onStartConnection(step.id, 'false');
                }
              }}
              style={{
                padding: '0.25rem',
                backgroundColor: isConnecting && connectionStart === step.id && connectionType === 'false'
                  ? '#ef4444' 
                  : 'transparent',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                color: isConnecting && connectionStart === step.id && connectionType === 'false'
                  ? 'white' 
                  : '#ef4444',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!(isConnecting && connectionStart === step.id && connectionType === 'false')) {
                  e.currentTarget.style.backgroundColor = '#fee2e2';
                  e.currentTarget.style.color = '#dc2626';
                }
              }}
              onMouseLeave={(e) => {
                if (!(isConnecting && connectionStart === step.id && connectionType === 'false')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#ef4444';
                }
              }}
              title={isConnecting && connectionStart === step.id && connectionType === 'false'
                ? 'FALSE bağlantısını iptal et' 
                : isConnecting 
                  ? 'FALSE dalına bağla' 
                : 'FALSE dalı bağlantısı başlat'}
            >
              <XCircle size={12} />
            </button>
          </>
        ) : (
          /* Regular connection button for non-if steps */
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isConnecting && connectionStart === step.id) {
                // Cancel connection
                setIsConnecting(false);
                setConnectionStart(null);
                setConnectionType('normal');
              } else if (isConnecting && connectionStart !== step.id) {
                // End connection
                onEndConnection(step.id, testSteps, setTestSteps, saveToHistory);
              } else {
                // Start connection
                onStartConnection(step.id);
              }
            }}
            style={{
              padding: '0.25rem',
              backgroundColor: isConnecting && connectionStart === step.id 
                ? '#3b82f6' 
                : 'transparent',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              color: isConnecting && connectionStart === step.id 
                ? 'white' 
                : 'var(--text-tertiary)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!(isConnecting && connectionStart === step.id)) {
                e.currentTarget.style.backgroundColor = '#dbeafe';
                e.currentTarget.style.color = '#3b82f6';
              }
            }}
            onMouseLeave={(e) => {
              if (!(isConnecting && connectionStart === step.id)) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-tertiary)';
              }
            }}
            title={isConnecting && connectionStart === step.id 
              ? 'Bağlantıyı iptal et' 
              : isConnecting 
                ? 'Buraya bağla' 
                : 'Bağlantı başlat'}
          >
            <GitBranch size={12} />
          </button>
        )}
        
        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteStep(step.id, () => {
              const newSet = new Set(selectedSteps);
              newSet.delete(step.id);
              setSelectedSteps(newSet);
              if (selectedStep && selectedStep.id === step.id) {
                setSelectedStep(null);
              }
            });
          }}
          style={{
            padding: '0.25rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            color: 'var(--text-tertiary)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fee2e2';
            e.currentTarget.style.color = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-tertiary)';
          }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};

export default StepHeader; 