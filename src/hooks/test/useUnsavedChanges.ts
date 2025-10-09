import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TestStep } from '@/types';
import { useI18n } from '@/contexts';

interface UseUnsavedChangesProps {
  testSteps: TestStep[];
  onSave?: () => Promise<void>;
}

interface UseUnsavedChangesReturn {
  hasUnsavedChanges: boolean;
  showUnsavedDialog: boolean;
  pendingNavigation: string | null;
  handleNavigation: (url: string) => void;
  confirmNavigation: () => void;
  cancelNavigation: () => void;
  saveAndNavigate: () => Promise<void>;
  markAsSaved: () => void;
  resetUnsavedChanges: () => void;
}

export const useUnsavedChanges = ({
  testSteps,
  onSave
}: UseUnsavedChangesProps): UseUnsavedChangesReturn => {
  const { t } = useI18n();
  const router = useRouter();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  
  // Başlangıç durumunu kaydet
  const initialStepsRef = useRef<TestStep[]>([]);
  const lastSavedStepsRef = useRef<TestStep[]>([]);
  const isInitialized = useRef(false);

  // Test steps değişikliklerini izle
  useEffect(() => {
    // İlk kez çalıştığında referansları başlat
    if (!isInitialized.current) {
      initialStepsRef.current = [...testSteps];
      lastSavedStepsRef.current = [...testSteps];
      isInitialized.current = true;
      
      // İlk durumda değişiklik yok
      setHasUnsavedChanges(false);
      return;
    }

    // Değişiklik kontrolü
    const stepsChanged = JSON.stringify(testSteps) !== JSON.stringify(lastSavedStepsRef.current);
    
    // Değişiklik var mı kontrol et
    setHasUnsavedChanges(stepsChanged);
  }, [testSteps]);

  // Not needed anymore - using resetUnsavedChanges instead

  // Navigation handler
  const handleNavigation = useCallback((url: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(url);
      setShowUnsavedDialog(true);
    } else {
      router.push(url);
    }
  }, [hasUnsavedChanges, router]);

  // Navigation onaylama
  const confirmNavigation = useCallback(() => {
    if (pendingNavigation) {
      setShowUnsavedDialog(false);
      setPendingNavigation(null);
      setHasUnsavedChanges(false);
      router.push(pendingNavigation);
    }
  }, [pendingNavigation, router]);

  // Navigation iptal etme
  const cancelNavigation = useCallback(() => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  }, []);

  // Kaydet ve navigation
  const saveAndNavigate = useCallback(async () => {
    if (onSave && pendingNavigation) {
      try {
        await onSave();
        lastSavedStepsRef.current = [...testSteps];
        setHasUnsavedChanges(false);
        setShowUnsavedDialog(false);
        router.push(pendingNavigation);
        setPendingNavigation(null);
      } catch (error) {
        console.error('Kaydetme hatası:', error);
        // Eğer kullanıcı save dialog'unu iptal ettiyse, UnsavedChanges dialog'unu da kapat
        if (error instanceof Error && error.message === 'Save canceled by user') {
          setShowUnsavedDialog(false);
          setPendingNavigation(null);
        }
        // Diğer hatalarda dialog açık kalır
      }
    }
  }, [onSave, pendingNavigation, testSteps, router]);

  // Manual olarak kaydedildi olarak işaretle
  const markAsSaved = useCallback(() => {
    lastSavedStepsRef.current = [...testSteps];
    setHasUnsavedChanges(false);
  }, [testSteps]);

  // Workflow yüklendiğinde unsaved changes'i sıfırla
  const resetUnsavedChanges = useCallback(() => {
    lastSavedStepsRef.current = [...testSteps];
    setHasUnsavedChanges(false);
  }, [testSteps]);

  // Browser navigation engelleme
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = t('unsavedChanges.browserWarning');
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    hasUnsavedChanges,
    showUnsavedDialog,
    pendingNavigation,
    handleNavigation,
    confirmNavigation,
    cancelNavigation,
    saveAndNavigate,
    markAsSaved,
    resetUnsavedChanges
  };
};

export default useUnsavedChanges;
