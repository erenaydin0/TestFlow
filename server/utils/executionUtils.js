/**
 * Execution utility functions for linear workflow execution
 */

/**
 * Calculate execution success rate
 * @param {Array} steps - Array of execution steps
 * @returns {number} Success rate percentage
 */
function calculateSuccessRate(steps) {
  const passedSteps = steps.filter(s => s.status === 'passed').length;
  const totalSteps = steps.length;
  return Math.round((passedSteps / totalSteps) * 100);
}

/**
 * Check if execution has failed steps
 * @param {Array} steps - Array of execution steps
 * @returns {boolean} True if any step failed
 */
function hasFailedSteps(steps) {
  return steps.some(step => step.status === 'failed');
}

export {
  calculateSuccessRate,
  hasFailedSteps
};
