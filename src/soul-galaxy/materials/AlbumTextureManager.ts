import * as THREE from 'three';
import { ProcessedTrack } from '../../types';

/**
 * Configuration for album texture processing
 */
export interface AlbumTextureConfig {
  /** Maximum texture size for optimization */
  maxTextureSize: number;
  /** Cache size limit (number of textures) */
  cacheSize: number;
  /** Enable texture compression */
  enableCompression: boolean;
  /** Blur intensity for "memory" effect */
  blurIntensity: number;
  /** Distortion strength for procedural textures */
  distortionStrength: number;
  /** High quality texture size for focus mode */
  highQualityTextureSize: number;
  /** Enable preloading of high quality textures */
  enableHighQualityPreload: boolean;
}

/**
 * Texture quality levels for different states
 */
export enum TextureQuality {
  LOW = 'low',           // Heavily blurred for distant/unfocused crystals
  MEDIUM = 'medium',     // Standard quality for normal viewing
  HIGH = 'high'          // Sharp, high-quality for focused crystals
}

/**
 * Manages loading, caching, and processing of album cover textures
 * Implements distortion and blur effects for the "memory" aesthetic
 */
export class AlbumTextureManager {
  private textureCache: Map<string, THREE.Texture> = new Map();
  private highQualityCache: Map<string, THREE.Texture> = new Map();
  private loadingPromises: Map<string, Promise<THREE.Texture>> = new Map();
  private fallbackTextures: Map<string, THREE.Texture> = new Map();
  private config: AlbumTextureConfig;
  private textureLoader: THREE.TextureLoader;

  constructor(config: Partial<AlbumTextureConfig> = {}) {
    this.config = {
      maxTextureSize: 512,
      cacheSize: 100,
      enableCompression: true,
      blurIntensity: 0.3,
      distortionStrength: 0.1,
      highQualityTextureSize: 1024,
      enableHighQualityPreload: false,
      ...config
    };

    this.textureLoader = new THREE.TextureLoader();
    this.initializeFallbackTextures();
  }

  /**
   * Loads or retrieves album texture for a track
   */
  async getAlbumTexture(track: ProcessedTrack): Promise<THREE.Texture> {
    // If no image URL, return fallback immediately
    if (!track.imageUrl) {
      return this.getFallbackTexture(track.genre);
    }

    // Check cache first
    const cacheKey = this.getCacheKey(track);
    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }

    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!;
    }

    // Start loading
    const loadingPromise = this.loadTexture(track);
    this.loadingPromises.set(cacheKey, loadingPromise);

    try {
      const texture = await loadingPromise;
      this.cacheTexture(cacheKey, texture);
      return texture;
    } catch (error) {
      console.warn(`Failed to load album texture for ${track.name}:`, error);
      return this.getFallbackTexture(track.genre);
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Gets album texture with specified quality level
   */
  async getAlbumTextureWithQuality(track: ProcessedTrack, quality: TextureQuality): Promise<THREE.Texture> {
    switch (quality) {
      case TextureQuality.HIGH:
        return this.getHighQualityTexture(track);
      case TextureQuality.MEDIUM:
        return this.getAlbumTexture(track);
      case TextureQuality.LOW:
        return this.getLowQualityTexture(track);
      default:
        return this.getAlbumTexture(track);
    }
  }

  /**
   * Gets high-quality texture for focused crystals
   */
  async getHighQualityTexture(track: ProcessedTrack): Promise<THREE.Texture> {
    // If no image URL, return fallback immediately
    if (!track.imageUrl) {
      return this.getFallbackTexture(track.genre);
    }

    const cacheKey = this.getHighQualityCacheKey(track);
    
    // Check high-quality cache first
    if (this.highQualityCache.has(cacheKey)) {
      return this.highQualityCache.get(cacheKey)!;
    }

    // Check if already loading
    const loadingKey = `hq_${cacheKey}`;
    if (this.loadingPromises.has(loadingKey)) {
      return this.loadingPromises.get(loadingKey)!;
    }

    // Start loading high-quality texture
    const loadingPromise = this.loadHighQualityTexture(track);
    this.loadingPromises.set(loadingKey, loadingPromise);

    try {
      const texture = await loadingPromise;
      this.cacheHighQualityTexture(cacheKey, texture);
      return texture;
    } catch (error) {
      console.warn(`Failed to load high-quality texture for ${track.name}:`, error);
      // Fallback to regular quality
      return this.getAlbumTexture(track);
    } finally {
      this.loadingPromises.delete(loadingKey);
    }
  }

  /**
   * Gets low-quality (heavily blurred) texture for distant crystals
   */
  async getLowQualityTexture(track: ProcessedTrack): Promise<THREE.Texture> {
    const cacheKey = this.getLowQualityCacheKey(track);
    
    // Check if we already have a low-quality version
    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }

    // Get the regular texture first
    const regularTexture = await this.getAlbumTexture(track);
    
    // Create blurred version
    const blurredTexture = this.createBlurredTexture(regularTexture, 0.8);
    this.textureCache.set(cacheKey, blurredTexture);
    
    return blurredTexture;
  }

  /**
   * Gets a fallback procedural texture for a genre
   */
  getFallbackTexture(genre: string): THREE.Texture {
    const normalizedGenre = genre.toLowerCase();
    
    if (this.fallbackTextures.has(normalizedGenre)) {
      return this.fallbackTextures.get(normalizedGenre)!;
    }

    // Create procedural texture for unknown genres
    const texture = this.createProceduralTexture(genre);
    this.fallbackTextures.set(normalizedGenre, texture);
    return texture;
  }

  /**
   * Preloads textures for a batch of tracks
   */
  async preloadTextures(tracks: ProcessedTrack[]): Promise<void> {
    const loadPromises = tracks
      .filter(track => track.imageUrl)
      .map(track => this.getAlbumTexture(track).catch(() => null));

    await Promise.allSettled(loadPromises);
  }

  /**
   * Clears cache and disposes of textures
   */
  dispose(): void {
    // Dispose cached textures
    this.textureCache.forEach(texture => texture.dispose());
    this.textureCache.clear();

    // Dispose high-quality cached textures
    this.highQualityCache.forEach(texture => texture.dispose());
    this.highQualityCache.clear();

    // Dispose fallback textures
    this.fallbackTextures.forEach(texture => texture.dispose());
    this.fallbackTextures.clear();

    // Clear loading promises
    this.loadingPromises.clear();
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): {
    cachedTextures: number;
    loadingTextures: number;
    fallbackTextures: number;
    memoryUsage: number;
  } {
    return {
      cachedTextures: this.textureCache.size,
      loadingTextures: this.loadingPromises.size,
      fallbackTextures: this.fallbackTextures.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private async loadTexture(track: ProcessedTrack): Promise<THREE.Texture> {
    if (!track.imageUrl) {
      throw new Error('No image URL provided');
    }

    const imageUrl: string = track.imageUrl; // Type assertion for TypeScript

    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        imageUrl,
        (texture) => {
          this.processTexture(texture);
          resolve(texture);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }

  private processTexture(texture: THREE.Texture): void {
    // Configure texture properties
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;

    // Apply size constraints
    if (texture.image) {
      const { width, height } = texture.image;
      const maxSize = this.config.maxTextureSize;
      
      if (width > maxSize || height > maxSize) {
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        const scale = Math.min(maxSize / width, maxSize / height);
        canvas.width = width * scale;
        canvas.height = height * scale;
        
        ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
        texture.image = canvas;
      }
    }

    // Enable compression if supported
    if (this.config.enableCompression) {
      texture.format = THREE.RGBAFormat;
      texture.type = THREE.UnsignedByteType;
    }

    texture.needsUpdate = true;
  }

  private createProceduralTexture(genre: string): THREE.Texture {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Get genre-based color
    const genreColor = this.getGenreColor(genre);
    
    // Create gradient background
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    
    gradient.addColorStop(0, genreColor);
    gradient.addColorStop(0.7, this.darkenColor(genreColor, 0.3));
    gradient.addColorStop(1, this.darkenColor(genreColor, 0.8));
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Add noise pattern for texture
    this.addNoisePattern(ctx, size, genreColor);

    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    this.processTexture(texture);
    
    return texture;
  }

  private addNoisePattern(ctx: CanvasRenderingContext2D, size: number, baseColor: string): void {
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;

    // Parse base color
    const color = new THREE.Color(baseColor);
    const baseR = Math.floor(color.r * 255);
    const baseG = Math.floor(color.g * 255);
    const baseB = Math.floor(color.b * 255);

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 0.2;
      
      data[i] = Math.max(0, Math.min(255, baseR + noise * 255));     // R
      data[i + 1] = Math.max(0, Math.min(255, baseG + noise * 255)); // G
      data[i + 2] = Math.max(0, Math.min(255, baseB + noise * 255)); // B
      // Alpha stays the same
    }

    ctx.putImageData(imageData, 0, 0);
  }

  private getGenreColor(genre: string): string {
    const genreColors: { [key: string]: string } = {
      metal: '#FF0040',
      rock: '#0080FF',
      punk: '#00FF40',
      electronic: '#8000FF',
      jazz: '#FFD700',
      classical: '#E0E0FF',
      pop: '#FF0080',
      indie: '#00FFFF',
      hiphop: '#FF8000',
      default: '#FFFFFF'
    };

    return genreColors[genre.toLowerCase()] || genreColors.default;
  }

  private darkenColor(color: string, factor: number): string {
    const c = new THREE.Color(color);
    c.multiplyScalar(1 - factor);
    return `#${c.getHexString()}`;
  }

  private getCacheKey(track: ProcessedTrack): string {
    return `${track.id}_${track.imageUrl || 'fallback'}`;
  }

  private cacheTexture(key: string, texture: THREE.Texture): void {
    // Implement LRU cache behavior
    if (this.textureCache.size >= this.config.cacheSize) {
      const firstKey = this.textureCache.keys().next().value;
      if (firstKey) {
        const oldTexture = this.textureCache.get(firstKey);
        if (oldTexture) {
          oldTexture.dispose();
        }
        this.textureCache.delete(firstKey);
      }
    }

    this.textureCache.set(key, texture);
  }

  private estimateMemoryUsage(): number {
    let totalMemory = 0;
    
    this.textureCache.forEach(texture => {
      if (texture.image) {
        const { width, height } = texture.image;
        // Estimate 4 bytes per pixel (RGBA)
        totalMemory += width * height * 4;
      }
    });

    return totalMemory;
  }

  private async loadHighQualityTexture(track: ProcessedTrack): Promise<THREE.Texture> {
    if (!track.imageUrl) {
      throw new Error('No image URL provided');
    }

    const imageUrl: string = track.imageUrl;

    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        imageUrl,
        (texture) => {
          this.processHighQualityTexture(texture);
          resolve(texture);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }

  private processHighQualityTexture(texture: THREE.Texture): void {
    // Configure texture properties for high quality
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;

    // Apply high-quality size constraints
    if (texture.image) {
      const { width, height } = texture.image;
      const maxSize = this.config.highQualityTextureSize;
      
      if (width > maxSize || height > maxSize) {
        // Create canvas for resizing with high quality
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Use better scaling algorithm for high quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        const scale = Math.min(maxSize / width, maxSize / height);
        canvas.width = width * scale;
        canvas.height = height * scale;
        
        ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
        texture.image = canvas;
      }
    }

    // Enable compression if supported
    if (this.config.enableCompression) {
      texture.format = THREE.RGBAFormat;
      texture.type = THREE.UnsignedByteType;
    }

    texture.needsUpdate = true;
  }

  private createBlurredTexture(sourceTexture: THREE.Texture, blurIntensity: number): THREE.Texture {
    if (!sourceTexture.image) {
      return sourceTexture;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    const { width, height } = sourceTexture.image;
    canvas.width = width;
    canvas.height = height;

    // Apply blur filter
    const blurRadius = Math.max(1, Math.floor(blurIntensity * 10));
    ctx.filter = `blur(${blurRadius}px)`;
    
    // Draw the source image with blur
    ctx.drawImage(sourceTexture.image, 0, 0, width, height);

    // Create new texture from blurred canvas
    const blurredTexture = new THREE.CanvasTexture(canvas);
    this.processTexture(blurredTexture);
    
    return blurredTexture;
  }

  private getHighQualityCacheKey(track: ProcessedTrack): string {
    return `hq_${track.id}_${track.imageUrl || 'fallback'}`;
  }

  private getLowQualityCacheKey(track: ProcessedTrack): string {
    return `lq_${track.id}_${track.imageUrl || 'fallback'}`;
  }

  private cacheHighQualityTexture(key: string, texture: THREE.Texture): void {
    // Implement LRU cache behavior for high-quality textures
    const maxHighQualityCache = Math.floor(this.config.cacheSize / 2); // Use half cache for HQ
    
    if (this.highQualityCache.size >= maxHighQualityCache) {
      const firstKey = this.highQualityCache.keys().next().value;
      if (firstKey) {
        const oldTexture = this.highQualityCache.get(firstKey);
        if (oldTexture) {
          oldTexture.dispose();
        }
        this.highQualityCache.delete(firstKey);
      }
    }

    this.highQualityCache.set(key, texture);
  }

  /**
   * Preloads high-quality textures for focused crystals
   */
  async preloadHighQualityTextures(tracks: ProcessedTrack[]): Promise<void> {
    if (!this.config.enableHighQualityPreload) {
      return;
    }

    const loadPromises = tracks
      .filter(track => track.imageUrl)
      .slice(0, 10) // Limit preloading to avoid memory issues
      .map(track => this.getHighQualityTexture(track).catch(() => null));

    await Promise.allSettled(loadPromises);
  }

  /**
   * Creates a smooth transition texture between two quality levels
   */
  createTransitionTexture(
    lowQualityTexture: THREE.Texture, 
    highQualityTexture: THREE.Texture, 
    transitionProgress: number
  ): THREE.Texture {
    if (!lowQualityTexture.image || !highQualityTexture.image) {
      return transitionProgress < 0.5 ? lowQualityTexture : highQualityTexture;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    const { width, height } = highQualityTexture.image;
    canvas.width = width;
    canvas.height = height;

    // Draw low quality texture
    ctx.globalAlpha = 1 - transitionProgress;
    ctx.drawImage(lowQualityTexture.image, 0, 0, width, height);

    // Draw high quality texture on top
    ctx.globalAlpha = transitionProgress;
    ctx.drawImage(highQualityTexture.image, 0, 0, width, height);

    // Reset alpha
    ctx.globalAlpha = 1;

    // Create transition texture
    const transitionTexture = new THREE.CanvasTexture(canvas);
    this.processTexture(transitionTexture);
    
    return transitionTexture;
  }

  private initializeFallbackTextures(): void {
    // Pre-create common genre fallback textures
    const commonGenres = ['metal', 'rock', 'punk', 'electronic', 'jazz', 'classical', 'pop', 'indie', 'hiphop'];
    
    commonGenres.forEach(genre => {
      const texture = this.createProceduralTexture(genre);
      this.fallbackTextures.set(genre, texture);
    });
  }
}