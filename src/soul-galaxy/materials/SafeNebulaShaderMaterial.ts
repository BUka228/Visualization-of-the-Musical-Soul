import * as THREE from 'three';
import { NebulaShaderMaterial } from './NebulaShaderMaterial';
import { SoulGalaxyErrorHandler, createSafeShaderMaterial } from '../core/SoulGalaxyErrorHandler';

/**
 * Safe wrapper for NebulaShaderMaterial with automatic error handling and fallbacks
 */
export class SafeNebulaShaderMaterial {
  private material: THREE.Material;
  private errorHandler: SoulGalaxyErrorHandler;
  private isUsingFallback: boolean = false;
  private originalConfig: any;

  constructor(config: {
    intensity?: number;
    colors?: THREE.Color[];
    driftSpeed?: number;
    turbulence?: number;
    layerIndex?: number;
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
      const material = createSafeShaderMaterial(NebulaShaderMaterial, config);
      
      if (material instanceof NebulaShaderMaterial) {
        this.isUsingFallback = false;
        return material;
      } else {
        this.isUsingFallback = true;
        this.setupFallbackMaterial(material as THREE.MeshBasicMaterial, config);
        return material;
      }
    } catch (error) {
      console.warn('Failed to create nebula shader material, using fallback:', error);
      this.isUsingFallback = true;
      
      const fallbackMaterial = this.errorHandler.getFallbackMaterial('nebula') as THREE.MeshBasicMaterial;
      this.setupFallbackMaterial(fallbackMaterial, config);
      return fallbackMaterial;
    }
  }

  /**
   * Setup fallback material to mimic shader behavior as much as possible
   */
  private setupFallbackMaterial(material: THREE.MeshBasicMaterial, config: any): void {
    // Apply basic configuration to fallback material
    if (config.colors && config.colors.length > 0) {
      material.color = config.colors[0].clone();
    }
    
    if (config.intensity !== undefined) {
      material.opacity = config.intensity;
    }
    
    // Store animation properties for fallback animation
    (material as any).originalColor = material.color.clone();
    (material as any).intensity = config.intensity || 0.3;
    (material as any).driftSpeed = config.driftSpeed || 0.001;
    (material as any).colors = config.colors || [
      new THREE.Color(0x000033),
      new THREE.Color(0x001122),
      new THREE.Color(0x000011)
    ];
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
    if (!this.isUsingFallback && this.material instanceof NebulaShaderMaterial) {
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
    const basicMaterial = this.material as THREE.MeshBasicMaterial & {
      originalColor?: THREE.Color;
      intensity?: number;
      driftSpeed?: number;
      colors?: THREE.Color[];
    };

    if (basicMaterial.originalColor && basicMaterial.colors && basicMaterial.driftSpeed) {
      // Simple color animation for fallback
      const drift = Math.sin(time * basicMaterial.driftSpeed * 10) * 0.5 + 0.5;
      const colorIndex = Math.floor(drift * (basicMaterial.colors.length - 1));
      const nextColorIndex = Math.min(colorIndex + 1, basicMaterial.colors.length - 1);
      const t = (drift * (basicMaterial.colors.length - 1)) % 1;
      
      // Interpolate between colors
      const currentColor = basicMaterial.colors[colorIndex];
      const nextColor = basicMaterial.colors[nextColorIndex];
      
      basicMaterial.color.copy(currentColor).lerp(nextColor, t);
      
      // Add intensity variation
      const intensityVariation = Math.sin(time * 0.5) * 0.1 + 0.9;
      basicMaterial.opacity = (basicMaterial.intensity || 0.3) * intensityVariation;
    }
  }

  /**
   * Set intensity
   */
  public setIntensity(intensity: number): void {
    if (!this.isUsingFallback && this.material instanceof NebulaShaderMaterial) {
      this.material.setIntensity(intensity);
    } else if (this.isUsingFallback) {
      const basicMaterial = this.material as THREE.MeshBasicMaterial;
      basicMaterial.opacity = Math.max(0, Math.min(1, intensity));
      (basicMaterial as any).intensity = intensity;
    }
  }

  /**
   * Set colors
   */
  public setColors(colors: THREE.Color[]): void {
    if (!this.isUsingFallback && this.material instanceof NebulaShaderMaterial) {
      this.material.setColors(colors);
    } else if (this.isUsingFallback) {
      const basicMaterial = this.material as THREE.MeshBasicMaterial;
      if (colors.length > 0) {
        basicMaterial.color = colors[0].clone();
        (basicMaterial as any).originalColor = basicMaterial.color.clone();
        (basicMaterial as any).colors = colors.map(c => c.clone());
      }
    }
  }

  /**
   * Set drift speed
   */
  public setDriftSpeed(speed: number): void {
    if (!this.isUsingFallback && this.material instanceof NebulaShaderMaterial) {
      this.material.setDriftSpeed(speed);
    } else if (this.isUsingFallback) {
      (this.material as any).driftSpeed = speed;
    }
  }

  /**
   * Set turbulence
   */
  public setTurbulence(turbulence: number): void {
    if (!this.isUsingFallback && this.material instanceof NebulaShaderMaterial) {
      this.material.setTurbulence(turbulence);
    }
    // Fallback materials don't support turbulence
  }

  /**
   * Set layer index
   */
  public setLayerIndex(index: number): void {
    if (!this.isUsingFallback && this.material instanceof NebulaShaderMaterial) {
      this.material.setLayerIndex(index);
    }
    // Fallback materials don't support layer variation
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
      console.warn('Nebula shader recreation failed:', error);
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
      type: this.isUsingFallback ? 'MeshBasicMaterial' : 'NebulaShaderMaterial',
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
   * Create a safe nebula material with default deep space colors
   */
  public static createDeepSpace(config: {
    intensity?: number;
    driftSpeed?: number;
    turbulence?: number;
    layerIndex?: number;
  } = {}): SafeNebulaShaderMaterial {
    const deepSpaceColors = [
      new THREE.Color(0x000033), // Deep blue
      new THREE.Color(0x001122), // Dark teal  
      new THREE.Color(0x000011)  // Very dark blue
    ];

    return new SafeNebulaShaderMaterial({
      colors: deepSpaceColors,
      intensity: 0.3,
      driftSpeed: 0.001,
      turbulence: 0.1,
      ...config
    });
  }

  /**
   * Create a safe nebula material with custom color palette
   */
  public static createWithColors(
    colors: THREE.Color[],
    config: {
      intensity?: number;
      driftSpeed?: number;
      turbulence?: number;
      layerIndex?: number;
    } = {}
  ): SafeNebulaShaderMaterial {
    return new SafeNebulaShaderMaterial({
      colors,
      intensity: 0.3,
      driftSpeed: 0.001,
      turbulence: 0.1,
      ...config
    });
  }
}