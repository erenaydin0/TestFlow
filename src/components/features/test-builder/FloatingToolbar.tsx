'use client';

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
  EyeOff
} from 'lucide-react';
import { TestStep, BrowserType, FloatingToolbarProps } from '@/types';
import BrowserSelector from './BrowserSelector';
import { IconButton, ButtonGroup } from '@/components/ui';


export default function FloatingToolbar({
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
}: FloatingToolbarProps) {
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
    <div 
      style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        zIndex: 10,
        display: 'flex',
        gap: '0.5rem',
        padding: '0.5rem',
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}
    >
      {/* Browser Selector */}
      {selectedBrowser && onBrowserChange && (
        <>
          <BrowserSelector
            selectedBrowser={selectedBrowser as BrowserType}
            onBrowserChange={(browser: BrowserType) => onBrowserChange?.(browser)}
            disabled={isRunning}
          />
          
          <div style={{
            width: '1px',
            height: '2rem',
            backgroundColor: 'var(--border-primary)',
            margin: '0 0.25rem'
          }}></div>
        </>
      )}

      <ButtonGroup spacing="xs">
        <IconButton
          icon={Play}
          variant={testStepsCount > 0 ? "success" : "ghost"}
          size="sm"
          tooltip={isRunning ? "Test Çalışıyor..." : "Testi Çalıştır"}
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
          tooltip="Workflow'u Dışa Aktar (.json)"
          disabled={testStepsCount === 0}
          onClick={onExport}
        />
        <IconButton
          icon={Upload}
          variant="ghost"
          size="sm"
          tooltip="Workflow'u İçe Aktar (.json)"
          onClick={handleImportClick}
        />
      </ButtonGroup>
      
      <div style={{
        width: '1px',
        height: '2rem',
        backgroundColor: 'var(--border-primary)',
        margin: '0 0.25rem'
      }}></div>
      
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
          tooltip="İleri Al - Ctrl+Y"
          disabled={!canRedo}
          onClick={onRedo}
        />
      </ButtonGroup>
      
      <div style={{
        width: '1px',
        height: '2rem',
        backgroundColor: 'var(--border-primary)',
        margin: '0 0.25rem'
      }}></div>
      
      <button 
        onClick={onAutoArrange}
        title="Adımları Otomatik Hizala"
        disabled={testStepsCount === 0}
        style={{
          padding: '0.375rem',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: testStepsCount === 0 ? 'not-allowed' : 'pointer',
          color: 'var(--text-secondary)',
          opacity: testStepsCount === 0 ? 0.5 : 1,
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '2rem',
          height: '2rem'
        }}
        onMouseEnter={(e) => {
          if (testStepsCount > 0) {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 3px)',
          gridTemplateRows: 'repeat(3, 3px)',
          gap: '1px'
        }}>
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              style={{
                width: '3px',
                height: '3px',
                backgroundColor: 'currentColor',
                borderRadius: '0.5px'
              }}
            />
          ))}
        </div>
      </button>
      
      <ButtonGroup spacing="xs">
      <IconButton
        icon={Magnet}
        variant={snapEnabled ? "primary" : "ghost"}
        size="sm"
        tooltip={snapEnabled ? "Otomatik Sabitlemeyi Kapat" : "Otomatik Sabitlemeyi Aç"}
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
          tooltip={enableScreenshots ? "Ekran Görüntüsü Almayı Kapat" : "Ekran Görüntüsü Almayı Aç"}
          onClick={() => onToggleScreenshots?.()}
          style={enableScreenshots ? { 
            backgroundColor: '#f59e0b', 
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
          tooltip={enableRecording ? "Ekran Kaydını Kapat" : "Ekran Kaydını Aç"}
          onClick={() => onToggleRecording?.()}
          style={enableRecording ? { 
            backgroundColor: '#ef4444', 
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
          tooltip={headlessMode ? "Görünür Mod (Browser Açık)" : "Gizli Mod (Headless)"}
          onClick={() => onToggleHeadless?.()}
          style={headlessMode ? { 
            backgroundColor: '#22c55e', 
            color: 'white',
            border: '2px solid #22c55e',
            boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.2)',
            animation: 'pulse 2s infinite'
          } : {}}
        />
      </ButtonGroup>
      
      <div style={{
        width: '1px',
        height: '2rem',
        backgroundColor: 'var(--border-primary)',
        margin: '0 0.25rem'
      }}></div>
      
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
          title={`${connectionType === 'true' ? 'TRUE Dalı' :
                   connectionType === 'false' ? 'FALSE Dalı' :
                   'Bağlantı Modu'} - Test adımları arasındaki bağlantı türünü gösterir`}
        >
          {connectionType === 'true' ? <CheckCircle size={14} /> :
           connectionType === 'false' ? <XCircle size={14} /> :
           <GitBranch size={14} />}
          <span style={{ whiteSpace: 'nowrap' }}>
            {connectionType === 'true' ? 'TRUE Dalı' :
             connectionType === 'false' ? 'FALSE Dalı' :
             'Bağlantı Modu'}
          </span>
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
    </div>
  );
} 