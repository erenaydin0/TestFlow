import React from 'react';
import { ExecutionStepResult } from '@/types/execution';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useI18n } from '@/hooks';
import { API_URL } from '@/utils/config';
import { getStatusIcon, getStatusColor, getStepDescription, getExecutionReason, getConfigFieldLabel, shouldShowConfigField } from './stepUtils';

interface StepViewProps {
  steps: ExecutionStepResult[];
}

const StepView: React.FC<StepViewProps> = ({
  steps
}) => {
  const { t, locale } = useI18n();

  const renderStepItem = (step: ExecutionStepResult, index: number) => {
    // In linear flow, all steps execute sequentially
    const status = step.status || 'pending';

    return (
      <div key={step.stepId} style={{
        padding: '1rem',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '0.75rem',
        borderLeft: `4px solid ${getStatusColor(status)}`,
        border: `1px solid ${getStatusColor(status)}`,
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
              {getStatusIcon(status, 16)}
              <span style={{
                fontWeight: 500,
                fontSize: '1rem',
                textTransform: 'capitalize',
                color: 'var(--text-primary)'
              }}>
                {step.type}
              </span>
              {(step.startTime || step.endTime || step.duration) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                  {step.startTime && (
                    <span>
                      {t('reports.startTime')}: {new Date(step.startTime).toLocaleTimeString(locale === 'tr' ? 'tr-TR' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  )}
                  {step.endTime && (
                    <span>
                      {t('reports.endTime')}: {new Date(step.endTime).toLocaleTimeString(locale === 'tr' ? 'tr-TR' : 'en-US', {
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
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {step.screenshot && (
              <a
                href={step.screenshot.startsWith('http') ? step.screenshot : `${API_URL}${step.screenshot}`}
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
          </div>
        </div>

        {/* Step Description */}
        <div style={{ marginBottom: '0.75rem' }}>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-primary)',
            margin: '0 0 0.5rem 0',
            fontWeight: 500
          }}>
            {getStepDescription(step, t)}
          </p>

          {/* Execution Reason - Sadece özel durumlar için göster */}
          {getExecutionReason(step, true, t) !== t('reports.normalFlowExecuted') && (
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
              marginBottom: '0.5rem'
            }}>
              {getExecutionReason(step, true, t)}
            </div>
          )}
        </div>

        {/* Step Config Details */}
        {step.config && Object.keys(step.config).length > 0 && (
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem', alignItems: 'start' }}>
              {Object.entries(step.config).map(([key, value]) => {
                if (!shouldShowConfigField(step, key, value)) return null;

                return (
                  <React.Fragment key={key}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {getConfigFieldLabel(key, t)}:
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


        {/* Error Message for Failed Steps */}
        {step.status === 'failed' && step.error && (
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
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
        {t('reports.testStepsAndExecutionFlow')}
      </h4>

      {/* Summary */}
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
            <span style={{ fontWeight: 600, color: 'var(--status-success)' }}>{t('reports.passedSteps')}:</span> {steps.filter(s => s.status === 'passed').length} {t('reports.steps')}
          </div>
          <div>
            <span style={{ fontWeight: 600, color: 'var(--status-error)' }}>{t('reports.failedSteps')}:</span> {steps.filter(s => s.status === 'failed').length} {t('reports.steps')}
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
        {steps.map((step, index) => renderStepItem(step, index))}
      </div>
    </div>
  );
};

export default StepView;
