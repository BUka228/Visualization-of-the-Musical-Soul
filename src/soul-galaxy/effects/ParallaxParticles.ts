import * as THREE from 'three';

export interface ParallaxLayer {
  particles: THREE.Points;
  speed: number;
  distance: number;
  originalPositions: Float32Array;
}

export class ParallaxParticles {
  private scene?: THREE.Scene;
  private camera?: THREE.Camera;
  private initialized: boolean = false;
  
  // Particle layers for parallax effect
  private particleLayers: ParallaxLayer[] = [];
  private particleGroup: THREE.Group;
  
  // Camera tracking for parallax
  private previousCameraPosition: THREE.Vector3;
  private previousCameraRotation: THREE.Euler;
  
  // Configuration
  private config: {
    layerCount: number;
    particlesPerLayer: number;
    minDistance: number;
    maxDistance: number;
    minSize: number;
    maxSize: number;
    colors: THREE.Color[];
    opacity: number;
    parallaxStrength: number;
  };
  
  constructor(config: Partial<typeof ParallaxParticles.prototype.config> = {}) {
    this.particleGroup = new THREE.Group();
    this.previousCameraPosition = new THREE.Vector3();
    this.previousCameraRotation = new THREE.Euler();
    
    // Default configuration
    this.config = {
      layerCount: 4,
      particlesPerLayer: 300,
      minDistance: 50,
      maxDistance: 250,
      minSize: 0.5,
      maxSize: 2.0,
      colors: [
        new THREE.Color(0x4444ff), // Blue
        new THREE.Color(0x44ffff), // Cyan
        new THREE.Color(0xffffff), // White
        new THREE.Color(0x8888ff), // Light blue
        new THREE.Color(0x44ff44)  // Green
      ],
      opacity: 0.7,
      parallaxStrength: 1.0,
      ...config
    };
  }

  initialize(scene: THREE.Scene, camera: THREE.Camera): void {
    console.log('✨ Initializing Parallax Particles...');
    
    this.scene = scene;
    this.camera = camera;
    
    // Store initial camera state
    this.previousCameraPosition.copy(camera.position);
    this.previousCameraRotation.copy(camera.rotation);
    
    // Create multi-layered particle system
    this.createParticleLayers();
    
    // Add to scene
    this.scene.add(this.particleGroup);
    
    this.initialized = true;
    console.log(`✅ Parallax Particles initialized with ${this.config.layerCount} layers`);
  }

  private createParticleLayers(): void {
    // Clear existing layers
    this.clearLayers();
    
    for (let layerIndex = 0; layerIndex < this.config.layerCount; layerIndex++) {
      const layer = this.createParticleLayer(layerIndex);
      this.particleLayers.push(layer);
      this.particleGroup.add(layer.particles);
    }
    
    console.log(`🌟 Created ${this.config.layerCount} parallax particle layers`);
  }

  private createParticleLayer(layerIndex: number): ParallaxLayer {
    const particleCount = this.config.particlesPerLayer;
    
    // Create geometry with positions, colors, and sizes
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    // Calculate layer distance
    const layerProgress = layerIndex / (this.config.layerCount - 1);
    const layerDistance = this.config.minDistance + 
      (this.config.maxDistance - this.config.minDistance) * layerProgress;
    
    // Generate particles in a spherical distribution
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Spherical coordinates for even distribution
      const radius = layerDistance + (Math.random() - 0.5) * 20;
      const theta = Math.random() * Math.PI * 2; // Azimuth
      const phi = Math.acos(2 * Math.random() - 1); // Polar angle (uniform on sphere)
      
      // Convert to Cartesian coordinates
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      // Assign color based on distance (closer = brighter)
      const colorIndex = Math.floor(Math.random() * this.config.colors.length);
      const baseColor = this.config.colors[colorIndex];
      const brightness = 1.0 - layerProgress * 0.5; // Closer layers are brighter
      
      colors[i3] = baseColor.r * brightness;
      colors[i3 + 1] = baseColor.g * brightness;
      colors[i3 + 2] = baseColor.b * brightness;
      
      // Size based on distance (closer = larger)
      const sizeRange = this.config.maxSize - this.config.minSize;
      sizes[i] = this.config.minSize + sizeRange * (1.0 - layerProgress * 0.7);
    }
    
    // Set geometry attributes
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create material with custom size handling
    const material = new THREE.PointsMaterial({
      size: 1.0, // Base size, actual size comes from attribute
      transparent: true,
      opacity: this.config.opacity * (1.0 - layerProgress * 0.3),
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      alphaTest: 0.01
    });
    
    // Create points object
    const particles = new THREE.Points(geometry, material);
    
    // Calculate parallax speed (closer layers move faster)
    const parallaxSpeed = (1.0 - layerProgress) * this.config.parallaxStrength;
    
    // Store metadata
    particles.userData = {
      isParallaxLayer: true,
      layerIndex: layerIndex,
      layerDistance: layerDistance,
      parallaxSpeed: parallaxSpeed
    };
    
    return {
      particles: particles,
      speed: parallaxSpeed,
      distance: layerDistance,
      originalPositions: positions.slice() // Copy for reset functionality
    };
  }

  update(deltaTime: number): void {
    if (!this.initialized || !this.camera) return;
    
    // Calculate camera movement
    const currentPosition = this.camera.position.clone();
    const currentRotation = this.camera.rotation.clone();
    
    const positionDelta = currentPosition.clone().sub(this.previousCameraPosition);
    const rotationDelta = new THREE.Vector3(
      currentRotation.x - this.previousCameraRotation.x,
      currentRotation.y - this.previousCameraRotation.y,
      currentRotation.z - this.previousCameraRotation.z
    );
    
    // Update each particle layer with different parallax speeds
    this.particleLayers.forEach((layer, index) => {
      this.updateLayerParallax(layer, positionDelta, rotationDelta, deltaTime);
    });
    
    // Store current camera state for next frame
    this.previousCameraPosition.copy(currentPosition);
    this.previousCameraRotation.copy(currentRotation);
  }

  private updateLayerParallax(
    layer: ParallaxLayer, 
    positionDelta: THREE.Vector3, 
    rotationDelta: THREE.Vector3,
    deltaTime: number
  ): void {
    const particles = layer.particles;
    const speed = layer.speed;
    
    // Apply position-based parallax
    const parallaxOffset = positionDelta.clone().multiplyScalar(-speed * 0.1);
    particles.position.add(parallaxOffset);
    
    // Apply rotation-based parallax for more immersive effect
    const rotationParallax = rotationDelta.clone().multiplyScalar(-speed * 0.05);
    particles.rotation.x += rotationParallax.x;
    particles.rotation.y += rotationParallax.y;
    
    // Add subtle drift animation
    const time = Date.now() * 0.0001;
    const driftAmount = 0.02 * speed;
    particles.position.x += Math.sin(time + layer.distance * 0.01) * driftAmount;
    particles.position.y += Math.cos(time * 1.1 + layer.distance * 0.01) * driftAmount;
    
    // Slowly rotate the entire layer
    particles.rotation.z += speed * 0.0001 * deltaTime;
  }

  // Configuration methods
  setParticleCount(count: number): void {
    this.config.particlesPerLayer = Math.max(50, Math.min(1000, count));
    this.createParticleLayers();
    console.log(`✨ Particle count per layer set to ${count}`);
  }

  setLayerCount(count: number): void {
    this.config.layerCount = Math.max(2, Math.min(8, count));
    this.createParticleLayers();
    console.log(`🌟 Parallax layer count set to ${count}`);
  }

  setParallaxStrength(strength: number): void {
    this.config.parallaxStrength = Math.max(0, Math.min(2, strength));
    
    // Update existing layer speeds
    this.particleLayers.forEach((layer, index) => {
      const layerProgress = index / (this.config.layerCount - 1);
      layer.speed = (1.0 - layerProgress) * this.config.parallaxStrength;
      layer.particles.userData.parallaxSpeed = layer.speed;
    });
    
    console.log(`🔄 Parallax strength set to ${strength}`);
  }

  setOpacity(opacity: number): void {
    this.config.opacity = Math.max(0, Math.min(1, opacity));
    
    this.particleLayers.forEach((layer, index) => {
      const layerProgress = index / (this.config.layerCount - 1);
      const material = layer.particles.material as THREE.PointsMaterial;
      material.opacity = this.config.opacity * (1.0 - layerProgress * 0.3);
    });
    
    console.log(`💫 Particle opacity set to ${opacity}`);
  }

  setColorPalette(colors: THREE.Color[]): void {
    this.config.colors = [...colors];
    
    // Recreate particles with new colors
    this.createParticleLayers();
    
    console.log(`🎨 Particle color palette updated with ${colors.length} colors`);
  }

  setDistanceRange(minDistance: number, maxDistance: number): void {
    this.config.minDistance = Math.max(10, minDistance);
    this.config.maxDistance = Math.max(this.config.minDistance + 50, maxDistance);
    
    this.createParticleLayers();
    
    console.log(`📏 Particle distance range set to ${minDistance}-${maxDistance}`);
  }

  // Utility methods
  getParticleGroup(): THREE.Group {
    return this.particleGroup;
  }

  getLayerCount(): number {
    return this.particleLayers.length;
  }

  getTotalParticleCount(): number {
    return this.particleLayers.length * this.config.particlesPerLayer;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // Reset particles to original positions (useful for camera reset)
  resetParticlePositions(): void {
    this.particleLayers.forEach(layer => {
      layer.particles.position.set(0, 0, 0);
      layer.particles.rotation.set(0, 0, 0);
    });
    
    if (this.camera) {
      this.previousCameraPosition.copy(this.camera.position);
      this.previousCameraRotation.copy(this.camera.rotation);
    }
    
    console.log('🔄 Particle positions reset');
  }

  private clearLayers(): void {
    // Remove existing layers from group
    this.particleLayers.forEach(layer => {
      this.particleGroup.remove(layer.particles);
      layer.particles.geometry.dispose();
      if (layer.particles.material instanceof THREE.Material) {
        layer.particles.material.dispose();
      }
    });
    
    this.particleLayers = [];
  }

  dispose(): void {
    console.log('🗑️ Disposing Parallax Particles...');
    
    if (this.scene && this.particleGroup) {
      this.scene.remove(this.particleGroup);
    }
    
    this.clearLayers();
    this.particleGroup.clear();
    
    this.scene = undefined;
    this.camera = undefined;
    this.initialized = false;
    
    console.log('✅ Parallax Particles disposed');
  }
}