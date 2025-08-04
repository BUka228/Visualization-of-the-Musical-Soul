import * as THREE from 'three';
import { AudioManager } from '../../audio/AudioManager';
import { CrystalTrack } from '../types';
import { CrystalShaderMaterial } from '../materials/CrystalShaderMaterial';

/**
 * Интеграция аудио системы с Soul Galaxy визуализацией
 * Обеспечивает синхронизацию воспроизведения с кинематографическими переходами
 */
export class SoulGalaxyAudioIntegration {
  private audioManager: AudioManager;
  private currentPlayingTrack?: CrystalTrack;
  private currentPlayingMesh?: THREE.Mesh;
  private isTransitioning: boolean = false;
  private initialized: boolean = false;

  // Настройки аудио интеграции
  private static readonly AUDIO_CONFIG = {
    fadeInDuration: 800,      // Длительность появления аудио при переходах
    fadeOutDuration: 600,     // Длительность затухания аудио при переходах
    transitionDelay: 200,     // Задержка перед началом воспроизведения
    visualIndicatorDuration: 30000, // Длительность визуальной индикации (30 сек)
    pulseAmplification: 1.4,  // Усиление пульсации при воспроизведении
    glowIntensification: 1.6  // Усиление свечения при воспроизведении
  };

  // Коллбэки для событий
  private onTrackPlayStart?: (track: CrystalTrack) => void;
  private onTrackPlayEnd?: (track: CrystalTrack) => void;
  private onAudioError?: (track: CrystalTrack, error: Error) => void;
  private onTransitionStart?: (track: CrystalTrack) => void;
  private onTransitionEnd?: (track: CrystalTrack) => void;
  private onRotationStart?: (track: CrystalTrack, mesh: THREE.Mesh) => void;
  private onRotationStop?: (track: CrystalTrack) => void;

  constructor() {
    this.audioManager = new AudioManager();
    this.setupAudioCallbacks();
    console.log('🎵 Soul Galaxy Audio Integration created');
  }

  /**
   * Инициализация аудио интеграции
   */
  initialize(): void {
    console.log('🎵 Initializing Soul Galaxy Audio Integration...');
    
    this.initialized = true;
    
    console.log('✅ Soul Galaxy Audio Integration initialized');
  }

  /**
   * Настройка коллбэков аудио менеджера
   */
  private setupAudioCallbacks(): void {
    this.audioManager.setOnPlayStart(() => {
      console.log('🎵 Audio playback started');
      
      if (this.currentPlayingTrack) {
        this.startVisualPlaybackIndicator();
        
        if (this.onTrackPlayStart) {
          this.onTrackPlayStart(this.currentPlayingTrack);
        }
      }
    });

    this.audioManager.setOnPlayEnd(() => {
      console.log('🎵 Audio playback ended');
      
      if (this.currentPlayingTrack) {
        this.stopVisualPlaybackIndicator();
        
        if (this.onTrackPlayEnd) {
          this.onTrackPlayEnd(this.currentPlayingTrack);
        }
        
        this.currentPlayingTrack = undefined;
        this.currentPlayingMesh = undefined;
      }
    });

    this.audioManager.setOnError((error: Error) => {
      console.error('❌ Audio playback error:', error.message);
      
      if (this.currentPlayingTrack) {
        this.stopVisualPlaybackIndicator();
        
        if (this.onAudioError) {
          this.onAudioError(this.currentPlayingTrack, error);
        }
        
        this.currentPlayingTrack = undefined;
        this.currentPlayingMesh = undefined;
      }
    });
  }

  /**
   * Воспроизводит трек с кинематографическим переходом
   */
  async playTrackWithTransition(track: CrystalTrack, crystalMesh: THREE.Mesh): Promise<void> {
    if (!this.initialized) {
      console.warn('⚠️ Soul Galaxy Audio Integration not initialized');
      return;
    }

    console.log(`🎵 Playing track with transition: ${track.name} by ${track.artist}`);

    // Останавливаем текущее воспроизведение если есть
    await this.stopCurrentTrack();

    // Проверяем наличие превью URL
    if (!track.previewUrl) {
      console.warn(`⚠️ No preview URL for track: ${track.name}`);
      this.showNoPreviewIndicator(track, crystalMesh);
      return;
    }

    try {
      // Устанавливаем текущий трек
      this.currentPlayingTrack = track;
      this.currentPlayingMesh = crystalMesh;
      this.isTransitioning = true;

      // Вызываем коллбэк начала перехода
      if (this.onTransitionStart) {
        this.onTransitionStart(track);
      }

      // Задержка для синхронизации с кинематографическим переходом
      await this.delay(SoulGalaxyAudioIntegration.AUDIO_CONFIG.transitionDelay);

      // Начинаем воспроизведение с плавным появлением
      await this.audioManager.playPreview(track.previewUrl);

      this.isTransitioning = false;

      // Вызываем коллбэк окончания перехода
      if (this.onTransitionEnd) {
        this.onTransitionEnd(track);
      }

      console.log(`✅ Track playback started: ${track.name}`);

    } catch (error) {
      console.error(`❌ Failed to play track: ${track.name}`, error);
      
      this.isTransitioning = false;
      this.currentPlayingTrack = undefined;
      this.currentPlayingMesh = undefined;

      if (this.onAudioError && track) {
        this.onAudioError(track, error instanceof Error ? error : new Error('Unknown audio error'));
      }

      throw error;
    }
  }

  /**
   * Останавливает текущее воспроизведение с плавным затуханием
   */
  async stopCurrentTrack(): Promise<void> {
    if (!this.currentPlayingTrack) {
      return;
    }

    console.log(`🛑 Stopping current track: ${this.currentPlayingTrack.name}`);

    // Останавливаем визуальную индикацию
    this.stopVisualPlaybackIndicator();

    // Останавливаем аудио с плавным затуханием
    this.audioManager.stopPreview();

    // Очищаем состояние
    this.currentPlayingTrack = undefined;
    this.currentPlayingMesh = undefined;
    this.isTransitioning = false;
  }

  /**
   * Запускает визуальную индикацию воспроизведения на кристалле
   */
  private startVisualPlaybackIndicator(): void {
    if (!this.currentPlayingMesh || !this.currentPlayingTrack) {
      return;
    }

    console.log('🎨 Starting visual playback indicator');

    const material = this.currentPlayingMesh.material;
    if (material instanceof CrystalShaderMaterial) {
      // Усиливаем пульсацию во время воспроизведения
      const currentAmplitude = material.uniforms.pulseAmplitude.value;
      const amplifiedAmplitude = currentAmplitude * SoulGalaxyAudioIntegration.AUDIO_CONFIG.pulseAmplification;
      material.uniforms.pulseAmplitude.value = Math.min(amplifiedAmplitude, 1.0);

      // Усиливаем свечение
      const currentIntensity = material.uniforms.emissiveIntensity.value;
      const amplifiedIntensity = currentIntensity * SoulGalaxyAudioIntegration.AUDIO_CONFIG.glowIntensification;
      material.setEmissiveIntensity(amplifiedIntensity);

      // Добавляем специальный индикатор воспроизведения
      this.addPlaybackIndicator();
    }

    // Запускаем вращение кристалла во время воспроизведения
    if (this.onRotationStart) {
      this.onRotationStart(this.currentPlayingTrack, this.currentPlayingMesh);
    }
  }

  /**
   * Останавливает визуальную индикацию воспроизведения
   */
  private stopVisualPlaybackIndicator(): void {
    if (!this.currentPlayingMesh || !this.currentPlayingTrack) {
      return;
    }

    console.log('🎨 Stopping visual playback indicator');

    const material = this.currentPlayingMesh.material;
    if (material instanceof CrystalShaderMaterial) {
      // Возвращаем нормальную пульсацию
      const amplifiedAmplitude = material.uniforms.pulseAmplitude.value;
      const normalAmplitude = amplifiedAmplitude / SoulGalaxyAudioIntegration.AUDIO_CONFIG.pulseAmplification;
      material.uniforms.pulseAmplitude.value = Math.max(normalAmplitude, 0.05);

      // Возвращаем нормальное свечение
      const amplifiedIntensity = material.uniforms.emissiveIntensity.value;
      const normalIntensity = amplifiedIntensity / SoulGalaxyAudioIntegration.AUDIO_CONFIG.glowIntensification;
      material.setEmissiveIntensity(Math.max(normalIntensity, 0.1));

      // Убираем индикатор воспроизведения
      this.removePlaybackIndicator();
    }

    // Останавливаем вращение кристалла при окончании воспроизведения
    if (this.onRotationStop) {
      this.onRotationStop(this.currentPlayingTrack);
    }
  }

  /**
   * Добавляет визуальный индикатор воспроизведения
   */
  private addPlaybackIndicator(): void {
    // Создаем тонкий пульсирующий ореол вокруг кристалла
    // Это можно реализовать через дополнительный шейдер или частицы
    console.log('🎵 Adding playback visual indicator');
    
    // Здесь можно добавить дополнительные визуальные эффекты
    // например, частицы или дополнительное свечение
  }

  /**
   * Убирает визуальный индикатор воспроизведения
   */
  private removePlaybackIndicator(): void {
    console.log('🎵 Removing playback visual indicator');
    
    // Убираем дополнительные визуальные эффекты
  }

  /**
   * Показывает индикатор отсутствия превью
   */
  private showNoPreviewIndicator(track: CrystalTrack, crystalMesh: THREE.Mesh): void {
    console.log(`ℹ️ Showing no preview indicator for: ${track.name}`);
    
    // Создаем временный визуальный эффект для индикации отсутствия превью
    const material = crystalMesh.material;
    if (material instanceof CrystalShaderMaterial) {
      // Кратковременное изменение цвета для индикации
      const originalColor = material.getGenreColor();
      const noPreviewColor = new THREE.Color(0x666666); // Серый цвет
      
      material.setCustomColor(noPreviewColor);
      
      // Возвращаем оригинальный цвет через 2 секунды
      setTimeout(() => {
        material.setCustomColor(originalColor);
      }, 2000);
    }
  }

  /**
   * Получает текущий воспроизводимый трек
   */
  getCurrentPlayingTrack(): CrystalTrack | undefined {
    return this.currentPlayingTrack;
  }

  /**
   * Проверяет, воспроизводится ли трек в данный момент
   */
  isTrackPlaying(track: CrystalTrack): boolean {
    return this.currentPlayingTrack?.id === track.id && this.audioManager.isPlaying();
  }

  /**
   * Проверяет, происходит ли переход в данный момент
   */
  isInTransition(): boolean {
    return this.isTransitioning;
  }

  /**
   * Получает прогресс воспроизведения текущего трека
   */
  getPlaybackProgress(): number {
    return this.audioManager.getProgress();
  }

  /**
   * Получает длительность текущего трека
   */
  getPlaybackDuration(): number {
    return this.audioManager.getDuration();
  }

  /**
   * Получает текущее время воспроизведения
   */
  getCurrentTime(): number {
    return this.audioManager.getCurrentTime();
  }

  /**
   * Устанавливает громкость воспроизведения
   */
  setVolume(volume: number): void {
    this.audioManager.setVolume(volume);
  }

  /**
   * Приостанавливает воспроизведение
   */
  pausePlayback(): void {
    this.audioManager.pause();
  }

  /**
   * Возобновляет воспроизведение
   */
  resumePlayback(): void {
    this.audioManager.resume();
  }

  /**
   * Устанавливает коллбэк для начала воспроизведения трека
   */
  setOnTrackPlayStart(callback: (track: CrystalTrack) => void): void {
    this.onTrackPlayStart = callback;
  }

  /**
   * Устанавливает коллбэк для окончания воспроизведения трека
   */
  setOnTrackPlayEnd(callback: (track: CrystalTrack) => void): void {
    this.onTrackPlayEnd = callback;
  }

  /**
   * Устанавливает коллбэк для ошибок аудио
   */
  setOnAudioError(callback: (track: CrystalTrack, error: Error) => void): void {
    this.onAudioError = callback;
  }

  /**
   * Устанавливает коллбэк для начала перехода
   */
  setOnTransitionStart(callback: (track: CrystalTrack) => void): void {
    this.onTransitionStart = callback;
  }

  /**
   * Устанавливает коллбэк для окончания перехода
   */
  setOnTransitionEnd(callback: (track: CrystalTrack) => void): void {
    this.onTransitionEnd = callback;
  }

  /**
   * Устанавливает коллбэк для начала вращения кристалла
   */
  setOnRotationStart(callback: (track: CrystalTrack, mesh: THREE.Mesh) => void): void {
    this.onRotationStart = callback;
  }

  /**
   * Устанавливает коллбэк для остановки вращения кристалла
   */
  setOnRotationStop(callback: (track: CrystalTrack) => void): void {
    this.onRotationStop = callback;
  }

  /**
   * Получает статистику аудио интеграции
   */
  getAudioStats(): {
    initialized: boolean;
    isPlaying: boolean;
    isTransitioning: boolean;
    currentTrack: string | null;
    playbackProgress: number;
    playbackDuration: number;
  } {
    return {
      initialized: this.initialized,
      isPlaying: this.audioManager.isPlaying(),
      isTransitioning: this.isTransitioning,
      currentTrack: this.currentPlayingTrack ? 
        `${this.currentPlayingTrack.name} by ${this.currentPlayingTrack.artist}` : null,
      playbackProgress: this.getPlaybackProgress(),
      playbackDuration: this.getPlaybackDuration()
    };
  }

  /**
   * Вспомогательная функция для создания задержки
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Освобождает ресурсы аудио интеграции
   */
  dispose(): void {
    console.log('🗑️ Disposing Soul Galaxy Audio Integration...');

    // Останавливаем текущее воспроизведение
    this.stopCurrentTrack();

    // Освобождаем ресурсы аудио менеджера
    this.audioManager.dispose();

    // Очищаем коллбэки
    this.onTrackPlayStart = undefined;
    this.onTrackPlayEnd = undefined;
    this.onAudioError = undefined;
    this.onTransitionStart = undefined;
    this.onTransitionEnd = undefined;
    this.onRotationStart = undefined;
    this.onRotationStop = undefined;

    // Сбрасываем состояние
    this.currentPlayingTrack = undefined;
    this.currentPlayingMesh = undefined;
    this.isTransitioning = false;
    this.initialized = false;

    console.log('✅ Soul Galaxy Audio Integration disposed');
  }
}