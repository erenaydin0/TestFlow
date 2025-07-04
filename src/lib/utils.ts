import { type ClassValue, clsx } from 'clsx';
import { TestStep } from '@/types';

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