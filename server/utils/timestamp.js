/**
 * Timestamp utility functions
 */

/**
 * Generate readable execution ID based on workflow name
 * @param {string} workflowName - Name of the workflow
 * @param {string} workflowId - ID of the workflow
 * @param {Date} baseTimestamp - Base timestamp to use
 * @returns {string} Generated execution ID
 */
function generateReadableExecutionId(workflowName, workflowId, baseTimestamp) {
  // Local timezone'da timestamp oluştur (UTC+3)
  const localTimestamp = baseTimestamp.toLocaleString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/[.\s]/g, '').replace(/(\d{2})(\d{2})(\d{4})(\d{2})(\d{2})(\d{2})/, '$3$2$1$4$5$6');
  
  if (workflowId && workflowId !== 'manual' && !workflowId.includes('-') === false) {
    // Use existing readable ID + timestamp
    return `${workflowId}-${localTimestamp}`;
  }
  // Fallback to name-based ID
  const cleanName = workflowName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20) || 'test';
  return `${cleanName}-${localTimestamp}`;
}

/**
 * Generate scheduled test execution ID
 * @param {string} testId - Test ID
 * @param {Date} baseTimestamp - Base timestamp to use
 * @returns {string} Generated execution ID
 */
function generateScheduledExecutionId(testId, baseTimestamp) {
  const localTimestamp = baseTimestamp.toLocaleString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/[.\s]/g, '').replace(/(\d{2})(\d{2})(\d{4})(\d{2})(\d{2})(\d{2})/, '$3$2$1$4$5$6');
  
  return `scheduled-${testId.slice(0, 8)}-${localTimestamp}`;
}

module.exports = {
  generateReadableExecutionId,
  generateScheduledExecutionId
};
