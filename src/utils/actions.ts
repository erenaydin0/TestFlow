import {
  MousePointer,
  Type,
  Clock,
  RefreshCw,
  CheckCircle,
  ChevronDown,
  Link
} from 'lucide-react';

// Translation function type
export type TranslationFunction = (key: string) => string;

// Action category for better organization
export type ActionCategory = 'navigation' | 'interaction' | 'input' | 'validation' | 'utility' | 'advanced';

// Field configuration for dynamic form generation
export interface ActionField {
  key: string;
  label?: string;
  labelKey?: string;
  type: 'text' | 'url' | 'number' | 'textarea' | 'select' | 'checkbox';
  placeholder?: string;
  placeholderKey?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label?: string; labelKey?: string }[];
  description?: string;
  descriptionKey?: string;
}

// Enhanced action type with extensible configuration
export interface ActionType {
  type: string;
  title?: string;
  titleKey?: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  borderColor: string;
  description?: string;
  descriptionKey?: string;
  category: ActionCategory;
  fields: ActionField[];
  isAdvanced?: boolean;
  version?: string;
}

// Base action configurations (without translations)
const baseActionsConfig: any[] = [
  {
    type: 'navigate',
    titleKey: 'testSteps.navigate',
    icon: Link,
    color: 'var(--status-info)',
    borderColor: 'var(--status-info)',
    descriptionKey: 'testSteps.navigateDesc',
    category: 'navigation' as ActionCategory,
    fields: [
      {
        key: 'url',
        labelKey: 'testSteps.url',
        type: 'url' as const,
        placeholderKey: 'testSteps.urlPlaceholder',
        required: true,
        descriptionKey: 'testSteps.urlDescription'
      }
    ]
  },
  {
    type: 'click',
    titleKey: 'testSteps.click',
    icon: MousePointer,
    color: 'var(--status-success)',
    borderColor: 'var(--status-success)',
    descriptionKey: 'testSteps.clickDesc',
    category: 'interaction' as ActionCategory,
    fields: [
      {
        key: 'selector',
        labelKey: 'testSteps.selector',
        type: 'text' as const,
        placeholderKey: 'testSteps.clickSelectorPlaceholder',
        required: true,
        descriptionKey: 'testSteps.selectorDescription'
      }
    ]
  },
  {
    type: 'input',
    titleKey: 'testSteps.input',
    icon: Type,
    color: 'var(--status-error)',
    borderColor: 'var(--status-error)',
    descriptionKey: 'testSteps.inputDesc',
    category: 'input' as ActionCategory,
    fields: [
      {
        key: 'selector',
        labelKey: 'testSteps.selector',
        type: 'text' as const,
        placeholderKey: 'testSteps.inputSelectorPlaceholder',
        required: true,
        descriptionKey: 'testSteps.inputSelectorDescription'
      },
      {
        key: 'value',
        labelKey: 'testSteps.value',
        type: 'text' as const,
        placeholderKey: 'testSteps.inputValuePlaceholder',
        required: true,
        descriptionKey: 'testSteps.inputValueDescription'
      }
    ]
  },
  {
    type: 'wait',
    titleKey: 'testSteps.wait',
    icon: Clock,
    color: 'var(--status-warning)',
    borderColor: 'var(--status-warning)',
    descriptionKey: 'testSteps.waitDesc',
    category: 'utility' as ActionCategory,
    fields: [
      {
        key: 'duration',
        labelKey: 'testSteps.duration',
        type: 'number' as const,
        placeholder: '1000',
        min: 100,
        max: 30000,
        step: 100,
        required: true,
        descriptionKey: 'testSteps.durationDescription'
      }
    ]
  },
  {
    type: 'refresh',
    titleKey: 'testSteps.refresh',
    icon: RefreshCw,
    color: 'var(--status-purple)',
    borderColor: 'var(--status-purple)',
    descriptionKey: 'testSteps.refreshDesc',
    category: 'navigation' as ActionCategory,
    fields: []
  },
  {
    type: 'verify',
    titleKey: 'testSteps.verify',
    icon: CheckCircle,
    color: 'var(--status-success)',
    borderColor: 'var(--status-success)',
    descriptionKey: 'testSteps.verifyDesc',
    category: 'validation' as ActionCategory,
    fields: [
      {
        key: 'selector',
        labelKey: 'testSteps.selector',
        type: 'text' as const,
        placeholderKey: 'testSteps.verifySelectorPlaceholder',
        required: false,
        descriptionKey: 'testSteps.verifySelectorDescription'
      },
      {
        key: 'verificationType',
        labelKey: 'testSteps.verificationType',
        type: 'select' as const,
        required: true,
        options: [
          { value: 'text', labelKey: 'testSteps.textContent' },
          { value: 'contains', labelKey: 'testSteps.textContains' },
          { value: 'url', labelKey: 'testSteps.urlCheck' },
          { value: 'urlContains', labelKey: 'testSteps.urlContains' },
          { value: 'value', labelKey: 'testSteps.inputValue' },
          { value: 'visible', labelKey: 'testSteps.visible' },
          { value: 'hidden', labelKey: 'testSteps.hidden' },
          { value: 'enabled', labelKey: 'testSteps.enabled' },
          { value: 'disabled', labelKey: 'testSteps.disabled' }
        ],
        descriptionKey: 'testSteps.verificationTypeDescription'
      },
      {
        key: 'expectedValue',
        labelKey: 'testSteps.expectedValue',
        type: 'text' as const,
        placeholderKey: 'testSteps.verifyExpectedValuePlaceholder',
        descriptionKey: 'testSteps.verifyExpectedValueDescription'
      }
    ]
  },
  {
    type: 'dropdown',
    titleKey: 'testSteps.dropdown',
    icon: ChevronDown,
    color: 'var(--status-success)',
    borderColor: 'var(--status-success)',
    descriptionKey: 'testSteps.dropdownDesc',
    category: 'input' as ActionCategory,
    fields: [
      {
        key: 'selector',
        labelKey: 'testSteps.selector',
        type: 'text' as const,
        placeholderKey: 'testSteps.dropdownSelectorPlaceholder',
        required: true,
        descriptionKey: 'testSteps.dropdownSelectorDescription'
      },
      {
        key: 'optionType',
        labelKey: 'testSteps.optionType',
        type: 'select' as const,
        required: true,
        options: [
          { value: 'value', labelKey: 'testSteps.value' },
          { value: 'text', labelKey: 'testSteps.visibleText' },
          { value: 'index', labelKey: 'testSteps.indexNumber' }
        ],
        descriptionKey: 'testSteps.optionTypeDescription'
      },
      {
        key: 'optionValue',
        labelKey: 'testSteps.optionValue',
        type: 'text' as const,
        placeholderKey: 'testSteps.optionValuePlaceholder',
        required: true,
        descriptionKey: 'testSteps.optionValueDescription'
      }
    ]
  }
];

// Function to get translated actions
export const getTranslatedActions = (t: TranslationFunction): ActionType[] => {
  const translateAction = (action: any): ActionType => ({
    ...action,
    title: action.titleKey ? t(action.titleKey) : action.title,
    description: action.descriptionKey ? t(action.descriptionKey) : action.description,
    fields: action.fields.map((field: any) => ({
      ...field,
      label: field.labelKey ? t(field.labelKey) : field.label,
      description: field.descriptionKey ? t(field.descriptionKey) : field.description,
      options: field.options?.map((option: any) => ({
        ...option,
        label: option.labelKey ? t(option.labelKey) : option.label
      }))
    }))
  });

  return baseActionsConfig.map(translateAction);
};

/**
 * @deprecated This export is primarily used in tests. For production code, use getTranslatedActions or getTranslatedActionByType instead.
 * This will be removed in a future version.
 */
export const availableActions: ActionType[] = baseActionsConfig.map(action => ({
  ...action,
  title: action.titleKey || action.title || action.type,
  description: action.descriptionKey || action.description || '',
  fields: action.fields.map((field: any) => ({
    ...field,
    label: field.labelKey || field.label || field.key,
    description: field.descriptionKey || field.description || '',
    options: field.options?.map((option: any) => ({
      ...option,
      label: option.labelKey || option.label || option.value
    }))
  }))
}));

// Helper functions
/**
 * @deprecated Use getTranslatedActionByType instead for i18n support
 * This function is kept for backward compatibility but will be removed in future versions
 */
export const getActionByType = (type: string): ActionType | undefined => {
  return availableActions.find(action => action.type === type);
};

// Translation-aware version of getActionByType
export const getTranslatedActionByType = (type: string, t: TranslationFunction): ActionType | undefined => {
  const action = baseActionsConfig.find(action => action.type === type);
  if (!action) return undefined;

  return {
    ...action,
    title: action.titleKey ? t(action.titleKey) : action.title || action.type,
    description: action.descriptionKey ? t(action.descriptionKey) : action.description || '',
    fields: action.fields.map((field: any) => ({
      ...field,
      label: field.labelKey ? t(field.labelKey) : field.label || field.key,
      placeholder: field.placeholderKey ? t(field.placeholderKey) : field.placeholder,
      description: field.descriptionKey ? t(field.descriptionKey) : field.description || '',
      options: field.options?.map((option: any) => ({
        ...option,
        label: option.labelKey ? t(option.labelKey) : option.label || option.value
      }))
    }))
  };
};