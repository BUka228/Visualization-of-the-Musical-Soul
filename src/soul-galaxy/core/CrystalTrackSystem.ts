import * as THREE from 'three';
import { ProcessedTrack } from '../../types';
import { CrystalTrackSystem as ICrystalTrackSystem, CrystalTrack } from '../types';
import { CrystalGeometryGenerator } from './CrystalGeometryGenerator';
import { CrystalPulseSystem } from '../effects/CrystalPulseSystem';
import { CrystalShaderMaterial } from '../materials/CrystalShaderMaterial';
import { AlbumTextureManager } from '../materials/AlbumTextureManager';

/**
 * Система управления кристаллическими треками
 * Создает единое звездное скопление из всех треков с медленным вращением
 */
export class CrystalTrackSystem implements ICrystalTrackSystem {
  private scene?: THREE.Scene;
  private camera?: THREE.Camera;
  private crystalCluster?: THREE.Group;
  private crystalTracks: CrystalTrack[] = [];
  private clusterRotationSpeed: number = 0.001; // Медленное вращение
  private initialized: boolean = false;
  private pulseSystem: CrystalPulseSystem;
  private albumTextureManager: AlbumTextureManager;

  constructor() {
    this.pulseSystem = new CrystalPulseSystem();
    this.albumTextureManager = new AlbumTextureManager({
      maxTextureSize: 512,
      cacheSize: 100,
      enableCompression: true,
      blurIntensity: 0.3,
      distortionStrength: 0.1
    });
  }

  // Конфигурация кластера
  private static readonly CLUSTER_CONFIG = {
    radius: 30,           // Радиус звездного скопления
    heightVariation: 15,  // Вариация по высоте
    minDistance: 2,       // Минимальное расстояние между кристаллами
    rotationSpeed: 0.001  // Скорость вращения кластера
  };

  initialize(scene: THREE.Scene, camera: THREE.Camera): void {
    console.log('🔮 Initializing Crystal Track System...');
    
    this.scene = scene;
    this.camera = camera;
    this.initialized = true;
    
    console.log('✅ Crystal Track System initialized');
  }

  async createCrystalCluster(tracks: ProcessedTrack[]): Promise<void> {
    if (!this.initialized || !this.scene) {
      console.warn('⚠️ Crystal Track System not initialized');
      return;
    }

    console.log(`🌟 Creating crystal cluster from ${tracks.length} tracks...`);

    // Очищаем предыдущий кластер
    this.clearCluster();

    // Создаем новую группу для кластера
    this.crystalCluster = new THREE.Group();
    this.crystalCluster.name = 'CrystalCluster';

    // Предзагружаем текстуры альбомов для оптимизации
    console.log('🖼️ Preloading album textures...');
    await this.albumTextureManager.preloadTextures(tracks);

    // Конвертируем ProcessedTrack в CrystalTrack и создаем кристаллы
    this.crystalTracks = await Promise.all(
      tracks.map((track, index) => this.createCrystalTrack(track, index, tracks.length))
    );

    // Добавляем все кристаллы в кластер
    this.crystalTracks.forEach(crystalTrack => {
      const crystalMesh = this.createCrystalMesh(crystalTrack);
      this.crystalCluster!.add(crystalMesh);
    });

    // Добавляем кластер в сцену
    this.scene.add(this.crystalCluster);

    // Инициализируем систему пульсации
    this.pulseSystem.initialize(this.scene, this.crystalTracks);

    console.log(`✅ Crystal cluster created with ${this.crystalTracks.length} crystals`);
    this.logClusterStats();
    this.logTextureStats();
  }

  generateCrystalGeometry(track: ProcessedTrack): THREE.BufferGeometry {
    // Используем продвинутый генератор кристаллической геометрии
    return CrystalGeometryGenerator.generateCrystalGeometry(track);
  }

  createCrystalMaterial(crystalTrack: CrystalTrack): THREE.ShaderMaterial {
    // Создаем кастомный шейдерный материал с пульсацией
    const genreModifiers = this.getGenreModifiers(crystalTrack.genre);
    
    const material = CrystalShaderMaterial.createForGenre(crystalTrack.genre, {
      albumTexture: crystalTrack.albumTexture,
      emissiveIntensity: crystalTrack.emissiveIntensity,
      pulseAmplitude: crystalTrack.pulseAmplitude * genreModifiers.amplitudeMultiplier,
      pulseSpeed: crystalTrack.pulseSpeed * genreModifiers.speedMultiplier,
      sharpness: genreModifiers.sharpness
    });
    
    return material;
  }

  updatePulsation(deltaTime: number): void {
    if (!this.initialized || this.crystalTracks.length === 0) {
      return;
    }

    // Используем продвинутую систему пульсации
    this.pulseSystem.updatePulsation(deltaTime);
  }

  setPulsationFromBPM(track: ProcessedTrack, bpm?: number): void {
    const crystalTrack = this.crystalTracks.find(ct => ct.id === track.id);
    if (!crystalTrack) return;

    // Делегируем установку пульсации продвинутой системе
    this.pulseSystem.setPulsationFromBPM(crystalTrack, bpm);
  }

  rotateCluster(deltaTime: number): void {
    if (!this.crystalCluster) return;

    // Медленное вращение всего скопления
    this.crystalCluster.rotation.y += this.clusterRotationSpeed * deltaTime;
    this.crystalCluster.rotation.x += this.clusterRotationSpeed * 0.3 * deltaTime;
  }

  focusOnCrystal(crystal: CrystalTrack): void {
    // Базовая реализация фокуса - будет расширена в задачах камеры
    console.log(`🎯 Focusing on crystal: ${crystal.name} by ${crystal.artist}`);
    
    crystal.isFocused = true;
    
    // Увеличиваем интенсивность свечения сфокусированного кристалла
    const mesh = this.findCrystalMesh(crystal.id);
    if (mesh && mesh.material instanceof CrystalShaderMaterial) {
      mesh.material.setFocused(true);
      mesh.material.setEmissiveIntensity(0.8);
    }
  }

  dispose(): void {
    console.log('🗑️ Disposing Crystal Track System...');
    
    // Dispose of the pulse system
    this.pulseSystem.dispose();
    
    // Dispose of the album texture manager
    this.albumTextureManager.dispose();
    
    this.clearCluster();
    this.crystalTracks = [];
    this.scene = undefined;
    this.camera = undefined;
    this.initialized = false;
    
    console.log('✅ Crystal Track System disposed');
  }

  // Приватные методы

  private async createCrystalTrack(track: ProcessedTrack, index: number, total: number): Promise<CrystalTrack> {
    // Расчет позиции в сферическом кластере
    const position = this.calculateClusterPosition(index, total);
    
    // Используем продвинутый генератор для получения геометрии и характеристик
    const crystalData = CrystalGeometryGenerator.createAdvancedCrystalGeometry(track);
    
    // Загружаем текстуру альбома
    let albumTexture: THREE.Texture | undefined;
    try {
      albumTexture = await this.albumTextureManager.getAlbumTexture(track);
    } catch (error) {
      console.warn(`Failed to load album texture for ${track.name}:`, error);
      albumTexture = this.albumTextureManager.getFallbackTexture(track.genre);
    }
    
    return {
      ...track,
      position,
      crystalGeometry: crystalData.geometry,
      facetCount: crystalData.facetCount,
      roughnessLevel: crystalData.roughnessLevel,
      pulseSpeed: 1.0 + Math.random() * 2.0, // Базовая скорость пульсации
      pulseAmplitude: 0.1 + Math.random() * 0.1,
      pulsePhase: Math.random() * Math.PI * 2,
      genreColor: new THREE.Color(track.color),
      emissiveIntensity: 0.3,
      albumTexture,
      isFocused: false,
      isHovered: false,
      distanceFromCenter: position.length()
    };
  }

  private calculateClusterPosition(index: number, total: number): THREE.Vector3 {
    // Используем сферическое распределение для создания звездного скопления
    const phi = Math.acos(1 - 2 * (index / total)); // Полярный угол
    const theta = Math.sqrt(total * Math.PI) * phi; // Азимутальный угол (спираль Фибоначчи)
    
    // Вариация радиуса для более естественного вида
    const radiusVariation = 0.7 + Math.random() * 0.6; // 0.7 - 1.3
    const radius = CrystalTrackSystem.CLUSTER_CONFIG.radius * radiusVariation;
    
    // Преобразуем в декартовы координаты
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi) + (Math.random() - 0.5) * CrystalTrackSystem.CLUSTER_CONFIG.heightVariation;
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    return new THREE.Vector3(x, y, z);
  }

  private createCrystalMesh(crystalTrack: CrystalTrack): THREE.Mesh {
    const geometry = crystalTrack.crystalGeometry;
    const material = this.createCrystalMaterial(crystalTrack);
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(crystalTrack.position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Добавляем метаданные для идентификации
    mesh.userData = {
      trackId: crystalTrack.id,
      trackName: crystalTrack.name,
      artist: crystalTrack.artist,
      genre: crystalTrack.genre,
      isCrystal: true
    };
    
    return mesh;
  }

  private findCrystalMesh(trackId: string): THREE.Mesh | undefined {
    if (!this.crystalCluster) return undefined;
    
    return this.crystalCluster.children.find(child => 
      child instanceof THREE.Mesh && child.userData.trackId === trackId
    ) as THREE.Mesh | undefined;
  }

  private clearCluster(): void {
    if (this.crystalCluster && this.scene) {
      // Освобождаем ресурсы всех кристаллов
      this.crystalCluster.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
      
      // Удаляем кластер из сцены
      this.scene.remove(this.crystalCluster);
      this.crystalCluster = undefined;
    }
  }

  private logClusterStats(): void {
    if (this.crystalTracks.length === 0) return;
    
    const genreCount: { [genre: string]: number } = {};
    let totalDistance = 0;
    
    this.crystalTracks.forEach(crystal => {
      genreCount[crystal.genre] = (genreCount[crystal.genre] || 0) + 1;
      totalDistance += crystal.distanceFromCenter;
    });
    
    const avgDistance = totalDistance / this.crystalTracks.length;
    
    console.log('📊 Crystal Cluster Statistics:');
    console.log(`  Total crystals: ${this.crystalTracks.length}`);
    console.log(`  Average distance from center: ${avgDistance.toFixed(2)}`);
    console.log('  Genre distribution:');
    
    Object.entries(genreCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([genre, count]) => {
        console.log(`    ${genre}: ${count} crystals`);
      });
  }

  private logTextureStats(): void {
    const stats = this.albumTextureManager.getCacheStats();
    
    console.log('🖼️ Album Texture Statistics:');
    console.log(`  Cached textures: ${stats.cachedTextures}`);
    console.log(`  Loading textures: ${stats.loadingTextures}`);
    console.log(`  Fallback textures: ${stats.fallbackTextures}`);
    console.log(`  Estimated memory usage: ${(stats.memoryUsage / 1024 / 1024).toFixed(2)} MB`);
    
    // Log texture distribution by genre
    const texturesByGenre: { [genre: string]: { loaded: number; fallback: number } } = {};
    
    this.crystalTracks.forEach(crystal => {
      if (!texturesByGenre[crystal.genre]) {
        texturesByGenre[crystal.genre] = { loaded: 0, fallback: 0 };
      }
      
      if (crystal.albumTexture) {
        // Check if it's a fallback texture by checking if track has imageUrl
        if (crystal.imageUrl) {
          texturesByGenre[crystal.genre].loaded++;
        } else {
          texturesByGenre[crystal.genre].fallback++;
        }
      }
    });
    
    console.log('  Texture distribution by genre:');
    Object.entries(texturesByGenre)
      .sort(([,a], [,b]) => (b.loaded + b.fallback) - (a.loaded + a.fallback))
      .forEach(([genre, counts]) => {
        const total = counts.loaded + counts.fallback;
        console.log(`    ${genre}: ${total} total (${counts.loaded} loaded, ${counts.fallback} fallback)`);
      });
  }

  // Геттеры для доступа к данным
  getCrystalTracks(): CrystalTrack[] {
    return [...this.crystalTracks];
  }

  getCrystalCluster(): THREE.Group | undefined {
    return this.crystalCluster;
  }

  getClusterRotationSpeed(): number {
    return this.clusterRotationSpeed;
  }

  setClusterRotationSpeed(speed: number): void {
    this.clusterRotationSpeed = speed;
  }

  /**
   * Получает модификаторы пульсации для жанра
   */
  private getGenreModifiers(genre: string): {
    speedMultiplier: number;
    amplitudeMultiplier: number;
    sharpness: number;
  } {
    const genrePulseModifiers: { [key: string]: { speedMultiplier: number; amplitudeMultiplier: number; sharpness: number } } = {
      metal: { speedMultiplier: 1.2, amplitudeMultiplier: 1.3, sharpness: 1.4 },
      rock: { speedMultiplier: 1.1, amplitudeMultiplier: 1.1, sharpness: 1.2 },
      punk: { speedMultiplier: 1.4, amplitudeMultiplier: 1.2, sharpness: 1.5 },
      electronic: { speedMultiplier: 1.0, amplitudeMultiplier: 0.9, sharpness: 0.8 },
      jazz: { speedMultiplier: 0.8, amplitudeMultiplier: 0.8, sharpness: 0.7 },
      classical: { speedMultiplier: 0.7, amplitudeMultiplier: 0.7, sharpness: 0.6 },
      pop: { speedMultiplier: 1.0, amplitudeMultiplier: 1.0, sharpness: 1.0 },
      indie: { speedMultiplier: 0.9, amplitudeMultiplier: 0.9, sharpness: 0.9 },
      hiphop: { speedMultiplier: 1.1, amplitudeMultiplier: 1.0, sharpness: 1.1 },
      default: { speedMultiplier: 1.0, amplitudeMultiplier: 1.0, sharpness: 1.0 }
    };

    const normalizedGenre = genre.toLowerCase();
    return genrePulseModifiers[normalizedGenre] || genrePulseModifiers.default;
  }
}