'use client';

import React from 'react';
import { Trash2, Copy, Download, Play, Edit, Settings, Pause } from 'lucide-react';

import { BrowserCellProps, TagsCellProps, StatusCellProps, TestNameCellProps, ActionsCellProps } from '@/types';
import { formatDuration, formatRelativeTime } from '@/utils/utils';
import { StatusBadge, IconButton } from './';
import { useI18n } from '@/hooks';
import { getBrowserName } from '@/types/browser';

// Browser Cell Component

const BrowserCell: React.FC<BrowserCellProps> = ({ browserType = 'chromium' }) => {

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      justifyContent: 'center',
      fontSize: '0.875rem'
    }}>
      <span style={{ color: 'var(--text-primary)' }}>
        {getBrowserName(browserType)}
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
  const { locale } = useI18n();
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  let displayText = '';
  switch (format) {
    case 'relative':
      displayText = formatRelativeTime(dateObj, undefined, locale);
      break;
    case 'absolute':
      displayText = dateObj.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US');
      break;
    case 'time':
      displayText = dateObj.toLocaleTimeString(locale === 'tr' ? 'tr-TR' : 'en-US');
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
  const { t } = useI18n();
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
        {name.slice(0, 16)}
        {name.length > 16 && '...'}
      </div>
      {description && (
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.3
        }}>
          {description.slice(0, 16)}
          {description.length > 16 && '...'}
        </div>
      )}
      {id && (
        <div style={{ position: 'relative' }}>
          <div
            style={{
              fontSize: '0.7rem',
              color: showCopied ? 'var(--status-success)' : 'var(--text-tertiary)',
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
            {showCopied ? t('copyFeedback.copied') : `ID: ${id.slice(0, 16)}`}
            {id.length > 16 && '...'}
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
  const { t } = useI18n();
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
      label: t('actionTooltips.run'),
      onClick: onRun,
      color: 'var(--status-success)'
    });
  }
  if (onEdit) {
    defaultActions.push({
      icon: <Edit size={14} />,
      label: t('actionTooltips.edit'),
      onClick: onEdit,
      color: 'var(--text-secondary)'
    });
  }
  if (onSettings) {
    defaultActions.push({
      icon: <Settings size={14} />,
      label: t('actionTooltips.settings'),
      onClick: onSettings,
      color: 'var(--text-secondary)'
    });
  }
  if (onDuplicate) {
    defaultActions.push({
      icon: <Copy size={14} />,
      label: t('actionTooltips.duplicate'),
      onClick: onDuplicate,
      color: 'var(--text-secondary)'
    });
  }
  if (onExport) {
    defaultActions.push({
      icon: <Download size={14} />,
      label: t('actionTooltips.export'),
      onClick: onExport,
      color: 'var(--text-secondary)'
    });
  }
  if (onDownload) {
    defaultActions.push({
      icon: <Download size={14} />,
      label: t('actionTooltips.download'),
      onClick: onDownload,
      color: 'var(--text-secondary)'
    });
  }
  if (onDelete) {
    defaultActions.push({
      icon: <Trash2 size={14} />,
      label: t('actionTooltips.delete'),
      onClick: onDelete,
      color: 'var(--status-error)'
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
      margin: 'auto',
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
    if (rate >= 80) return 'var(--status-success)';
    if (rate >= 50) return 'var(--status-warning)';
    return 'var(--status-error)';
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

// Schedule Cell Component
interface ScheduleCellProps {
  schedule: string;
  description?: string;
}

const ScheduleCell: React.FC<ScheduleCellProps> = ({ schedule, description }) => {
  const { t } = useI18n();

  const getScheduleDescription = (cronExpression: string) => {
    // Basit cron ifadesi çevirisi
    const parts = cronExpression.split(' ');
    if (parts.length === 5) {
      const [minute, hour, day, month, dayOfWeek] = parts;

      if (minute === '0' && day === '*' && month === '*' && dayOfWeek === '*') {
        return `Her saat ${hour}:00'da`;
      }
      if (minute !== '0' && day === '*' && month === '*' && dayOfWeek === '*') {
        return `Her saat ${hour}:${minute.padStart(2, '0')}'da`;
      }
      if (minute === '0' && hour !== '0' && day === '*' && month === '*' && dayOfWeek === '*') {
        return `Her gün ${hour}:00'da`;
      }
      if (minute !== '0' && hour !== '0' && day === '*' && month === '*' && dayOfWeek === '*') {
        return `Her gün ${hour}:${minute.padStart(2, '0')}'da`;
      }
    }
    return cronExpression;
  };

  return (
    <div>
      {description && (
        <div style={{
          fontSize: '0.875rem',
          color: 'var(--text-primary)',
          fontWeight: 500
        }}>
          {description}
        </div>
      )}
    </div>
  );
};

// Next Run Cell Component
interface NextRunCellProps {
  nextRun?: string | Date;
}

const NextRunCell: React.FC<NextRunCellProps> = ({ nextRun }) => {
  if (!nextRun) {
    return (
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>-</span>
    );
  }

  const date = typeof nextRun === 'string' ? new Date(nextRun) : nextRun;
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let displayText = '';
  if (diffMs < 0) {
    displayText = 'Geçmiş';
  } else if (diffHours < 1) {
    displayText = `${diffMinutes} dakika sonra`;
  } else if (diffHours < 24) {
    displayText = `${diffHours} saat sonra`;
  } else {
    displayText = date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div>
      <div style={{
        fontSize: '0.875rem',
        color: 'var(--text-primary)',
        fontWeight: 500
      }}>
        {displayText}
      </div>
      <div style={{
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        marginTop: '0.25rem'
      }}>
        {date.toLocaleString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </div>
  );
};

// Scheduled Actions Cell Component
interface ScheduledActionsCellProps {
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  status: 'active' | 'inactive';
  disabled?: boolean;
}

const ScheduledActionsCell: React.FC<ScheduledActionsCellProps> = ({
  onToggle,
  onEdit,
  onDelete,
  status,
  disabled = false
}) => {
  const { t } = useI18n();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        disabled={disabled}
        title={status === 'active' ? t('scheduled.pause') : t('scheduled.resume')}
        style={{
          padding: '0.375rem',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: status === 'active' ? 'var(--status-warning)' : 'var(--status-success)',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {status === 'active' ? <Pause size={14} /> : <Play size={14} />}
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        disabled={disabled}
        title={t('common.edit')}
        style={{
          padding: '0.375rem',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: 'var(--text-secondary)',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Edit size={14} />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        disabled={disabled}
        title={t('common.delete')}
        style={{
          padding: '0.375rem',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: 'var(--status-error)',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Trash2 size={14} />
      </button>
    </div>
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
  SuccessRateCell,
  ScheduleCell,
  NextRunCell,
  ScheduledActionsCell
};
