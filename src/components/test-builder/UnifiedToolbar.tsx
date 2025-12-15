'use client';

import React from 'react';
import {
  Play,
  Save,
  Download,
  Upload,
  Undo,
  Redo,
  Copy,
  Clipboard,
  Files,
  Camera,
  Video,
  Eye,
  EyeOff,
} from 'lucide-react';
import { BrowserType } from '@/types';
import BrowserSelector from './BrowserSelector';
import { IconButton, ButtonGroup } from '@/components';
import { useI18n } from '@/hooks';
import '../../assets/styles/TestBuilder.css';

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
  onExport: () => void;
  onImport: (file: File) => void;
  onSave: () => void;
  onRun: () => void;
  isRunning?: boolean;
  enableScreenshots?: boolean;
  enableRecording?: boolean;
  onToggleScreenshots?: () => void;
  onToggleRecording?: () => void;
  selectedBrowser?: BrowserType;
  onBrowserChange?: (browser: string) => void;
}

// Ana UnifiedToolbar komponenti
const UnifiedToolbar: React.FC<UnifiedToolbarProps> = ({
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
  onExport,
  onImport,
  onSave,
  onRun,
  isRunning = false,
  enableScreenshots = false,
  enableRecording = false,
  onToggleScreenshots,
  onToggleRecording,
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
    <div className="test-builder-toolbar flex gap-2 p-2 border border-[var(--border-primary)] rounded-lg shadow-lg">
      {/* Browser Selector */}
      {selectedBrowser && onBrowserChange && (
        <>
          <BrowserSelector
            selectedBrowser={selectedBrowser as BrowserType}
            onBrowserChange={(browser: BrowserType) => onBrowserChange?.(browser)}
            disabled={isRunning}
          />
          <div className="w-px h-8 bg-[var(--border-primary)] mx-1" />
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
          tooltip={t('testBuilder.saveWorkflow') || "Workflow'u Kaydet"}
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

      <div className="w-px h-8 bg-[var(--border-primary)] mx-1" />

      <ButtonGroup spacing="xs">
        <IconButton
          icon={Undo}
          variant="ghost"
          size="sm"
          tooltip={`${t('common.undo') || 'Geri Al'} - Ctrl+Z`}
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
          className={enableScreenshots ? "bg-[var(--status-warning)] text-white border-2 border-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.2)] animate-pulse" : ""}
        />
        <IconButton
          icon={Video}
          variant={enableRecording ? "danger" : "ghost"}
          size="sm"
          tooltip={enableRecording ? t('testBuilder.disableRecording') : t('testBuilder.enableRecording')}
          onClick={() => onToggleRecording?.()}
          className={enableRecording ? "bg-[var(--status-error)] text-white border-2 border-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.2)] animate-pulse" : ""}
        />
      </ButtonGroup>

      <div className="w-px h-8 bg-[var(--border-primary)] mx-1" />

      <ButtonGroup spacing="xs">
        <IconButton
          icon={Copy}
          variant="ghost"
          size="sm"
          tooltip={`${t('common.copy') || 'Kopyala'} (${selectedStepsCount}) - Ctrl+C`}
          disabled={selectedStepsCount === 0}
          onClick={onCopy}
        />
        <IconButton
          icon={Clipboard}
          variant="ghost"
          size="sm"
          tooltip={`${t('common.paste') || 'Yapıştır'} (${copiedStepsCount}) - Ctrl+V`}
          disabled={copiedStepsCount === 0}
          onClick={onPaste}
        />
        <IconButton
          icon={Files}
          variant="ghost"
          size="sm"
          tooltip={`${t('common.duplicate') || 'Çoğalt'} (${selectedStepsCount}) - Ctrl+D`}
          disabled={selectedStepsCount === 0}
          onClick={onDuplicate}
        />
      </ButtonGroup>
    </div>
  );
};

export default UnifiedToolbar;
