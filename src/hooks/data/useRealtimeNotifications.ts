'use client';

import { useEffect, useRef } from 'react';
import { useWebSocket } from '@/hooks/network';
import { useTestNotifications } from '@/hooks/test';

function useRealtimeNotifications() {
  const { 
    notifyExecutionStart, 
    notifyExecutionComplete, 
    notifyTestSuccess, 
    notifyTestFailure 
  } = useTestNotifications();

  // WebSocket bağlantısını sadece browser'da dene
  const wsUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001') : '';
  const { isConnected, isConnecting, lastMessage, connect } = useWebSocket(wsUrl, {
    autoConnect: typeof window !== 'undefined',
    reconnectAttempts: 5,
    reconnectInterval: 3000 // 3 saniye bekle
  });

  // Connection durumunu logla
  useEffect(() => {
    // console.log('WebSocket connection status:', { isConnected, isConnecting });
  }, [isConnected, isConnecting]);

  // Processed message IDs to prevent duplicates (executionId + type based)
  const processedMessageIds = useRef(new Set<string>());
  
  // Track execution states to prevent duplicate notifications
  const executionStates = useRef(new Map<string, Set<string>>());
  
  // Track last processed message to prevent rapid duplicates
  const lastProcessedMessage = useRef<string | null>(null);

  useEffect(() => {
    if (!lastMessage) return;

    // Create a unique ID for this message (without timestamp to prevent duplicates)
    const messageId = `${lastMessage.type}-${lastMessage.data.executionId}`;
    
    // Skip if this is the exact same message as the last one
    if (lastProcessedMessage.current === messageId) {
      return; // Silent skip for rapid duplicates
    }
    
    // Skip if already processed
    if (processedMessageIds.current.has(messageId)) {
      return; // Silent skip for already processed messages
    }
    
    // Mark as processed
    processedMessageIds.current.add(messageId);
    lastProcessedMessage.current = messageId;
    
    // Clean old message IDs (keep only last 20)
    if (processedMessageIds.current.size > 20) {
      const idsArray = Array.from(processedMessageIds.current);
      processedMessageIds.current.clear();
      idsArray.slice(-10).forEach(id => processedMessageIds.current.add(id));
    }

    // console.log('Processing WebSocket message:', messageId, lastMessage);

    try {
      switch (lastMessage.type) {
        case 'execution:started':
          // Backend'den gelen execution:started mesajı
          console.log('Execution started message:', lastMessage.data);
          
          const executionId = lastMessage.data.executionId;
          if (!executionId) break;
          
          // Check if already notified for this execution
          if (!executionStates.current.has(executionId)) {
            executionStates.current.set(executionId, new Set());
          }
          
          const states = executionStates.current.get(executionId)!;
          if (states.has('started')) {
            console.log('Already notified start for execution:', executionId);
            break;
          }
          
          states.add('started');
          
          if (lastMessage.data.execution) {
            // Sadece test başlatıldı bildirimi gönder, execution bildirimi gönderme
            // notifyExecutionStart(lastMessage.data.execution.workflowName, executionId);
          } else {
            // Fallback: execution objesi yoksa hiç bildirim gönderme
            // notifyExecutionStart('Test Execution', executionId);
          }
          break;

      case 'step:started':
        // Step başladığında sadece console log - bildirim gönderme
        console.log(`Step started: ${lastMessage.data.step?.type} in execution ${lastMessage.data.executionId}`);
        break;

      case 'step:completed':
        // Step tamamlandığında sadece console log - bildirim gönderme
        console.log(`Step completed: Progress ${lastMessage.data.progress}% in execution ${lastMessage.data.executionId}`);
        break;

      case 'step:failed':
        // Step başarısız olduğunda sadece console log - bildirim gönderme
        console.warn(`Step failed: ${lastMessage.data.error} in execution ${lastMessage.data.executionId}`);
        break;

        case 'execution:completed':
          // Execution başarılı tamamlandığında
          console.log('Execution completed message:', lastMessage.data);
          
          const completedExecutionId = lastMessage.data.executionId;
          if (!completedExecutionId) break;
          
          // Check if already notified completion for this execution
          if (!executionStates.current.has(completedExecutionId)) {
            executionStates.current.set(completedExecutionId, new Set());
          }
          
          const completedStates = executionStates.current.get(completedExecutionId)!;
          if (completedStates.has('completed')) {
            console.log('Already notified completion for execution:', completedExecutionId);
            break;
          }
          
          completedStates.add('completed');
          
          // Clean up all messages for this execution to prevent further duplicates
          const completedExecutionMessagePrefix = `-${completedExecutionId}`;
          const completedMessagesToRemove = Array.from(processedMessageIds.current)
            .filter(id => id.includes(completedExecutionMessagePrefix));
          completedMessagesToRemove.forEach(id => processedMessageIds.current.delete(id));
          
          if (lastMessage.data.execution) {
            const completedExecution = lastMessage.data.execution;
            const duration = completedExecution.endTime && completedExecution.startTime 
              ? new Date(completedExecution.endTime).getTime() - new Date(completedExecution.startTime).getTime()
              : undefined;
            
            notifyTestSuccess(
              completedExecution.workflowName, 
              completedExecutionId, 
              duration
            );
            // Execution complete bildirimi kaldırıldı
            // notifyExecutionComplete(
            //   completedExecution.workflowName,
            //   completedExecutionId,
            //   'completed',
            //   duration
            // );
          } else {
            // Fallback
            notifyTestSuccess('Test Execution', completedExecutionId);
            // Execution complete bildirimi kaldırıldı
            // notifyExecutionComplete('Test Execution', completedExecutionId, 'completed');
          }
          break;

        case 'execution:failed':
          // Execution başarısız olduğunda
          console.log('Execution failed message:', lastMessage.data);
          
          const failedExecutionId = lastMessage.data.executionId;
          if (!failedExecutionId) break;
          
          // Check if already notified failure for this execution
          if (!executionStates.current.has(failedExecutionId)) {
            executionStates.current.set(failedExecutionId, new Set());
          }
          
          const failedStates = executionStates.current.get(failedExecutionId)!;
          if (failedStates.has('failed')) {
            console.log('Already notified failure for execution:', failedExecutionId);
            break;
          }
          
          failedStates.add('failed');
          
          // Clean up all messages for this execution to prevent further duplicates
          const failedExecutionMessagePrefix = `-${failedExecutionId}`;
          const failedMessagesToRemove = Array.from(processedMessageIds.current)
            .filter(id => id.includes(failedExecutionMessagePrefix));
          failedMessagesToRemove.forEach(id => processedMessageIds.current.delete(id));
          
          if (lastMessage.data.execution) {
            const failedExecution = lastMessage.data.execution;
            const duration = failedExecution.endTime && failedExecution.startTime 
              ? new Date(failedExecution.endTime).getTime() - new Date(failedExecution.startTime).getTime()
              : undefined;
            
            notifyTestFailure(
              failedExecution.workflowName, 
              failedExecutionId, 
              lastMessage.data.error || failedExecution.error,
              duration
            );
            // Execution complete bildirimi kaldırıldı
            // notifyExecutionComplete(
            //   failedExecution.workflowName,
            //   failedExecutionId,
            //   'failed',
            //   duration
            // );
          } else {
            // Fallback
            notifyTestFailure('Test Execution', failedExecutionId, lastMessage.data.error || 'Unknown error');
            // Execution complete bildirimi kaldırıldı
            // notifyExecutionComplete('Test Execution', failedExecutionId, 'failed');
          }
          break;

        case 'execution:cancelled':
          // Execution iptal edildiğinde
          console.log('Execution cancelled message:', lastMessage.data);
          
          if (lastMessage.data.execution) {
            notifyTestFailure(
              lastMessage.data.execution.workflowName, 
              lastMessage.data.executionId, 
              'Test iptal edildi'
            );
          } else if (lastMessage.data.executionId) {
            // Fallback
            notifyTestFailure('Test Execution', lastMessage.data.executionId, 'Test iptal edildi');
          }
          break;

        case 'execution:deleted':
          // Execution silindiğinde
          console.log(`Execution deleted: ${lastMessage.data?.executionId || 'unknown'}`);
          break;

        default:
          console.log('Unknown WebSocket message type:', lastMessage.type, lastMessage.data);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      console.error('Message was:', lastMessage);
    }
  }, [lastMessage, notifyExecutionStart, notifyExecutionComplete, notifyTestSuccess, notifyTestFailure]);

  // Clean up old execution states periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (executionStates.current.size > 50) {
        // Keep only the last 25 executions
        const entries = Array.from(executionStates.current.entries());
        executionStates.current.clear();
        entries.slice(-25).forEach(([key, value]) => {
          executionStates.current.set(key, value);
        });
      }
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  return {
    isConnected,
    isConnecting,
    lastMessage,
    reconnect: connect
  };
}

export default useRealtimeNotifications;
