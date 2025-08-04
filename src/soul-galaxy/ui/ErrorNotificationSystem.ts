import { ErrorReport, ErrorSeverity, ErrorType } from '../core/SoulGalaxyErrorHandler';

/**
 * User-friendly error notification system for Soul Galaxy
 * Displays compatibility issues and fallback notifications to users
 */
export class ErrorNotificationSystem {
  private container: HTMLElement;
  private notifications: Map<string, HTMLElement> = new Map();
  private maxNotifications: number = 3;
  private notificationTimeout: number = 5000; // 5 seconds

  constructor(parentElement?: HTMLElement) {
    this.container = this.createNotificationContainer();
    
    if (parentElement) {
      parentElement.appendChild(this.container);
    } else {
      document.body.appendChild(this.container);
    }
  }

  /**
   * Create the notification container
   */
  private createNotificationContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'soul-galaxy-notifications';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
    `;
    
    return container;
  }

  /**
   * Show error notification to user
   */
  public showErrorNotification(error: ErrorReport): void {
    // Don't show duplicate notifications
    const notificationId = this.getNotificationId(error);
    if (this.notifications.has(notificationId)) {
      return;
    }

    // Create user-friendly message
    const userMessage = this.createUserFriendlyMessage(error);
    if (!userMessage) return; // Skip if no user message needed

    // Create notification element
    const notification = this.createNotificationElement(error, userMessage);
    
    // Add to container
    this.container.appendChild(notification);
    this.notifications.set(notificationId, notification);

    // Limit number of notifications
    this.limitNotifications();

    // Auto-remove after timeout
    setTimeout(() => {
      this.removeNotification(notificationId);
    }, this.getTimeoutForSeverity(error.severity));

    // Animate in
    requestAnimationFrame(() => {
      notification.style.transform = 'translateX(0)';
      notification.style.opacity = '1';
    });
  }

  /**
   * Create user-friendly message from error report
   */
  private createUserFriendlyMessage(error: ErrorReport): string | null {
    switch (error.type) {
      case ErrorType.SHADER_COMPILATION:
      case ErrorType.SHADER_LINKING:
        return 'Using simplified graphics for better compatibility';
      
      case ErrorType.WEBGL_CONTEXT:
        if (error.severity === ErrorSeverity.CRITICAL) {
          return 'Graphics acceleration unavailable. Using basic rendering mode.';
        }
        return 'Graphics context restored. Reloading visual effects...';
      
      case ErrorType.TEXTURE_LOADING:
        return 'Some album artwork failed to load. Using generated visuals.';
      
      case ErrorType.GEOMETRY_GENERATION:
        return 'Using simplified crystal shapes for better performance';
      
      case ErrorType.PERFORMANCE_WARNING:
        if (error.context?.warningType === 'fps_drop') {
          return 'Performance mode enabled to maintain smooth experience';
        }
        return 'Optimizing visual quality for your device';
      
      default:
        // Don't show notifications for animation errors or low severity issues
        if (error.severity === ErrorSeverity.LOW) {
          return null;
        }
        return 'Visual effects adjusted for optimal performance';
    }
  }

  /**
   * Create notification element
   */
  private createNotificationElement(error: ErrorReport, message: string): HTMLElement {
    const notification = document.createElement('div');
    notification.className = `soul-galaxy-notification severity-${error.severity}`;
    
    const backgroundColor = this.getBackgroundColorForSeverity(error.severity);
    const textColor = this.getTextColorForSeverity(error.severity);
    const icon = this.getIconForSeverity(error.severity);
    
    notification.style.cssText = `
      background: ${backgroundColor};
      color: ${textColor};
      padding: 12px 16px;
      margin-bottom: 8px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      transform: translateX(100%);
      opacity: 0;
      transition: all 0.3s ease-out;
      pointer-events: auto;
      cursor: pointer;
      max-width: 300px;
      word-wrap: break-word;
      position: relative;
      overflow: hidden;
    `;

    // Add content
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px; flex-shrink: 0;">${icon}</span>
        <div style="flex: 1;">
          <div style="font-weight: 500; margin-bottom: 2px;">Soul Galaxy</div>
          <div style="font-size: 12px; opacity: 0.9;">${message}</div>
        </div>
        <button style="
          background: none;
          border: none;
          color: ${textColor};
          cursor: pointer;
          padding: 4px;
          opacity: 0.7;
          font-size: 16px;
          line-height: 1;
          flex-shrink: 0;
        " onclick="this.parentElement.parentElement.style.display='none'">×</button>
      </div>
    `;

    // Add click to dismiss
    notification.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).tagName !== 'BUTTON') {
        this.removeNotification(this.getNotificationId(error));
      }
    });

    // Add progress bar for auto-dismiss
    if (error.severity !== ErrorSeverity.CRITICAL) {
      const progressBar = document.createElement('div');
      progressBar.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        height: 2px;
        background: ${textColor};
        opacity: 0.3;
        width: 100%;
        transform-origin: left;
        animation: shrink ${this.getTimeoutForSeverity(error.severity)}ms linear;
      `;
      
      notification.appendChild(progressBar);
      
      // Add CSS animation
      if (!document.getElementById('soul-galaxy-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'soul-galaxy-notification-styles';
        style.textContent = `
          @keyframes shrink {
            from { transform: scaleX(1); }
            to { transform: scaleX(0); }
          }
        `;
        document.head.appendChild(style);
      }
    }

    return notification;
  }

  /**
   * Get background color for severity level
   */
  private getBackgroundColorForSeverity(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'rgba(59, 130, 246, 0.9)'; // Blue
      case ErrorSeverity.MEDIUM:
        return 'rgba(245, 158, 11, 0.9)'; // Amber
      case ErrorSeverity.HIGH:
        return 'rgba(239, 68, 68, 0.9)'; // Red
      case ErrorSeverity.CRITICAL:
        return 'rgba(127, 29, 29, 0.95)'; // Dark red
      default:
        return 'rgba(75, 85, 99, 0.9)'; // Gray
    }
  }

  /**
   * Get text color for severity level
   */
  private getTextColorForSeverity(severity: ErrorSeverity): string {
    return '#ffffff'; // White text for all severities
  }

  /**
   * Get icon for severity level
   */
  private getIconForSeverity(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'ℹ️'; // Info
      case ErrorSeverity.MEDIUM:
        return '⚠️'; // Warning
      case ErrorSeverity.HIGH:
        return '❌'; // Error
      case ErrorSeverity.CRITICAL:
        return '🚨'; // Critical
      default:
        return 'ℹ️';
    }
  }

  /**
   * Get timeout duration for severity level
   */
  private getTimeoutForSeverity(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 3000; // 3 seconds
      case ErrorSeverity.MEDIUM:
        return 5000; // 5 seconds
      case ErrorSeverity.HIGH:
        return 8000; // 8 seconds
      case ErrorSeverity.CRITICAL:
        return 0; // No auto-dismiss for critical errors
      default:
        return this.notificationTimeout;
    }
  }

  /**
   * Generate unique notification ID
   */
  private getNotificationId(error: ErrorReport): string {
    return `${error.type}-${error.severity}-${error.message.substring(0, 50)}`;
  }

  /**
   * Remove notification
   */
  private removeNotification(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;

    // Animate out
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';

    // Remove from DOM after animation
    setTimeout(() => {
      if (notification.parentElement) {
        notification.parentElement.removeChild(notification);
      }
      this.notifications.delete(notificationId);
    }, 300);
  }

  /**
   * Limit number of visible notifications
   */
  private limitNotifications(): void {
    if (this.notifications.size <= this.maxNotifications) return;

    // Remove oldest notifications
    const notificationIds = Array.from(this.notifications.keys());
    const toRemove = notificationIds.slice(0, this.notifications.size - this.maxNotifications);
    
    toRemove.forEach(id => this.removeNotification(id));
  }

  /**
   * Clear all notifications
   */
  public clearAllNotifications(): void {
    Array.from(this.notifications.keys()).forEach(id => {
      this.removeNotification(id);
    });
  }

  /**
   * Show compatibility summary
   */
  public showCompatibilitySummary(capabilities: any, isPerformanceMode: boolean): void {
    const summary = this.createCompatibilitySummary(capabilities, isPerformanceMode);
    if (!summary) return;

    const notification = document.createElement('div');
    notification.className = 'soul-galaxy-compatibility-summary';
    notification.style.cssText = `
      background: rgba(30, 41, 59, 0.95);
      color: #ffffff;
      padding: 16px;
      margin-bottom: 8px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      max-width: 350px;
      font-size: 12px;
      line-height: 1.4;
    `;

    notification.innerHTML = `
      <div style="font-weight: 500; margin-bottom: 8px; color: #60a5fa;">
        🌌 Soul Galaxy Compatibility
      </div>
      ${summary}
      <button style="
        background: rgba(59, 130, 246, 0.2);
        border: 1px solid rgba(59, 130, 246, 0.3);
        color: #60a5fa;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        margin-top: 8px;
        width: 100%;
      " onclick="this.parentElement.style.display='none'">Got it</button>
    `;

    this.container.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.parentElement.removeChild(notification);
      }
    }, 10000);
  }

  /**
   * Create compatibility summary text
   */
  private createCompatibilitySummary(capabilities: any, isPerformanceMode: boolean): string | null {
    const features = [];
    
    if (!capabilities.hasWebGL2) {
      features.push('• Using WebGL 1.0 compatibility mode');
    }
    
    if (!capabilities.hasFloatTextures) {
      features.push('• Limited texture precision');
    }
    
    if (isPerformanceMode) {
      features.push('• Performance mode active');
    }
    
    if (capabilities.maxTextureSize < 2048) {
      features.push('• Reduced texture quality');
    }

    if (features.length === 0) {
      return null; // No compatibility issues
    }

    return `
      <div style="margin-bottom: 8px;">
        Your device supports Soul Galaxy with some optimizations:
      </div>
      ${features.join('<br>')}
      <div style="margin-top: 8px; opacity: 0.8;">
        Visual quality has been automatically adjusted for the best experience.
      </div>
    `;
  }

  /**
   * Dispose of the notification system
   */
  public dispose(): void {
    this.clearAllNotifications();
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }
}