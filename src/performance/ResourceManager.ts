/**
 * ResourceManager - управление и переиспользование ресурсов
 * Оптимизирует материалы и геометрии для повышения производительности
 */

import * as THREE from 'three';

export interface ResourceStats {
  geometries: number;
  materials: number;
  textures: number;
  memoryUsage: number;
  reusedGeometries: number;
  reusedMaterials: number;
}

export class ResourceManager {
  private geometryCache: Map<string, THREE.BufferGeometry> = new Map();
  private materialCache: Map<string, THREE.Material> = new Map();
  private textureCache: Map<string, THREE.Texture> = new Map();
  
  // Счетчики для статистики
  private stats: ResourceStats = {
    geometries: 0,
    materials: 0,
    textures: 0,
    memoryUsage: 0,
    reusedGeometries: 0,
    reusedMaterials: 0
  };

  /**
   * Получает или создает геометрию для трека
   */
  public getGeometry(genre: string, size: number): THREE.BufferGeometry {
    const key = this.getGeometryKey(genre, size);
    
    if (this.geometryCache.has(key)) {
      this.stats.reusedGeometries++;
      return this.geometryCache.get(key)!;
    }
    
    const geometry = this.createGeometryForGenre(genre, size);
    this.geometryCache.set(key, geometry);
    this.stats.geometries++;
    
    return geometry;
  }

  /**
   * Получает или создает материал для трека
   */
  public getMaterial(genre: string, color: string, popularity: number): THREE.MeshStandardMaterial {
    const key = this.getMaterialKey(genre, color, popularity);
    
    if (this.materialCache.has(key)) {
      this.stats.reusedMaterials++;
      return this.materialCache.get(key)! as THREE.MeshStandardMaterial;
    }
    
    const material = this.createMaterialForTrack(genre, color, popularity);
    this.materialCache.set(key, material);
    this.stats.materials++;
    
    return material;
  }

  /**
   * Получает или создает текстуру
   */
  public getTexture(url: string): Promise<THREE.Texture> {
    if (this.textureCache.has(url)) {
      return Promise.resolve(this.textureCache.get(url)!);
    }
    
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        url,
        (texture) => {
          this.textureCache.set(url, texture);
          this.stats.textures++;
          resolve(texture);
        },
        undefined,
        (error) => {
          console.warn(`Failed to load texture: ${url}`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Создает ключ для кэширования геометрии
   */
  private getGeometryKey(genre: string, size: number): string {
    // Округляем размер для лучшего переиспользования
    const roundedSize = Math.round(size * 10) / 10;
    return `${genre.toLowerCase()}_${roundedSize}`;
  }

  /**
   * Создает ключ для кэширования материала
   */
  private getMaterialKey(genre: string, color: string, popularity: number): string {
    // Группируем популярность в диапазоны для лучшего переиспользования
    const popularityRange = Math.floor(popularity / 20) * 20; // 0-19, 20-39, 40-59, 60-79, 80-99
    return `${genre.toLowerCase()}_${color}_${popularityRange}`;
  }

  /**
   * Создает геометрию в зависимости от жанра
   */
  private createGeometryForGenre(genre: string, size: number): THREE.BufferGeometry {
    const normalizedGenre = genre.toLowerCase();
    
    switch (normalizedGenre) {
      case 'metal':
      case 'rock':
      case 'punk':
        // Конусы для агрессивных жанров
        return new THREE.ConeGeometry(size * 0.8, size * 1.5, 6);
        
      case 'electronic':
      case 'dance':
        // Кубы для электронной музыки
        return new THREE.BoxGeometry(size, size, size);
        
      case 'jazz':
      case 'blues':
        // Цилиндры для джаза и блюза
        return new THREE.CylinderGeometry(size * 0.7, size * 0.7, size * 1.2, 8);
        
      case 'classical':
        // Октаэдры для классической музыки
        return new THREE.OctahedronGeometry(size);
        
      case 'hip-hop':
      case 'rap':
        // Додекаэдры для хип-хопа
        return new THREE.DodecahedronGeometry(size * 0.8);
        
      case 'pop':
      case 'pop-rock':
        // Сферы для поп-музыки
        return new THREE.SphereGeometry(size, 16, 12);
        
      case 'indie':
      case 'alternative':
      default:
        // Икосаэдры (кристаллы) для инди и остальных жанров
        return new THREE.IcosahedronGeometry(size, 1);
    }
  }

  /**
   * Создает материал для трека с учетом его характеристик
   */
  private createMaterialForTrack(genre: string, color: string, popularity: number): THREE.MeshStandardMaterial {
    const threeColor = new THREE.Color(color);
    
    // Настройки материала в зависимости от жанра
    const normalizedGenre = genre.toLowerCase();
    let metalness = 0.3;
    let roughness = 0.4;
    let emissiveIntensity = 0.1;
    
    switch (normalizedGenre) {
      case 'metal':
      case 'rock':
        metalness = 0.8;
        roughness = 0.2;
        emissiveIntensity = 0.15;
        break;
        
      case 'electronic':
      case 'dance':
        metalness = 0.1;
        roughness = 0.1;
        emissiveIntensity = 0.3;
        break;
        
      case 'jazz':
      case 'blues':
        metalness = 0.6;
        roughness = 0.6;
        emissiveIntensity = 0.05;
        break;
        
      case 'classical':
        metalness = 0.1;
        roughness = 0.8;
        emissiveIntensity = 0.02;
        break;
        
      case 'pop':
      case 'pop-rock':
        metalness = 0.2;
        roughness = 0.3;
        emissiveIntensity = 0.2;
        break;
    }
    
    // Модифицируем свойства на основе популярности
    const popularityFactor = popularity / 100;
    emissiveIntensity *= (0.5 + popularityFactor * 0.5); // Более популярные треки светятся ярче
    
    // Создаем материал
    const material = new THREE.MeshStandardMaterial({
      color: threeColor,
      metalness: metalness,
      roughness: roughness,
      emissive: threeColor.clone().multiplyScalar(0.3),
      emissiveIntensity: emissiveIntensity,
      transparent: false,
      opacity: 1.0
    });
    
    return material;
  }

  /**
   * Создает набор оптимизированных материалов для всех жанров
   */
  public preloadMaterials(genres: string[], colors: string[]): void {
    console.log('🎨 Предзагрузка материалов...');
    
    const popularityRanges = [0, 20, 40, 60, 80];
    
    genres.forEach(genre => {
      colors.forEach(color => {
        popularityRanges.forEach(popularity => {
          this.getMaterial(genre, color, popularity);
        });
      });
    });
    
    console.log(`✅ Предзагружено ${this.stats.materials} материалов`);
  }

  /**
   * Создает набор оптимизированных геометрий для всех жанров
   */
  public preloadGeometries(genres: string[], sizes: number[]): void {
    console.log('📐 Предзагрузка геометрий...');
    
    genres.forEach(genre => {
      sizes.forEach(size => {
        this.getGeometry(genre, size);
      });
    });
    
    console.log(`✅ Предзагружено ${this.stats.geometries} геометрий`);
  }

  /**
   * Оптимизирует существующие ресурсы
   */
  public optimizeResources(): void {
    console.log('🔧 Оптимизация ресурсов...');
    
    // Удаляем неиспользуемые ресурсы
    this.cleanupUnusedResources();
    
    // Обновляем статистику памяти
    this.updateMemoryStats();
    
    console.log('✅ Оптимизация ресурсов завершена');
  }

  /**
   * Удаляет неиспользуемые ресурсы
   */
  private cleanupUnusedResources(): void {
    // В реальном приложении здесь была бы логика отслеживания использования ресурсов
    // Пока что просто логируем количество ресурсов
    console.log(`📊 Текущие ресурсы: ${this.geometryCache.size} геометрий, ${this.materialCache.size} материалов, ${this.textureCache.size} текстур`);
  }

  /**
   * Обновляет статистику использования памяти
   */
  private updateMemoryStats(): void {
    let memoryUsage = 0;
    
    // Приблизительный расчет использования памяти геометриями
    this.geometryCache.forEach(geometry => {
      const positions = geometry.attributes.position;
      if (positions) {
        memoryUsage += positions.array.byteLength;
      }
      
      const normals = geometry.attributes.normal;
      if (normals) {
        memoryUsage += normals.array.byteLength;
      }
      
      const uvs = geometry.attributes.uv;
      if (uvs) {
        memoryUsage += uvs.array.byteLength;
      }
      
      if (geometry.index) {
        memoryUsage += geometry.index.array.byteLength;
      }
    });
    
    this.stats.memoryUsage = Math.round(memoryUsage / 1024 / 1024 * 100) / 100; // MB
  }

  /**
   * Получает статистику ресурсов
   */
  public getStats(): ResourceStats {
    this.updateMemoryStats();
    return { ...this.stats };
  }

  /**
   * Получает детальную информацию о кэше
   */
  public getCacheInfo(): {
    geometries: string[];
    materials: string[];
    textures: string[];
  } {
    return {
      geometries: Array.from(this.geometryCache.keys()),
      materials: Array.from(this.materialCache.keys()),
      textures: Array.from(this.textureCache.keys())
    };
  }

  /**
   * Очищает весь кэш
   */
  public clearCache(): void {
    console.log('🗑️ Очистка кэша ресурсов...');
    
    // Освобождаем геометрии
    this.geometryCache.forEach(geometry => {
      geometry.dispose();
    });
    this.geometryCache.clear();
    
    // Освобождаем материалы
    this.materialCache.forEach(material => {
      material.dispose();
    });
    this.materialCache.clear();
    
    // Освобождаем текстуры
    this.textureCache.forEach(texture => {
      texture.dispose();
    });
    this.textureCache.clear();
    
    // Сбрасываем статистику
    this.stats = {
      geometries: 0,
      materials: 0,
      textures: 0,
      memoryUsage: 0,
      reusedGeometries: 0,
      reusedMaterials: 0
    };
    
    console.log('✅ Кэш ресурсов очищен');
  }

  /**
   * Создает отчет об использовании ресурсов
   */
  public generateReport(): string {
    const stats = this.getStats();
    const cacheInfo = this.getCacheInfo();
    
    return `
=== Отчет об использовании ресурсов ===
Геометрии: ${stats.geometries} (переиспользовано: ${stats.reusedGeometries})
Материалы: ${stats.materials} (переиспользовано: ${stats.reusedMaterials})
Текстуры: ${stats.textures}
Использование памяти: ${stats.memoryUsage}MB

Кэшированные геометрии: ${cacheInfo.geometries.length}
${cacheInfo.geometries.slice(0, 10).map(key => `- ${key}`).join('\n')}
${cacheInfo.geometries.length > 10 ? `... и еще ${cacheInfo.geometries.length - 10}` : ''}

Кэшированные материалы: ${cacheInfo.materials.length}
${cacheInfo.materials.slice(0, 10).map(key => `- ${key}`).join('\n')}
${cacheInfo.materials.length > 10 ? `... и еще ${cacheInfo.materials.length - 10}` : ''}

Эффективность переиспользования:
- Геометрии: ${stats.reusedGeometries > 0 ? Math.round(stats.reusedGeometries / (stats.geometries + stats.reusedGeometries) * 100) : 0}%
- Материалы: ${stats.reusedMaterials > 0 ? Math.round(stats.reusedMaterials / (stats.materials + stats.reusedMaterials) * 100) : 0}%
========================================
    `.trim();
  }

  /**
   * Освобождает все ресурсы
   */
  public dispose(): void {
    this.clearCache();
  }
}