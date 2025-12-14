/**
 * Generic bulk operation utility
 * Executes multiple operations in parallel and returns count of successful operations
 */

/**
 * Executes bulk operations and returns count of successful operations
 * @param ids Array of IDs to process
 * @param operationFn Function to execute for each ID
 * @param resultKey Key name for the result count (e.g., 'deletedCount', 'duplicatedCount')
 * @returns Object with count of successful operations
 */
export async function executeBulkOperation<T = void, R extends string = 'count'>(
  ids: string[],
  operationFn: (id: string) => Promise<T>,
  resultKey: R = 'count' as R
): Promise<{ [K in R]: number }> {
  const operationPromises = ids.map(id => operationFn(id));
  const results = await Promise.allSettled(operationPromises);
  
  const successCount = results.filter(result => result.status === 'fulfilled').length;
  
  return { [resultKey]: successCount } as { [K in R]: number };
}
