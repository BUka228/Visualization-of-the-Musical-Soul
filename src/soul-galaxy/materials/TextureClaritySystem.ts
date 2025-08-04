import * as THREE from 'three';
import { ProcessedTrack } from '../../types';
import { AlbumTextureManager, TextureQuality } from './AlbumTextureManager';
import { CrystalShaderMaterial } from './CrystalShaderMaterial';

/**
 * Configuration for texture clarity transitions
 */
export interface TextureClarityConfig {
  /** Duration of clarity transition in milliseconds */
  transitionDuration: number;
  /** Easing function for transitions */
  easingFunction: (t: number) => number;
  /** Enable smooth texture interpolation during transitions */
  enableSmoothInterpolation: boolean;
  /** Preload high-quality textures for better performance */
  preloadHighQuality: boolean;
}

/**
 * Represents an active texture clarity transition
 */
interface ClarityTransition {
  trackId: string;
  startTime: number;
  duration: number;
  fromQuality: TextureQuality;
  toQuality: TextureQuality;
  fromTexture: THREE.Texture;
  toTexture: THREE.Texture;
  material: CrystalShaderMaterial;
  onComplete?: () => void;
}

/**
 * System for managing texture clarity transitions during focus changes
 * Handles smooth transitions from blurry to sharp textures and vice versa
 */
export class TextureClaritySystem {
  private textureManager: AlbumTextureManager;
  private activeTransitions: Map<string, ClarityTransition> = new Map();
  private config: TextureClarityConfig;
  private animationFrameId?: number;

  constructor(
    textureManager: AlbumTextureManager,
    config: Partial<TextureClarityConfig> = {}
  ) {
    this.textureManager = textureManager;
    this.config = {
      transitionDuration: 1500, // 1.5 seconds for smooth transition
      easingFunction: this.easeInOutCubic,
      enableSmoothInterpolation: true,
      preloadHighQuality: true,
      ...config
    };

    console.log('🎨 TextureClaritySystem initialized');
  }

  /**
   * Starts a texture clarity transition for a crystal
   */
  async startClarityTransition(
    track: ProcessedTrack,
    material: CrystalShaderMaterial,
    targetQuality: TextureQuality,
    onComplete?: () => void
  ): Promise<void> {
    const trackId = track.id;
    
    // Stop any existing transition for this track
    this.stopTransition(trackId);

    console.log(`🔄 Starting clarity transition for ${track.name} to ${targetQuality} quality`);

    try {
      // Get current texture quality (assume medium if not specified)
      const currentQuality = this.getCurrentTextureQuality(material);
      
      // Skip transition if already at target quality
      if (currentQuality === targetQuality) {
        console.log(`✅ Already at ${targetQuality} quality, skipping transition`);
        if (onComplete) onComplete();
        return;
      }

      // Load target quality texture
      const targetTexture = await this.textureManager.getAlbumTextureWithQuality(track, targetQuality);
      const currentTexture = material.uniforms.albumTexture.value;

      // Create transition data
      const transition: ClarityTransition = {
        trackId,
        startTime: performance.now(),
        duration: this.config.transitionDuration,
        fromQuality: currentQuality,
        toQuality: targetQuality,
        fromTexture: currentTexture || targetTexture,
        toTexture: targetTexture,
        material,
        onComplete
      };

      // Store active transition
      this.activeTransitions.set(trackId, transition);

      // Start animation loop if not already running
      if (!this.animationFrameId) {
        this.startAnimationLoop();
      }

      console.log(`🎬 Clarity transition started: ${currentQuality} → ${targetQuality}`);

    } catch (error) {
      console.error(`❌ Failed to start clarity transition for ${track.name}:`, error);
      if (onComplete) onComplete();
    }
  }

  /**
   * Transitions to high-quality texture (for focus)
   */
  async transitionToHighQuality(
    track: ProcessedTrack,
    material: CrystalShaderMaterial,
    onComplete?: () => void
  ): Promise<void> {
    return this.startClarityTransition(track, material, TextureQuality.HIGH, onComplete);
  }

  /**
   * Transitions to medium-quality texture (for normal state)
   */
  async transitionToMediumQuality(
    track: ProcessedTrack,
    material: CrystalShaderMaterial,
    onComplete?: () => void
  ): Promise<void> {
    return this.startClarityTransition(track, material, TextureQuality.MEDIUM, onComplete);
  }

  /**
   * Transitions to low-quality texture (for distant crystals)
   */
  async transitionToLowQuality(
    track: ProcessedTrack,
    material: CrystalShaderMaterial,
    onComplete?: () => void
  ): Promise<void> {
    return this.startClarityTransition(track, material, TextureQuality.LOW, onComplete);
  }

  /**
   * Stops a specific transition
   */
  stopTransition(trackId: string): void {
    const transition = this.activeTransitions.get(trackId);
    if (transition) {
      // Set final texture immediately
      transition.material.setAlbumTexture(transition.toTexture);
      
      // Call completion callback
      if (transition.onComplete) {
        transition.onComplete();
      }
      
      // Remove from active transitions
      this.activeTransitions.delete(trackId);
      
      console.log(`⏹️ Stopped clarity transition for track ${trackId}`);
    }

    // Stop animation loop if no more transitions
    if (this.activeTransitions.size === 0 && this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
  }

  /**
   * Stops all active transitions
   */
  stopAllTransitions(): void {
    const trackIds = Array.from(this.activeTransitions.keys());
    trackIds.forEach(trackId => this.stopTransition(trackId));
  }

  /**
   * Checks if a transition is active for a track
   */
  isTransitionActive(trackId: string): boolean {
    return this.activeTransitions.has(trackId);
  }

  /**
   * Gets the progress of an active transition (0-1)
   */
  getTransitionProgress(trackId: string): number {
    const transition = this.activeTransitions.get(trackId);
    if (!transition) return 0;

    const elapsed = performance.now() - transition.startTime;
    return Math.min(elapsed / transition.duration, 1);
  }

  /**
   * Preloads high-quality textures for better performance
   */
  async preloadHighQualityTextures(tracks: ProcessedTrack[]): Promise<void> {
    if (!this.config.preloadHighQuality) return;

    console.log(`🚀 Preloading high-quality textures for ${tracks.length} tracks...`);
    
    try {
      await this.textureManager.preloadHighQualityTextures(tracks);
      console.log('✅ High-quality textures preloaded');
    } catch (error) {
      console.warn('⚠️ Failed to preload some high-quality textures:', error);
    }
  }

  /**
   * Updates configuration
   */
  updateConfig(newConfig: Partial<TextureClarityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ TextureClaritySystem configuration updated');
  }

  /**
   * Disposes of the system and cleans up resources
   */
  dispose(): void {
    console.log('🗑️ Disposing TextureClaritySystem...');
    
    // Stop all transitions
    this.stopAllTransitions();
    
    // Clear animation loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
    
    console.log('✅ TextureClaritySystem disposed');
  }

  // Private methods

  private startAnimationLoop(): void {
    const animate = () => {
      this.updateTransitions();
      
      if (this.activeTransitions.size > 0) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.animationFrameId = undefined;
      }
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
  }

  private updateTransitions(): void {
    const currentTime = performance.now();
    const completedTransitions: string[] = [];

    this.activeTransitions.forEach((transition, trackId) => {
      const elapsed = currentTime - transition.startTime;
      const progress = Math.min(elapsed / transition.duration, 1);
      const easedProgress = this.config.easingFunction(progress);

      if (this.config.enableSmoothInterpolation && progress < 1) {
        // Create interpolated texture for smooth transition
        const interpolatedTexture = this.textureManager.createTransitionTexture(
          transition.fromTexture,
          transition.toTexture,
          easedProgress
        );
        
        transition.material.setAlbumTexture(interpolatedTexture);
      } else if (progress >= 1) {
        // Transition complete - set final texture
        transition.material.setAlbumTexture(transition.toTexture);
        completedTransitions.push(trackId);
      }
    });

    // Clean up completed transitions
    completedTransitions.forEach(trackId => {
      const transition = this.activeTransitions.get(trackId);
      if (transition && transition.onComplete) {
        transition.onComplete();
      }
      this.activeTransitions.delete(trackId);
      
      console.log(`✅ Clarity transition completed for track ${trackId}`);
    });
  }

  private getCurrentTextureQuality(material: CrystalShaderMaterial): TextureQuality {
    // This is a simplified approach - in a real implementation,
    // you might want to track quality levels more explicitly
    const texture = material.uniforms.albumTexture.value;
    
    if (!texture || !texture.image) {
      return TextureQuality.MEDIUM;
    }

    const { width, height } = texture.image;
    const size = Math.max(width, height);

    if (size >= 1024) {
      return TextureQuality.HIGH;
    } else if (size <= 256) {
      return TextureQuality.LOW;
    } else {
      return TextureQuality.MEDIUM;
    }
  }

  // Easing functions

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4);
  }

  private easeInOutQuart(t: number): number {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  }
}