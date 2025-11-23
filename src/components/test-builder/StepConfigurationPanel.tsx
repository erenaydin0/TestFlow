'use client';

import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { IconButton } from '@/components';
import { TestStep } from '@/types';
import { getTranslatedActionByType, ActionField } from '@/utils/actions';
import { CustomSelect } from '@/components/common';
import { useI18n } from '@/hooks';

// Props interface
interface StepConfigurationPanelProps {
    step: TestStep | null;
    onSave: (step: TestStep) => void;
    onClose: () => void; // To clear selection
    onDelete: (stepId: string) => void;
}

const StepConfigurationPanel: React.FC<StepConfigurationPanelProps> = ({
    step,
    onSave,
    onClose,
    onDelete
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
        } else {
            setLocalStep(null);
        }
    }, [step]);

    // Auto-save when local state changes
    useEffect(() => {
        if (!localStep || !step) return;

        const timeoutId = setTimeout(() => {
            // Check if anything changed
            const hasChanges = Object.keys(localStep).some(key =>
                localStep[key as keyof TestStep] !== step[key as keyof TestStep]
            );

            if (hasChanges) {
                onSave(localStep);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [localStep, step, onSave]);

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
            backgroundColor: 'var(--bg-primary)',
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
                        }}
                        onKeyDown={(e) => {
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
                            backgroundColor: isCapturing ? 'var(--color-capture)' : 'var(--bg-primary)',
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
                            backgroundColor: 'var(--bg-primary)',
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

    if (!step || !localStep) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-tertiary)] p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
                    <div className="w-8 h-8 border-2 border-[var(--border-primary)] rounded-md"></div>
                </div>
                <p>{t('testBuilder.selectStepToEdit')}</p>
            </div>
        );
    }

    const action = getTranslatedActionByType(step.type, t);
    if (!action) return null;

    const Icon = action.icon;

    return (
        <div className="h-full flex flex-col bg-[var(--bg-secondary)] border-l border-[var(--border-primary)]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{
                            backgroundColor: `${action.color}15`,
                            border: `1px solid ${action.color}30`
                        }}
                    >
                        <Icon size={20} color={action.color} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">
                            {action.title}
                        </h3>
                        <p className="text-xs text-[var(--text-tertiary)]">
                            ID: {step.id.slice(-4)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <IconButton
                        icon={Trash2}
                        variant="ghost"
                        size="sm"
                        tooltip={t('common.delete')}
                        onClick={() => onDelete(step.id)}
                        className="text-[var(--status-error)] hover:bg-[var(--status-error-bg)]"
                    />
                    <IconButton
                        icon={X}
                        variant="ghost"
                        size="sm"
                        tooltip={t('common.close')}
                        onClick={onClose}
                    />
                </div>
            </div>

            {/* Form Fields */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Description Field - Always shown */}
                <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        {t('testBuilder.stepDescription')}
                    </label>
                    <input
                        type="text"
                        value={localStep.description || ''}
                        onChange={(e) => handleLocalUpdate('description', e.target.value)}
                        placeholder={t('testBuilder.stepDescriptionPlaceholder')}
                        className="w-full p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:outline-none transition-shadow"
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
                                className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                            >
                                {field.label}
                                {isFieldRequired && (
                                    <span className="text-[var(--status-error)] ml-1">*</span>
                                )}
                            </label>
                            {renderField(field)}
                            {field.description && (
                                <p className="text-xs text-[var(--text-secondary)] mt-1 opacity-80">
                                    {field.description}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StepConfigurationPanel;
