/**
 * PerformanceOptimizer - главный класс для управления оптимизацией производительности
 * Интегрирует все компоненты оптимизации: instanced rendering, frustum culling, resource management и мониторинг
 */

import * as THREE from 'three';
import { ProcessedTrack } from '../types';
import { FrustumCullingManager } from './FrustumCullingManager';
import { InstancedRenderingManager } from './InstancedRenderingManager';
import { ResourceManager } from './ResourceManager';
import { PerformanceMonitor, PerformanceWarning } from './PerformanceMonitor';

export interface PerformanceConfig {
  enableInstancedRendering: boolean;
  enableFrustumCulling: boolean;
  enableResourceOptimization: boolean;
  enablePerformanceMonitoring: boolean;
  autoOptimization: boolean;
  targetFps: number;
}

export interface OptimizationStats {
  totalObjects: number;
  instancedObjects: number;
  culledObjects: number;
  reusedResources: number;
  currentFps: number;
  memoryUsage: number;
  drawCallsReduced: number;
}

export class PerformanceOptimizer {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;
  
  // Менеджеры оптимизации
  private frustumCullingManager: FrustumCullingManager;
  private instancedRenderingManager: InstancedRenderingManager;
  private resourceManager: ResourceManager;
  private performanceMonitor: PerformanceMonitor;
  
  // Конфигурация
  private config: PerformanceConfig = {
    enableInstancedRendering: true,
    enableFrustumCulling: true,
    enableResourceOptimization: true,
    enablePerformanceMonitoring: true,
    autoOptimization: true,
    targetFps: 60
  };
  
  // Статистика
  private stats: OptimizationStats = {
    totalObjects: 0,
    instancedObjects: 0,
    culledObjects: 0,
    reusedResources: 0,
    currentFps: 0,
    memoryUsage: 0,
    drawCallsReduced: 0
  };
  
  // Коллбэки
  private onWarningCallback?: (warning: PerformanceWarning) => void;
  private onStatsUpdateCallback?: (stats: OptimizationStats) => void;
  
  // Автооптимизация
  private autoOptimizationEnabled: boolean = true;
  private lastOptimizationTime: number = 0;
  private optimizationInterval: number = 5000; // 5 секунд
  
  // Отслеживание недавнего фокуса
  private lastFocusEndTime: number = 0;
  private focusStabilizationPeriod: number = 15000; // 15 секунд после завершения фокуса

  constructor(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    
    // Инициализация менеджеров
    this.frustumCullingManager = new FrustumCullingManager(camera);
    this.instancedRenderingManager = new InstancedRenderingManager(scene);
    this.resourceManager = new ResourceManager();
    this.performanceMonitor = new PerformanceMonitor(renderer);
    
    // Настройка коллбэков
    this.setupCallbacks();
    
    // Регистрируем оптимизатор в глобальном пространстве для доступа из других систем
    if (typeof window !== 'undefined') {
      (window as any).performanceOptimizer = this;
    }
    
    console.log('🚀 PerformanceOptimizer инициализирован');
  }

  /**
   * Настраивает коллбэки для мониторинга
   */
  private setupCallbacks(): void {
    // Коллбэк для предупреждений о производительности
    this.performanceMonitor.setOnWarning((warning) => {
      this.handlePerformanceWarning(warning);
      
      if (this.onWarningCallback) {
        this.onWarningCallback(warning);
      }
    });
    
    // Коллбэк для обновления статистики
    this.performanceMonitor.setOnStatsUpdate((performanceStats) => {
      this.updateOptimizationStats(performanceStats);
      
      if (this.onStatsUpdateCallback) {
        this.onStatsUpdateCallback(this.stats);
      }
    });
  }

  /**
   * Инициализирует оптимизацию для массива треков
   */
  public initializeOptimization(tracks: ProcessedTrack[]): void {
    console.log(`🔧 Инициализация оптимизации для ${tracks.length} треков...`);
    
    // Предзагрузка ресурсов
    if (this.config.enableResourceOptimization) {
      this.preloadResources(tracks);
    }
    
    // Создание инстансированных объектов
    if (this.config.enableInstancedRendering) {
      this.createInstancedObjects(tracks);
    }
    
    // Добавление объектов в frustum culling
    if (this.config.enableFrustumCulling) {
      this.setupFrustumCulling(tracks);
    }
    
    this.stats.totalObjects = tracks.length;
    console.log('✅ Оптимизация инициализирована');
  }

  /**
   * Предзагружает ресурсы для оптимизации
   */
  private preloadResources(tracks: ProcessedTrack[]): void {
    const genres = [...new Set(tracks.map(track => track.genre))];
    const colors = [...new Set(tracks.map(track => track.color))];
    const sizes = [...new Set(tracks.map(track => Math.round(track.size * 4) / 4))];
    
    this.resourceManager.preloadGeometries(genres, sizes);
    this.resourceManager.preloadMaterials(genres, colors);
  }

  /**
   * Создает инстансированные объекты
   */
  private createInstancedObjects(tracks: ProcessedTrack[]): void {
    this.instancedRenderingManager.createInstancedObjects(
      tracks,
      (genre, size) => this.resourceManager.getGeometry(genre, size),
      (genre, color, popularity) => this.resourceManager.getMaterial(genre, color, popularity)
    );
    
    const instanceStats = this.instancedRenderingManager.getStats();
    this.stats.instancedObjects = instanceStats.instancedObjects;
    this.stats.drawCallsReduced = instanceStats.drawCallsReduced;
  }

  /**
   * Настраивает frustum culling для треков
   */
  private setupFrustumCulling(tracks: ProcessedTrack[]): void {
    tracks.forEach((track, index) => {
      // Создаем временный объект для расчета culling
      const tempObject = new THREE.Object3D();
      tempObject.position.copy(track.position);
      
      // Приоритет на основе популярности и размера
      const priority = Math.round(track.popularity + track.size * 10);
      
      this.frustumCullingManager.addObject(track.id, tempObject, priority);
    });
  }

  /**
   * Обновляет оптимизацию каждый кадр
   */
  public update(deltaTime: number): void {
    const currentTime = performance.now();
    
    // Обновление мониторинга производительности
    if (this.config.enablePerformanceMonitoring) {
      this.performanceMonitor.update();
    }
    
    // Обновление frustum culling
    if (this.config.enableFrustumCulling) {
      this.frustumCullingManager.update(currentTime);
    }
    
    // Обновление анимаций инстансированных объектов
    if (this.config.enableInstancedRendering) {
      this.instancedRenderingManager.updateAnimation(deltaTime, currentTime);
    }
    
    // Автооптимизация
    if (this.config.autoOptimization && currentTime - this.lastOptimizationTime > this.optimizationInterval) {
      this.performAutoOptimization();
      this.lastOptimizationTime = currentTime;
    }
  }

  /**
   * Проверяет, выполняется ли анимация фокуса камеры
   */
  private isCameraFocusAnimating(): boolean {
    // Основная проверка через глобальный флаг
    if (typeof window !== 'undefined') {
      const globalFlag = (window as any).isCameraFocusAnimating;
      if (globalFlag === true) {
        console.log('🛡️ Focus protection: isCameraFocusAnimating = true');
        return true;
      }
      
      // Проверка через глобальную защиту фокуса
      const globalFocusProtection = (window as any).globalFocusProtection;
      if (globalFocusProtection === true) {
        console.log('🛡️ Focus protection: globalFocusProtection = true');
        return true;
      }
      
      // Дополнительные проверки через системы
      const cameraController = (window as any).cameraController;
      if (cameraController) {
        if (typeof cameraController.isCameraAnimating === 'function' && cameraController.isCameraAnimating()) {
          console.log('🛡️ Focus protection: cameraController.isCameraAnimating = true');
          return true;
        }
        if (typeof cameraController.isFocused === 'function' && cameraController.isFocused()) {
          console.log('🛡️ Focus protection: cameraController.isFocused = true');
          return true;
        }
      }
      
      const focusAnimationSystem = (window as any).focusAnimationSystem;
      if (focusAnimationSystem) {
        if (typeof focusAnimationSystem.isAnimating === 'function' && focusAnimationSystem.isAnimating()) {
          console.log('🛡️ Focus protection: focusAnimationSystem.isAnimating = true');
          return true;
        }
        if (typeof focusAnimationSystem.isFocused === 'function' && focusAnimationSystem.isFocused()) {
          console.log('🛡️ Focus protection: focusAnimationSystem.isFocused = true');
          return true;
        }
      }
      
      const crystalTrackSystem = (window as any).crystalTrackSystem;
      if (crystalTrackSystem) {
        if (typeof crystalTrackSystem.isCameraFocused === 'function' && crystalTrackSystem.isCameraFocused()) {
          console.log('🛡️ Focus protection: crystalTrackSystem.isCameraFocused = true');
          return true;
        }
        if (typeof crystalTrackSystem.isInFocusMode === 'function' && crystalTrackSystem.isInFocusMode()) {
          console.log('🛡️ Focus protection: crystalTrackSystem.isInFocusMode = true');
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Проверяет, было ли недавно завершение фокуса
   */
  private isRecentlyFocused(): boolean {
    const currentTime = performance.now();
    
    // Проверяем, был ли недавно завершен фокус
    if (this.lastFocusEndTime > 0 && (currentTime - this.lastFocusEndTime) < this.focusStabilizationPeriod) {
      return true;
    }
    
    // Дополнительная проверка через глобальные переменные
    if (typeof window !== 'undefined') {
      const lastFocusEnd = (window as any).lastFocusEndTime;
      if (lastFocusEnd && (currentTime - lastFocusEnd) < this.focusStabilizationPeriod) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Отмечает завершение фокуса для отслеживания периода стабилизации
   */
  private markFocusEndInternal(): void {
    this.lastFocusEndTime = performance.now();
    
    // Также устанавливаем глобальную переменную для синхронизации
    if (typeof window !== 'undefined') {
      (window as any).lastFocusEndTime = this.lastFocusEndTime;
    }
    
    console.log('📝 Focus end time marked for stabilization period');
  }

  /**
   * Публичный метод для отметки завершения фокуса (вызывается извне)
   */
  public markFocusEnd(): void {
    this.markFocusEndInternal();
  }

  /**
   * Проверяет наличие активного сфокусированного кристалла
   */
  private hasActiveFocusedCrystal(): boolean {
    if (typeof window !== 'undefined') {
      // Проверяем через CrystalTrackSystem
      const crystalTrackSystem = (window as any).crystalTrackSystem;
      if (crystalTrackSystem) {
        if (typeof crystalTrackSystem.getFocusedCrystal === 'function') {
          const focusedCrystal = crystalTrackSystem.getFocusedCrystal();
          if (focusedCrystal) {
            return true;
          }
        }
        
        if (typeof crystalTrackSystem.isCameraFocused === 'function' && crystalTrackSystem.isCameraFocused()) {
          return true;
        }
      }
      
      // Проверяем через CameraController
      const cameraController = (window as any).cameraController;
      if (cameraController) {
        if (typeof cameraController.getFocusedCrystal === 'function') {
          const focusedCrystal = cameraController.getFocusedCrystal();
          if (focusedCrystal) {
            return true;
          }
        }
        
        if (typeof cameraController.isFocused === 'function' && cameraController.isFocused()) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Выполняет автоматическую оптимизацию на основе текущей производительности
   */
  private performAutoOptimization(): void {
    // Не выполняем автооптимизацию во время анимации фокуса
    if (this.isCameraFocusAnimating()) {
      console.log('⏸️ Auto-optimization paused during camera focus animation');
      return;
    }
    
    // Дополнительная проверка на недавнее завершение фокуса
    if (this.isRecentlyFocused()) {
      console.log('⏸️ Auto-optimization paused - recently focused');
      return;
    }
    
    // Проверяем наличие активного сфокусированного кристалла
    if (this.hasActiveFocusedCrystal()) {
      console.log('⏸️ Auto-optimization paused - crystal is currently focused');
      return;
    }
    
    const performanceStats = this.performanceMonitor.getStats();
    
    // Если FPS слишком низкий, применяем более агрессивную оптимизацию
    if (performanceStats.fps < this.config.targetFps * 0.8) {
      console.log('⚡ Применение агрессивной оптимизации из-за низкого FPS');
      
      // Увеличиваем дистанцию culling
      this.frustumCullingManager.updateConfig({
        maxDistance: 300,
        maxChecksPerFrame: 50
      });
      
      // Оптимизируем ресурсы
      this.resourceManager.optimizeResources();
    }
    
    // Если FPS стабильный, можем ослабить оптимизацию для лучшего качества
    else if (performanceStats.fps > this.config.targetFps * 1.1) {
      this.frustumCullingManager.updateConfig({
        maxDistance: 500,
        maxChecksPerFrame: 100
      });
    }
  }

  /**
   * Обрабатывает предупреждения о производительности
   */
  private handlePerformanceWarning(warning: PerformanceWarning): void {
    if (!this.config.autoOptimization) return;
    
    // Не обрабатываем предупреждения во время анимации фокуса
    if (this.isCameraFocusAnimating()) {
      console.log('⏸️ Performance warning handling paused during camera focus animation');
      return;
    }
    
    switch (warning.type) {
      case 'low_fps':
        this.handleLowFpsWarning(warning);
        break;
      case 'high_memory':
        this.handleHighMemoryWarning(warning);
        break;
      case 'high_draw_calls':
        this.handleHighDrawCallsWarning(warning);
        break;
      case 'high_triangles':
        this.handleHighTrianglesWarning(warning);
        break;
    }
  }

  /**
   * Обрабатывает предупреждение о низком FPS
   */
  private handleLowFpsWarning(warning: PerformanceWarning): void {
    console.log('🔧 Автооптимизация: снижение качества из-за низкого FPS');
    
    // Более агрессивное отсечение
    this.frustumCullingManager.updateConfig({
      maxDistance: 200,
      maxChecksPerFrame: 30
    });
    
    // НЕ выполняем принудительное обновление во время фокуса камеры
    // так как это может сбросить анимацию фокуса
    if (!this.isCameraFocusAnimating() && !this.hasActiveFocusedCrystal()) {
      this.frustumCullingManager.forceUpdateAll();
    } else {
      console.log('⏸️ Skipping forceUpdateAll during camera focus to prevent animation interruption');
    }
  }

  /**
   * Обрабатывает предупреждение о высоком использовании памяти
   */
  private handleHighMemoryWarning(warning: PerformanceWarning): void {
    console.log('🔧 Автооптимизация: очистка ресурсов из-за высокого использования памяти');
    
    // Оптимизируем ресурсы
    this.resourceManager.optimizeResources();
  }

  /**
   * Обрабатывает предупреждение о высоком количестве draw calls
   */
  private handleHighDrawCallsWarning(warning: PerformanceWarning): void {
    console.log('🔧 Автооптимизация: увеличение инстансирования из-за высокого количества draw calls');
    
    // Здесь можно добавить логику для более агрессивного инстансирования
  }

  /**
   * Обрабатывает предупреждение о высоком количестве треугольников
   */
  private handleHighTrianglesWarning(warning: PerformanceWarning): void {
    console.log('🔧 Автооптимизация: упрощение геометрии из-за высокого количества треугольников');
    
    // Здесь можно добавить логику для LOD (Level of Detail)
  }

  /**
   * Обновляет статистику оптимизации
   */
  private updateOptimizationStats(performanceStats: any): void {
    const cullingStats = this.frustumCullingManager.getStats();
    const instanceStats = this.instancedRenderingManager.getStats();
    const resourceStats = this.resourceManager.getStats();
    
    this.stats = {
      totalObjects: this.stats.totalObjects,
      instancedObjects: instanceStats.instancedObjects,
      culledObjects: cullingStats.culledObjects,
      reusedResources: resourceStats.reusedGeometries + resourceStats.reusedMaterials,
      currentFps: performanceStats.fps,
      memoryUsage: performanceStats.memoryUsage,
      drawCallsReduced: instanceStats.drawCallsReduced
    };
  }

  /**
   * Обновляет выделение трека
   */
  public updateTrackHighlight(trackId: string, highlighted: boolean): void {
    if (this.config.enableInstancedRendering) {
      this.instancedRenderingManager.updateInstanceHighlight(trackId, highlighted);
    }
  }

  /**
   * Находит трек по позиции
   */
  public getTrackAtPosition(worldPosition: THREE.Vector3, tolerance: number = 2): ProcessedTrack | null {
    if (this.config.enableInstancedRendering) {
      return this.instancedRenderingManager.getTrackAtPosition(worldPosition, tolerance);
    }
    return null;
  }

  /**
   * Получает треки в радиусе
   */
  public getTracksInRadius(worldPosition: THREE.Vector3, radius: number): ProcessedTrack[] {
    if (this.config.enableInstancedRendering) {
      return this.instancedRenderingManager.getTracksInRadius(worldPosition, radius);
    }
    return [];
  }

  /**
   * Обновляет конфигурацию оптимизации
   */
  public updateConfig(newConfig: Partial<PerformanceConfig>): void {
    Object.assign(this.config, newConfig);
    
    // Применяем изменения к менеджерам
    if (!this.config.enableFrustumCulling) {
      this.frustumCullingManager.setAllVisible(true);
    }
    
    console.log('🔧 Конфигурация оптимизации обновлена:', newConfig);
  }

  /**
   * Получает текущую конфигурацию
   */
  public getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  /**
   * Получает статистику оптимизации
   */
  public getStats(): OptimizationStats {
    return { ...this.stats };
  }

  /**
   * Получает детальную статистику всех компонентов
   */
  public getDetailedStats(): {
    optimization: OptimizationStats;
    culling: any;
    instancing: any;
    resources: any;
    performance: any;
  } {
    return {
      optimization: this.getStats(),
      culling: this.frustumCullingManager.getStats(),
      instancing: this.instancedRenderingManager.getStats(),
      resources: this.resourceManager.getStats(),
      performance: this.performanceMonitor.getStats()
    };
  }

  /**
   * Получает менеджер инстансированного рендеринга
   */
  public getInstancedRenderingManager(): InstancedRenderingManager {
    return this.instancedRenderingManager;
  }

  /**
   * Устанавливает коллбэк для предупреждений
   */
  public setOnWarning(callback: (warning: PerformanceWarning) => void): void {
    this.onWarningCallback = callback;
  }

  /**
   * Устанавливает коллбэк для обновления статистики
   */
  public setOnStatsUpdate(callback: (stats: OptimizationStats) => void): void {
    this.onStatsUpdateCallback = callback;
  }

  /**
   * Принудительно обновляет все оптимизации
   */
  public forceUpdate(): void {
    console.log('🔄 Принудительное обновление всех оптимизаций...');
    
    if (this.config.enableFrustumCulling) {
      this.frustumCullingManager.forceUpdateAll();
    }
    
    if (this.config.enableResourceOptimization) {
      this.resourceManager.optimizeResources();
    }
    
    console.log('✅ Принудительное обновление завершено');
  }

  /**
   * Создает комплексный отчет об оптимизации
   */
  public generateReport(): string {
    const detailedStats = this.getDetailedStats();
    
    return `
=== Комплексный отчет об оптимизации производительности ===

ОБЩАЯ СТАТИСТИКА:
- Всего объектов: ${detailedStats.optimization.totalObjects}
- Инстансированных объектов: ${detailedStats.optimization.instancedObjects}
- Отсеченных объектов: ${detailedStats.optimization.culledObjects}
- Переиспользованных ресурсов: ${detailedStats.optimization.reusedResources}
- Текущий FPS: ${detailedStats.optimization.currentFps}
- Использование памяти: ${detailedStats.optimization.memoryUsage}MB
- Сокращено draw calls: ${detailedStats.optimization.drawCallsReduced}

ЭФФЕКТИВНОСТЬ ОПТИМИЗАЦИИ:
- Инстансирование: ${detailedStats.optimization.totalObjects > 0 ? Math.round(detailedStats.optimization.instancedObjects / detailedStats.optimization.totalObjects * 100) : 0}%
- Отсечение: ${detailedStats.culling.cullingEfficiency}%
- Переиспользование ресурсов: ${detailedStats.optimization.reusedResources > 0 ? Math.round(detailedStats.optimization.reusedResources / (detailedStats.resources.geometries + detailedStats.resources.materials) * 100) : 0}%

ДЕТАЛЬНЫЕ ОТЧЕТЫ:

${this.frustumCullingManager.generateReport()}

${this.instancedRenderingManager.generateReport()}

${this.resourceManager.generateReport()}

${this.performanceMonitor.generateReport()}

НАСТРОЙКИ ОПТИМИЗАЦИИ:
- Инстансированный рендеринг: ${this.config.enableInstancedRendering ? 'включен' : 'отключен'}
- Frustum culling: ${this.config.enableFrustumCulling ? 'включен' : 'отключен'}
- Оптимизация ресурсов: ${this.config.enableResourceOptimization ? 'включена' : 'отключена'}
- Мониторинг производительности: ${this.config.enablePerformanceMonitoring ? 'включен' : 'отключен'}
- Автооптимизация: ${this.config.autoOptimization ? 'включена' : 'отключена'}
- Целевой FPS: ${this.config.targetFps}

============================================================
    `.trim();
  }

  /**
   * Освобождает все ресурсы
   */
  public dispose(): void {
    console.log('🗑️ Освобождение ресурсов PerformanceOptimizer...');
    
    this.frustumCullingManager.dispose();
    this.instancedRenderingManager.dispose();
    this.resourceManager.dispose();
    this.performanceMonitor.dispose();
    
    this.onWarningCallback = undefined;
    this.onStatsUpdateCallback = undefined;
    
    console.log('✅ Ресурсы PerformanceOptimizer освобождены');
  }
}