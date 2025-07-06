import { type ClassValue, clsx } from 'clsx';
import { TestStep, Test } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return 'Şimdi';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} dakika önce`;
  } else if (diffInHours < 24) {
    return `${diffInHours} saat önce`;
  } else if (diffInDays < 7) {
    return `${diffInDays} gün önce`;
  } else {
    return formatDate(date);
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'passed':
      return 'text-success-600 bg-success-50';
    case 'failed':
      return 'text-error-600 bg-error-50';
    case 'pending':
      return 'text-warning-600 bg-warning-50';
    case 'running':
      return 'text-primary-600 bg-primary-50';
    case 'active':
      return 'text-success-600 bg-success-50';
    case 'paused':
      return 'text-warning-600 bg-warning-50';
    case 'disabled':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'passed':
      return 'Başarılı';
    case 'failed':
      return 'Başarısız';
    case 'pending':
      return 'Beklemede';
    case 'running':
      return 'Çalışıyor';
    case 'active':
      return 'Aktif';
    case 'paused':
      return 'Duraklatıldı';
    case 'disabled':
      return 'Devre Dışı';
    default:
      return status;
  }
} 

// Test workflow import/export functions
export const exportTestWorkflow = (testSteps: TestStep[], fileName?: string) => {
  const workflow = {
    version: '1.0',
    name: fileName || 'test-workflow',
    createdAt: new Date().toISOString(),
    steps: testSteps.map(step => ({
      ...step,
      // Remove any UI-specific properties that shouldn't be exported
      x: step.x,
      y: step.y
    }))
  };

  const dataStr = JSON.stringify(workflow, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `${workflow.name}-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

export const importTestWorkflow = (file: File): Promise<{ steps: TestStep[]; name: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const workflow = JSON.parse(content);
        
        // Validate workflow structure
        if (!workflow.steps || !Array.isArray(workflow.steps)) {
          throw new Error('Geçersiz workflow dosyası: steps bulunamadı');
        }
        
        // Validate each step
        const validSteps = workflow.steps.filter((step: any) => {
          return step.id && step.type && typeof step.x === 'number' && typeof step.y === 'number';
        });
        
        if (validSteps.length === 0) {
          throw new Error('Geçersiz workflow dosyası: geçerli adım bulunamadı');
        }
        
        resolve({
          steps: validSteps,
          name: workflow.name || 'imported-workflow'
        });
      } catch (error) {
        reject(new Error(`Dosya okuma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Dosya okuma hatası'));
    };
    
    reader.readAsText(file);
  });
};

// Workflow validation helper
export const validateWorkflow = (steps: TestStep[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check for duplicate IDs
  const ids = steps.map(step => step.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    errors.push(`Duplicate step IDs found: ${duplicateIds.join(', ')}`);
  }
  
  // Check for invalid connections
  steps.forEach(step => {
    if (step.connections) {
      step.connections.forEach(connectionId => {
        if (!ids.includes(connectionId)) {
          errors.push(`Step ${step.id} has invalid connection: ${connectionId}`);
        }
      });
    }
    
    if (step.trueConnection && !ids.includes(step.trueConnection)) {
      errors.push(`Step ${step.id} has invalid true connection: ${step.trueConnection}`);
    }
    
    if (step.falseConnection && !ids.includes(step.falseConnection)) {
      errors.push(`Step ${step.id} has invalid false connection: ${step.falseConnection}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Workflow storage utilities
const WORKFLOWS_STORAGE_KEY = 'testflow_saved_workflows';

export const saveWorkflowToStorage = (workflow: {
  name: string;
  description: string;
  steps: TestStep[];
  tags?: string[];
  suite?: string;
  id?: string; // Düzenleme için mevcut ID
  enableScreenshots?: boolean;
  enableRecording?: boolean;
}): string => {
  try {
    const savedWorkflows = getSavedWorkflows();
    
    // Eğer ID varsa güncelleme modu
    if (workflow.id) {
      const existingIndex = savedWorkflows.findIndex(w => w.id === workflow.id);
      if (existingIndex !== -1) {
        // Mevcut workflow'u güncelle
        savedWorkflows[existingIndex] = {
          ...savedWorkflows[existingIndex],
          name: workflow.name,
          description: workflow.description,
          tags: workflow.tags || [],
          suite: workflow.suite || 'Default',
          workflow: workflow.steps,
          enableScreenshots: workflow.enableScreenshots || false,
          enableRecording: workflow.enableRecording || false,
          updatedAt: new Date()
        };
        
        localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(savedWorkflows));
        return workflow.id;
      }
    }
    
    // Yeni workflow oluştur
    const id = workflow.id || Math.random().toString(36).substr(2, 9);
    
    const newWorkflow: Test = {
      id,
      name: workflow.name,
      description: workflow.description,
      status: '' as any, // Boş status - kaydedilen workflow'lar için durum yok
      duration: 0, // Will be set when executed
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: workflow.tags || [],
      suite: workflow.suite || 'Default',
      workflow: workflow.steps,
      isExecutable: true,
      enableScreenshots: workflow.enableScreenshots || false,
      enableRecording: workflow.enableRecording || false
    };
    
    // Check for duplicate names (mevcut workflow'un kendisi hariç)
    const duplicateWorkflow = savedWorkflows.find(w => w.name === workflow.name && w.id !== id);
    if (duplicateWorkflow) {
      throw new Error(`"${workflow.name}" adında bir workflow zaten mevcut`);
    }
    
    savedWorkflows.push(newWorkflow);
    localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(savedWorkflows));
    
    return id;
  } catch (error) {
    throw new Error(`Workflow kaydedilemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
  }
};

export const getSavedWorkflows = (): Test[] => {
  try {
    const stored = localStorage.getItem(WORKFLOWS_STORAGE_KEY);
    if (!stored) return [];
    
    const workflows = JSON.parse(stored);
    
    // Convert date strings back to Date objects
    return workflows.map((workflow: any) => ({
      ...workflow,
      createdAt: new Date(workflow.createdAt),
      updatedAt: new Date(workflow.updatedAt)
    }));
  } catch (error) {
    console.error('Error loading saved workflows:', error);
    return [];
  }
};

export const getWorkflowById = (id: string): Test | null => {
  const workflows = getSavedWorkflows();
  return workflows.find(w => w.id === id) || null;
};

export const updateWorkflow = (id: string, updates: Partial<Test>): boolean => {
  try {
    const workflows = getSavedWorkflows();
    const index = workflows.findIndex(w => w.id === id);
    
    if (index === -1) {
      throw new Error('Workflow bulunamadı');
    }
    
    workflows[index] = {
      ...workflows[index],
      ...updates,
      updatedAt: new Date()
    };
    
    localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(workflows));
    return true;
  } catch (error) {
    console.error('Error updating workflow:', error);
    return false;
  }
};

export const deleteWorkflow = (id: string): boolean => {
  try {
    const workflows = getSavedWorkflows();
    const filteredWorkflows = workflows.filter(w => w.id !== id);
    
    if (workflows.length === filteredWorkflows.length) {
      throw new Error('Workflow bulunamadı');
    }
    
    localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(filteredWorkflows));
    return true;
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return false;
  }
};

export const duplicateWorkflow = (id: string, newName?: string): string | null => {
  try {
    const workflow = getWorkflowById(id);
    if (!workflow) {
      throw new Error('Workflow bulunamadı');
    }
    
    const duplicatedWorkflow = {
      name: newName || `${workflow.name} (Kopya)`,
      description: workflow.description,
      steps: workflow.workflow || [],
      tags: workflow.tags,
      suite: workflow.suite
    };
    
    return saveWorkflowToStorage(duplicatedWorkflow);
  } catch (error) {
    console.error('Error duplicating workflow:', error);
    return null;
  }
};

// Workflow validation for saved workflows
export const validateSavedWorkflow = (workflow: Test): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!workflow.name || workflow.name.trim().length === 0) {
    errors.push('Workflow adı gereklidir');
  }
  
  if (workflow.name && workflow.name.length > 100) {
    errors.push('Workflow adı 100 karakterden uzun olamaz');
  }
  
  if (!workflow.workflow || workflow.workflow.length === 0) {
    errors.push('Workflow en az bir test adımı içermelidir');
  }
  
  if (workflow.workflow) {
    const stepValidation = validateWorkflow(workflow.workflow);
    if (!stepValidation.isValid) {
      errors.push(...stepValidation.errors);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Export workflows for backup
export const exportAllWorkflows = (): void => {
  const workflows = getSavedWorkflows();
  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    workflows: workflows
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `testflow-workflows-backup-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

// Import workflows from backup
export const importWorkflowsFromBackup = (file: File): Promise<{ imported: number; skipped: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backupData = JSON.parse(content);
        
        if (!backupData.workflows || !Array.isArray(backupData.workflows)) {
          throw new Error('Geçersiz backup dosyası');
        }
        
        const existingWorkflows = getSavedWorkflows();
        const existingNames = new Set(existingWorkflows.map(w => w.name));
        
        let imported = 0;
        let skipped = 0;
        
        backupData.workflows.forEach((workflow: any) => {
          if (!existingNames.has(workflow.name)) {
            try {
              saveWorkflowToStorage({
                name: workflow.name,
                description: workflow.description,
                steps: workflow.workflow || [],
                tags: workflow.tags,
                suite: workflow.suite
              });
              imported++;
            } catch (error) {
              skipped++;
            }
          } else {
            skipped++;
          }
        });
        
        resolve({ imported, skipped });
      } catch (error) {
        reject(new Error(`Backup dosyası okuma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Dosya okuma hatası'));
    };
    
    reader.readAsText(file);
  });
}; 