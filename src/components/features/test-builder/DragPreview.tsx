'use client';

import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { TestStep } from '@/types';
import { getTranslatedActionByType, ActionType } from '@/lib/actions';
import { useI18n } from '@/contexts';

interface DragPreviewProps {
  dragPreview: {
    x: number;
    y: number;
    type: string;
  };
  draggedStep: string | null;
  testSteps: TestStep[];
}

const DragPreview: React.FC<DragPreviewProps> = ({
  dragPreview,
  draggedStep,
  testSteps
}) => {
  const { t } = useI18n();
  // Get the step being dragged or the action being added
  const draggedStepData = draggedStep ? testSteps.find(s => s.id === draggedStep) : null;
  const action = draggedStepData 
    ? getTranslatedActionByType(draggedStepData.type, t)
    : getTranslatedActionByType(dragPreview.type, t);
  
  if (!action) return null;
  const Icon = action.icon;
  
  return (
    <div
      style={{
        position: 'absolute',
        left: dragPreview.x,
        top: dragPreview.y,
        width: '12rem',
        padding: '0.75rem',
        backgroundColor: 'var(--bg-primary)',
        border: `2px dashed ${action.color}`,
        borderRadius: '0.5rem',
        opacity: 0.7,
        pointerEvents: 'none',
        zIndex: 999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            padding: '0.25rem',
            backgroundColor: `${action.color}15`,
            borderRadius: '0.25rem'
          }}>
            <Icon size={14} color={action.color} />
          </div>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'var(--text-primary)'
          }}>
            {action.title}
          </span>
        </div>
      </div>
      
      <div style={{ 
        fontSize: '0.75rem', 
        color: 'var(--text-secondary)',
        minHeight: '2rem',
        wordBreak: 'break-all'
      }}>
        {/* Show step content if it's a dragged step, otherwise show preview message */}
        {draggedStepData ? (
          <>
            {/* Step description or configuration preview */}
            {draggedStepData.description ? (
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-primary)',
                fontStyle: 'italic',
                marginBottom: '0.25rem',
                lineHeight: '1.3'
              }}>
                "{draggedStepData.description}"
              </div>
            ) : (
              <>
                {/* Step configuration preview */}
                {draggedStepData.type === 'navigate' && (
                  <span>URL: {draggedStepData.url || 'Belirtilmedi'}</span>
                )}
                {draggedStepData.type === 'click' && (
                  <span>Element: {draggedStepData.selector || 'Belirtilmedi'}</span>
                )}
                {draggedStepData.type === 'input' && (
                  <span>
                    {draggedStepData.selector ? `${draggedStepData.selector}: ` : 'Input: '}
                    {draggedStepData.value || 'Belirtilmedi'}
                  </span>
                )}
                {draggedStepData.type === 'wait' && (
                  <span>Süre: {draggedStepData.duration || 1000}ms</span>
                )}
                {draggedStepData.type === 'refresh' && 'Sayfa yenileme'}
                {draggedStepData.type === 'if' && (
                  <span>Koşul: {draggedStepData.condition || 'Belirtilmedi'}</span>
                )}
              </>
            )}
            
            {/* Show both description and config if description exists */}
            {draggedStepData.description && (
              <div style={{
                fontSize: '0.65rem',
                color: 'var(--text-tertiary)',
                marginTop: '0.25rem'
              }}>
                {draggedStepData.type === 'navigate' && draggedStepData.url && `URL: ${draggedStepData.url}`}
                {draggedStepData.type === 'click' && draggedStepData.selector && `Element: ${draggedStepData.selector}`}
                {draggedStepData.type === 'input' && draggedStepData.value && `Input: ${draggedStepData.value}`}
                {draggedStepData.type === 'wait' && `Süre: ${draggedStepData.duration || 1000}ms`}
                {draggedStepData.type === 'refresh' && 'Sayfa yenileme'}
                {draggedStepData.type === 'if' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {draggedStepData.condition && `Koşul: ${draggedStepData.condition}`}
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.6rem' }}>
                      <span style={{ 
                        color: draggedStepData.trueConnection ? 'var(--status-success)' : 'var(--text-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <CheckCircle size={8} />
                        TRUE: {draggedStepData.trueConnection ? '✓' : 'Bağlı değil'}
                      </span>
                      <span style={{ 
                        color: draggedStepData.falseConnection ? 'var(--status-error)' : 'var(--text-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <XCircle size={8} />
                        FALSE: {draggedStepData.falseConnection ? '✓' : 'Bağlı değil'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontStyle: 'italic',
            height: '2rem'
          }}>
            Buraya bırakılacak
          </div>
        )}
      </div>
    </div>
  );
};

export default DragPreview; 