/**
 * Execution utility functions for linear workflow execution
 */

import { TestStep } from '@shared/types/index.js';

/**
 * Calculate execution success rate
 * @param steps - Array of execution steps
 * @returns Success rate percentage
 */
function calculateSuccessRate(steps: TestStep[]): number {
    if (!steps || steps.length === 0) return 0;
    const passedSteps = steps.filter(s => s.status === 'passed').length;
    const totalSteps = steps.length;
    return Math.round((passedSteps / totalSteps) * 100);
}

/**
 * Check if execution has failed steps
 * @param steps - Array of execution steps
 * @returns True if any step failed
 */
function hasFailedSteps(steps: TestStep[]): boolean {
    if (!steps) return false;
    return steps.some(step => step.status === 'failed');
}

export {
    calculateSuccessRate,
    hasFailedSteps
};
