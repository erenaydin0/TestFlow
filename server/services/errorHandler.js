import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules için __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ErrorHandler {
  constructor() {
    this.logsDir = path.join(__dirname, '..', 'logs');
    this.ensureLogsDir();
  }

  ensureLogsDir() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  // Güvenli hata mesajı oluştur
  createSafeErrorMessage(error, context = '') {
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // Production'da sadece genel hata mesajları
      const errorTypes = {
        'ValidationError': 'Geçersiz veri formatı',
        'NotFoundError': 'İstenen kaynak bulunamadı',
        'AuthenticationError': 'Kimlik doğrulama hatası',
        'PermissionError': 'Yetki hatası',
        'NetworkError': 'Ağ bağlantı hatası',
        'DatabaseError': 'Veritabanı hatası',
        'TimeoutError': 'İşlem zaman aşımı',
        'FileSystemError': 'Dosya sistemi hatası'
      };

      const errorType = this.getErrorType(error);
      return errorTypes[errorType] || 'Beklenmeyen bir hata oluştu';
    }

    // Development'da detaylı hata mesajları
    return error.message || 'Bilinmeyen hata';
  }

  // Hata tipini belirle
  getErrorType(error) {
    if (error.name) return error.name;
    if (error.code) return error.code;
    if (error.message) {
      if (error.message.includes('not found')) return 'NotFoundError';
      if (error.message.includes('permission')) return 'PermissionError';
      if (error.message.includes('timeout')) return 'TimeoutError';
      if (error.message.includes('network')) return 'NetworkError';
      if (error.message.includes('database')) return 'DatabaseError';
    }
    return 'UnknownError';
  }

  // Detaylı hata logla
  async logError(error, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      context: {
        executionId: context.executionId,
        stepId: context.stepId,
        userId: context.userId,
        requestId: context.requestId,
        ...context
      }
    };

    // Log dosyasına yaz
    const logFile = path.join(this.logsDir, `errors-${new Date().toISOString().split('T')[0]}.log`);
    await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');

    // Console'a da yaz (development için)
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error logged:', logEntry);
    }
  }

  // API response için hata formatla
  formatApiError(error, context = {}) {
    const safeMessage = this.createSafeErrorMessage(error, context);
    
    return {
      error: safeMessage,
      code: this.getErrorType(error),
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV !== 'production' && { 
        details: error.message,
        stack: error.stack 
      })
    };
  }

  // WebSocket için hata formatla
  formatWebSocketError(error, context = {}) {
    const safeMessage = this.createSafeErrorMessage(error, context);
    
    return {
      type: 'error',
      message: safeMessage,
      code: this.getErrorType(error),
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV !== 'production' && { 
        details: error.message 
      })
    };
  }
}

export default new ErrorHandler();
