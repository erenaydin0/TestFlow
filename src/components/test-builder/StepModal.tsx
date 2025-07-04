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
import { availableActions, getActionByType } from '@/lib/actions';

// Available actions type
interface ActionType {
  type: string;
  title: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
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

          {/* Type-specific fields */}
          {step.type === 'navigate' && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                URL
              </label>
              <input
                type="url"
                value={localStep.url || ''}
                onChange={(e) => handleLocalUpdate('url', e.target.value)}
                placeholder="https://example.com"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '0.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box'
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
          )}

          {step.type === 'click' && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                Seçici (Selector)
              </label>
              <input
                type="text"
                value={localStep.selector || ''}
                onChange={(e) => handleLocalUpdate('selector', e.target.value)}
                placeholder="#button, .class, [data-testid='submit']"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '0.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box'
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
          )}

          {step.type === 'input' && (
            <>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  Seçici (Selector)
                </label>
                <input
                  type="text"
                  value={localStep.selector || ''}
                  onChange={(e) => handleLocalUpdate('selector', e.target.value)}
                  placeholder="#input, .form-field, [name='username']"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '0.5rem',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box'
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
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  Değer
                </label>
                <input
                  type="text"
                  value={localStep.value || ''}
                  onChange={(e) => handleLocalUpdate('value', e.target.value)}
                  placeholder="Girilecek metin"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '0.5rem',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box'
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
            </>
          )}

          {step.type === 'wait' && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                Bekleme Süresi (milisaniye)
              </label>
              <input
                type="number"
                value={localStep.duration || 1000}
                onChange={(e) => handleLocalUpdate('duration', parseInt(e.target.value) || 1000)}
                placeholder="1000"
                min="100"
                max="30000"
                step="100"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '0.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box'
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
          )}

          {step.type === 'if' && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                Koşul Seçicisi
              </label>
              <input
                type="text"
                value={localStep.condition || ''}
                onChange={(e) => handleLocalUpdate('condition', e.target.value)}
                placeholder="#element, .exists, [data-visible='true']"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '0.5rem',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box'
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
          )}
        </div>
      </div>
    </div>
  );
};

export default StepModal; 