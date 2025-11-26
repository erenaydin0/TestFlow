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
    const handleLocalUpdate = <K extends keyof TestStep>(property: K, value: TestStep[K]) => {
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

        handleLocalUpdate(fieldKey as keyof TestStep, keyName);
        setIsCapturingKey(null);
    };

    // Render field based on its configuration
    const renderField = (field: ActionField) => {
        if (!localStep) return null;

        const value = localStep[field.key as keyof TestStep] || '';
        const fieldId = `field-${field.key}`;
        const action = step ? getTranslatedActionByType(step.type, t) : null;
        const activeColor = action?.color || 'var(--color-selected)';

        const inputClasses = "w-full p-3 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm outline-none transition-all focus:border-[color:var(--active-color)] focus:shadow-[0_0_0_3px_rgba(var(--active-color-rgb),0.1)]";

        // Helper to inject dynamic color for focus state
        const focusStyle = {
            '--active-color': activeColor,
            '--active-color-rgb': activeColor.startsWith('#') ? hexToRgb(activeColor) : 'var(--color-selected-rgb)'
        } as React.CSSProperties;

        // Special handling for key input in keyboard actions
        if (field.key === 'key' && step?.type === 'key') {
            const isCapturing = isCapturingKey === field.key;
            return (
                <div className="relative">
                    <input
                        key={fieldId}
                        id={fieldId}
                        type="text"
                        value={isCapturing ? t('testBuilder.waitingForKey') : (value as string)}
                        onClick={() => setIsCapturingKey(field.key)}
                        onKeyDown={(e) => handleKeyCapture(field.key, e)}
                        onKeyUp={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        placeholder={field.placeholder}
                        required={field.required}
                        readOnly
                        className={`w-full p-3 border rounded-lg text-sm outline-none transition-all cursor-pointer ${isCapturing
                                ? 'bg-[var(--color-capture)] text-[var(--status-warning-hover)] border-[var(--status-warning)] ring-2 ring-[var(--status-warning)] ring-opacity-20'
                                : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-primary)]'
                            }`}
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
                        onChange={(e) => handleLocalUpdate(field.key as keyof TestStep, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        className={inputClasses}
                        style={focusStyle}
                    />
                );

            case 'number':
                return (
                    <input
                        key={fieldId}
                        id={fieldId}
                        type="number"
                        value={value as number || ''}
                        onChange={(e) => handleLocalUpdate(field.key as keyof TestStep, parseInt(e.target.value) || (field.min || 0))}
                        placeholder={field.placeholder}
                        required={field.required}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        className={inputClasses}
                        style={focusStyle}
                    />
                );

            case 'textarea':
                return (
                    <textarea
                        key={fieldId}
                        id={fieldId}
                        value={value as string}
                        onChange={(e) => handleLocalUpdate(field.key as keyof TestStep, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        rows={3}
                        className={`${inputClasses} resize-y font-inherit`}
                        style={focusStyle}
                    />
                );

            case 'select':
                return (
                    <CustomSelect
                        key={fieldId}
                        value={value as string}
                        onChange={(value) => handleLocalUpdate(field.key as keyof TestStep, value)}
                        options={field.options?.map(option => ({
                            value: option.value || '',
                            label: option.label || ''
                        })) || []}
                        placeholder={t('common.select')}
                        className="w-full"
                    />
                );

            case 'checkbox':
                return (
                    <label
                        key={fieldId}
                        className="flex items-center gap-2 cursor-pointer"
                    >
                        <input
                            type="checkbox"
                            checked={Boolean(value)}
                            onChange={(e) => handleLocalUpdate(field.key as keyof TestStep, e.target.checked)}
                            className="w-4 h-4 cursor-pointer accent-[var(--color-primary)]"
                        />
                        <span className="text-sm text-[var(--text-primary)]">
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
    const activeColor = action.color;
    const focusStyle = {
        '--active-color': activeColor,
        '--active-color-rgb': activeColor.startsWith('#') ? hexToRgb(activeColor) : 'var(--color-selected-rgb)'
    } as React.CSSProperties;

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
                        className="w-full p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm outline-none transition-all focus:border-[color:var(--active-color)] focus:shadow-[0_0_0_3px_rgba(var(--active-color-rgb),0.1)]"
                        style={focusStyle}
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

// Helper function to convert hex to rgb for rgba usage
function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ?
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
        '0, 0, 0';
}

export default StepConfigurationPanel;
