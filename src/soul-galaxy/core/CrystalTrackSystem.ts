import * as THREE from 'three';
import { ProcessedTrack } from '../../types';
import { CrystalTrackSystem as ICrystalTrackSystem, CrystalTrack } from '../types';
import { CrystalGeometryGenerator } from './CrystalGeometryGenerator';
import { CrystalPulseSystem } from '../effects/CrystalPulseSystem';
import { CrystalShaderMaterial } from '../materials/CrystalShaderMaterial';
import { AlbumTextureManager } from '../materials/AlbumTextureManager';
import { TextureClaritySystem } from '../materials/TextureClaritySystem';
import { CrystalHoverSystem } from '../interaction/CrystalHoverSystem';
import { SoulGalaxyAudioIntegration } from '../audio/SoulGalaxyAudioIntegration';
import { CinematicCameraController } from '../camera/CinematicCameraController';
import { CrystalRotationSystem } from '../effects/CrystalRotationSystem';

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
  private textureClaritySystem: TextureClaritySystem;
  private hoverSystem: CrystalHoverSystem;
  private audioIntegration: SoulGalaxyAudioIntegration;
  private cameraController?: CinematicCameraController;
  private rotationSystem: CrystalRotationSystem;

  constructor() {
    this.pulseSystem = new CrystalPulseSystem();
    this.albumTextureManager = new AlbumTextureManager({
      maxTextureSize: 512,
      cacheSize: 100,
      enableCompression: true,
      blurIntensity: 0.3,
      distortionStrength: 0.1,
      highQualityTextureSize: 1024,
      enableHighQualityPreload: true
    });
    this.textureClaritySystem = new TextureClaritySystem(this.albumTextureManager, {
      transitionDuration: 1500,
      enableSmoothInterpolation: true,
      preloadHighQuality: true
    });
    this.hoverSystem = new CrystalHoverSystem();
    this.audioIntegration = new SoulGalaxyAudioIntegration();
    this.rotationSystem = new CrystalRotationSystem({
      baseRotationSpeed: 0.3,
      bpmSpeedMultiplier: 0.005,
      transitionDuration: 2000,
      useEnergyFallback: true,
      rotationAxes: new THREE.Vector3(0.2, 1.0, 0.3)
    });
  }

  // Конфигурация кластера
  private static readonly CLUSTER_CONFIG = {
    radius: 30,           // Радиус звездного скопления
    heightVariation: 15,  // Вариация по высоте
    minDistance: 2,       // Минимальное расстояние между кристаллами
    rotationSpeed: 0.001  // Скорость вращения кластера
  };

  initialize(scene: THREE.Scene, camera: THREE.Camera, container?: HTMLElement): void {
    console.log('🔮 Initializing Crystal Track System...');
    
    this.scene = scene;
    this.camera = camera;
    this.initialized = true;
    
    // Инициализируем систему подсветки с контейнером для HUD
    this.hoverSystem.initialize(scene, camera, container);
    
    // Инициализируем аудио интеграцию
    this.audioIntegration.initialize();
    
    // Настраиваем коллбэки для вращения кристаллов
    this.setupRotationCallbacks();
    
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
    
    // Предзагружаем высококачественные текстуры для фокуса
    console.log('🎨 Preloading high-quality textures for focus...');
    await this.textureClaritySystem.preloadHighQualityTextures(tracks);

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

    // Настраиваем систему подсветки для кристаллов
    this.hoverSystem.setCrystalTracks(this.crystalTracks, this.crystalCluster);

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
    
    // Обновляем систему подсветки
    this.hoverSystem.update(deltaTime);
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

  /**
   * Обновляет позицию мыши для системы подсветки
   */
  updateMousePosition(mouseX: number, mouseY: number): void {
    this.hoverSystem.updateMousePosition(mouseX, mouseY);
  }

  /**
   * Получает систему подсветки для настройки коллбэков
   */
  getHoverSystem(): CrystalHoverSystem {
    return this.hoverSystem;
  }

  /**
   * Получает текущий наведенный кристалл
   */
  getHoveredCrystal(): CrystalTrack | undefined {
    return this.hoverSystem.getHoveredCrystal();
  }

  /**
   * Принудительно убирает подсветку (например, при фокусе)
   */
  clearHover(): void {
    this.hoverSystem.clearHover();
  }

  /**
   * Устанавливает контроллер камеры для кинематографических переходов
   */
  setCameraController(cameraController: CinematicCameraController): void {
    this.cameraController = cameraController;
    console.log('📹 Camera controller integrated with Crystal Track System');
  }

  /**
   * Обрабатывает клик по кристаллу для воспроизведения аудио
   */
  async handleCrystalClick(trackId: string): Promise<void> {
    const crystalTrack = this.crystalTracks.find(ct => ct.id === trackId);
    const crystalMesh = this.findCrystalMesh(trackId);
    
    if (!crystalTrack || !crystalMesh) {
      console.warn(`⚠️ Crystal not found for track ID: ${trackId}`);
      return;
    }

    console.log(`🎵 Crystal clicked: ${crystalTrack.name} by ${crystalTrack.artist}`);

    try {
      // Убираем подсветку при клике
      this.clearHover();
      
      // Используем кинематографический переход камеры если доступен
      if (this.cameraController) {
        await this.focusOnCrystalWithAnimation(crystalTrack);
      } else {
        // Fallback на базовый фокус
        this.focusOnCrystal(crystalTrack);
      }
      
      // Воспроизводим трек с кинематографическим переходом
      await this.audioIntegration.playTrackWithTransition(crystalTrack, crystalMesh);
      
    } catch (error) {
      console.error(`❌ Failed to play crystal: ${crystalTrack.name}`, error);
    }
  }

  /**
   * Фокусируется на кристалле с кинематографической анимацией камеры
   */
  async focusOnCrystalWithAnimation(crystal: CrystalTrack): Promise<void> {
    if (!this.cameraController) {
      console.warn('⚠️ Camera controller not available, using basic focus');
      this.focusOnCrystal(crystal);
      return;
    }

    console.log(`🎬 Starting cinematic focus on crystal: ${crystal.name} by ${crystal.artist}`);

    try {
      // Запускаем кинематографический переход камеры
      await this.cameraController.focusOnCrystal(crystal);
      
      // Обновляем состояние кристалла
      crystal.isFocused = true;
      
      // Увеличиваем интенсивность свечения сфокусированного кристалла
      const mesh = this.findCrystalMesh(crystal.id);
      if (mesh && mesh.material instanceof CrystalShaderMaterial) {
        mesh.material.setFocused(true);
        mesh.material.setEmissiveIntensity(0.8);
        
        // Запускаем переход к высококачественной текстуре
        await this.textureClaritySystem.transitionToHighQuality(
          crystal,
          mesh.material,
          () => {
            console.log(`🎨 High-quality texture transition completed for ${crystal.name}`);
          }
        );
      }
      
      console.log(`✅ Cinematic focus completed on crystal: ${crystal.name}`);
      
    } catch (error) {
      console.error(`❌ Failed to focus on crystal with animation: ${crystal.name}`, error);
      // Fallback на базовый фокус
      this.focusOnCrystal(crystal);
    }
  }

  /**
   * Возвращает камеру к предыдущей позиции
   */
  async returnCameraToPreviousPosition(): Promise<void> {
    if (!this.cameraController) {
      console.warn('⚠️ Camera controller not available');
      return;
    }

    console.log('🔄 Returning camera to previous position');

    try {
      // Убираем фокус с текущего кристалла
      const focusedCrystal = this.cameraController.getFocusedCrystal();
      if (focusedCrystal) {
        focusedCrystal.isFocused = false;
        
        // Возвращаем нормальную интенсивность свечения и текстуру
        const mesh = this.findCrystalMesh(focusedCrystal.id);
        if (mesh && mesh.material instanceof CrystalShaderMaterial) {
          mesh.material.setFocused(false);
          mesh.material.setEmissiveIntensity(0.3);
          
          // Запускаем переход к средней качественной текстуре
          await this.textureClaritySystem.transitionToMediumQuality(
            focusedCrystal,
            mesh.material,
            () => {
              console.log(`🎨 Medium-quality texture transition completed for ${focusedCrystal.name}`);
            }
          );
        }
      }
      
      // Запускаем анимацию возврата камеры
      await this.cameraController.returnToPreviousPosition();
      
      console.log('✅ Camera returned to previous position');
      
    } catch (error) {
      console.error('❌ Failed to return camera to previous position:', error);
    }
  }

  /**
   * Проверяет, находится ли камера в состоянии фокуса
   */
  isCameraFocused(): boolean {
    return this.cameraController ? this.cameraController.isFocused() : false;
  }

  /**
   * Получает текущий сфокусированный кристалл (через камеру)
   */
  getFocusedCrystal(): CrystalTrack | undefined {
    return this.cameraController ? this.cameraController.getFocusedCrystal() : undefined;
  }

  /**
   * Получает аудио интеграцию для настройки коллбэков
   */
  getAudioIntegration(): SoulGalaxyAudioIntegration {
    return this.audioIntegration;
  }

  /**
   * Получает систему вращения кристаллов
   */
  getRotationSystem(): CrystalRotationSystem {
    return this.rotationSystem;
  }

  /**
   * Получает текущий воспроизводимый трек
   */
  getCurrentPlayingTrack(): CrystalTrack | undefined {
    return this.audioIntegration.getCurrentPlayingTrack();
  }

  /**
   * Останавливает текущее воспроизведение
   */
  async stopCurrentPlayback(): Promise<void> {
    await this.audioIntegration.stopCurrentTrack();
  }

  /**
   * Проверяет, воспроизводится ли трек
   */
  isTrackPlaying(trackId: string): boolean {
    const crystalTrack = this.crystalTracks.find(ct => ct.id === trackId);
    return crystalTrack ? this.audioIntegration.isTrackPlaying(crystalTrack) : false;
  }

  dispose(): void {
    console.log('🗑️ Disposing Crystal Track System...');
    
    // Dispose of the rotation system
    this.rotationSystem.dispose();
    
    // Dispose of the audio integration
    this.audioIntegration.dispose();
    
    // Dispose of the hover system
    this.hoverSystem.dispose();
    
    // Dispose of the pulse system
    this.pulseSystem.dispose();
    
    // Dispose of the texture clarity system
    this.textureClaritySystem.dispose();
    
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
   * Настраивает коллбэки для интеграции системы вращения с аудио
   */
  private setupRotationCallbacks(): void {
    // Настраиваем коллбэк для начала вращения при воспроизведении
    this.audioIntegration.setOnRotationStart((track: CrystalTrack, mesh: THREE.Mesh) => {
      console.log(`🔄 Starting rotation for playing crystal: ${track.name} by ${track.artist}`);
      this.rotationSystem.startRotation(track, mesh);
    });

    // Настраиваем коллбэк для остановки вращения при окончании воспроизведения
    this.audioIntegration.setOnRotationStop((track: CrystalTrack) => {
      console.log(`⏹️ Stopping rotation for crystal: ${track.name} by ${track.artist}`);
      this.rotationSystem.stopRotation(track.id);
    });

    console.log('🔗 Crystal rotation callbacks configured');
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