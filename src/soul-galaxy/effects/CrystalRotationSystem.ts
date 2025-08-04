import * as THREE from 'three';
import { CrystalTrack } from '../types';

/**
 * Configuration for crystal rotation during focus
 */
export interface CrystalRotationConfig {
  /** Base rotation speed (radians per second) */
  baseRotationSpeed: number;
  /** Multiplier for BPM-based speed adjustment */
  bpmSpeedMultiplier: number;
  /** Minimum rotation speed */
  minRotationSpeed: number;
  /** Maximum rotation speed */
  maxRotationSpeed: number;
  /** Duration for rotation start/stop transitions (ms) */
  transitionDuration: number;
  /** Enable rotation based on track energy if BPM unavailable */
  useEnergyFallback: boolean;
  /** Rotation axes weights (x, y, z) */
  rotationAxes: THREE.Vector3;
}

/**
 * Represents an active crystal rotation
 */
interface CrystalRotation {
  crystal: CrystalTrack;
  mesh: THREE.Mesh;
  originalRotation: THREE.Euler;
  targetRotationSpeed: THREE.Vector3;
  currentRotationSpeed: THREE.Vector3;
  isTransitioning: boolean;
  transitionStartTime: number;
  transitionDuration: number;
  isStarting: boolean; // true for start transition, false for stop
}

/**
 * System for managing slow rotation of focused crystals during playback
 * Provides smooth rotation based on track tempo and characteristics
 */
export class CrystalRotationSystem {
  private activeRotations: Map<string, CrystalRotation> = new Map();
  private config: CrystalRotationConfig;
  private animationFrameId?: number;

  constructor(config: Partial<CrystalRotationConfig> = {}) {
    this.config = {
      baseRotationSpeed: 0.3, // 0.3 radians per second (slow rotation)
      bpmSpeedMultiplier: 0.005, // BPM influence on speed
      minRotationSpeed: 0.1,
      maxRotationSpeed: 1.0,
      transitionDuration: 2000, // 2 seconds for smooth transitions
      useEnergyFallback: true,
      rotationAxes: new THREE.Vector3(0.2, 1.0, 0.3), // Primarily Y-axis with slight X and Z
      ...config
    };

    console.log('🔄 CrystalRotationSystem initialized');
  }

  /**
   * Starts rotation for a focused crystal during playback
   */
  startRotation(crystal: CrystalTrack, mesh: THREE.Mesh): void {
    const trackId = crystal.id;
    
    // Stop any existing rotation for this crystal
    this.stopRotation(trackId);

    console.log(`🔄 Starting rotation for crystal: ${crystal.name} by ${crystal.artist}`);

    // Calculate rotation speed based on track characteristics
    const rotationSpeed = this.calculateRotationSpeed(crystal);
    
    // Store original rotation for restoration
    const originalRotation = mesh.rotation.clone();
    
    // Create rotation data
    const rotation: CrystalRotation = {
      crystal,
      mesh,
      originalRotation,
      targetRotationSpeed: rotationSpeed,
      currentRotationSpeed: new THREE.Vector3(0, 0, 0),
      isTransitioning: true,
      transitionStartTime: performance.now(),
      transitionDuration: this.config.transitionDuration,
      isStarting: true
    };

    // Store active rotation
    this.activeRotations.set(trackId, rotation);

    // Start animation loop if not already running
    if (!this.animationFrameId) {
      this.startAnimationLoop();
    }

    console.log(`🎬 Rotation started for ${crystal.name} with speed:`, rotationSpeed);
  }

  /**
   * Stops rotation for a crystal and returns it to original orientation
   */
  stopRotation(trackId: string): void {
    const rotation = this.activeRotations.get(trackId);
    if (!rotation) {
      return;
    }

    console.log(`⏹️ Stopping rotation for crystal: ${rotation.crystal.name}`);

    // Start stop transition
    rotation.isTransitioning = true;
    rotation.transitionStartTime = performance.now();
    rotation.transitionDuration = this.config.transitionDuration;
    rotation.isStarting = false;

    // The rotation will be removed from the map when transition completes
  }

  /**
   * Stops all active rotations
   */
  stopAllRotations(): void {
    const trackIds = Array.from(this.activeRotations.keys());
    trackIds.forEach(trackId => this.stopRotation(trackId));
  }

  /**
   * Checks if a crystal is currently rotating
   */
  isRotating(trackId: string): boolean {
    return this.activeRotations.has(trackId);
  }

  /**
   * Gets the current rotation speed for a crystal
   */
  getCurrentRotationSpeed(trackId: string): THREE.Vector3 | null {
    const rotation = this.activeRotations.get(trackId);
    return rotation ? rotation.currentRotationSpeed.clone() : null;
  }

  /**
   * Updates rotation configuration
   */
  updateConfig(newConfig: Partial<CrystalRotationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ CrystalRotationSystem configuration updated');
  }

  /**
   * Disposes of the system and cleans up resources
   */
  dispose(): void {
    console.log('🗑️ Disposing CrystalRotationSystem...');
    
    // Stop all rotations and restore original orientations
    this.activeRotations.forEach((rotation, trackId) => {
      rotation.mesh.rotation.copy(rotation.originalRotation);
    });
    
    this.activeRotations.clear();
    
    // Clear animation loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
    
    console.log('✅ CrystalRotationSystem disposed');
  }

  // Private methods

  private startAnimationLoop(): void {
    const animate = () => {
      this.updateRotations();
      
      if (this.activeRotations.size > 0) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.animationFrameId = undefined;
      }
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
  }

  private updateRotations(): void {
    const currentTime = performance.now();
    const deltaTime = 1 / 60; // Assume 60 FPS for consistent rotation
    const completedRotations: string[] = [];

    this.activeRotations.forEach((rotation, trackId) => {
      if (rotation.isTransitioning) {
        this.updateTransition(rotation, currentTime);
      }

      // Apply rotation to mesh
      if (!rotation.isTransitioning || rotation.isStarting) {
        this.applyRotation(rotation, deltaTime);
      }

      // Check if stop transition is complete
      if (rotation.isTransitioning && !rotation.isStarting) {
        const elapsed = currentTime - rotation.transitionStartTime;
        const progress = Math.min(elapsed / rotation.transitionDuration, 1);
        
        if (progress >= 1) {
          // Restore original rotation and mark for removal
          rotation.mesh.rotation.copy(rotation.originalRotation);
          completedRotations.push(trackId);
          
          console.log(`✅ Rotation stopped and restored for ${rotation.crystal.name}`);
        }
      }
    });

    // Clean up completed rotations
    completedRotations.forEach(trackId => {
      this.activeRotations.delete(trackId);
    });
  }

  private updateTransition(rotation: CrystalRotation, currentTime: number): void {
    const elapsed = currentTime - rotation.transitionStartTime;
    const progress = Math.min(elapsed / rotation.transitionDuration, 1);
    
    // Use smooth easing for transitions
    const easedProgress = this.easeInOutCubic(progress);
    
    if (rotation.isStarting) {
      // Transition from 0 to target speed
      rotation.currentRotationSpeed.lerpVectors(
        new THREE.Vector3(0, 0, 0),
        rotation.targetRotationSpeed,
        easedProgress
      );
      
      if (progress >= 1) {
        rotation.isTransitioning = false;
        console.log(`🎬 Rotation transition completed for ${rotation.crystal.name}`);
      }
    } else {
      // Transition from current speed to 0
      rotation.currentRotationSpeed.lerpVectors(
        rotation.targetRotationSpeed,
        new THREE.Vector3(0, 0, 0),
        easedProgress
      );
    }
  }

  private applyRotation(rotation: CrystalRotation, deltaTime: number): void {
    // Apply rotation based on current speed
    rotation.mesh.rotation.x += rotation.currentRotationSpeed.x * deltaTime;
    rotation.mesh.rotation.y += rotation.currentRotationSpeed.y * deltaTime;
    rotation.mesh.rotation.z += rotation.currentRotationSpeed.z * deltaTime;
  }

  private calculateRotationSpeed(crystal: CrystalTrack): THREE.Vector3 {
    let speedMultiplier = 1.0;
    
    // Use popularity as a proxy for energy/tempo
    // Higher popularity might indicate more energetic tracks
    if (crystal.popularity !== undefined) {
      // Normalize popularity (0-100) to speed multiplier (0.7-1.3)
      const normalizedPopularity = Math.max(0, Math.min(100, crystal.popularity));
      speedMultiplier = 0.7 + (normalizedPopularity / 100) * 0.6;
      
      console.log(`📊 Using popularity ${crystal.popularity} for rotation speed calculation`);
    }
    
    // Use duration as additional factor - shorter tracks might be more energetic
    if (crystal.duration > 0) {
      // Typical song duration: 180-300 seconds, shorter = faster rotation
      const normalizedDuration = Math.max(120, Math.min(360, crystal.duration));
      const durationFactor = 1.2 - ((normalizedDuration - 120) / 240) * 0.4; // Range: 0.8-1.2
      speedMultiplier *= durationFactor;
      
      console.log(`⏱️ Using duration ${crystal.duration}s for rotation speed calculation`);
    }
    
    // Apply genre-specific modifiers
    const genreModifier = this.getGenreRotationModifier(crystal.genre);
    speedMultiplier *= genreModifier;
    
    // Calculate base speed
    let baseSpeed = this.config.baseRotationSpeed * speedMultiplier;
    
    // Clamp to min/max values
    baseSpeed = Math.max(this.config.minRotationSpeed, 
                        Math.min(this.config.maxRotationSpeed, baseSpeed));
    
    // Apply to rotation axes
    const rotationSpeed = new THREE.Vector3(
      baseSpeed * this.config.rotationAxes.x,
      baseSpeed * this.config.rotationAxes.y,
      baseSpeed * this.config.rotationAxes.z
    );
    
    // Add slight randomization for organic feel
    const randomFactor = 0.1;
    rotationSpeed.x += (Math.random() - 0.5) * randomFactor * baseSpeed;
    rotationSpeed.y += (Math.random() - 0.5) * randomFactor * baseSpeed;
    rotationSpeed.z += (Math.random() - 0.5) * randomFactor * baseSpeed;
    
    return rotationSpeed;
  }

  private getGenreRotationModifier(genre: string): number {
    // Genre-specific rotation speed modifiers
    const genreModifiers: { [key: string]: number } = {
      metal: 1.3,      // Faster rotation for aggressive genres
      punk: 1.4,       // Even faster for punk
      rock: 1.1,       // Slightly faster for rock
      electronic: 0.9, // Slower, more hypnotic for electronic
      jazz: 0.7,       // Slow and smooth for jazz
      classical: 0.6,  // Very slow and elegant for classical
      pop: 1.0,        // Standard speed for pop
      indie: 0.8,      // Slightly slower for indie
      hiphop: 1.2,     // Moderate speed for hip-hop
      default: 1.0     // Default multiplier
    };

    const normalizedGenre = genre.toLowerCase();
    return genreModifiers[normalizedGenre] || genreModifiers.default;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Public utility methods

  /**
   * Gets statistics about active rotations
   */
  getRotationStats(): {
    activeRotations: number;
    rotatingCrystals: string[];
    averageSpeed: number;
  } {
    const rotatingCrystals = Array.from(this.activeRotations.values())
      .map(rotation => `${rotation.crystal.name} by ${rotation.crystal.artist}`);
    
    const totalSpeed = Array.from(this.activeRotations.values())
      .reduce((sum, rotation) => sum + rotation.currentRotationSpeed.length(), 0);
    
    const averageSpeed = this.activeRotations.size > 0 ? 
      totalSpeed / this.activeRotations.size : 0;

    return {
      activeRotations: this.activeRotations.size,
      rotatingCrystals,
      averageSpeed
    };
  }

  /**
   * Adjusts rotation speed for a specific crystal
   */
  adjustRotationSpeed(trackId: string, speedMultiplier: number): void {
    const rotation = this.activeRotations.get(trackId);
    if (!rotation) {
      return;
    }

    // Recalculate target speed with new multiplier
    const baseSpeed = this.calculateRotationSpeed(rotation.crystal);
    rotation.targetRotationSpeed.copy(baseSpeed.multiplyScalar(speedMultiplier));
    
    console.log(`⚙️ Adjusted rotation speed for ${rotation.crystal.name} by ${speedMultiplier}x`);
  }

  /**
   * Temporarily pauses rotation for a crystal
   */
  pauseRotation(trackId: string): void {
    const rotation = this.activeRotations.get(trackId);
    if (!rotation) {
      return;
    }

    // Store current speed and set to zero
    rotation.targetRotationSpeed.set(0, 0, 0);
    console.log(`⏸️ Paused rotation for ${rotation.crystal.name}`);
  }

  /**
   * Resumes rotation for a crystal
   */
  resumeRotation(trackId: string): void {
    const rotation = this.activeRotations.get(trackId);
    if (!rotation) {
      return;
    }

    // Restore calculated rotation speed
    const speed = this.calculateRotationSpeed(rotation.crystal);
    rotation.targetRotationSpeed.copy(speed);
    console.log(`▶️ Resumed rotation for ${rotation.crystal.name}`);
  }
}