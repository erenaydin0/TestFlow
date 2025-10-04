'use client';

import React from 'react';
import { TestStep } from '@/types';
import { getActionByType, ActionType } from '@/lib/actions';
import {StepHeader, StepContent} from '@/components/features/test-builder/';

interface TestStepCardProps {
  step: TestStep;
  isSelected: boolean;
  isMultiSelected: boolean;
  draggedStep: string | null;
  selectedStep: TestStep | null;
  selectedSteps: Set<string>;
  
  // Connection props
  isConnecting: boolean;
  connectionStart: string | null;
  connectionType: 'normal' | 'true' | 'false';
  
  // Event handlers
  onStepDragStart: (stepId: string) => void;
  onDragEnd: () => void;
  onStepClick: (step: TestStep, ctrlKey: boolean) => void;
  onDeleteStep: (stepId: string, callback: () => void) => void;
  onStartConnection: (stepId: string, type?: 'normal' | 'true' | 'false') => void;
  onEndConnection: (stepId: string, testSteps: TestStep[], setTestSteps: (steps: TestStep[]) => void, saveToHistory: (steps: TestStep[]) => void) => void;
  
  // State setters
  setIsConnecting: (connecting: boolean) => void;
  setConnectionStart: (start: string | null) => void;
  setConnectionType: (type: 'normal' | 'true' | 'false') => void;
  setSelectedSteps: (steps: Set<string>) => void;
  setSelectedStep: (step: TestStep | null) => void;
  
  // Test steps data
  testSteps: TestStep[];
  setTestSteps: (steps: TestStep[]) => void;
  saveToHistory: (steps: TestStep[]) => void;
}

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
  const action = getActionByType(step.type);
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
        width: '12rem',
        padding: '0.75rem',
        backgroundColor: isMultiSelected ? `${action.color}10` : 'var(--bg-primary)',
        border: `2px solid ${isSelected ? action.color : isMultiSelected ? action.color : 'var(--border-primary)'}`,
        borderRadius: '0.5rem',
        cursor: draggedStep === step.id ? 'grabbing' : 'grab',
        boxShadow: isSelected || isMultiSelected
          ? `0 4px 12px ${action.color}30` 
          : '0 2px 8px rgba(0,0,0,0.1)',
        transition: draggedStep === step.id ? 'none' : 'all 0.2s ease',
        opacity: draggedStep === step.id ? 0.5 : 1,
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