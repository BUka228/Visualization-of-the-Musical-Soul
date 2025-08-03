/**
 * EffectsManager - координатор всех визуальных эффектов
 * Управляет частицами, освещением и другими эффектами
 */

import * as THREE from 'three';
import { TrackObject, AudioManager } from '../types';
import { ParticleSystem } from './ParticleSystem';
import { LightingEffects } from './LightingEffects';

export class EffectsManager {
  private scene?: THREE.Scene;
  private camera?: THREE.Camera;
  private audioManager?: AudioManager;
  
  // Системы эффектов
  private particleSystem: ParticleSystem;
  private lightingEffects: LightingEffects;
  
  // Состояние
  private selectedTrack?: TrackObject;
  private isInitialized: boolean = false;
  private effectsEnabled: boolean = true;
  
  // Параметры пульсации в ритм музыки
  private musicPulseEnabled: boolean = true;
  private lastAudioTime: number = 0;
  private pulseObjects: Set<TrackObject> = new Set();

  constructor() {
    this.particleSystem = new ParticleSystem();
    this.lightingEffects = new LightingEffects();
    
    console.log('🎭 EffectsManager создан');
  }

  /**
   * Инициализация менеджера эффектов
   */
  initialize(scene: THREE.Scene, camera: THREE.Camera, audioManager?: AudioManager): void {
    this.scene = scene;
    this.camera = camera;
    this.audioManager = audioManager;
    
    // Инициализируем системы эффектов
    this.particleSystem.initialize(scene, camera);
    this.lightingEffects.initialize(scene, camera);
    
    this.isInitialized = true;
    
    console.log('🎭 EffectsManager инициализирован');
  }

  /**
   * Активирует все эффекты для выбранного объекта
   */
  activateSelectionEffects(trackObject: TrackObject): void {
    if (!this.isInitialized || !this.effectsEnabled) return;

    this.selectedTrack = trackObject;

    // Активируем частицы вокруг объекта
    this.particleSystem.activateSelectionParticles(trackObject);
    
    // Активируем световые эффекты
    this.lightingEffects.activateSelectionEffects(trackObject);
    
    // Добавляем объект в список для пульсации
    this.pulseObjects.add(trackObject);
    
    // Создаем эффект вспышки при выборе
    const trackColor = new THREE.Color(trackObject.trackData.color);
    this.lightingEffects.createFlashEffect(trackObject.position, trackColor, 3.0);
    
    console.log(`🎭 Активированы эффекты для трека: ${trackObject.trackData.name}`);
  }

  /**
   * Деактивирует эффекты выбора
   */
  deactivateSelectionEffects(): void {
    if (!this.isInitialized) return;

    // Деактивируем частицы
    this.particleSystem.deactivateSelectionParticles();
    
    // Деактивируем световые эффекты
    this.lightingEffects.deactivateSelectionEffects();
    
    // Убираем объект из списка пульсации
    if (this.selectedTrack) {
      this.pulseObjects.delete(this.selectedTrack);
    }
    
    this.selectedTrack = undefined;
    
    console.log('🎭 Эффекты выбора деактивированы');
  }

  /**
   * Создает эффект взрыва при смене трека
   */
  createTrackChangeExplosion(position: THREE.Vector3, color: string): void {
    if (!this.isInitialized || !this.effectsEnabled) return;

    const explosionColor = new THREE.Color(color);
    this.particleSystem.createExplosionEffect(position, explosionColor);
    this.lightingEffects.createFlashEffect(position, explosionColor, 5.0);
  }

  /**
   * Создает эффект ауры для группы треков одного жанра
   */
  createGenreAura(tracks: TrackObject[], genreColor: string): void {
    if (!this.isInitialized || !this.effectsEnabled || tracks.length === 0) return;

    const auraColor = new THREE.Color(genreColor);
    this.lightingEffects.createAuraEffect(tracks, auraColor);
  }

  /**
   * Обновляет пульсацию объектов в ритм музыки
   */
  private updateMusicPulse(): void {
    if (!this.musicPulseEnabled || !this.audioManager || this.pulseObjects.size === 0) return;

    const isPlaying = this.audioManager.isPlaying();
    const currentTime = this.audioManager.getCurrentTime();
    
    if (isPlaying && currentTime !== this.lastAudioTime) {
      // Вычисляем интенсивность пульсации на основе прогресса трека
      const progress = this.audioManager.getProgress() / 100;
      const pulseIntensity = 0.1 + Math.sin(progress * Math.PI * 16) * 0.05;
      
      // Применяем пульсацию к объектам
      this.pulseObjects.forEach(trackObject => {
        if (trackObject.trackData) {
          // Пульсация размера
          const basePulse = 1 + Math.sin(Date.now() * 0.005) * pulseIntensity;
          trackObject.scale.setScalar(basePulse);
          
          // Пульсация свечения материала
          const material = trackObject.material as THREE.MeshStandardMaterial;
          if (material) {
            material.emissiveIntensity = 0.1 + pulseIntensity;
          }
        }
      });
      
      this.lastAudioTime = currentTime;
    } else if (!isPlaying) {
      // Возвращаем объекты к нормальному размеру когда музыка не играет
      this.pulseObjects.forEach(trackObject => {
        trackObject.scale.setScalar(1);
        const material = trackObject.material as THREE.MeshStandardMaterial;
        if (material) {
          material.emissiveIntensity = 0.1;
        }
      });
    }
  }

  /**
   * Создает эффект появления трека
   */
  createTrackAppearanceEffect(trackObject: TrackObject): void {
    if (!this.isInitialized || !this.effectsEnabled) return;

    // Эффект появления с частицами
    const trackColor = new THREE.Color(trackObject.trackData.color);
    this.particleSystem.createExplosionEffect(trackObject.position, trackColor);
    
    // Световая вспышка
    this.lightingEffects.createFlashEffect(trackObject.position, trackColor, 2.0);
    
    console.log(`✨ Создан эффект появления для трека: ${trackObject.trackData.name}`);
  }

  /**
   * Создает эффект исчезновения трека
   */
  createTrackDisappearanceEffect(trackObject: TrackObject): void {
    if (!this.isInitialized || !this.effectsEnabled) return;

    // Эффект исчезновения
    const trackColor = new THREE.Color(trackObject.trackData.color);
    
    // Создаем обратный эффект взрыва (частицы стягиваются к центру)
    this.createImplodeEffect(trackObject.position, trackColor);
  }

  /**
   * Создает эффект имплозии (обратный взрыв)
   */
  private createImplodeEffect(position: THREE.Vector3, color: THREE.Color): void {
    if (!this.scene) return;

    const particleCount = 30;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Создаем частицы вокруг позиции
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Начальные позиции - вокруг центра
      const radius = 5 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3] = position.x + radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = position.y + radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = position.z + radius * Math.cos(phi);
      
      // Скорости направлены к центру
      const direction = new THREE.Vector3(
        position.x - positions[i3],
        position.y - positions[i3 + 1],
        position.z - positions[i3 + 2]
      ).normalize();
      
      const speed = 0.05 + Math.random() * 0.05;
      velocities[i3] = direction.x * speed;
      velocities[i3 + 1] = direction.y * speed;
      velocities[i3 + 2] = direction.z * speed;
      
      // Цвет частиц
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2.0,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const implodeParticles = new THREE.Points(geometry, material);
    this.scene.add(implodeParticles);

    // Анимация имплозии
    let implodeTime = 0;
    const implodeDuration = 1500; // 1.5 секунды

    const animateImplode = () => {
      implodeTime += 16;
      const progress = implodeTime / implodeDuration;

      if (progress >= 1) {
        // Удаляем эффект после завершения
        this.scene?.remove(implodeParticles);
        geometry.dispose();
        material.dispose();
        return;
      }

      // Обновляем позиции частиц
      const positions = geometry.attributes.position as THREE.BufferAttribute;
      const velocities = geometry.attributes.velocity as THREE.BufferAttribute;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        positions.setX(i, positions.getX(i) + velocities.getX(i));
        positions.setY(i, positions.getY(i) + velocities.getY(i));
        positions.setZ(i, positions.getZ(i) + velocities.getZ(i));
        
        // Ускорение к центру
        velocities.setX(i, velocities.getX(i) * 1.02);
        velocities.setY(i, velocities.getY(i) * 1.02);
        velocities.setZ(i, velocities.getZ(i) * 1.02);
      }

      positions.needsUpdate = true;
      
      // Усиление прозрачности к концу
      material.opacity = 1 - progress * 0.5;

      requestAnimationFrame(animateImplode);
    };

    animateImplode();
  }

  /**
   * Обновляет все эффекты
   */
  update(deltaTime: number): void {
    if (!this.isInitialized || !this.effectsEnabled) return;

    // Обновляем системы эффектов
    this.particleSystem.update(deltaTime);
    this.lightingEffects.update(deltaTime, this.audioManager);
    
    // Обновляем пульсацию в ритм музыки
    this.updateMusicPulse();
  }

  /**
   * Включает/выключает эффекты
   */
  setEffectsEnabled(enabled: boolean): void {
    this.effectsEnabled = enabled;
    
    if (!enabled) {
      // Деактивируем все активные эффекты
      this.deactivateSelectionEffects();
      this.pulseObjects.clear();
    }
    
    console.log(`🎭 Эффекты ${enabled ? 'включены' : 'выключены'}`);
  }

  /**
   * Включает/выключает пульсацию в ритм музыки
   */
  setMusicPulseEnabled(enabled: boolean): void {
    this.musicPulseEnabled = enabled;
    
    if (!enabled) {
      // Возвращаем объекты к нормальному размеру
      this.pulseObjects.forEach(trackObject => {
        trackObject.scale.setScalar(1);
        const material = trackObject.material as THREE.MeshStandardMaterial;
        if (material) {
          material.emissiveIntensity = 0.1;
        }
      });
    }
    
    console.log(`🎵 Пульсация в ритм музыки ${enabled ? 'включена' : 'выключена'}`);
  }

  /**
   * Настройка параметров эффектов
   */
  setParticleSystemSettings(starCount?: number, selectionParticleCount?: number): void {
    // Эти настройки можно добавить в ParticleSystem при необходимости
    console.log('🎭 Настройки системы частиц обновлены');
  }

  setLightingSettings(pulseSpeed?: number, glowIntensity?: number): void {
    if (pulseSpeed !== undefined) {
      this.lightingEffects.setPulseSpeed(pulseSpeed);
    }
    if (glowIntensity !== undefined) {
      this.lightingEffects.setGlowIntensity(glowIntensity);
    }
    console.log('💡 Настройки освещения обновлены');
  }

  /**
   * Получение статистики эффектов
   */
  getEffectsStats(): {
    starCount: number;
    selectionParticleCount: number;
    activeGlowCount: number;
    pulseObjectsCount: number;
    isSelectionActive: boolean;
    isMusicPulseEnabled: boolean;
  } {
    return {
      starCount: this.particleSystem.getStarCount(),
      selectionParticleCount: this.particleSystem.getSelectionParticleCount(),
      activeGlowCount: this.lightingEffects.getActiveGlowCount(),
      pulseObjectsCount: this.pulseObjects.size,
      isSelectionActive: this.particleSystem.isSelectionParticlesActive(),
      isMusicPulseEnabled: this.musicPulseEnabled
    };
  }

  /**
   * Проверяет, инициализирован ли менеджер
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Проверяет, включены ли эффекты
   */
  areEffectsEnabled(): boolean {
    return this.effectsEnabled;
  }

  /**
   * Освобождение ресурсов
   */
  dispose(): void {
    console.log('🎭 Освобождение ресурсов EffectsManager...');

    // Освобождаем системы эффектов
    this.particleSystem.dispose();
    this.lightingEffects.dispose();

    // Очищаем состояние
    this.pulseObjects.clear();
    this.selectedTrack = undefined;
    this.scene = undefined;
    this.camera = undefined;
    this.audioManager = undefined;
    this.isInitialized = false;

    console.log('✅ Ресурсы EffectsManager освобождены');
  }
}