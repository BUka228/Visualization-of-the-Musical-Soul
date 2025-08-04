import { SoulGalaxyErrorHandler } from './SoulGalaxyErrorHandler';
import { DevicePerformanceLevel } from '../materials/FallbackTextureManager';
import { GeometryComplexity } from './FallbackGeometryManager';

/**
 * Performance benchmark results
 */
export interface PerformanceBenchmark {
  fps: number;
  drawCalls: number;
  triangles: number;
  memoryUsage: number;
  gpuTime: number;
}

/**
 * Device capabilities
 */
export interface DeviceCapabilities {
  webgl: {
    version: number;
    vendor: string;
    renderer: string;
    maxTextureSize: number;
    maxVertexUniforms: number;
    maxFragmentUniforms: number;
    extensions: string[];
  };
  hardware: {
    cores: number;
    memory: number;
    isMobile: boolean;
    platform: string;
  };
  performance: {
    level: DevicePerformanceLevel;
    score: number;
    benchmarkResults?: PerformanceBenchmark;
  };
}

/**
 * Quality settings for different performance levels
 */
export interface QualitySettings {
  textureQuality: {
    maxSize: number;
    compression: boolean;
    mipmaps: boolean;
    anisotropy: number;
  };
  geometryComplexity: GeometryComplexity;
  effects: {
    enableShaders: boolean;
    enablePostProcessing: boolean;
    enableParticles: boolean;
    particleCount: number;
    enableShadows: boolean;
  };
  rendering: {
    antialias: boolean;
    pixelRatio: number;
    maxFPS: number;
  };
}

/**
 * Device performance detector and optimizer for Soul Galaxy
 */
export class DevicePerformanceDetector {
  private static instance: DevicePerformanceDetector;
  private errorHandler: SoulGalaxyErrorHandler;
  private capabilities: DeviceCapabilities;
  private qualitySettings: QualitySettings;
  private benchmarkCanvas?: HTMLCanvasElement;
  private benchmarkRenderer?: THREE.WebGLRenderer;

  private constructor() {
    this.errorHandler = SoulGalaxyErrorHandler.getInstance();
    this.capabilities = this.detectCapabilities();
    this.qualitySettings = this.generateQualitySettings(this.capabilities.performance.level);
    
    console.log('Device capabilities detected:', this.capabilities);
    console.log('Quality settings applied:', this.qualitySettings);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DevicePerformanceDetector {
    if (!DevicePerformanceDetector.instance) {
      DevicePerformanceDetector.instance = new DevicePerformanceDetector();
    }
    return DevicePerformanceDetector.instance;
  }

  /**
   * Detect comprehensive device capabilities
   */
  private detectCapabilities(): DeviceCapabilities {
    const webglCapabilities = this.detectWebGLCapabilities();
    const hardwareCapabilities = this.detectHardwareCapabilities();
    const performanceLevel = this.calculatePerformanceLevel(webglCapabilities, hardwareCapabilities);

    return {
      webgl: webglCapabilities,
      hardware: hardwareCapabilities,
      performance: {
        level: performanceLevel.level,
        score: performanceLevel.score
      }
    };
  }

  /**
   * Detect WebGL capabilities
   */
  private detectWebGLCapabilities() {
    const canvas = document.createElement('canvas');
    const gl2 = canvas.getContext('webgl2') as WebGL2RenderingContext | null;
    const gl = gl2 || canvas.getContext('webgl') as WebGLRenderingContext | null || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;

    if (!gl) {
      throw new Error('WebGL not supported');
    }

    // Get debug info
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown';
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';

    // Get extensions
    const extensions = gl.getSupportedExtensions() || [];

    return {
      version: gl2 ? 2 : 1,
      vendor: vendor as string,
      renderer: renderer as string,
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) as number,
      maxVertexUniforms: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) as number,
      maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) as number,
      extensions
    };
  }

  /**
   * Detect hardware capabilities
   */
  private detectHardwareCapabilities() {
    // CPU cores
    const cores = navigator.hardwareConcurrency || 4;

    // Memory (if available)
    const memory = (navigator as any).deviceMemory || 4;

    // Mobile detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Platform
    const platform = navigator.platform;

    return {
      cores,
      memory,
      isMobile,
      platform
    };
  }

  /**
   * Calculate performance level based on capabilities
   */
  private calculatePerformanceLevel(
    webgl: any,
    hardware: any
  ): { level: DevicePerformanceLevel; score: number } {
    let score = 0;

    // WebGL version and features
    if (webgl.version >= 2) score += 25;
    else score += 10;

    // GPU detection (heuristic)
    const renderer = webgl.renderer.toLowerCase();
    if (renderer.includes('nvidia')) {
      if (renderer.includes('rtx') || renderer.includes('gtx 1')) score += 40;
      else if (renderer.includes('gtx')) score += 30;
      else score += 20;
    } else if (renderer.includes('amd') || renderer.includes('radeon')) {
      if (renderer.includes('rx')) score += 35;
      else score += 25;
    } else if (renderer.includes('intel')) {
      if (renderer.includes('iris') || renderer.includes('xe')) score += 15;
      else score += 8;
    } else if (renderer.includes('apple')) {
      score += 25; // Apple Silicon is generally good
    }

    // Texture capabilities
    if (webgl.maxTextureSize >= 8192) score += 15;
    else if (webgl.maxTextureSize >= 4096) score += 10;
    else if (webgl.maxTextureSize >= 2048) score += 5;

    // Uniform limits
    if (webgl.maxVertexUniforms >= 512) score += 10;
    else if (webgl.maxVertexUniforms >= 256) score += 5;

    if (webgl.maxFragmentUniforms >= 512) score += 10;
    else if (webgl.maxFragmentUniforms >= 256) score += 5;

    // Extensions
    const importantExtensions = [
      'OES_texture_float',
      'OES_texture_half_float',
      'WEBGL_depth_texture',
      'EXT_texture_filter_anisotropic'
    ];
    
    const supportedImportant = importantExtensions.filter(ext => 
      webgl.extensions.includes(ext)
    ).length;
    
    score += supportedImportant * 3;

    // Hardware factors
    if (hardware.cores >= 8) score += 10;
    else if (hardware.cores >= 4) score += 5;

    if (hardware.memory >= 16) score += 15;
    else if (hardware.memory >= 8) score += 10;
    else if (hardware.memory >= 4) score += 5;

    // Mobile penalty
    if (hardware.isMobile) score -= 25;

    // Performance mode penalty
    if (this.errorHandler.isPerformanceMode()) score -= 20;

    // Determine level
    let level: DevicePerformanceLevel;
    if (score >= 80) level = DevicePerformanceLevel.HIGH;
    else if (score >= 45) level = DevicePerformanceLevel.MEDIUM;
    else level = DevicePerformanceLevel.LOW;

    return { level, score };
  }

  /**
   * Generate quality settings based on performance level
   */
  private generateQualitySettings(performanceLevel: DevicePerformanceLevel): QualitySettings {
    switch (performanceLevel) {
      case DevicePerformanceLevel.HIGH:
        return {
          textureQuality: {
            maxSize: 1024,
            compression: false,
            mipmaps: true,
            anisotropy: 4
          },
          geometryComplexity: GeometryComplexity.HIGH,
          effects: {
            enableShaders: true,
            enablePostProcessing: true,
            enableParticles: true,
            particleCount: 500,
            enableShadows: true
          },
          rendering: {
            antialias: true,
            pixelRatio: Math.min(window.devicePixelRatio, 2),
            maxFPS: 60
          }
        };

      case DevicePerformanceLevel.MEDIUM:
        return {
          textureQuality: {
            maxSize: 512,
            compression: true,
            mipmaps: true,
            anisotropy: 2
          },
          geometryComplexity: GeometryComplexity.MEDIUM,
          effects: {
            enableShaders: true,
            enablePostProcessing: false,
            enableParticles: true,
            particleCount: 250,
            enableShadows: false
          },
          rendering: {
            antialias: false,
            pixelRatio: Math.min(window.devicePixelRatio, 1.5),
            maxFPS: 60
          }
        };

      case DevicePerformanceLevel.LOW:
        return {
          textureQuality: {
            maxSize: 256,
            compression: true,
            mipmaps: false,
            anisotropy: 1
          },
          geometryComplexity: GeometryComplexity.LOW,
          effects: {
            enableShaders: false,
            enablePostProcessing: false,
            enableParticles: true,
            particleCount: 100,
            enableShadows: false
          },
          rendering: {
            antialias: false,
            pixelRatio: 1,
            maxFPS: 30
          }
        };
    }
  }

  /**
   * Run performance benchmark
   */
  public async runBenchmark(): Promise<PerformanceBenchmark> {
    return new Promise((resolve) => {
      // Create benchmark canvas
      this.benchmarkCanvas = document.createElement('canvas');
      this.benchmarkCanvas.width = 512;
      this.benchmarkCanvas.height = 512;
      this.benchmarkCanvas.style.position = 'absolute';
      this.benchmarkCanvas.style.top = '-1000px';
      this.benchmarkCanvas.style.left = '-1000px';
      document.body.appendChild(this.benchmarkCanvas);

      // Create renderer
      this.benchmarkRenderer = new THREE.WebGLRenderer({
        canvas: this.benchmarkCanvas,
        antialias: false
      });

      // Create simple benchmark scene
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      
      // Add test objects
      const geometry = new THREE.IcosahedronGeometry(1, 2);
      const material = new THREE.MeshBasicMaterial({ color: 0x4080ff });
      
      const meshes: THREE.Mesh[] = [];
      for (let i = 0; i < 50; i++) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        );
        scene.add(mesh);
        meshes.push(mesh);
      }

      camera.position.z = 5;

      // Benchmark variables
      let frameCount = 0;
      let startTime = performance.now();
      let totalFrameTime = 0;
      const maxFrames = 120; // 2 seconds at 60fps

      // Benchmark loop
      const benchmarkLoop = () => {
        const frameStart = performance.now();

        // Animate objects
        meshes.forEach((mesh, index) => {
          mesh.rotation.x += 0.01 * (index + 1);
          mesh.rotation.y += 0.01 * (index + 1);
        });

        // Render
        this.benchmarkRenderer!.render(scene, camera);

        const frameEnd = performance.now();
        totalFrameTime += frameEnd - frameStart;
        frameCount++;

        if (frameCount < maxFrames) {
          requestAnimationFrame(benchmarkLoop);
        } else {
          // Calculate results
          const totalTime = performance.now() - startTime;
          const avgFPS = (frameCount / totalTime) * 1000;
          const avgFrameTime = totalFrameTime / frameCount;

          const results: PerformanceBenchmark = {
            fps: avgFPS,
            drawCalls: 50, // Approximate
            triangles: 50 * geometry.attributes.position.count / 3,
            memoryUsage: this.estimateMemoryUsage(),
            gpuTime: avgFrameTime
          };

          // Cleanup
          this.cleanupBenchmark();

          // Store results
          this.capabilities.performance.benchmarkResults = results;

          resolve(results);
        }
      };

      requestAnimationFrame(benchmarkLoop);
    });
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    if ((performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  /**
   * Cleanup benchmark resources
   */
  private cleanupBenchmark(): void {
    if (this.benchmarkRenderer) {
      this.benchmarkRenderer.dispose();
      this.benchmarkRenderer = undefined;
    }

    if (this.benchmarkCanvas && this.benchmarkCanvas.parentElement) {
      this.benchmarkCanvas.parentElement.removeChild(this.benchmarkCanvas);
      this.benchmarkCanvas = undefined;
    }
  }

  /**
   * Dynamically adjust quality based on runtime performance
   */
  public adjustQualityBasedOnPerformance(currentFPS: number): void {
    const targetFPS = this.qualitySettings.rendering.maxFPS;
    const fpsRatio = currentFPS / targetFPS;

    if (fpsRatio < 0.8) {
      // Performance is poor, reduce quality
      this.reduceQuality();
    } else if (fpsRatio > 1.2 && this.capabilities.performance.level !== DevicePerformanceLevel.HIGH) {
      // Performance is good, maybe we can increase quality
      this.increaseQuality();
    }
  }

  /**
   * Reduce quality settings
   */
  private reduceQuality(): void {
    const settings = this.qualitySettings;

    // Reduce texture quality
    if (settings.textureQuality.maxSize > 128) {
      settings.textureQuality.maxSize = Math.floor(settings.textureQuality.maxSize / 2);
    }

    // Reduce geometry complexity
    if (settings.geometryComplexity === GeometryComplexity.HIGH) {
      settings.geometryComplexity = GeometryComplexity.MEDIUM;
    } else if (settings.geometryComplexity === GeometryComplexity.MEDIUM) {
      settings.geometryComplexity = GeometryComplexity.LOW;
    }

    // Reduce effects
    if (settings.effects.enablePostProcessing) {
      settings.effects.enablePostProcessing = false;
    } else if (settings.effects.particleCount > 50) {
      settings.effects.particleCount = Math.floor(settings.effects.particleCount * 0.7);
    } else if (settings.effects.enableShaders) {
      settings.effects.enableShaders = false;
    }

    console.log('Quality reduced due to poor performance:', settings);
  }

  /**
   * Increase quality settings
   */
  private increaseQuality(): void {
    const settings = this.qualitySettings;

    // Only increase if we're not at the device's maximum level
    if (this.capabilities.performance.level === DevicePerformanceLevel.HIGH) {
      return;
    }

    // Increase geometry complexity
    if (settings.geometryComplexity === GeometryComplexity.LOW) {
      settings.geometryComplexity = GeometryComplexity.MEDIUM;
    } else if (settings.geometryComplexity === GeometryComplexity.MEDIUM && 
               this.capabilities.performance.level !== DevicePerformanceLevel.LOW) {
      settings.geometryComplexity = GeometryComplexity.HIGH;
    }

    // Increase effects
    if (!settings.effects.enableShaders && this.capabilities.webgl.version >= 2) {
      settings.effects.enableShaders = true;
    } else if (!settings.effects.enablePostProcessing && settings.effects.enableShaders) {
      settings.effects.enablePostProcessing = true;
    } else if (settings.effects.particleCount < 300) {
      settings.effects.particleCount = Math.floor(settings.effects.particleCount * 1.3);
    }

    console.log('Quality increased due to good performance:', settings);
  }

  /**
   * Get device capabilities
   */
  public getCapabilities(): DeviceCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Get current quality settings
   */
  public getQualitySettings(): QualitySettings {
    return { ...this.qualitySettings };
  }

  /**
   * Override quality settings
   */
  public setQualitySettings(settings: Partial<QualitySettings>): void {
    this.qualitySettings = { ...this.qualitySettings, ...settings };
  }

  /**
   * Get performance recommendations
   */
  public getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];
    const caps = this.capabilities;

    if (caps.performance.level === DevicePerformanceLevel.LOW) {
      recommendations.push('Consider closing other browser tabs to free up memory');
      recommendations.push('Disable browser extensions that might affect performance');
      
      if (caps.hardware.isMobile) {
        recommendations.push('Close other apps running in the background');
        recommendations.push('Ensure your device is not in power saving mode');
      }
    }

    if (caps.webgl.version < 2) {
      recommendations.push('Update your browser for better WebGL 2.0 support');
    }

    if (caps.webgl.maxTextureSize < 2048) {
      recommendations.push('Your graphics driver may need updating');
    }

    if (caps.hardware.memory < 4) {
      recommendations.push('Consider upgrading your device memory for better performance');
    }

    return recommendations;
  }

  /**
   * Generate performance report
   */
  public generatePerformanceReport(): string {
    const caps = this.capabilities;
    const settings = this.qualitySettings;

    return `
Soul Galaxy Performance Report
=============================

Device Performance Level: ${caps.performance.level.toUpperCase()}
Performance Score: ${caps.performance.score}/100

WebGL Capabilities:
- Version: ${caps.webgl.version}
- Vendor: ${caps.webgl.vendor}
- Renderer: ${caps.webgl.renderer}
- Max Texture Size: ${caps.webgl.maxTextureSize}px
- Extensions: ${caps.webgl.extensions.length} supported

Hardware:
- CPU Cores: ${caps.hardware.cores}
- Memory: ${caps.hardware.memory}GB
- Mobile: ${caps.hardware.isMobile ? 'Yes' : 'No'}
- Platform: ${caps.hardware.platform}

Quality Settings Applied:
- Texture Max Size: ${settings.textureQuality.maxSize}px
- Geometry Complexity: ${settings.geometryComplexity}
- Shaders Enabled: ${settings.effects.enableShaders ? 'Yes' : 'No'}
- Post-Processing: ${settings.effects.enablePostProcessing ? 'Yes' : 'No'}
- Particle Count: ${settings.effects.particleCount}
- Target FPS: ${settings.rendering.maxFPS}

${caps.performance.benchmarkResults ? `
Benchmark Results:
- Average FPS: ${caps.performance.benchmarkResults.fps.toFixed(1)}
- GPU Frame Time: ${caps.performance.benchmarkResults.gpuTime.toFixed(2)}ms
- Memory Usage: ${caps.performance.benchmarkResults.memoryUsage.toFixed(1)}MB
` : ''}

Recommendations:
${this.getPerformanceRecommendations().map(rec => `- ${rec}`).join('\n')}
    `.trim();
  }

  /**
   * Dispose of the performance detector
   */
  public dispose(): void {
    this.cleanupBenchmark();
  }
}

// Import THREE.js for benchmark
declare const THREE: any;