import * as THREE from 'three';
import { CrystalTrack } from '../types';
import { CrystalShaderMaterial } from '../materials/CrystalShaderMaterial';
import { MinimalistHUD } from '../ui/MinimalistHUD';

/**
 * Система подсветки кристаллов при наведении
 * Создает эффект вспыхивания кристалла с оптимизированным raycasting
 */
export class CrystalHoverSystem {
  private scene?: THREE.Scene;
  private camera?: THREE.Camera;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private crystalTracks: CrystalTrack[] = [];
  private crystalMeshes: THREE.Mesh[] = [];
  private hoveredCrystal?: CrystalTrack;
  private initialized: boolean = false;
  private hud?: MinimalistHUD;

  // Настройки подсветки
  private static readonly HOVER_CONFIG = {
    glowIntensity: 1.5,           // Усиление яркости при наведении
    transitionDuration: 200,      // Длительность перехода в мс
    pulseAmplification: 1.3,      // Усиление пульсации при наведении
    emissiveBoost: 0.8,          // Дополнительное свечение
    scaleBoost: 1.1              // Увеличение размера при наведении
  };

  // Оптимизация raycasting
  private static readonly RAYCAST_CONFIG = {
    maxDistance: 1000,           // Максимальная дистанция для raycasting
    updateFrequency: 60,         // Частота обновления (FPS)
    batchSize: 50,              // Размер батча для проверки пересечений
    frustumCulling: true        // Включить frustum culling для оптимизации
  };

  // Состояние для оптимизации
  private lastUpdateTime: number = 0;
  private updateInterval: number = 1000 / CrystalHoverSystem.RAYCAST_CONFIG.updateFrequency;
  private visibleCrystals: THREE.Mesh[] = [];
  private frustum: THREE.Frustum = new THREE.Frustum();

  // Коллбэки для событий
  private onCrystalHovered?: (crystal: CrystalTrack) => void;
  private onCrystalUnhovered?: (crystal: CrystalTrack) => void;

  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Настройка raycaster для оптимизации
    this.raycaster.far = CrystalHoverSystem.RAYCAST_CONFIG.maxDistance;
    
    console.log('🎯 Crystal Hover System created');
  }

  /**
   * Инициализация системы подсветки
   */
  initialize(scene: THREE.Scene, camera: THREE.Camera, container?: HTMLElement): void {
    console.log('🎯 Initializing Crystal Hover System...');
    
    this.scene = scene;
    this.camera = camera;
    this.initialized = true;
    
    // Инициализируем HUD если передан контейнер
    if (container) {
      this.hud = new MinimalistHUD(container);
      this.hud.initialize();
      console.log('🎨 Minimalist HUD integrated with hover system');
    }
    
    console.log('✅ Crystal Hover System initialized');
  }

  /**
   * Устанавливает кристаллы для отслеживания наведения
   */
  setCrystalTracks(crystalTracks: CrystalTrack[], crystalCluster: THREE.Group): void {
    if (!this.initialized) {
      console.warn('⚠️ Crystal Hover System not initialized');
      return;
    }

    console.log(`🎯 Setting up hover tracking for ${crystalTracks.length} crystals...`);
    
    this.crystalTracks = crystalTracks;
    this.crystalMeshes = [];
    
    // Собираем все mesh объекты кристаллов
    crystalCluster.children.forEach(child => {
      if (child instanceof THREE.Mesh && child.userData.isCrystal) {
        this.crystalMeshes.push(child);
      }
    });
    
    console.log(`✅ Hover tracking set up for ${this.crystalMeshes.length} crystal meshes`);
    this.logHoverSystemStats();
  }

  /**
   * Обновляет позицию мыши и проверяет пересечения
   */
  updateMousePosition(mouseX: number, mouseY: number): void {
    if (!this.initialized) return;
    
    // Не обрабатываем события мыши во время анимации фокуса камеры
    if (this.isCameraFocusAnimating()) {
      return;
    }
    
    this.mouse.set(mouseX, mouseY);
    
    // Оптимизированное обновление с ограничением частоты
    const currentTime = performance.now();
    if (currentTime - this.lastUpdateTime < this.updateInterval) {
      return;
    }
    
    this.lastUpdateTime = currentTime;
    this.checkHoverIntersections();
  }

  /**
   * Проверяет пересечения с кристаллами (оптимизированная версия)
   */
  private checkHoverIntersections(): void {
    if (!this.scene || !this.camera || this.crystalMeshes.length === 0) {
      return;
    }

    // Не обрабатываем hover во время анимации фокуса камеры
    if (this.isCameraFocusAnimating()) {
      return;
    }

    // Обновляем raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Оптимизация: используем frustum culling для отсечения невидимых объектов
    if (CrystalHoverSystem.RAYCAST_CONFIG.frustumCulling) {
      this.updateVisibleCrystals();
    } else {
      this.visibleCrystals = this.crystalMeshes;
    }
    
    // Проверяем пересечения только с видимыми кристаллами
    const intersects = this.raycaster.intersectObjects(this.visibleCrystals, false);
    
    if (intersects.length > 0) {
      const intersectedMesh = intersects[0].object as THREE.Mesh;
      const trackId = intersectedMesh.userData.trackId;
      
      // Находим соответствующий CrystalTrack
      const crystalTrack = this.crystalTracks.find(ct => ct.id === trackId);
      
      if (crystalTrack && crystalTrack !== this.hoveredCrystal) {
        this.hoverCrystal(crystalTrack, intersectedMesh);
      }
    } else {
      // Нет пересечений - убираем подсветку
      if (this.hoveredCrystal) {
        this.unhoverCrystal();
      }
    }
  }

  /**
   * Обновляет список видимых кристаллов для оптимизации
   */
  private updateVisibleCrystals(): void {
    if (!this.camera) return;
    
    // Обновляем frustum камеры
    const matrix = new THREE.Matrix4().multiplyMatrices(
      (this.camera as THREE.PerspectiveCamera).projectionMatrix,
      (this.camera as THREE.PerspectiveCamera).matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(matrix);
    
    // Фильтруем видимые кристаллы
    this.visibleCrystals = this.crystalMeshes.filter(mesh => {
      // Простая проверка видимости по bounding sphere
      const sphere = new THREE.Sphere();
      mesh.geometry.computeBoundingSphere();
      if (mesh.geometry.boundingSphere) {
        sphere.copy(mesh.geometry.boundingSphere);
        sphere.applyMatrix4(mesh.matrixWorld);
        return this.frustum.intersectsSphere(sphere);
      }
      return true;
    });
  }

  /**
   * Применяет эффект подсветки к кристаллу
   */
  private hoverCrystal(crystalTrack: CrystalTrack, mesh: THREE.Mesh): void {
    // Убираем подсветку с предыдущего кристалла
    if (this.hoveredCrystal) {
      this.unhoverCrystal();
    }
    
    console.log(`✨ Hovering crystal: ${crystalTrack.name} by ${crystalTrack.artist}`);
    
    this.hoveredCrystal = crystalTrack;
    crystalTrack.isHovered = true;
    
    // Применяем эффекты подсветки к материалу
    if (mesh.material instanceof CrystalShaderMaterial) {
      this.applyHoverEffects(mesh.material);
    }
    
    // Анимируем переход подсветки
    this.animateHoverTransition(mesh, true);
    
    // Показываем информацию в HUD
    if (this.hud) {
      this.hud.showTrackInfo(crystalTrack);
    }
    
    // Вызываем коллбэк
    if (this.onCrystalHovered) {
      this.onCrystalHovered(crystalTrack);
    }
  }

  /**
   * Убирает эффект подсветки с кристалла
   */
  private unhoverCrystal(): void {
    if (!this.hoveredCrystal) return;
    
    console.log(`💫 Unhovering crystal: ${this.hoveredCrystal.name}`);
    
    // Находим mesh кристалла
    const mesh = this.findCrystalMesh(this.hoveredCrystal.id);
    
    if (mesh) {
      // Убираем эффекты подсветки
      if (mesh.material instanceof CrystalShaderMaterial) {
        this.removeHoverEffects(mesh.material);
      }
      
      // Анимируем переход
      this.animateHoverTransition(mesh, false);
    }
    
    // Скрываем информацию в HUD
    if (this.hud) {
      this.hud.hideTrackInfo();
    }
    
    // Вызываем коллбэк
    if (this.onCrystalUnhovered) {
      this.onCrystalUnhovered(this.hoveredCrystal);
    }
    
    this.hoveredCrystal.isHovered = false;
    this.hoveredCrystal = undefined;
  }

  /**
   * Применяет эффекты подсветки к материалу кристалла
   */
  private applyHoverEffects(material: CrystalShaderMaterial): void {
    // Устанавливаем состояние наведения в шейдере
    material.setHovered(true);
    
    // Усиливаем свечение
    const currentIntensity = material.uniforms.emissiveIntensity.value;
    const boostedIntensity = currentIntensity * CrystalHoverSystem.HOVER_CONFIG.glowIntensity;
    material.setEmissiveIntensity(boostedIntensity + CrystalHoverSystem.HOVER_CONFIG.emissiveBoost);
    
    // Усиливаем пульсацию
    const currentAmplitude = material.uniforms.pulseAmplitude.value;
    const boostedAmplitude = currentAmplitude * CrystalHoverSystem.HOVER_CONFIG.pulseAmplification;
    material.uniforms.pulseAmplitude.value = Math.min(boostedAmplitude, 1.0); // Ограничиваем максимум
  }

  /**
   * Убирает эффекты подсветки с материала кристалла
   */
  private removeHoverEffects(material: CrystalShaderMaterial): void {
    // Убираем состояние наведения в шейдере
    material.setHovered(false);
    
    // Возвращаем нормальную интенсивность свечения
    const boostedIntensity = material.uniforms.emissiveIntensity.value;
    const normalIntensity = (boostedIntensity - CrystalHoverSystem.HOVER_CONFIG.emissiveBoost) / 
                           CrystalHoverSystem.HOVER_CONFIG.glowIntensity;
    material.setEmissiveIntensity(Math.max(normalIntensity, 0.1)); // Минимальное свечение
    
    // Возвращаем нормальную пульсацию
    const boostedAmplitude = material.uniforms.pulseAmplitude.value;
    const normalAmplitude = boostedAmplitude / CrystalHoverSystem.HOVER_CONFIG.pulseAmplification;
    material.uniforms.pulseAmplitude.value = Math.max(normalAmplitude, 0.05); // Минимальная пульсация
  }

  /**
   * Анимирует плавный переход подсветки
   */
  private animateHoverTransition(mesh: THREE.Mesh, isHovering: boolean): void {
    const targetScale = isHovering ? CrystalHoverSystem.HOVER_CONFIG.scaleBoost : 1.0;
    const duration = CrystalHoverSystem.HOVER_CONFIG.transitionDuration;
    
    // Создаем плавную анимацию масштаба
    const startScale = mesh.scale.x;
    const startTime = performance.now();
    
    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      
      // Используем easing функцию для плавности
      const easedProgress = this.easeOutCubic(progress);
      const currentScale = startScale + (targetScale - startScale) * easedProgress;
      
      mesh.scale.setScalar(currentScale);
      
      if (progress < 1.0) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  /**
   * Easing функция для плавных переходов
   */
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Находит mesh кристалла по ID трека
   */
  private findCrystalMesh(trackId: string): THREE.Mesh | undefined {
    return this.crystalMeshes.find(mesh => mesh.userData.trackId === trackId);
  }

  /**
   * Получает текущий наведенный кристалл
   */
  getHoveredCrystal(): CrystalTrack | undefined {
    return this.hoveredCrystal;
  }

  /**
   * Устанавливает коллбэк для события наведения на кристалл
   */
  setOnCrystalHovered(callback: (crystal: CrystalTrack) => void): void {
    this.onCrystalHovered = callback;
  }

  /**
   * Устанавливает коллбэк для события снятия наведения с кристалла
   */
  setOnCrystalUnhovered(callback: (crystal: CrystalTrack) => void): void {
    this.onCrystalUnhovered = callback;
  }

  /**
   * Принудительно убирает подсветку (например, при фокусе на другом кристалле)
   */
  clearHover(): void {
    if (this.hoveredCrystal) {
      this.unhoverCrystal();
    }
  }

  /**
   * Обновляет систему (должно вызываться в цикле рендеринга)
   */
  update(deltaTime: number): void {
    // Обновляем HUD если он существует
    if (this.hud) {
      this.hud.update(deltaTime);
    }
    
    // Здесь можно добавить дополнительные обновления, если необходимо
    // Например, анимации или эффекты, которые должны обновляться каждый кадр
  }

  /**
   * Логирует статистику системы подсветки
   */
  private logHoverSystemStats(): void {
    console.log('📊 Crystal Hover System Statistics:');
    console.log(`  Total crystals: ${this.crystalTracks.length}`);
    console.log(`  Crystal meshes: ${this.crystalMeshes.length}`);
    console.log(`  Update frequency: ${CrystalHoverSystem.RAYCAST_CONFIG.updateFrequency} FPS`);
    console.log(`  Max raycast distance: ${CrystalHoverSystem.RAYCAST_CONFIG.maxDistance}`);
    console.log(`  Frustum culling: ${CrystalHoverSystem.RAYCAST_CONFIG.frustumCulling ? 'enabled' : 'disabled'}`);
    console.log(`  Hover glow intensity: ${CrystalHoverSystem.HOVER_CONFIG.glowIntensity}x`);
    console.log(`  Transition duration: ${CrystalHoverSystem.HOVER_CONFIG.transitionDuration}ms`);
  }

  /**
   * Проверяет, выполняется ли анимация фокуса камеры
   */
  private isCameraFocusAnimating(): boolean {
    // Проверяем глобальный флаг состояния фокуса
    if (typeof window !== 'undefined' && (window as any).isCameraFocusAnimating === true) {
      return true;
    }
    
    // Fallback проверки через системы
    if (typeof window !== 'undefined') {
      const cameraController = (window as any).cameraController;
      if (cameraController && typeof cameraController.isCameraAnimating === 'function') {
        return cameraController.isCameraAnimating();
      }
      
      const focusAnimationSystem = (window as any).focusAnimationSystem;
      if (focusAnimationSystem && typeof focusAnimationSystem.isAnimating === 'function') {
        return focusAnimationSystem.isAnimating();
      }
    }
    
    return false;
  }

  /**
   * Получает статистику производительности
   */
  getPerformanceStats(): {
    totalCrystals: number;
    visibleCrystals: number;
    updateFrequency: number;
    lastUpdateTime: number;
  } {
    return {
      totalCrystals: this.crystalTracks.length,
      visibleCrystals: this.visibleCrystals.length,
      updateFrequency: CrystalHoverSystem.RAYCAST_CONFIG.updateFrequency,
      lastUpdateTime: this.lastUpdateTime
    };
  }

  /**
   * Освобождает ресурсы системы
   */
  dispose(): void {
    console.log('🗑️ Disposing Crystal Hover System...');
    
    // Убираем текущую подсветку
    this.clearHover();
    
    // Освобождаем ресурсы HUD
    if (this.hud) {
      this.hud.dispose();
      this.hud = undefined;
    }
    
    // Очищаем массивы
    this.crystalTracks = [];
    this.crystalMeshes = [];
    this.visibleCrystals = [];
    
    // Сбрасываем состояние
    this.hoveredCrystal = undefined;
    this.scene = undefined;
    this.camera = undefined;
    this.initialized = false;
    
    // Очищаем коллбэки
    this.onCrystalHovered = undefined;
    this.onCrystalUnhovered = undefined;
    
    console.log('✅ Crystal Hover System disposed');
  }
}