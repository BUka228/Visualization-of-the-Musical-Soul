import { Vector3, Mesh } from 'three';

// Базовые типы данных
export interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  genre: string;
  duration: number; // в секундах
  popularity: number; // 0-100
  previewUrl?: string;
  imageUrl?: string;
  playCount?: number;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  totalTracks: number;
}

export interface ProcessedTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  genre: string;
  popularity: number;
  duration: number;
  previewUrl?: string;
  color: string;
  size: number;
  position: Vector3;
}

export interface GenreStats {
  [genre: string]: {
    count: number;
    percentage: number;
    color: string;
  };
}

export interface SceneConfig {
  galaxyRadius: number;
  objectMinSize: number;
  objectMaxSize: number;
  animationSpeed: number;
  cameraDistance: number;
  genreColors: { [genre: string]: string };
}

// Интерфейсы для авторизации
export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthModule {
  authenticate(): Promise<AuthToken>;
  refreshToken(): Promise<AuthToken>;
  getUserPlaylists(): Promise<Playlist[]>;
  getTrackData(trackId: string): Promise<Track>;
}

// Интерфейсы для обработки данных
export interface DataProcessor {
  processTrackData(tracks: Track[]): ProcessedTrack[];
  analyzeGenres(tracks: Track[]): GenreStats;
  calculatePopularity(track: Track): number;
  calculateSize(track: Track): number;
  calculatePosition(index: number, total: number, genre: string): Vector3;
  getGenreColor(genre: string): string;
}

// Интерфейсы для 3D-сцены
export interface TrackObject extends Mesh {
  trackData: ProcessedTrack;
  originalPosition: Vector3;
  isSelected: boolean;
  isHovered: boolean;
  
  // Методы для управления состоянием
  setHovered(hovered: boolean): void;
  setSelected(selected: boolean): void;
  updateAnimation(deltaTime: number, globalTime: number): void;
  updatePulse(globalTime: number): void;
  getTrackInfo(): {
    name: string;
    artist: string;
    album: string;
    genre: string;
    duration: string;
    popularity: number;
  };
  dispose(): void;
  getDistanceToCamera(camera: THREE.Camera): number;
}

export interface SceneManager {
  initializeScene(): void;
  createTrackObjects(tracks: ProcessedTrack[]): void;
  updateScene(): void;
  dispose(): void;
  getScene(): THREE.Scene;
  getCamera(): THREE.Camera;
  getRenderer(): THREE.WebGLRenderer;
  getAnimationManager(): AnimationManager;
  getTrackObjects(): TrackObject[];
  getTestObject(): THREE.Mesh | undefined;
  getInteractionManager(): InteractionManager;
  getEffectsManager(): EffectsManager;
}

// Интерфейсы для взаимодействия
export interface InteractionManager {
  initialize(sceneManager: SceneManager): void;
  handleMouseMove(event: MouseEvent): void;
  handleClick(event: MouseEvent): void;
  handleWheel(event: WheelEvent): void;
  handleKeyDown(event: KeyboardEvent): void;
  selectTrack(trackObject: TrackObject): void;
  deselectTrack(): void;
  resetCamera(): void;
  toggleAnimation(): void;
  getAudioManager(): AudioManager;
}

// Интерфейсы для аудио
export interface AudioManager {
  playPreview(url: string): Promise<void>;
  stopPreview(): void;
  setVolume(volume: number): void;
  getCurrentTime(): number;
  isPlaying(): boolean;
  getDuration(): number;
  getProgress(): number;
  setCurrentTime(time: number): void;
  pause(): void;
  resume(): void;
  setOnPlayStart(callback: () => void): void;
  setOnPlayEnd(callback: () => void): void;
  setOnError(callback: (error: Error) => void): void;
  dispose(): void;
}

// Интерфейсы для анимации
export interface AnimationManager {
  initialize(sceneManager: SceneManager): void;
  startAnimation(): void;
  stopAnimation(): void;
  toggleAnimation(): void;
  animateTrackSelection(trackObject: TrackObject): void;
  animateTrackDeselection(): void;
  animateCameraToTrack(trackObject: TrackObject): void;
  animateCameraReset(): void;
  isAnimating(): boolean;
}

// Интерфейсы для эффектов
export interface EffectsManager {
  initialize(scene: THREE.Scene, camera: THREE.Camera, audioManager?: AudioManager): void;
  activateSelectionEffects(trackObject: TrackObject): void;
  deactivateSelectionEffects(): void;
  createTrackChangeExplosion(position: THREE.Vector3, color: string): void;
  createGenreAura(tracks: TrackObject[], genreColor: string): void;
  createTrackAppearanceEffect(trackObject: TrackObject): void;
  createTrackDisappearanceEffect(trackObject: TrackObject): void;
  update(deltaTime: number): void;
  setEffectsEnabled(enabled: boolean): void;
  setMusicPulseEnabled(enabled: boolean): void;
  setParticleSystemSettings(starCount?: number, selectionParticleCount?: number): void;
  setLightingSettings(pulseSpeed?: number, glowIntensity?: number): void;
  getEffectsStats(): {
    starCount: number;
    selectionParticleCount: number;
    activeGlowCount: number;
    pulseObjectsCount: number;
    isSelectionActive: boolean;
    isMusicPulseEnabled: boolean;
  };
  isReady(): boolean;
  areEffectsEnabled(): boolean;
  dispose(): void;
}

// События и коллбэки
export interface EventCallbacks {
  onTrackSelected?: (track: ProcessedTrack) => void;
  onTrackDeselected?: () => void;
  onTrackHovered?: (track: ProcessedTrack) => void;
  onTrackUnhovered?: () => void;
  onSceneReady?: () => void;
  onError?: (error: Error) => void;
}

// Конфигурация приложения
export interface AppConfig {
  scene: SceneConfig;
  api: {
    baseUrl: string;
    clientId: string;
    redirectUri: string;
  };
  audio: {
    defaultVolume: number;
    fadeInDuration: number;
    fadeOutDuration: number;
  };
  animation: {
    rotationSpeed: number;
    cameraTransitionDuration: number;
    objectAppearDuration: number;
  };
}

// Состояние приложения
export interface AppState {
  isInitialized: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  currentTrack?: ProcessedTrack;
  selectedTrack?: TrackObject;
  hoveredTrack?: TrackObject;
  tracks: ProcessedTrack[];
  genreStats: GenreStats;
  animationPaused: boolean;
}

// Главный интерфейс приложения
export interface MusicGalaxyApp {
  initialize(container: HTMLElement): Promise<void>;
  loadTracks(tracks: Track[]): void;
  selectTrack(trackId: string): void;
  resetView(): void;
  toggleAnimation(): void;
  dispose(): void;
  getState(): AppState;
}