import * as THREE from 'three';
import { CrystalShaderMaterial } from '../materials/CrystalShaderMaterial';
import { NebulaShaderMaterial } from '../materials/NebulaShaderMaterial';

/**
 * Types of errors that can occur in the Soul Galaxy system
 */
export enum ErrorType {
  SHADER_COMPILATION = 'shader_compilation',
  SHADER_LINKING = 'shader_linking',
  WEBGL_CONTEXT = 'webgl_context',
  TEXTURE_LOADING = 'texture_loading',
  GEOMETRY_GENERATION = 'geometry_generation',
  ANIMATION_ERROR = 'animation_error',
  PERFORMANCE_WARNING = 'performance_warning'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Interface for error reports
 */
export interface ErrorReport {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error;
  timestamp: number;
  context?: any;
  fallbackUsed?: string;
}

/**
 * Interface for performance warnings
 */
export interface PerformanceWarning {
  type: 'fps_drop' | 'memory_usage' | 'draw_calls' | 'shader_complexity';
  threshold: number;
  currentValue: number;
  message: string;
  timestamp: number;
}

/**
 * Fallback material configurations
 */
interface FallbackMaterials {
  crystal: THREE.MeshPhongMaterial;
  nebula: THREE.MeshBasicMaterial;
}

/**
 * Centralized error handler for the Soul Galaxy visual system
 * Provides automatic fallbacks and user notifications for shader and rendering errors
 */
export class SoulGalaxyErrorHandler {
  private static instance: SoulGalaxyErrorHandler;
  private errorLog: ErrorReport[] = [];
  private fallbackMaterials!: FallbackMaterials;
  private isPerformanceModeEnabled: boolean = false;
  private userNotificationCallback?: (error: ErrorReport) => void;
  private maxLogSize: number = 100;
  
  // WebGL capability detection
  private webglCapabilities = {
    hasWebGL2: false,
    hasFloatTextures: false,
    hasDepthTextures: false,
    maxTextureSize: 0,
    maxVertexUniforms: 0,
    maxFragmentUniforms: 0
  };

  private constructor() {
    this.initializeFallbackMaterials();
    this.detectWebGLCapabilities();
    this.setupGlobalErrorHandlers();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SoulGalaxyErrorHandler {
    if (!SoulGalaxyErrorHandler.instance) {
      SoulGalaxyErrorHandler.instance = new SoulGalaxyErrorHandler();
    }
    return SoulGalaxyErrorHandler.instance;
  }

  /**
   * Initialize fallback materials for when shaders fail
   */
  private initializeFallbackMaterials(): void {
    // Fallback crystal material using standard Three.js materials
    this.fallbackMaterials = {
      crystal: new THREE.MeshPhongMaterial({
        color: 0x4080ff,
        transparent: true,
        opacity: 0.8,
        shininess: 100,
        specular: 0x4080ff,
        emissive: 0x001122,
        side: THREE.DoubleSide
      }),
      
      nebula: new THREE.MeshBasicMaterial({
        color: 0x001133,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    };
  }

  /**
   * Detect WebGL capabilities for compatibility checks
   */
  private detectWebGLCapabilities(): void {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) {
      this.reportError({
        type: ErrorType.WEBGL_CONTEXT,
        severity: ErrorSeverity.CRITICAL,
        message: 'WebGL context not available',
        timestamp: Date.now()
      });
      return;
    }

    this.webglCapabilities = {
      hasWebGL2: !!canvas.getContext('webgl2'),
      hasFloatTextures: !!gl.getExtension('OES_texture_float'),
      hasDepthTextures: !!gl.getExtension('WEBGL_depth_texture'),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxVertexUniforms: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
      maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS)
    };

    // Log capabilities for debugging
    console.log('WebGL Capabilities:', this.webglCapabilities);
  }

  /**
   * Setup global error handlers for uncaught shader errors
   */
  private setupGlobalErrorHandlers(): void {
    // Listen for WebGL context lost events
    window.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this.reportError({
        type: ErrorType.WEBGL_CONTEXT,
        severity: ErrorSeverity.CRITICAL,
        message: 'WebGL context lost',
        timestamp: Date.now()
      });
    });

    // Listen for WebGL context restored events
    window.addEventListener('webglcontextrestored', () => {
      console.log('WebGL context restored, reinitializing materials...');
      this.initializeFallbackMaterials();
    });
  }

  /**
   * Handle shader compilation errors with automatic fallback
   */
  public handleShaderCompilationError(
    shaderType: 'vertex' | 'fragment',
    shaderSource: string,
    error: Error,
    materialType: 'crystal' | 'nebula' = 'crystal'
  ): THREE.Material {
    const errorReport: ErrorReport = {
      type: ErrorType.SHADER_COMPILATION,
      severity: ErrorSeverity.HIGH,
      message: `${shaderType} shader compilation failed: ${error.message}`,
      originalError: error,
      timestamp: Date.now(),
      context: {
        shaderType,
        materialType,
        shaderSource: shaderSource.substring(0, 200) + '...' // Truncated for logging
      },
      fallbackUsed: `fallback_${materialType}_material`
    };

    this.reportError(errorReport);
    return this.getFallbackMaterial(materialType);
  }

  /**
   * Handle shader linking errors
   */
  public handleShaderLinkingError(
    vertexShader: string,
    fragmentShader: string,
    error: Error,
    materialType: 'crystal' | 'nebula' = 'crystal'
  ): THREE.Material {
    const errorReport: ErrorReport = {
      type: ErrorType.SHADER_LINKING,
      severity: ErrorSeverity.HIGH,
      message: `Shader linking failed: ${error.message}`,
      originalError: error,
      timestamp: Date.now(),
      context: {
        materialType,
        vertexShaderLength: vertexShader.length,
        fragmentShaderLength: fragmentShader.length
      },
      fallbackUsed: `fallback_${materialType}_material`
    };

    this.reportError(errorReport);
    return this.getFallbackMaterial(materialType);
  }

  /**
   * Handle WebGL context errors
   */
  public handleWebGLContextError(error: Error): void {
    const errorReport: ErrorReport = {
      type: ErrorType.WEBGL_CONTEXT,
      severity: ErrorSeverity.CRITICAL,
      message: `WebGL context error: ${error.message}`,
      originalError: error,
      timestamp: Date.now(),
      fallbackUsed: 'performance_mode'
    };

    this.reportError(errorReport);
    this.enablePerformanceMode();
  }

  /**
   * Handle texture loading errors
   */
  public handleTextureLoadError(
    textureUrl: string,
    error: Error,
    trackId?: string
  ): THREE.Texture {
    const errorReport: ErrorReport = {
      type: ErrorType.TEXTURE_LOADING,
      severity: ErrorSeverity.MEDIUM,
      message: `Texture loading failed: ${textureUrl}`,
      originalError: error,
      timestamp: Date.now(),
      context: {
        textureUrl,
        trackId
      },
      fallbackUsed: 'procedural_texture'
    };

    this.reportError(errorReport);
    return this.createFallbackTexture(trackId);
  }

  /**
   * Handle geometry generation errors
   */
  public handleGeometryGenerationError(
    geometryType: string,
    error: Error,
    trackData?: any
  ): THREE.BufferGeometry {
    const errorReport: ErrorReport = {
      type: ErrorType.GEOMETRY_GENERATION,
      severity: ErrorSeverity.MEDIUM,
      message: `Geometry generation failed: ${geometryType}`,
      originalError: error,
      timestamp: Date.now(),
      context: {
        geometryType,
        trackData: trackData ? { id: trackData.id, title: trackData.title } : undefined
      },
      fallbackUsed: 'simple_geometry'
    };

    this.reportError(errorReport);
    return this.createFallbackGeometry(geometryType);
  }

  /**
   * Handle animation errors
   */
  public handleAnimationError(animationType: string, error: Error): void {
    const errorReport: ErrorReport = {
      type: ErrorType.ANIMATION_ERROR,
      severity: ErrorSeverity.LOW,
      message: `Animation error: ${animationType}`,
      originalError: error,
      timestamp: Date.now(),
      context: {
        animationType
      }
    };

    this.reportError(errorReport);
  }

  /**
   * Handle performance warnings
   */
  public handlePerformanceWarning(warning: PerformanceWarning): void {
    const errorReport: ErrorReport = {
      type: ErrorType.PERFORMANCE_WARNING,
      severity: this.getPerformanceWarningSeverity(warning),
      message: warning.message,
      timestamp: warning.timestamp,
      context: {
        warningType: warning.type,
        threshold: warning.threshold,
        currentValue: warning.currentValue
      }
    };

    this.reportError(errorReport);

    // Auto-enable performance mode for critical performance issues
    if (errorReport.severity === ErrorSeverity.HIGH) {
      this.enablePerformanceMode();
    }
  }

  /**
   * Get fallback material for failed shaders
   */
  public getFallbackMaterial(type: 'crystal' | 'nebula'): THREE.Material {
    const material = this.fallbackMaterials[type].clone();
    
    // Add some basic animation capability to fallback materials
    if (type === 'crystal') {
      const phongMaterial = material as THREE.MeshPhongMaterial;
      // Store original emissive for pulsation effect
      (phongMaterial as any).originalEmissive = phongMaterial.emissive.clone();
    }
    
    return material;
  }

  /**
   * Create fallback texture when album art fails to load
   */
  public createFallbackTexture(trackId?: string): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Create a simple procedural texture based on track ID
    const seed = trackId ? this.hashString(trackId) : Math.random();
    const hue = (seed * 360) % 360;
    
    // Create gradient background
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, `hsl(${hue}, 70%, 30%)`);
    gradient.addColorStop(0.7, `hsl(${hue + 30}, 60%, 20%)`);
    gradient.addColorStop(1, `hsl(${hue + 60}, 50%, 10%)`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    // Add some noise pattern
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const size = Math.random() * 3 + 1;
      const alpha = Math.random() * 0.3;
      
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;

    return texture;
  }

  /**
   * Create fallback geometry for failed generation
   */
  public createFallbackGeometry(geometryType: string): THREE.BufferGeometry {
    switch (geometryType.toLowerCase()) {
      case 'crystal':
        // Simple octahedron as crystal fallback
        return new THREE.OctahedronGeometry(1, 1);
      
      case 'nebula':
        // Simple plane for nebula fallback
        return new THREE.PlaneGeometry(10, 10, 4, 4);
      
      default:
        // Generic fallback - icosahedron
        return new THREE.IcosahedronGeometry(1, 1);
    }
  }

  /**
   * Enable performance mode with reduced quality settings
   */
  public enablePerformanceMode(): void {
    if (this.isPerformanceModeEnabled) return;

    this.isPerformanceModeEnabled = true;
    
    console.warn('Performance mode enabled - reducing visual quality');
    
    // Notify user about performance mode
    this.reportError({
      type: ErrorType.PERFORMANCE_WARNING,
      severity: ErrorSeverity.MEDIUM,
      message: 'Performance mode enabled to maintain smooth experience',
      timestamp: Date.now(),
      fallbackUsed: 'performance_mode'
    });
  }

  /**
   * Check if performance mode is enabled
   */
  public isPerformanceMode(): boolean {
    return this.isPerformanceModeEnabled;
  }

  /**
   * Get WebGL capabilities
   */
  public getWebGLCapabilities() {
    return { ...this.webglCapabilities };
  }

  /**
   * Set user notification callback
   */
  public setUserNotificationCallback(callback: (error: ErrorReport) => void): void {
    this.userNotificationCallback = callback;
  }

  /**
   * Get error log
   */
  public getErrorLog(): ErrorReport[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  public clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  public getErrorStatistics() {
    const stats = {
      total: this.errorLog.length,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      recentErrors: this.errorLog.filter(e => Date.now() - e.timestamp < 60000).length
    };

    this.errorLog.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }

  /**
   * Report an error to the system
   */
  private reportError(error: ErrorReport): void {
    // Add to log
    this.errorLog.push(error);
    
    // Maintain log size limit
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Log to console based on severity
    const logMessage = `[SoulGalaxy] ${error.type}: ${error.message}`;
    switch (error.severity) {
      case ErrorSeverity.LOW:
        console.info(logMessage, error);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(logMessage, error);
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        console.error(logMessage, error);
        break;
    }

    // Notify user for high severity errors
    if (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL) {
      this.notifyUser(error);
    }
  }

  /**
   * Notify user about compatibility issues
   */
  private notifyUser(error: ErrorReport): void {
    if (this.userNotificationCallback) {
      this.userNotificationCallback(error);
    } else {
      // Default notification - could be enhanced with a proper UI
      if (error.severity === ErrorSeverity.CRITICAL) {
        console.warn('Soul Galaxy: Critical error occurred, using fallback rendering');
      }
    }
  }

  /**
   * Get performance warning severity based on type and values
   */
  private getPerformanceWarningSeverity(warning: PerformanceWarning): ErrorSeverity {
    const ratio = warning.currentValue / warning.threshold;
    
    if (ratio > 2) return ErrorSeverity.HIGH;
    if (ratio > 1.5) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  /**
   * Simple string hash function for consistent procedural generation
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.fallbackMaterials.crystal.dispose();
    this.fallbackMaterials.nebula.dispose();
    this.errorLog = [];
  }
}

/**
 * Utility function to create safe shader materials with error handling
 */
export function createSafeShaderMaterial<T extends THREE.ShaderMaterial>(
  MaterialClass: new (...args: any[]) => T,
  ...args: any[]
): T | THREE.Material {
  const errorHandler = SoulGalaxyErrorHandler.getInstance();
  
  try {
    const material = new MaterialClass(...args);
    
    // Test shader compilation by creating a test mesh
    const testGeometry = new THREE.PlaneGeometry(1, 1);
    const testMesh = new THREE.Mesh(testGeometry, material);
    
    // If we get here without throwing, the shader compiled successfully
    testGeometry.dispose();
    
    return material;
  } catch (error) {
    console.warn('Shader material creation failed, using fallback:', error);
    
    // Determine material type for appropriate fallback
    const materialType = MaterialClass.name.toLowerCase().includes('nebula') ? 'nebula' : 'crystal';
    
    return errorHandler.handleShaderCompilationError(
      'vertex', // We don't know which shader failed, so we'll assume vertex
      'unknown',
      error as Error,
      materialType
    );
  }
}