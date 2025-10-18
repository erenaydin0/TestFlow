import { Test, TestStep, BrowserType } from '@/types';

// Storage constants
const WORKFLOWS_STORAGE_KEY = 'CosmicQA_Workflows';

// Types
export interface WorkflowStorageData {
  name: string;
  description: string;
  steps: TestStep[];
  tags?: string[];
  suite?: string;
  id?: string;
  enableScreenshots?: boolean;
  enableRecording?: boolean;
  headlessMode?: boolean;
  browserType?: BrowserType;
}

// Core storage functions
export const saveWorkflowToStorage = (workflow: WorkflowStorageData): string => {
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

// Utility functions for getting unique values
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

// Storage management utilities
export const clearAllWorkflows = (): boolean => {
  try {
    localStorage.removeItem(WORKFLOWS_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing workflows:', error);
    return false;
  }
};

export const exportWorkflowsToJSON = (): string => {
  const workflows = getSavedWorkflows();
  return JSON.stringify(workflows, null, 2);
};

export const importWorkflowsFromJSON = (jsonData: string): boolean => {
  try {
    const workflows = JSON.parse(jsonData);
    if (!Array.isArray(workflows)) {
      throw new Error('Geçersiz veri formatı');
    }
    
    // Validate workflows
    const validWorkflows = workflows.filter(workflow => 
      workflow.id && workflow.name && workflow.workflow
    );
    
    if (validWorkflows.length === 0) {
      throw new Error('Geçerli workflow bulunamadı');
    }
    
    localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(validWorkflows));
    return true;
  } catch (error) {
    console.error('Error importing workflows:', error);
    return false;
  }
};

export const getStorageStats = (): {
  totalWorkflows: number;
  totalSteps: number;
  storageSize: number;
  lastUpdated: Date | null;
} => {
  const workflows = getSavedWorkflows();
  const totalSteps = workflows.reduce((sum, w) => sum + (w.workflow?.length || 0), 0);
  const storageData = localStorage.getItem(WORKFLOWS_STORAGE_KEY);
  const storageSize = storageData ? new Blob([storageData]).size : 0;
  const lastUpdated = workflows.length > 0 
    ? new Date(Math.max(...workflows.map(w => w.updatedAt.getTime())))
    : null;
  
  return {
    totalWorkflows: workflows.length,
    totalSteps,
    storageSize,
    lastUpdated
  };
};
