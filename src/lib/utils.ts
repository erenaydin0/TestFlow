import { type ClassValue, clsx } from 'clsx';
import { TestStep, Test, BrowserType } from '@/types';

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

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) {
    return 'Bilinmiyor';
  }

  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(parsedDate.getTime())) {
    return 'Geçersiz tarih';
  }

  const now = new Date();
  const diffInMs = now.getTime() - parsedDate.getTime();
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
    return formatDate(parsedDate);
  }
}


// Test workflow import/export functions
export const exportTestWorkflow = (
  testSteps: TestStep[], 
  fileName?: string, 
  metadata?: {
    description?: string;
    tags?: string[];
    suite?: string;
    browserType?: BrowserType;
    enableScreenshots?: boolean;
    enableRecording?: boolean;
    headlessMode?: boolean;
  }
) => {
  const workflow = {
    version: '1.1', // Updated version to support metadata
    name: fileName || 'test-workflow',
    description: metadata?.description || '',
    createdAt: new Date().toISOString(),
    metadata: {
      tags: metadata?.tags || [],
      suite: metadata?.suite || 'Default',
      browserType: metadata?.browserType || 'chromium',
      enableScreenshots: metadata?.enableScreenshots || false,
      enableRecording: metadata?.enableRecording || false,
      headlessMode: metadata?.headlessMode || false
    },
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

export const importTestWorkflow = (file: File): Promise<{ 
  steps: TestStep[]; 
  name: string;
  metadata?: {
    description?: string;
    tags?: string[];
    suite?: string;
    browserType?: BrowserType;
    enableScreenshots?: boolean;
    enableRecording?: boolean;
    headlessMode?: boolean;
  };
}> => {
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
          name: workflow.name || 'imported-workflow',
          metadata: {
            description: workflow.description || '',
            tags: workflow.metadata?.tags || workflow.tags || [],
            suite: workflow.metadata?.suite || workflow.suite || 'Default',
            browserType: workflow.metadata?.browserType || workflow.browserType || 'chromium',
            enableScreenshots: workflow.metadata?.enableScreenshots || workflow.enableScreenshots || false,
            enableRecording: workflow.metadata?.enableRecording || workflow.enableRecording || false,
            headlessMode: workflow.metadata?.headlessMode || workflow.headlessMode || false
          }
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

// ID generation utility
export const generateReadableId = (testName: string, existingWorkflows: Test[]): string => {
  // Test adını temizle ve slug'a çevir
  const cleanName = testName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Özel karakterleri kaldır
    .replace(/\s+/g, '-') // Boşlukları tire ile değiştir
    .replace(/-+/g, '-') // Çoklu tireleri tek tireye çevir
    .replace(/^-|-$/g, ''); // Başındaki ve sonundaki tireleri kaldır
  
  // Eğer temizlenmiş ad boşsa, varsayılan isim kullan
  const baseSlug = cleanName || 'test';
  
  // Mevcut ID'leri kontrol et ve bir sonraki numarayı bul
  const existingIds = existingWorkflows.map(w => w.id);
  let counter = 1;
  let proposedId = `${baseSlug}-${counter.toString().padStart(3, '0')}`;
  
  // Benzersiz ID bulunana kadar counter'ı artır
  while (existingIds.includes(proposedId)) {
    counter++;
    proposedId = `${baseSlug}-${counter.toString().padStart(3, '0')}`;
  }
  
  return proposedId;
};

// Mevcut testlerin ID'lerini yeni formata migrate et
export const migrateTestIds = (): boolean => {
  try {
    const savedWorkflows = getSavedWorkflows();
    let hasChanges = false;
    
    const updatedWorkflows = savedWorkflows.map((workflow, index) => {
      // Eğer ID zaten yeni formatta değilse (UUID gibi uzun ID'ler)
      if (workflow.id.length > 15 || workflow.id.includes('-') === false || /^[a-z]+-\d{3}$/.test(workflow.id) === false) {
        const newId = generateReadableId(workflow.name, savedWorkflows.slice(0, index));
        hasChanges = true;
        return { ...workflow, id: newId };
      }
      return workflow;
    });
    
    if (hasChanges) {
      localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(updatedWorkflows));
      console.log('Test ID\'leri yeni formata güncellendi');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('ID migration error:', error);
    return false;
  }
};

// Workflow storage utilities
const WORKFLOWS_STORAGE_KEY = 'CosmicQA_saved_workflows';

export const saveWorkflowToStorage = (workflow: {
  name: string;
  description: string;
  steps: TestStep[];
  tags?: string[];
  suite?: string;
  id?: string; // Düzenleme için mevcut ID
  enableScreenshots?: boolean;
  enableRecording?: boolean;
  headlessMode?: boolean;
  browserType?: BrowserType;
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
          headlessMode: workflow.headlessMode || false,
          browserType: workflow.browserType || 'chromium',
          updatedAt: new Date()
        };
        
        localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(savedWorkflows));
        return workflow.id;
      }
    }
    
    // Yeni workflow oluştur
    const id = workflow.id || generateReadableId(workflow.name, savedWorkflows);
    
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
      enableRecording: workflow.enableRecording || false,
      headlessMode: workflow.headlessMode || false,
      browserType: workflow.browserType || 'chromium'
    };
    
    // ID tabanlı yönetim kullandığımız için isim kontrolü kaldırıldı
    // Benzersiz ID'ler sayesinde aynı isimde workflow'lar olabilir
    
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
    
    // Benzersiz isim oluştur
    const baseName = newName || `${workflow.name} (Kopya)`;
    const savedWorkflows = getSavedWorkflows();
    let uniqueName = baseName;
    let counter = 1;
    
    // Aynı isimde workflow var mı kontrol et
    while (savedWorkflows.some(w => w.name === uniqueName)) {
      uniqueName = `${baseName} (${counter})`;
      counter++;
    }
    
    const duplicatedWorkflow = {
      name: uniqueName,
      description: workflow.description,
      steps: workflow.workflow || [],
      tags: workflow.tags,
      suite: workflow.suite,
      enableScreenshots: workflow.enableScreenshots,
      enableRecording: workflow.enableRecording,
      headlessMode: workflow.headlessMode,
      browserType: workflow.browserType
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
  
  const exportFileDefaultName = `CosmicQA-workflows-backup-${new Date().toISOString().split('T')[0]}.json`;
  
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
                suite: workflow.suite,
                enableScreenshots: workflow.enableScreenshots || false,
                enableRecording: workflow.enableRecording || false,
                headlessMode: workflow.headlessMode || false,
                browserType: workflow.browserType || 'chromium'
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

// Get unique tags from saved workflows
export const getExistingTags = (): string[] => {
  try {
    const workflows = getSavedWorkflows();
    const allTags = new Set<string>();
    
    workflows.forEach(workflow => {
      workflow.tags.forEach(tag => {
        if (tag.trim()) {
          allTags.add(tag.trim());
        }
      });
    });
    
    return Array.from(allTags).sort();
  } catch (error) {
    console.error('Error getting existing tags:', error);
    return [];
  }
};

// Get unique suites from saved workflows
export const getExistingSuites = (): string[] => {
  try {
    const workflows = getSavedWorkflows();
    const allSuites = new Set<string>();
    
    workflows.forEach(workflow => {
      if (workflow.suite && workflow.suite.trim()) {
        allSuites.add(workflow.suite.trim());
      }
    });
    
    // Add default suite if not present
    allSuites.add('Default');
    
    return Array.from(allSuites).sort();
  } catch (error) {
    console.error('Error getting existing suites:', error);
    return ['Default'];
  }
}; 