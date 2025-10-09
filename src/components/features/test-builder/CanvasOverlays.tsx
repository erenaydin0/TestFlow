'use client';

import React, { useState } from 'react';
import { TestStep } from '@/types';

// ============================================================================
// SelectionBox Component
// ============================================================================

interface SelectionBoxProps {
  selectionBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  opacity?: number;
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({
  selectionBox,
  fillColor = "rgba(59, 130, 246, 0.1)",
  strokeColor = "var(--color-selected)",
  strokeWidth = 1,
  strokeDasharray = "4,4",
  opacity = 0.8
}) => {
  if (!selectionBox) return null;

  return (
    <rect
      x={selectionBox.x}
      y={selectionBox.y}
      width={selectionBox.width}
      height={selectionBox.height}
      fill={fillColor}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      opacity={opacity}
    />
  );
};

// ============================================================================
// SnapLines Component
// ============================================================================

interface SnapLinesProps {
  snapEnabled: boolean;
  snapLines: {
    x: number[];
    y: number[];
  };
}

export const SnapLines: React.FC<SnapLinesProps> = ({
  snapEnabled,
  snapLines
}) => {
  if (!snapEnabled) return null;

  return (
    <g>
      {/* Vertical snap lines */}
      {snapLines.x.map((x, index) => (
        <line
          key={`snap-x-${index}`}
          x1={x}
          y1={0}
          x2={x}
          y2="100%"
          stroke="var(--status-info)"
          strokeWidth="1"
          strokeDasharray="4,4"
          opacity="0.6"
        />
      ))}
      
      {/* Horizontal snap lines */}
      {snapLines.y.map((y, index) => (
        <line
          key={`snap-y-${index}`}
          x1={0}
          y1={y}
          x2="100%"
          y2={y}
          stroke="var(--status-info)"
          strokeWidth="1"
          strokeDasharray="4,4"
          opacity="0.6"
        />
      ))}
    </g>
  );
};

// ============================================================================
// ConnectionRenderer Component
// ============================================================================

interface ConnectionRendererProps {
  testSteps: TestStep[];
  getStepCenter: (step: TestStep) => { x: number; y: number };
  getConnectionStyle: (type: 'normal' | 'true' | 'false') => { 
    color: string; 
    strokeWidth: number; 
    opacity: number; 
    label: string; 
  };
  removeConnection: (
    fromStepId: string, 
    toStepId: string, 
    type: 'normal' | 'true' | 'false', 
    testSteps: TestStep[], 
    setTestSteps: (steps: TestStep[]) => void, 
    saveToHistory: (steps: TestStep[]) => void
  ) => void;
  setTestSteps: (steps: TestStep[]) => void;
  saveToHistory: (steps: TestStep[]) => void;
}

interface ConnectionLineProps {
  fromStep: TestStep;
  toStepId: string;
  connectionType: 'normal' | 'true' | 'false';
  testSteps: TestStep[];
  getStepCenter: (step: TestStep) => { x: number; y: number };
  getConnectionStyle: (type: 'normal' | 'true' | 'false') => { 
    color: string; 
    strokeWidth: number; 
    opacity: number; 
    label: string; 
  };
  removeConnection: (
    fromStepId: string, 
    toStepId: string, 
    type: 'normal' | 'true' | 'false', 
    testSteps: TestStep[], 
    setTestSteps: (steps: TestStep[]) => void, 
    saveToHistory: (steps: TestStep[]) => void
  ) => void;
  setTestSteps: (steps: TestStep[]) => void;
  saveToHistory: (steps: TestStep[]) => void;
}

const ConnectionLine: React.FC<ConnectionLineProps> = ({
  fromStep,
  toStepId,
  connectionType,
  testSteps,
  getStepCenter,
  getConnectionStyle,
  removeConnection,
  setTestSteps,
  saveToHistory
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const toStep = testSteps.find(s => s.id === toStepId);
  if (!toStep) return null;

  const from = getStepCenter(fromStep);
  const to = getStepCenter(toStep);

  // Kavisli çizgi için kontrol noktalarını hesapla
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Kavisli yol oluştur
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  
  // Eğri için kontrol noktası offset'i
  const controlOffset = Math.min(50, distance * 0.3);
  const controlX = midX + (dy / distance) * controlOffset;
  const controlY = midY - (dx / distance) * controlOffset;

  const style = getConnectionStyle(connectionType);
  const pathId = `connection-${fromStep.id}-${toStepId}-${connectionType}`;

  const handleConnectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeConnection(fromStep.id, toStepId, connectionType, testSteps, setTestSteps, saveToHistory);
  };

  return (
    <g 
      style={{ pointerEvents: 'auto' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hover alanını genişletmek için görünmez kalın çizgi - bu çizgiye tıklayınca bağlantı kopar */}
      <path
        d={`M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`}
        fill="none"
        stroke="transparent"
        strokeWidth="25"
        strokeLinecap="round"
        style={{ cursor: 'pointer' }}
        onClick={handleConnectionClick}
      />
      
      {/* Görünür bağlantı yolu */}
      <path
        d={`M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`}
        fill="none"
        stroke={style.color}
        strokeWidth={isHovered ? style.strokeWidth + 1.5 : style.strokeWidth}
        opacity={isHovered ? Math.min(1, style.opacity + 0.3) : style.opacity}
        strokeLinecap="round"
        style={{ 
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          pointerEvents: 'none'
        }}
      />
      
      {/* True/False bağlantıları için etiket */}
      {style.label && (
        <g style={{ pointerEvents: 'none' }}>
          {/* Etiket arka planı */}
          <rect
            x={controlX - 18}
            y={controlY - 8}
            width="36"
            height="16"
            rx="8"
            fill="var(--bg-primary)"
            stroke={style.color}
            strokeWidth="1.5"
            opacity={isHovered ? 1 : 0.95}
            style={{ transition: 'all 0.2s ease' }}
          />
          {/* Etiket metni */}
          <text
            x={controlX}
            y={controlY + 1}
            fill={style.color}
            fontSize="9"
            fontWeight="600"
            textAnchor="middle"
            dominantBaseline="middle"
            opacity={isHovered ? 1 : 0.9}
            style={{ transition: 'all 0.2s ease' }}
          >
            {style.label}
          </text>
        </g>
      )}
      
      {/* Silme butonu - sadece görsel ipucu olarak hover'da görünür, tıklanamaz */}
      {isHovered && (
        <g style={{ pointerEvents: 'none' }}>
          <circle
            cx={controlX + (style.label ? 25 : 0)}
            cy={controlY}
            r="10"
            fill="var(--bg-primary)"
            stroke={style.color}
            strokeWidth="2"
            opacity="0.95"
            style={{ 
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))'
            }}
          />
          <text
            x={controlX + (style.label ? 25 : 0)}
            y={controlY + 1}
            fill={style.color}
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ 
              userSelect: 'none'
            }}
          >
            ×
          </text>
        </g>
      )}
    </g>
  );
};

export const ConnectionRenderer: React.FC<ConnectionRendererProps> = ({
  testSteps,
  getStepCenter,
  getConnectionStyle,
  removeConnection,
  setTestSteps,
  saveToHistory
}) => {
  const connections: React.JSX.Element[] = [];

  // Her test adımının bağlantılarını render et
  testSteps.forEach(step => {
    // Normal bağlantılar
    if (step.connections) {
      step.connections.forEach(toStepId => {
        connections.push(
          <ConnectionLine
            key={`${step.id}-${toStepId}-normal`}
            fromStep={step}
            toStepId={toStepId}
            connectionType="normal"
            testSteps={testSteps}
            getStepCenter={getStepCenter}
            getConnectionStyle={getConnectionStyle}
            removeConnection={removeConnection}
            setTestSteps={setTestSteps}
            saveToHistory={saveToHistory}
          />
        );
      });
    }

    // IF adımı için True bağlantısı
    if (step.type === 'if' && step.trueConnection) {
      connections.push(
        <ConnectionLine
          key={`${step.id}-${step.trueConnection}-true`}
          fromStep={step}
          toStepId={step.trueConnection}
          connectionType="true"
          testSteps={testSteps}
          getStepCenter={getStepCenter}
          getConnectionStyle={getConnectionStyle}
          removeConnection={removeConnection}
          setTestSteps={setTestSteps}
          saveToHistory={saveToHistory}
        />
      );
    }

    // IF adımı için False bağlantısı
    if (step.type === 'if' && step.falseConnection) {
      connections.push(
        <ConnectionLine
          key={`${step.id}-${step.falseConnection}-false`}
          fromStep={step}
          toStepId={step.falseConnection}
          connectionType="false"
          testSteps={testSteps}
          getStepCenter={getStepCenter}
          getConnectionStyle={getConnectionStyle}
          removeConnection={removeConnection}
          setTestSteps={setTestSteps}
          saveToHistory={saveToHistory}
        />
      );
    }
  });

  return <>{connections}</>;
};
