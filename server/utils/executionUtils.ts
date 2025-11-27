/**
 * Execution utility functions for linear workflow execution
 */

interface ExecutionStep {
    status: 'passed' | 'failed' | 'running' | 'pending' | 'skipped';
    [key: string]: unknown;
}

/**
 * Calculate execution success rate
 * @param steps - Array of execution steps
 * @returns Success rate percentage
 */
function calculateSuccessRate(steps: ExecutionStep[]): number {
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
function hasFailedSteps(steps: ExecutionStep[]): boolean {
    if (!steps) return false;
    return steps.some(step => step.status === 'failed');
}

export {
    calculateSuccessRate,
    hasFailedSteps
};
