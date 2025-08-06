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
import { SimpleCameraController } from '../camera/SimpleCameraController';
import { CrystalRotationSystem } from '../effects/CrystalRotationSystem';
import { DynamicGenreColorUtils } from '../materials/DynamicGenreColorSystem';
import { CentralSphereIntegration } from './CentralSphereIntegration';

/**
 * Система управления кристаллическими треками
 * Создает единое звездное скопление из всех треков с медленным вращением
 */
export class CrystalTrackSystem implements ICrystalTrackSystem {
  private scene?: THREE.Scene;
  private camera?: THREE.Camera;
  private crystalCluster?: THREE.Group;
  private crystalTracks: CrystalTrack[] = [];
  private clusterRotationSpeed: number = 0.0002; // Очень медленное вращение для большого радиуса
  private initialized: boolean = false;
  
  // Управление вращением кластера
  private isClusterRotationPaused: boolean = false;
  private clusterRotationResumeTimer?: number;
  private targetRotationSpeed: number = 0.0002;
  private currentRotationSpeed: number = 0.0002;
  private rotationTransitionSpeed: number = 0.00001; // Скорость плавного перехода
  private isRotationPausedForAudio: boolean = false; // Новый флаг для паузы во время аудио
  private mouseClickListener?: (event: MouseEvent) => void; // Слушатель кликов мыши
  private audioRotationCallbacksSetup: boolean = false; // Флаг настройки коллбэков аудио
  private pulseSystem: CrystalPulseSystem;
  private albumTextureManager: AlbumTextureManager;
  private textureClaritySystem: TextureClaritySystem;
  private hoverSystem: CrystalHoverSystem;
  private audioIntegration: SoulGalaxyAudioIntegration;
  private cameraController?: SimpleCameraController;
  private rotationSystem: CrystalRotationSystem;
  private uiManager?: any; // UIManager для показа уведомлений
  private centralSphereIntegration: CentralSphereIntegration;

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
    this.centralSphereIntegration = new CentralSphereIntegration();
  }

  // Конфигурация кластера
  private static readonly CLUSTER_CONFIG = {
    radius: 120,          // Радиус звездного скопления (значительно увеличен)
    heightVariation: 40,  // Вариация по высоте (значительно увеличена)
    minDistance: 10,      // Минимальное расстояние между кристаллами (значительно увеличено)
    rotationSpeed: 0.0002 // Скорость вращения кластера (значительно уменьшена для большого радиуса)
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
    
    // Инициализируем центральную сферу
    this.centralSphereIntegration.initialize(scene, this);
    
    // Регистрируем систему в глобальном пространстве для доступа из других систем
    if (typeof window !== 'undefined') {
      (window as any).crystalTrackSystem = this;
    }
    
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
    this.crystalCluster.userData.isCrystalCluster = true;

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
    // Создаем кастомный шейдерный материал с пульсацией и динамическими цветами
    const genreModifiers = this.getGenreModifiers(crystalTrack.genre);
    
    // Извлекаем дополнительные параметры из трека для динамических цветов
    const bpm = this.extractBPMFromTrack(crystalTrack);
    const energy = this.calculateEnergyFromGenre(crystalTrack.genre);
    
    const material = CrystalShaderMaterial.createForGenre(crystalTrack.genre, {
      albumTexture: crystalTrack.albumTexture,
      emissiveIntensity: crystalTrack.emissiveIntensity,
      pulseAmplitude: crystalTrack.pulseAmplitude * genreModifiers.amplitudeMultiplier,
      pulseSpeed: crystalTrack.pulseSpeed * genreModifiers.speedMultiplier,
      sharpness: genreModifiers.sharpness,
      intensity: 1.2, // Увеличенная интенсивность для лучшей видимости
      bpm: bpm,
      popularity: crystalTrack.popularity,
      energy: energy
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
    
    // Обновляем центральную сферу
    this.centralSphereIntegration.update(deltaTime);
  }

  setPulsationFromBPM(track: ProcessedTrack, bpm?: number): void {
    const crystalTrack = this.crystalTracks.find(ct => ct.id === track.id);
    if (!crystalTrack) return;

    // Делегируем установку пульсации продвинутой системе
    this.pulseSystem.setPulsationFromBPM(crystalTrack, bpm);
  }

  rotateCluster(deltaTime: number): void {
    if (!this.crystalCluster) return;

    // Плавно изменяем скорость вращения к целевой
    if (this.currentRotationSpeed !== this.targetRotationSpeed) {
      const speedDiff = this.targetRotationSpeed - this.currentRotationSpeed;
      const speedChange = Math.sign(speedDiff) * Math.min(Math.abs(speedDiff), this.rotationTransitionSpeed * deltaTime);
      this.currentRotationSpeed += speedChange;
      
      // Если достигли целевой скорости, точно устанавливаем её
      if (Math.abs(speedDiff) < this.rotationTransitionSpeed * deltaTime) {
        this.currentRotationSpeed = this.targetRotationSpeed;
      }
    }

    // Применяем текущую скорость вращения
    if (!this.isClusterRotationPaused) {
      this.crystalCluster.rotation.y += this.currentRotationSpeed * deltaTime;
      this.crystalCluster.rotation.x += this.currentRotationSpeed * 0.3 * deltaTime;
    }
  }

  /**
   * Останавливает вращение кластера плавно
   */
  pauseClusterRotation(): void {
    console.log('⏸️ Pausing cluster rotation');
    this.targetRotationSpeed = 0;
    this.isClusterRotationPaused = false; // Позволяем плавное замедление
  }

  /**
   * Возобновляет вращение кластера плавно
   */
  resumeClusterRotation(): void {
    console.log('▶️ Resuming cluster rotation');
    this.targetRotationSpeed = this.clusterRotationSpeed;
    this.isClusterRotationPaused = false;
  }

  /**
   * Останавливает вращение кластера с задержкой и автоматическим возобновлением
   */
  pauseClusterRotationWithDelay(pauseDuration: number = 3000): void {
    console.log(`⏸️ Pausing cluster rotation for ${pauseDuration}ms`);
    
    // Очищаем предыдущий таймер если есть
    if (this.clusterRotationResumeTimer) {
      clearTimeout(this.clusterRotationResumeTimer);
    }
    
    // Останавливаем вращение
    this.pauseClusterRotation();
    
    // Устанавливаем таймер для возобновления
    this.clusterRotationResumeTimer = window.setTimeout(() => {
      this.resumeClusterRotation();
      this.clusterRotationResumeTimer = undefined;
    }, pauseDuration);
  }

  /**
   * Останавливает вращение кластера во время воспроизведения аудио
   * Вращение возобновляется при окончании аудио или клике мыши
   */
  pauseClusterRotationForAudio(): void {
    console.log('⏸️ Pausing cluster rotation for audio playback');
    
    // Очищаем предыдущий таймер если есть
    if (this.clusterRotationResumeTimer) {
      clearTimeout(this.clusterRotationResumeTimer);
      this.clusterRotationResumeTimer = undefined;
    }
    
    // Устанавливаем флаг паузы для аудио
    this.isRotationPausedForAudio = true;
    
    // Останавливаем вращение
    this.pauseClusterRotation();
    
    // Настраиваем коллбэки аудио для автоматического возобновления (только один раз)
    this.setupAudioRotationCallbacks();
    
    // Добавляем слушатель кликов мыши для возобновления вращения
    this.setupMouseClickListener();
  }

  /**
   * Возобновляет вращение кластера после аудио
   */
  resumeClusterRotationFromAudio(): void {
    if (!this.isRotationPausedForAudio) {
      return;
    }
    
    console.log('▶️ Resuming cluster rotation after audio');
    
    // Сбрасываем флаг паузы для аудио
    this.isRotationPausedForAudio = false;
    
    // Убираем слушатель кликов мыши
    this.removeMouseClickListener();
    
    // Возобновляем вращение
    this.resumeClusterRotation();
  }

  /**
   * Настраивает слушатель кликов мыши для возобновления вращения
   */
  private setupMouseClickListener(): void {
    // Убираем предыдущий слушатель если есть
    this.removeMouseClickListener();
    
    // Создаем новый слушатель с проверкой на клики по кристаллам
    this.mouseClickListener = (event: MouseEvent) => {
      // Проверяем, что камера не находится в процессе приближения
      if (this.isCameraZooming()) {
        console.log('🔍 Camera is zooming, ignoring mouse click for rotation control');
        return;
      }
      
      // Проверяем, что аудио не воспроизводится
      const currentTrack = this.getCurrentPlayingTrack();
      if (currentTrack && this.audioIntegration.isTrackPlaying(currentTrack)) {
        console.log('🎵 Audio is playing, ignoring mouse click for rotation control');
        return;
      }
      
      // Проверяем, не был ли клик по кристаллу через raycasting
      const target = event.target as HTMLElement;
      if (target && target.tagName === 'CANVAS') {
        // Получаем координаты мыши в нормализованном пространстве
        const rect = target.getBoundingClientRect();
        const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Проверяем, есть ли пересечение с кристаллом
        const hoveredCrystal = this.getHoveredCrystal();
        
        if (!hoveredCrystal) {
          // Клик не по кристаллу - возобновляем вращение
          console.log('🖱️ Mouse click detected (not on crystal) - resuming cluster rotation');
          this.resumeClusterRotationFromAudio();
        }
        // Если клик по кристаллу, не делаем ничего - пусть handleCrystalClick обработает
      } else {
        // Клик не по canvas - точно не по кристаллу
        console.log('🖱️ Mouse click detected (outside canvas) - resuming cluster rotation');
        this.resumeClusterRotationFromAudio();
      }
    };
    
    // Добавляем слушатель к документу для глобального отслеживания кликов
    document.addEventListener('click', this.mouseClickListener);
    
    console.log('🖱️ Mouse click listener added for rotation control');
  }

  /**
   * Убирает слушатель кликов мыши
   */
  private removeMouseClickListener(): void {
    if (this.mouseClickListener) {
      document.removeEventListener('click', this.mouseClickListener);
      this.mouseClickListener = undefined;
      console.log('🖱️ Mouse click listener removed');
    }
  }

  /**
   * Настраивает коллбэки аудио для управления вращением
   */
  private setupAudioRotationCallbacks(): void {
    // Проверяем, не настроены ли уже коллбэки для управления вращением
    if (this.audioRotationCallbacksSetup) {
      return;
    }
    
    // Настраиваем коллбэк для окончания воспроизведения
    this.audioIntegration.setOnTrackPlayEnd((track: CrystalTrack) => {
      console.log(`🎵 Audio ended for ${track.name} - resuming cluster rotation`);
      this.resumeClusterRotationFromAudio();
    });
    
    // Настраиваем коллбэк для ошибок аудио
    this.audioIntegration.setOnAudioError((track: CrystalTrack, error: Error) => {
      console.log(`❌ Audio error for ${track.name} - resuming cluster rotation`);
      this.resumeClusterRotationFromAudio();
    });
    
    this.audioRotationCallbacksSetup = true;
    console.log('🎵 Audio rotation callbacks configured');
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
  setCameraController(cameraController: SimpleCameraController): void {
    this.cameraController = cameraController;
    
    // Интегрируем UI Manager с контроллером камеры
    if (this.uiManager) {
      cameraController.setUIManager(this.uiManager);
    }
    
    console.log('📹 Simple Camera controller integrated with Crystal Track System');
  }

  /**
   * Устанавливает UI Manager для показа уведомлений
   */
  setUIManager(uiManager: any): void {
    this.uiManager = uiManager;
    
    // Также передаем UI Manager в аудио интеграцию для показа панели воспроизведения
    this.audioIntegration.setUIManager(uiManager);
    
    console.log('🎨 UI Manager integrated with Crystal Track System and Audio Integration');
  }

  /**
   * Показывает уведомление о том, как выйти из режима фокуса
   */
  private showFocusExitHint(crystal: CrystalTrack): void {
    if (this.uiManager && typeof this.uiManager.showFocusExitHint === 'function') {
      this.uiManager.showFocusExitHint(`${crystal.name} by ${crystal.artist}`);
    } else {
      console.log(`💡 Focus hint: Press ESC, Space, or move mouse/wheel to exit focus on ${crystal.name}`);
    }
  }

  /**
   * Скрывает уведомление о выходе из режима фокуса
   */
  private hideFocusExitHint(): void {
    if (this.uiManager && typeof this.uiManager.hideFocusExitHint === 'function') {
      this.uiManager.hideFocusExitHint();
    }
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

    // Проверяем, не выполняется ли уже приближение к этому кристаллу
    if (this.cameraController && this.cameraController.isZooming()) {
      const currentTarget = this.cameraController.getTargetCrystal();
      if (currentTarget && currentTarget.id === trackId) {
        console.log(`⚠️ Already zooming to crystal: ${crystalTrack.name}`);
        return;
      }
    }

    console.log(`🎵 Crystal clicked: ${crystalTrack.name} by ${crystalTrack.artist}`);

    try {
      // Убираем подсветку при клике
      this.clearHover();
      
      // Останавливаем вращение кластера для воспроизведения аудио
      this.pauseClusterRotationForAudio();
      
      // Используем простое приближение камеры если доступно
      if (this.cameraController) {
        await this.zoomToCrystalWithAnimation(crystalTrack);
      }
      
      // Воспроизводим трек с переходом (это автоматически остановит предыдущий трек)
      await this.audioIntegration.playTrackWithTransition(crystalTrack, crystalMesh);
      
    } catch (error) {
      console.error(`❌ Failed to play crystal: ${crystalTrack.name}`, error);
      // В случае ошибки возобновляем вращение
      this.resumeClusterRotationFromAudio();
    }
  }

  /**
   * Приближается к кристаллу с простой анимацией камеры
   */
  async zoomToCrystalWithAnimation(crystal: CrystalTrack): Promise<void> {
    if (!this.cameraController) {
      console.warn('⚠️ Camera controller not available');
      return;
    }

    console.log(`🔍 Starting zoom to crystal: ${crystal.name} by ${crystal.artist}`);

    try {
      // Запускаем простое приближение камеры
      await this.cameraController.zoomToCrystal(crystal);
      
      // Увеличиваем интенсивность свечения приближенного кристалла
      const mesh = this.findCrystalMesh(crystal.id);
      if (mesh && mesh.material instanceof CrystalShaderMaterial) {
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
      
      console.log(`✅ Zoom completed to crystal: ${crystal.name}`);
      
    } catch (error) {
      console.error(`❌ Failed to zoom to crystal: ${crystal.name}`, error);
    }
  }

  /**
   * Проверяет, выполняется ли приближение камеры
   */
  isCameraZooming(): boolean {
    return this.cameraController ? this.cameraController.isZooming() : false;
  }

  /**
   * Получает текущий целевой кристалл для приближения
   */
  getTargetCrystal(): CrystalTrack | undefined {
    return this.cameraController ? this.cameraController.getTargetCrystal() : undefined;
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
    
    // Очищаем таймер возобновления вращения кластера
    if (this.clusterRotationResumeTimer) {
      clearTimeout(this.clusterRotationResumeTimer);
      this.clusterRotationResumeTimer = undefined;
    }
    
    // Убираем слушатель кликов мыши
    this.removeMouseClickListener();
    
    // Сбрасываем флаги состояния вращения
    this.isRotationPausedForAudio = false;
    
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
    
    // Dispose of the central sphere integration
    this.centralSphereIntegration.dispose();
    
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
    
    // Добавляем имя для отладки
    mesh.name = `Crystal_${crystalTrack.name}_${crystalTrack.artist}`.replace(/[^a-zA-Z0-9_]/g, '_');
    
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
      // Основные жанры
      metal: { speedMultiplier: 1.2, amplitudeMultiplier: 1.3, sharpness: 1.4 },
      rock: { speedMultiplier: 1.1, amplitudeMultiplier: 1.1, sharpness: 1.2 },
      punk: { speedMultiplier: 1.4, amplitudeMultiplier: 1.2, sharpness: 1.5 },
      electronic: { speedMultiplier: 1.0, amplitudeMultiplier: 0.9, sharpness: 0.8 },
      jazz: { speedMultiplier: 0.8, amplitudeMultiplier: 0.8, sharpness: 0.7 },
      classical: { speedMultiplier: 0.7, amplitudeMultiplier: 0.7, sharpness: 0.6 },
      pop: { speedMultiplier: 1.0, amplitudeMultiplier: 1.0, sharpness: 1.0 },
      indie: { speedMultiplier: 0.9, amplitudeMultiplier: 0.9, sharpness: 0.9 },
      hiphop: { speedMultiplier: 1.1, amplitudeMultiplier: 1.0, sharpness: 1.1 },
      
      // Новые жанры
      kpop: { speedMultiplier: 1.2, amplitudeMultiplier: 1.1, sharpness: 1.1 },
      electronics: { speedMultiplier: 1.1, amplitudeMultiplier: 0.9, sharpness: 0.9 },
      dance: { speedMultiplier: 1.3, amplitudeMultiplier: 1.2, sharpness: 1.0 },
      rnb: { speedMultiplier: 0.9, amplitudeMultiplier: 0.8, sharpness: 0.8 },
      edmgenre: { speedMultiplier: 1.4, amplitudeMultiplier: 1.3, sharpness: 1.2 },
      hardrock: { speedMultiplier: 1.3, amplitudeMultiplier: 1.4, sharpness: 1.5 },
      videogame: { speedMultiplier: 1.1, amplitudeMultiplier: 1.0, sharpness: 1.0 },
      soundtrack: { speedMultiplier: 0.8, amplitudeMultiplier: 0.9, sharpness: 0.7 },
      
      default: { speedMultiplier: 1.0, amplitudeMultiplier: 1.0, sharpness: 1.0 }
    };

    const normalizedGenre = genre.toLowerCase();
    return genrePulseModifiers[normalizedGenre] || genrePulseModifiers.default;
  }

  /**
   * Извлекает BPM из трека (если доступно) или оценивает на основе жанра
   */
  private extractBPMFromTrack(crystalTrack: CrystalTrack): number | undefined {
    // Если BPM доступен в данных трека, используем его
    if ((crystalTrack as any).bpm) {
      return (crystalTrack as any).bpm;
    }
    
    // Иначе оцениваем на основе жанра
    return this.estimateBPMFromGenre(crystalTrack.genre);
  }

  /**
   * Оценивает BPM на основе жанра
   */
  private estimateBPMFromGenre(genre: string): number {
    const genreBPMRanges: { [key: string]: { min: number; max: number } } = {
      // Быстрые жанры
      metal: { min: 120, max: 180 },
      hardrock: { min: 110, max: 160 },
      punk: { min: 140, max: 200 },
      edmgenre: { min: 120, max: 140 },
      dance: { min: 120, max: 135 },
      
      // Средние жанры
      rock: { min: 100, max: 140 },
      pop: { min: 100, max: 130 },
      kpop: { min: 110, max: 140 },
      electronic: { min: 90, max: 130 },
      electronics: { min: 90, max: 130 },
      indie: { min: 90, max: 120 },
      
      // Медленные жанры
      jazz: { min: 60, max: 120 },
      classical: { min: 60, max: 120 },
      rnb: { min: 70, max: 110 },
      hiphop: { min: 70, max: 100 },
      soundtrack: { min: 60, max: 120 },
      videogame: { min: 80, max: 140 },
      
      default: { min: 90, max: 130 }
    };

    const normalizedGenre = genre.toLowerCase();
    const range = genreBPMRanges[normalizedGenre] || genreBPMRanges.default;
    
    // Возвращаем случайное значение в диапазоне
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  }

  /**
   * Вычисляет энергию на основе жанра
   */
  private calculateEnergyFromGenre(genre: string): number {
    const genreEnergyLevels: { [key: string]: number } = {
      // Высокая энергия
      metal: 0.9,
      hardrock: 0.85,
      punk: 0.95,
      edmgenre: 0.9,
      dance: 0.85,
      
      // Средняя энергия
      rock: 0.7,
      pop: 0.65,
      kpop: 0.75,
      electronic: 0.6,
      electronics: 0.6,
      indie: 0.55,
      hiphop: 0.65,
      
      // Низкая энергия
      jazz: 0.4,
      classical: 0.3,
      rnb: 0.5,
      soundtrack: 0.45,
      videogame: 0.6,
      
      default: 0.5
    };

    const normalizedGenre = genre.toLowerCase();
    return genreEnergyLevels[normalizedGenre] || genreEnergyLevels.default;
  }

  /**
   * Обновляет динамические цвета всех кристаллов
   */
  updateDynamicColors(deltaTime: number): void {
    if (!this.initialized || this.crystalTracks.length === 0) {
      return;
    }

    // Обновляем временные эффекты в системе цветов
    DynamicGenreColorUtils.updateEffects(deltaTime);

    // Обновляем цвета материалов кристаллов
    this.crystalTracks.forEach(crystal => {
      const mesh = this.findCrystalMesh(crystal.id);
      if (mesh && mesh.material instanceof CrystalShaderMaterial) {
        // Получаем обновленный цвет с временными эффектами
        const updatedColor = DynamicGenreColorUtils.getColor(crystal.genre, {
          intensity: 1.2,
          bpm: this.extractBPMFromTrack(crystal),
          popularity: crystal.popularity,
          energy: this.calculateEnergyFromGenre(crystal.genre),
          time: performance.now()
        });
        
        mesh.material.setCustomColor(updatedColor);
      }
    });
  }

  /**
   * Получает статистику цветовой системы
   */
  getColorSystemStats(): any {
    return DynamicGenreColorUtils.getStats();
  }

  /**
   * Создает цветовую палитру на основе текущих треков
   */
  createGenrePalette(): { genre: string; color: THREE.Color; weight: number }[] {
    if (this.crystalTracks.length === 0) return [];

    // Подсчитываем частоту жанров
    const genreFrequency: { [genre: string]: number } = {};
    this.crystalTracks.forEach(crystal => {
      genreFrequency[crystal.genre] = (genreFrequency[crystal.genre] || 0) + 1;
    });

    return DynamicGenreColorUtils.createDominantPalette(genreFrequency, 8);
  }
}