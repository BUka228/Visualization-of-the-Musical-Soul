import * as THREE from 'three';
import { DeepSpaceEnvironment as IDeepSpaceEnvironment, NebulaConfig } from '../types';
import { NebulaSystem } from '../effects/NebulaSystem';
import { ParallaxParticles } from '../effects/ParallaxParticles';

export class DeepSpaceEnvironment implements IDeepSpaceEnvironment {
  private scene?: THREE.Scene;
  private camera?: THREE.Camera;
  private initialized: boolean = false;
  
  // Nebula system with custom shaders
  private nebulaSystem: NebulaSystem;
  
  // Advanced parallax particle system
  private parallaxParticles: ParallaxParticles;
  
  // Configuration
  private config: NebulaConfig;
  
  constructor() {
    // Default configuration for deep space environment
    this.config = {
      intensity: 0.3,
      colorPalette: [
        new THREE.Color(0x000033), // Deep blue
        new THREE.Color(0x001122), // Dark teal
        new THREE.Color(0x000011), // Very dark blue
        new THREE.Color(0x110022)  // Dark purple
      ],
      density: 0.5,
      driftSpeed: 0.001,
      turbulence: 0.1,
      layerCount: 3,
      layerSeparation: 20
    };
    
    // Initialize nebula system with custom shaders
    this.nebulaSystem = new NebulaSystem(this.config);
    
    // Initialize advanced parallax particle system
    this.parallaxParticles = new ParallaxParticles({
      layerCount: 4,
      particlesPerLayer: Math.floor(250 * this.config.density),
      colors: this.config.colorPalette,
      opacity: 0.7,
      parallaxStrength: 1.0
    });
  }

  initialize(scene: THREE.Scene, camera: THREE.Camera): void {
    console.log('🌌 Initializing Deep Space Environment...');
    
    this.scene = scene;
    this.camera = camera;
    
    // Set up dark cosmic scene
    this.setupDarkScene();
    
    // Initialize nebula system with custom shaders
    this.nebulaSystem.initialize(scene, camera);
    
    // Initialize advanced parallax particle system
    this.parallaxParticles.initialize(scene, camera);
    
    this.initialized = true;
    console.log('✅ Deep Space Environment initialized');
  }

  private setupDarkScene(): void {
    if (!this.scene) return;
    
    // Set very dark background color for deep space
    this.scene.background = new THREE.Color(0x000008);
    
    // Add subtle fog for depth
    this.scene.fog = new THREE.Fog(0x000011, 100, 300);
    
    console.log('🌑 Dark cosmic scene configured');
  }

  createNebulaBackground(): void {
    // This method is now handled by the NebulaSystem
    // The nebula background is created during initialization
    console.log('🌫️ Nebula background created by NebulaSystem with custom shaders');
  }

  createParallaxParticles(): void {
    // This method is now handled by the ParallaxParticles system
    // The parallax particles are created during initialization
    console.log('✨ Parallax particles created by ParallaxParticles system with instanced rendering');
  }

  updateParallax(cameraMovement: THREE.Vector3): void {
    if (!this.initialized) return;
    
    // Update nebula system (it handles its own parallax internally)
    this.nebulaSystem.update(16); // ~60 FPS
    
    // Update advanced parallax particle system
    this.parallaxParticles.update(16); // ~60 FPS
  }

  setNebulaIntensity(intensity: number): void {
    this.config.intensity = Math.max(0, Math.min(1, intensity));
    
    // Update nebula system intensity
    this.nebulaSystem.setIntensity(intensity);
    
    console.log(`🌫️ Nebula intensity set to ${intensity}`);
  }

  setParticleCount(count: number): void {
    this.config.density = count / 1000; // Convert to density factor
    
    // Update parallax particle system count
    this.parallaxParticles.setParticleCount(Math.floor(count * this.config.density));
    
    console.log(`✨ Particle count updated to ${count}`);
  }

  setDepthLayers(layers: number): void {
    this.config.layerCount = Math.max(1, Math.min(5, layers));
    
    // Update nebula system layer count
    this.nebulaSystem.setLayerCount(layers);
    
    console.log(`🌫️ Depth layers updated to ${layers}`);
  }

  dispose(): void {
    console.log('🗑️ Disposing Deep Space Environment...');
    
    // Dispose nebula system
    this.nebulaSystem.dispose();
    
    // Dispose parallax particle system
    this.parallaxParticles.dispose();
    
    // Clear references
    this.scene = undefined;
    this.camera = undefined;
    this.initialized = false;
    
    console.log('✅ Deep Space Environment disposed');
  }
}