import * as THREE from 'three';
import { ProcessedTrack } from '../../types';
import { SoulGalaxyRenderer as ISoulGalaxyRenderer } from '../types';
import { CrystalTrackSystem } from './CrystalTrackSystem';

export class SoulGalaxyRenderer implements ISoulGalaxyRenderer {
  private scene?: THREE.Scene;
  private camera?: THREE.Camera;
  private crystalTrackSystem: CrystalTrackSystem;
  private initialized: boolean = false;

  constructor() {
    this.crystalTrackSystem = new CrystalTrackSystem();
  }

  initialize(scene: THREE.Scene, camera: THREE.Camera): void {
    console.log('🌌 Initializing Soul Galaxy Renderer...');
    
    this.scene = scene;
    this.camera = camera;
    
    // Initialize the crystal track system
    this.crystalTrackSystem.initialize(scene, camera);
    
    this.initialized = true;
    
    console.log('✅ Soul Galaxy Renderer initialized');
  }

  async createCrystalCluster(tracks: ProcessedTrack[]): Promise<void> {
    if (!this.initialized || !this.scene) {
      console.warn('⚠️ Soul Galaxy Renderer not initialized');
      return;
    }

    console.log(`🔮 Creating crystal cluster for ${tracks.length} tracks...`);
    
    // Delegate to the crystal track system
    await this.crystalTrackSystem.createCrystalCluster(tracks);
    
    console.log('✅ Crystal cluster creation completed');
  }

  updateScene(deltaTime: number): void {
    if (!this.initialized) {
      return;
    }

    // Update crystal track system animations
    this.crystalTrackSystem.updatePulsation(deltaTime);
    this.crystalTrackSystem.rotateCluster(deltaTime);
  }

  // Visual mode methods removed - Soul Galaxy is now the only mode

  dispose(): void {
    console.log('🗑️ Disposing Soul Galaxy Renderer...');
    
    // Dispose of the crystal track system
    this.crystalTrackSystem.dispose();
    
    this.scene = undefined;
    this.camera = undefined;
    this.initialized = false;
    
    console.log('✅ Soul Galaxy Renderer disposed');
  }
}