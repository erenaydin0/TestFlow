/**
 * Alert Provider System
 * Genişletilebilir alerting sistemi için provider interface ve implementasyonları
 */

/**
 * Base Alert Provider Interface
 */
export class AlertProvider {
  /**
   * Send alert notification
   * @param {Object} classification - Error classification
   * @param {number} count - Error count
   * @param {Object} logEntry - Full log entry with error details
   */
  async send(classification, count, logEntry) {
    throw new Error('send() must be implemented by subclass');
  }

  /**
   * Get provider name
   */
  getName() {
    return this.constructor.name;
  }
}

/**
 * Console Alert Provider (Default)
 * Alerts are logged to console
 */
export class ConsoleAlertProvider extends AlertProvider {
  async send(classification, count, logEntry) {
    const emoji = this.getEmojiForSeverity(classification.severity);
    const message = `${emoji} ALERT: ${count} ${classification.severity.toUpperCase()} errors in ${classification.category.toUpperCase()}`;
    
    console.warn(message);
    
    if (process.env.NODE_ENV === 'development') {
      console.warn('Error details:', {
        errorId: logEntry.errorId,
        timestamp: logEntry.timestamp,
        message: logEntry.error?.message,
        stack: logEntry.error?.stack?.split('\n').slice(0, 3).join('\n')
      });
    }
  }

  getEmojiForSeverity(severity) {
    const emojiMap = {
      critical: '🚨',
      high: '⚠️',
      medium: '⚡',
      low: 'ℹ️'
    };
    return emojiMap[severity] || '⚠️';
  }
}

/**
 * Webhook Alert Provider (Future implementation)
 * Sends alerts to external webhook (Slack, Discord, etc.)
 */
export class WebhookAlertProvider extends AlertProvider {
  constructor(webhookUrl) {
    super();
    this.webhookUrl = webhookUrl || process.env.ALERT_WEBHOOK_URL;
  }

  async send(classification, count, logEntry) {
    if (!this.webhookUrl) {
      console.warn('WebhookAlertProvider: No webhook URL configured, falling back to console');
      const consoleProvider = new ConsoleAlertProvider();
      return consoleProvider.send(classification, count, logEntry);
    }

    try {
      const payload = {
        text: `🚨 Alert: ${count} ${classification.severity} errors in ${classification.category}`,
        errorId: logEntry.errorId,
        timestamp: logEntry.timestamp,
        classification: {
          code: classification.code,
          category: classification.category,
          severity: classification.severity
        },
        error: {
          message: logEntry.error?.message,
          name: logEntry.error?.name
        },
        context: logEntry.context
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status}`);
      }
    } catch (error) {
      console.error('WebhookAlertProvider: Failed to send alert', error);
      // Fallback to console
      const consoleProvider = new ConsoleAlertProvider();
      await consoleProvider.send(classification, count, logEntry);
    }
  }
}

/**
 * Email Alert Provider (Future implementation)
 * Sends alerts via email using nodemailer
 */
export class EmailAlertProvider extends AlertProvider {
  constructor(emailConfig) {
    super();
    this.emailConfig = emailConfig || {
      to: process.env.ALERT_EMAIL_TO,
      from: process.env.ALERT_EMAIL_FROM,
      smtp: {
        host: process.env.ALERT_EMAIL_SMTP_HOST,
        port: process.env.ALERT_EMAIL_SMTP_PORT,
        auth: {
          user: process.env.ALERT_EMAIL_SMTP_USER,
          pass: process.env.ALERT_EMAIL_SMTP_PASS
        }
      }
    };
  }

  async send(classification, count, logEntry) {
    // Email provider implementation would go here
    // For now, fallback to console
    console.warn('EmailAlertProvider: Not yet implemented, falling back to console');
    const consoleProvider = new ConsoleAlertProvider();
    return consoleProvider.send(classification, count, logEntry);
  }
}

/**
 * Factory function to create alert provider based on config
 * @param {string} providerType - Provider type ('console', 'webhook', 'email')
 * @param {Object} config - Provider-specific configuration
 * @returns {AlertProvider}
 */
export function createAlertProvider(providerType, config = {}) {
  switch (providerType?.toLowerCase()) {
    case 'webhook':
      return new WebhookAlertProvider(config.webhookUrl);
    case 'email':
      return new EmailAlertProvider(config.emailConfig);
    case 'console':
    default:
      return new ConsoleAlertProvider();
  }
}

