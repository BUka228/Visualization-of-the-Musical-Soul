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
}

/**
 * Manages loading, caching, and processing of album cover textures
 * Implements distortion and blur effects for the "memory" aesthetic
 */
export class AlbumTextureManager {
  private textureCache: Map<string, THREE.Texture> = new Map();
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
      ...config
    };

    this.textureLoader = new THREE.TextureLoader();
    this.initializeFallbackTextures();
  }

  /**
   * Loads or retrieves album texture for a track
   */
  async getAlbumTexture(track: ProcessedTrack): Promise<THREE.Texture> {
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

  private initializeFallbackTextures(): void {
    // Pre-create common genre fallback textures
    const commonGenres = ['metal', 'rock', 'punk', 'electronic', 'jazz', 'classical', 'pop', 'indie', 'hiphop'];
    
    commonGenres.forEach(genre => {
      const texture = this.createProceduralTexture(genre);
      this.fallbackTextures.set(genre, texture);
    });
  }
}