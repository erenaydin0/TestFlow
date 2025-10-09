import React from 'react';
import { ExecutionStepResult } from '@/types/execution';
import { CheckCircle, XCircle, Clock, AlertCircle, ArrowRight, ArrowDown, Play, Pause, Eye, EyeOff } from 'lucide-react';
import { useI18n } from '@/contexts';
import { formatRelativeTime, formatTime } from '@/lib/utils';
import { API_URL } from '@/lib/config';

interface UnifiedStepViewProps {
  steps: ExecutionStepResult[];
  executionPath: string[];
  conditionResults: Map<string, boolean>;
}

const UnifiedStepView: React.FC<UnifiedStepViewProps> = ({ 
  steps, 
  executionPath, 
  conditionResults 
}) => {
  const { t, locale } = useI18n();
  const getStepStatus = (step: ExecutionStepResult) => {
    if (executionPath.includes(step.stepId)) {
      return step.status;
    }
    return 'skipped';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle size={16} color="var(--status-success)" />;
      case 'failed':
        return <XCircle size={16} color="var(--status-error)" />;
      case 'running':
        return <Play size={16} color="var(--status-warning)" />;
      case 'pending':
        return <Pause size={16} color="var(--text-tertiary)" />;
      case 'skipped':
        return <Clock size={16} color="var(--text-tertiary)" />;
      default:
        return <Clock size={16} color="var(--text-secondary)" />;
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
        return `${t('testSteps.navigate')}: ${config.url || t('common.notSpecified')}`;
      case 'click':
        return `${t('testSteps.click')}: ${config.selector || t('common.notSpecified')}`;
      case 'input':
      case 'type':
        return `${t('testSteps.input')}: "${config.value || ''}" → ${config.selector || t('common.notSpecified')}`;
      case 'wait':
        return `${t('testSteps.wait')}: ${config.duration || 1000}ms`;
      case 'refresh':
        return t('testSteps.refresh');
      case 'screenshot':
        return t('testSteps.screenshot');
      case 'verify':
        if (config.verificationType === 'url' || config.verificationType === 'urlContains') {
          return `${t('testSteps.urlCheck')}: ${config.verificationType === 'url' ? t('testSteps.equals') : t('testSteps.contains')} "${config.expectedValue || ''}"`;
        }
        return `${t('testSteps.elementCheck')}: ${config.verificationType || 'visible'} → ${config.selector || t('common.notSpecified')}`;
      case 'scroll':
        return `${t('testSteps.scroll')}: ${config.direction || 'down'} ${config.amount ? `${config.amount}px` : ''}`;
      case 'hover':
        return `${t('testSteps.hover')}: ${config.selector || t('common.notSpecified')}`;
      case 'key':
        return `${t('testSteps.key')}: ${config.key || t('common.notSpecified')} → ${config.selector || t('common.general')}`;
      case 'dropdown':
        return `${t('testSteps.dropdown')}: ${config.optionValue || t('common.notSpecified')} → ${config.selector || t('common.notSpecified')}`;
      case 'if':
        return `${t('testSteps.condition')}: ${config.conditionType || 'visible'} → ${config.selector || t('common.notSpecified')}`;
      default:
        return `${type} ${t('testSteps.step')}`;
    }
  };

  const getIfStepDetails = (step: ExecutionStepResult) => {
    if (step.type !== 'if') return null;
    
    const { config } = step;
    const conditionResult = step.conditionResult !== undefined ? step.conditionResult : conditionResults.get(step.stepId);
    const hasTrueConnection = config.trueConnection;
    const hasFalseConnection = config.falseConnection;
    
    return (
      <div style={{ 
        marginTop: '0.75rem', 
        padding: '0.75rem', 
        backgroundColor: 'var(--bg-tertiary)', 
        borderRadius: '0.5rem',
        border: '1px solid var(--border-primary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Koşul Detayları:
          </span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.7rem' }}>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>Tür:</span>
            <span style={{ color: 'var(--text-primary)', marginLeft: '0.25rem' }}>
              {config.conditionType || 'visible'}
            </span>
          </div>
          {config.selector && (
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Element:</span>
              <span style={{ color: 'var(--text-primary)', marginLeft: '0.25rem', fontFamily: 'monospace' }}>
                {config.selector}
              </span>
            </div>
          )}
          {config.expectedValue && (
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Beklenen:</span>
              <span style={{ color: 'var(--text-primary)', marginLeft: '0.25rem' }}>
                {config.expectedValue}
              </span>
            </div>
          )}
          {config.operator && (
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Operatör:</span>
              <span style={{ color: 'var(--text-primary)', marginLeft: '0.25rem' }}>
                {config.operator}
              </span>
            </div>
          )}
        </div>

        {/* Koşul sonucu ve yön */}
        {conditionResult !== undefined && (
          <div style={{ 
            marginTop: '0.75rem', 
            padding: '0.5rem', 
            backgroundColor: conditionResult ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
            border: `1px solid ${conditionResult ? 'var(--status-success)' : 'var(--status-error)'}`,
            borderRadius: '0.375rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {conditionResult ? (
              <CheckCircle size={14} color="var(--status-success)" />
            ) : (
              <XCircle size={14} color="var(--status-error)" />
            )}
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: 600,
              color: conditionResult ? 'var(--status-success)' : 'var(--status-error)'
            }}>
              Koşul {conditionResult ? 'DOĞRU' : 'YANLIŞ'} - {conditionResult ? 'TRUE' : 'FALSE'} yönüne gidildi
            </span>
          </div>
        )}

        {/* Bağlantı durumu */}
        <div style={{ 
          marginTop: '0.5rem', 
          display: 'flex', 
          gap: '1rem', 
          fontSize: '0.7rem' 
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.25rem',
            color: hasTrueConnection ? 'var(--status-success)' : 'var(--text-tertiary)'
          }}>
            <CheckCircle size={12} />
            <span>TRUE: {hasTrueConnection ? 'Bağlı' : 'Bağlı değil'}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.25rem',
            color: hasFalseConnection ? 'var(--status-error)' : 'var(--text-tertiary)'
          }}>
            <XCircle size={12} />
            <span>FALSE: {hasFalseConnection ? 'Bağlı' : 'Bağlı değil'}</span>
          </div>
        </div>
      </div>
    );
  };

  const getExecutionReason = (step: ExecutionStepResult, isExecuted: boolean) => {
    if (isExecuted) {
      if (step.type === 'if' && step.conditionResult !== undefined) {
        return t('reports.ifConditionExecuted', { result: step.conditionResult ? t('common.true') : t('common.false') });
      }
      return t('reports.normalFlowExecuted');
    } else {
      if (step.status === 'pending') {
        if (step.type === 'if') {
          return t('reports.ifConditionSkipped');
        }
        return t('reports.waitingForPreviousSteps');
      }
      return t('reports.notExecutedYet');
    }
  };

  const getSkippedReason = (step: ExecutionStepResult) => {
    if (executionPath.includes(step.stepId)) return null;
    
    if (step.type === 'if') {
      return t('reports.ifConditionSkipped');
    }
    
    // Check if any previous step failed
    const stepIndex = steps.findIndex(s => s.stepId === step.stepId);
    const previousSteps = steps.slice(0, stepIndex);
    const hasFailedStep = previousSteps.some(s => executionPath.includes(s.stepId) && s.status === 'failed');
    
    if (hasFailedStep) {
      return t('reports.skippedDueToPreviousFailure');
    }
    
    return t('reports.ifConditionSkipped');
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
        {t('reports.testStepsAndExecutionFlow')}
      </h4>
      
      {/* Summary - Moved to top */}
      <div style={{ 
        marginBottom: '1rem', 
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
            <span style={{ fontWeight: 600 }}>{t('reports.totalSteps')}:</span> {steps.length} {t('reports.steps')}
          </div>
          <div>
            <span style={{ fontWeight: 600, color: 'var(--status-success)' }}>{t('reports.executedSteps')}:</span> {executionPath.length} {t('reports.steps')}
          </div>
          <div>
            <span style={{ fontWeight: 600, color: 'var(--text-tertiary)' }}>{t('reports.skippedSteps')}:</span> {steps.length - executionPath.length} {t('reports.steps')}
          </div>
          <div>
            <span style={{ fontWeight: 600, color: 'var(--status-success)' }}>{t('reports.passedSteps')}:</span> {steps.filter(s => executionPath.includes(s.stepId) && s.status === 'passed').length} {t('reports.steps')}
          </div>
          <div>
            <span style={{ fontWeight: 600, color: 'var(--status-error)' }}>{t('reports.failedSteps')}:</span> {steps.filter(s => executionPath.includes(s.stepId) && s.status === 'failed').length} {t('reports.steps')}
          </div>
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.75rem',
        maxHeight: '600px',
        overflowY: 'auto'
      }}>
        {steps.map((step, index) => {
          const status = getStepStatus(step);
          const isExecuted = executionPath.includes(step.stepId);
          const isSkipped = !isExecuted;
          
          return (
            <div key={step.stepId} style={{
              padding: '1rem',
              backgroundColor: isExecuted ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
              borderRadius: '0.75rem',
              borderLeft: `4px solid ${getStatusColor(status)}`,
              border: isExecuted ? 
                `1px solid ${getStatusColor(status)}` : 
                '1px solid var(--border-primary)',
              opacity: isSkipped ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}>
              {/* Step Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ 
                    fontWeight: 600, 
                    fontSize: '0.875rem',
                    backgroundColor: getStatusColor(status) + '20',
                    color: getStatusColor(status),
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.375rem',
                    minWidth: '2rem',
                    textAlign: 'center'
                  }}>
                    {index + 1}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getStatusIcon(status)}
                    <span style={{ 
                      fontWeight: 500, 
                      fontSize: '1rem', 
                      textTransform: 'capitalize',
                      color: isExecuted ? 'var(--text-primary)' : 'var(--text-tertiary)'
                    }}>
                      {step.type}
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
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {step.screenshot && (
                    <a 
                      href={`${API_URL}${step.screenshot}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        textDecoration: 'none',
                        fontSize: '0.65rem',
                        borderRadius: '0.25rem',
                        border: '1px solid #bfdbfe',
                        fontWeight: 500
                      }}
                    >
                      <ArrowRight size={10} />
                      {t('reports.screenshot')}
                    </a>
                  )}
                  {isSkipped && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.7rem',
                      color: 'var(--text-tertiary)'
                    }}>
                      <EyeOff size={12} />
                      <span>{t('reports.skipped')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step Description */}
              <div style={{ marginBottom: '0.75rem' }}>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: isExecuted ? 'var(--text-primary)' : 'var(--text-tertiary)', 
                  margin: '0 0 0.5rem 0',
                  fontWeight: 500
                }}>
                  {getStepDescription(step)}
                </p>
                
                {/* Execution Reason - Sadece özel durumlar için göster */}
                {getExecutionReason(step, isExecuted) !== t('reports.normalFlowExecuted') && (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic',
                    marginBottom: '0.5rem'
                  }}>
                    {getExecutionReason(step, isExecuted)}
                  </div>
                )}
              </div>

              {/* Step Config Details */}
              {isExecuted && step.config && Object.keys(step.config).length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem', alignItems: 'start' }}>
                    {Object.entries(step.config).map(([key, value]) => {
                      if (key === 'trueConnection' || key === 'falseConnection' || key === 'connections') return null;
                      if (!value || value === '') return null;
                      
                      // Ana açıklamada zaten belirtilen alanları atla
                      if (step.type === 'input' || step.type === 'type') {
                        if (key === 'value' || key === 'text' || key === 'target' || key === 'selector') return null;
                      }
                      if (step.type === 'click') {
                        if (key === 'selector' || key === 'target') return null;
                      }
                      if (step.type === 'hover') {
                        if (key === 'selector' || key === 'target') return null;
                      }
                      if (step.type === 'verify') {
                        if (key === 'selector' || key === 'target') return null;
                      }
                      if (step.type === 'scroll') {
                        if (key === 'selector' || key === 'target') return null;
                      }
                      if (step.type === 'key') {
                        if (key === 'selector' || key === 'target' || key === 'key') return null;
                      }
                      if (step.type === 'dropdown') {
                        if (key === 'selector' || key === 'target') return null;
                      }
                      if (step.type === 'navigate') {
                        if (key === 'url') return null;
                      }
                      
                      // Filter out internal fields
                      if (key === 'id' || key === 'type' || key === 'x' || key === 'y') return null;
                      
                      return (
                        <React.Fragment key={key}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {key === 'url' ? 'URL' : 
                             key === 'selector' ? 'Element' :
                             key === 'expectedValue' ? 'Beklenen' :
                             key === 'verificationType' ? 'Kontrol Türü' :
                             key === 'conditionType' ? 'Koşul Türü' :
                             key === 'duration' ? t('common.duration') :
                             key === 'direction' ? 'Yön' :
                             key === 'amount' ? 'Miktar' :
                             key === 'key' ? 'Tuş' :
                             key === 'optionType' ? 'Seçenek Türü' :
                             key === 'optionValue' ? 'Seçenek Değeri' :
                             key === 'operator' ? 'Operatör' :
                             key}:
                          </span>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--text-primary)', 
                            fontFamily: key === 'selector' || key === 'url' ? 'monospace' : 'inherit',
                            wordBreak: key === 'url' ? 'break-all' : 'normal'
                          }}>
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* IF Step Special Details */}
              {isExecuted && getIfStepDetails(step)}

              {/* Step Timing */}
              {isExecuted && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', fontSize: '0.7rem' }}>
                  {step.startTime && (
                    <span style={{ color: 'var(--text-tertiary)' }}>
                      {t('reports.startTime')}: {new Date(step.startTime).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  )}
                  {step.endTime && (
                    <span style={{ color: 'var(--text-tertiary)' }}>
                      {t('reports.endTime')}: {new Date(step.endTime).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  )}
                  {step.duration && (
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {t('common.duration')}: {Math.round(step.duration)}ms
                    </span>
                  )}
                </div>
              )}

              {/* Skipped Reason */}
              {isSkipped && (
                <div style={{ 
                  fontSize: '0.7rem', 
                  color: 'var(--text-tertiary)',
                  fontStyle: 'italic',
                  marginTop: '0.5rem'
                }}>
                  {getSkippedReason(step)}
                </div>
              )}

              {/* Error Message for Failed Steps */}
              {isExecuted && step.status === 'failed' && step.error && (
                <div style={{ 
                  padding: '0.75rem',
                  backgroundColor: 'var(--status-error-bg)',
                  border: '1px solid var(--status-error)',
                  borderRadius: '0.5rem',
                  marginTop: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <AlertCircle size={14} style={{ color: 'var(--status-error)' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--status-error)' }}>
                      {t('reports.errorDetails')}
                    </span>
                  </div>
                  <p style={{ color: 'var(--status-error)', fontSize: '0.75rem', margin: 0, fontFamily: 'monospace' }}>
                    {step.error}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UnifiedStepView;
