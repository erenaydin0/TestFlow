'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { TestStep } from '@/types';
import { getTranslatedActionByType, ActionType } from '@/utils/actions';
import { useI18n } from '@/hooks';

export interface TestStepCardProps {
  step: TestStep;
  isSelected: boolean;
  isMultiSelected?: boolean;
  draggedStep: string | null;
  onStepDragStart: (stepId: string) => void;
  onDragEnd: () => void;
  onStepClick: (step: TestStep, isMultiSelect: boolean) => void;
  onDeleteStep: (stepId: string, callback: () => void) => void;
  setSelectedSteps: (steps: Set<string>) => void;
  setSelectedStep: (step: TestStep | null) => void;
  selectedSteps: Set<string>;
  selectedStep: TestStep | null;
  testSteps: TestStep[];
  setTestSteps: (steps: TestStep[]) => void;
  saveToHistory: (steps: TestStep[]) => void;
}

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
      fontSize: '0.875rem',
      color: 'var(--text-secondary)',
      marginTop: '0.5rem',
      wordBreak: 'break-all'
    }}>
      {/* Step description or configuration preview */}
      {step.description ? (
        <div style={{
          color: 'var(--text-primary)',
          fontStyle: 'italic',
          marginBottom: '0.25rem',
          lineHeight: '1.4'
        }}>
          "{step.description}"
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
            <>
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
            </>
          )}
          {step.type === 'dropdown' && (
            <>
              <span>{t('testSteps.element')}: {step.selector || t('testSteps.notSpecified')}</span>
              <span>{t('testSteps.type')}: {step.optionType || t('testSteps.notSpecified')}</span>
              <span>{t('testSteps.value')}: {step.optionValue || t('testSteps.notSpecified')}</span>
            </>
          )}
        </div>
      )}

      {/* Show config details if description exists */}
      {step.description && (
        <div style={{
          fontSize: '0.75rem',
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
          {step.type === 'dropdown' && (
            <div>
              {step.selector && `${t('testSteps.element')}: ${step.selector}, `}
              {`${t('testSteps.type')}: ${step.optionType || t('testSteps.notSpecified')}, `}
              {`${t('testSteps.value')}: ${step.optionValue || t('testSteps.notSpecified')}`}
            </div>
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
  onDeleteStep: (stepId: string, callback: () => void) => void;
  setSelectedSteps: (steps: Set<string>) => void;
  setSelectedStep: (step: TestStep | null) => void;
  selectedSteps: Set<string>;
  selectedStep: TestStep | null;
}

export const StepHeader: React.FC<StepHeaderProps> = ({
  step,
  action,
  onDeleteStep,
  setSelectedSteps,
  setSelectedStep,
  selectedSteps,
  selectedStep
}) => {
  const Icon = action.icon;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '0.25rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          padding: '0.375rem',
          backgroundColor: `${action.color}15`,
          borderRadius: '0.375rem'
        }}>
          <Icon size={16} color={action.color} />
        </div>
        <span style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--text-primary)'
        }}>
          {action.title}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '0.25rem' }}>
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
            padding: '0.375rem',
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
          <Trash2 size={14} />
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
  draggedStep,
  onStepDragStart,
  onDragEnd,
  onStepClick,
  onDeleteStep,
  setSelectedSteps,
  setSelectedStep,
  selectedSteps,
  selectedStep
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
        dragImage.style.transform = 'scale(1.02)';
        dragImage.style.opacity = '0.9';
        e.dataTransfer.setDragImage(dragImage, 20, 20);
      }}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        onStepClick(step, e.ctrlKey || e.metaKey);
      }}
      style={{
        position: 'relative',
        width: '100%',
        marginBottom: '0.75rem',
        padding: '1rem',
        backgroundColor: 'var(--bg-primary)',
        border: `1px solid ${isSelected ? action.color : 'var(--border-primary)'}`,
        borderRadius: '0.5rem',
        cursor: draggedStep === step.id ? 'grabbing' : 'grab',
        boxShadow: isSelected
          ? `0 2px 8px ${action.color}20`
          : '0 1px 2px rgba(0,0,0,0.05)',
        transition: draggedStep === step.id ? 'none' : 'all 0.15s ease',
        opacity: draggedStep === step.id ? 0.5 : 1,
      }}
    >
      <StepHeader
        step={step}
        action={action}
        onDeleteStep={onDeleteStep}
        setSelectedSteps={setSelectedSteps}
        setSelectedStep={setSelectedStep}
        selectedSteps={selectedSteps}
        selectedStep={selectedStep}
      />

      <StepContent step={step} />
    </div>
  );
};
