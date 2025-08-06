/**
 * FrustumCullingManager - управление отсечением объектов вне поля зрения
 * Скрывает объекты, которые не видны камере, для повышения производительности
 */

import * as THREE from 'three';

export interface CullingStats {
  totalObjects: number;
  visibleObjects: number;
  culledObjects: number;
  cullingEfficiency: number;
  lastUpdateTime: number;
}

export interface CullableObject {
  object: THREE.Object3D;
  boundingSphere: THREE.Sphere;
  isVisible: boolean;
  lastVisibilityCheck: number;
  priority: number; // Приоритет для оптимизации проверок
}

export class FrustumCullingManager {
  private camera: THREE.Camera;
  private frustum: THREE.Frustum = new THREE.Frustum();
  private cameraMatrix: THREE.Matrix4 = new THREE.Matrix4();
  
  private cullableObjects: Map<string, CullableObject> = new Map();
  private stats: CullingStats = {
    totalObjects: 0,
    visibleObjects: 0,
    culledObjects: 0,
    cullingEfficiency: 0,
    lastUpdateTime: 0
  };
  
  // Настройки отсечения
  private readonly config = {
    updateInterval: 16, // Интервал обновления в мс (60 FPS)
    maxChecksPerFrame: 100, // Максимальное количество проверок за кадр
    enableDistanceCulling: true, // Включить отсечение по расстоянию
    maxDistance: 2500, // Максимальное расстояние видимости - увеличено для поддержки отдаления до 1500
    enableOcclusionCulling: false, // Отсечение по перекрытию (пока отключено)
    priorityUpdateInterval: 1000, // Интервал обновления приоритетов в мс
    boundingSphereMargin: 1.2 // Запас для ограничивающих сфер
  };
  
  private lastUpdateTime: number = 0;
  private lastPriorityUpdateTime: number = 0;
  private currentCheckIndex: number = 0;

  constructor(camera: THREE.Camera) {
    this.camera = camera;
  }

  /**
   * Добавляет объект для отслеживания отсечения
   */
  public addObject(id: string, object: THREE.Object3D, priority: number = 1): void {
    // Вычисляем ограничивающую сферу
    const boundingSphere = this.calculateBoundingSphere(object);
    
    const cullableObject: CullableObject = {
      object,
      boundingSphere,
      isVisible: true,
      lastVisibilityCheck: 0,
      priority
    };
    
    this.cullableObjects.set(id, cullableObject);
    this.updateStats();
  }

  /**
   * Удаляет объект из отслеживания
   */
  public removeObject(id: string): void {
    if (this.cullableObjects.has(id)) {
      this.cullableObjects.delete(id);
      this.updateStats();
    }
  }

  /**
   * Обновляет позицию объекта и его ограничивающую сферу
   */
  public updateObject(id: string, object: THREE.Object3D): void {
    const cullableObject = this.cullableObjects.get(id);
    if (cullableObject) {
      cullableObject.object = object;
      cullableObject.boundingSphere = this.calculateBoundingSphere(object);
    }
  }

  /**
   * Основной метод обновления отсечения
   */
  public update(currentTime: number): void {
    if (currentTime - this.lastUpdateTime < this.config.updateInterval) {
      return;
    }
    
    // Проверяем, не выполняется ли анимация фокуса камеры
    if (typeof window !== 'undefined') {
      const isFocusAnimating = (window as any).isCameraFocusAnimating;
      const globalFocusProtection = (window as any).globalFocusProtection;
      
      if (isFocusAnimating || globalFocusProtection) {
        // Во время фокуса выполняем только минимальные обновления
        this.lastUpdateTime = currentTime;
        return;
      }
    }
    
    // Обновляем матрицу камеры и фрустум
    this.updateCameraFrustum();
    
    // Обновляем приоритеты объектов
    if (currentTime - this.lastPriorityUpdateTime >= this.config.priorityUpdateInterval) {
      this.updateObjectPriorities();
      this.lastPriorityUpdateTime = currentTime;
    }
    
    // Выполняем проверки отсечения
    this.performCullingChecks(currentTime);
    
    this.lastUpdateTime = currentTime;
    this.stats.lastUpdateTime = currentTime;
  }

  /**
   * Обновляет фрустум камеры
   */
  private updateCameraFrustum(): void {
    this.cameraMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.cameraMatrix);
  }

  /**
   * Обновляет приоритеты объектов на основе расстояния до камеры
   */
  private updateObjectPriorities(): void {
    const cameraPosition = new THREE.Vector3();
    this.camera.getWorldPosition(cameraPosition);
    
    this.cullableObjects.forEach(cullableObject => {
      const distance = cameraPosition.distanceTo(cullableObject.boundingSphere.center);
      
      // Объекты ближе к камере имеют более высокий приоритет
      cullableObject.priority = Math.max(1, Math.round(100 / (distance + 1)));
    });
  }

  /**
   * Выполняет проверки отсечения для части объектов
   */
  private performCullingChecks(currentTime: number): void {
    const objectsArray = Array.from(this.cullableObjects.values());
    
    // Сортируем по приоритету для оптимизации
    objectsArray.sort((a, b) => b.priority - a.priority);
    
    let checksPerformed = 0;
    const maxChecks = Math.min(this.config.maxChecksPerFrame, objectsArray.length);
    
    for (let i = 0; i < maxChecks && checksPerformed < this.config.maxChecksPerFrame; i++) {
      const index = (this.currentCheckIndex + i) % objectsArray.length;
      const cullableObject = objectsArray[index];
      
      if (cullableObject) {
        this.checkObjectVisibility(cullableObject, currentTime);
        checksPerformed++;
      }
    }
    
    this.currentCheckIndex = (this.currentCheckIndex + checksPerformed) % objectsArray.length;
  }

  /**
   * Проверяет видимость конкретного объекта
   */
  private checkObjectVisibility(cullableObject: CullableObject, currentTime: number): void {
    let isVisible = true;
    
    // Проверка фрустума
    if (!this.frustum.intersectsSphere(cullableObject.boundingSphere)) {
      isVisible = false;
    }
    
    // Проверка расстояния (если включена)
    if (isVisible && this.config.enableDistanceCulling) {
      const cameraPosition = new THREE.Vector3();
      this.camera.getWorldPosition(cameraPosition);
      
      const distance = cameraPosition.distanceTo(cullableObject.boundingSphere.center);
      if (distance > this.config.maxDistance) {
        isVisible = false;
      }
    }
    
    // Обновляем видимость объекта
    if (cullableObject.isVisible !== isVisible) {
      cullableObject.isVisible = isVisible;
      cullableObject.object.visible = isVisible;
      
      // Дополнительная оптимизация: отключаем обновления матриц для невидимых объектов
      if (cullableObject.object instanceof THREE.Mesh) {
        cullableObject.object.matrixAutoUpdate = isVisible;
      }
    }
    
    cullableObject.lastVisibilityCheck = currentTime;
  }

  /**
   * Вычисляет ограничивающую сферу для объекта
   */
  private calculateBoundingSphere(object: THREE.Object3D): THREE.Sphere {
    const box = new THREE.Box3();
    const sphere = new THREE.Sphere();
    
    // Обновляем мировые матрицы
    object.updateMatrixWorld(true);
    
    if (object instanceof THREE.Mesh && object.geometry) {
      // Для мешей используем геометрию
      object.geometry.computeBoundingSphere();
      if (object.geometry.boundingSphere) {
        sphere.copy(object.geometry.boundingSphere);
        sphere.applyMatrix4(object.matrixWorld);
      }
    } else {
      // Для других объектов используем bounding box
      box.setFromObject(object);
      box.getBoundingSphere(sphere);
    }
    
    // Добавляем запас для более надежного отсечения
    sphere.radius *= this.config.boundingSphereMargin;
    
    return sphere;
  }

  /**
   * Принудительно обновляет видимость всех объектов
   */
  public forceUpdateAll(): void {
    // Проверяем, не выполняется ли анимация фокуса камеры
    if (typeof window !== 'undefined') {
      const isFocusAnimating = (window as any).isCameraFocusAnimating;
      const globalFocusProtection = (window as any).globalFocusProtection;
      
      if (isFocusAnimating || globalFocusProtection) {
        console.log('⏸️ FrustumCulling forceUpdateAll skipped during camera focus animation');
        return;
      }
    }
    
    this.updateCameraFrustum();
    
    const currentTime = performance.now();
    this.cullableObjects.forEach(cullableObject => {
      this.checkObjectVisibility(cullableObject, currentTime);
    });
    
    this.updateStats();
  }

  /**
   * Устанавливает видимость всех объектов
   */
  public setAllVisible(visible: boolean): void {
    this.cullableObjects.forEach(cullableObject => {
      cullableObject.isVisible = visible;
      cullableObject.object.visible = visible;
      
      if (cullableObject.object instanceof THREE.Mesh) {
        cullableObject.object.matrixAutoUpdate = visible;
      }
    });
    
    this.updateStats();
  }

  /**
   * Получает объекты в указанной области
   */
  public getObjectsInFrustum(customFrustum?: THREE.Frustum): string[] {
    const frustum = customFrustum || this.frustum;
    const visibleIds: string[] = [];
    
    this.cullableObjects.forEach((cullableObject, id) => {
      if (frustum.intersectsSphere(cullableObject.boundingSphere)) {
        visibleIds.push(id);
      }
    });
    
    return visibleIds;
  }

  /**
   * Получает объекты в радиусе от точки
   */
  public getObjectsInRadius(center: THREE.Vector3, radius: number): string[] {
    const objectsInRadius: string[] = [];
    const testSphere = new THREE.Sphere(center, radius);
    
    this.cullableObjects.forEach((cullableObject, id) => {
      if (testSphere.intersectsSphere(cullableObject.boundingSphere)) {
        objectsInRadius.push(id);
      }
    });
    
    return objectsInRadius;
  }

  /**
   * Обновляет статистику
   */
  private updateStats(): void {
    let visibleCount = 0;
    let culledCount = 0;
    
    this.cullableObjects.forEach(cullableObject => {
      if (cullableObject.isVisible) {
        visibleCount++;
      } else {
        culledCount++;
      }
    });
    
    this.stats.totalObjects = this.cullableObjects.size;
    this.stats.visibleObjects = visibleCount;
    this.stats.culledObjects = culledCount;
    this.stats.cullingEfficiency = this.stats.totalObjects > 0 
      ? Math.round(culledCount / this.stats.totalObjects * 100) 
      : 0;
  }

  /**
   * Получает статистику отсечения
   */
  public getStats(): CullingStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Получает детальную информацию об объектах
   */
  public getObjectsInfo(): Array<{
    id: string;
    isVisible: boolean;
    distance: number;
    priority: number;
    lastCheck: number;
  }> {
    const cameraPosition = new THREE.Vector3();
    this.camera.getWorldPosition(cameraPosition);
    
    const info: Array<{
      id: string;
      isVisible: boolean;
      distance: number;
      priority: number;
      lastCheck: number;
    }> = [];
    
    this.cullableObjects.forEach((cullableObject, id) => {
      const distance = cameraPosition.distanceTo(cullableObject.boundingSphere.center);
      
      info.push({
        id,
        isVisible: cullableObject.isVisible,
        distance: Math.round(distance * 10) / 10,
        priority: cullableObject.priority,
        lastCheck: cullableObject.lastVisibilityCheck
      });
    });
    
    return info.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Обновляет настройки отсечения
   */
  public updateConfig(newConfig: Partial<typeof this.config>): void {
    Object.assign(this.config, newConfig);
  }

  /**
   * Получает текущие настройки
   */
  public getConfig(): typeof this.config {
    return { ...this.config };
  }

  /**
   * Создает отчет об отсечении
   */
  public generateReport(): string {
    const stats = this.getStats();
    const objectsInfo = this.getObjectsInfo();
    const visibleObjects = objectsInfo.filter(obj => obj.isVisible);
    const culledObjects = objectsInfo.filter(obj => !obj.isVisible);
    
    return `
=== Отчет об отсечении фрустума ===
Всего объектов: ${stats.totalObjects}
Видимых объектов: ${stats.visibleObjects}
Отсеченных объектов: ${stats.culledObjects}
Эффективность отсечения: ${stats.cullingEfficiency}%

Настройки:
- Максимальное расстояние: ${this.config.maxDistance}
- Интервал обновления: ${this.config.updateInterval}ms
- Максимум проверок за кадр: ${this.config.maxChecksPerFrame}
- Отсечение по расстоянию: ${this.config.enableDistanceCulling ? 'включено' : 'отключено'}

Ближайшие видимые объекты:
${visibleObjects.slice(0, 5).map(obj => 
  `- ${obj.id}: расстояние ${obj.distance}, приоритет ${obj.priority}`
).join('\n')}

Ближайшие отсеченные объекты:
${culledObjects.slice(0, 5).map(obj => 
  `- ${obj.id}: расстояние ${obj.distance}, приоритет ${obj.priority}`
).join('\n')}
====================================
    `.trim();
  }

  /**
   * Освобождает ресурсы
   */
  public dispose(): void {
    console.log('🗑️ Освобождение ресурсов FrustumCullingManager...');
    this.cullableObjects.clear();
    console.log('✅ Ресурсы FrustumCullingManager освобождены');
  }
}