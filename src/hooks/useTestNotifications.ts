import { useNotifications, useI18n } from '@/contexts';

function useTestNotifications() {
  const { addNotification, showToast } = useNotifications();
  const { t } = useI18n();

  const notifyTestStart = (testName: string, testId: string) => {
    showToast({
      type: 'info',
      title: t('notifications.testStart'),
      message: t('notifications.testStartMessage', { testName }),
      testId,
      autoClose: true,
      duration: 3000
    });

    addNotification({
      type: 'info',
      title: t('notifications.testStart'),
      message: t('notifications.testStartMessage', { testName }),
      testId,
      persistent: true
    });
  };

  const notifyTestSuccess = (testName: string, testId: string, duration?: number, executionId?: string) => {
    const durationText = duration ? t('notifications.withDuration', { duration: (duration / 1000).toFixed(1) }) : '';
    
    showToast({
      type: 'success',
      title: t('notifications.testSuccess'),
      message: t('notifications.testSuccessMessage', { testName }) + durationText,
      testId,
      executionId,
      autoClose: true,
      duration: 5000
    });

    addNotification({
      type: 'success',
      title: t('notifications.testSuccess'),
      message: t('notifications.testSuccessMessage', { testName }) + durationText,
      testId,
      executionId,
      persistent: true
    });
  };

  const notifyTestFailure = (testName: string, testId: string, error?: string, duration?: number, executionId?: string) => {
    const durationText = duration ? t('notifications.withDuration', { duration: (duration / 1000).toFixed(1) }) : '';
    const errorText = error ? t('notifications.withError', { error }) : '';
    
    showToast({
      type: 'error',
      title: t('notifications.testFailed'),
      message: t('notifications.testFailedMessage', { testName }) + durationText + errorText,
      testId,
      executionId,
      autoClose: true,  // Hata bildirimleri de otomatik kaybolsun
      duration: 8000   // Hata bildirimleri için biraz daha uzun süre
    });

    addNotification({
      type: 'error',
      title: t('notifications.testFailed'),
      message: t('notifications.testFailedMessage', { testName }) + durationText + errorText,
      testId,
      executionId,
      persistent: true
    });
  };

  const notifyTestSaved = (testName: string, testId: string) => {
    showToast({
      type: 'success',
      title: t('notifications.testSaved'),
      message: t('notifications.testSavedMessage', { testName }),
      testId,
      autoClose: true,
      duration: 3000
    });
  };

  const notifyTestScheduled = (testName: string, testId: string, scheduleTime: string) => {
    showToast({
      type: 'info',
      title: t('notifications.testScheduled'),
      message: t('notifications.testScheduledMessage', { testName, scheduleTime }),
      testId,
      autoClose: true,
      duration: 4000
    });

    addNotification({
      type: 'info',
      title: t('notifications.testScheduled'),
      message: t('notifications.testScheduledMessage', { testName, scheduleTime }),
      testId,
      persistent: true
    });
  };

  const notifyTestImported = (testName: string, testId: string) => {
    showToast({
      type: 'success',
      title: t('notifications.testImported'),
      message: t('notifications.testImportedMessage', { testName }),
      testId,
      autoClose: true,
      duration: 3000
    });
  };

  const notifyExecutionStart = (workflowName: string, executionId: string) => {
    showToast({
      type: 'info',
      title: t('notifications.executionStarted'),
      message: t('notifications.executionStartedMessage', { workflowName }),
      executionId,
      autoClose: true,
      duration: 3000
    });

    addNotification({
      type: 'info',
      title: t('notifications.executionStarted'),
      message: t('notifications.executionStartedMessage', { workflowName }),
      executionId,
      persistent: true
    });
  };

  const notifyExecutionComplete = (workflowName: string, executionId: string, status: 'completed' | 'failed', duration?: number) => {
    const durationText = duration ? t('notifications.withDuration', { duration: (duration / 1000).toFixed(1) }) : '';
    const isSuccess = status === 'completed';
    
    showToast({
      type: isSuccess ? 'success' : 'error',
      title: isSuccess ? t('notifications.executionCompleted') : t('notifications.executionFailed'),
      message: (isSuccess ? t('notifications.executionCompletedMessage', { workflowName }) : t('notifications.executionFailedMessage', { workflowName })) + durationText,
      executionId,
      autoClose: true,  // Hem başarılı hem başarısız execution'lar otomatik kaybolsun
      duration: isSuccess ? 5000 : 8000  // Hata bildirimleri için biraz daha uzun süre
    });

    addNotification({
      type: isSuccess ? 'success' : 'error',
      title: isSuccess ? t('notifications.executionCompleted') : t('notifications.executionFailed'),
      message: (isSuccess ? t('notifications.executionCompletedMessage', { workflowName }) : t('notifications.executionFailedMessage', { workflowName })) + durationText,
      executionId,
      persistent: true
    });
  };

  const notifyTestDeleted = (testName: string, testId: string) => {
    showToast({
      type: 'info',
      title: t('notifications.testDeleted'),
      message: t('notifications.testDeletedMessage', { testName }),
      testId,
      autoClose: true,
      duration: 3000
    });
    addNotification({
      type: 'info',
      title: t('notifications.testDeleted'),
      message: t('notifications.testDeletedMessage', { testName }),
      testId,
      persistent: true
    });
  };

  const notifyTestDuplicated = (testName: string, testId: string) => {
    showToast({
      type: 'success',
      title: t('notifications.testDuplicated'),
      message: t('notifications.testDuplicatedMessage', { testName }),
      testId,
      autoClose: true,
      duration: 3000
    });
  };

  const notifyWorkflowLoaded = (workflowName: string) => {
    showToast({
      type: 'success',
      title: t('notifications.workflowLoaded'),
      message: t('notifications.workflowLoadedMessage', { workflowName }),
      autoClose: true,
      duration: 3000
    });
  };

  return {
    notifyTestStart,
    notifyTestSuccess,
    notifyTestFailure,
    notifyTestSaved,
    notifyTestScheduled,
    notifyTestImported,
    notifyExecutionStart,
    notifyExecutionComplete,
    notifyTestDeleted,
    notifyTestDuplicated,
    notifyWorkflowLoaded
  };
}

export default useTestNotifications;
