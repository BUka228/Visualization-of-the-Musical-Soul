import * as THREE from 'three';
import { ProcessedTrack } from '../types';

// Soul Galaxy is now the only visual mode

// Soul Galaxy specific interfaces
export interface SoulGalaxyRenderer {
  initialize(scene: THREE.Scene, camera: THREE.Camera): void;
  createCrystalCluster(tracks: ProcessedTrack[]): void;
  updateScene(deltaTime: number): void;
  dispose(): void;
}

export interface DeepSpaceEnvironment {
  initialize(scene: THREE.Scene, camera: THREE.Camera): void;
  createNebulaBackground(): void;
  createParallaxParticles(): void;
  updateParallax(cameraMovement: THREE.Vector3): void;
  setNebulaIntensity(intensity: number): void;
  setParticleCount(count: number): void;
  setDepthLayers(layers: number): void;
  dispose(): void;
}

export interface CrystalTrackSystem {
  createCrystalCluster(tracks: ProcessedTrack[]): void;
  generateCrystalGeometry(track: ProcessedTrack): THREE.BufferGeometry;
  createCrystalMaterial(track: ProcessedTrack): THREE.ShaderMaterial;
  updatePulsation(deltaTime: number): void;
  setPulsationFromBPM(track: ProcessedTrack, bpm?: number): void;
  rotateCluster(deltaTime: number): void;
  focusOnCrystal(crystal: CrystalTrack): void;
  dispose(): void;
}

export interface CrystalTrack extends ProcessedTrack {
  crystalGeometry: THREE.BufferGeometry;
  facetCount: number;
  roughnessLevel: number;
  pulseSpeed: number;
  pulseAmplitude: number;
  pulsePhase: number;
  genreColor: THREE.Color;
  emissiveIntensity: number;
  albumTexture?: THREE.Texture;
  isFocused: boolean;
  isHovered: boolean;
  distanceFromCenter: number;
}

export interface NebulaConfig {
  intensity: number;
  colorPalette: THREE.Color[];
  density: number;
  driftSpeed: number;
  turbulence: number;
  layerCount: number;
  layerSeparation: number;
}

export interface GenreColorPalette {
  metal: THREE.Color;
  rock: THREE.Color;
  punk: THREE.Color;
  electronic: THREE.Color;
  jazz: THREE.Color;
  classical: THREE.Color;
  pop: THREE.Color;
  indie: THREE.Color;
  hiphop: THREE.Color;
  default: THREE.Color;
}

// SceneManager interface moved to main types - no mode switching needed