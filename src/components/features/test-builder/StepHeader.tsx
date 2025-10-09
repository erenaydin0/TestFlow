'use client';

import React from 'react';
import { CheckCircle, XCircle, GitBranch, Trash2 } from 'lucide-react';
import { TestStep } from '@/types';
import { ActionType } from '@/lib/actions';
import { useI18n } from '@/contexts';

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
  const { t } = useI18n();
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
                  ? 'var(--status-success)' 
                  : 'transparent',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                color: isConnecting && connectionStart === step.id && connectionType === 'true'
                  ? 'white' 
                  : 'var(--status-success)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!(isConnecting && connectionStart === step.id && connectionType === 'true')) {
                  e.currentTarget.style.backgroundColor = 'var(--status-success-bg)';
                  e.currentTarget.style.color = 'var(--status-success-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!(isConnecting && connectionStart === step.id && connectionType === 'true')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--status-success)';
                }
              }}
              title={isConnecting && connectionStart === step.id && connectionType === 'true'
                ? t('testSteps.cancelTrueConnection')
                : isConnecting 
                  ? t('testSteps.connectToTrue')
                  : t('testSteps.startTrueConnection')}
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
                  ? 'var(--status-error)' 
                  : 'transparent',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                color: isConnecting && connectionStart === step.id && connectionType === 'false'
                  ? 'white' 
                  : 'var(--status-error)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!(isConnecting && connectionStart === step.id && connectionType === 'false')) {
                  e.currentTarget.style.backgroundColor = 'var(--status-error-bg)';
                  e.currentTarget.style.color = 'var(--status-error-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!(isConnecting && connectionStart === step.id && connectionType === 'false')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--status-error)';
                }
              }}
              title={isConnecting && connectionStart === step.id && connectionType === 'false'
                ? t('testSteps.cancelFalseConnection')
                : isConnecting 
                  ? t('testSteps.connectToFalse')
                : t('testSteps.startFalseConnection')}
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
                ? 'var(--status-info)' 
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
                e.currentTarget.style.backgroundColor = 'var(--status-info-bg)';
                e.currentTarget.style.color = 'var(--status-info)';
              }
            }}
            onMouseLeave={(e) => {
              if (!(isConnecting && connectionStart === step.id)) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-tertiary)';
              }
            }}
            title={isConnecting && connectionStart === step.id 
              ? t('testSteps.cancelConnection')
              : isConnecting 
                ? t('testSteps.connectHere')
                : t('testSteps.startConnection')}
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
            e.currentTarget.style.backgroundColor = 'var(--status-error-bg)';
            e.currentTarget.style.color = 'var(--status-error)';
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