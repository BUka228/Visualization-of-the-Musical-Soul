import * as THREE from 'three';
import { CentralSphere } from './CentralSphere';
import { CrystalTrackSystem } from './CrystalTrackSystem';
import { CrystalTrack } from '../types';

/**
 * Интеграция центральной сферы с системой кристаллов
 * Управляет взаимодействием между центральной сферой и кристаллами
 */
export class CentralSphereIntegration {
  private centralSphere: CentralSphere;
  private crystalSystem?: CrystalTrackSystem;
  private scene?: THREE.Scene;
  private currentPlayingTrack?: CrystalTrack;
  private genreWaveTimer?: number;

  constructor() {
    this.centralSphere = new CentralSphere();
  }

  initialize(scene: THREE.Scene, crystalSystem: CrystalTrackSystem): void {
    this.scene = scene;
    this.crystalSystem = crystalSystem;
    
    // Инициализируем центральную сферу
    this.centralSphere.initialize(scene);
    
    // Настраиваем коллбэки для аудио событий
    this.setupAudioCallbacks();
    
    console.log('🌟 Central Sphere Integration initialized');
  }

  private setupAudioCallbacks(): void {
    if (!this.crystalSystem) return;

    const audioIntegration = this.crystalSystem.getAudioIntegration();
    
    // Коллбэк при начале воспроизведения трека
    audioIntegration.setOnTrackPlayStart(async (track: CrystalTrack, audioElement: HTMLAudioElement) => {
      await this.onTrackPlayStart(track, audioElement);
    });
    
    // Коллбэк при окончании воспроизведения
    audioIntegration.setOnTrackPlayEnd((track: CrystalTrack) => {
      this.onTrackPlayEnd(track);
    });
    
    // Коллбэк при ошибке аудио
    audioIntegration.setOnAudioError((track: CrystalTrack, error: Error) => {
      this.onAudioError(track, error);
    });
  }

  private async onTrackPlayStart(track: CrystalTrack, audioElement: HTMLAudioElement): Promise<void> {
    console.log(`🎵 Central Sphere: Track started - ${track.name}`);
    
    this.currentPlayingTrack = track;
    
    // Адаптируем центральную сферу к треку
    this.centralSphere.setCurrentTrack(track);
    
    // Подключаем аудио источник для анализа
    try {
      await this.centralSphere.connectAudioSource(audioElement);
      console.log(`✅ Audio source connected for ${track.name}`);
    } catch (error) {
      console.error(`❌ Failed to connect audio source for ${track.name}:`, error);
    }
    
    // Запускаем цветовые волны по жанру
    this.startGenreWaves(track);
    
    // Увеличиваем интенсивность сферы
    this.centralSphere.setIntensity(1.5);
  }

  private onTrackPlayEnd(track: CrystalTrack): void {
    console.log(`🎵 Central Sphere: Track ended - ${track.name}`);
    
    this.currentPlayingTrack = undefined;
    
    // Останавливаем цветовые волны
    this.stopGenreWaves();
    
    // Возвращаем базовую интенсивность
    this.centralSphere.setIntensity(1.0);
    
    // Возвращаем базовый цвет
    this.centralSphere.setCurrentTrack(undefined);
  }

  private onAudioError(track: CrystalTrack, error: Error): void {
    console.warn(`⚠️ Central Sphere: Audio error for ${track.name}:`, error);
    
    // Обрабатываем как окончание трека
    this.onTrackPlayEnd(track);
  }

  // Энергетические лучи убраны по запросу пользователя

  private startGenreWaves(track: CrystalTrack): void {
    // Создаем волны каждые 2 секунды
    this.genreWaveTimer = window.setInterval(() => {
      if (this.currentPlayingTrack) {
        const genreColor = new THREE.Color(track.color);
        this.centralSphere.createGenreWave(track.genre, genreColor);
      }
    }, 2000);
    
    // Создаем первую волну сразу
    const genreColor = new THREE.Color(track.color);
    this.centralSphere.createGenreWave(track.genre, genreColor);
  }

  private stopGenreWaves(): void {
    if (this.genreWaveTimer) {
      clearInterval(this.genreWaveTimer);
      this.genreWaveTimer = undefined;
    }
  }

  // Обновление системы
  update(deltaTime: number): void {
    this.centralSphere.update(deltaTime);
  }

  // Методы для внешнего управления
  getCentralSphere(): CentralSphere {
    return this.centralSphere;
  }

  getCurrentPlayingTrack(): CrystalTrack | undefined {
    return this.currentPlayingTrack;
  }

  // Ручное создание эффектов
  createManualGenreWave(genre: string, color: THREE.Color): void {
    this.centralSphere.createGenreWave(genre, color);
  }

  // Энергетические лучи убраны по запросу пользователя

  // Настройка размера и интенсивности
  setSphereSize(scale: number): void {
    this.centralSphere.setSize(scale);
  }

  setSphereIntensity(intensity: number): void {
    this.centralSphere.setIntensity(intensity);
  }

  // Очистка ресурсов
  dispose(): void {
    console.log('🗑️ Disposing Central Sphere Integration...');
    
    // Останавливаем таймеры
    this.stopGenreWaves();
    
    // Очищаем центральную сферу
    this.centralSphere.dispose();
    
    // Сбрасываем ссылки
    this.crystalSystem = undefined;
    this.scene = undefined;
    this.currentPlayingTrack = undefined;
    
    console.log('✅ Central Sphere Integration disposed');
  }
}