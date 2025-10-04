'use client';

import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { TestStep } from '@/types';

interface StepContentProps {
  step: TestStep;
}

const StepContent: React.FC<StepContentProps> = ({ step }) => {
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
          {step.type === 'verify' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span>Element: {step.selector || 'Belirtilmedi'}</span>
              <span>Tür: {step.verificationType || 'Belirtilmedi'}</span>
              {step.expectedValue && <span>Değer: {step.expectedValue}</span>}
            </div>
          )}
          {step.type === 'scroll' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {step.selector && <span>Element: {step.selector}</span>}
              <span>Yön: {step.direction || 'Belirtilmedi'}</span>
              {step.amount && <span>Miktar: {step.amount}px</span>}
            </div>
          )}
          {step.type === 'hover' && (
            <span>Element: {step.selector || 'Belirtilmedi'}</span>
          )}
          {step.type === 'key' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span>Tuş: {step.key || 'Belirtilmedi'}</span>
              {step.selector && <span>Element: {step.selector}</span>}
            </div>
          )}
          {step.type === 'dropdown' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span>Element: {step.selector || 'Belirtilmedi'}</span>
              <span>Tür: {step.optionType || 'Belirtilmedi'}</span>
              <span>Değer: {step.optionValue || 'Belirtilmedi'}</span>
            </div>
          )}
          {step.type === 'if' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span>Koşul: {step.condition || 'Belirtilmedi'}</span>
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.65rem' }}>
                <span style={{ 
                  color: step.trueConnection ? '#22c55e' : 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <CheckCircle size={10} />
                  TRUE: {step.trueConnection ? '✓' : 'Bağlı değil'}
                </span>
                <span style={{ 
                  color: step.falseConnection ? '#ef4444' : 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <XCircle size={10} />
                  FALSE: {step.falseConnection ? '✓' : 'Bağlı değil'}
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
          {step.type === 'click' && step.selector && `Element: ${step.selector}`}
          {step.type === 'input' && step.value && `Input: ${step.value}`}
          {step.type === 'wait' && `Süre: ${step.duration || 1000}ms`}
          {step.type === 'refresh' && 'Sayfa yenileme'}
          {step.type === 'verify' && (
            <div>
              {step.selector && `Element: ${step.selector}`}
              {step.verificationType && `, Tür: ${step.verificationType}`}
              {step.expectedValue && `, Değer: ${step.expectedValue}`}
            </div>
          )}
          {step.type === 'scroll' && (
            <div>
              {step.selector && `Element: ${step.selector}, `}
              {`Yön: ${step.direction || 'Belirtilmedi'}`}
              {step.amount && `, Miktar: ${step.amount}px`}
            </div>
          )}
          {step.type === 'hover' && step.selector && `Element: ${step.selector}`}
          {step.type === 'key' && (
            <div>
              {`Tuş: ${step.key || 'Belirtilmedi'}`}
              {step.selector && `, Element: ${step.selector}`}
            </div>
          )}
          {step.type === 'dropdown' && (
            <div>
              {step.selector && `Element: ${step.selector}, `}
              {`Tür: ${step.optionType || 'Belirtilmedi'}, `}
              {`Değer: ${step.optionValue || 'Belirtilmedi'}`}
            </div>
          )}
          {step.type === 'if' && step.condition && `Koşul: ${step.condition}`}
        </div>
      )}
    </div>
  );
};

export default StepContent; 