/**
 * Timestamp utility functions
 */

/**
 * Generate readable execution ID based on workflow name
 * @param workflowName - Name of the workflow
 * @param workflowId - ID of the workflow
 * @param baseTimestamp - Base timestamp to use
 * @returns Generated execution ID
 */
function generateReadableExecutionId(workflowName: string, workflowId: string, baseTimestamp: Date): string {
    const year = baseTimestamp.getFullYear();
    const month = String(baseTimestamp.getMonth() + 1).padStart(2, '0');
    const day = String(baseTimestamp.getDate()).padStart(2, '0');
    const hours = String(baseTimestamp.getHours()).padStart(2, '0');
    const minutes = String(baseTimestamp.getMinutes()).padStart(2, '0');
    const seconds = String(baseTimestamp.getSeconds()).padStart(2, '0');

    const localTimestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;

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
 * @param testId - Test ID
 * @param baseTimestamp - Base timestamp to use
 * @returns Generated execution ID
 */
function generateScheduledExecutionId(testId: string, baseTimestamp: Date): string {
    const year = baseTimestamp.getFullYear();
    const month = String(baseTimestamp.getMonth() + 1).padStart(2, '0');
    const day = String(baseTimestamp.getDate()).padStart(2, '0');
    const hours = String(baseTimestamp.getHours()).padStart(2, '0');
    const minutes = String(baseTimestamp.getMinutes()).padStart(2, '0');
    const seconds = String(baseTimestamp.getSeconds()).padStart(2, '0');

    const localTimestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;

    return `scheduled-${testId.slice(0, 8)}-${localTimestamp}`;
}

export {
    generateReadableExecutionId,
    generateScheduledExecutionId
};
