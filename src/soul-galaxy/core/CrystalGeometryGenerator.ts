import * as THREE from 'three';
import { ProcessedTrack } from '../../types';

/**
 * Генератор процедурной кристаллической геометрии
 * Создает уникальные неровные грани кристаллов с использованием алгоритмов деформации
 */
export class CrystalGeometryGenerator {
  // Конфигурация генерации
  private static readonly CONFIG = {
    baseComplexity: 1,        // Базовая сложность геометрии (subdivisions)
    maxComplexity: 3,         // Максимальная сложность для популярных треков
    deformationStrength: 0.3, // Сила деформации (0-1)
    facetVariation: 0.4,      // Вариация размера граней
    sharpnessVariation: 0.6,  // Вариация остроты граней
    genreShapeFactors: {      // Факторы формы для разных жанров
      metal: { elongation: 1.2, sharpness: 1.4, roughness: 1.3 },
      rock: { elongation: 1.1, sharpness: 1.2, roughness: 1.1 },
      punk: { elongation: 0.9, sharpness: 1.5, roughness: 1.4 },
      electronic: { elongation: 1.3, sharpness: 0.8, roughness: 0.7 },
      jazz: { elongation: 1.0, sharpness: 0.9, roughness: 0.8 },
      classical: { elongation: 1.1, sharpness: 0.7, roughness: 0.6 },
      pop: { elongation: 1.0, sharpness: 1.0, roughness: 0.9 },
      indie: { elongation: 1.0, sharpness: 1.1, roughness: 1.0 },
      default: { elongation: 1.0, sharpness: 1.0, roughness: 1.0 }
    }
  };

  /**
   * Генерирует уникальную кристаллическую геометрию для трека
   */
  static generateCrystalGeometry(track: ProcessedTrack): THREE.BufferGeometry {
    console.log(`🔮 Generating crystal geometry for "${track.name}" (${track.genre})`);

    // Определяем сложность на основе популярности
    const complexity = this.calculateComplexity(track);
    
    // Получаем факторы формы для жанра
    const shapeFactors = this.getGenreShapeFactors(track.genre);
    
    // Создаем базовую геометрию
    const baseGeometry = this.createBaseGeometry(track.size, complexity);
    
    // Применяем деформации для создания уникальной формы
    this.applyGenreDeformation(baseGeometry, shapeFactors, track);
    
    // Добавляем случайные вариации для уникальности
    this.applyRandomVariations(baseGeometry, track);
    
    // Оптимизируем геометрию
    this.optimizeGeometry(baseGeometry);
    
    console.log(`✅ Crystal geometry generated: ${baseGeometry.attributes.position.count} vertices`);
    return baseGeometry;
  }

  /**
   * Вычисляет сложность геометрии на основе характеристик трека
   */
  private static calculateComplexity(track: ProcessedTrack): number {
    // Популярные треки получают более сложную геометрию
    const popularityFactor = track.popularity / 100;
    
    // Длинные треки получают немного больше деталей
    const durationFactor = Math.min(1, track.duration / 300); // 5 минут = максимум
    
    // Комбинируем факторы
    const complexityFactor = (popularityFactor * 0.7) + (durationFactor * 0.3);
    
    const complexity = this.CONFIG.baseComplexity + 
                      Math.floor(complexityFactor * (this.CONFIG.maxComplexity - this.CONFIG.baseComplexity));
    
    return Math.max(this.CONFIG.baseComplexity, Math.min(this.CONFIG.maxComplexity, complexity));
  }

  /**
   * Получает факторы формы для указанного жанра
   */
  private static getGenreShapeFactors(genre: string): typeof CrystalGeometryGenerator.CONFIG.genreShapeFactors.default {
    const normalizedGenre = genre.toLowerCase();
    const shapeFactors = this.CONFIG.genreShapeFactors as { [key: string]: typeof CrystalGeometryGenerator.CONFIG.genreShapeFactors.default };
    return shapeFactors[normalizedGenre] || this.CONFIG.genreShapeFactors.default;
  }

  /**
   * Создает базовую геометрию кристалла
   */
  private static createBaseGeometry(size: number, complexity: number): THREE.BufferGeometry {
    // Используем икосаэдр как основу для кристалла (20 граней)
    const geometry = new THREE.IcosahedronGeometry(size, complexity);
    
    // Добавляем дополнительные атрибуты для деформации
    this.addCustomAttributes(geometry);
    
    return geometry;
  }

  /**
   * Добавляет кастомные атрибуты к геометрии для дальнейшей обработки
   */
  private static addCustomAttributes(geometry: THREE.BufferGeometry): void {
    const positionAttribute = geometry.attributes.position;
    const normalAttribute = geometry.attributes.normal;
    const vertexCount = positionAttribute.count;
    
    // Атрибут для хранения исходных позиций (для анимации)
    const originalPositions = new Float32Array(vertexCount * 3);
    originalPositions.set(positionAttribute.array as Float32Array);
    geometry.setAttribute('originalPosition', new THREE.BufferAttribute(originalPositions, 3));
    
    // Атрибут для случайных значений (для процедурной генерации)
    const randomValues = new Float32Array(vertexCount);
    for (let i = 0; i < vertexCount; i++) {
      randomValues[i] = Math.random();
    }
    geometry.setAttribute('randomValue', new THREE.BufferAttribute(randomValues, 1));
    
    // Атрибут для расстояния от центра
    const distances = new Float32Array(vertexCount);
    const positions = positionAttribute.array as Float32Array;
    for (let i = 0; i < vertexCount; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      distances[i] = Math.sqrt(x * x + y * y + z * z);
    }
    geometry.setAttribute('distanceFromCenter', new THREE.BufferAttribute(distances, 1));
    
    // Атрибут для фазы пульсации (случайная для каждой вершины)
    const pulsePhases = new Float32Array(vertexCount);
    for (let i = 0; i < vertexCount; i++) {
      pulsePhases[i] = Math.random() * Math.PI * 2;
    }
    geometry.setAttribute('pulsePhase', new THREE.BufferAttribute(pulsePhases, 1));
    
    // Атрибут для BPM множителя (единица по умолчанию, будет обновляться)
    const bpmMultipliers = new Float32Array(vertexCount);
    for (let i = 0; i < vertexCount; i++) {
      bpmMultipliers[i] = 1.0;
    }
    geometry.setAttribute('bpmMultiplier', new THREE.BufferAttribute(bpmMultipliers, 1));
    
    // Атрибут для нормалей граней (копируем vertex normals)
    const facetNormals = new Float32Array(vertexCount * 3);
    if (normalAttribute) {
      facetNormals.set(normalAttribute.array as Float32Array);
    } else {
      // Если нормали еще не вычислены, создаем временные
      geometry.computeVertexNormals();
      const computedNormals = geometry.attributes.normal.array as Float32Array;
      facetNormals.set(computedNormals);
    }
    geometry.setAttribute('facetNormal', new THREE.BufferAttribute(facetNormals, 3));
  }

  /**
   * Применяет деформации на основе жанра
   */
  private static applyGenreDeformation(
    geometry: THREE.BufferGeometry, 
    shapeFactors: typeof CrystalGeometryGenerator.CONFIG.genreShapeFactors.default,
    track: ProcessedTrack
  ): void {
    const positions = geometry.attributes.position.array as Float32Array;
    const randomValues = geometry.attributes.randomValue.array as Float32Array;
    const distances = geometry.attributes.distanceFromCenter.array as Float32Array;
    
    for (let i = 0; i < positions.length; i += 3) {
      const vertexIndex = i / 3;
      const random = randomValues[vertexIndex];
      const distance = distances[vertexIndex];
      
      // Получаем текущую позицию
      let x = positions[i];
      let y = positions[i + 1];
      let z = positions[i + 2];
      
      // Применяем удлинение (для металла и электроники)
      if (shapeFactors.elongation !== 1.0) {
        y *= shapeFactors.elongation;
      }
      
      // Применяем остроту (делаем грани более острыми)
      if (shapeFactors.sharpness > 1.0) {
        const sharpnessFactor = 1.0 + (shapeFactors.sharpness - 1.0) * random;
        const length = Math.sqrt(x * x + y * y + z * z);
        if (length > 0) {
          const normalizedX = x / length;
          const normalizedY = y / length;
          const normalizedZ = z / length;
          
          x = normalizedX * length * sharpnessFactor;
          y = normalizedY * length * sharpnessFactor;
          z = normalizedZ * length * sharpnessFactor;
        }
      }
      
      // Применяем шероховатость (случайные деформации)
      if (shapeFactors.roughness > 1.0) {
        const roughnessFactor = (random - 0.5) * this.CONFIG.deformationStrength * shapeFactors.roughness;
        const length = Math.sqrt(x * x + y * y + z * z);
        
        x += x * roughnessFactor;
        y += y * roughnessFactor;
        z += z * roughnessFactor;
      }
      
      // Обновляем позицию
      positions[i] = x;
      positions[i + 1] = y;
      positions[i + 2] = z;
    }
    
    geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Применяет случайные вариации для уникальности каждого кристалла
   */
  private static applyRandomVariations(geometry: THREE.BufferGeometry, track: ProcessedTrack): void {
    const positions = geometry.attributes.position.array as Float32Array;
    const randomValues = geometry.attributes.randomValue.array as Float32Array;
    
    // Создаем уникальный seed на основе ID трека
    const seed = this.hashString(track.id);
    const rng = this.createSeededRandom(seed);
    
    for (let i = 0; i < positions.length; i += 3) {
      const vertexIndex = i / 3;
      const baseRandom = randomValues[vertexIndex];
      
      // Используем seeded random для консистентности
      const seededRandom = rng();
      
      // Применяем вариации граней
      const facetVariation = (seededRandom - 0.5) * this.CONFIG.facetVariation;
      const variationFactor = 1.0 + facetVariation * baseRandom;
      
      positions[i] *= variationFactor;
      positions[i + 1] *= variationFactor;
      positions[i + 2] *= variationFactor;
    }
    
    geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Оптимизирует геометрию для производительности
   */
  private static optimizeGeometry(geometry: THREE.BufferGeometry): void {
    // Пересчитываем нормали после деформации
    geometry.computeVertexNormals();
    
    // Вычисляем bounding sphere для оптимизации culling
    geometry.computeBoundingSphere();
    
    // Удаляем дублирующиеся вершины (если есть)
    // geometry.mergeVertices(); // Может нарушить UV mapping, используем осторожно
    
    // Оптимизируем индексы для лучшей производительности GPU
    if (!geometry.index) {
      geometry = geometry.toNonIndexed();
    }
  }

  /**
   * Создает хэш строки для генерации seed
   */
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Преобразуем в 32-битное число
    }
    return Math.abs(hash);
  }

  /**
   * Создает генератор псевдослучайных чисел с seed
   */
  private static createSeededRandom(seed: number): () => number {
    let state = seed;
    return function() {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }

  /**
   * Создает геометрию кристалла с учетом всех параметров трека
   */
  static createAdvancedCrystalGeometry(track: ProcessedTrack): {
    geometry: THREE.BufferGeometry;
    facetCount: number;
    roughnessLevel: number;
  } {
    const geometry = this.generateCrystalGeometry(track);
    const shapeFactors = this.getGenreShapeFactors(track.genre);
    
    // Вычисляем количество граней на основе сложности
    const complexity = this.calculateComplexity(track);
    const baseFacets = 20; // Икосаэдр имеет 20 граней
    const facetCount = baseFacets * Math.pow(4, complexity); // Каждое subdivision умножает на 4
    
    // Вычисляем уровень шероховатости
    const roughnessLevel = shapeFactors.roughness * (0.5 + Math.random() * 0.5);
    
    return {
      geometry,
      facetCount,
      roughnessLevel
    };
  }

  /**
   * Создает упрощенную геометрию для LOD (Level of Detail)
   */
  static createLODGeometry(track: ProcessedTrack, lodLevel: number): THREE.BufferGeometry {
    // Уменьшаем сложность для дальних объектов
    const originalComplexity = this.calculateComplexity(track);
    const lodComplexity = Math.max(0, originalComplexity - lodLevel);
    
    // Создаем упрощенную версию
    const geometry = new THREE.IcosahedronGeometry(track.size, lodComplexity);
    
    // Применяем минимальные деформации для сохранения характера
    const shapeFactors = this.getGenreShapeFactors(track.genre);
    const positions = geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < positions.length; i += 3) {
      // Только базовые деформации жанра
      if (shapeFactors.elongation !== 1.0) {
        positions[i + 1] *= shapeFactors.elongation;
      }
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    
    return geometry;
  }

  /**
   * Возвращает статистику генерации геометрии
   */
  static getGeometryStats(geometry: THREE.BufferGeometry): {
    vertexCount: number;
    faceCount: number;
    memoryUsage: number; // в байтах
  } {
    const vertexCount = geometry.attributes.position.count;
    const faceCount = geometry.index ? geometry.index.count / 3 : vertexCount / 3;
    
    // Приблизительный расчет использования памяти
    let memoryUsage = 0;
    Object.values(geometry.attributes).forEach(attribute => {
      memoryUsage += attribute.array.byteLength;
    });
    if (geometry.index) {
      memoryUsage += geometry.index.array.byteLength;
    }
    
    return {
      vertexCount,
      faceCount,
      memoryUsage
    };
  }
}