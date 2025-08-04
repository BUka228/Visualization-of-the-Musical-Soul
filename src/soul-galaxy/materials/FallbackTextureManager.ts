import * as THREE from 'three';
import { SoulGalaxyErrorHandler } from '../core/SoulGalaxyErrorHandler';

/**
 * Procedural texture types for fallbacks
 */
export enum ProceduralTextureType {
  GENRE_BASED = 'genre_based',
  ENERGY_BASED = 'energy_based',
  ABSTRACT = 'abstract',
  MINIMAL = 'minimal'
}

/**
 * Device performance levels
 */
export enum DevicePerformanceLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

/**
 * Texture quality settings
 */
interface TextureQualitySettings {
  maxSize: number;
  compression: boolean;
  mipmaps: boolean;
  anisotropy: number;
}

/**
 * Enhanced texture manager with fallback support and performance optimization
 */
export class FallbackTextureManager {
  private static instance: FallbackTextureManager;
  private errorHandler: SoulGalaxyErrorHandler;
  private textureCache: Map<string, THREE.Texture> = new Map();
  private proceduralCache: Map<string, THREE.Texture> = new Map();
  private devicePerformanceLevel: DevicePerformanceLevel;
  private qualitySettings: TextureQualitySettings;
  private loader: THREE.TextureLoader;

  private constructor() {
    this.errorHandler = SoulGalaxyErrorHandler.getInstance();
    this.loader = new THREE.TextureLoader();
    this.devicePerformanceLevel = this.detectDevicePerformance();
    this.qualitySettings = this.getQualitySettingsForDevice(this.devicePerformanceLevel);
    
    console.log(`Device performance level: ${this.devicePerformanceLevel}`);
    console.log('Texture quality settings:', this.qualitySettings);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): FallbackTextureManager {
    if (!FallbackTextureManager.instance) {
      FallbackTextureManager.instance = new FallbackTextureManager();
    }
    return FallbackTextureManager.instance;
  }

  /**
   * Detect device performance level based on WebGL capabilities
   */
  private detectDevicePerformance(): DevicePerformanceLevel {
    const capabilities = this.errorHandler.getWebGLCapabilities();
    
    // Check various performance indicators
    const indicators = {
      hasWebGL2: capabilities.hasWebGL2,
      hasFloatTextures: capabilities.hasFloatTextures,
      maxTextureSize: capabilities.maxTextureSize,
      maxVertexUniforms: capabilities.maxVertexUniforms,
      maxFragmentUniforms: capabilities.maxFragmentUniforms
    };

    // Get renderer info for additional detection
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    let renderer = 'unknown';
    let vendor = 'unknown';
    
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        renderer = (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string).toLowerCase();
        vendor = (gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) as string).toLowerCase();
      }
    }

    // Performance scoring
    let score = 0;
    
    // WebGL 2.0 support
    if (indicators.hasWebGL2) score += 20;
    
    // Float texture support
    if (indicators.hasFloatTextures) score += 15;
    
    // Texture size support
    if (indicators.maxTextureSize >= 4096) score += 20;
    else if (indicators.maxTextureSize >= 2048) score += 10;
    
    // Uniform support
    if (indicators.maxVertexUniforms >= 256) score += 10;
    if (indicators.maxFragmentUniforms >= 256) score += 10;
    
    // GPU detection (basic heuristics)
    if (renderer.includes('nvidia') || renderer.includes('amd') || renderer.includes('radeon')) {
      score += 15;
    } else if (renderer.includes('intel')) {
      score += 5;
    }
    
    // Mobile detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) score -= 20;
    
    // Memory detection (if available)
    if ((navigator as any).deviceMemory) {
      const memory = (navigator as any).deviceMemory;
      if (memory >= 8) score += 10;
      else if (memory >= 4) score += 5;
      else score -= 10;
    }

    // Determine performance level
    if (score >= 60) return DevicePerformanceLevel.HIGH;
    if (score >= 30) return DevicePerformanceLevel.MEDIUM;
    return DevicePerformanceLevel.LOW;
  }

  /**
   * Get texture quality settings based on device performance
   */
  private getQualitySettingsForDevice(performanceLevel: DevicePerformanceLevel): TextureQualitySettings {
    switch (performanceLevel) {
      case DevicePerformanceLevel.HIGH:
        return {
          maxSize: 1024,
          compression: false,
          mipmaps: true,
          anisotropy: 4
        };
      
      case DevicePerformanceLevel.MEDIUM:
        return {
          maxSize: 512,
          compression: true,
          mipmaps: true,
          anisotropy: 2
        };
      
      case DevicePerformanceLevel.LOW:
        return {
          maxSize: 256,
          compression: true,
          mipmaps: false,
          anisotropy: 1
        };
    }
  }

  /**
   * Load texture with automatic fallback and quality optimization
   */
  public async loadTextureWithFallback(
    url: string,
    trackId: string,
    options: {
      genre?: string;
      energy?: number;
      fallbackType?: ProceduralTextureType;
      forceQuality?: TextureQualitySettings;
    } = {}
  ): Promise<THREE.Texture> {
    const cacheKey = `${url}_${trackId}`;
    
    // Check cache first
    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }

    try {
      // Attempt to load the original texture
      const texture = await this.loadTextureWithTimeout(url, 5000); // 5 second timeout
      
      // Apply quality settings
      this.applyQualitySettings(texture, options.forceQuality || this.qualitySettings);
      
      // Cache the texture
      this.textureCache.set(cacheKey, texture);
      
      return texture;
    } catch (error) {
      console.warn(`Texture loading failed for ${url}, creating fallback:`, error);
      
      // Report error
      this.errorHandler.handleTextureLoadError(url, error as Error, trackId);
      
      // Create fallback texture
      const fallbackTexture = this.createProceduralTexture(
        trackId,
        options.fallbackType || ProceduralTextureType.GENRE_BASED,
        {
          genre: options.genre,
          energy: options.energy
        }
      );
      
      // Cache the fallback
      this.textureCache.set(cacheKey, fallbackTexture);
      
      return fallbackTexture;
    }
  }

  /**
   * Load texture with timeout
   */
  private loadTextureWithTimeout(url: string, timeout: number): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Texture loading timeout: ${url}`));
      }, timeout);

      this.loader.load(
        url,
        (texture) => {
          clearTimeout(timeoutId);
          resolve(texture);
        },
        undefined, // onProgress
        (error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      );
    });
  }

  /**
   * Apply quality settings to texture
   */
  private applyQualitySettings(texture: THREE.Texture, settings: TextureQualitySettings): void {
    // Resize if necessary
    if (texture.image && (texture.image.width > settings.maxSize || texture.image.height > settings.maxSize)) {
      texture.image = this.resizeImage(texture.image, settings.maxSize);
    }

    // Set filtering
    if (settings.mipmaps) {
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
    } else {
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    }

    // Set anisotropy
    texture.anisotropy = settings.anisotropy;

    // Set wrapping
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    texture.needsUpdate = true;
  }

  /**
   * Resize image to fit within max size while maintaining aspect ratio
   */
  private resizeImage(image: HTMLImageElement | HTMLCanvasElement, maxSize: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Calculate new dimensions
    let { width, height } = image;
    if (width > height) {
      if (width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      }
    } else {
      if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }
    }

    canvas.width = width;
    canvas.height = height;

    // Draw resized image
    ctx.drawImage(image, 0, 0, width, height);

    return canvas;
  }

  /**
   * Create procedural texture based on track data
   */
  public createProceduralTexture(
    trackId: string,
    type: ProceduralTextureType,
    data: {
      genre?: string;
      energy?: number;
      color?: THREE.Color;
    } = {}
  ): THREE.Texture {
    const cacheKey = `${type}_${trackId}_${data.genre || 'unknown'}_${data.energy || 0}`;
    
    // Check procedural cache
    if (this.proceduralCache.has(cacheKey)) {
      return this.proceduralCache.get(cacheKey)!;
    }

    const size = this.qualitySettings.maxSize;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Generate texture based on type
    switch (type) {
      case ProceduralTextureType.GENRE_BASED:
        this.generateGenreBasedTexture(ctx, size, data);
        break;
      
      case ProceduralTextureType.ENERGY_BASED:
        this.generateEnergyBasedTexture(ctx, size, data);
        break;
      
      case ProceduralTextureType.ABSTRACT:
        this.generateAbstractTexture(ctx, size, data);
        break;
      
      case ProceduralTextureType.MINIMAL:
        this.generateMinimalTexture(ctx, size, data);
        break;
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.applyQualitySettings(texture, this.qualitySettings);

    // Cache the procedural texture
    this.proceduralCache.set(cacheKey, texture);

    return texture;
  }

  /**
   * Generate genre-based procedural texture
   */
  private generateGenreBasedTexture(
    ctx: CanvasRenderingContext2D,
    size: number,
    data: { genre?: string; energy?: number }
  ): void {
    const genre = data.genre || 'default';
    const energy = data.energy || 0.5;

    // Genre color mapping
    const genreColors = {
      metal: ['#FF0040', '#800020', '#400010'],
      rock: ['#0080FF', '#004080', '#002040'],
      punk: ['#00FF40', '#008020', '#004010'],
      electronic: ['#8000FF', '#400080', '#200040'],
      jazz: ['#FFD700', '#806800', '#403400'],
      classical: ['#E0E0FF', '#707080', '#383840'],
      pop: ['#FF0080', '#800040', '#400020'],
      indie: ['#00FFFF', '#008080', '#004040'],
      hiphop: ['#FF8000', '#804000', '#402000'],
      default: ['#FFFFFF', '#808080', '#404040']
    };

    const colors = genreColors[genre as keyof typeof genreColors] || genreColors.default;

    // Create gradient background
    const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.6, colors[1]);
    gradient.addColorStop(1, colors[2]);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Add genre-specific patterns
    this.addGenrePattern(ctx, size, genre, energy);
  }

  /**
   * Add genre-specific patterns to texture
   */
  private addGenrePattern(
    ctx: CanvasRenderingContext2D,
    size: number,
    genre: string,
    energy: number
  ): void {
    ctx.globalCompositeOperation = 'overlay';
    
    switch (genre) {
      case 'metal':
        // Sharp, angular patterns
        this.drawAngularPattern(ctx, size, energy);
        break;
      
      case 'rock':
        // Rough, textured patterns
        this.drawRoughPattern(ctx, size, energy);
        break;
      
      case 'electronic':
        // Circuit-like patterns
        this.drawCircuitPattern(ctx, size, energy);
        break;
      
      case 'jazz':
        // Smooth, flowing patterns
        this.drawFlowingPattern(ctx, size, energy);
        break;
      
      default:
        // Generic noise pattern
        this.drawNoisePattern(ctx, size, energy);
        break;
    }
    
    ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * Draw angular pattern for metal genre
   */
  private drawAngularPattern(ctx: CanvasRenderingContext2D, size: number, energy: number): void {
    const numLines = Math.floor(20 + energy * 30);
    
    for (let i = 0; i < numLines; i++) {
      const angle = (Math.PI * 2 * i) / numLines;
      const length = size * (0.3 + energy * 0.4);
      
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + energy * 0.2})`;
      ctx.lineWidth = 1 + energy * 2;
      ctx.beginPath();
      ctx.moveTo(size/2, size/2);
      ctx.lineTo(
        size/2 + Math.cos(angle) * length,
        size/2 + Math.sin(angle) * length
      );
      ctx.stroke();
    }
  }

  /**
   * Draw rough pattern for rock genre
   */
  private drawRoughPattern(ctx: CanvasRenderingContext2D, size: number, energy: number): void {
    const numPoints = Math.floor(100 + energy * 200);
    
    for (let i = 0; i < numPoints; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = Math.random() * (2 + energy * 4);
      
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Draw circuit pattern for electronic genre
   */
  private drawCircuitPattern(ctx: CanvasRenderingContext2D, size: number, energy: number): void {
    const gridSize = Math.floor(8 + energy * 8);
    const cellSize = size / gridSize;
    
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + energy * 0.3})`;
    ctx.lineWidth = 1;
    
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        if (Math.random() < 0.3 + energy * 0.4) {
          const startX = x * cellSize;
          const startY = y * cellSize;
          
          ctx.beginPath();
          ctx.rect(startX, startY, cellSize, cellSize);
          ctx.stroke();
          
          // Add connecting lines
          if (Math.random() < 0.5) {
            ctx.beginPath();
            ctx.moveTo(startX + cellSize/2, startY);
            ctx.lineTo(startX + cellSize/2, startY + cellSize);
            ctx.stroke();
          }
          
          if (Math.random() < 0.5) {
            ctx.beginPath();
            ctx.moveTo(startX, startY + cellSize/2);
            ctx.lineTo(startX + cellSize, startY + cellSize/2);
            ctx.stroke();
          }
        }
      }
    }
  }

  /**
   * Draw flowing pattern for jazz genre
   */
  private drawFlowingPattern(ctx: CanvasRenderingContext2D, size: number, energy: number): void {
    const numCurves = Math.floor(5 + energy * 10);
    
    for (let i = 0; i < numCurves; i++) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.2})`;
      ctx.lineWidth = 1 + Math.random() * 3;
      
      ctx.beginPath();
      const startX = Math.random() * size;
      const startY = Math.random() * size;
      ctx.moveTo(startX, startY);
      
      // Create smooth curves
      for (let j = 0; j < 5; j++) {
        const cpX = Math.random() * size;
        const cpY = Math.random() * size;
        const endX = Math.random() * size;
        const endY = Math.random() * size;
        
        ctx.quadraticCurveTo(cpX, cpY, endX, endY);
      }
      
      ctx.stroke();
    }
  }

  /**
   * Draw generic noise pattern
   */
  private drawNoisePattern(ctx: CanvasRenderingContext2D, size: number, energy: number): void {
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 255 * energy * 0.3;
      data[i] = noise;     // Red
      data[i + 1] = noise; // Green
      data[i + 2] = noise; // Blue
      data[i + 3] = noise; // Alpha
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Generate energy-based procedural texture
   */
  private generateEnergyBasedTexture(
    ctx: CanvasRenderingContext2D,
    size: number,
    data: { energy?: number; color?: THREE.Color }
  ): void {
    const energy = data.energy || 0.5;
    const baseColor = data.color || new THREE.Color(0x4080ff);
    
    // Create energy-based gradient
    const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    
    const r = Math.floor(baseColor.r * 255);
    const g = Math.floor(baseColor.g * 255);
    const b = Math.floor(baseColor.b * 255);
    
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${energy})`);
    gradient.addColorStop(0.5, `rgba(${r/2}, ${g/2}, ${b/2}, ${energy * 0.7})`);
    gradient.addColorStop(1, `rgba(${r/4}, ${g/4}, ${b/4}, ${energy * 0.3})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Add energy-based effects
    const numEffects = Math.floor(energy * 50);
    for (let i = 0; i < numEffects; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = Math.random() * energy * 20;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * energy * 0.5})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Generate abstract procedural texture
   */
  private generateAbstractTexture(
    ctx: CanvasRenderingContext2D,
    size: number,
    data: { color?: THREE.Color }
  ): void {
    const baseColor = data.color || new THREE.Color(0x808080);
    
    // Create abstract pattern with multiple layers
    for (let layer = 0; layer < 3; layer++) {
      const numShapes = 20 + layer * 10;
      
      for (let i = 0; i < numShapes; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const radius = Math.random() * (size / 8);
        const alpha = Math.random() * 0.3;
        
        const r = Math.floor(baseColor.r * 255 + (Math.random() - 0.5) * 100);
        const g = Math.floor(baseColor.g * 255 + (Math.random() - 0.5) * 100);
        const b = Math.floor(baseColor.b * 255 + (Math.random() - 0.5) * 100);
        
        ctx.fillStyle = `rgba(${Math.max(0, Math.min(255, r))}, ${Math.max(0, Math.min(255, g))}, ${Math.max(0, Math.min(255, b))}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /**
   * Generate minimal procedural texture
   */
  private generateMinimalTexture(
    ctx: CanvasRenderingContext2D,
    size: number,
    data: { color?: THREE.Color }
  ): void {
    const baseColor = data.color || new THREE.Color(0x404040);
    
    const r = Math.floor(baseColor.r * 255);
    const g = Math.floor(baseColor.g * 255);
    const b = Math.floor(baseColor.b * 255);
    
    // Simple solid color with subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
    gradient.addColorStop(1, `rgb(${Math.floor(r * 0.8)}, ${Math.floor(g * 0.8)}, ${Math.floor(b * 0.8)})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  /**
   * Get device performance level
   */
  public getDevicePerformanceLevel(): DevicePerformanceLevel {
    return this.devicePerformanceLevel;
  }

  /**
   * Get current quality settings
   */
  public getQualitySettings(): TextureQualitySettings {
    return { ...this.qualitySettings };
  }

  /**
   * Override quality settings (useful for user preferences)
   */
  public setQualitySettings(settings: Partial<TextureQualitySettings>): void {
    this.qualitySettings = { ...this.qualitySettings, ...settings };
  }

  /**
   * Clear texture cache
   */
  public clearCache(): void {
    // Dispose of cached textures
    this.textureCache.forEach(texture => texture.dispose());
    this.proceduralCache.forEach(texture => texture.dispose());
    
    this.textureCache.clear();
    this.proceduralCache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStatistics(): {
    textureCache: number;
    proceduralCache: number;
    totalMemoryEstimate: number;
  } {
    const textureMemory = Array.from(this.textureCache.values()).reduce((total, texture) => {
      if (texture.image) {
        return total + (texture.image.width * texture.image.height * 4); // RGBA
      }
      return total;
    }, 0);

    const proceduralMemory = Array.from(this.proceduralCache.values()).reduce((total, texture) => {
      if (texture.image) {
        return total + (texture.image.width * texture.image.height * 4); // RGBA
      }
      return total;
    }, 0);

    return {
      textureCache: this.textureCache.size,
      proceduralCache: this.proceduralCache.size,
      totalMemoryEstimate: textureMemory + proceduralMemory
    };
  }

  /**
   * Dispose of the texture manager
   */
  public dispose(): void {
    this.clearCache();
  }
}