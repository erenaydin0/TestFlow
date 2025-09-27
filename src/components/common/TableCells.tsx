'use client';

import React from 'react';
import { Chrome, Globe, Tag, Play, Edit, Trash2, Copy, Download, MoreVertical, Settings } from 'lucide-react';
import { BrowserType } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { formatDuration, formatRelativeTime } from '@/lib/utils';

// Browser Cell Component
interface BrowserCellProps {
  browserType?: BrowserType;
}

export const BrowserCell: React.FC<BrowserCellProps> = ({ browserType = 'chromium' }) => {
  const getBrowserIcon = () => {
    switch(browserType) {
      case 'chromium': return <Chrome size={16} style={{ color: '#4285F4' }} />;
      case 'firefox': return <Globe size={16} style={{ color: '#FF7139' }} />;
      case 'webkit': return <Globe size={16} style={{ color: '#007AFF' }} />;
      case 'msedge': return <Globe size={16} style={{ color: '#0078D4' }} />;
      default: return <Chrome size={16} style={{ color: '#4285F4' }} />;
    }
  };

  const getBrowserName = () => {
    switch(browserType) {
      case 'chromium': return 'Chrome';
      case 'firefox': return 'Firefox';
      case 'webkit': return 'Safari';
      case 'msedge': return 'Edge';
      default: return 'Chrome';
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      justifyContent: 'center',
      fontSize: '0.875rem'
    }}>
      {getBrowserIcon()}
      <span style={{ color: 'var(--text-primary)' }}>
        {getBrowserName()}
      </span>
    </div>
  );
};

// Tags Cell Component
interface TagsCellProps {
  tags?: string[];
  maxVisible?: number;
}

export const TagsCell: React.FC<TagsCellProps> = ({ tags = [], maxVisible = 2 }) => {
  if (tags.length === 0) {
    return (
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>-</span>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
      {tags.slice(0, maxVisible).map((tag, index) => (
        <span
          key={index}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.125rem 0.5rem',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            borderRadius: '0.375rem',
            border: '1px solid var(--border-primary)'
          }}
        >
          <Tag size={12} />
          {tag}
        </span>
      ))}
      {tags.length > maxVisible && (
        <span style={{ 
          fontSize: '0.75rem', 
          color: 'var(--text-tertiary)' 
        }}>
          +{tags.length - maxVisible}
        </span>
      )}
    </div>
  );
};

// Status Cell Component
interface StatusCellProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusCell: React.FC<StatusCellProps> = ({ status, size = 'md' }) => {
  return <StatusBadge status={status} size={size} />;
};

// Date Cell Component
interface DateCellProps {
  date: Date | string;
  format?: 'relative' | 'absolute' | 'time';
}

export const DateCell: React.FC<DateCellProps> = ({ date, format = 'relative' }) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  let displayText = '';
  switch (format) {
    case 'relative':
      displayText = formatRelativeTime(dateObj);
      break;
    case 'absolute':
      displayText = dateObj.toLocaleString('tr-TR');
      break;
    case 'time':
      displayText = dateObj.toLocaleTimeString('tr-TR');
      break;
  }

  return (
    <span style={{ 
      color: 'var(--text-secondary)', 
      fontSize: '0.875rem' 
    }}>
      {displayText}
    </span>
  );
};

// Duration Cell Component
interface DurationCellProps {
  duration?: number;
}

export const DurationCell: React.FC<DurationCellProps> = ({ duration }) => {
  if (!duration) {
    return (
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>-</span>
    );
  }

  return (
    <span style={{ 
      color: 'var(--text-secondary)', 
      fontSize: '0.875rem' 
    }}>
      {formatDuration(duration)}
    </span>
  );
};

// Test Name Cell Component
interface TestNameCellProps {
  name: string;
  description?: string;
  id?: string;
}

export const TestNameCell: React.FC<TestNameCellProps> = ({ name, description, id }) => {
  return (
    <div>
      <div style={{ 
        fontWeight: 500, 
        color: 'var(--text-primary)',
        fontSize: '0.875rem',
        marginBottom: description ? '0.25rem' : 0
      }}>
        {name}
      </div>
      {description && (
        <div style={{ 
          fontSize: '0.75rem', 
          color: 'var(--text-secondary)',
          lineHeight: 1.3
        }}>
          {description}
        </div>
      )}
      {id && (
        <div style={{ 
          fontSize: '0.7rem', 
          color: 'var(--text-tertiary)',
          fontFamily: 'monospace',
          marginTop: '0.25rem'
        }}>
          ID: {id.slice(0, 8)}...
        </div>
      )}
    </div>
  );
};

// Actions Cell Component
interface ActionsCellProps {
  onRun?: () => void;
  onEdit?: () => void;
  onSettings?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onExport?: () => void;
  onDownload?: () => void;
  disabled?: boolean;
  actions?: Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    color?: string;
    disabled?: boolean;
  }>;
}

export const ActionsCell: React.FC<ActionsCellProps> = ({
  onRun,
  onEdit,
  onSettings,
  onDelete,
  onDuplicate,
  onExport,
  onDownload,
  disabled = false,
  actions = []
}) => {
  const defaultActions: Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    color?: string;
    disabled?: boolean;
  }> = [];

  if (onRun) {
    defaultActions.push({
      icon: <Play size={14} />,
      label: 'Çalıştır',
      onClick: onRun,
      color: '#059669'
    });
  }
  if (onEdit) {
    defaultActions.push({
      icon: <Edit size={14} />,
      label: 'Düzenle',
      onClick: onEdit,
      color: 'var(--text-secondary)'
    });
  }
  if (onSettings) {
    defaultActions.push({
      icon: <Settings size={14} />,
      label: 'Ayarlar',
      onClick: onSettings,
      color: 'var(--text-secondary)'
    });
  }
  if (onDuplicate) {
    defaultActions.push({
      icon: <Copy size={14} />,
      label: 'Kopyala',
      onClick: onDuplicate,
      color: 'var(--text-secondary)'
    });
  }
  if (onExport) {
    defaultActions.push({
      icon: <Download size={14} />,
      label: 'Dışa Aktar',
      onClick: onExport,
      color: 'var(--text-secondary)'
    });
  }
  if (onDownload) {
    defaultActions.push({
      icon: <Download size={14} />,
      label: 'İndir',
      onClick: onDownload,
      color: 'var(--text-secondary)'
    });
  }
  if (onDelete) {
    defaultActions.push({
      icon: <Trash2 size={14} />,
      label: 'Sil',
      onClick: onDelete,
      color: '#dc2626'
    });
  }

  const allActions = [...defaultActions, ...actions];

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.5rem',
      justifyContent: 'flex-end'
    }}>
      {allActions.map((action, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
          }}
          disabled={disabled || action.disabled}
          title={action.label}
          style={{
            padding: '0.375rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: disabled || action.disabled ? 'not-allowed' : 'pointer',
            color: action.color || 'var(--text-secondary)',
            opacity: disabled || action.disabled ? 0.5 : 1,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            if (!disabled && !action.disabled) {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
};

// Step Count Cell Component
interface StepCountCellProps {
  count: number;
}

export const StepCountCell: React.FC<StepCountCellProps> = ({ count }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '2rem',
      height: '2rem',
      backgroundColor: 'var(--bg-tertiary)',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: 500,
      color: 'var(--text-primary)'
    }}>
      {count}
    </div>
  );
};

// Success Rate Cell Component
interface SuccessRateCellProps {
  rate?: number;
}

export const SuccessRateCell: React.FC<SuccessRateCellProps> = ({ rate }) => {
  if (rate === undefined) {
    return (
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>-</span>
    );
  }

  const getColor = () => {
    if (rate >= 80) return '#059669';
    if (rate >= 50) return '#f59e0b';
    return '#dc2626';
  };

  return (
    <span style={{
      fontSize: '0.875rem',
      fontWeight: 600,
      color: getColor()
    }}>
      {rate}%
    </span>
  );
};
