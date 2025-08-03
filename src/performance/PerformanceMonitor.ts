/**
 * PerformanceMonitor - мониторинг производительности и FPS
 * Отслеживает производительность рендеринга и предупреждает о проблемах
 */

import * as THREE from 'three';

export interface PerformanceStats {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  programs: number;
}

export interface PerformanceWarning {
  type: 'low_fps' | 'high_memory' | 'high_draw_calls' | 'high_triangles';
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
}

export class PerformanceMonitor {
  private renderer: THREE.WebGLRenderer;
  private stats: PerformanceStats;
  private frameCount: number = 0;
  private lastTime: number = 0;
  private fpsHistory: number[] = [];
  private warnings: PerformanceWarning[] = [];
  private onWarningCallback?: (warning: PerformanceWarning) => void;
  private onStatsUpdateCallback?: (stats: PerformanceStats) => void;
  
  // Пороговые значения для предупреждений
  private readonly thresholds = {
    minFps: 30,
    criticalFps: 15,
    maxMemoryMB: 512,
    maxDrawCalls: 1000,
    maxTriangles: 500000
  };
  
  // Настройки мониторинга
  private readonly config = {
    historySize: 60, // Хранить историю FPS за последние 60 кадров
    warningCooldown: 5000, // Минимальный интервал между одинаковыми предупреждениями (мс)
    updateInterval: 1000 // Интервал обновления статистики (мс)
  };
  
  private lastWarningTimes: Map<string, number> = new Map();
  private lastUpdateTime: number = 0;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.stats = this.createEmptyStats();
    this.lastTime = performance.now();
  }

  /**
   * Создает пустую структуру статистики
   */
  private createEmptyStats(): PerformanceStats {
    return {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      drawCalls: 0,
      triangles: 0,
      geometries: 0,
      textures: 0,
      programs: 0
    };
  }

  /**
   * Обновляет статистику производительности
   * Должно вызываться каждый кадр
   */
  public update(): void {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    
    this.frameCount++;
    
    // Обновляем FPS
    const fps = 1000 / deltaTime;
    this.fpsHistory.push(fps);
    
    // Ограничиваем размер истории
    if (this.fpsHistory.length > this.config.historySize) {
      this.fpsHistory.shift();
    }
    
    // Обновляем статистику с заданным интервалом
    if (currentTime - this.lastUpdateTime >= this.config.updateInterval) {
      this.updateStats(currentTime, deltaTime);
      this.checkForWarnings();
      this.lastUpdateTime = currentTime;
      
      // Вызываем коллбэк обновления статистики
      if (this.onStatsUpdateCallback) {
        this.onStatsUpdateCallback(this.stats);
      }
    }
    
    this.lastTime = currentTime;
  }

  /**
   * Обновляет детальную статистику
   */
  private updateStats(currentTime: number, deltaTime: number): void {
    // Вычисляем средний FPS за последние кадры
    const avgFps = this.fpsHistory.length > 0 
      ? this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length 
      : 0;
    
    // Получаем информацию о рендерере
    const renderInfo = this.renderer.info;
    
    // Обновляем статистику
    this.stats = {
      fps: Math.round(avgFps * 10) / 10,
      frameTime: Math.round(deltaTime * 100) / 100,
      memoryUsage: this.getMemoryUsage(),
      drawCalls: renderInfo.render.calls,
      triangles: renderInfo.render.triangles,
      geometries: renderInfo.memory.geometries,
      textures: renderInfo.memory.textures,
      programs: renderInfo.programs?.length || 0
    };
  }

  /**
   * Получает использование памяти (если доступно)
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024 * 10) / 10; // MB
    }
    return 0;
  }

  /**
   * Проверяет пороговые значения и генерирует предупреждения
   */
  private checkForWarnings(): void {
    const currentTime = performance.now();
    
    // Проверка FPS
    if (this.stats.fps < this.thresholds.criticalFps) {
      this.addWarning('low_fps', 
        `Критически низкий FPS: ${this.stats.fps}. Рекомендуется снизить качество графики.`,
        'high', currentTime);
    } else if (this.stats.fps < this.thresholds.minFps) {
      this.addWarning('low_fps', 
        `Низкий FPS: ${this.stats.fps}. Возможны проблемы с производительностью.`,
        'medium', currentTime);
    }
    
    // Проверка памяти
    if (this.stats.memoryUsage > this.thresholds.maxMemoryMB) {
      this.addWarning('high_memory', 
        `Высокое использование памяти: ${this.stats.memoryUsage}MB. Возможны утечки памяти.`,
        'high', currentTime);
    }
    
    // Проверка количества вызовов отрисовки
    if (this.stats.drawCalls > this.thresholds.maxDrawCalls) {
      this.addWarning('high_draw_calls', 
        `Слишком много вызовов отрисовки: ${this.stats.drawCalls}. Рекомендуется использовать instanced rendering.`,
        'medium', currentTime);
    }
    
    // Проверка количества треугольников
    if (this.stats.triangles > this.thresholds.maxTriangles) {
      this.addWarning('high_triangles', 
        `Слишком много треугольников: ${this.stats.triangles}. Рекомендуется упростить геометрию.`,
        'medium', currentTime);
    }
  }

  /**
   * Добавляет предупреждение с проверкой на дублирование
   */
  private addWarning(type: PerformanceWarning['type'], message: string, severity: PerformanceWarning['severity'], timestamp: number): void {
    const warningKey = `${type}_${severity}`;
    const lastWarningTime = this.lastWarningTimes.get(warningKey) || 0;
    
    // Проверяем, прошло ли достаточно времени с последнего предупреждения этого типа
    if (timestamp - lastWarningTime >= this.config.warningCooldown) {
      const warning: PerformanceWarning = {
        type,
        message,
        severity,
        timestamp
      };
      
      this.warnings.push(warning);
      this.lastWarningTimes.set(warningKey, timestamp);
      
      // Ограничиваем количество сохраненных предупреждений
      if (this.warnings.length > 50) {
        this.warnings.shift();
      }
      
      // Вызываем коллбэк предупреждения
      if (this.onWarningCallback) {
        this.onWarningCallback(warning);
      }
      
      console.warn(`[PerformanceMonitor] ${severity.toUpperCase()}: ${message}`);
    }
  }

  /**
   * Получает текущую статистику производительности
   */
  public getStats(): PerformanceStats {
    return { ...this.stats };
  }

  /**
   * Получает историю FPS
   */
  public getFpsHistory(): number[] {
    return [...this.fpsHistory];
  }

  /**
   * Получает все предупреждения
   */
  public getWarnings(): PerformanceWarning[] {
    return [...this.warnings];
  }

  /**
   * Получает последние предупреждения за указанный период
   */
  public getRecentWarnings(periodMs: number = 60000): PerformanceWarning[] {
    const cutoffTime = performance.now() - periodMs;
    return this.warnings.filter(warning => warning.timestamp >= cutoffTime);
  }

  /**
   * Очищает все предупреждения
   */
  public clearWarnings(): void {
    this.warnings = [];
    this.lastWarningTimes.clear();
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
  public setOnStatsUpdate(callback: (stats: PerformanceStats) => void): void {
    this.onStatsUpdateCallback = callback;
  }

  /**
   * Обновляет пороговые значения
   */
  public updateThresholds(newThresholds: Partial<typeof this.thresholds>): void {
    Object.assign(this.thresholds, newThresholds);
  }

  /**
   * Получает текущие пороговые значения
   */
  public getThresholds(): typeof this.thresholds {
    return { ...this.thresholds };
  }

  /**
   * Сбрасывает статистику
   */
  public reset(): void {
    this.frameCount = 0;
    this.fpsHistory = [];
    this.stats = this.createEmptyStats();
    this.lastTime = performance.now();
    this.lastUpdateTime = 0;
  }

  /**
   * Создает отчет о производительности
   */
  public generateReport(): string {
    const recentWarnings = this.getRecentWarnings();
    const avgFps = this.fpsHistory.length > 0 
      ? this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length 
      : 0;
    
    return `
=== Отчет о производительности ===
Средний FPS: ${avgFps.toFixed(1)}
Текущий FPS: ${this.stats.fps}
Время кадра: ${this.stats.frameTime}ms
Использование памяти: ${this.stats.memoryUsage}MB
Вызовы отрисовки: ${this.stats.drawCalls}
Треугольники: ${this.stats.triangles}
Геометрии: ${this.stats.geometries}
Текстуры: ${this.stats.textures}
Шейдерные программы: ${this.stats.programs}

Предупреждения за последнюю минуту: ${recentWarnings.length}
${recentWarnings.map(w => `- ${w.severity.toUpperCase()}: ${w.message}`).join('\n')}
=====================================
    `.trim();
  }

  /**
   * Освобождает ресурсы
   */
  public dispose(): void {
    this.warnings = [];
    this.fpsHistory = [];
    this.lastWarningTimes.clear();
    this.onWarningCallback = undefined;
    this.onStatsUpdateCallback = undefined;
  }
}