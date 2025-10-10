import React from 'react';
import { ExecutionStepResult } from '@/types/execution';
import { CheckCircle, XCircle, Clock, Play, Pause } from 'lucide-react';

export const getStepStatus = (step: ExecutionStepResult, executionPath: string[]) => {
  if (executionPath.includes(step.stepId)) {
    return step.status;
  }
  return 'skipped';
};

export const getStatusIcon = (status: string, size: number = 16): React.ReactElement => {
  switch (status) {
    case 'passed':
      return React.createElement(CheckCircle, { size, color: "var(--status-success)" });
    case 'failed':
      return React.createElement(XCircle, { size, color: "var(--status-error)" });
    case 'running':
      return React.createElement(Play, { size, color: "var(--status-warning)" });
    case 'pending':
      return React.createElement(Pause, { size, color: "var(--text-tertiary)" });
    case 'skipped':
      return React.createElement(Clock, { size, color: "var(--text-tertiary)" });
    default:
      return React.createElement(Clock, { size, color: "var(--text-secondary)" });
  }
};

export const getStatusColor = (status: string) => {
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

export const getStepDescription = (step: ExecutionStepResult, t?: (key: string) => string) => {
  const { type, config } = step;
  
  // Türkçe çeviriler için fallback
  const getText = (key: string, fallback: string) => t ? t(key) : fallback;
  
  switch (type) {
    case 'navigate':
      return `${getText('testSteps.navigate', 'URL\'ye git')}: ${config.url || getText('common.notSpecified', 'Belirtilmedi')}`;
    case 'click':
      return `${getText('testSteps.click', 'Element\'e tıkla')}: ${config.selector || getText('common.notSpecified', 'Belirtilmedi')}`;
    case 'input':
    case 'type':
      return `${getText('testSteps.input', 'Metin gir')}: "${config.value || ''}" → ${config.selector || getText('common.notSpecified', 'Belirtilmedi')}`;
    case 'wait':
      return `${getText('testSteps.wait', 'Bekle')}: ${config.duration || 1000}ms`;
    case 'refresh':
      return getText('testSteps.refresh', 'Sayfayı yenile');
    case 'screenshot':
      return getText('testSteps.screenshot', 'Ekran görüntüsü al');
    case 'verify':
      if (config.verificationType === 'url' || config.verificationType === 'urlContains') {
        return `${getText('testSteps.urlCheck', 'URL kontrolü')}: ${config.verificationType === 'url' ? getText('testSteps.equals', 'Eşit') : getText('testSteps.contains', 'İçerir')} "${config.expectedValue || ''}"`;
      }
      return `${getText('testSteps.elementCheck', 'Element kontrolü')}: ${config.verificationType || 'visible'} → ${config.selector || getText('common.notSpecified', 'Belirtilmedi')}`;
    case 'scroll':
      return `${getText('testSteps.scroll', 'Kaydır')}: ${config.direction || 'down'} ${config.amount ? `${config.amount}px` : ''}`;
    case 'hover':
      return `${getText('testSteps.hover', 'Element üzerine gel')}: ${config.selector || getText('common.notSpecified', 'Belirtilmedi')}`;
    case 'key':
      return `${getText('testSteps.key', 'Tuş bas')}: ${config.key || getText('common.notSpecified', 'Belirtilmedi')} → ${config.selector || getText('common.general', 'Genel')}`;
    case 'dropdown':
      return `${getText('testSteps.dropdown', 'Dropdown seç')}: ${config.optionValue || getText('common.notSpecified', 'Belirtilmedi')} → ${config.selector || getText('common.notSpecified', 'Belirtilmedi')}`;
    case 'if':
      return `${getText('testSteps.condition', 'Koşul kontrolü')}: ${config.conditionType || 'visible'} → ${config.selector || getText('common.notSpecified', 'Belirtilmedi')}`;
    default:
      return `${type} ${getText('testSteps.step', 'adımı')}`;
  }
};

export const getIfStepDetails = (step: ExecutionStepResult, conditionResults: Map<string, boolean>, isExecuted: boolean = true) => {
  if (step.type !== 'if') return null;
  
  const { config } = step;
  const conditionResult = step.conditionResult !== undefined ? step.conditionResult : conditionResults.get(step.stepId);
  const hasTrueConnection = config.trueConnection;
  const hasFalseConnection = config.falseConnection;
  
  return {
    conditionResult,
    hasTrueConnection,
    hasFalseConnection,
    config
  };
};

export const getExecutionReason = (step: ExecutionStepResult, isExecuted: boolean, t?: (key: string) => string) => {
  const getText = (key: string, fallback: string) => t ? t(key) : fallback;
  
  if (isExecuted) {
    if (step.type === 'if' && step.conditionResult !== undefined) {
      return getText('reports.ifConditionExecuted', `IF koşulu ${step.conditionResult ? 'doğru' : 'yanlış'} olduğu için çalıştırıldı`);
    }
    return getText('reports.normalFlowExecuted', 'Normal akışta çalıştırıldı');
  } else {
    if (step.status === 'pending') {
      if (step.type === 'if') {
        return getText('reports.ifConditionSkipped', 'IF koşulunun sonucuna göre atlandı');
      }
      return getText('reports.waitingForPreviousSteps', 'Önceki adımlar tamamlanmadığı için beklemede');
    }
    return getText('reports.notExecutedYet', 'Henüz çalıştırılmadı');
  }
};

export const getSkippedReason = (step: ExecutionStepResult, steps: ExecutionStepResult[], executionPath: string[], t?: (key: string) => string) => {
  if (executionPath.includes(step.stepId)) return null;
  
  const getText = (key: string, fallback: string) => t ? t(key) : fallback;
  
  if (step.type === 'if') {
    return getText('reports.ifConditionSkipped', 'IF koşulunun sonucuna göre atlandı');
  }
  
  // Check if any previous step failed
  const stepIndex = steps.findIndex(s => s.stepId === step.stepId);
  const previousSteps = steps.slice(0, stepIndex);
  const hasFailedStep = previousSteps.some(s => executionPath.includes(s.stepId) && s.status === 'failed');
  
  if (hasFailedStep) {
    return getText('reports.skippedDueToPreviousFailure', 'Önceki adım başarısız olduğu için atlandı');
  }
  
  return getText('reports.ifConditionSkipped', 'IF koşulunun sonucuna göre atlandı');
};

export const getConfigFieldLabel = (key: string, t?: (key: string) => string) => {
  const getText = (key: string, fallback: string) => t ? t(key) : fallback;
  
  switch (key) {
    case 'url': return 'URL';
    case 'selector': return 'Element';
    case 'value': return 'Değer';
    case 'text': return 'Metin';
    case 'expectedValue': return 'Beklenen';
    case 'verificationType': return 'Kontrol Türü';
    case 'conditionType': return 'Koşul Türü';
    case 'duration': return getText('common.duration', 'Süre');
    case 'direction': return 'Yön';
    case 'amount': return 'Miktar';
    case 'key': return 'Tuş';
    case 'optionType': return 'Seçenek Türü';
    case 'optionValue': return 'Seçenek Değeri';
    case 'operator': return 'Operatör';
    default: return key;
  }
};

export const shouldShowConfigField = (step: ExecutionStepResult, key: string, value: any) => {
  // Internal fields
  if (key === 'id' || key === 'type' || key === 'x' || key === 'y') return false;
  if (key === 'trueConnection' || key === 'falseConnection' || key === 'connections') return false;
  if (!value || value === '') return false;
  
  // Ana açıklamada zaten belirtilen alanları atla
  if (step.type === 'input' || step.type === 'type') {
    if (key === 'value' || key === 'text' || key === 'target' || key === 'selector') return false;
  }
  if (step.type === 'click') {
    if (key === 'selector' || key === 'target') return false;
  }
  if (step.type === 'hover') {
    if (key === 'selector' || key === 'target') return false;
  }
  if (step.type === 'verify') {
    if (key === 'selector' || key === 'target') return false;
  }
  if (step.type === 'scroll') {
    if (key === 'selector' || key === 'target') return false;
  }
  if (step.type === 'key') {
    if (key === 'selector' || key === 'target' || key === 'key') return false;
  }
  if (step.type === 'dropdown') {
    if (key === 'selector' || key === 'target') return false;
  }
  if (step.type === 'navigate') {
    if (key === 'url') return false;
  }
  
  return true;
};
