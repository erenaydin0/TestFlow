'use client';

import React from 'react';
import { CheckCircle, XCircle, GitBranch, Trash2 } from 'lucide-react';
import { TestStep, TestStepCardProps } from '@/types';
import { getTranslatedActionByType, ActionType } from '@/lib/actions';
import { useI18n } from '@/contexts';

// ============================================================================
// StepContent Component
// ============================================================================

interface StepContentProps {
  step: TestStep;
}

export const StepContent: React.FC<StepContentProps> = ({ step }) => {
  const { t } = useI18n();
  return (
    <div style={{ 
      fontSize: '0.75rem', 
      color: 'var(--text-secondary)',
      minHeight: '2rem',
      wordBreak: 'break-all'
    }}>
      {/* Step description or configuration preview */}
      {step.description ? (
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-primary)',
          fontStyle: 'italic',
          marginBottom: '0.25rem',
          lineHeight: '1.3'
        }}>
          "{step.description}"
        </div>
      ) : (
        <>
          {/* Step configuration preview */}
          {step.type === 'navigate' && (
            <span>URL: {step.url || t('testSteps.notSpecified')}</span>
          )}
          {step.type === 'click' && (
            <span>{t('testSteps.element')}: {step.selector || t('testSteps.notSpecified')}</span>
          )}
          {step.type === 'input' && (
            <span>
              {step.selector ? `${step.selector}: ` : `${t('testSteps.input')}: `}
              {step.value || t('testSteps.notSpecified')}
            </span>
          )}
          {step.type === 'wait' && (
            <span>{t('testSteps.duration')}: {step.duration || 1000}ms</span>
          )}
          {step.type === 'refresh' && t('testSteps.refresh')}
          {step.type === 'verify' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {(step.verificationType === 'url' || step.verificationType === 'urlContains') ? (
                <>
                  <span>{t('testSteps.type')}: {step.verificationType === 'url' ? t('testSteps.urlCheck') : t('testSteps.contains')}</span>
                  {step.expectedValue && <span>{t('testSteps.expected')}: {step.expectedValue}</span>}
                </>
              ) : (
                <>
                  <span>{t('testSteps.element')}: {step.selector || t('testSteps.notSpecified')}</span>
                  <span>{t('testSteps.type')}: {step.verificationType || t('testSteps.notSpecified')}</span>
                  {step.expectedValue && <span>{t('testSteps.value')}: {step.expectedValue}</span>}
                </>
              )}
            </div>
          )}
          {step.type === 'scroll' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {step.selector && <span>{t('testSteps.element')}: {step.selector}</span>}
              <span>{t('testSteps.direction')}: {step.direction || t('testSteps.notSpecified')}</span>
              {step.amount && <span>{t('testSteps.amount')}: {step.amount}px</span>}
            </div>
          )}
          {step.type === 'hover' && (
            <span>{t('testSteps.element')}: {step.selector || t('testSteps.notSpecified')}</span>
          )}
          {step.type === 'key' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span>{t('testSteps.key')}: {step.key || t('testSteps.notSpecified')}</span>
              {step.selector && <span>{t('testSteps.element')}: {step.selector}</span>}
            </div>
          )}
          {step.type === 'dropdown' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span>{t('testSteps.element')}: {step.selector || t('testSteps.notSpecified')}</span>
              <span>{t('testSteps.type')}: {step.optionType || t('testSteps.notSpecified')}</span>
              <span>{t('testSteps.value')}: {step.optionValue || t('testSteps.notSpecified')}</span>
            </div>
          )}
          {step.type === 'if' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span>{t('testSteps.type')}: {step.conditionType || 'visible'}</span>
              {step.selector && <span>{t('testSteps.element')}: {step.selector}</span>}
              {step.expectedValue && <span>{t('testSteps.value')}: {step.expectedValue}</span>}
              {step.operator && step.conditionType === 'count' && <span>Operatör: {step.operator}</span>}
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.65rem', marginTop: '0.25rem' }}>
                <span style={{ 
                  color: step.trueConnection ? 'var(--status-success)' : 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <CheckCircle size={10} />
                  TRUE: {step.trueConnection ? '✓' : t('testSteps.notConnected')}
                </span>
                <span style={{ 
                  color: step.falseConnection ? 'var(--status-error)' : 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <XCircle size={10} />
                  FALSE: {step.falseConnection ? '✓' : t('testSteps.notConnected')}
                </span>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Show both description and config if description exists */}
      {step.description && (
        <div style={{
          fontSize: '0.65rem',
          color: 'var(--text-tertiary)',
          marginTop: '0.25rem'
        }}>
          {step.type === 'navigate' && step.url && `URL: ${step.url}`}
          {step.type === 'click' && step.selector && `${t('testSteps.element')}: ${step.selector}`}
          {step.type === 'input' && step.value && `${t('testSteps.input')}: ${step.value}`}
          {step.type === 'wait' && `${t('testSteps.duration')}: ${step.duration || 1000}ms`}
          {step.type === 'refresh' && t('testSteps.refresh')}
          {step.type === 'verify' && (
            <div>
              {(step.verificationType === 'url' || step.verificationType === 'urlContains') ? (
                <>
                  {step.verificationType && `${t('testSteps.type')}: ${step.verificationType === 'url' ? t('testSteps.urlCheck') : t('testSteps.contains')}`}
                  {step.expectedValue && `, ${t('testSteps.expected')}: ${step.expectedValue}`}
                </>
              ) : (
                <>
                  {step.selector && `${t('testSteps.element')}: ${step.selector}`}
                  {step.verificationType && `, ${t('testSteps.type')}: ${step.verificationType}`}
                  {step.expectedValue && `, ${t('testSteps.value')}: ${step.expectedValue}`}
                </>
              )}
            </div>
          )}
          {step.type === 'scroll' && (
            <div>
              {step.selector && `${t('testSteps.element')}: ${step.selector}, `}
              {`${t('testSteps.direction')}: ${step.direction || t('testSteps.notSpecified')}`}
              {step.amount && `, ${t('testSteps.amount')}: ${step.amount}px`}
            </div>
          )}
          {step.type === 'hover' && step.selector && `${t('testSteps.element')}: ${step.selector}`}
          {step.type === 'key' && (
            <div>
              {`${t('testSteps.key')}: ${step.key || t('testSteps.notSpecified')}`}
              {step.selector && `, ${t('testSteps.element')}: ${step.selector}`}
            </div>
          )}
          {step.type === 'dropdown' && (
            <div>
              {step.selector && `${t('testSteps.element')}: ${step.selector}, `}
              {`${t('testSteps.type')}: ${step.optionType || t('testSteps.notSpecified')}, `}
              {`${t('testSteps.value')}: ${step.optionValue || t('testSteps.notSpecified')}`}
            </div>
          )}
          {step.type === 'if' && (
            <>
              {step.conditionType && `${t('testSteps.type')}: ${step.conditionType}`}
              {step.selector && `, ${t('testSteps.element')}: ${step.selector}`}
              {step.expectedValue && `, ${t('testSteps.value')}: ${step.expectedValue}`}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// StepHeader Component
// ============================================================================

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

export const StepHeader: React.FC<StepHeaderProps> = ({
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

// ============================================================================
// TestStepCard Component
// ============================================================================

export const TestStepCard: React.FC<TestStepCardProps> = ({
  step,
  isSelected,
  isMultiSelected,
  draggedStep,
  onStepDragStart,
  onDragEnd,
  onStepClick,
  onDeleteStep,
  onStartConnection,
  onEndConnection,
  isConnecting,
  connectionStart,
  connectionType,
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
  const action = getTranslatedActionByType(step.type, t);
  if (!action) return null;

  return (
    <div
      key={step.id}
      data-step-id={step.id}
      draggable
      onDragStart={(e) => {
        onStepDragStart(step.id);
        // Make drag image more visible
        const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
        dragImage.style.transform = 'scale(1.1)';
        dragImage.style.opacity = '0.8';
        e.dataTransfer.setDragImage(dragImage, 96, 40);
      }}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        onStepClick(step, e.ctrlKey || e.metaKey);
      }}
      onMouseDown={(e) => {
        // Prevent canvas panning when dragging steps
        e.stopPropagation();
      }}
      style={{
        position: 'absolute',
        left: step.x,
        top: step.y,
        width: '11rem',
        padding: '0.75rem',
        backgroundColor: isMultiSelected ? `${action.color}08` : 'var(--bg-primary)',
        border: `1px solid ${isSelected ? action.color : isMultiSelected ? action.color : 'var(--border-primary)'}`,
        borderRadius: '0.375rem',
        cursor: draggedStep === step.id ? 'grabbing' : 'grab',
        boxShadow: isSelected || isMultiSelected
          ? `0 2px 8px ${action.color}20` 
          : '0 1px 3px rgba(0,0,0,0.05)',
        transition: draggedStep === step.id ? 'none' : 'box-shadow 0.15s ease',
        opacity: draggedStep === step.id ? 0.6 : 1,
        zIndex: draggedStep === step.id ? 1000 : 5
      }}
    >
      <StepHeader
        step={step}
        action={action}
        isConnecting={isConnecting}
        connectionStart={connectionStart}
        connectionType={connectionType}
        onStartConnection={onStartConnection}
        onEndConnection={onEndConnection}
        onDeleteStep={onDeleteStep}
        setIsConnecting={setIsConnecting}
        setConnectionStart={setConnectionStart}
        setConnectionType={setConnectionType}
        setSelectedSteps={setSelectedSteps}
        setSelectedStep={setSelectedStep}
        selectedSteps={selectedSteps}
        selectedStep={selectedStep}
        testSteps={testSteps}
        setTestSteps={setTestSteps}
        saveToHistory={saveToHistory}
      />
      
      <StepContent step={step} />
    </div>
  );
};
