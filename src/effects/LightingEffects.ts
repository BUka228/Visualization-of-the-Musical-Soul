/**
 * LightingEffects - система световых эффектов и бликов
 * Управляет динамическим освещением, бликами и световыми эффектами для выбранных объектов
 */

import * as THREE from 'three';
import { TrackObject } from '../types';

export class LightingEffects {
  private scene?: THREE.Scene;
  private camera?: THREE.Camera;
  
  // Динамические источники света
  private selectionLight?: THREE.PointLight;
  private selectionLightHelper?: THREE.PointLightHelper;
  private ambientPulseLight?: THREE.AmbientLight;
  
  // Эффекты свечения
  private glowObjects: Map<TrackObject, THREE.Mesh> = new Map();
  private selectedTrack?: TrackObject;
  
  // Анимационные параметры
  private time: number = 0;
  private pulseSpeed: number = 2.0;
  private glowIntensity: number = 0.5;
  
  // Материалы для эффектов
  private glowMaterial?: THREE.MeshBasicMaterial;
  
  constructor() {
    console.log('💡 LightingEffects создан');
  }

  initialize(scene: THREE.Scene, camera: THREE.Camera): void {
    this.scene = scene;
    this.camera = camera;
    
    this.createDynamicLights();
    this.createGlowMaterials();
    
    console.log('💡 LightingEffects инициализирован');
  }

  /**
   * Создает динамические источники света
   */
  private createDynamicLights(): void {
    if (!this.scene) return;

    // Точечный свет для выбранного объекта
    this.selectionLight = new THREE.PointLight(0xffffff, 0, 50, 2);
    this.selectionLight.position.set(0, 0, 0);
    this.selectionLight.visible = false;
    this.scene.add(this.selectionLight);

    // Хелпер для отладки (можно включить при необходимости)
    // this.selectionLightHelper = new THREE.PointLightHelper(this.selectionLight, 1);
    // this.scene.add(this.selectionLightHelper);

    // Пульсирующий окружающий свет для музыкальных эффектов
    this.ambientPulseLight = new THREE.AmbientLight(0x404040, 0);
    this.scene.add(this.ambientPulseLight);

    console.log('💡 Динамические источники света созданы');
  }

  /**
   * Создает материалы для эффектов свечения
   */
  private createGlowMaterials(): void {
    // Материал для эффекта свечения
    this.glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    });

    console.log('💡 Материалы для свечения созданы');
  }

  /**
   * Активирует световые эффекты для выбранного объекта
   */
  activateSelectionEffects(trackObject: TrackObject): void {
    if (!this.scene || !this.selectionLight) return;

    this.selectedTrack = trackObject;

    // Позиционируем точечный свет рядом с объектом
    this.selectionLight.position.copy(trackObject.position);
    this.selectionLight.position.y += 5; // Немного выше объекта
    
    // Настраиваем цвет света в зависимости от жанра трека
    const trackColor = new THREE.Color(trackObject.trackData.color);
    this.selectionLight.color.copy(trackColor);
    this.selectionLight.intensity = 2.0;
    this.selectionLight.visible = true;

    // Создаем эффект свечения вокруг объекта
    this.createGlowEffect(trackObject);

    console.log(`💡 Активированы световые эффекты для трека: ${trackObject.trackData.name}`);
  }

  /**
   * Деактивирует световые эффекты
   */
  deactivateSelectionEffects(): void {
    if (!this.selectionLight) return;

    this.selectionLight.visible = false;
    this.selectionLight.intensity = 0;

    // Удаляем эффекты свечения
    if (this.selectedTrack) {
      this.removeGlowEffect(this.selectedTrack);
    }

    this.selectedTrack = undefined;

    console.log('💡 Световые эффекты деактивированы');
  }

  /**
   * Создает эффект свечения вокруг объекта
   */
  private createGlowEffect(trackObject: TrackObject): void {
    if (!this.scene || !this.glowMaterial) return;

    // Удаляем существующий эффект свечения, если есть
    this.removeGlowEffect(trackObject);

    // Создаем геометрию для свечения (немного больше оригинального объекта)
    const originalGeometry = trackObject.geometry;
    let glowGeometry: THREE.BufferGeometry;

    if (originalGeometry instanceof THREE.IcosahedronGeometry) {
      glowGeometry = new THREE.IcosahedronGeometry(
        originalGeometry.parameters.radius * 1.2,
        originalGeometry.parameters.detail
      );
    } else if (originalGeometry instanceof THREE.SphereGeometry) {
      glowGeometry = new THREE.SphereGeometry(
        originalGeometry.parameters.radius * 1.2,
        originalGeometry.parameters.widthSegments,
        originalGeometry.parameters.heightSegments
      );
    } else {
      // Fallback для других геометрий
      glowGeometry = new THREE.SphereGeometry(trackObject.trackData.size * 1.2, 16, 16);
    }

    // Создаем материал свечения с цветом трека
    const glowMaterial = this.glowMaterial.clone();
    glowMaterial.color.setHex(parseInt(trackObject.trackData.color.replace('#', '0x')));

    // Создаем меш для свечения
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.copy(trackObject.position);
    glowMesh.rotation.copy(trackObject.rotation);
    glowMesh.scale.copy(trackObject.scale);

    // Добавляем в сцену и сохраняем ссылку
    this.scene.add(glowMesh);
    this.glowObjects.set(trackObject, glowMesh);

    console.log(`✨ Создан эффект свечения для трека: ${trackObject.trackData.name}`);
  }

  /**
   * Удаляет эффект свечения для объекта
   */
  private removeGlowEffect(trackObject: TrackObject): void {
    const glowMesh = this.glowObjects.get(trackObject);
    if (glowMesh && this.scene) {
      this.scene.remove(glowMesh);
      glowMesh.geometry.dispose();
      if (glowMesh.material instanceof THREE.Material) {
        glowMesh.material.dispose();
      }
      this.glowObjects.delete(trackObject);
    }
  }

  /**
   * Создает эффект пульсации света в ритм музыки
   */
  startMusicPulse(audioManager: any): void {
    if (!this.ambientPulseLight) return;

    // Базовая интенсивность пульсации
    const basePulse = () => {
      const intensity = 0.1 + Math.sin(this.time * this.pulseSpeed) * 0.05;
      this.ambientPulseLight!.intensity = intensity;
      
      // Изменяем цвет в зависимости от времени
      const hue = (this.time * 0.1) % 1;
      this.ambientPulseLight!.color.setHSL(hue, 0.3, 0.5);
    };

    // Если есть аудио менеджер, можно синхронизировать с музыкой
    if (audioManager && audioManager.isPlaying()) {
      const progress = audioManager.getProgress() / 100;
      const musicIntensity = 0.2 + Math.sin(progress * Math.PI * 8) * 0.1;
      this.ambientPulseLight.intensity = musicIntensity;
    } else {
      basePulse();
    }
  }

  /**
   * Останавливает пульсацию света
   */
  stopMusicPulse(): void {
    if (this.ambientPulseLight) {
      this.ambientPulseLight.intensity = 0;
    }
  }

  /**
   * Создает эффект вспышки
   */
  createFlashEffect(position: THREE.Vector3, color: THREE.Color, intensity: number = 5.0): void {
    if (!this.scene) return;

    // Создаем временный источник света для вспышки
    const flashLight = new THREE.PointLight(color, intensity, 30, 2);
    flashLight.position.copy(position);
    this.scene.add(flashLight);

    // Анимация затухания вспышки
    let flashTime = 0;
    const flashDuration = 500; // 0.5 секунды

    const animateFlash = () => {
      flashTime += 16;
      const progress = flashTime / flashDuration;

      if (progress >= 1) {
        // Удаляем вспышку после завершения
        this.scene?.remove(flashLight);
        return;
      }

      // Экспоненциальное затухание
      const fadeProgress = 1 - Math.pow(progress, 2);
      flashLight.intensity = intensity * fadeProgress;

      requestAnimationFrame(animateFlash);
    };

    animateFlash();
  }

  /**
   * Создает эффект ауры вокруг группы объектов
   */
  createAuraEffect(objects: TrackObject[], color: THREE.Color): void {
    if (!this.scene || objects.length === 0) return;

    // Вычисляем центр группы объектов
    const center = new THREE.Vector3();
    objects.forEach(obj => center.add(obj.position));
    center.divideScalar(objects.length);

    // Создаем большую сферу ауры
    const auraGeometry = new THREE.SphereGeometry(15, 32, 32);
    const auraMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const auraMesh = new THREE.Mesh(auraGeometry, auraMaterial);
    auraMesh.position.copy(center);
    this.scene.add(auraMesh);

    // Анимация пульсации ауры
    let auraTime = 0;
    const auraDuration = 3000; // 3 секунды

    const animateAura = () => {
      auraTime += 16;
      const progress = auraTime / auraDuration;

      if (progress >= 1) {
        // Удаляем ауру после завершения
        this.scene?.remove(auraMesh);
        auraGeometry.dispose();
        auraMaterial.dispose();
        return;
      }

      // Пульсация размера и прозрачности
      const scale = 1 + Math.sin(progress * Math.PI * 4) * 0.2;
      const opacity = 0.1 * (1 - progress) * (1 + Math.sin(progress * Math.PI * 8) * 0.5);
      
      auraMesh.scale.setScalar(scale);
      auraMaterial.opacity = opacity;
      auraMesh.rotation.y += 0.01;

      requestAnimationFrame(animateAura);
    };

    animateAura();
  }

  /**
   * Обновляет световые эффекты
   */
  update(deltaTime: number, audioManager?: any): void {
    this.time += deltaTime * 0.001; // Конвертируем в секунды

    this.updateSelectionLight();
    this.updateGlowEffects();
    
    // Обновляем пульсацию в ритм музыки, если есть выбранный трек
    if (this.selectedTrack && audioManager) {
      this.startMusicPulse(audioManager);
    }
  }

  /**
   * Обновляет свет выбранного объекта
   */
  private updateSelectionLight(): void {
    if (!this.selectionLight || !this.selectedTrack) return;

    // Следуем за выбранным объектом
    this.selectionLight.position.copy(this.selectedTrack.position);
    this.selectionLight.position.y += 5;

    // Пульсация интенсивности
    const pulseFactor = 1 + Math.sin(this.time * this.pulseSpeed) * 0.3;
    this.selectionLight.intensity = 2.0 * pulseFactor;

    // Небольшое движение света по кругу
    const radius = 3;
    const angle = this.time * 0.5;
    this.selectionLight.position.x += Math.cos(angle) * radius;
    this.selectionLight.position.z += Math.sin(angle) * radius;
  }

  /**
   * Обновляет эффекты свечения
   */
  private updateGlowEffects(): void {
    this.glowObjects.forEach((glowMesh, trackObject) => {
      // Синхронизируем позицию и поворот с оригинальным объектом
      glowMesh.position.copy(trackObject.position);
      glowMesh.rotation.copy(trackObject.rotation);
      
      // Пульсация размера свечения
      const pulseFactor = 1 + Math.sin(this.time * this.pulseSpeed * 1.5) * 0.1;
      glowMesh.scale.setScalar(pulseFactor);
      
      // Пульсация прозрачности
      const material = glowMesh.material as THREE.MeshBasicMaterial;
      if (material) {
        material.opacity = this.glowIntensity * (0.8 + Math.sin(this.time * this.pulseSpeed * 2) * 0.2);
      }
    });
  }

  /**
   * Настройка параметров эффектов
   */
  setPulseSpeed(speed: number): void {
    this.pulseSpeed = speed;
  }

  setGlowIntensity(intensity: number): void {
    this.glowIntensity = Math.max(0, Math.min(1, intensity));
  }

  /**
   * Получает количество активных эффектов свечения
   */
  getActiveGlowCount(): number {
    return this.glowObjects.size;
  }

  /**
   * Проверяет, активны ли световые эффекты для выбранного объекта
   */
  isSelectionEffectsActive(): boolean {
    return this.selectedTrack !== undefined && this.selectionLight?.visible === true;
  }

  /**
   * Освобождение ресурсов
   */
  dispose(): void {
    console.log('💡 Освобождение ресурсов LightingEffects...');

    // Удаляем динамические источники света
    if (this.selectionLight && this.scene) {
      this.scene.remove(this.selectionLight);
    }
    if (this.selectionLightHelper && this.scene) {
      this.scene.remove(this.selectionLightHelper);
    }
    if (this.ambientPulseLight && this.scene) {
      this.scene.remove(this.ambientPulseLight);
    }

    // Удаляем все эффекты свечения
    this.glowObjects.forEach((glowMesh, trackObject) => {
      this.removeGlowEffect(trackObject);
    });
    this.glowObjects.clear();

    // Освобождаем материалы
    if (this.glowMaterial) {
      this.glowMaterial.dispose();
    }

    // Сброс ссылок
    this.scene = undefined;
    this.camera = undefined;
    this.selectedTrack = undefined;

    console.log('✅ Ресурсы LightingEffects освобождены');
  }
}