import * as THREE from 'three';
import { ProcessedTrack } from '../../types';
import { CrystalTrack } from '../types';

/**
 * Система пульсации кристаллов
 * Управляет ритмичной пульсацией кристаллов на основе BPM и энергии треков
 */
export class CrystalPulseSystem {
  private crystalTracks: CrystalTrack[] = [];
  private scene?: THREE.Scene;
  private pulseGroups: Map<string, CrystalTrack[]> = new Map(); // Группы для синхронизации
  private globalTime: number = 0;
  private enabled: boolean = true;

  // Конфигурация пульсации
  private static readonly CONFIG = {
    defaultBPM: 120,              // BPM по умолчанию
    minPulseSpeed: 0.5,           // Минимальная скорость пульсации (Hz)
    maxPulseSpeed: 4.0,           // Максимальная скорость пульсации (Hz)
    baseAmplitude: 0.15,          // Базовая амплитуда пульсации
    maxAmplitude: 0.4,            // Максимальная амплитуда пульсации
    energyInfluence: 0.3,         // Влияние энергии на амплитуду (0-1)
    popularityInfluence: 0.2,     // Влияние популярности на амплитуду (0-1)
    syncThreshold: 5,             // Порог BPM для синхронизации (±5 BPM)
    phaseVariation: 0.3,          // Вариация фазы для естественности
    genrePulseModifiers: {        // Модификаторы пульсации для жанров
      metal: { speedMultiplier: 1.2, amplitudeMultiplier: 1.3, sharpness: 1.4 },
      rock: { speedMultiplier: 1.1, amplitudeMultiplier: 1.1, sharpness: 1.2 },
      punk: { speedMultiplier: 1.4, amplitudeMultiplier: 1.2, sharpness: 1.5 },
      electronic: { speedMultiplier: 1.0, amplitudeMultiplier: 0.9, sharpness: 0.8 },
      jazz: { speedMultiplier: 0.8, amplitudeMultiplier: 0.8, sharpness: 0.7 },
      classical: { speedMultiplier: 0.7, amplitudeMultiplier: 0.7, sharpness: 0.6 },
      pop: { speedMultiplier: 1.0, amplitudeMultiplier: 1.0, sharpness: 1.0 },
      indie: { speedMultiplier: 0.9, amplitudeMultiplier: 0.9, sharpness: 0.9 },
      default: { speedMultiplier: 1.0, amplitudeMultiplier: 1.0, sharpness: 1.0 }
    }
  };

  initialize(scene: THREE.Scene, crystalTracks: CrystalTrack[]): void {
    console.log('💓 Initializing Crystal Pulse System...');
    
    this.scene = scene;
    this.crystalTracks = crystalTracks;
    this.globalTime = 0;
    
    // Инициализируем пульсацию для всех кристаллов
    this.initializePulsation();
    
    // Создаем группы синхронизации
    this.createSyncGroups();
    
    console.log(`✅ Crystal Pulse System initialized for ${crystalTracks.length} crystals`);
    this.logPulseStats();
  }

  /**
   * Инициализирует параметры пульсации для всех кристаллов
   */
  private initializePulsation(): void {
    this.crystalTracks.forEach(crystal => {
      // Устанавливаем базовые параметры пульсации
      this.setPulsationFromBPM(crystal, this.extractBPMFromTrack(crystal));
      
      // Добавляем случайную фазу для естественности
      crystal.pulsePhase = Math.random() * Math.PI * 2;
      
      // Модифицируем параметры на основе жанра
      this.applyGenreModifiers(crystal);
    });
  }

  /**
   * Устанавливает параметры пульсации на основе BPM трека
   */
  setPulsationFromBPM(crystal: CrystalTrack, bpm?: number): void {
    const genreModifier = this.getGenreModifier(crystal.genre);
    
    if (bpm && bpm > 0) {
      // Конвертируем BPM в частоту пульсации (Hz)
      const baseFrequency = (bpm / 60) * genreModifier.speedMultiplier;
      crystal.pulseSpeed = Math.max(
        CrystalPulseSystem.CONFIG.minPulseSpeed,
        Math.min(CrystalPulseSystem.CONFIG.maxPulseSpeed, baseFrequency)
      );
      
      console.log(`🎵 Set BPM-based pulsation for "${crystal.name}": ${bpm} BPM → ${crystal.pulseSpeed.toFixed(2)} Hz`);
    } else {
      // Fallback на энергию трека (популярность как прокси)
      const energyFactor = crystal.popularity / 100;
      const baseFrequency = (CrystalPulseSystem.CONFIG.minPulseSpeed + 
                           energyFactor * (CrystalPulseSystem.CONFIG.maxPulseSpeed - CrystalPulseSystem.CONFIG.minPulseSpeed)) 
                           * genreModifier.speedMultiplier;
      
      crystal.pulseSpeed = baseFrequency;
      
      console.log(`⚡ Set energy-based pulsation for "${crystal.name}": ${crystal.popularity}% energy → ${crystal.pulseSpeed.toFixed(2)} Hz`);
    }
    
    // Устанавливаем амплитуду на основе популярности и энергии
    const popularityFactor = crystal.popularity / 100;
    const energyFactor = this.calculateEnergyFactor(crystal);
    
    crystal.pulseAmplitude = (CrystalPulseSystem.CONFIG.baseAmplitude + 
                             (popularityFactor * CrystalPulseSystem.CONFIG.popularityInfluence) +
                             (energyFactor * CrystalPulseSystem.CONFIG.energyInfluence)) 
                             * genreModifier.amplitudeMultiplier;
    
    crystal.pulseAmplitude = Math.min(CrystalPulseSystem.CONFIG.maxAmplitude, crystal.pulseAmplitude);
  }

  /**
   * Создает группы синхронизации для треков с похожим BPM
   */
  private createSyncGroups(): void {
    this.pulseGroups.clear();
    
    // Группируем кристаллы по похожему BPM для синхронизации
    const bpmGroups: { [key: string]: CrystalTrack[] } = {};
    
    this.crystalTracks.forEach(crystal => {
      const bpm = this.extractBPMFromTrack(crystal);
      if (bpm) {
        // Округляем BPM до ближайшего значения с учетом порога синхронизации
        const groupBPM = Math.round(bpm / CrystalPulseSystem.CONFIG.syncThreshold) * CrystalPulseSystem.CONFIG.syncThreshold;
        const groupKey = `bpm_${groupBPM}`;
        
        if (!bpmGroups[groupKey]) {
          bpmGroups[groupKey] = [];
        }
        bpmGroups[groupKey].push(crystal);
      }
    });
    
    // Создаем группы синхронизации
    Object.entries(bpmGroups).forEach(([groupKey, crystals]) => {
      if (crystals.length > 1) {
        this.pulseGroups.set(groupKey, crystals);
        
        // Синхронизируем фазы в группе
        this.synchronizeGroup(crystals);
        
        console.log(`🔗 Created sync group "${groupKey}" with ${crystals.length} crystals`);
      }
    });
  }

  /**
   * Синхронизирует фазы пульсации в группе кристаллов
   */
  private synchronizeGroup(crystals: CrystalTrack[]): void {
    if (crystals.length === 0) return;
    
    // Используем фазу первого кристалла как базовую
    const basePhase = crystals[0].pulsePhase;
    
    crystals.forEach((crystal, index) => {
      if (index > 0) {
        // Добавляем небольшую вариацию для естественности
        const phaseVariation = (Math.random() - 0.5) * CrystalPulseSystem.CONFIG.phaseVariation;
        crystal.pulsePhase = basePhase + phaseVariation;
      }
    });
  }

  /**
   * Обновляет пульсацию всех кристаллов
   */
  updatePulsation(deltaTime: number): void {
    if (!this.enabled || this.crystalTracks.length === 0) {
      return;
    }
    
    this.globalTime += deltaTime * 0.001; // Конвертируем в секунды
    
    this.crystalTracks.forEach(crystal => {
      this.updateCrystalPulsation(crystal, this.globalTime);
    });
  }

  /**
   * Обновляет пульсацию отдельного кристалла
   */
  private updateCrystalPulsation(crystal: CrystalTrack, time: number): void {
    if (!this.scene) return;
    
    // Находим mesh кристалла в сцене
    const mesh = this.findCrystalMesh(crystal.id);
    if (!mesh) return;
    
    // Вычисляем пульсацию
    const pulseValue = this.calculatePulseValue(crystal, time);
    
    // Обновляем материал если это CrystalShaderMaterial
    if (mesh.material && 'updateTime' in mesh.material) {
      const shaderMaterial = mesh.material as any; // CrystalShaderMaterial
      
      // Обновляем время для анимации шейдера
      shaderMaterial.updateTime(time);
      
      // Обновляем позицию камеры для fresnel эффектов
      if (this.scene && this.scene.userData.camera) {
        shaderMaterial.updateCameraPosition(this.scene.userData.camera.position);
      }
      
      // Обновляем глобальную пульсацию
      shaderMaterial.updateGlobalPulse(pulseValue);
    }
    
    // Применяем небольшую пульсацию к масштабу для дополнительного эффекта
    const scale = 1.0 + pulseValue * crystal.pulseAmplitude * 0.1; // Уменьшенный эффект, так как основная пульсация в шейдере
    mesh.scale.setScalar(scale);
  }

  /**
   * Вычисляет значение пульсации для кристалла
   */
  private calculatePulseValue(crystal: CrystalTrack, time: number): number {
    const genreModifier = this.getGenreModifier(crystal.genre);
    
    // Базовая синусоидальная пульсация
    const basePhase = time * crystal.pulseSpeed * 2 * Math.PI + crystal.pulsePhase;
    let pulseValue = Math.sin(basePhase);
    
    // Применяем остроту жанра (делаем пульсацию более резкой для металла/панка)
    if (genreModifier.sharpness > 1.0) {
      pulseValue = Math.sign(pulseValue) * Math.pow(Math.abs(pulseValue), 1 / genreModifier.sharpness);
    }
    
    // Добавляем гармоники для более сложной пульсации
    const harmonic = Math.sin(basePhase * 2) * 0.2;
    pulseValue += harmonic;
    
    // Нормализуем к диапазону -1 до 1
    return Math.max(-1, Math.min(1, pulseValue));
  }

  /**
   * Извлекает BPM из данных трека (заглушка - в реальности будет из метаданных)
   */
  private extractBPMFromTrack(track: ProcessedTrack): number | undefined {
    // В реальной реализации это будет извлекаться из метаданных трека
    // Пока используем эвристику на основе жанра и длительности
    
    const genreBPMRanges: { [genre: string]: { min: number; max: number } } = {
      metal: { min: 120, max: 180 },
      rock: { min: 100, max: 140 },
      punk: { min: 140, max: 200 },
      electronic: { min: 120, max: 140 },
      jazz: { min: 80, max: 120 },
      classical: { min: 60, max: 100 },
      pop: { min: 100, max: 130 },
      indie: { min: 90, max: 120 }
    };
    
    const range = genreBPMRanges[track.genre.toLowerCase()] || { min: 100, max: 130 };
    
    // Используем хэш ID трека для консистентного BPM
    const hash = this.hashString(track.id);
    const normalizedHash = (hash % 1000) / 1000; // 0-1
    
    return Math.round(range.min + normalizedHash * (range.max - range.min));
  }

  /**
   * Вычисляет фактор энергии трека
   */
  private calculateEnergyFactor(track: ProcessedTrack): number {
    // Комбинируем популярность и характеристики жанра
    const popularityFactor = track.popularity / 100;
    const genreEnergyMap: { [genre: string]: number } = {
      metal: 0.9,
      punk: 0.95,
      rock: 0.8,
      electronic: 0.7,
      pop: 0.6,
      indie: 0.5,
      jazz: 0.4,
      classical: 0.3
    };
    
    const genreEnergy = genreEnergyMap[track.genre.toLowerCase()] || 0.5;
    return (popularityFactor * 0.6) + (genreEnergy * 0.4);
  }

  /**
   * Получает модификатор жанра для пульсации
   */
  private getGenreModifier(genre: string): typeof CrystalPulseSystem.CONFIG.genrePulseModifiers.default {
    const normalizedGenre = genre.toLowerCase();
    const modifiers = CrystalPulseSystem.CONFIG.genrePulseModifiers as { [key: string]: typeof CrystalPulseSystem.CONFIG.genrePulseModifiers.default };
    return modifiers[normalizedGenre] || CrystalPulseSystem.CONFIG.genrePulseModifiers.default;
  }

  /**
   * Находит mesh кристалла в сцене по ID
   */
  private findCrystalMesh(trackId: string): THREE.Mesh | undefined {
    if (!this.scene) return undefined;
    
    let foundMesh: THREE.Mesh | undefined;
    
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && 
          object.userData.trackId === trackId && 
          object.userData.isCrystal) {
        foundMesh = object;
      }
    });
    
    return foundMesh;
  }

  /**
   * Создает хэш строки для консистентной генерации
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Логирует статистику пульсации
   */
  private logPulseStats(): void {
    const genreStats: { [genre: string]: { count: number; avgSpeed: number; avgAmplitude: number } } = {};
    
    this.crystalTracks.forEach(crystal => {
      if (!genreStats[crystal.genre]) {
        genreStats[crystal.genre] = { count: 0, avgSpeed: 0, avgAmplitude: 0 };
      }
      
      genreStats[crystal.genre].count++;
      genreStats[crystal.genre].avgSpeed += crystal.pulseSpeed;
      genreStats[crystal.genre].avgAmplitude += crystal.pulseAmplitude;
    });
    
    console.log('📊 Crystal Pulse Statistics:');
    console.log(`  Sync groups: ${this.pulseGroups.size}`);
    console.log('  Genre pulse characteristics:');
    
    Object.entries(genreStats).forEach(([genre, stats]) => {
      const avgSpeed = (stats.avgSpeed / stats.count).toFixed(2);
      const avgAmplitude = (stats.avgAmplitude / stats.count).toFixed(3);
      console.log(`    ${genre}: ${stats.count} crystals, ${avgSpeed} Hz avg, ${avgAmplitude} amplitude avg`);
    });
  }

  // Публичные методы управления

  /**
   * Включает/выключает систему пульсации
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`💓 Crystal pulse system ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Устанавливает глобальный множитель скорости пульсации
   */
  setGlobalSpeedMultiplier(multiplier: number): void {
    this.crystalTracks.forEach(crystal => {
      crystal.pulseSpeed *= multiplier;
    });
    console.log(`⚡ Applied global speed multiplier: ${multiplier}`);
  }

  /**
   * Устанавливает глобальный множитель амплитуды пульсации
   */
  setGlobalAmplitudeMultiplier(multiplier: number): void {
    this.crystalTracks.forEach(crystal => {
      crystal.pulseAmplitude *= multiplier;
      crystal.pulseAmplitude = Math.min(CrystalPulseSystem.CONFIG.maxAmplitude, crystal.pulseAmplitude);
    });
    console.log(`📈 Applied global amplitude multiplier: ${multiplier}`);
  }

  /**
   * Применяет модификаторы жанра к кристаллу
   */
  private applyGenreModifiers(crystal: CrystalTrack): void {
    const modifier = this.getGenreModifier(crystal.genre);
    
    crystal.pulseSpeed *= modifier.speedMultiplier;
    crystal.pulseAmplitude *= modifier.amplitudeMultiplier;
    
    // Ограничиваем значения допустимыми диапазонами
    crystal.pulseSpeed = Math.max(
      CrystalPulseSystem.CONFIG.minPulseSpeed,
      Math.min(CrystalPulseSystem.CONFIG.maxPulseSpeed, crystal.pulseSpeed)
    );
    
    crystal.pulseAmplitude = Math.min(CrystalPulseSystem.CONFIG.maxAmplitude, crystal.pulseAmplitude);
  }

  /**
   * Возвращает статистику системы пульсации
   */
  getPulseStats(): {
    totalCrystals: number;
    syncGroups: number;
    enabled: boolean;
    avgPulseSpeed: number;
    avgAmplitude: number;
  } {
    const totalCrystals = this.crystalTracks.length;
    const avgPulseSpeed = totalCrystals > 0 
      ? this.crystalTracks.reduce((sum, c) => sum + c.pulseSpeed, 0) / totalCrystals 
      : 0;
    const avgAmplitude = totalCrystals > 0 
      ? this.crystalTracks.reduce((sum, c) => sum + c.pulseAmplitude, 0) / totalCrystals 
      : 0;
    
    return {
      totalCrystals,
      syncGroups: this.pulseGroups.size,
      enabled: this.enabled,
      avgPulseSpeed,
      avgAmplitude
    };
  }

  /**
   * Освобождает ресурсы системы пульсации
   */
  dispose(): void {
    console.log('🗑️ Disposing Crystal Pulse System...');
    
    this.crystalTracks = [];
    this.pulseGroups.clear();
    this.scene = undefined;
    this.enabled = false;
    
    console.log('✅ Crystal Pulse System disposed');
  }
}