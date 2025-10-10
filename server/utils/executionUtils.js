/**
 * Execution utility functions
 */

/**
 * Find start step index in execution steps
 * @param {Array} steps - Array of execution steps
 * @returns {number} Index of start step
 */
function findStartStepIndex(steps) {
  const hasIncomingConnection = new Set();
  
  steps.forEach(step => {
    // Check normal connections
    if (step.config.connections) {
      step.config.connections.forEach(targetId => hasIncomingConnection.add(targetId));
    }
    // Check IF connections
    if (step.config.trueConnection) {
      hasIncomingConnection.add(step.config.trueConnection);
    }
    if (step.config.falseConnection) {
      hasIncomingConnection.add(step.config.falseConnection);
    }
  });
  
  // Find start step index
  for (let idx = 0; idx < steps.length; idx++) {
    if (!hasIncomingConnection.has(steps[idx].stepId)) {
      return idx;
    }
  }
  
  return 0; // Default to first step if no start step found
}

/**
 * Build step map for conditional navigation
 * @param {Array} steps - Array of execution steps
 * @returns {Map} Step map with stepId as key and index as value
 */
function buildStepMap(steps) {
  const stepMap = new Map();
  steps.forEach((step, index) => {
    stepMap.set(step.stepId, index);
  });
  return stepMap;
}

/**
 * Determine next step based on step type and connections
 * @param {Object} step - Current step
 * @param {boolean} conditionResult - Result of IF condition (if applicable)
 * @returns {string|null} Next step ID or null
 */
function getNextStepId(step, conditionResult = null) {
  // Handle IF step conditional navigation
  if (step.type === 'if' && conditionResult !== undefined) {
    return conditionResult 
      ? step.config.trueConnection 
      : step.config.falseConnection;
  }
  // Handle normal connections (non-IF steps)
  else if (step.type !== 'if' && step.config.connections && step.config.connections.length > 0) {
    return step.config.connections[0]; // Take first connection
  }
  
  return null; // No more steps
}

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

module.exports = {
  findStartStepIndex,
  buildStepMap,
  getNextStepId,
  calculateSuccessRate,
  hasFailedSteps
};
