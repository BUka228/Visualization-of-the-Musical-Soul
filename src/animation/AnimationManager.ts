/**
 * AnimationManager - управление всеми анимациями в 3D-сцене
 * Отвечает за координацию анимаций объектов, камеры и эффектов
 */

import * as THREE from 'three';
import { AnimationManager as IAnimationManager, TrackObject, SceneManager } from '../types';

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
    
    const trackObjects = this.sceneManager.getTrackObjects();
    if (!trackObjects) return;
    
    trackObjects.forEach((trackObject: TrackObject, index: number) => {
      // Орбитальное вращение вокруг центра сцены
      this.updateOrbitalRotation(trackObject, currentTime, index);
      
      // Вращение вокруг собственной оси
      this.updateSelfRotation(trackObject, deltaTime);
      
      // Обновление пульсации для выбранных объектов
      if (trackObject.isSelected) {
        trackObject.updatePulse(currentTime);
      }
    });
  }

  private updateOrbitalRotation(trackObject: TrackObject, currentTime: number, index: number): void {
    if (trackObject.isSelected) return; // Выбранные объекты не участвуют в орбитальном вращении
    
    const originalPos = trackObject.originalPosition;
    const radius = originalPos.length();
    
    // Уникальный фазовый сдвиг для каждого объекта
    const phaseOffset = index * 0.1 + trackObject.trackData.id.charCodeAt(0) * 0.01;
    const angle = currentTime * this.globalRotationSpeed + phaseOffset;
    
    // Вычисляем новую позицию на орбите
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    
    // Сохраняем исходную высоту (Y-координату)
    const originalY = originalPos.y;
    
    // Проецируем на плоскость XZ для орбитального движения
    const projectedRadius = Math.sqrt(originalPos.x * originalPos.x + originalPos.z * originalPos.z);
    
    trackObject.position.set(
      cosAngle * projectedRadius,
      originalY, // Сохраняем высоту
      sinAngle * projectedRadius
    );
  }

  private updateSelfRotation(trackObject: TrackObject, deltaTime: number): void {
    // Каждый объект вращается вокруг своей оси с уникальной скоростью
    const rotationSpeedX = this.objectRotationSpeed * (0.5 + Math.sin(trackObject.trackData.id.charCodeAt(0)) * 0.5);
    const rotationSpeedY = this.objectRotationSpeed * (0.5 + Math.cos(trackObject.trackData.id.charCodeAt(1) || 0) * 0.5);
    const rotationSpeedZ = this.objectRotationSpeed * (0.5 + Math.sin(trackObject.trackData.id.charCodeAt(2) || 0) * 0.5);
    
    trackObject.rotation.x += rotationSpeedX;
    trackObject.rotation.y += rotationSpeedY;
    trackObject.rotation.z += rotationSpeedZ;
  }

  private updateAppearanceAnimation(currentTime: number): void {
    if (!this.appearanceStartTime || !this.sceneManager) return;
    
    const elapsed = currentTime - this.appearanceStartTime;
    const progress = Math.min(elapsed / this.appearanceAnimationDuration, 1);
    
    if (progress >= 1) {
      // Анимация появления завершена
      this.appearanceStartTime = undefined;
      return;
    }
    
    const trackObjects = this.sceneManager.getTrackObjects();
    if (!trackObjects) return;
    
    // Плавное появление объектов с задержкой
    trackObjects.forEach((trackObject: TrackObject, index: number) => {
      const delay = (index / trackObjects.length) * 0.5; // Задержка до 50% от общего времени
      const objectProgress = Math.max(0, Math.min(1, (progress - delay) / (1 - delay)));
      
      if (objectProgress > 0) {
        // Эффект появления: масштабирование и прозрачность
        const scale = this.easeOutCubic(objectProgress);
        const opacity = this.easeOutQuad(objectProgress);
        
        trackObject.scale.setScalar(scale);
        
        // Обновляем прозрачность материала
        const material = trackObject.material as THREE.MeshStandardMaterial;
        if (material) {
          material.transparent = true;
          material.opacity = opacity;
          
          // Когда анимация завершена, убираем прозрачность для производительности
          if (objectProgress >= 1) {
            material.transparent = false;
            material.opacity = 1;
          }
        }
      }
    });
  }

  private updateCameraAnimation(currentTime: number): void {
    if (!this.isCameraAnimating || !this.camera || !this.originalCameraPosition || !this.targetCameraPosition) {
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

  animateTrackSelection(trackObject: TrackObject): void {
    console.log(`🎯 Анимация выбора трека: ${trackObject.trackData.name}`);
    
    // Останавливаем орбитальное движение для выбранного объекта
    trackObject.position.copy(trackObject.originalPosition);
    
    // Анимируем приближение камеры к объекту
    this.animateCameraToTrack(trackObject);
    
    // Устанавливаем состояние выбора (включает пульсацию)
    trackObject.setSelected(true);
  }

  animateTrackDeselection(): void {
    console.log('🎯 Анимация отмены выбора трека');
    
    // Возвращаем камеру в исходное положение
    this.animateCameraReset();
    
    // Сброс состояния выбора будет выполнен в InteractionManager
  }

  animateCameraToTrack(trackObject: TrackObject): void {
    if (!this.camera) return;
    
    this.originalCameraPosition = this.camera.position.clone();
    
    // Вычисляем целевую позицию камеры (ближе к объекту)
    const direction = trackObject.position.clone().normalize();
    const distance = 15; // Расстояние до объекта
    this.targetCameraPosition = trackObject.position.clone().add(direction.multiplyScalar(distance));
    
    this.isCameraAnimating = true;
    this.cameraAnimationProgress = 0;
    
    console.log('📷 Начата анимация приближения камеры к треку');
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