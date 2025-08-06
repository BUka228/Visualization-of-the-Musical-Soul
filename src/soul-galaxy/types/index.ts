import * as THREE from 'three';
import { ProcessedTrack } from '../../types';

// Расширенный интерфейс кристаллического трека
export interface CrystalTrack extends ProcessedTrack {
  // Геометрия и визуальные свойства
  crystalGeometry: THREE.BufferGeometry;
  facetCount: number;
  roughnessLevel: number;
  
  // Анимация и пульсация
  pulseSpeed: number;
  pulseAmplitude: number;
  pulsePhase: number;
  
  // Цвета и материалы
  genreColor: THREE.Color;
  emissiveIntensity: number;
  albumTexture?: THREE.Texture;
  
  // Состояние
  isFocused: boolean;
  isHovered: boolean;
  distanceFromCenter: number;
}

// Интерфейс системы кристаллических треков
export interface CrystalTrackSystem {
  initialize(scene: THREE.Scene, camera: THREE.Camera, container?: HTMLElement): void;
  createCrystalCluster(tracks: ProcessedTrack[]): Promise<void>;
  updatePulsation(deltaTime: number): void;
  rotateCluster(deltaTime: number): void;
  focusOnCrystal(crystal: CrystalTrack): void;
  handleCrystalClick(trackId: string): Promise<void>;
  getCrystalTracks(): CrystalTrack[];
  dispose(): void;
}

// Коллбэки для аудио событий с центральной сферой
export interface AudioCallbacks {
  onTrackPlayStart?: (track: CrystalTrack, audioElement: HTMLAudioElement) => void;
  onTrackPlayEnd?: (track: CrystalTrack) => void;
  onAudioError?: (track: CrystalTrack, error: Error) => void;
}

// Интерфейс для центральной сферы
export interface CentralSphereConfig {
  coreRadius: number;
  auraRadius: number;
  particleCount: number;
  orbitalRings: number;
  baseIntensity: number;
  pulseReactivity: number;
}

// Интерфейс для энергетических лучей
export interface EnergyBeam {
  id: string;
  targetPosition: THREE.Vector3;
  color: THREE.Color;
  intensity: number;
  mesh: THREE.Line;
}

// Интерфейс для цветовых волн по жанрам
export interface GenreWave {
  id: string;
  genre: string;
  color: THREE.Color;
  startTime: number;
  mesh: THREE.Mesh;
}

// Конфигурация аудио анализа
export interface AudioAnalysisConfig {
  fftSize: number;
  bassRange: [number, number];
  midRange: [number, number];
  trebleRange: [number, number];
  smoothingTimeConstant: number;
}

// Результат аудио анализа
export interface AudioAnalysisData {
  bassLevel: number;
  midLevel: number;
  trebleLevel: number;
  overallIntensity: number;
  frequencyData: Uint8Array;
}

// Интерфейс для орбитальных частиц
export interface OrbitalRing {
  radius: number;
  particleCount: number;
  rotationSpeed: number;
  verticalOffset: number;
  particles: THREE.Points;
}

// Конфигурация шейдерных эффектов
export interface ShaderEffectConfig {
  noiseScale: number;
  waveAmplitude: number;
  colorShift: number;
  emissiveBoost: number;
  distortionStrength: number;
}

// Интерфейс для системы частиц
export interface ParticleSystemConfig {
  count: number;
  size: number;
  speed: number;
  lifespan: number;
  emissionRate: number;
  gravity: THREE.Vector3;
}

export { ProcessedTrack };