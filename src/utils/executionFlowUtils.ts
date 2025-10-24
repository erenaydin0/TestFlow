'use client';

import { ExecutionResult } from '@/types';

/**
 * Execution path'ini hesaplar - adımların çalışma sırasını belirler
 */
export const getExecutionPath = (execution: ExecutionResult): string[] => {
  const path: string[] = [];
  const stepMap = new Map();
  execution.steps.forEach((step, index) => {
    stepMap.set(step.stepId, { step, index });
  });

  // Find start step (step with no incoming connections)
  const hasIncomingConnection = new Set();
  execution.steps.forEach(step => {
    if (step.config.connections) {
      step.config.connections.forEach((targetId: string) => hasIncomingConnection.add(targetId));
    }
    if (step.config.trueConnection) {
      hasIncomingConnection.add(step.config.trueConnection);
    }
    if (step.config.falseConnection) {
      hasIncomingConnection.add(step.config.falseConnection);
    }
  });

  let currentStepId = execution.steps.find(s => !hasIncomingConnection.has(s.stepId))?.stepId;
  const visitedSteps = new Set();
  const maxIterations = execution.steps.length * 10;
  let iterations = 0;

  while (currentStepId && iterations < maxIterations) {
    iterations++;
    
    if (visitedSteps.has(currentStepId)) {
      break; // Prevent infinite loops
    }
    visitedSteps.add(currentStepId);
    path.push(currentStepId);

    const currentStepData = stepMap.get(currentStepId);
    if (!currentStepData) break;

    const { step } = currentStepData;
    
    // Determine next step based on step type and connections
    let nextStepId = null;
    
    // Handle IF step conditional navigation
    if (step.type === 'if' && step.conditionResult !== undefined) {
      // Gerçek koşul sonucuna göre yön belirle
      nextStepId = step.conditionResult 
        ? step.config.trueConnection 
        : step.config.falseConnection;
    }
    // Handle normal connections (non-IF steps)
    else if (step.type !== 'if' && step.config.connections && step.config.connections.length > 0) {
      nextStepId = step.config.connections[0];
    }

    currentStepId = nextStepId;
  }

  return path;
};

/**
 * Koşul sonuçlarını hesaplar
 */
export const getConditionResults = (execution: ExecutionResult): Map<string, boolean> => {
  const results = new Map<string, boolean>();
  
  // Gerçek conditionResult'ı kullan
  execution.steps.forEach(step => {
    if (step.type === 'if' && step.conditionResult !== undefined) {
      results.set(step.stepId, step.conditionResult);
    }
  });

  return results;
};

/**
 * Execution flow metriklerini hesaplar
 */
export const calculateFlowMetrics = (execution: ExecutionResult) => {
  const path = getExecutionPath(execution);
  const conditionResults = getConditionResults(execution);
  
  const totalSteps = execution.steps.length;
  const executedSteps = path.length;
  const skippedSteps = totalSteps - executedSteps;
  
  const ifSteps = execution.steps.filter(step => step.type === 'if');
  const trueConditions = Array.from(conditionResults.values()).filter(result => result).length;
  const falseConditions = Array.from(conditionResults.values()).filter(result => !result).length;
  
  const avgStepDuration = execution.steps
    .filter(step => step.duration)
    .reduce((sum, step) => sum + (step.duration || 0), 0) / 
    execution.steps.filter(step => step.duration).length || 0;
  
  const maxStepDuration = Math.max(
    ...execution.steps
      .filter(step => step.duration)
      .map(step => step.duration || 0),
    0
  );
  
  return {
    totalSteps,
    executedSteps,
    skippedSteps,
    executionRate: totalSteps > 0 ? (executedSteps / totalSteps) * 100 : 0,
    ifStepsCount: ifSteps.length,
    trueConditions,
    falseConditions,
    avgStepDuration: Math.round(avgStepDuration),
    maxStepDuration,
    pathLength: path.length,
    hasLoops: path.length !== new Set(path).size
  };
};

/**
 * Execution'ın başarı durumunu analiz eder
 */
export const analyzeExecutionSuccess = (execution: ExecutionResult) => {
  const metrics = calculateFlowMetrics(execution);
  const path = getExecutionPath(execution);
  
  const failedSteps = execution.steps.filter(step => step.status === 'failed');
  const passedSteps = execution.steps.filter(step => step.status === 'passed');
  
  const criticalFailures = failedSteps.filter(step => 
    ['navigate', 'click', 'input', 'verify'].includes(step.type)
  );
  
  const hasCriticalFailure = criticalFailures.length > 0;
  const hasNonCriticalFailure = failedSteps.length > criticalFailures.length;
  
  return {
    overallSuccess: execution.status === 'completed',
    hasCriticalFailure,
    hasNonCriticalFailure,
    criticalFailureCount: criticalFailures.length,
    nonCriticalFailureCount: failedSteps.length - criticalFailures.length,
    totalFailures: failedSteps.length,
    totalPassed: passedSteps.length,
    successRate: execution.successRate || 0,
    executionQuality: metrics.executionRate,
    flowEfficiency: path.length / execution.steps.length,
    recommendations: generateRecommendations(metrics, hasCriticalFailure, criticalFailures)
  };
};

/**
 * Execution için öneriler oluşturur
 */
const generateRecommendations = (
  metrics: any, 
  hasCriticalFailure: boolean, 
  criticalFailures: any[]
) => {
  const recommendations: string[] = [];
  
  if (hasCriticalFailure) {
    recommendations.push('Kritik adımlarda hata var - test senaryosunu gözden geçirin');
  }
  
  if (metrics.executionRate < 80) {
    recommendations.push('Düşük execution rate - koşullu adımları kontrol edin');
  }
  
  if (metrics.hasLoops) {
    recommendations.push('Sonsuz döngü tespit edildi - bağlantıları kontrol edin');
  }
  
  if (metrics.avgStepDuration > 5000) {
    recommendations.push('Adım süreleri uzun - selector\'ları optimize edin');
  }
  
  if (criticalFailures.some(f => f.type === 'verify')) {
    recommendations.push('Doğrulama adımlarında hata - beklenen değerleri kontrol edin');
  }
  
  return recommendations;
};

/**
 * Execution path'ini görselleştirmek için veri hazırlar
 */
export const preparePathVisualization = (execution: ExecutionResult) => {
  const path = getExecutionPath(execution);
  const conditionResults = getConditionResults(execution);
  
  return execution.steps.map(step => {
    const isInPath = path.includes(step.stepId);
    const isConditional = step.type === 'if';
    const conditionResult = conditionResults.get(step.stepId);
    
    return {
      stepId: step.stepId,
      type: step.type,
      status: step.status,
      isInPath,
      isConditional,
      conditionResult,
      duration: step.duration,
      error: step.error,
      config: step.config
    };
  });
};
