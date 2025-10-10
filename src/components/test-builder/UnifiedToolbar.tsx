'use client';

import React from 'react';
import { 
  Play,
  Save,
  Download,
  Upload,
  Undo,
  Redo,
  Magnet,
  Copy,
  Clipboard,
  Files,
  Trash2,
  CheckCircle,
  XCircle,
  GitBranch,
  Camera,
  Video,
  Eye,
  EyeOff,
  Layout
} from 'lucide-react';
import { TestStep, BrowserType, FloatingToolbarProps } from '@/types';
import { getTranslatedActions, ActionType } from '@/utils/actions';
import BrowserSelector from './BrowserSelector';
import { IconButton, ButtonGroup } from '@/components';
import { useI18n } from '@/contexts';

// Ortak toolbar props interface
interface UnifiedToolbarProps extends FloatingToolbarProps {
  // ActionsPanel props
  draggedAction?: string | null;
  onActionDragStart?: (actionType: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  showActionsPanel?: boolean;
}

// Ortak stil sabitleri
const TOOLBAR_STYLES = {
  container: {
    position: 'absolute' as const,
    zIndex: 10,
    display: 'flex',
    gap: '0.5rem',
    padding: '0.5rem',
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-primary)',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },
  separator: {
    width: '1px',
    height: '2rem',
    backgroundColor: 'var(--border-primary)',
    margin: '0 0.25rem'
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '0.5rem',
    cursor: 'grab',
    transition: 'all 0.2s ease',
    position: 'relative' as const
  }
};

// Actions Panel komponenti
const ActionsPanel: React.FC<{
  draggedAction: string | null;
  onActionDragStart: (actionType: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
}> = ({ draggedAction, onActionDragStart, onDragEnd, onMouseDown }) => {
  const { t } = useI18n();
  const actions = getTranslatedActions(t);

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <div
            key={action.type}
            draggable
            onDragStart={(e) => {
              onActionDragStart(action.type);
              e.dataTransfer.effectAllowed = 'copy';
              const dragImage = document.createElement('div');
              dragImage.style.width = '12rem';
              dragImage.style.height = '4rem';
              dragImage.style.backgroundColor = 'var(--bg-primary)';
              dragImage.style.border = `2px solid ${action.color}`;
              dragImage.style.borderRadius = '0.5rem';
              dragImage.style.display = 'flex';
              dragImage.style.alignItems = 'center';
              dragImage.style.justifyContent = 'center';
              dragImage.style.opacity = '0.8';
              dragImage.innerHTML = `<span style="color: ${action.color}">${action.title}</span>`;
              document.body.appendChild(dragImage);
              e.dataTransfer.setDragImage(dragImage, 96, 32);
              setTimeout(() => document.body.removeChild(dragImage), 0);
            }}
            onDragEnd={onDragEnd}
            onMouseDown={onMouseDown}
            style={{
              ...TOOLBAR_STYLES.actionButton,
              backgroundColor: `${action.color}10`,
              border: `1px solid ${action.color}30`,
              cursor: draggedAction === action.type ? 'grabbing' : 'grab',
              opacity: draggedAction === action.type ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${action.color}20`;
              e.currentTarget.style.borderColor = action.color;
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `${action.color}10`;
              e.currentTarget.style.borderColor = `${action.color}30`;
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title={action.title}
          >
            <Icon size={16} color={action.color} />
          </div>
        );
      })}
    </div>
  );
};

// Ana toolbar komponenti
const MainToolbar: React.FC<UnifiedToolbarProps> = ({
  onAutoArrange,
  testStepsCount,
  snapEnabled,
  onToggleSnap,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onCopy,
  onPaste,
  onDuplicate,
  onDeleteSelected,
  selectedStepsCount,
  copiedStepsCount,
  isConnecting,
  connectionType,
  onExport,
  onImport,
  onSave,
  onRun,
  isRunning = false,
  enableScreenshots = false,
  enableRecording = false,
  onToggleScreenshots,
  onToggleRecording,
  headlessMode = false,
  onToggleHeadless,
  selectedBrowser,
  onBrowserChange
}) => {
  const { t } = useI18n();
  
  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onImport(file);
      }
    };
    input.click();
  };

  return (
    <>
      {/* Browser Selector */}
      {selectedBrowser && onBrowserChange && (
        <>
          <BrowserSelector
            selectedBrowser={selectedBrowser as BrowserType}
            onBrowserChange={(browser: BrowserType) => onBrowserChange?.(browser)}
            disabled={isRunning}
          />
          <div style={TOOLBAR_STYLES.separator}></div>
        </>
      )}

      <ButtonGroup spacing="xs">
        <IconButton
          icon={Play}
          variant={testStepsCount > 0 ? "success" : "ghost"}
          size="sm"
          tooltip={isRunning ? t('testBuilder.testRunning') : t('testBuilder.runTest')}
          disabled={testStepsCount === 0 || isRunning}
          loading={isRunning}
          onClick={onRun}
        />
        <IconButton
          icon={Save}
          variant="ghost"
          size="sm"
          tooltip="Workflow'u Kaydet"
          disabled={testStepsCount === 0}
          onClick={onSave}
        />
        <IconButton
          icon={Download}
          variant="ghost"
          size="sm"
          tooltip={t('testBuilder.exportWorkflow')}
          disabled={testStepsCount === 0}
          onClick={onExport}
        />
        <IconButton
          icon={Upload}
          variant="ghost"
          size="sm"
          tooltip={t('testBuilder.importWorkflow')}
          onClick={handleImportClick}
        />
      </ButtonGroup>
      
      <div style={TOOLBAR_STYLES.separator}></div>
      
      <ButtonGroup spacing="xs">
        <IconButton
          icon={Undo}
          variant="ghost"
          size="sm"
          tooltip="Geri Al - Ctrl+Z"
          disabled={!canUndo}
          onClick={onUndo}
        />
        <IconButton
          icon={Redo}
          variant="ghost"
          size="sm"
          tooltip={t('testBuilder.redo')}
          disabled={!canRedo}
          onClick={onRedo}
        />
      </ButtonGroup>
      
      <div style={TOOLBAR_STYLES.separator}></div>
      
      <IconButton
        icon={Layout}
        onClick={onAutoArrange}
        disabled={testStepsCount === 0}
        variant="ghost"
        size="sm"
        tooltip={t('testBuilder.autoArrange')}
        style={{ color: 'var(--text-secondary)' }}
      />
      
      <ButtonGroup spacing="xs">
        <IconButton
          icon={Magnet}
          variant={snapEnabled ? "primary" : "ghost"}
          size="sm"
          tooltip={snapEnabled ? t('testBuilder.disableSnap') : t('testBuilder.enableSnap')}
          onClick={onToggleSnap}
          style={snapEnabled ? { 
            backgroundColor: 'var(--accent-primary)', 
            color: 'white',
            border: '2px solid var(--accent-primary)',
            boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)',
            animation: 'pulse 2s infinite'
          } : {}}
        />
        
        <IconButton
          icon={Camera}
          variant={enableScreenshots ? "warning" : "ghost"}
          size="sm"
          tooltip={enableScreenshots ? t('testBuilder.disableScreenshots') : t('testBuilder.enableScreenshots')}
          onClick={() => onToggleScreenshots?.()}
          style={enableScreenshots ? { 
            backgroundColor: 'var(--status-warning)', 
            color: 'white',
            border: '2px solid #f59e0b',
            boxShadow: '0 0 0 2px rgba(245, 158, 11, 0.2)',
            animation: 'pulse 2s infinite'
          } : {}}
        />
        <IconButton
          icon={Video}
          variant={enableRecording ? "danger" : "ghost"}
          size="sm"
          tooltip={enableRecording ? t('testBuilder.disableRecording') : t('testBuilder.enableRecording')}
          onClick={() => onToggleRecording?.()}
          style={enableRecording ? { 
            backgroundColor: 'var(--status-error)', 
            color: 'white',
            border: '2px solid #ef4444',
            boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.2)',
            animation: 'pulse 2s infinite'
          } : {}}
        />
        <IconButton
          icon={headlessMode ? EyeOff : Eye}
          variant={headlessMode ? "success" : "ghost"}
          size="sm"
          tooltip={headlessMode ? t('testBuilder.visibleMode') : t('testBuilder.headlessMode')}
          onClick={() => onToggleHeadless?.()}
          style={headlessMode ? { 
            backgroundColor: 'var(--status-success)', 
            color: 'white',
            border: '2px solid #22c55e',
            boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.2)',
            animation: 'pulse 2s infinite'
          } : {}}
        />
      </ButtonGroup>
      
      <div style={TOOLBAR_STYLES.separator}></div>
      
      <ButtonGroup spacing="xs">
        <IconButton
          icon={Copy}
          variant="ghost"
          size="sm"
          tooltip={`Kopyala (${selectedStepsCount} adım seçili) - Ctrl+C`}
          disabled={selectedStepsCount === 0}
          onClick={onCopy}
        />
        <IconButton
          icon={Clipboard}
          variant="ghost"
          size="sm"
          tooltip={`Yapıştır (${copiedStepsCount} adım panoda) - Ctrl+V`}
          disabled={copiedStepsCount === 0}
          onClick={onPaste}
        />
        <IconButton
          icon={Files}
          variant="ghost"
          size="sm"
          tooltip={`Çoğalt (${selectedStepsCount} adım seçili) - Ctrl+D`}
          disabled={selectedStepsCount === 0}
          onClick={onDuplicate}
        />
        <IconButton
          icon={Trash2}
          variant={selectedStepsCount > 0 ? "danger" : "ghost"}
          size="sm"
          tooltip={`Sil (${selectedStepsCount} adım seçili) - Delete`}
          disabled={selectedStepsCount === 0}
          onClick={onDeleteSelected}
        />
      </ButtonGroup>
      
      {/* Connection mode indicator */}
      {isConnecting && (
        <div 
          style={{
            padding: '0.5rem',
            backgroundColor: connectionType === 'true' ? '#22c55e' : 
                            connectionType === 'false' ? '#ef4444' : '#3b82f6',
            color: 'white',
            borderRadius: '0.5rem',
            fontSize: '0.7rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            position: 'relative',
            cursor: 'help',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
          title={`${connectionType === 'true' ? t('testBuilder.trueBranch') :
                   connectionType === 'false' ? t('testBuilder.falseBranch') :
                   t('testBuilder.connectionMode')} - ${t('testBuilder.connectionTypeDesc')}`}
        >
          {connectionType === 'true' ? <CheckCircle size={14} /> :
           connectionType === 'false' ? <XCircle size={14} /> :
           <GitBranch size={14} />}
          <span style={{ whiteSpace: 'nowrap' }}>
            {connectionType === 'true' ? t('testBuilder.trueBranch') :
             connectionType === 'false' ? t('testBuilder.falseBranch') :
             t('testBuilder.connectionMode')}
          </span>
        </div>
      )}
    </>
  );
};

// Ana UnifiedToolbar komponenti
const UnifiedToolbar: React.FC<UnifiedToolbarProps> = (props) => {
  const {
    draggedAction,
    onActionDragStart,
    onDragEnd,
    onMouseDown,
    showActionsPanel = false,
    ...mainToolbarProps
  } = props;

  return (
    <>
      {/* Ana Toolbar - Üst kısım */}
      <div 
        style={{
          ...TOOLBAR_STYLES.container,
          top: '1rem',
          left: '1rem'
        }}
      >
        <MainToolbar {...mainToolbarProps} />
      </div>

      {/* Actions Panel - Alt kısım */}
      {showActionsPanel && draggedAction !== undefined && onActionDragStart && onDragEnd && onMouseDown && (
        <div 
          style={{
            ...TOOLBAR_STYLES.container,
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
        >
          <ActionsPanel
            draggedAction={draggedAction}
            onActionDragStart={onActionDragStart}
            onDragEnd={onDragEnd}
            onMouseDown={onMouseDown}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
          }
        }
      `}</style>
    </>
  );
};

export default UnifiedToolbar;
