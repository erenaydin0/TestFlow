'use client';

import React from 'react';
import { Chrome, Globe, Trash2, Copy, Download, Play, Edit, Settings } from 'lucide-react';

import { BrowserType, BrowserCellProps, TagsCellProps, StatusCellProps, TestNameCellProps, ActionsCellProps } from '@/types';
import { formatDuration, formatRelativeTime } from '@/lib/utils';
import { StatusBadge } from './';

// Browser Cell Component

const BrowserCell: React.FC<BrowserCellProps> = ({ browserType = 'chromium' }) => {
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

const TagsCell: React.FC<TagsCellProps> = ({ tags = [], maxVisible = 2 }) => {
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
            color: 'var(--text-secondary)',
            fontSize: '0.75rem'
          }}
        >
          <span style={{ color: 'var(--text-tertiary)', fontSize: '1rem' }}>#</span>
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

const StatusCell: React.FC<StatusCellProps> = ({ status, size = 'md' }) => {
  return <StatusBadge status={status} size={size} />;
};

// Date Cell Component
interface DateCellProps {
  date: Date | string;
  format?: 'relative' | 'absolute' | 'time';
}

const DateCell: React.FC<DateCellProps> = ({ date, format = 'relative' }) => {
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

const DurationCell: React.FC<DurationCellProps> = ({ duration }) => {
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

const TestNameCell: React.FC<TestNameCellProps> = ({ name, description, id }) => {
  const [showCopied, setShowCopied] = React.useState(false);

  const handleCopyId = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) {
      try {
        await navigator.clipboard.writeText(id);
        // Görsel feedback göster
        setShowCopied(true);
        setTimeout(() => {
          setShowCopied(false);
        }, 1500);
      } catch (err) {
        console.error('ID kopyalanamadı:', err);
      }
    }
  };

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
        <div style={{ position: 'relative' }}>
          <div 
            style={{ 
              fontSize: '0.7rem', 
              color: showCopied ? '#059669' : 'var(--text-tertiary)',
              fontFamily: 'monospace',
              marginTop: '0.25rem',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
              fontWeight: showCopied ? 600 : 400
            }}
            title={`${id}`}
            onClick={handleCopyId}
            onMouseEnter={(e) => {
              if (!showCopied) {
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!showCopied) {
                e.currentTarget.style.color = 'var(--text-tertiary)';
              }
            }}
          >
            {showCopied ? 'Kopyalandı! ✓' : `ID: ${id.slice(0, 50)}`}
          </div>
        </div>
      )}
    </div>
  );
};

// Actions Cell Component

const ActionsCell: React.FC<ActionsCellProps> = ({
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

const StepCountCell: React.FC<StepCountCellProps> = ({ count }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '2rem',
      height: '2rem',
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

const SuccessRateCell: React.FC<SuccessRateCellProps> = ({ rate }) => {
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

// Default exports
export default {
  BrowserCell,
  TagsCell,
  StatusCell,
  DateCell,
  DurationCell,
  TestNameCell,
  ActionsCell,
  StepCountCell,
  SuccessRateCell
};
