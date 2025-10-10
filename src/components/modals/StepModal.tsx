'use client';

import React, { useState, useEffect } from 'react';
import {  X } from 'lucide-react';
import { IconButton } from '@/components';
import { TestStep } from '@/types';
import { getTranslatedActionByType, ActionField } from '@/utils/actions';
import { CustomSelect } from '@/components/common';
import { useI18n } from '@/contexts';

// Props interface
interface StepModalProps {
  isOpen: boolean;
  step: TestStep | null;
  onClose: () => void;
  onUpdateProperty: (stepId: string, property: string, value: any) => void;
}

const StepModal: React.FC<StepModalProps> = ({
  isOpen,
  step,
  onClose,
  onUpdateProperty
}) => {
  const { t } = useI18n();
  // Local state for form inputs
  const [localStep, setLocalStep] = useState<TestStep | null>(null);
  // State for keyboard capture
  const [isCapturingKey, setIsCapturingKey] = useState<string | null>(null);

  // Initialize local state when step changes
  useEffect(() => {
    if (step) {
      setLocalStep({ ...step });
    }
  }, [step]);

  // Debounced update to parent state
  useEffect(() => {
    if (!localStep || !step) return;

    const timeoutId = setTimeout(() => {
      // Update only changed properties
      Object.keys(localStep).forEach(key => {
        if (localStep[key as keyof TestStep] !== step[key as keyof TestStep]) {
          onUpdateProperty(step.id, key, localStep[key as keyof TestStep]);
        }
      });
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [localStep, step, onUpdateProperty]);

  // Handle local state updates
  const handleLocalUpdate = (property: string, value: any) => {
    if (localStep) {
      setLocalStep(prev => prev ? { ...prev, [property]: value } : null);
    }
  };

  // Handle keyboard capture for key fields
  const handleKeyCapture = (fieldKey: string, event: React.KeyboardEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    let keyName = event.key;
    
    // Special key mappings
    if (event.key === ' ') keyName = 'Space';
    if (event.key === 'ArrowUp') keyName = 'ArrowUp';
    if (event.key === 'ArrowDown') keyName = 'ArrowDown';
    if (event.key === 'ArrowLeft') keyName = 'ArrowLeft';
    if (event.key === 'ArrowRight') keyName = 'ArrowRight';
    if (event.key === 'Enter') keyName = 'Enter';
    if (event.key === 'Tab') keyName = 'Tab';
    if (event.key === 'Escape') keyName = 'Escape';
    if (event.key === 'Backspace') keyName = 'Backspace';
    if (event.key === 'Delete') keyName = 'Delete';
    
    console.log('Key captured:', keyName); // Debug log
    
    handleLocalUpdate(fieldKey, keyName);
    setIsCapturingKey(null);
  };

  // Render field based on its configuration
  const renderField = (field: ActionField) => {
    if (!localStep) return null;

    const value = localStep[field.key as keyof TestStep] || '';
    const fieldId = `field-${field.key}`;

    const baseStyle = {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid var(--border-primary)',
      borderRadius: '0.5rem',
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      fontSize: '0.875rem',
      outline: 'none',
      boxSizing: 'border-box' as const
    };

    const focusHandlers = {
      onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        e.currentTarget.style.borderColor = action?.color || 'var(--color-selected)';
        e.currentTarget.style.boxShadow = `0 0 0 3px ${action?.color || 'var(--color-selected)'}20`;
      },
      onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        e.currentTarget.style.borderColor = 'var(--border-primary)';
        e.currentTarget.style.boxShadow = 'none';
      }
    };

    // Special handling for key input in keyboard actions
    if (field.key === 'key' && step?.type === 'key') {
      const isCapturing = isCapturingKey === field.key;
      return (
        <div style={{ position: 'relative' }}>
          <input
            key={fieldId}
            id={fieldId}
            type="text"
            value={isCapturing ? t('testBuilder.waitingForKey') : (value as string)}
            onClick={() => {
              setIsCapturingKey(field.key);
              console.log(t('testBuilder.inputClicked'), field.key);
            }}
            onKeyDown={(e) => {
              console.log('Key down event:', e.key);
              handleKeyCapture(field.key, e);
            }}
            onKeyUp={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            placeholder={field.placeholder}
            required={field.required}
            readOnly
            style={{
              ...baseStyle,
              backgroundColor: isCapturing ? 'var(--color-capture)' : 'var(--bg-secondary)',
              color: isCapturing ? 'var(--status-warning-hover)' : 'var(--text-primary)',
              cursor: 'pointer',
              border: isCapturing ? '2px solid var(--status-warning)' : '1px solid var(--border-primary)'
            }}
            autoFocus={isCapturing}
          />
        </div>
      );
    }

    switch (field.type) {
      case 'text':
      case 'url':
        return (
          <input
            key={fieldId}
            id={fieldId}
            type={field.type}
            value={value as string}
            onChange={(e) => handleLocalUpdate(field.key, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            style={baseStyle}
            {...focusHandlers}
          />
        );

      case 'number':
        return (
          <input
            key={fieldId}
            id={fieldId}
            type="number"
            value={value as number || ''}
            onChange={(e) => handleLocalUpdate(field.key, parseInt(e.target.value) || (field.min || 0))}
            placeholder={field.placeholder}
            required={field.required}
            min={field.min}
            max={field.max}
            step={field.step}
            style={baseStyle}
            {...focusHandlers}
          />
        );

      case 'textarea':
        return (
          <textarea
            key={fieldId}
            id={fieldId}
            value={value as string}
            onChange={(e) => handleLocalUpdate(field.key, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
            style={{
              ...baseStyle,
              resize: 'vertical' as const,
              fontFamily: 'inherit'
            }}
            {...focusHandlers}
          />
        );

      case 'select':
        return (
          <CustomSelect
            key={fieldId}
            value={value as string}
            onChange={(value) => handleLocalUpdate(field.key, value)}
            options={field.options?.map(option => ({
              value: option.value || '',
              label: option.label || ''
            })) || []}
            placeholder={t('common.select')}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box',
              padding: '0.75rem'
            }}
          />
        );

      case 'checkbox':
        return (
          <label
            key={fieldId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleLocalUpdate(field.key, e.target.checked)}
              style={{
                width: '1rem',
                height: '1rem',
                cursor: 'pointer'
              }}
            />
            <span style={{
              fontSize: '0.875rem',
              color: 'var(--text-primary)'
            }}>
              {field.label}
            </span>
          </label>
        );

      default:
        return null;
    }
  };

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isCapturingKey) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose, isCapturingKey]);

  if (!isOpen || !step || !localStep) return null;

  const action = getTranslatedActionByType(step.type, t);
  if (!action) return null;

  const Icon = action.icon;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div 
        style={{
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: '1rem',
        padding: '1.5rem',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-primary)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              backgroundColor: `${action.color}10`,
              border: `1px solid ${action.color}30`,
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Icon size={18} color={action.color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem' 
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  {action.title}
                </h3>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  color: 'var(--text-tertiary)',
                  opacity: 0.7
                }}>
                  #{step.id.slice(-4)}
                </span>
              </div>
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                margin: '0.25rem 0 0 0'
              }}>
                {action.description}
              </p>
            </div>
          </div>
          <IconButton
            icon={X}
            variant="ghost"
            size="md"
            tooltip={t('common.close')}
            onClick={onClose}
          />
        </div>

        {/* Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Description Field - Always shown */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              marginBottom: '0.5rem'
            }}>
              {t('testBuilder.stepDescription')}
            </label>
            <input
              type="text"
              value={localStep.description || ''}
              onChange={(e) => handleLocalUpdate('description', e.target.value)}
              placeholder={t('testBuilder.stepDescriptionPlaceholder')}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-primary)',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = action.color;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${action.color}20`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-primary)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Dynamic fields based on action configuration */}
          {action.fields.map((field) => {
            // Selector is optional for URL verification
            const isUrlVerification = localStep?.verificationType === 'url' || localStep?.verificationType === 'urlContains';
            const isFieldRequired = field.key === 'selector' && isUrlVerification ? false : field.required;
            
            return (
              <div key={field.key}>
                <label 
                  htmlFor={`field-${field.key}`}
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}
                >
                  {field.label}
                  {isFieldRequired && (
                    <span style={{ color: 'var(--status-error)', marginLeft: '0.25rem' }}>*</span>
                  )}
                </label>
                {renderField(field)}
                {field.description && (
                  <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    margin: '0.25rem 0 0 0',
                    opacity: 0.8
                  }}>
                    {field.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StepModal; 