/**
 * AnimationManager - управление всеми анимациями в 3D-сцене
 * Отвечает за координацию анимаций объектов, камеры и эффектов
 */

import * as THREE from 'three';
import { AnimationManager as IAnimationManager, SceneManager } from '../types';

export class AnimationManager implements IAnimationManager {
  private sceneManager?: SceneManager;
  private animationActive: boolean = false;
  private isPaused: boolean = false;
  private animationId?: number;
  
  // Параметры анимации
  private globalRotationSpeed: number = 0.0005; // Скорость орбитального вращения
  private objectRotationSpeed: number = 0.01; // Скорость вращения вокруг оси
  private appearanceAnimationDuration: number = 2000; // Длительность появления объектов (мс)
  
  // Время начала анимации появления
  private appearanceStartTime?: number;
  
  // Камера для анимаций
  private camera?: THREE.Camera;
  private originalCameraPosition?: THREE.Vector3;
  private targetCameraPosition?: THREE.Vector3;
  private cameraAnimationProgress: number = 0;
  private cameraAnimationDuration: number = 1000; // мс
  private isCameraAnimating: boolean = false;

  constructor() {
    console.log('🎬 AnimationManager создан');
  }

  initialize(sceneManager: SceneManager): void {
    this.sceneManager = sceneManager;
    this.camera = sceneManager.getCamera();
    
    if (this.camera) {
      this.originalCameraPosition = this.camera.position.clone();
    }
    
    console.log('🎬 AnimationManager инициализирован');
  }

  startAnimation(): void {
    if (this.animationActive) return;
    
    this.animationActive = true;
    this.isPaused = false;
    this.appearanceStartTime = Date.now();
    
    console.log('▶️ Анимация запущена');
    this.animate();
  }

  stopAnimation(): void {
    if (!this.animationActive) return;
    
    this.animationActive = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }
    
    console.log('⏹️ Анимация остановлена');
  }

  toggleAnimation(): void {
    this.isPaused = !this.isPaused;
    console.log(`⏯️ Анимация ${this.isPaused ? 'приостановлена' : 'возобновлена'}`);
  }

  private animate(): void {
    if (!this.animationActive) return;
    
    const currentTime = Date.now();
    const deltaTime = 16; // ~60 FPS
    
    // Обновляем анимации только если не на паузе
    if (!this.isPaused) {
      this.updateTrackAnimations(currentTime, deltaTime);
      this.updateAppearanceAnimation(currentTime);
    }
    
    // Обновляем анимации камеры независимо от паузы
    this.updateCameraAnimation(currentTime);
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  private updateTrackAnimations(currentTime: number, deltaTime: number): void {
    if (!this.sceneManager) return;
    
    // Soul Galaxy renderer handles its own animations
    // Classic track object animations are no longer needed
  }

  // Classic track object animation methods removed - Soul Galaxy handles its own animations

  private updateAppearanceAnimation(currentTime: number): void {
    if (!this.appearanceStartTime || !this.sceneManager) return;
    
    const elapsed = currentTime - this.appearanceStartTime;
    const progress = Math.min(elapsed / this.appearanceAnimationDuration, 1);
    
    if (progress >= 1) {
      // Анимация появления завершена
      this.appearanceStartTime = undefined;
      return;
    }
    
    // Soul Galaxy renderer handles its own appearance animations
    // Classic track object appearance animations are no longer needed
  }

  private updateCameraAnimation(currentTime: number): void {
    if (!this.isCameraAnimating || !this.camera || !this.originalCameraPosition || !this.targetCameraPosition) {
      return;
    }
    
    // Не обновляем анимацию камеры если идет фокус на кристалл
    if (this.isFocusAnimationActive()) {
      console.log('⏸️ Camera animation paused due to focus animation');
      return;
    }
    
    this.cameraAnimationProgress += 16; // deltaTime
    const progress = Math.min(this.cameraAnimationProgress / this.cameraAnimationDuration, 1);
    const easedProgress = this.easeInOutCubic(progress);
    
    // Интерполяция позиции камеры
    this.camera.position.lerpVectors(this.originalCameraPosition, this.targetCameraPosition, easedProgress);
    
    if (progress >= 1) {
      this.isCameraAnimating = false;
      this.cameraAnimationProgress = 0;
      console.log('📷 Анимация камеры завершена');
    }
  }

  animateTrackSelection(trackId: string): void {
    console.log(`🎯 Анимация выбора трека: ${trackId}`);
    
    // Soul Galaxy renderer handles track selection animations
    // Classic track object selection animations are no longer needed
  }

  animateTrackDeselection(): void {
    console.log('🎯 Анимация отмены выбора трека');
    
    // Возвращаем камеру в исходное положение
    this.animateCameraReset();
    
    // Сброс состояния выбора будет выполнен в InteractionManager
  }

  animateCameraToTrack(trackId: string): void {
    if (!this.camera) return;
    
    console.log(`📷 Начата анимация приближения камеры к треку: ${trackId}`);
    
    // Soul Galaxy renderer handles camera animations to tracks
    // Classic track object camera animations are no longer needed
  }

  animateCameraReset(): void {
    if (!this.camera) return;
    
    this.originalCameraPosition = this.camera.position.clone();
    this.targetCameraPosition = new THREE.Vector3(0, 0, 100); // Исходная позиция камеры
    
    this.isCameraAnimating = true;
    this.cameraAnimationProgress = 0;
    
    console.log('📷 Начата анимация возврата камеры');
  }

  // Функции плавности (easing functions)
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private easeOutQuad(t: number): number {
    return 1 - (1 - t) * (1 - t);
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Проверяет, активна ли анимация фокуса на кристалл
   */
  private isFocusAnimationActive(): boolean {
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

  // Геттеры для состояния
  isAnimating(): boolean {
    return this.animationActive;
  }

  isPausedState(): boolean {
    return this.isPaused;
  }

  isCameraAnimatingState(): boolean {
    return this.isCameraAnimating;
  }

  // Методы для настройки параметров анимации
  setGlobalRotationSpeed(speed: number): void {
    this.globalRotationSpeed = speed;
  }

  setObjectRotationSpeed(speed: number): void {
    this.objectRotationSpeed = speed;
  }

  setAppearanceAnimationDuration(duration: number): void {
    this.appearanceAnimationDuration = duration;
  }

  setCameraAnimationDuration(duration: number): void {
    this.cameraAnimationDuration = duration;
  }

  // Освобождение ресурсов
  dispose(): void {
    this.stopAnimation();
    this.sceneManager = undefined;
    this.camera = undefined;
    this.originalCameraPosition = undefined;
    this.targetCameraPosition = undefined;
    
    console.log('🎬 AnimationManager освобожден');
  }
}