import { useNotifications } from '@/lib/notification-context';

export function useTestNotifications() {
  const { addNotification, showToast } = useNotifications();

  const notifyTestStart = (testName: string, testId: string) => {
    showToast({
      type: 'info',
      title: 'Test Başlatıldı',
      message: `"${testName}" testi çalışmaya başladı`,
      testId,
      autoClose: true,
      duration: 3000
    });

    addNotification({
      type: 'info',
      title: 'Test Başlatıldı',
      message: `"${testName}" testi çalışmaya başladı`,
      testId,
      persistent: true
    });
  };

  const notifyTestSuccess = (testName: string, testId: string, duration?: number) => {
    const durationText = duration ? ` (${(duration / 1000).toFixed(1)}s)` : '';
    
    showToast({
      type: 'success',
      title: 'Test Başarılı',
      message: `"${testName}" testi başarıyla tamamlandı${durationText}`,
      testId,
      autoClose: true,
      duration: 5000
    });

    addNotification({
      type: 'success',
      title: 'Test Başarılı',
      message: `"${testName}" testi başarıyla tamamlandı${durationText}`,
      testId,
      persistent: true
    });
  };

  const notifyTestFailure = (testName: string, testId: string, error?: string, duration?: number) => {
    const durationText = duration ? ` (${(duration / 1000).toFixed(1)}s)` : '';
    const errorText = error ? `: ${error}` : '';
    
    showToast({
      type: 'error',
      title: 'Test Başarısız',
      message: `"${testName}" testi başarısız oldu${durationText}${errorText}`,
      testId,
      autoClose: false,  // Hata bildirimleri otomatik kapanmasın
      duration: 10000
    });

    addNotification({
      type: 'error',
      title: 'Test Başarısız',
      message: `"${testName}" testi başarısız oldu${durationText}${errorText}`,
      testId,
      persistent: true
    });
  };

  const notifyTestSaved = (testName: string, testId: string) => {
    showToast({
      type: 'success',
      title: 'Test Kaydedildi',
      message: `"${testName}" testi başarıyla kaydedildi`,
      testId,
      autoClose: true,
      duration: 3000
    });
  };

  const notifyTestScheduled = (testName: string, testId: string, scheduleTime: string) => {
    showToast({
      type: 'info',
      title: 'Test Zamanlandı',
      message: `"${testName}" testi ${scheduleTime} için zamanlandı`,
      testId,
      autoClose: true,
      duration: 4000
    });

    addNotification({
      type: 'info',
      title: 'Test Zamanlandı',
      message: `"${testName}" testi ${scheduleTime} için zamanlandı`,
      testId,
      persistent: true
    });
  };

  const notifyTestImported = (testName: string, testId: string) => {
    showToast({
      type: 'success',
      title: 'Test İçe Aktarıldı',
      message: `"${testName}" testi başarıyla içe aktarıldı`,
      testId,
      autoClose: true,
      duration: 3000
    });
  };

  const notifyExecutionStart = (workflowName: string, executionId: string) => {
    showToast({
      type: 'info',
      title: 'Execution Başlatıldı',
      message: `"${workflowName}" execution başlatıldı`,
      executionId,
      autoClose: true,
      duration: 3000
    });

    addNotification({
      type: 'info',
      title: 'Execution Başlatıldı',
      message: `"${workflowName}" execution başlatıldı`,
      executionId,
      persistent: true
    });
  };

  const notifyExecutionComplete = (workflowName: string, executionId: string, status: 'completed' | 'failed', duration?: number) => {
    const durationText = duration ? ` (${(duration / 1000).toFixed(1)}s)` : '';
    const isSuccess = status === 'completed';
    
    showToast({
      type: isSuccess ? 'success' : 'error',
      title: isSuccess ? 'Execution Tamamlandı' : 'Execution Başarısız',
      message: `"${workflowName}" execution ${isSuccess ? 'başarıyla tamamlandı' : 'başarısız oldu'}${durationText}`,
      executionId,
      autoClose: isSuccess,
      duration: isSuccess ? 5000 : 10000
    });

    addNotification({
      type: isSuccess ? 'success' : 'error',
      title: isSuccess ? 'Execution Tamamlandı' : 'Execution Başarısız',
      message: `"${workflowName}" execution ${isSuccess ? 'başarıyla tamamlandı' : 'başarısız oldu'}${durationText}`,
      executionId,
      persistent: true
    });
  };

  const notifyTestDeleted = (testName: string, testId: string) => {
    showToast({
      type: 'info',
      title: 'Test Silindi',
      message: `"${testName}" testi silindi`,
      testId,
      autoClose: true,
      duration: 3000
    });
    addNotification({
      type: 'info',
      title: 'Test Silindi',
      message: `"${testName}" testi silindi`,
      testId,
      persistent: true
    });
  };

  const notifyTestDuplicated = (testName: string, testId: string) => {
    showToast({
      type: 'success',
      title: 'Test Kopyalandı',
      message: `"${testName}" testi kopyalandı`,
      testId,
      autoClose: true,
      duration: 3000
    });
  };

  const notifyWorkflowLoaded = (workflowName: string) => {
    showToast({
      type: 'success',
      title: 'Workflow Yüklendi',
      message: `"${workflowName}" workflow'u yüklendi!`,
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
