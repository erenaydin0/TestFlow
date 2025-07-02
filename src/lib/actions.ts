import {
  Navigation,
  MousePointer,
  Type,
  Clock,
  RefreshCw,
  GitBranch
} from 'lucide-react';

export interface ActionType {
  type: 'navigate' | 'click' | 'input' | 'wait' | 'refresh' | 'if';
  title: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  description: string;
}

export const availableActions: ActionType[] = [
  {
    type: 'navigate',
    title: 'Sayfa Git',
    icon: Navigation,
    color: '#2563eb',
    description: 'Belirtilen URL\'e git'
  },
  {
    type: 'click',
    title: 'Tıkla',
    icon: MousePointer,
    color: '#059669',
    description: 'Element\'e tıkla'
  },
  {
    type: 'input',
    title: 'Metin Gir',
    icon: Type,
    color: '#dc2626',
    description: 'Input alanına metin gir'
  },
  {
    type: 'wait',
    title: 'Bekle',
    icon: Clock,
    color: '#d97706',
    description: 'Belirtilen süre bekle'
  },
  {
    type: 'refresh',
    title: 'Yenile',
    icon: RefreshCw,
    color: '#7c3aed',
    description: 'Sayfayı yenile'
  },
  {
    type: 'if',
    title: 'Koşul',
    icon: GitBranch,
    color: '#db2777',
    description: 'Koşullu işlem'
  }
];

// Helper function to get action by type
export const getActionByType = (type: string): ActionType | undefined => {
  return availableActions.find(action => action.type === type);
};

// Helper function to get action color
export const getActionColor = (type: string): string => {
  return getActionByType(type)?.color || '#6b7280';
};

// Helper function to get action title
export const getActionTitle = (type: string): string => {
  return getActionByType(type)?.title || type;
}; 