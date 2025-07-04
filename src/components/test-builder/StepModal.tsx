import React, { useState, useEffect } from 'react';
import {
  Navigation,
  MousePointer,
  Type,
  Clock,
  RotateCcw,
  GitBranch,
  X,
  Save
} from 'lucide-react';
import { TestStep } from '@/types';
import { availableActions, getActionByType, ActionField } from '@/lib/actions';

// Available actions type
interface ActionType {
  type: string;
  title: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  description: string;
  category: string;
  fields: ActionField[];
  isAdvanced?: boolean;
}

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
  // Local state for form inputs
  const [localStep, setLocalStep] = useState<TestStep | null>(null);

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
        e.currentTarget.style.borderColor = action?.color || '#3b82f6';
        e.currentTarget.style.boxShadow = `0 0 0 3px ${action?.color || '#3b82f6'}20`;
      },
      onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        e.currentTarget.style.borderColor = 'var(--border-primary)';
        e.currentTarget.style.boxShadow = 'none';
      }
    };

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
          <select
            key={fieldId}
            id={fieldId}
            value={value as string}
            onChange={(e) => handleLocalUpdate(field.key, e.target.value)}
            required={field.required}
            style={baseStyle}
            {...focusHandlers}
          >
            <option value="">Seçiniz...</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !step || !localStep) return null;

  const action = getActionByType(step.type);
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
          <button
            onClick={onClose}
            style={{
              width: '2rem',
              height: '2rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={18} />
          </button>
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
              Adım Açıklaması
            </label>
            <input
              type="text"
              value={localStep.description || ''}
              onChange={(e) => handleLocalUpdate('description', e.target.value)}
              placeholder="Bu adımın ne yaptığını açıklayın..."
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
          {action.fields.map((field) => (
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
                {field.required && (
                  <span style={{ color: '#dc2626', marginLeft: '0.25rem' }}>*</span>
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepModal; 