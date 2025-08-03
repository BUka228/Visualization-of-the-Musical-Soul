/**
 * InstancedRenderingManager - управление инстансированным рендерингом
 * Группирует одинаковые объекты для оптимизации производительности
 */

import * as THREE from 'three';
import { ProcessedTrack } from '../types';

export interface InstanceGroup {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  mesh: THREE.InstancedMesh;
  tracks: ProcessedTrack[];
  count: number;
  maxCount: number;
}

export interface InstancedRenderingStats {
  totalObjects: number;
  instancedObjects: number;
  instanceGroups: number;
  drawCallsReduced: number;
  memoryReduced: number;
}

export class InstancedRenderingManager {
  private scene: THREE.Scene;
  private instanceGroups: Map<string, InstanceGroup> = new Map();
  private stats: InstancedRenderingStats = {
    totalObjects: 0,
    instancedObjects: 0,
    instanceGroups: 0,
    drawCallsReduced: 0,
    memoryReduced: 0
  };
  
  // Настройки инстансирования
  private readonly config = {
    minInstanceCount: 3, // Минимальное количество объектов для создания инстанса
    maxInstanceCount: 1000, // Максимальное количество инстансов в группе
    enableLOD: true, // Включить Level of Detail
    lodDistances: [50, 100, 200] // Расстояния для LOD
  };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Создает инстансированные объекты из массива треков
   */
  public createInstancedObjects(
    tracks: ProcessedTrack[], 
    geometryProvider: (genre: string, size: number) => THREE.BufferGeometry,
    materialProvider: (genre: string, color: string, popularity: number) => THREE.Material
  ): void {
    console.log('🔄 Создание инстансированных объектов...');
    
    // Очищаем существующие группы
    this.clearInstanceGroups();
    
    // Группируем треки по геометрии и материалу
    const groups = this.groupTracksByRenderingProperties(tracks);
    
    // Создаем инстансированные меши для каждой группы
    groups.forEach((trackGroup, key) => {
      if (trackGroup.length >= this.config.minInstanceCount) {
        this.createInstanceGroup(key, trackGroup, geometryProvider, materialProvider);
      } else {
        // Для малых групп создаем обычные меши
        this.createRegularMeshes(trackGroup, geometryProvider, materialProvider);
      }
    });
    
    this.updateStats(tracks.length);
    console.log(`✅ Создано ${this.instanceGroups.size} групп инстансов для ${this.stats.instancedObjects} объектов`);
  }

  /**
   * Группирует треки по свойствам рендеринга
   */
  private groupTracksByRenderingProperties(tracks: ProcessedTrack[]): Map<string, ProcessedTrack[]> {
    const groups = new Map<string, ProcessedTrack[]>();
    
    tracks.forEach(track => {
      // Создаем ключ на основе жанра и округленного размера для лучшей группировки
      const roundedSize = Math.round(track.size * 4) / 4; // Округляем до 0.25
      const key = `${track.genre.toLowerCase()}_${roundedSize}_${track.color}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(track);
    });
    
    return groups;
  }

  /**
   * Создает группу инстансов для одинаковых объектов
   */
  private createInstanceGroup(
    key: string,
    tracks: ProcessedTrack[],
    geometryProvider: (genre: string, size: number) => THREE.BufferGeometry,
    materialProvider: (genre: string, color: string, popularity: number) => THREE.Material
  ): void {
    const firstTrack = tracks[0];
    const geometry = geometryProvider(firstTrack.genre, firstTrack.size);
    const material = materialProvider(firstTrack.genre, firstTrack.color, firstTrack.popularity);
    
    // Ограничиваем количество инстансов
    const instanceCount = Math.min(tracks.length, this.config.maxInstanceCount);
    
    // Создаем инстансированный меш
    const instancedMesh = new THREE.InstancedMesh(geometry, material, instanceCount);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    
    // Настраиваем матрицы для каждого инстанса
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const scale = new THREE.Vector3(1, 1, 1);
    
    for (let i = 0; i < instanceCount; i++) {
      const track = tracks[i];
      
      // Устанавливаем позицию
      position.copy(track.position);
      
      // Случайное вращение
      rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      
      // Небольшие вариации в размере для естественности
      const sizeVariation = 0.9 + Math.random() * 0.2;
      scale.setScalar(sizeVariation);
      
      // Создаем матрицу трансформации
      matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale);
      instancedMesh.setMatrixAt(i, matrix);
      
      // Устанавливаем цвет для каждого инстанса (если поддерживается)
      if (instancedMesh.instanceColor) {
        const color = new THREE.Color(track.color);
        instancedMesh.setColorAt(i, color);
      }
    }
    
    // Обновляем матрицы
    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true;
    }
    
    // Настраиваем тени
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;
    
    // Добавляем userData для идентификации
    instancedMesh.userData = {
      isInstancedMesh: true,
      groupKey: key,
      trackCount: instanceCount
    };
    
    // Создаем группу
    const instanceGroup: InstanceGroup = {
      geometry,
      material,
      mesh: instancedMesh,
      tracks: tracks.slice(0, instanceCount),
      count: instanceCount,
      maxCount: this.config.maxInstanceCount
    };
    
    this.instanceGroups.set(key, instanceGroup);
    this.scene.add(instancedMesh);
  }

  /**
   * Создает обычные меши для малых групп
   */
  private createRegularMeshes(
    tracks: ProcessedTrack[],
    geometryProvider: (genre: string, size: number) => THREE.BufferGeometry,
    materialProvider: (genre: string, color: string, popularity: number) => THREE.Material
  ): void {
    tracks.forEach(track => {
      const geometry = geometryProvider(track.genre, track.size);
      const material = materialProvider(track.genre, track.color, track.popularity);
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(track.position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      // Случайное вращение
      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      
      mesh.userData = {
        isTrackObject: true,
        trackId: track.id,
        genre: track.genre
      };
      
      this.scene.add(mesh);
    });
  }

  /**
   * Обновляет анимацию инстансированных объектов
   */
  public updateAnimation(deltaTime: number, globalTime: number): void {
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const scale = new THREE.Vector3();
    
    this.instanceGroups.forEach(group => {
      let needsUpdate = false;
      
      for (let i = 0; i < group.count; i++) {
        const track = group.tracks[i];
        
        // Получаем текущую матрицу
        group.mesh.getMatrixAt(i, matrix);
        matrix.decompose(position, new THREE.Quaternion(), scale);
        
        // Обновляем вращение
        rotation.setFromQuaternion(new THREE.Quaternion().setFromRotationMatrix(matrix));
        rotation.x += deltaTime * 0.001;
        rotation.y += deltaTime * 0.001;
        rotation.z += deltaTime * 0.001;
        
        // Орбитальное движение
        const radius = track.position.length();
        const angle = globalTime * 0.0001 + track.id.charCodeAt(0) * 0.01;
        
        position.x = Math.cos(angle) * radius;
        position.z = Math.sin(angle) * radius;
        // Y остается неизменным
        
        // Обновляем матрицу
        matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale);
        group.mesh.setMatrixAt(i, matrix);
        
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        group.mesh.instanceMatrix.needsUpdate = true;
      }
    });
  }

  /**
   * Обновляет выделение объекта
   */
  public updateInstanceHighlight(trackId: string, highlighted: boolean): void {
    this.instanceGroups.forEach(group => {
      const trackIndex = group.tracks.findIndex(track => track.id === trackId);
      
      if (trackIndex !== -1 && group.mesh.instanceColor) {
        const color = highlighted 
          ? new THREE.Color(1, 1, 1) // Белый для выделения
          : new THREE.Color(group.tracks[trackIndex].color);
        
        group.mesh.setColorAt(trackIndex, color);
        group.mesh.instanceColor.needsUpdate = true;
      }
    });
  }

  /**
   * Находит трек по позиции в мире
   */
  public getTrackAtPosition(worldPosition: THREE.Vector3, tolerance: number = 2): ProcessedTrack | null {
    for (const group of this.instanceGroups.values()) {
      for (let i = 0; i < group.count; i++) {
        const track = group.tracks[i];
        const distance = worldPosition.distanceTo(track.position);
        
        if (distance <= tolerance) {
          return track;
        }
      }
    }
    
    return null;
  }

  /**
   * Получает все треки в радиусе от позиции
   */
  public getTracksInRadius(worldPosition: THREE.Vector3, radius: number): ProcessedTrack[] {
    const tracksInRadius: ProcessedTrack[] = [];
    
    this.instanceGroups.forEach(group => {
      group.tracks.forEach(track => {
        const distance = worldPosition.distanceTo(track.position);
        if (distance <= radius) {
          tracksInRadius.push(track);
        }
      });
    });
    
    return tracksInRadius;
  }

  /**
   * Обновляет статистику
   */
  private updateStats(totalObjects: number): void {
    let instancedObjects = 0;
    let drawCallsReduced = 0;
    
    this.instanceGroups.forEach(group => {
      instancedObjects += group.count;
      drawCallsReduced += group.count - 1; // Каждая группа экономит (count - 1) draw calls
    });
    
    this.stats = {
      totalObjects,
      instancedObjects,
      instanceGroups: this.instanceGroups.size,
      drawCallsReduced,
      memoryReduced: this.calculateMemoryReduction()
    };
  }

  /**
   * Вычисляет экономию памяти от инстансирования
   */
  private calculateMemoryReduction(): number {
    let memoryReduced = 0;
    
    this.instanceGroups.forEach(group => {
      // Приблизительный расчет экономии памяти
      // Каждый инстанс экономит память на дублировании геометрии и материала
      const geometrySize = this.estimateGeometrySize(group.geometry);
      const materialSize = 1024; // Приблизительный размер материала в байтах
      
      memoryReduced += (group.count - 1) * (geometrySize + materialSize);
    });
    
    return Math.round(memoryReduced / 1024 / 1024 * 100) / 100; // MB
  }

  /**
   * Оценивает размер геометрии в байтах
   */
  private estimateGeometrySize(geometry: THREE.BufferGeometry): number {
    let size = 0;
    
    Object.values(geometry.attributes).forEach(attribute => {
      size += attribute.array.byteLength;
    });
    
    if (geometry.index) {
      size += geometry.index.array.byteLength;
    }
    
    return size;
  }

  /**
   * Очищает все группы инстансов
   */
  private clearInstanceGroups(): void {
    this.instanceGroups.forEach(group => {
      this.scene.remove(group.mesh);
      group.geometry.dispose();
      
      if (group.material instanceof THREE.Material) {
        group.material.dispose();
      }
    });
    
    this.instanceGroups.clear();
  }

  /**
   * Получает статистику инстансированного рендеринга
   */
  public getStats(): InstancedRenderingStats {
    return { ...this.stats };
  }

  /**
   * Получает информацию о группах инстансов
   */
  public getInstanceGroupsInfo(): Array<{
    key: string;
    count: number;
    maxCount: number;
    genre: string;
    memoryUsage: number;
  }> {
    const info: Array<{
      key: string;
      count: number;
      maxCount: number;
      genre: string;
      memoryUsage: number;
    }> = [];
    
    this.instanceGroups.forEach((group, key) => {
      info.push({
        key,
        count: group.count,
        maxCount: group.maxCount,
        genre: group.tracks[0]?.genre || 'unknown',
        memoryUsage: this.estimateGeometrySize(group.geometry) / 1024 // KB
      });
    });
    
    return info;
  }

  /**
   * Создает отчет об инстансированном рендеринге
   */
  public generateReport(): string {
    const stats = this.getStats();
    const groupsInfo = this.getInstanceGroupsInfo();
    
    return `
=== Отчет об инстансированном рендеринге ===
Всего объектов: ${stats.totalObjects}
Инстансированных объектов: ${stats.instancedObjects}
Групп инстансов: ${stats.instanceGroups}
Сокращено draw calls: ${stats.drawCallsReduced}
Экономия памяти: ${stats.memoryReduced}MB

Группы инстансов:
${groupsInfo.map(info => 
  `- ${info.key}: ${info.count}/${info.maxCount} объектов (${info.memoryUsage.toFixed(1)}KB)`
).join('\n')}

Эффективность инстансирования: ${stats.totalObjects > 0 ? Math.round(stats.instancedObjects / stats.totalObjects * 100) : 0}%
============================================
    `.trim();
  }

  /**
   * Освобождает ресурсы
   */
  public dispose(): void {
    console.log('🗑️ Освобождение ресурсов InstancedRenderingManager...');
    this.clearInstanceGroups();
    console.log('✅ Ресурсы InstancedRenderingManager освобождены');
  }
}