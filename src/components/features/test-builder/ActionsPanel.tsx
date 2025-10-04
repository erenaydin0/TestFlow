import React from 'react';
import { availableActions, ActionType } from '@/lib/actions';

// Props interface
interface ActionsPanelProps {
  draggedAction: string | null;
  onActionDragStart: (actionType: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
}

const ActionsPanel: React.FC<ActionsPanelProps> = ({
  draggedAction,
  onActionDragStart,
  onDragEnd,
  onMouseDown
}) => {
  return (
    <div 
      style={{
        position: 'absolute',
        bottom: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: '0.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}
    >
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {availableActions.map((action) => {
          const Icon = action.icon;
          return (
            <div
              key={action.type}
              draggable
              onDragStart={(e) => {
                onActionDragStart(action.type);
                // Set drag effect
                e.dataTransfer.effectAllowed = 'copy';
                // Create a custom drag image
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.5rem',
                height: '2.5rem',
                backgroundColor: `${action.color}10`,
                border: `1px solid ${action.color}30`,
                borderRadius: '0.5rem',
                cursor: draggedAction === action.type ? 'grabbing' : 'grab',
                transition: 'all 0.2s ease',
                position: 'relative',
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
    </div>
  );
};

export default ActionsPanel; 