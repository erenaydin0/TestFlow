import {
  Navigation,
  MousePointer,
  Type,
  Clock,
  RefreshCw,
  GitBranch,
  Eye,
  FileText,
  Download,
  Upload,
  Camera,
  AlertCircle,
  CheckCircle,
  XCircle,
  Scroll,
  MousePointer2,
  Keyboard,
  Timer,
  Zap
} from 'lucide-react';

// Action category for better organization
export type ActionCategory = 'navigation' | 'interaction' | 'input' | 'validation' | 'utility' | 'advanced';

// Field configuration for dynamic form generation
export interface ActionField {
  key: string;
  label: string;
  type: 'text' | 'url' | 'number' | 'textarea' | 'select' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  description?: string;
}

// Enhanced action type with extensible configuration
export interface ActionType {
  type: string;
  title: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  description: string;
  category: ActionCategory;
  fields: ActionField[];
  isAdvanced?: boolean;
  version?: string;
}

// Base action configurations
const baseActions: ActionType[] = [
  {
    type: 'navigate',
    title: 'Sayfa Git',
    icon: Navigation,
    color: '#2563eb',
    description: 'Belirtilen URL\'e git',
    category: 'navigation',
    fields: [
      {
        key: 'url',
        label: 'URL',
        type: 'url',
        placeholder: 'https://example.com',
        required: true,
        description: 'Gidilecek web sayfasının adresi'
      }
    ]
  },
  {
    type: 'click',
    title: 'Tıkla',
    icon: MousePointer,
    color: '#059669',
    description: 'Element\'e tıkla',
    category: 'interaction',
    fields: [
      {
        key: 'selector',
        label: 'Seçici (Selector)',
        type: 'text',
        placeholder: '#button, .class, [data-testid=\'submit\']',
        required: true,
        description: 'Tıklanacak elementin CSS seçicisi'
      }
    ]
  },
  {
    type: 'input',
    title: 'Metin Gir',
    icon: Type,
    color: '#dc2626',
    description: 'Input alanına metin gir',
    category: 'input',
    fields: [
      {
        key: 'selector',
        label: 'Seçici (Selector)',
        type: 'text',
        placeholder: '#input, .form-field, [name=\'username\']',
        required: true,
        description: 'Metin girilecek input alanının CSS seçicisi'
      },
      {
        key: 'value',
        label: 'Değer',
        type: 'text',
        placeholder: 'Girilecek metin',
        required: true,
        description: 'Input alanına girilecek metin'
      }
    ]
  },
  {
    type: 'wait',
    title: 'Bekle',
    icon: Clock,
    color: '#d97706',
    description: 'Belirtilen süre bekle',
    category: 'utility',
    fields: [
      {
        key: 'duration',
        label: 'Bekleme Süresi (milisaniye)',
        type: 'number',
        placeholder: '1000',
        min: 100,
        max: 30000,
        step: 100,
        required: true,
        description: 'Beklenecek süre (milisaniye cinsinden)'
      }
    ]
  },
  {
    type: 'refresh',
    title: 'Yenile',
    icon: RefreshCw,
    color: '#7c3aed',
    description: 'Sayfayı yenile',
    category: 'navigation',
    fields: []
  },
  {
    type: 'if',
    title: 'Koşul',
    icon: GitBranch,
    color: '#db2777',
    description: 'Koşullu işlem',
    category: 'advanced',
    isAdvanced: true,
    fields: [
      {
        key: 'condition',
        label: 'Koşul',
        type: 'text',
        placeholder: '#element, .exists, [data-visible=\'true\']',
        required: true,
        description: 'Kontrol edilecek koşulun CSS seçicisi'
      }
    ]
  }
];

// Extended actions for future use
const extendedActions: ActionType[] = [
  {
    type: 'verify',
    title: 'Doğrula',
    icon: CheckCircle,
    color: '#16a34a',
    description: 'Elementin varlığını veya içeriğini doğrula',
    category: 'validation',
    fields: [
      {
        key: 'selector',
        label: 'Seçici (Selector)',
        type: 'text',
        placeholder: '#element, .class, [data-testid=\'result\']',
        required: true,
        description: 'Doğrulanacak elementin CSS seçicisi'
      },
      {
        key: 'expectedValue',
        label: 'Beklenen Değer',
        type: 'text',
        placeholder: 'Beklenen metin veya değer',
        description: 'Elementin sahip olması beklenen değer (boş bırakılırsa sadece varlık kontrol edilir)'
      }
    ]
  },
  {
    type: 'scroll',
    title: 'Kaydır',
    icon: Scroll,
    color: '#0891b2',
    description: 'Sayfayı veya elementi kaydır',
    category: 'interaction',
    fields: [
      {
        key: 'selector',
        label: 'Seçici (Selector)',
        type: 'text',
        placeholder: '#element, .container (boş bırakılırsa sayfa kaydırılır)',
        description: 'Kaydırılacak elementin CSS seçicisi'
      },
      {
        key: 'direction',
        label: 'Yön',
        type: 'select',
        required: true,
        options: [
          { value: 'top', label: 'Yukarı' },
          { value: 'bottom', label: 'Aşağı' },
          { value: 'left', label: 'Sol' },
          { value: 'right', label: 'Sağ' }
        ],
        description: 'Kaydırma yönü'
      },
      {
        key: 'amount',
        label: 'Miktar (piksel)',
        type: 'number',
        placeholder: '500',
        min: 0,
        max: 5000,
        step: 50,
        description: 'Kaydırılacak piksel miktarı (boş bırakılırsa tam kaydırma yapılır)'
      }
    ]
  },

  {
    type: 'hover',
    title: 'Üzerine Gel',
    icon: MousePointer2,
    color: '#ea580c',
    description: 'Elementin üzerine gel (hover)',
    category: 'interaction',
    fields: [
      {
        key: 'selector',
        label: 'Seçici (Selector)',
        type: 'text',
        placeholder: '#element, .hover-target',
        required: true,
        description: 'Üzerine gelinecek elementin CSS seçicisi'
      }
    ]
  },
  {
    type: 'key',
    title: 'Tuş Bas',
    icon: Keyboard,
    color: '#7c2d12',
    description: 'Klavye tuşuna bas',
    category: 'input',
    fields: [
      {
        key: 'key',
        label: 'Tuş',
        type: 'select',
        required: true,
        options: [
          { value: 'Enter', label: 'Enter' },
          { value: 'Tab', label: 'Tab' },
          { value: 'Escape', label: 'Escape' },
          { value: 'Space', label: 'Space' },
          { value: 'ArrowUp', label: 'Yukarı Ok' },
          { value: 'ArrowDown', label: 'Aşağı Ok' },
          { value: 'ArrowLeft', label: 'Sol Ok' },
          { value: 'ArrowRight', label: 'Sağ Ok' },
          { value: 'Backspace', label: 'Backspace' },
          { value: 'Delete', label: 'Delete' }
        ],
        description: 'Basılacak klavye tuşu'
      },
      {
        key: 'selector',
        label: 'Seçici (Selector)',
        type: 'text',
        placeholder: '#element, .input-field (boş bırakılırsa genel tuş basımı)',
        description: 'Tuş basımının yapılacağı elementin CSS seçicisi'
      }
    ]
  }
];

// Combine all actions
export const availableActions: ActionType[] = [...baseActions, ...extendedActions];

// Helper functions
export const getActionByType = (type: string): ActionType | undefined => {
  return availableActions.find(action => action.type === type);
};

export const getActionColor = (type: string): string => {
  return getActionByType(type)?.color || '#6b7280';
};

export const getActionTitle = (type: string): string => {
  return getActionByType(type)?.title || type;
};

export const getActionsByCategory = (category: ActionCategory): ActionType[] => {
  return availableActions.filter(action => action.category === category);
};

export const getBasicActions = (): ActionType[] => {
  return availableActions.filter(action => !action.isAdvanced);
};

export const getAdvancedActions = (): ActionType[] => {
  return availableActions.filter(action => action.isAdvanced);
};

// Action registry for dynamic extension
export class ActionRegistry {
  private static customActions: ActionType[] = [];

  static registerAction(action: ActionType): void {
    // Validate action
    if (!action.type || !action.title || !action.icon) {
      throw new Error('Action must have type, title, and icon');
    }

    // Check for duplicates
    if (this.customActions.some(a => a.type === action.type)) {
      throw new Error(`Action type '${action.type}' already exists`);
    }

    this.customActions.push(action);
  }

  static getCustomActions(): ActionType[] {
    return [...this.customActions];
  }

  static getAllActions(): ActionType[] {
    return [...availableActions, ...this.customActions];
  }

  static removeAction(type: string): boolean {
    const index = this.customActions.findIndex(a => a.type === type);
    if (index > -1) {
      this.customActions.splice(index, 1);
      return true;
    }
    return false;
  }
} 