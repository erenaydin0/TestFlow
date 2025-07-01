'use client';

import { useState, useRef, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { 
  MousePointer, 
  Type, 
  Navigation, 
  Clock, 
  RefreshCw, 
  GitBranch,
  Play,
  Save,
  Download,
  Upload,
  Trash2,
  Settings,
  Plus,
  GripVertical,
  TestTube,
  ZoomIn,
  ZoomOut,
  RotateCcw as Reset,
  Move,
  X
} from 'lucide-react';
import { TestStep } from '@/types';

// Available actions
const availableActions = [
  {
    type: 'navigate',
    title: 'Sayfa Git',
    icon: Navigation,
    color: '#2563eb',
    description: 'Belirtilen URL\'e git'
  },
  {
    type: 'click',
    title: 'Tıkla',
    icon: MousePointer,
    color: '#059669',
    description: 'Element\'e tıkla'
  },
  {
    type: 'input',
    title: 'Metin Gir',
    icon: Type,
    color: '#dc2626',
    description: 'Input alanına metin gir'
  },
  {
    type: 'wait',
    title: 'Bekle',
    icon: Clock,
    color: '#d97706',
    description: 'Belirtilen süre bekle'
  },
  {
    type: 'refresh',
    title: 'Yenile',
    icon: RefreshCw,
    color: '#7c3aed',
    description: 'Sayfayı yenile'
  },
  {
    type: 'if',
    title: 'Koşul',
    icon: GitBranch,
    color: '#db2777',
    description: 'Koşullu işlem'
  }
];

export default function TestBuilder() {
  const [testSteps, setTestSteps] = useState<TestStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<TestStep | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedAction, setDraggedAction] = useState<string | null>(null);
  const [draggedStep, setDraggedStep] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragPreview, setDragPreview] = useState<{x: number, y: number, type: string} | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Handle drag start for actions
  const handleActionDragStart = (actionType: string) => {
    setDraggedAction(actionType);
    setDraggedStep(null); // Clear any existing step drag
  };

  // Handle drag start for existing steps
  const handleStepDragStart = (stepId: string) => {
    setDraggedStep(stepId);
    setDraggedAction(null); // Clear any existing action drag
  };

  // Handle drop on canvas
  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    // Calculate position considering canvas offset and zoom
    const x = (e.clientX - rect.left - canvasOffset.x) / zoom;
    const y = (e.clientY - rect.top - canvasOffset.y) / zoom;

    if (draggedAction) {
      // Create new step
      const action = availableActions.find(a => a.type === draggedAction);
      if (action) {
        const newStep: TestStep = {
          id: generateId(),
          type: action.type as any,
          x: Math.max(0, x - 96), // Center the step (12rem = 192px, so 96px offset)
          y: Math.max(0, y - 40)  // Center vertically
        };
        setTestSteps(prev => [...prev, newStep]);
      }
    } else if (draggedStep) {
      // Move existing step
      setTestSteps(prev => prev.map(step => 
        step.id === draggedStep 
          ? { 
              ...step, 
              x: Math.max(0, x - 96), // Center the step
              y: Math.max(0, y - 40)  // Center vertically
            }
          : step
      ));
    }
    
    // Always clear drag states after drop
    setDraggedAction(null);
    setDraggedStep(null);
    setIsDragOver(false);
    setDragPreview(null);
  }, [draggedAction, draggedStep, canvasOffset, zoom]);

  // Handle canvas drag over
  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    // Allow drop
    e.dataTransfer.dropEffect = draggedAction ? 'copy' : 'move';
    setIsDragOver(true);
    
    // Update preview position
    if (canvasRef.current && (draggedAction || draggedStep)) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - canvasOffset.x) / zoom;
      const y = (e.clientY - rect.top - canvasOffset.y) / zoom;
      
      const previewX = Math.max(0, x - 96);
      const previewY = Math.max(0, y - 40);
      
      if (draggedAction) {
        setDragPreview({ x: previewX, y: previewY, type: draggedAction });
      } else if (draggedStep) {
        setDragPreview({ x: previewX, y: previewY, type: 'step' });
      }
    }
  };

  // Handle drag enter
  const handleCanvasDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    
    // Initialize preview on drag enter
    if (canvasRef.current && (draggedAction || draggedStep)) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - canvasOffset.x) / zoom;
      const y = (e.clientY - rect.top - canvasOffset.y) / zoom;
      
      const previewX = Math.max(0, x - 96);
      const previewY = Math.max(0, y - 40);
      
      if (draggedAction) {
        setDragPreview({ x: previewX, y: previewY, type: draggedAction });
      } else if (draggedStep) {
        setDragPreview({ x: previewX, y: previewY, type: 'step' });
      }
    }
  };

  // Handle drag leave
  const handleCanvasDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only set to false if we're leaving the canvas completely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setDragPreview(null);
    }
  };

  // Handle drag end (cleanup if drag is cancelled)
  const handleDragEnd = (e: React.DragEvent) => {
    // Clean up drag states if drag was cancelled
    setTimeout(() => {
      setDraggedAction(null);
      setDraggedStep(null);
      setDragPreview(null);
      setIsDragOver(false);
    }, 100);
  };

  // Delete step
  const deleteStep = (stepId: string) => {
    setTestSteps(prev => prev.filter(step => step.id !== stepId));
    if (selectedStep && selectedStep.id === stepId) {
      setSelectedStep(null);
    }
  };

  // Canvas pan and click handling
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Check if we're clicking on a step element
    const target = e.target as HTMLElement;
    const isClickingOnStep = target.closest('[data-step-id]');
    
    // If clicking on canvas background (not on a step), deselect and cancel connections
    if (e.target === e.currentTarget) {
      setSelectedStep(null);
      if (isConnecting) {
        setIsConnecting(false);
        setConnectionStart(null);
      }
    }
    
    // Don't start panning if we're clicking on a step or there's an active drag
    if (isClickingOnStep || draggedStep || draggedAction) {
      return;
    }
    
    if (e.button !== 0) return; // Only left click for panning
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startOffsetX = canvasOffset.x;
    const startOffsetY = canvasOffset.y;
    let hasMoved = false;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      // If mouse moved more than a few pixels, it's a drag
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        hasMoved = true;
      }
      
      setCanvasOffset({
        x: startOffsetX + deltaX,
        y: startOffsetY + deltaY
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Clean up event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleStepClick = (step: TestStep) => {
    setSelectedStep(step);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStep(null);
  };

  const updateStepProperty = (stepId: string, property: string, value: any) => {
    const updatedSteps = testSteps.map(step => 
      step.id === stepId 
        ? { ...step, [property]: value }
        : step
    );
    setTestSteps(updatedSteps);
    
    if (selectedStep && selectedStep.id === stepId) {
      setSelectedStep({ ...selectedStep, [property]: value });
    }
  };

  // Connection handling
  const startConnection = (stepId: string) => {
    setIsConnecting(true);
    setConnectionStart(stepId);
  };

  const endConnection = (stepId: string) => {
    if (connectionStart && connectionStart !== stepId) {
      // Add connection
      setTestSteps(prev => prev.map(step => 
        step.id === connectionStart 
          ? { 
              ...step, 
              connections: step.connections 
                ? [...step.connections.filter(id => id !== stepId), stepId]
                : [stepId]
            }
          : step
      ));
    }
    setIsConnecting(false);
    setConnectionStart(null);
  };

  const removeConnection = (fromStepId: string, toStepId: string) => {
    setTestSteps(prev => prev.map(step => 
      step.id === fromStepId 
        ? { 
            ...step, 
            connections: step.connections?.filter(id => id !== toStepId) || []
          }
        : step
    ));
  };

  // Get step center coordinates
  const getStepCenter = (step: TestStep) => {
    return {
      x: step.x + 96, // 12rem / 2 = 96px
      y: step.y + 40  // Approximate center height
    };
  };

  // Auto-arrange steps
  const autoArrangeSteps = () => {
    if (testSteps.length === 0) return;

    // Find steps with no incoming connections (start nodes)
    const startSteps = testSteps.filter(step => 
      !testSteps.some(otherStep => 
        otherStep.connections?.includes(step.id)
      )
    );

    // If no start steps found, use the first step
    if (startSteps.length === 0) {
      startSteps.push(testSteps[0]);
    }

    const arranged: Set<string> = new Set();
    const newPositions: { [key: string]: { x: number, y: number } } = {};
    const STEP_WIDTH = 250; // 12rem + margin
    const START_Y = 100; // Fixed Y position for horizontal line
    let currentColumn = 0;

    // Recursive function to arrange connected steps horizontally
    const arrangeFromStep = (stepId: string, column: number): number => {
      if (arranged.has(stepId)) return column;

      arranged.add(stepId);
      newPositions[stepId] = {
        x: column * STEP_WIDTH + 50, // 50px margin from left
        y: START_Y // Fixed Y position - horizontal line
      };

      const step = testSteps.find(s => s.id === stepId);
      if (!step?.connections || step.connections.length === 0) {
        return column + 1;
      }

      let nextColumn = column + 1;
      step.connections.forEach(connectedId => {
        if (!arranged.has(connectedId)) {
          nextColumn = arrangeFromStep(connectedId, nextColumn);
        }
      });

      return nextColumn;
    };

    // Arrange the first start step horizontally
    if (startSteps.length > 0) {
      currentColumn = arrangeFromStep(startSteps[0].id, 0);
    }

    // Arrange any remaining unconnected steps in a horizontal line
    testSteps.forEach(step => {
      if (!arranged.has(step.id)) {
        newPositions[step.id] = {
          x: currentColumn * STEP_WIDTH + 50,
          y: START_Y
        };
        currentColumn++;
      }
    });

    // Update step positions
    setTestSteps(prev => prev.map(step => ({
      ...step,
      x: newPositions[step.id]?.x ?? step.x,
      y: newPositions[step.id]?.y ?? step.y
    })));

    // Reset canvas position to show arranged steps
    setCanvasOffset({ x: 0, y: 0 });
    setZoom(1);
  };

  // Render connection lines
  const renderConnections = () => {
    const connections: React.ReactElement[] = [];
    
    testSteps.forEach(fromStep => {
      if (fromStep.connections) {
        fromStep.connections.forEach(toStepId => {
          const toStep = testSteps.find(s => s.id === toStepId);
          if (toStep) {
            const fromCenter = getStepCenter(fromStep);
            const toCenter = getStepCenter(toStep);
            
            // Calculate arrow path
            const dx = toCenter.x - fromCenter.x;
            const dy = toCenter.y - fromCenter.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Adjust start and end points to step edges
            const stepRadius = 60; // Approximate step radius
            const adjustedStart = {
              x: fromCenter.x + (dx / distance) * stepRadius,
              y: fromCenter.y + (dy / distance) * stepRadius
            };
            const adjustedEnd = {
              x: toCenter.x - (dx / distance) * stepRadius,
              y: toCenter.y - (dy / distance) * stepRadius
            };
            
            connections.push(
              <g key={`${fromStep.id}-${toStep.id}`}>
                {/* Connection line */}
                <line
                  x1={adjustedStart.x}
                  y1={adjustedStart.y}
                  x2={adjustedEnd.x}
                  y2={adjustedEnd.y}
                  stroke="var(--border-primary)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.7"
                />
                {/* Arrow head */}
                <polygon
                  points={`${adjustedEnd.x},${adjustedEnd.y} ${adjustedEnd.x - 8 - (dx/distance)*8},${adjustedEnd.y - 4 - (dy/distance)*4} ${adjustedEnd.x - 8 - (dx/distance)*8},${adjustedEnd.y + 4 - (dy/distance)*4}`}
                  fill="var(--border-primary)"
                  opacity="0.7"
                />
              </g>
            );
          }
        });
      }
    });
    
    return connections;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      <Sidebar />
      
      <div style={{ flex: 1, marginLeft: '16rem', paddingTop: '4rem' }}>
        <Header />
        
        <div style={{ 
          height: 'calc(100vh - 4rem)',
          backgroundColor: 'var(--bg-secondary)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Canvas Controls */}
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
            }}>
            <button 
              onClick={() => setZoom(Math.min(zoom + 0.1, 2))}
              className="canvas-control"
              title="Yakınlaştır"
            >
              <ZoomIn size={16} />
            </button>
            
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
            
            <button 
              onClick={() => setZoom(Math.max(zoom - 0.1, 0.3))}
              className="canvas-control"
              title="Uzaklaştır"
            >
              <ZoomOut size={16} />
            </button>
            
            <div style={{
              width: '1px',
              height: '1.5rem',
              backgroundColor: 'var(--border-primary)',
              margin: '0 0.25rem'
            }}></div>
            
            <button 
              onClick={() => {
                setZoom(1);
                setCanvasOffset({ x: 0, y: 0 });
              }}
              className="canvas-control"
              title="Sıfırla"
            >
              <Reset size={16} />
            </button>
            
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--text-tertiary)',
              marginLeft: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <Move size={12} />
              {testSteps.length} Adım
            </span>
          </div>

          {/* Floating Toolbar */}
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
          }}>
            <button 
              className="canvas-control"
              title="Çalıştır"
            >
              <Play size={16} />
            </button>
            <button 
              className="canvas-control"
              title="Kaydet"
            >
              <Save size={16} />
            </button>
            <button 
              className="canvas-control"
              title="İndir"
            >
              <Download size={16} />
            </button>
            <button 
              className="canvas-control"
              title="Yükle"
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
              onClick={autoArrangeSteps}
              className="canvas-control"
              title="Adımları Otomatik Hizala"
              disabled={testSteps.length === 0}
              style={{
                opacity: testSteps.length === 0 ? 0.5 : 1,
                cursor: testSteps.length === 0 ? 'not-allowed' : 'pointer'
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
            
            {/* Connection mode indicator */}
            {isConnecting && (
              <div style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <GitBranch size={14} />
                Bağlantı Modu
              </div>
            )}
          </div>

          {/* Floating Actions Panel */}
          <div 
            style={{
              position: 'absolute',
              bottom: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {availableActions.map((action) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.type}
                    draggable
                    onDragStart={(e) => {
                      handleActionDragStart(action.type);
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
                    onDragEnd={handleDragEnd}
                    onMouseDown={(e) => {
                      // Prevent canvas panning when dragging actions
                      e.stopPropagation();
                    }}
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

          {/* Canvas */}
          <div
            ref={canvasRef}
            className="canvas-background"
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            onDragEnter={handleCanvasDragEnter}
            onDragLeave={handleCanvasDragLeave}
            onDragEnd={handleDragEnd}
            onMouseDown={handleCanvasMouseDown}
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              cursor: isPanning ? 'grabbing' : 'grab',
              backgroundImage: `
                radial-gradient(circle, var(--border-primary) 1px, transparent 1px)
              `,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`,
              transform: `scale(${zoom})`,
              transformOrigin: 'center center'
            }}
          >
            <div style={{
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: '100%',
              height: '100%',
              position: 'relative'
            }}>
              {/* SVG Layer for connections */}
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 1
                }}
              >
                {renderConnections()}
              </svg>
              {/* Render drag preview */}
              {dragPreview && (() => {
                // Get the step being dragged or the action being added
                const draggedStepData = draggedStep ? testSteps.find(s => s.id === draggedStep) : null;
                const action = draggedStepData 
                  ? availableActions.find(a => a.type === draggedStepData.type)
                  : availableActions.find(a => a.type === dragPreview.type);
                
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
                              {draggedStepData.type === 'if' && draggedStepData.condition && `Koşul: ${draggedStepData.condition}`}
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
              })()}

              {/* Render test steps */}
              {testSteps.map((step) => {
                const action = availableActions.find(a => a.type === step.type);
                if (!action) return null;
                
                const Icon = action.icon;
                const isSelected = selectedStep === step;
                
                return (
                                                                              <div
                      key={step.id}
                      data-step-id={step.id}
                      draggable
                      onDragStart={(e) => {
                        handleStepDragStart(step.id);
                        // Make drag image more visible
                        const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
                        dragImage.style.transform = 'scale(1.1)';
                        dragImage.style.opacity = '0.8';
                        e.dataTransfer.setDragImage(dragImage, 96, 40);
                      }}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStepClick(step);
                      }}
                      onMouseDown={(e) => {
                        // Prevent canvas panning when dragging steps
                        e.stopPropagation();
                      }}
                      style={{
                        position: 'absolute',
                        left: step.x,
                        top: step.y,
                        width: '12rem',
                        padding: '0.75rem',
                        backgroundColor: 'var(--bg-primary)',
                        border: `2px solid ${isSelected ? action.color : 'var(--border-primary)'}`,
                        borderRadius: '0.5rem',
                        cursor: draggedStep === step.id ? 'grabbing' : 'grab',
                        boxShadow: isSelected 
                          ? `0 4px 12px ${action.color}30` 
                          : '0 2px 8px rgba(0,0,0,0.1)',
                        transition: draggedStep === step.id ? 'none' : 'all 0.2s ease',
                        opacity: draggedStep === step.id ? 0.5 : 1,
                        zIndex: draggedStep === step.id ? 1000 : 5
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
                          {availableActions.find(a => a.type === step.type)?.title || step.type}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {/* Connection button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isConnecting && connectionStart === step.id) {
                              // Cancel connection
                              setIsConnecting(false);
                              setConnectionStart(null);
                            } else if (isConnecting && connectionStart !== step.id) {
                              // End connection
                              endConnection(step.id);
                            } else {
                              // Start connection
                              startConnection(step.id);
                            }
                          }}
                          style={{
                            padding: '0.25rem',
                            backgroundColor: isConnecting && connectionStart === step.id 
                              ? '#3b82f6' 
                              : 'transparent',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            color: isConnecting && connectionStart === step.id 
                              ? 'white' 
                              : 'var(--text-tertiary)',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!(isConnecting && connectionStart === step.id)) {
                              e.currentTarget.style.backgroundColor = '#dbeafe';
                              e.currentTarget.style.color = '#3b82f6';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!(isConnecting && connectionStart === step.id)) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = 'var(--text-tertiary)';
                            }
                          }}
                          title={isConnecting && connectionStart === step.id 
                            ? 'Bağlantıyı iptal et' 
                            : isConnecting 
                              ? 'Buraya bağla' 
                              : 'Bağlantı başlat'}
                        >
                          <GitBranch size={12} />
                        </button>
                        
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteStep(step.id);
                          }}
                          style={{
                            padding: '0.25rem',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            color: 'var(--text-tertiary)',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fee2e2';
                            e.currentTarget.style.color = '#dc2626';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--text-tertiary)';
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    
                                         <div style={{ 
                       fontSize: '0.75rem', 
                       color: 'var(--text-secondary)',
                       minHeight: '2rem',
                       wordBreak: 'break-all'
                     }}>
                       {/* Step description or configuration preview */}
                       {step.description ? (
                         <div style={{
                           fontSize: '0.75rem',
                           color: 'var(--text-primary)',
                           fontStyle: 'italic',
                           marginBottom: '0.25rem',
                           lineHeight: '1.3'
                         }}>
                           "{step.description}"
                         </div>
                       ) : (
                         <>
                           {/* Step configuration preview */}
                           {step.type === 'navigate' && (
                             <span>URL: {step.url || 'Belirtilmedi'}</span>
                           )}
                           {step.type === 'click' && (
                             <span>Element: {step.selector || 'Belirtilmedi'}</span>
                           )}
                           {step.type === 'input' && (
                             <span>
                               {step.selector ? `${step.selector}: ` : 'Input: '}
                               {step.value || 'Belirtilmedi'}
                             </span>
                           )}
                           {step.type === 'wait' && (
                             <span>Süre: {step.duration || 1000}ms</span>
                           )}
                           {step.type === 'refresh' && 'Sayfa yenileme'}
                           {step.type === 'if' && (
                             <span>Koşul: {step.condition || 'Belirtilmedi'}</span>
                           )}
                         </>
                       )}
                       
                       {/* Show both description and config if description exists */}
                       {step.description && (
                         <div style={{
                           fontSize: '0.65rem',
                           color: 'var(--text-tertiary)',
                           marginTop: '0.25rem'
                         }}>
                           {step.type === 'navigate' && step.url && `URL: ${step.url}`}
                           {step.type === 'click' && step.selector && `Element: ${step.selector}`}
                           {step.type === 'input' && step.value && `Input: ${step.value}`}
                           {step.type === 'wait' && `Süre: ${step.duration || 1000}ms`}
                           {step.type === 'refresh' && 'Sayfa yenileme'}
                           {step.type === 'if' && step.condition && `Koşul: ${step.condition}`}
                         </div>
                       )}
                     </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && selectedStep && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={closeModal}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: '1rem',
            padding: '1.5rem',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--border-primary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {(() => {
                  const action = availableActions.find(a => a.type === selectedStep.type);
                  if (!action) return null;
                  const Icon = action.icon;
                  return (
                    <>
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        backgroundColor: `${action.color}10`,
                        border: `1px solid ${action.color}30`,
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon size={18} color={action.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.75rem' 
                        }}>
                          <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            margin: 0
                          }}>
                            {action.title}
                          </h3>
                          <span style={{
                            fontSize: '0.875rem',
                            fontWeight: 400,
                            color: 'var(--text-tertiary)',
                            opacity: 0.7
                          }}>
                            #{selectedStep.id.slice(-4)}
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
              
              <button
                onClick={closeModal}
                style={{
                  width: '2rem',
                  height: '2rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Common Description Field */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  Adım Açıklaması
                </label>
                <input
                  value={selectedStep.description || ''}
                  onChange={(e) => updateStepProperty(selectedStep.id, 'description', e.target.value)}
                  placeholder="Bu adımın ne yaptığını açıklayın..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '0.5rem',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {selectedStep.type === 'navigate' && (
                <>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem'
                    }}>
                      URL
                    </label>
                    <input
                      type="text"
                      value={selectedStep.url || ''}
                      onChange={(e) => updateStepProperty(selectedStep.id, 'url', e.target.value)}
                      placeholder="https://example.com"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '0.5rem',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </>
              )}

              {selectedStep.type === 'click' && (
                <>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem'
                    }}>
                      Seçici (Selector)
                    </label>
                    <input
                      type="text"
                      value={selectedStep.selector || ''}
                      onChange={(e) => updateStepProperty(selectedStep.id, 'selector', e.target.value)}
                      placeholder="#button, .class, [data-test]"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '0.5rem',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </>
              )}

              {selectedStep.type === 'input' && (
                <>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem'
                    }}>
                      Seçici (Selector)
                    </label>
                    <input
                      type="text"
                      value={selectedStep.selector || ''}
                      onChange={(e) => updateStepProperty(selectedStep.id, 'selector', e.target.value)}
                      placeholder="input[name='username']"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '0.5rem',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem'
                    }}>
                      Değer
                    </label>
                    <input
                      type="text"
                      value={selectedStep.value || ''}
                      onChange={(e) => updateStepProperty(selectedStep.id, 'value', e.target.value)}
                      placeholder="Girilecek metin"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '0.5rem',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </>
              )}

              {selectedStep.type === 'wait' && (
                <>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem'
                    }}>
                      Bekleme Süresi (milisaniye)
                    </label>
                    <input
                      type="number"
                      value={selectedStep.duration || 1000}
                      onChange={(e) => updateStepProperty(selectedStep.id, 'duration', parseInt(e.target.value))}
                      min="100"
                      max="30000"
                      step="100"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '0.5rem',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </>
              )}

              {selectedStep.type === 'if' && (
                <>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem'
                    }}>
                      Koşul Seçicisi
                    </label>
                    <input
                      type="text"
                      value={selectedStep.condition || ''}
                      onChange={(e) => updateStepProperty(selectedStep.id, 'condition', e.target.value)}
                      placeholder=".element:visible, [data-exists]"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '0.5rem',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </>
              )}

              {/* Delete Button */}
              <div style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-primary)',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => {
                    setTestSteps(testSteps.filter(s => s.id !== selectedStep.id));
                    closeModal();
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                  }}
                >
                  Adımı Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .toolbar-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.75rem;
          color: var(--text-secondary);
          transition: all 0.2s ease;
        }
        
        .toolbar-button:hover {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
          border-color: var(--primary);
        }
        
        .canvas-control {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-primary);
          border-radius: 0.375rem;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all 0.2s ease;
        }
        
        .canvas-control:hover {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
          border-color: var(--primary);
        }
      `}</style>
    </div>
  );
}