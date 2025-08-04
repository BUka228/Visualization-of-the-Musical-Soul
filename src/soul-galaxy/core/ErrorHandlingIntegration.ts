import { SoulGalaxyErrorHandler } from './SoulGalaxyErrorHandler';
import { ErrorNotificationSystem } from '../ui/ErrorNotificationSystem';
import { SafeCrystalShaderMaterial } from '../materials/SafeCrystalShaderMaterial';
import { SafeNebulaShaderMaterial } from '../materials/SafeNebulaShaderMaterial';
import { FallbackTextureManager, ProceduralTextureType } from '../materials/FallbackTextureManager';
import { FallbackGeometryManager, GeometryType, GeometryComplexity } from './FallbackGeometryManager';
import { DevicePerformanceDetector } from './DevicePerformanceDetector';

/**
 * Integration module for Soul Galaxy error handling system
 * Provides easy setup and configuration for error handling across the application
 */
export class ErrorHandlingIntegration {
  private static instance: ErrorHandlingIntegration;
  private errorHandler: SoulGalaxyErrorHandler;
  private notificationSystem: ErrorNotificationSystem;
  private textureManager: FallbackTextureManager;
  private geometryManager: FallbackGeometryManager;
  private performanceDetector: DevicePerformanceDetector;
  private isInitialized: boolean = false;

  private constructor() {
    this.errorHandler = SoulGalaxyErrorHandler.getInstance();
    this.notificationSystem = new ErrorNotificationSystem();
    this.textureManager = FallbackTextureManager.getInstance();
    this.geometryManager = FallbackGeometryManager.getInstance();
    this.performanceDetector = DevicePerformanceDetector.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ErrorHandlingIntegration {
    if (!ErrorHandlingIntegration.instance) {
      ErrorHandlingIntegration.instance = new ErrorHandlingIntegration();
    }
    return ErrorHandlingIntegration.instance;
  }

  /**
   * Initialize the error handling system
   */
  public initialize(config: {
    showUserNotifications?: boolean;
    notificationContainer?: HTMLElement;
    enableCompatibilityCheck?: boolean;
    enablePerformanceMonitoring?: boolean;
  } = {}): void {
    if (this.isInitialized) {
      console.warn('Error handling system already initialized');
      return;
    }

    const {
      showUserNotifications = true,
      notificationContainer,
      enableCompatibilityCheck = true,
      enablePerformanceMonitoring = true
    } = config;

    // Setup notification system
    if (showUserNotifications) {
      if (notificationContainer) {
        this.notificationSystem.dispose();
        this.notificationSystem = new ErrorNotificationSystem(notificationContainer);
      }

      // Connect error handler to notification system
      this.errorHandler.setUserNotificationCallback((error) => {
        this.notificationSystem.showErrorNotification(error);
      });
    }

    // Show compatibility summary
    if (enableCompatibilityCheck) {
      setTimeout(() => {
        const capabilities = this.errorHandler.getWebGLCapabilities();
        const isPerformanceMode = this.errorHandler.isPerformanceMode();
        this.notificationSystem.showCompatibilitySummary(capabilities, isPerformanceMode);
      }, 1000); // Delay to allow scene initialization
    }

    // Setup performance monitoring
    if (enablePerformanceMonitoring) {
      this.setupPerformanceMonitoring();
    }

    this.isInitialized = true;
    console.log('Soul Galaxy error handling system initialized');
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsHistory: number[] = [];
    const maxHistory = 60; // Keep 60 frames of history

    const monitorPerformance = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      frameCount++;

      // Calculate FPS every 60 frames
      if (frameCount >= 60) {
        const fps = 1000 / (deltaTime / frameCount);
        fpsHistory.push(fps);
        
        if (fpsHistory.length > maxHistory) {
          fpsHistory = fpsHistory.slice(-maxHistory);
        }

        // Check for performance issues
        const averageFps = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;
        
        if (averageFps < 30 && !this.errorHandler.isPerformanceMode()) {
          this.errorHandler.handlePerformanceWarning({
            type: 'fps_drop',
            threshold: 30,
            currentValue: averageFps,
            message: `Low frame rate detected: ${averageFps.toFixed(1)} FPS`,
            timestamp: Date.now()
          });
        }

        frameCount = 0;
      }

      // Check memory usage (if available)
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
        
        if (usedMB > limitMB * 0.8) {
          this.errorHandler.handlePerformanceWarning({
            type: 'memory_usage',
            threshold: limitMB * 0.8,
            currentValue: usedMB,
            message: `High memory usage: ${usedMB.toFixed(1)}MB / ${limitMB.toFixed(1)}MB`,
            timestamp: Date.now()
          });
        }
      }

      requestAnimationFrame(monitorPerformance);
    };

    requestAnimationFrame(monitorPerformance);
  }

  /**
   * Create safe crystal material with error handling
   */
  public createSafeCrystalMaterial(config: {
    genreColor?: THREE.Color;
    albumTexture?: THREE.Texture;
    emissiveIntensity?: number;
    pulseAmplitude?: number;
    pulseSpeed?: number;
    sharpness?: number;
    opacity?: number;
    metallic?: number;
    roughness?: number;
  } = {}): SafeCrystalShaderMaterial {
    return new SafeCrystalShaderMaterial(config);
  }

  /**
   * Create safe crystal material for genre
   */
  public createSafeCrystalMaterialForGenre(genre: string, config: {
    albumTexture?: THREE.Texture;
    emissiveIntensity?: number;
    pulseAmplitude?: number;
    pulseSpeed?: number;
    sharpness?: number;
    intensity?: number;
  } = {}): SafeCrystalShaderMaterial {
    return SafeCrystalShaderMaterial.createForGenre(genre, config);
  }

  /**
   * Create safe nebula material with error handling
   */
  public createSafeNebulaMaterial(config: {
    intensity?: number;
    colors?: THREE.Color[];
    driftSpeed?: number;
    turbulence?: number;
    layerIndex?: number;
  } = {}): SafeNebulaShaderMaterial {
    return new SafeNebulaShaderMaterial(config);
  }

  /**
   * Create safe deep space nebula material
   */
  public createSafeDeepSpaceNebula(config: {
    intensity?: number;
    driftSpeed?: number;
    turbulence?: number;
    layerIndex?: number;
  } = {}): SafeNebulaShaderMaterial {
    return SafeNebulaShaderMaterial.createDeepSpace(config);
  }

  /**
   * Handle texture loading with advanced fallback system
   */
  public loadTextureWithFallback(
    url: string,
    trackId: string,
    options: {
      genre?: string;
      energy?: number;
      fallbackType?: ProceduralTextureType;
      onLoad?: (texture: THREE.Texture) => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<THREE.Texture> {
    return this.textureManager.loadTextureWithFallback(url, trackId, {
      genre: options.genre,
      energy: options.energy,
      fallbackType: options.fallbackType
    }).then(texture => {
      if (options.onLoad) options.onLoad(texture);
      return texture;
    }).catch(error => {
      if (options.onError) options.onError(error);
      throw error;
    });
  }

  /**
   * Create procedural texture for tracks without album art
   */
  public createProceduralTexture(
    trackId: string,
    type: ProceduralTextureType = ProceduralTextureType.GENRE_BASED,
    data: {
      genre?: string;
      energy?: number;
      color?: THREE.Color;
    } = {}
  ): THREE.Texture {
    return this.textureManager.createProceduralTexture(trackId, type, data);
  }

  /**
   * Handle geometry creation with advanced fallback system
   */
  public createGeometryWithFallback(
    type: GeometryType,
    options: {
      forceComplexity?: GeometryComplexity;
      trackData?: any;
      customParams?: any;
    } = {}
  ): THREE.BufferGeometry {
    return this.geometryManager.createGeometryWithFallback(type, options);
  }

  /**
   * Create crystal geometry with automatic complexity adjustment
   */
  public createCrystalGeometry(trackData?: any, forceComplexity?: GeometryComplexity): THREE.BufferGeometry {
    return this.geometryManager.createGeometryWithFallback(GeometryType.CRYSTAL, {
      forceComplexity,
      trackData
    });
  }

  /**
   * Create nebula plane geometry with automatic complexity adjustment
   */
  public createNebulaGeometry(customParams?: any, forceComplexity?: GeometryComplexity): THREE.BufferGeometry {
    return this.geometryManager.createGeometryWithFallback(GeometryType.NEBULA_PLANE, {
      forceComplexity,
      customParams
    });
  }

  /**
   * Create particle system geometry with automatic complexity adjustment
   */
  public createParticleGeometry(customParams?: any, forceComplexity?: GeometryComplexity): THREE.BufferGeometry {
    return this.geometryManager.createGeometryWithFallback(GeometryType.PARTICLE_SYSTEM, {
      forceComplexity,
      customParams
    });
  }

  /**
   * Get device performance information
   */
  public getDevicePerformance() {
    return {
      capabilities: this.performanceDetector.getCapabilities(),
      qualitySettings: this.performanceDetector.getQualitySettings(),
      recommendations: this.performanceDetector.getPerformanceRecommendations()
    };
  }

  /**
   * Run performance benchmark
   */
  public async runPerformanceBenchmark() {
    return await this.performanceDetector.runBenchmark();
  }

  /**
   * Adjust quality based on runtime performance
   */
  public adjustQualityForPerformance(currentFPS: number): void {
    this.performanceDetector.adjustQualityBasedOnPerformance(currentFPS);
    
    // Update geometry complexity based on new settings
    const newSettings = this.performanceDetector.getQualitySettings();
    this.geometryManager.setComplexityLevel(newSettings.geometryComplexity);
    
    // Update texture quality
    this.textureManager.setQualitySettings(newSettings.textureQuality);
  }

  /**
   * Get texture manager instance
   */
  public getTextureManager(): FallbackTextureManager {
    return this.textureManager;
  }

  /**
   * Get geometry manager instance
   */
  public getGeometryManager(): FallbackGeometryManager {
    return this.geometryManager;
  }

  /**
   * Get performance detector instance
   */
  public getPerformanceDetector(): DevicePerformanceDetector {
    return this.performanceDetector;
  }

  /**
   * Get comprehensive system statistics
   */
  public getSystemStatistics() {
    return {
      errors: this.errorHandler.getErrorStatistics(),
      textures: this.textureManager.getCacheStatistics(),
      geometry: this.geometryManager.getCacheStatistics(),
      performance: this.performanceDetector.getCapabilities(),
      isPerformanceMode: this.errorHandler.isPerformanceMode()
    };
  }

  /**
   * Generate comprehensive performance report
   */
  public generatePerformanceReport(): string {
    return this.performanceDetector.generatePerformanceReport();
  }

  /**
   * Get error handler instance
   */
  public getErrorHandler(): SoulGalaxyErrorHandler {
    return this.errorHandler;
  }

  /**
   * Get notification system instance
   */
  public getNotificationSystem(): ErrorNotificationSystem {
    return this.notificationSystem;
  }

  /**
   * Check if system is using performance mode
   */
  public isPerformanceMode(): boolean {
    return this.errorHandler.isPerformanceMode();
  }

  /**
   * Get WebGL capabilities
   */
  public getWebGLCapabilities() {
    return this.errorHandler.getWebGLCapabilities();
  }

  /**
   * Get error statistics
   */
  public getErrorStatistics() {
    return this.errorHandler.getErrorStatistics();
  }

  /**
   * Attempt to recreate shader materials (useful after WebGL context restore)
   */
  public attemptShaderRecreation(materials: (SafeCrystalShaderMaterial | SafeNebulaShaderMaterial)[]): {
    successful: number;
    failed: number;
  } {
    let successful = 0;
    let failed = 0;

    materials.forEach(material => {
      if (material.attemptShaderRecreation()) {
        successful++;
      } else {
        failed++;
      }
    });

    if (successful > 0) {
      console.log(`Successfully recreated ${successful} shader materials`);
    }
    
    if (failed > 0) {
      console.warn(`Failed to recreate ${failed} shader materials`);
    }

    return { successful, failed };
  }

  /**
   * Clear all error notifications
   */
  public clearNotifications(): void {
    this.notificationSystem.clearAllNotifications();
  }

  /**
   * Dispose of the error handling system
   */
  public dispose(): void {
    this.notificationSystem.dispose();
    this.errorHandler.dispose();
    this.isInitialized = false;
  }
}

// Export convenience functions for easy access
export const createSafeCrystalMaterial = (config?: any) => 
  ErrorHandlingIntegration.getInstance().createSafeCrystalMaterial(config);

export const createSafeCrystalMaterialForGenre = (genre: string, config?: any) => 
  ErrorHandlingIntegration.getInstance().createSafeCrystalMaterialForGenre(genre, config);

export const createSafeNebulaMaterial = (config?: any) => 
  ErrorHandlingIntegration.getInstance().createSafeNebulaMaterial(config);

export const createSafeDeepSpaceNebula = (config?: any) => 
  ErrorHandlingIntegration.getInstance().createSafeDeepSpaceNebula(config);

export const loadTextureWithFallback = (url: string, trackId: string, options?: any) => 
  ErrorHandlingIntegration.getInstance().loadTextureWithFallback(url, trackId, options);

export const createGeometryWithFallback = (type: GeometryType, options?: any) => 
  ErrorHandlingIntegration.getInstance().createGeometryWithFallback(type, options);

export const createCrystalGeometry = (trackData?: any, forceComplexity?: GeometryComplexity) =>
  ErrorHandlingIntegration.getInstance().createCrystalGeometry(trackData, forceComplexity);

export const createProceduralTexture = (trackId: string, type?: ProceduralTextureType, data?: any) =>
  ErrorHandlingIntegration.getInstance().createProceduralTexture(trackId, type, data);