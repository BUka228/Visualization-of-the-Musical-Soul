import * as THREE from 'three';
import { CrystalShaderMaterial } from './CrystalShaderMaterial';
import { SoulGalaxyErrorHandler, createSafeShaderMaterial } from '../core/SoulGalaxyErrorHandler';

/**
 * Safe wrapper for CrystalShaderMaterial with automatic error handling and fallbacks
 */
export class SafeCrystalShaderMaterial {
  private material: THREE.Material;
  private errorHandler: SoulGalaxyErrorHandler;
  private isUsingFallback: boolean = false;
  private originalConfig: any;

  constructor(config: {
    genreColor?: THREE.Color;
    albumTexture?: THREE.Texture;
    emissiveIntensity?: number;
    pulseAmplitude?: number;
    pulseSpeed?: number;
    sharpness?: number;
    opacity?: number;
    metallic?: number;
    roughness?: number;
  } = {}) {
    this.errorHandler = SoulGalaxyErrorHandler.getInstance();
    this.originalConfig = { ...config };
    
    // Try to create the shader material with error handling
    this.material = this.createMaterialSafely(config);
  }

  /**
   * Create the material with error handling
   */
  private createMaterialSafely(config: any): THREE.Material {
    try {
      const material = createSafeShaderMaterial(CrystalShaderMaterial, config);
      
      if (material instanceof CrystalShaderMaterial) {
        this.isUsingFallback = false;
        return material;
      } else {
        this.isUsingFallback = true;
        this.setupFallbackMaterial(material as THREE.MeshPhongMaterial, config);
        return material;
      }
    } catch (error) {
      console.warn('Failed to create crystal shader material, using fallback:', error);
      this.isUsingFallback = true;
      
      const fallbackMaterial = this.errorHandler.getFallbackMaterial('crystal') as THREE.MeshPhongMaterial;
      this.setupFallbackMaterial(fallbackMaterial, config);
      return fallbackMaterial;
    }
  }

  /**
   * Setup fallback material to mimic shader behavior as much as possible
   */
  private setupFallbackMaterial(material: THREE.MeshPhongMaterial, config: any): void {
    // Apply basic configuration to fallback material
    if (config.genreColor) {
      material.color = config.genreColor.clone();
      material.emissive = config.genreColor.clone().multiplyScalar(0.1);
    }
    
    if (config.albumTexture) {
      material.map = config.albumTexture;
    }
    
    if (config.opacity !== undefined) {
      material.opacity = config.opacity;
    }
    
    // Store animation properties for fallback animation
    (material as any).pulseAmplitude = config.pulseAmplitude || 0.35;
    (material as any).pulseSpeed = config.pulseSpeed || 1.5;
    (material as any).originalEmissive = material.emissive.clone();
    (material as any).originalColor = material.color.clone();
  }

  /**
   * Get the underlying material
   */
  public getMaterial(): THREE.Material {
    return this.material;
  }

  /**
   * Check if using fallback material
   */
  public isUsingFallbackMaterial(): boolean {
    return this.isUsingFallback;
  }

  /**
   * Update time for animation (works with both shader and fallback materials)
   */
  public updateTime(time: number): void {
    if (!this.isUsingFallback && this.material instanceof CrystalShaderMaterial) {
      this.material.updateTime(time);
    } else if (this.isUsingFallback) {
      // Animate fallback material manually
      this.animateFallbackMaterial(time);
    }
  }

  /**
   * Animate fallback material to simulate shader effects
   */
  private animateFallbackMaterial(time: number): void {
    const phongMaterial = this.material as THREE.MeshPhongMaterial & {
      pulseAmplitude?: number;
      pulseSpeed?: number;
      originalEmissive?: THREE.Color;
      originalColor?: THREE.Color;
    };

    if (phongMaterial.originalEmissive && phongMaterial.pulseAmplitude && phongMaterial.pulseSpeed) {
      // Simple pulsation effect for fallback
      const pulse = Math.sin(time * phongMaterial.pulseSpeed) * phongMaterial.pulseAmplitude;
      const pulseFactor = 1.0 + pulse * 0.5;
      
      phongMaterial.emissive.copy(phongMaterial.originalEmissive).multiplyScalar(pulseFactor);
      
      // Subtle color pulsation
      if (phongMaterial.originalColor) {
        phongMaterial.color.copy(phongMaterial.originalColor).multiplyScalar(0.9 + pulse * 0.1);
      }
    }
  }

  /**
   * Update global pulse
   */
  public updateGlobalPulse(pulse: number): void {
    if (!this.isUsingFallback && this.material instanceof CrystalShaderMaterial) {
      this.material.updateGlobalPulse(pulse);
    }
  }

  /**
   * Update camera position
   */
  public updateCameraPosition(cameraPosition: THREE.Vector3): void {
    if (!this.isUsingFallback && this.material instanceof CrystalShaderMaterial) {
      this.material.updateCameraPosition(cameraPosition);
    }
  }

  /**
   * Set genre color
   */
  public setGenreColor(genre: string, intensity: number = 1.0): void {
    if (!this.isUsingFallback && this.material instanceof CrystalShaderMaterial) {
      this.material.setGenreColor(genre, intensity);
    } else if (this.isUsingFallback) {
      // Apply to fallback material
      const phongMaterial = this.material as THREE.MeshPhongMaterial;
      const genreColors = CrystalShaderMaterial.getGenreColors();
      const color = genreColors[genre as keyof typeof genreColors] || genreColors.default;
      
      phongMaterial.color = color.clone().multiplyScalar(intensity);
      phongMaterial.emissive = color.clone().multiplyScalar(intensity * 0.1);
      (phongMaterial as any).originalColor = phongMaterial.color.clone();
      (phongMaterial as any).originalEmissive = phongMaterial.emissive.clone();
    }
  }

  /**
   * Set album texture
   */
  public setAlbumTexture(texture: THREE.Texture | null): void {
    if (!this.isUsingFallback && this.material instanceof CrystalShaderMaterial) {
      this.material.setAlbumTexture(texture);
    } else if (this.isUsingFallback) {
      const phongMaterial = this.material as THREE.MeshPhongMaterial;
      phongMaterial.map = texture;
      phongMaterial.needsUpdate = true;
    }
  }

  /**
   * Set pulsation parameters
   */
  public setPulsationParams(amplitude: number, speed: number, sharpness: number = 1.0): void {
    if (!this.isUsingFallback && this.material instanceof CrystalShaderMaterial) {
      this.material.setPulsationParams(amplitude, speed, sharpness);
    } else if (this.isUsingFallback) {
      const phongMaterial = this.material as any;
      phongMaterial.pulseAmplitude = amplitude;
      phongMaterial.pulseSpeed = speed;
    }
  }

  /**
   * Set emissive intensity
   */
  public setEmissiveIntensity(intensity: number): void {
    if (!this.isUsingFallback && this.material instanceof CrystalShaderMaterial) {
      this.material.setEmissiveIntensity(intensity);
    } else if (this.isUsingFallback) {
      const phongMaterial = this.material as THREE.MeshPhongMaterial;
      if ((phongMaterial as any).originalEmissive) {
        phongMaterial.emissive.copy((phongMaterial as any).originalEmissive).multiplyScalar(intensity);
      }
    }
  }

  /**
   * Set focused state
   */
  public setFocused(focused: boolean): void {
    if (!this.isUsingFallback && this.material instanceof CrystalShaderMaterial) {
      this.material.setFocused(focused);
    } else if (this.isUsingFallback) {
      // Enhance fallback material for focus
      const phongMaterial = this.material as THREE.MeshPhongMaterial;
      const multiplier = focused ? 1.5 : 1.0;
      
      if ((phongMaterial as any).originalEmissive) {
        phongMaterial.emissive.copy((phongMaterial as any).originalEmissive).multiplyScalar(multiplier);
      }
    }
  }

  /**
   * Set hovered state
   */
  public setHovered(hovered: boolean): void {
    if (!this.isUsingFallback && this.material instanceof CrystalShaderMaterial) {
      this.material.setHovered(hovered);
    } else if (this.isUsingFallback) {
      // Enhance fallback material for hover
      const phongMaterial = this.material as THREE.MeshPhongMaterial;
      const multiplier = hovered ? 1.2 : 1.0;
      
      if ((phongMaterial as any).originalEmissive) {
        phongMaterial.emissive.copy((phongMaterial as any).originalEmissive).multiplyScalar(multiplier);
      }
    }
  }

  /**
   * Set texture clarity
   */
  public setTextureClarity(clarity: number): void {
    if (!this.isUsingFallback && this.material instanceof CrystalShaderMaterial) {
      this.material.setTextureClarity(clarity);
    }
    // Fallback materials don't support dynamic texture clarity
  }

  /**
   * Set focus transition
   */
  public setFocusTransition(progress: number): void {
    if (!this.isUsingFallback && this.material instanceof CrystalShaderMaterial) {
      this.material.setFocusTransition(progress);
    }
    // Fallback materials don't support focus transitions
  }

  /**
   * Set opacity
   */
  public setOpacity(opacity: number): void {
    this.material.opacity = Math.max(0, Math.min(1, opacity));
    this.material.transparent = opacity < 1.0;
  }

  /**
   * Attempt to recreate shader material (useful after WebGL context restore)
   */
  public attemptShaderRecreation(): boolean {
    if (!this.isUsingFallback) return true; // Already using shader

    try {
      const newMaterial = this.createMaterialSafely(this.originalConfig);
      
      if (!this.isUsingFallback) {
        // Successfully created shader material
        this.material.dispose();
        this.material = newMaterial;
        return true;
      }
    } catch (error) {
      console.warn('Shader recreation failed:', error);
    }
    
    return false;
  }

  /**
   * Get material type info
   */
  public getMaterialInfo(): {
    type: string;
    isUsingFallback: boolean;
    hasShaderSupport: boolean;
  } {
    return {
      type: this.isUsingFallback ? 'MeshPhongMaterial' : 'CrystalShaderMaterial',
      isUsingFallback: this.isUsingFallback,
      hasShaderSupport: !this.isUsingFallback
    };
  }

  /**
   * Dispose of the material
   */
  public dispose(): void {
    this.material.dispose();
  }

  /**
   * Create a safe crystal material for a specific genre
   */
  public static createForGenre(genre: string, config: {
    albumTexture?: THREE.Texture;
    emissiveIntensity?: number;
    pulseAmplitude?: number;
    pulseSpeed?: number;
    sharpness?: number;
    intensity?: number;
  } = {}): SafeCrystalShaderMaterial {
    const { intensity = 1.0, ...materialConfig } = config;
    
    // Get genre color safely
    const genreColors = CrystalShaderMaterial.getGenreColors();
    const genreColor = genreColors[genre as keyof typeof genreColors] || genreColors.default;
    
    return new SafeCrystalShaderMaterial({
      genreColor: genreColor.clone().multiplyScalar(intensity),
      ...materialConfig
    });
  }
}