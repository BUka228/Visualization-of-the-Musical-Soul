/**
 * LightingEffects - система световых эффектов и бликов
 * Управляет динамическим освещением, бликами и световыми эффектами для выбранных объектов
 */

import * as THREE from 'three';
// TrackObject import removed - Soul Galaxy handles its own lighting effects

export class LightingEffects {
  private scene?: THREE.Scene;
  private camera?: THREE.Camera;
  
  // Динамические источники света
  private selectionLight?: THREE.PointLight;
  private selectionLightHelper?: THREE.PointLightHelper;
  private ambientPulseLight?: THREE.AmbientLight;
  
  // Эффекты свечения
  private glowObjects: Map<string, THREE.Mesh> = new Map();
  private selectedTrackId?: string;
  
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
  activateSelectionEffects(trackId: string): void {
    if (!this.scene || !this.selectionLight) return;

    this.selectedTrackId = trackId;

    // Soul Galaxy renderer handles its own lighting effects
    // Classic track object lighting effects are no longer needed

    console.log(`💡 Активированы световые эффекты для трека: ${trackId}`);
  }

  /**
   * Деактивирует световые эффекты
   */
  deactivateSelectionEffects(): void {
    if (!this.selectionLight) return;

    this.selectionLight.visible = false;
    this.selectionLight.intensity = 0;

    // Soul Galaxy renderer handles its own lighting effects
    // Classic track object lighting effects are no longer needed

    this.selectedTrackId = undefined;

    console.log('💡 Световые эффекты деактивированы');
  }

  // Classic track object glow effects removed - Soul Galaxy handles its own lighting effects

  /**
   * Удаляет эффект свечения для объекта
   */
  private removeGlowEffect(trackId: string): void {
    const glowMesh = this.glowObjects.get(trackId);
    if (glowMesh && this.scene) {
      this.scene.remove(glowMesh);
      glowMesh.geometry.dispose();
      if (glowMesh.material instanceof THREE.Material) {
        glowMesh.material.dispose();
      }
      this.glowObjects.delete(trackId);
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
  createAuraEffect(trackIds: string[], color: THREE.Color): void {
    if (!this.scene || trackIds.length === 0) return;

    // Soul Galaxy renderer handles its own aura effects
    // Classic track object aura effects are no longer needed
    
    console.log(`🌟 Создана аура для ${trackIds.length} треков`);

    // Soul Galaxy renderer handles its own aura effects
    // Classic track object aura effects are no longer needed

    // Soul Galaxy renderer handles its own aura animations
    // Classic track object aura animations are no longer needed
  }

  /**
   * Обновляет световые эффекты
   */
  update(deltaTime: number, audioManager?: any): void {
    this.time += deltaTime * 0.001; // Конвертируем в секунды

    this.updateSelectionLight();
    this.updateGlowEffects();
    
    // Обновляем пульсацию в ритм музыки, если есть выбранный трек
    if (this.selectedTrackId && audioManager) {
      this.startMusicPulse(audioManager);
    }
  }

  /**
   * Обновляет свет выбранного объекта
   */
  private updateSelectionLight(): void {
    if (!this.selectionLight || !this.selectedTrackId) return;

    // Soul Galaxy renderer handles its own lighting effects
    // Classic track object lighting effects are no longer needed
  }

  /**
   * Обновляет эффекты свечения
   */
  private updateGlowEffects(): void {
    // Soul Galaxy renderer handles its own glow effects
    // Classic track object glow effects are no longer needed
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
    return this.selectedTrackId !== undefined && this.selectionLight?.visible === true;
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
    this.glowObjects.forEach((glowMesh, trackId) => {
      this.removeGlowEffect(trackId);
    });
    this.glowObjects.clear();

    // Освобождаем материалы
    if (this.glowMaterial) {
      this.glowMaterial.dispose();
    }

    // Сброс ссылок
    this.scene = undefined;
    this.camera = undefined;
    this.selectedTrackId = undefined;

    console.log('✅ Ресурсы LightingEffects освобождены');
  }
}