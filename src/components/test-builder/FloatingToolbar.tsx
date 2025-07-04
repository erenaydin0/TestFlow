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
  GitBranch
} from 'lucide-react';
import { TestStep } from '@/types';

interface FloatingToolbarProps {
  // Auto-arrange
  onAutoArrange: () => void;
  testStepsCount: number;
  
  // Snap
  snapEnabled: boolean;
  onToggleSnap: () => void;
  
  // Undo/Redo
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Copy/Paste
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDeleteSelected: () => void;
  selectedStepsCount: number;
  copiedStepsCount: number;
  
  // Connection mode
  isConnecting: boolean;
  connectionType: 'normal' | 'true' | 'false';
  
  // Import/Export
  onExport: () => void;
  onImport: (file: File) => void;
  onSave?: () => void;
  onRun?: () => void;
  isRunning?: boolean;
}

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
  isRunning = false
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
      <button 
        onClick={onRun}
        className="canvas-control"
        title={isRunning ? "Test Çalışıyor..." : "Testi Çalıştır"}
        disabled={testStepsCount === 0 || isRunning}
        style={{
          opacity: testStepsCount === 0 || isRunning ? 0.5 : 1,
          cursor: testStepsCount === 0 || isRunning ? 'not-allowed' : 'pointer',
          color: testStepsCount > 0 ? '#059669' : 'var(--text-secondary)'
        }}
      >
        <Play size={16} />
        {isRunning && <span style={{ marginLeft: '0.25rem', fontSize: '0.75rem' }}>...</span>}
      </button>
      <button 
        onClick={onSave}
        className="canvas-control"
        title="Workflow'u Kaydet"
        disabled={testStepsCount === 0}
        style={{
          opacity: testStepsCount === 0 ? 0.5 : 1,
          cursor: testStepsCount === 0 ? 'not-allowed' : 'pointer'
        }}
      >
        <Save size={16} />
      </button>
      <button 
        onClick={onExport}
        className="canvas-control"
        title="Workflow'u Dışa Aktar (.json)"
        disabled={testStepsCount === 0}
        style={{
          opacity: testStepsCount === 0 ? 0.5 : 1,
          cursor: testStepsCount === 0 ? 'not-allowed' : 'pointer'
        }}
      >
        <Download size={16} />
      </button>
      <button 
        onClick={handleImportClick}
        className="canvas-control"
        title="Workflow'u İçe Aktar (.json)"
      >
        <Upload size={16} />
      </button>
      
      <div style={{
        width: '1px',
        height: '2rem',
        backgroundColor: 'var(--border-primary)',
        margin: '0 0.25rem'
      }}></div>
      
      <button 
        onClick={onUndo}
        className="canvas-control"
        title="Geri Al - Ctrl+Z"
        disabled={!canUndo}
        style={{
          opacity: !canUndo ? 0.5 : 1,
          cursor: !canUndo ? 'not-allowed' : 'pointer'
        }}
      >
        <Undo size={16} />
      </button>
      
      <button 
        onClick={onRedo}
        className="canvas-control"
        title="İleri Al - Ctrl+Y"
        disabled={!canRedo}
        style={{
          opacity: !canRedo ? 0.5 : 1,
          cursor: !canRedo ? 'not-allowed' : 'pointer'
        }}
      >
        <Redo size={16} />
      </button>
      
      <div style={{
        width: '1px',
        height: '2rem',
        backgroundColor: 'var(--border-primary)',
        margin: '0 0.25rem'
      }}></div>
      
      <button 
        onClick={onAutoArrange}
        className="canvas-control"
        title="Adımları Otomatik Hizala"
        disabled={testStepsCount === 0}
        style={{
          opacity: testStepsCount === 0 ? 0.5 : 1,
          cursor: testStepsCount === 0 ? 'not-allowed' : 'pointer'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
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
        </div>
      </button>
      
      <button 
        onClick={onToggleSnap}
        className="canvas-control"
        title={snapEnabled ? "Otomatik Sabitlemeyi Kapat" : "Otomatik Sabitlemeyi Aç"}
        style={{
          backgroundColor: snapEnabled ? '#3b82f620' : 'transparent',
          color: snapEnabled ? '#3b82f6' : 'var(--text-secondary)'
        }}
      >
        <Magnet size={16} />
      </button>
      
      <div style={{
        width: '1px',
        height: '2rem',
        backgroundColor: 'var(--border-primary)',
        margin: '0 0.25rem'
      }}></div>
      
      <button 
        onClick={onCopy}
        className="canvas-control"
        title={`Kopyala (${selectedStepsCount} adım seçili) - Ctrl+C`}
        disabled={selectedStepsCount === 0}
        style={{
          opacity: selectedStepsCount === 0 ? 0.5 : 1,
          cursor: selectedStepsCount === 0 ? 'not-allowed' : 'pointer'
        }}
      >
        <Copy size={16} />
      </button>
      
      <button 
        onClick={onPaste}
        className="canvas-control"
        title={`Yapıştır (${copiedStepsCount} adım panoda) - Ctrl+V`}
        disabled={copiedStepsCount === 0}
        style={{
          opacity: copiedStepsCount === 0 ? 0.5 : 1,
          cursor: copiedStepsCount === 0 ? 'not-allowed' : 'pointer'
        }}
      >
        <Clipboard size={16} />
      </button>
      
      <button 
        onClick={onDuplicate}
        className="canvas-control"
        title={`Çoğalt (${selectedStepsCount} adım seçili) - Ctrl+D`}
        disabled={selectedStepsCount === 0}
        style={{
          opacity: selectedStepsCount === 0 ? 0.5 : 1,
          cursor: selectedStepsCount === 0 ? 'not-allowed' : 'pointer'
        }}
      >
        <Files size={16} />
      </button>
      
      <button 
        onClick={onDeleteSelected}
        className="canvas-control"
        title={`Sil (${selectedStepsCount} adım seçili) - Delete`}
        disabled={selectedStepsCount === 0}
        style={{
          opacity: selectedStepsCount === 0 ? 0.5 : 1,
          cursor: selectedStepsCount === 0 ? 'not-allowed' : 'pointer',
          color: selectedStepsCount > 0 ? '#dc2626' : 'var(--text-secondary)'
        }}
      >
        <Trash2 size={16} />
      </button>
      
      {/* Connection mode indicator */}
      {isConnecting && (
        <div style={{
          padding: '0.5rem 0.75rem',
          backgroundColor: connectionType === 'true' ? '#22c55e' : 
                          connectionType === 'false' ? '#ef4444' : '#3b82f6',
          color: 'white',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {connectionType === 'true' ? <CheckCircle size={14} /> :
           connectionType === 'false' ? <XCircle size={14} /> :
           <GitBranch size={14} />}
          {connectionType === 'true' ? 'TRUE Dalı' :
           connectionType === 'false' ? 'FALSE Dalı' :
           'Bağlantı Modu'}
        </div>
      )}
    </div>
  );
} 