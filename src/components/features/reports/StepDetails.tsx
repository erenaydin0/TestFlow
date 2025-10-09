import React from 'react';
import { ExecutionStepResult } from '@/types/execution';
import { CheckCircle, XCircle, Clock, AlertCircle, ArrowRight, ArrowDown, Play, Pause } from 'lucide-react';
import { useI18n } from '@/contexts';

interface StepDetailsProps {
  step: ExecutionStepResult;
  stepIndex: number;
  isExecuted: boolean;
  executionPath?: string[];
  conditionResult?: boolean;
}

const StepDetails: React.FC<StepDetailsProps> = ({ 
  step, 
  stepIndex, 
  isExecuted, 
  executionPath = [],
  conditionResult 
}) => {
  const { t, locale } = useI18n();
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
      default:
        return <Clock size={16} color="var(--text-tertiary)" />;
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
      default:
        return 'var(--text-secondary)';
    }
  };

  const getStepDescription = (step: ExecutionStepResult) => {
    const { type, config } = step;
    
    switch (type) {
      case 'navigate':
        return `URL'ye git: ${config.url || 'Belirtilmedi'}`;
      case 'click':
        return `Element'e tıkla: ${config.selector || 'Belirtilmedi'}`;
      case 'input':
      case 'type':
        return `Metin gir: "${config.value || ''}" → ${config.selector || 'Belirtilmedi'}`;
      case 'wait':
        return `Bekle: ${config.duration || 1000}ms`;
      case 'refresh':
        return 'Sayfayı yenile';
      case 'screenshot':
        return 'Ekran görüntüsü al';
      case 'verify':
        if (config.verificationType === 'url' || config.verificationType === 'urlContains') {
          return `URL kontrolü: ${config.verificationType === 'url' ? 'Eşit' : 'İçerir'} "${config.expectedValue || ''}"`;
        }
        return `Element kontrolü: ${config.verificationType || 'visible'} → ${config.selector || 'Belirtilmedi'}`;
      case 'scroll':
        return `Kaydır: ${config.direction || 'down'} ${config.amount ? `${config.amount}px` : ''}`;
      case 'hover':
        return `Element üzerine gel: ${config.selector || 'Belirtilmedi'}`;
      case 'key':
        return `Tuş bas: ${config.key || 'Belirtilmedi'} → ${config.selector || 'Genel'}`;
      case 'dropdown':
        return `Dropdown seç: ${config.optionValue || 'Belirtilmedi'} → ${config.selector || 'Belirtilmedi'}`;
      case 'if':
        return `Koşul kontrolü: ${config.conditionType || 'visible'} → ${config.selector || 'Belirtilmedi'}`;
      default:
        return `${type} adımı`;
    }
  };

  const getIfStepDetails = (step: ExecutionStepResult) => {
    if (step.type !== 'if') return null;
    
    const { config } = step;
    const hasTrueConnection = config.trueConnection;
    const hasFalseConnection = config.falseConnection;
    
    return (
      <div style={{ 
        marginTop: '0.5rem', 
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
        {isExecuted && conditionResult !== undefined && (
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

  const getExecutionReason = () => {
    if (isExecuted) {
      if (step.type === 'if' && conditionResult !== undefined) {
        return `IF koşulu ${conditionResult ? 'doğru' : 'yanlış'} olduğu için çalıştırıldı`;
      }
      return 'Normal akışta çalıştırıldı';
    } else {
      if (step.status === 'pending') {
        if (step.type === 'if') {
          return 'IF koşulunun sonucuna göre atlandı';
        }
        return 'Önceki adımlar tamamlanmadığı için beklemede';
      }
      return 'Henüz çalıştırılmadı';
    }
  };

  return (
    <div style={{
      padding: '1rem',
      marginBottom: '0.75rem',
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '0.75rem',
      borderLeft: `4px solid ${getStatusColor(step.status)}`,
      border: step.status === 'failed' ? '1px solid var(--status-error)' : '1px solid var(--border-primary)'
    }}>
      {/* Step Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ 
            fontWeight: 600, 
            fontSize: '0.875rem',
            backgroundColor: getStatusColor(step.status) + '20',
            color: getStatusColor(step.status),
            padding: '0.25rem 0.5rem',
            borderRadius: '0.375rem',
            minWidth: '2rem',
            textAlign: 'center'
          }}>
            {stepIndex + 1}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {getStatusIcon(step.status)}
            <span style={{ fontWeight: 500, fontSize: '1rem', textTransform: 'capitalize' }}>
              {step.type}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {step.screenshot && (
            <a 
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${step.screenshot}`}
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
              Ekran Görüntüsü
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
          {getStepDescription(step)}
        </p>
        
        {/* Execution Reason */}
        <div style={{ 
          fontSize: '0.75rem', 
          color: 'var(--text-secondary)',
          fontStyle: 'italic',
          marginBottom: '0.5rem'
        }}>
          {getExecutionReason()}
        </div>
      </div>

      {/* Step Config Details */}
      {step.config && Object.keys(step.config).length > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem', alignItems: 'start' }}>
            {Object.entries(step.config).map(([key, value]) => {
              if (key === 'trueConnection' || key === 'falseConnection' || key === 'connections') return null;
              if (!value || value === '') return null;
              
              // Filter out internal fields
              if (key === 'id' || key === 'type' || key === 'x' || key === 'y') return null;
              
              return (
                <React.Fragment key={key}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {key === 'url' ? 'URL' : 
                     key === 'selector' ? 'Element' :
                     key === 'value' ? 'Değer' :
                     key === 'text' ? 'Metin' :
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
      {getIfStepDetails(step)}

      {/* Step Timing */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', fontSize: '0.7rem' }}>
        {step.startTime && (
          <span style={{ color: 'var(--text-tertiary)' }}>
            {t('reports.startTime')}: {new Date(step.startTime).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US', {
              year: 'numeric',
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
              year: 'numeric',
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

      {/* Error Message */}
      {step.error && (
        <div style={{ 
          padding: '0.75rem',
          backgroundColor: 'var(--status-error-bg)',
          border: '1px solid var(--status-error)',
          borderRadius: '0.5rem',
          marginBottom: '0.5rem'
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

export default StepDetails;
