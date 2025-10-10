import {
  MousePointer,
  Type,
  Clock,
  RefreshCw,
  GitBranch,
  CheckCircle,
  Scroll,
  MousePointer2,
  Keyboard,
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
    type: 'if',
    titleKey: 'testSteps.condition',
    icon: GitBranch,
    color: 'var(--status-error)',
    borderColor: 'var(--status-error)',
    descriptionKey: 'testSteps.conditionDesc',
    category: 'advanced' as ActionCategory,
    isAdvanced: true,
    fields: [
      {
        key: 'conditionType',
        labelKey: 'testSteps.conditionType',
        type: 'select' as const,
        required: true,
        options: [
          { value: 'exists', labelKey: 'testSteps.elementExists' },
          { value: 'visible', labelKey: 'testSteps.elementVisible' },
          { value: 'hidden', labelKey: 'testSteps.elementHidden' },
          { value: 'text', labelKey: 'testSteps.textEquals' },
          { value: 'textContains', labelKey: 'testSteps.textContains' },
          { value: 'value', labelKey: 'testSteps.valueEquals' },
          { value: 'valueContains', labelKey: 'testSteps.valueContains' },
          { value: 'count', labelKey: 'testSteps.elementCount' },
          { value: 'url', labelKey: 'testSteps.urlEquals' },
          { value: 'urlContains', labelKey: 'testSteps.urlContains' }
        ],
        descriptionKey: 'testSteps.conditionTypeDescription'
      },
      {
        key: 'selector',
        labelKey: 'testSteps.selector',
        type: 'text' as const,
        placeholderKey: 'testSteps.conditionSelectorPlaceholder',
        required: false,
        descriptionKey: 'testSteps.conditionSelectorDescription'
      },
      {
        key: 'expectedValue',
        labelKey: 'testSteps.expectedValue',
        type: 'text' as const,
        placeholderKey: 'testSteps.expectedValuePlaceholder',
        descriptionKey: 'testSteps.expectedValueDescription'
      },
      {
        key: 'operator',
        labelKey: 'testSteps.operator',
        type: 'select' as const,
        required: false,
        options: [
          { value: 'equals', labelKey: 'testSteps.equals' },
          { value: 'notEquals', labelKey: 'testSteps.notEquals' },
          { value: 'greaterThan', labelKey: 'testSteps.greaterThan' },
          { value: 'lessThan', labelKey: 'testSteps.lessThan' },
          { value: 'greaterOrEqual', labelKey: 'testSteps.greaterOrEqual' },
          { value: 'lessOrEqual', labelKey: 'testSteps.lessOrEqual' }
        ],
        descriptionKey: 'testSteps.operatorDescription'
      }
    ]
  }
];

// Extended actions for future use
const extendedActionsConfig: any[] = [
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
    type: 'scroll',
    titleKey: 'testSteps.scroll',
    icon: Scroll,
    color: 'var(--status-info)',
    borderColor: 'var(--status-info)',
    descriptionKey: 'testSteps.scrollDesc',
    category: 'interaction' as ActionCategory,
    fields: [
      {
        key: 'selector',
        labelKey: 'testSteps.selector',
        type: 'text' as const,
        placeholderKey: 'testSteps.scrollSelectorPlaceholder',
        descriptionKey: 'testSteps.scrollSelectorDescription'
      },
      {
        key: 'direction',
        labelKey: 'testSteps.direction',
        type: 'select' as const,
        required: true,
        options: [
          { value: 'top', labelKey: 'testSteps.up' },
          { value: 'bottom', labelKey: 'testSteps.down' },
          { value: 'left', labelKey: 'testSteps.left' },
          { value: 'right', labelKey: 'testSteps.right' }
        ],
        descriptionKey: 'testSteps.directionDescription'
      },
      {
        key: 'amount',
        labelKey: 'testSteps.amount',
        type: 'number' as const,
        placeholder: '500',
        min: 0,
        max: 5000,
        step: 50,
        descriptionKey: 'testSteps.amountDescription'
      }
    ]
  },
  {
    type: 'hover',
    titleKey: 'testSteps.hover',
    icon: MousePointer2,
    color: 'var(--status-warning)',
    borderColor: 'var(--status-warning)',
    descriptionKey: 'testSteps.hoverDesc',
    category: 'interaction' as ActionCategory,
    fields: [
      {
        key: 'selector',
        labelKey: 'testSteps.selector',
        type: 'text' as const,
        placeholderKey: 'testSteps.hoverSelectorPlaceholder',
        required: true,
        descriptionKey: 'testSteps.hoverSelectorDescription'
      }
    ]
  },
  {
    type: 'key',
    titleKey: 'testSteps.key',
    icon: Keyboard,
    color: 'var(--status-error)',
    borderColor: 'var(--status-error)',
    descriptionKey: 'testSteps.keyDesc',
    category: 'input' as ActionCategory,
    fields: [
      {
        key: 'key',
        labelKey: 'testSteps.keyLabel',
        type: 'text' as const,
        placeholderKey: 'testSteps.keyCapturePlaceholder',
        required: true,
        descriptionKey: 'testSteps.keyDescription'
      },
      {
        key: 'selector',
        labelKey: 'testSteps.selector',
        type: 'text' as const,
        placeholderKey: 'testSteps.keySelectorPlaceholder',
        descriptionKey: 'testSteps.keySelectorDescription'
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

  return [...baseActionsConfig, ...extendedActionsConfig].map(translateAction);
};

// Default actions (for backward compatibility) - these will have empty titles
export const availableActions: ActionType[] = [...baseActionsConfig, ...extendedActionsConfig].map(action => ({
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
export const getActionByType = (type: string): ActionType | undefined => {
  return availableActions.find(action => action.type === type);
};

// Translation-aware version of getActionByType
export const getTranslatedActionByType = (type: string, t: TranslationFunction): ActionType | undefined => {
  const action = [...baseActionsConfig, ...extendedActionsConfig].find(action => action.type === type);
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