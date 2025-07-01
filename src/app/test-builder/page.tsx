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
  };

  // Handle drag start for existing steps
  const handleStepDragStart = (stepId: string) => {
    setDraggedStep(stepId);
  };

  // Handle drop on canvas
  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvasOffset.x) / zoom;
    const y = (e.clientY - rect.top - canvasOffset.y) / zoom;

    if (draggedAction) {
      // Create new step
      const action = availableActions.find(a => a.type === draggedAction);
      if (action) {
        const newStep: TestStep = {
          id: generateId(),
          type: action.type as any,
          x,
          y
        };
        setTestSteps(prev => [...prev, newStep]);
      }
      setDraggedAction(null);
    } else if (draggedStep) {
      // Move existing step
      setTestSteps(prev => prev.map(step => 
        step.id === draggedStep 
          ? { ...step, x, y }
          : step
      ));
      setDraggedStep(null);
    }
  }, [draggedAction, draggedStep, canvasOffset, zoom]);

  // Handle canvas drag over
  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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
    // If clicking on canvas background (not on a step), deselect
    if (e.target === e.currentTarget) {
      setSelectedStep(null);
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
      // If it was just a click (no drag), deselect step
      if (!hasMoved && e.target === canvasRef.current) {
        setSelectedStep(null);
      }
      
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
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            zIndex: 10,
            display: 'flex',
            gap: '0.5rem'
          }}>
            <button 
              onClick={() => setZoom(Math.min(zoom + 0.1, 2))}
              className="canvas-control"
            >
              <ZoomIn size={16} />
            </button>
            <span style={{ 
              padding: '0.5rem 0.75rem',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)'
            }}>
              {Math.round(zoom * 100)}%
            </span>
            <button 
              onClick={() => setZoom(Math.max(zoom - 0.1, 0.3))}
              className="canvas-control"
            >
              <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>−</span>
            </button>
            <button 
              onClick={() => {
                setZoom(1);
                setCanvasOffset({ x: 0, y: 0 });
              }}
              className="canvas-control"
            >
              <Reset size={16} />
            </button>
          </div>

          {/* Floating Toolbar */}
          <div style={{
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
          </div>

          {/* Floating Actions Panel */}
          <div style={{
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
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              paddingRight: '0.75rem',
              borderRight: '1px solid var(--border-primary)'
            }}>
              <TestTube size={14} color="var(--text-secondary)" />
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: 600, 
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Aksiyonlar
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {availableActions.map((action) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.type}
                    draggable
                    onDragStart={() => handleActionDragStart(action.type)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '2.5rem',
                      height: '2.5rem',
                      backgroundColor: `${action.color}10`,
                      border: `1px solid ${action.color}30`,
                      borderRadius: '0.5rem',
                      cursor: 'grab',
                      transition: 'all 0.2s ease',
                      position: 'relative'
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
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
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
              {/* Render test steps */}
              {testSteps.map((step) => {
                const action = availableActions.find(a => a.type === step.type);
                if (!action) return null;
                
                const Icon = action.icon;
                const isSelected = selectedStep === step;
                
                return (
                  <div
                    key={step.id}
                    draggable
                    onDragStart={() => handleStepDragStart(step.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStepClick(step);
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
                      cursor: 'grab',
                      boxShadow: isSelected 
                        ? `0 4px 12px ${action.color}30` 
                        : '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s ease'
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

        {/* Properties Panel */}
        {selectedStep && (
          <div style={{ 
            width: '18rem', 
            backgroundColor: 'var(--bg-primary)', 
            borderLeft: '1px solid var(--border-primary)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ 
              padding: '1rem', 
              borderBottom: '1px solid var(--border-primary)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Settings size={16} color="var(--text-secondary)" />
                <h3 style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  Özellikler
                </h3>
              </div>
              <p style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-secondary)',
                margin: 0
              }}>
                Seçili adımı yapılandır
              </p>
            </div>
            
            <div style={{ flex: 1, padding: '1rem' }}>
              {/* Properties form will be here */}
              <p style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-secondary)',
                textAlign: 'center',
                margin: '2rem 0'
              }}>
                Adım özellikleri burada gösterilecek
              </p>
            </div>
          </div>
        )}
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
                      <div>
                        <h3 style={{
                          fontSize: '1.25rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          margin: 0
                        }}>
                          {action.title}
                        </h3>
                        <p style={{
                          fontSize: '0.875rem',
                          color: 'var(--text-secondary)',
                          margin: 0
                        }}>
                          Adım #{selectedStep.id.slice(-4)}
                        </p>
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