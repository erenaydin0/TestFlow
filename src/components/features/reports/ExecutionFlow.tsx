import React from 'react';
import { ExecutionStepResult } from '@/types/execution';
import { ArrowRight, ArrowDown, CheckCircle, XCircle, Clock, Play, Pause } from 'lucide-react';

interface ExecutionFlowProps {
  steps: ExecutionStepResult[];
  executionPath: string[];
  conditionResults: Map<string, boolean>;
}

const ExecutionFlow: React.FC<ExecutionFlowProps> = ({ 
  steps, 
  executionPath, 
  conditionResults 
}) => {
  const getStepStatus = (step: ExecutionStepResult) => {
    if (executionPath.includes(step.stepId)) {
      return step.status;
    }
    return 'skipped';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle size={14} color="var(--status-success)" />;
      case 'failed':
        return <XCircle size={14} color="var(--status-error)" />;
      case 'running':
        return <Play size={14} color="var(--status-warning)" />;
      case 'pending':
        return <Pause size={14} color="var(--text-tertiary)" />;
      case 'skipped':
        return <Clock size={14} color="var(--text-tertiary)" />;
      default:
        return <Clock size={14} color="var(--text-secondary)" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'var(--status-success)';
      case 'failed':
        return 'var(--status-error)';
      case 'running':
        return 'var(--status-warning)';
      case 'pending':
        return 'var(--text-tertiary)';
      case 'skipped':
        return 'var(--text-tertiary)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getStepDescription = (step: ExecutionStepResult) => {
    const { type, config } = step;
    
    switch (type) {
      case 'navigate':
        return `URL: ${config.url?.substring(0, 30) || 'Belirtilmedi'}${config.url?.length > 30 ? '...' : ''}`;
      case 'click':
        return `Tıkla: ${config.selector?.substring(0, 20) || 'Element'}${config.selector?.length > 20 ? '...' : ''}`;
      case 'input':
      case 'type':
        return `Yaz: "${config.value?.substring(0, 15) || ''}${config.value?.length > 15 ? '...' : ''}"`;
      case 'wait':
        return `Bekle: ${config.duration || 1000}ms`;
      case 'refresh':
        return 'Yenile';
      case 'screenshot':
        return 'Ekran Görüntüsü';
      case 'verify':
        return `Kontrol: ${config.verificationType || 'visible'}`;
      case 'scroll':
        return `Kaydır: ${config.direction || 'down'}`;
      case 'hover':
        return `Hover: ${config.selector?.substring(0, 15) || 'Element'}${config.selector?.length > 15 ? '...' : ''}`;
      case 'key':
        return `Tuş: ${config.key || 'Belirtilmedi'}`;
      case 'dropdown':
        return `Seç: ${config.optionValue?.substring(0, 15) || 'Değer'}${config.optionValue?.length > 15 ? '...' : ''}`;
      case 'if':
        return `IF: ${config.conditionType || 'visible'}`;
      default:
        return type;
    }
  };

  const getIfStepInfo = (step: ExecutionStepResult) => {
    if (step.type !== 'if') return null;
    
    // Önce step'teki gerçek conditionResult'ı kullan, yoksa conditionResults'tan al
    const conditionResult = step.conditionResult !== undefined ? step.conditionResult : conditionResults.get(step.stepId);
    const hasTrueConnection = step.config.trueConnection;
    const hasFalseConnection = step.config.falseConnection;
    
    return (
      <div style={{ 
        fontSize: '0.7rem', 
        color: 'var(--text-secondary)',
        marginTop: '0.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {conditionResult !== undefined ? (
          <>
            <span style={{ 
              color: conditionResult ? 'var(--status-success)' : 'var(--status-error)',
              fontWeight: 600
            }}>
              {conditionResult ? 'TRUE' : 'FALSE'}
            </span>
            <ArrowRight size={10} />
            <span style={{ 
              color: conditionResult && hasTrueConnection ? 'var(--status-success)' :
                     !conditionResult && hasFalseConnection ? 'var(--status-error)' :
                     'var(--text-tertiary)'
            }}>
              {conditionResult ? 
                (hasTrueConnection ? 'TRUE yolu' : 'Bağlantı yok') :
                (hasFalseConnection ? 'FALSE yolu' : 'Bağlantı yok')
              }
            </span>
          </>
        ) : (
          <span style={{ color: 'var(--text-tertiary)' }}>
            {hasTrueConnection && hasFalseConnection ? 'TRUE/FALSE bağlantıları var' :
             hasTrueConnection ? 'Sadece TRUE bağlantısı' :
             hasFalseConnection ? 'Sadece FALSE bağlantısı' :
             'Bağlantı yok'}
          </span>
        )}
      </div>
    );
  };

  const getSkippedReason = (step: ExecutionStepResult) => {
    if (executionPath.includes(step.stepId)) return null;
    
    if (step.type === 'if') {
      return 'IF koşulunun sonucuna göre atlandı';
    }
    
    // Check if any previous step failed
    const stepIndex = steps.findIndex(s => s.stepId === step.stepId);
    const previousSteps = steps.slice(0, stepIndex);
    const hasFailedStep = previousSteps.some(s => executionPath.includes(s.stepId) && s.status === 'failed');
    
    if (hasFailedStep) {
      return 'Önceki adım başarısız olduğu için atlandı';
    }
    
    return 'IF koşulunun sonucuna göre atlandı';
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
        Yürütme Akışı
      </h4>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.5rem',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {steps.map((step, index) => {
          const status = getStepStatus(step);
          const isExecuted = executionPath.includes(step.stepId);
          const isSkipped = !isExecuted;
          
          return (
            <div key={step.stepId} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              backgroundColor: isExecuted ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
              borderRadius: '0.5rem',
              border: isExecuted ? 
                `1px solid ${getStatusColor(status)}` : 
                '1px solid var(--border-primary)',
              opacity: isSkipped ? 0.6 : 1,
              transition: 'all 0.2s ease'
            }}>
              {/* Step Number */}
              <div style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                backgroundColor: getStatusColor(status) + '20',
                color: getStatusColor(status),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
                flexShrink: 0
              }}>
                {index + 1}
              </div>

              {/* Step Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  {getStatusIcon(status)}
                  <span style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 500,
                    color: isExecuted ? 'var(--text-primary)' : 'var(--text-tertiary)'
                  }}>
                    {step.type.toUpperCase()}
                  </span>
                  {isExecuted && step.duration && (
                    <span style={{ 
                      fontSize: '0.7rem', 
                      color: 'var(--text-secondary)',
                      backgroundColor: 'var(--bg-primary)',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '0.25rem'
                    }}>
                      {Math.round(step.duration)}ms
                    </span>
                  )}
                </div>
                
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: isExecuted ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                  marginBottom: '0.25rem'
                }}>
                  {getStepDescription(step)}
                </div>

                {/* IF Step Special Info */}
                {step.type === 'if' && getIfStepInfo(step)}

                {/* Skipped Reason */}
                {isSkipped && (
                  <div style={{ 
                    fontSize: '0.7rem', 
                    color: 'var(--text-tertiary)',
                    fontStyle: 'italic'
                  }}>
                    {getSkippedReason(step)}
                  </div>
                )}

                {/* Error Message for Failed Steps */}
                {isExecuted && step.status === 'failed' && step.error && (
                  <div style={{ 
                    fontSize: '0.7rem', 
                    color: 'var(--status-error)',
                    backgroundColor: 'var(--status-error-bg)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    marginTop: '0.25rem',
                    fontFamily: 'monospace'
                  }}>
                    {step.error.substring(0, 100)}{step.error.length > 100 ? '...' : ''}
                  </div>
                )}
              </div>

              {/* Execution Indicator */}
              {isExecuted && (
                <div style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  borderRadius: '50%',
                  backgroundColor: getStatusColor(status),
                  flexShrink: 0
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div style={{ 
        marginTop: '1rem', 
        padding: '0.75rem', 
        backgroundColor: 'var(--bg-tertiary)', 
        borderRadius: '0.5rem',
        border: '1px solid var(--border-primary)'
      }}>
        <div style={{ 
          fontSize: '0.75rem', 
          color: 'var(--text-secondary)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '0.5rem'
        }}>
          <div>
            <span style={{ fontWeight: 600 }}>Toplam:</span> {steps.length} adım
          </div>
          <div>
            <span style={{ fontWeight: 600, color: 'var(--status-success)' }}>Çalıştırılan:</span> {executionPath.length} adım
          </div>
          <div>
            <span style={{ fontWeight: 600, color: 'var(--text-tertiary)' }}>Atlanan:</span> {steps.length - executionPath.length} adım
          </div>
          <div>
            <span style={{ fontWeight: 600, color: 'var(--status-success)' }}>Başarılı:</span> {steps.filter(s => executionPath.includes(s.stepId) && s.status === 'passed').length} adım
          </div>
          <div>
            <span style={{ fontWeight: 600, color: 'var(--status-error)' }}>Başarısız:</span> {steps.filter(s => executionPath.includes(s.stepId) && s.status === 'failed').length} adım
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutionFlow;
