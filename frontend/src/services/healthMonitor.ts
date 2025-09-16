// Phase 5: Backend connection health monitoring
// Monitors API connectivity and provides fallback strategies

import { useState, useEffect } from 'react';
import { apiClient } from './apiClient';
import { errorHandler } from './errorHandling';

export interface HealthStatus {
  isOnline: boolean;
  isApiHealthy: boolean;
  lastChecked: number;
  responseTime: number;
  consecutiveFailures: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
}

export interface HealthCheckOptions {
  interval?: number;
  timeout?: number;
  retries?: number;
  enableAutoRecovery?: boolean;
}

class HealthMonitor {
  private status: HealthStatus = {
    isOnline: navigator.onLine,
    isApiHealthy: true,
    lastChecked: 0,
    responseTime: 0,
    consecutiveFailures: 0,
    connectionQuality: 'excellent'
  };

  private checkInterval: number | null = null;
  private listeners: Array<(status: HealthStatus) => void> = [];
  private options: Required<HealthCheckOptions> = {
    interval: 30000, // 30 seconds
    timeout: 5000,   // 5 seconds
    retries: 3,
    enableAutoRecovery: true
  };

  constructor(options?: HealthCheckOptions) {
    if (options) {
      this.options = { ...this.options, ...options };
    }

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Initial health check
    this.checkHealth();
  }

  // Start continuous health monitoring
  start(): void {
    if (this.checkInterval) return;

    this.checkInterval = window.setInterval(() => {
      this.checkHealth();
    }, this.options.interval);

    // Immediate check
    this.checkHealth();
  }

  // Stop health monitoring
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Perform health check
  async checkHealth(): Promise<HealthStatus> {
    const startTime = performance.now();
    
    try {
      // Check if browser thinks we're online
      if (!navigator.onLine) {
        this.updateStatus({
          isOnline: false,
          isApiHealthy: false,
          connectionQuality: 'offline',
          consecutiveFailures: this.status.consecutiveFailures + 1
        });
        return this.status;
      }

      // Check API health
      const isHealthy = await this.checkApiHealth();
      const responseTime = performance.now() - startTime;
      
      this.updateStatus({
        isOnline: true,
        isApiHealthy: isHealthy,
        lastChecked: Date.now(),
        responseTime,
        consecutiveFailures: isHealthy ? 0 : this.status.consecutiveFailures + 1,
        connectionQuality: this.getConnectionQuality(responseTime, isHealthy)
      });

    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      this.updateStatus({
        isOnline: navigator.onLine,
        isApiHealthy: false,
        lastChecked: Date.now(),
        responseTime,
        consecutiveFailures: this.status.consecutiveFailures + 1,
        connectionQuality: 'poor'
      });

      errorHandler.logError({
        message: 'Health check failed',
        code: 'HEALTH_CHECK_FAILED',
        details: error
      }, 'HealthMonitor');
    }

    // Trigger auto-recovery if enabled
    if (this.options.enableAutoRecovery && this.shouldTriggerRecovery()) {
      this.triggerRecovery();
    }

    return this.status;
  }

  // Check API health endpoint
  private async checkApiHealth(): Promise<boolean> {
    try {
      const response = await apiClient.get('/health', { 
        timeout: this.options.timeout,
        cache: false 
      });
      return !response.error;
    } catch (error) {
      return false;
    }
  }

  // Determine connection quality based on response time and health
  private getConnectionQuality(
    responseTime: number, 
    isHealthy: boolean
  ): HealthStatus['connectionQuality'] {
    if (!isHealthy) return 'poor';
    
    if (responseTime < 200) return 'excellent';
    if (responseTime < 1000) return 'good';
    if (responseTime < 3000) return 'poor';
    return 'offline';
  }

  // Update status and notify listeners
  private updateStatus(updates: Partial<HealthStatus>): void {
    const previousStatus = { ...this.status };
    this.status = { ...this.status, ...updates };

    // Notify listeners if status changed significantly
    if (this.hasSignificantChange(previousStatus, this.status)) {
      this.notifyListeners();
    }
  }

  // Check if status change is significant enough to notify
  private hasSignificantChange(previous: HealthStatus, current: HealthStatus): boolean {
    return (
      previous.isOnline !== current.isOnline ||
      previous.isApiHealthy !== current.isApiHealthy ||
      previous.connectionQuality !== current.connectionQuality
    );
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.status);
      } catch (error) {
        console.error('Health status listener error:', error);
      }
    });
  }

  // Handle browser online event
  private handleOnline(): void {
    console.log('🟢 Browser is online, checking API health...');
    this.checkHealth();
  }

  // Handle browser offline event
  private handleOffline(): void {
    console.log('🔴 Browser is offline');
    this.updateStatus({
      isOnline: false,
      isApiHealthy: false,
      connectionQuality: 'offline'
    });
  }

  // Check if we should trigger auto-recovery
  private shouldTriggerRecovery(): boolean {
    return (
      this.status.consecutiveFailures >= 3 &&
      this.status.consecutiveFailures % 5 === 0 && // Every 5th failure
      Date.now() - this.status.lastChecked < 60000 // Within last minute
    );
  }

  // Trigger recovery attempts
  private async triggerRecovery(): Promise<void> {
    console.log('🔄 Triggering auto-recovery...');
    
    try {
      // Clear any caches that might be stale
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Wait a bit and retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.checkHealth();
      
    } catch (error) {
      console.error('Auto-recovery failed:', error);
    }
  }

  // Subscribe to health status changes
  subscribe(listener: (status: HealthStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Get current health status
  getStatus(): HealthStatus {
    return { ...this.status };
  }

  // Get health summary for debugging
  getHealthSummary() {
    const status = this.getStatus();
    const timeSinceLastCheck = Date.now() - status.lastChecked;
    
    return {
      status: status.isApiHealthy ? '✅ Healthy' : '❌ Unhealthy',
      online: status.isOnline ? '🟢 Online' : '🔴 Offline',
      quality: `📊 ${status.connectionQuality}`,
      responseTime: `⏱️ ${status.responseTime.toFixed(0)}ms`,
      failures: `❌ ${status.consecutiveFailures} consecutive failures`,
      lastCheck: timeSinceLastCheck < 60000 
        ? `🕐 ${Math.round(timeSinceLastCheck / 1000)}s ago`
        : `🕐 ${Math.round(timeSinceLastCheck / 60000)}m ago`
    };
  }

  // Force immediate health check
  async forceCheck(): Promise<HealthStatus> {
    return this.checkHealth();
  }

  // Reset failure count
  reset(): void {
    this.updateStatus({ consecutiveFailures: 0 });
  }

  // Cleanup resources
  destroy(): void {
    this.stop();
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.listeners = [];
  }
}

// Export singleton instance
export const healthMonitor = new HealthMonitor({
  interval: 30000,
  timeout: 5000,
  retries: 3,
  enableAutoRecovery: true
});

// React hook for using health status
export const useHealthStatus = () => {
  const [status, setStatus] = useState<HealthStatus>(healthMonitor.getStatus());

  useEffect(() => {
    const unsubscribe = healthMonitor.subscribe(setStatus);
    
    // Start monitoring
    healthMonitor.start();
    
    return () => {
      unsubscribe();
      healthMonitor.stop();
    };
  }, []);

  return {
    ...status,
    forceCheck: healthMonitor.forceCheck.bind(healthMonitor),
    getHealthSummary: healthMonitor.getHealthSummary.bind(healthMonitor)
  };
};

// Utility function to wait for healthy connection
export const waitForHealthyConnection = (
  timeout: number = 30000
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      unsubscribe();
      reject(new Error('Timeout waiting for healthy connection'));
    }, timeout);

    const unsubscribe = healthMonitor.subscribe((status) => {
      if (status.isApiHealthy) {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(true);
      }
    });

    // Check current status immediately
    if (healthMonitor.getStatus().isApiHealthy) {
      clearTimeout(timeoutId);
      unsubscribe();
      resolve(true);
    }
  });
};

export default healthMonitor;