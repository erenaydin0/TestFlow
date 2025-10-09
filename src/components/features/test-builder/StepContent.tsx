'use client';

import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { TestStep } from '@/types';
import { useI18n } from '@/contexts';

interface StepContentProps {
  step: TestStep;
}

const StepContent: React.FC<StepContentProps> = ({ step }) => {
  const { t } = useI18n();
  return (
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
            <span>URL: {step.url || t('testSteps.notSpecified')}</span>
          )}
          {step.type === 'click' && (
            <span>{t('testSteps.element')}: {step.selector || t('testSteps.notSpecified')}</span>
          )}
          {step.type === 'input' && (
            <span>
              {step.selector ? `${step.selector}: ` : `${t('testSteps.input')}: `}
              {step.value || t('testSteps.notSpecified')}
            </span>
          )}
          {step.type === 'wait' && (
            <span>{t('testSteps.duration')}: {step.duration || 1000}ms</span>
          )}
          {step.type === 'refresh' && t('testSteps.refresh')}
          {step.type === 'verify' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {(step.verificationType === 'url' || step.verificationType === 'urlContains') ? (
                <>
                  <span>{t('testSteps.type')}: {step.verificationType === 'url' ? t('testSteps.urlCheck') : t('testSteps.contains')}</span>
                  {step.expectedValue && <span>{t('testSteps.expected')}: {step.expectedValue}</span>}
                </>
              ) : (
                <>
                  <span>{t('testSteps.element')}: {step.selector || t('testSteps.notSpecified')}</span>
                  <span>{t('testSteps.type')}: {step.verificationType || t('testSteps.notSpecified')}</span>
                  {step.expectedValue && <span>{t('testSteps.value')}: {step.expectedValue}</span>}
                </>
              )}
            </div>
          )}
          {step.type === 'scroll' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {step.selector && <span>{t('testSteps.element')}: {step.selector}</span>}
              <span>{t('testSteps.direction')}: {step.direction || t('testSteps.notSpecified')}</span>
              {step.amount && <span>{t('testSteps.amount')}: {step.amount}px</span>}
            </div>
          )}
          {step.type === 'hover' && (
            <span>{t('testSteps.element')}: {step.selector || t('testSteps.notSpecified')}</span>
          )}
          {step.type === 'key' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span>{t('testSteps.key')}: {step.key || t('testSteps.notSpecified')}</span>
              {step.selector && <span>{t('testSteps.element')}: {step.selector}</span>}
            </div>
          )}
          {step.type === 'dropdown' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span>{t('testSteps.element')}: {step.selector || t('testSteps.notSpecified')}</span>
              <span>{t('testSteps.type')}: {step.optionType || t('testSteps.notSpecified')}</span>
              <span>{t('testSteps.value')}: {step.optionValue || t('testSteps.notSpecified')}</span>
            </div>
          )}
          {step.type === 'if' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span>{t('testSteps.type')}: {step.conditionType || 'visible'}</span>
              {step.selector && <span>{t('testSteps.element')}: {step.selector}</span>}
              {step.expectedValue && <span>{t('testSteps.value')}: {step.expectedValue}</span>}
              {step.operator && step.conditionType === 'count' && <span>Operatör: {step.operator}</span>}
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.65rem', marginTop: '0.25rem' }}>
                <span style={{ 
                  color: step.trueConnection ? 'var(--status-success)' : 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <CheckCircle size={10} />
                  TRUE: {step.trueConnection ? '✓' : t('testSteps.notConnected')}
                </span>
                <span style={{ 
                  color: step.falseConnection ? 'var(--status-error)' : 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <XCircle size={10} />
                  FALSE: {step.falseConnection ? '✓' : t('testSteps.notConnected')}
                </span>
              </div>
            </div>
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
          {step.type === 'click' && step.selector && `${t('testSteps.element')}: ${step.selector}`}
          {step.type === 'input' && step.value && `${t('testSteps.input')}: ${step.value}`}
          {step.type === 'wait' && `${t('testSteps.duration')}: ${step.duration || 1000}ms`}
          {step.type === 'refresh' && t('testSteps.refresh')}
          {step.type === 'verify' && (
            <div>
              {(step.verificationType === 'url' || step.verificationType === 'urlContains') ? (
                <>
                  {step.verificationType && `${t('testSteps.type')}: ${step.verificationType === 'url' ? t('testSteps.urlCheck') : t('testSteps.contains')}`}
                  {step.expectedValue && `, ${t('testSteps.expected')}: ${step.expectedValue}`}
                </>
              ) : (
                <>
                  {step.selector && `${t('testSteps.element')}: ${step.selector}`}
                  {step.verificationType && `, ${t('testSteps.type')}: ${step.verificationType}`}
                  {step.expectedValue && `, ${t('testSteps.value')}: ${step.expectedValue}`}
                </>
              )}
            </div>
          )}
          {step.type === 'scroll' && (
            <div>
              {step.selector && `${t('testSteps.element')}: ${step.selector}, `}
              {`${t('testSteps.direction')}: ${step.direction || t('testSteps.notSpecified')}`}
              {step.amount && `, ${t('testSteps.amount')}: ${step.amount}px`}
            </div>
          )}
          {step.type === 'hover' && step.selector && `${t('testSteps.element')}: ${step.selector}`}
          {step.type === 'key' && (
            <div>
              {`${t('testSteps.key')}: ${step.key || t('testSteps.notSpecified')}`}
              {step.selector && `, ${t('testSteps.element')}: ${step.selector}`}
            </div>
          )}
          {step.type === 'dropdown' && (
            <div>
              {step.selector && `${t('testSteps.element')}: ${step.selector}, `}
              {`${t('testSteps.type')}: ${step.optionType || t('testSteps.notSpecified')}, `}
              {`${t('testSteps.value')}: ${step.optionValue || t('testSteps.notSpecified')}`}
            </div>
          )}
          {step.type === 'if' && (
            <>
              {step.conditionType && `${t('testSteps.type')}: ${step.conditionType}`}
              {step.selector && `, ${t('testSteps.element')}: ${step.selector}`}
              {step.expectedValue && `, ${t('testSteps.value')}: ${step.expectedValue}`}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StepContent; 