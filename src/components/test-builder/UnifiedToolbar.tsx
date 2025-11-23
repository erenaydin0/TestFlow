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
import { TestStep, BrowserType } from '@/types';
import { getTranslatedActions, ActionType } from '@/utils/actions';
import BrowserSelector from './BrowserSelector';
import { IconButton, ButtonGroup } from '@/components';
import { useI18n } from '@/contexts';

// Ortak toolbar props interface
interface UnifiedToolbarProps {
  // MainToolbar props
  testStepsCount: number;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  selectedStepsCount: number;
  copiedStepsCount: number;
  isConnecting: boolean;
  connectionType: 'normal' | 'true' | 'false';
  onExport: () => void;
  onImport: (file: File) => void;
  onSave: () => void;
  onRun: () => void;
  isRunning?: boolean;
  enableScreenshots?: boolean;
  enableRecording?: boolean;
  onToggleScreenshots?: () => void;
  onToggleRecording?: () => void;
  headlessMode?: boolean;
  onToggleHeadless?: () => void;
  selectedBrowser?: BrowserType;
  onBrowserChange?: (browser: string) => void;
}

// Ortak stil sabitleri
const TOOLBAR_STYLES = {
  container: {
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

// Ana toolbar komponenti
const MainToolbar: React.FC<UnifiedToolbarProps> = ({
  testStepsCount,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onCopy,
  onPaste,
  onDuplicate,
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

      <ButtonGroup spacing="xs">
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
  return (
    <div
      style={{
        ...TOOLBAR_STYLES.container,
        top: '1rem',
        left: '1rem',
        // Position relative to the main content area, but since it's absolute, 
        // we might need to adjust based on where it's rendered.
        // For now, let's keep it simple.
      }}
    >
      <MainToolbar {...props} />
    </div>
  );
};

export default UnifiedToolbar;
