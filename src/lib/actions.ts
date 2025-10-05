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
  Zap,
  ChevronDown,
  Link
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
  borderColor: string;
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
    icon: Link,
    color: 'var(--status-info)',
    borderColor: 'var(--status-info)',
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
    color: 'var(--status-success)',
    borderColor: 'var(--status-success)',
    description: 'Element\'e tıkla',
    category: 'interaction',
    fields: [
      {
        key: 'selector',
        label: 'Seçici (Selector)',
        type: 'text',
        placeholder: '#button, .class, //button[text()=\'Submit\'], [data-testid=\'submit\']',
        required: true,
        description: 'CSS seçici, XPath veya ID kullanarak tıklanacak element'
      }
    ]
  },
  {
    type: 'input',
    title: 'Metin Gir',
    icon: Type,
    color: 'var(--status-error)',
    borderColor: 'var(--status-error)',
    description: 'Input alanına metin gir',
    category: 'input',
    fields: [
      {
        key: 'selector',
        label: 'Seçici (Selector)',
        type: 'text',
        placeholder: '#input, .form-field, //input[@name=\'username\'], [name=\'username\']',
        required: true,
        description: 'CSS seçici, XPath veya ID kullanarak metin girilecek input alanı'
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
    color: 'var(--status-warning)',
    borderColor: 'var(--status-warning)',
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
    color: 'var(--status-purple)',
    borderColor: 'var(--status-purple)',
    description: 'Sayfayı yenile',
    category: 'navigation',
    fields: []
  },
  {
    type: 'if',
    title: 'Koşul',
    icon: GitBranch,
    color: 'var(--status-error)',
    borderColor: 'var(--status-error)',
    description: 'Koşullu işlem',
    category: 'advanced',
    isAdvanced: true,
    fields: [
      {
        key: 'conditionType',
        label: 'Koşul Türü',
        type: 'select',
        required: true,
        options: [
          { value: 'exists', label: 'Element Var' },
          { value: 'visible', label: 'Element Görünür' },
          { value: 'hidden', label: 'Element Gizli' },
          { value: 'text', label: 'Metin Eşit' },
          { value: 'textContains', label: 'Metin İçerir' },
          { value: 'value', label: 'Değer Eşit' },
          { value: 'valueContains', label: 'Değer İçerir' },
          { value: 'count', label: 'Element Sayısı' },
          { value: 'url', label: 'URL Eşit' },
          { value: 'urlContains', label: 'URL İçerir' }
        ],
        description: 'Hangi tür koşul kontrolü yapılacağını seçin'
      },
      {
        key: 'selector',
        label: 'Seçici (Selector)',
        type: 'text',
        placeholder: '#element, .class, //div[@data-testid=\'result\'], [data-testid=\'result\']',
        required: false,
        description: 'CSS seçici, XPath veya ID (URL kontrolü için gerekli değil)'
      },
      {
        key: 'expectedValue',
        label: 'Beklenen Değer',
        type: 'text',
        placeholder: 'Karşılaştırılacak değer',
        description: 'Koşulun karşılaştırılacağı değer (metin, sayı veya URL)'
      },
      {
        key: 'operator',
        label: 'Karşılaştırma Operatörü',
        type: 'select',
        required: false,
        options: [
          { value: 'equals', label: 'Eşit (=)' },
          { value: 'notEquals', label: 'Eşit Değil (≠)' },
          { value: 'greaterThan', label: 'Büyüktür (>)' },
          { value: 'lessThan', label: 'Küçüktür (<)' },
          { value: 'greaterOrEqual', label: 'Büyük veya Eşit (≥)' },
          { value: 'lessOrEqual', label: 'Küçük veya Eşit (≤)' }
        ],
        description: 'Sayısal karşılaştırmalar için operatör (sadece count türü için)'
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
    color: 'var(--status-success)',
    borderColor: 'var(--status-success)',
    description: 'Elementin varlığını veya içeriğini doğrula',
    category: 'validation',
    fields: [
      {
        key: 'selector',
        label: 'Seçici (Selector)',
        type: 'text',
        placeholder: '#element, .class, //div[@data-testid=\'result\'], [data-testid=\'result\']',
        required: false,
        description: 'CSS seçici, XPath veya ID kullanarak doğrulanacak element (URL kontrolü için gerekli değil)'
      },
      {
        key: 'verificationType',
        label: 'Doğrulama Türü',
        type: 'select',
        required: true,
        options: [
          { value: 'text', label: 'Metin İçeriği' },
          { value: 'contains', label: 'Metin İçerir' },
          { value: 'url', label: 'URL Kontrolü' },
          { value: 'urlContains', label: 'URL İçerir' },
          { value: 'value', label: 'Input Değeri' },
          { value: 'visible', label: 'Görünür' },
          { value: 'hidden', label: 'Gizli' },
          { value: 'enabled', label: 'Etkin' },
          { value: 'disabled', label: 'Devre Dışı' }
        ],
        description: 'Hangi tür doğrulama yapılacağını seçin'
      },
      {
        key: 'expectedValue',
        label: 'Beklenen Değer',
        type: 'text',
        placeholder: 'Beklenen metin, değer veya URL',
        description: 'Elementin veya sayfanın sahip olması beklenen değer'
      }
    ]
  },
  {
    type: 'scroll',
    title: 'Kaydır',
    icon: Scroll,
    color: 'var(--status-info)',
    borderColor: 'var(--status-info)',
    description: 'Sayfayı veya elementi kaydır',
    category: 'interaction',
    fields: [
      {
        key: 'selector',
        label: 'Seçici (Selector)',
        type: 'text',
        placeholder: '#element, .container, //div[@class=\'scroll\'] (boş bırakılırsa sayfa kaydırılır)',
        description: 'CSS seçici, XPath veya ID kullanarak kaydırılacak element'
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
    color: 'var(--status-warning)',
    borderColor: 'var(--status-warning)',
    description: 'Elementin üzerine gel (hover)',
    category: 'interaction',
    fields: [
      {
        key: 'selector',
        label: 'Seçici (Selector)',
        type: 'text',
        placeholder: '#element, .hover-target, //button[@title=\'Hover me\']',
        required: true,
        description: 'CSS seçici, XPath veya ID kullanarak üzerine gelinecek element'
      }
    ]
  },
  {
    type: 'key',
    title: 'Tuş Bas',
    icon: Keyboard,
    color: 'var(--status-error)',
    borderColor: 'var(--status-error)',
    description: 'Klavye tuşuna bas',
    category: 'input',
    fields: [
      {
        key: 'key',
        label: 'Tuş',
        type: 'text',
        placeholder: 'Tuş yakalamak için alana tıklayın ve tuşa basın...',
        required: true,
        description: 'Basılacak klavye tuşu - input alanına tıklayıp istediğiniz tuşa basın'
      },
      {
        key: 'selector',
        label: 'Seçici (Selector)',
        type: 'text',
        placeholder: '#element, .input-field, //input[@type=\'text\'] (boş bırakılırsa genel tuş basımı)',
        description: 'CSS seçici, XPath veya ID kullanarak tuş basımının yapılacağı element'
      }
    ]
  },
  {
    type: 'dropdown',
    title: 'Dropdown Seç',
    icon: ChevronDown,
    color: 'var(--status-success)',
    borderColor: 'var(--status-success)',
    description: 'Dropdown menüden seçim yap',
    category: 'input',
    fields: [
      {
        key: 'selector',
        label: 'Seçici (Selector)',
        type: 'text',
        placeholder: '#select, .dropdown, //select[@name=\'country\'], [name=\'dropdown\']',
        required: true,
        description: 'CSS seçici, XPath veya ID kullanarak dropdown elementi'
      },
      {
        key: 'optionType',
        label: 'Seçim Türü',
        type: 'select',
        required: true,
        options: [
          { value: 'value', label: 'Değer (Value)' },
          { value: 'text', label: 'Görünen Metin' },
          { value: 'index', label: 'Sıra Numarası' }
        ],
        description: 'Hangi yöntemle seçim yapılacağını belirtin'
      },
      {
        key: 'optionValue',
        label: 'Seçilecek Değer',
        type: 'text',
        placeholder: 'Seçilecek değer, metin veya index numarası',
        required: true,
        description: 'Seçim türüne göre: value attribute, görünen metin veya 0-tabanlı index numarası'
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
  return getActionByType(type)?.color || 'var(--text-secondary)';
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