import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move
} from 'lucide-react';
import { useI18n } from '@/contexts';
import { IconButton } from '@/components/common';

// Props interface
interface CanvasControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  testStepsCount: number;
}

const CanvasControls: React.FC<CanvasControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
  testStepsCount
}) => {
  const { t } = useI18n();
  return (
    <div 
      style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem',
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}
    >
      <IconButton
        icon={ZoomIn}
        onClick={onZoomIn}
        variant="ghost"
        size="sm"
        tooltip={t('testBuilder.zoomIn')}
        className="canvas-control"
      />
      
      <span style={{ 
        padding: '0.25rem 0.5rem',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: '0.25rem',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        minWidth: '3rem',
        textAlign: 'center',
        fontWeight: 500
      }}>
        {Math.round(zoom * 100)}%
      </span>
      
      <IconButton
        icon={ZoomOut}
        onClick={onZoomOut}
        variant="ghost"
        size="sm"
        tooltip={t('testBuilder.zoomOut')}
        className="canvas-control"
      />
      
      <div style={{
        width: '1px',
        height: '1.5rem',
        backgroundColor: 'var(--border-primary)',
        margin: '0 0.25rem'
      }}></div>
      
      <IconButton
        icon={RotateCcw}
        onClick={onResetView}
        variant="ghost"
        size="sm"
        tooltip={t('testBuilder.reset')}
        className="canvas-control"
      />
      
      <span style={{
        fontSize: '0.75rem',
        color: 'var(--text-tertiary)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem'
      }}>
        {testStepsCount} Adım
      </span>
    </div>
  );
};

export default CanvasControls; 