'use client';

import React from 'react';

import { TestStep, TestStepCardProps } from '@/types';
import { getTranslatedActionByType, ActionType } from '@/lib/actions';
import { StepHeader, StepContent } from '@/components/features/test-builder';
import { useI18n } from '@/contexts';

// TestStepCardProps is now imported from @/types

const TestStepCard: React.FC<TestStepCardProps> = ({
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

export default TestStepCard; 