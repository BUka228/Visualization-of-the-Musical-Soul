import * as THREE from 'three';
import { NebulaShaderMaterial } from '../materials/NebulaShaderMaterial';
import { NebulaConfig } from '../types';

export class NebulaSystem {
  private scene?: THREE.Scene;
  private camera?: THREE.Camera;
  private initialized: boolean = false;
  
  // Nebula components
  private nebulaGroup: THREE.Group;
  private nebulaLayers: THREE.Mesh[] = [];
  private nebulaMaterials: NebulaShaderMaterial[] = [];
  
  // Animation
  private clock: THREE.Clock;
  
  // Configuration
  private config: NebulaConfig;
  
  constructor(config: Partial<NebulaConfig> = {}) {
    this.nebulaGroup = new THREE.Group();
    this.clock = new THREE.Clock();
    
    // Default configuration
    this.config = {
      intensity: 0.3,
      colorPalette: [
        new THREE.Color(0x000033), // Deep blue
        new THREE.Color(0x001122), // Dark teal
        new THREE.Color(0x000011), // Very dark blue
        new THREE.Color(0x110022), // Dark purple
        new THREE.Color(0x001133)  // Deep navy
      ],
      density: 0.5,
      driftSpeed: 0.001,
      turbulence: 0.1,
      layerCount: 3,
      layerSeparation: 25,
      ...config
    };
  }

  initialize(scene: THREE.Scene, camera: THREE.Camera): void {
    console.log('🌫️ Initializing Nebula System...');
    
    this.scene = scene;
    this.camera = camera;
    
    // Create multi-layered nebula
    this.createMultiLayerNebula();
    
    // Add to scene
    this.scene.add(this.nebulaGroup);
    
    this.initialized = true;
    console.log(`✅ Nebula System initialized with ${this.config.layerCount} layers`);
  }

  private createMultiLayerNebula(): void {
    // Clear existing layers
    this.clearLayers();
    
    for (let i = 0; i < this.config.layerCount; i++) {
      const layer = this.createNebulaLayer(i);
      this.nebulaLayers.push(layer);
      this.nebulaGroup.add(layer);
    }
    
    console.log(`🌌 Created ${this.config.layerCount} nebula layers with custom shaders`);
  }

  private createNebulaLayer(layerIndex: number): THREE.Mesh {
    // Create geometry - larger for background layers
    const size = 150 + layerIndex * 50;
    const geometry = new THREE.PlaneGeometry(size, size, 64, 64);
    
    // Add some vertex displacement for organic shape
    const positions = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      
      // Add subtle displacement based on position
      const displacement = (Math.sin(x * 0.01) + Math.cos(y * 0.01)) * 2;
      positions[i + 2] += displacement;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    // Create custom shader material
    const colors = this.getLayerColors(layerIndex);
    const material = new NebulaShaderMaterial({
      intensity: this.config.intensity * (1.0 - layerIndex * 0.15),
      colors: colors,
      driftSpeed: this.config.driftSpeed * (1 + layerIndex * 0.3),
      turbulence: this.config.turbulence * (1 + layerIndex * 0.2),
      layerIndex: layerIndex
    });
    
    this.nebulaMaterials.push(material);
    
    // Create mesh
    const nebulaMesh = new THREE.Mesh(geometry, material);
    
    // Position layer at different depths
    const distance = 60 + layerIndex * this.config.layerSeparation;
    nebulaMesh.position.z = -distance;
    
    // Add rotation for variety
    nebulaMesh.rotation.z = (layerIndex * Math.PI) / 6;
    nebulaMesh.rotation.x = Math.sin(layerIndex) * 0.1;
    nebulaMesh.rotation.y = Math.cos(layerIndex) * 0.1;
    
    // Store metadata
    nebulaMesh.userData = {
      isNebulaLayer: true,
      layerIndex: layerIndex,
      baseRotationSpeed: this.config.driftSpeed * (0.5 + layerIndex * 0.2),
      originalPosition: nebulaMesh.position.clone()
    };
    
    return nebulaMesh;
  }

  private getLayerColors(layerIndex: number): THREE.Color[] {
    const palette = this.config.colorPalette;
    const colors: THREE.Color[] = [];
    
    // Select 3 colors for this layer, with some variation
    for (let i = 0; i < 3; i++) {
      const colorIndex = (layerIndex + i) % palette.length;
      colors.push(palette[colorIndex].clone());
    }
    
    // Adjust brightness based on layer depth
    const brightness = 1.0 - layerIndex * 0.1;
    colors.forEach(color => {
      color.multiplyScalar(brightness);
    });
    
    return colors;
  }

  update(deltaTime: number): void {
    if (!this.initialized) return;
    
    const elapsedTime = this.clock.getElapsedTime();
    
    // Update shader uniforms
    this.nebulaMaterials.forEach(material => {
      material.updateTime(elapsedTime);
    });
    
    // Animate layer rotations and positions
    this.nebulaLayers.forEach((layer, index) => {
      const userData = layer.userData;
      
      // Slow rotation
      layer.rotation.z += userData.baseRotationSpeed * deltaTime;
      
      // Subtle position drift
      const driftAmount = 0.1;
      layer.position.x = userData.originalPosition.x + Math.sin(elapsedTime * 0.1 + index) * driftAmount;
      layer.position.y = userData.originalPosition.y + Math.cos(elapsedTime * 0.15 + index) * driftAmount;
    });
  }

  // Configuration methods
  setIntensity(intensity: number): void {
    this.config.intensity = Math.max(0, Math.min(1, intensity));
    
    this.nebulaMaterials.forEach((material, index) => {
      const layerIntensity = this.config.intensity * (1.0 - index * 0.15);
      material.setIntensity(layerIntensity);
    });
    
    console.log(`🌫️ Nebula intensity set to ${intensity}`);
  }

  setDriftSpeed(speed: number): void {
    this.config.driftSpeed = speed;
    
    this.nebulaMaterials.forEach((material, index) => {
      const layerSpeed = speed * (1 + index * 0.3);
      material.setDriftSpeed(layerSpeed);
    });
    
    // Update rotation speeds
    this.nebulaLayers.forEach((layer, index) => {
      layer.userData.baseRotationSpeed = speed * (0.5 + index * 0.2);
    });
    
    console.log(`🌊 Nebula drift speed set to ${speed}`);
  }

  setTurbulence(turbulence: number): void {
    this.config.turbulence = turbulence;
    
    this.nebulaMaterials.forEach((material, index) => {
      const layerTurbulence = turbulence * (1 + index * 0.2);
      material.setTurbulence(layerTurbulence);
    });
    
    console.log(`🌪️ Nebula turbulence set to ${turbulence}`);
  }

  setLayerCount(count: number): void {
    this.config.layerCount = Math.max(1, Math.min(8, count));
    
    // Recreate nebula with new layer count
    this.createMultiLayerNebula();
    
    console.log(`🌌 Nebula layer count set to ${count}`);
  }

  setColorPalette(colors: THREE.Color[]): void {
    this.config.colorPalette = [...colors];
    
    // Update existing materials with new colors
    this.nebulaMaterials.forEach((material, index) => {
      const layerColors = this.getLayerColors(index);
      material.setColors(layerColors);
    });
    
    console.log(`🎨 Nebula color palette updated with ${colors.length} colors`);
  }

  // Utility methods
  getNebulaGroup(): THREE.Group {
    return this.nebulaGroup;
  }

  getLayerCount(): number {
    return this.nebulaLayers.length;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private clearLayers(): void {
    // Remove existing layers
    this.nebulaLayers.forEach(layer => {
      this.nebulaGroup.remove(layer);
      layer.geometry.dispose();
    });
    
    // Dispose materials
    this.nebulaMaterials.forEach(material => {
      material.dispose();
    });
    
    this.nebulaLayers = [];
    this.nebulaMaterials = [];
  }

  dispose(): void {
    console.log('🗑️ Disposing Nebula System...');
    
    if (this.scene && this.nebulaGroup) {
      this.scene.remove(this.nebulaGroup);
    }
    
    this.clearLayers();
    this.nebulaGroup.clear();
    
    this.scene = undefined;
    this.camera = undefined;
    this.initialized = false;
    
    console.log('✅ Nebula System disposed');
  }
}