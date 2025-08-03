import * as THREE from 'three';
import { SceneManager as ISceneManager, ProcessedTrack, SceneConfig } from '../types';
import { InteractionManager } from '../interaction/InteractionManager';
import { AnimationManager } from '../animation/AnimationManager';
import { EffectsManager } from '../effects/EffectsManager';
import { PerformanceOptimizer } from '../performance/PerformanceOptimizer';
import { PerformanceWarning } from '../performance/PerformanceMonitor';
import { SoulGalaxyRenderer } from '../soul-galaxy/core/SoulGalaxyRenderer';

export class SceneManager implements ISceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private config: SceneConfig;
  
  // Освещение
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  
  // Тестовый объект
  private testObject?: THREE.Mesh;
  
  // Classic track objects removed - Soul Galaxy handles visualization
  
  // Менеджер взаимодействия
  private interactionManager: InteractionManager;
  
  // Менеджер анимаций
  private animationManager: AnimationManager;
  
  // Менеджер эффектов
  private effectsManager: EffectsManager;
  
  // Оптимизатор производительности
  private performanceOptimizer: PerformanceOptimizer;

  // Soul Galaxy система
  private soulGalaxyRenderer: SoulGalaxyRenderer;

  constructor(container: HTMLElement, config: SceneConfig) {
    this.container = container;
    this.config = config;
    
    // Инициализация основных компонентов Three.js
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();
    this.renderer = new THREE.WebGLRenderer();
    
    // Инициализация освещения
    this.ambientLight = new THREE.AmbientLight();
    this.directionalLight = new THREE.DirectionalLight();
    
    // Инициализация менеджера взаимодействия
    this.interactionManager = new InteractionManager();
    
    // Инициализация менеджера анимаций
    this.animationManager = new AnimationManager();
    
    // Инициализация менеджера эффектов
    this.effectsManager = new EffectsManager();
    
    // Инициализация оптимизатора производительности
    this.performanceOptimizer = new PerformanceOptimizer(this.scene, this.camera, this.renderer);
    
    // Инициализация Soul Galaxy рендерера
    this.soulGalaxyRenderer = new SoulGalaxyRenderer();
  }

  initializeScene(): void {
    console.log('Инициализация 3D-сцены...');
    
    // Настройка сцены
    this.setupScene();
    
    // Настройка камеры
    this.setupCamera();
    
    // Настройка рендерера
    this.setupRenderer();
    
    // Настройка освещения
    this.setupLighting();
    
    // Создание тестового объекта
    this.createTestObject();
    
    // Инициализация менеджера взаимодействия
    this.interactionManager.initialize(this);
    
    // Инициализация менеджера анимаций
    this.animationManager.initialize(this);
    
    // Инициализация менеджера эффектов
    this.effectsManager.initialize(this.scene, this.camera, this.interactionManager.getAudioManager());
    
    // Инициализация Soul Galaxy рендерера (единственный режим)
    this.soulGalaxyRenderer.initialize(this.scene, this.camera);
    
    // Запуск цикла рендеринга
    this.startRenderLoop();
    
    console.log('3D-сцена инициализирована успешно');
  }

  private setupScene(): void {
    // Установка цвета фона (космическое пространство)
    this.scene.background = new THREE.Color(0x000011);
    
    // Добавление тумана для глубины
    this.scene.fog = new THREE.Fog(0x000011, 50, 200);
  }

  private setupCamera(): void {
    // Настройка перспективной камеры
    this.camera = new THREE.PerspectiveCamera(
      75, // field of view
      this.container.clientWidth / this.container.clientHeight, // aspect ratio
      0.1, // near clipping plane
      1000 // far clipping plane
    );
    
    // Позиционирование камеры
    this.camera.position.set(0, 0, this.config.cameraDistance);
    this.camera.lookAt(0, 0, 0);
  }

  private setupRenderer(): void {
    // Настройка WebGL рендерера
    this.renderer = new THREE.WebGLRenderer({
      antialias: true, // сглаживание
      alpha: true // прозрачность
    });
    
    // Установка размера рендерера
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Настройки рендеринга
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    // Добавление canvas в контейнер
    this.container.appendChild(this.renderer.domElement);
    
    // Обработка изменения размера окна
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private setupLighting(): void {
    // Мягкое общее освещение
    this.ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(this.ambientLight);
    
    // Основной направленный свет
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.directionalLight.position.set(50, 50, 50);
    this.directionalLight.castShadow = true;
    
    // Настройка теней
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 500;
    this.directionalLight.shadow.camera.left = -100;
    this.directionalLight.shadow.camera.right = 100;
    this.directionalLight.shadow.camera.top = 100;
    this.directionalLight.shadow.camera.bottom = -100;
    
    this.scene.add(this.directionalLight);
    
    console.log('Освещение настроено: AmbientLight + DirectionalLight');
  }

  private createTestObject(): void {
    // Создание тестового объекта для проверки работоспособности
    const geometry = new THREE.IcosahedronGeometry(2, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4169E1, // синий цвет (indie жанр)
      metalness: 0.3,
      roughness: 0.4,
      emissive: 0x001122,
      emissiveIntensity: 0.1
    });
    
    this.testObject = new THREE.Mesh(geometry, material);
    this.testObject.position.set(0, 0, 0);
    this.testObject.castShadow = true;
    this.testObject.receiveShadow = true;
    
    // Добавляем userData для идентификации как тестовый объект
    this.testObject.userData = { isTestObject: true };
    
    this.scene.add(this.testObject);
    
    console.log('Тестовый объект создан и добавлен в сцену');
  }

  private startRenderLoop(): void {
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Обновление менеджера взаимодействия
      this.interactionManager.update();
      
      // Анимация тестового объекта (только если анимация не приостановлена)
      if (this.testObject && !this.interactionManager.isAnimationPaused()) {
        this.testObject.rotation.x += 0.01;
        this.testObject.rotation.y += 0.01;
      }
      
      // Обновление сцены
      this.updateScene();
      
      // Рендеринг
      this.renderer.render(this.scene, this.camera);
    };
    
    animate();
    console.log('Цикл рендеринга запущен');
  }

  private handleResize(): void {
    // Обновление размеров при изменении размера окна
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  createTrackObjects(tracks: ProcessedTrack[]): void {
    console.log(`🌌 Создание ${tracks.length} кристаллических треков в Soul Galaxy режиме...`);
    
    // Очистка существующих объектов
    this.clearTrackObjects();
    
    // Удаляем тестовый объект при создании реальных треков
    if (this.testObject) {
      this.scene.remove(this.testObject);
      this.testObject.geometry.dispose();
      if (this.testObject.material instanceof THREE.Material) {
        this.testObject.material.dispose();
      }
      this.testObject = undefined;
      console.log('🗑️ Тестовый объект удален');
    }
    
    // Создаем кристаллический кластер через Soul Galaxy рендерер
    this.soulGalaxyRenderer.createCrystalCluster(tracks);
    
    console.log(`✅ Создан кристаллический кластер из ${tracks.length} треков`);
    this.logGenreDistribution(tracks);
    
    // Запускаем анимации после создания объектов
    this.animationManager.startAnimation();
    console.log('🎬 Анимации Soul Galaxy запущены');
  }

  /**
   * Очищает все объекты треков из сцены (теперь через Soul Galaxy рендерер)
   */
  private clearTrackObjects(): void {
    // Soul Galaxy рендерер управляет очисткой своих объектов
    // Классические TrackObject больше не используются
  }

  /**
   * Логирует распределение треков по жанрам для отладки
   */
  private logGenreDistribution(tracks: ProcessedTrack[]): void {
    const genreCount: { [genre: string]: number } = {};
    
    tracks.forEach(track => {
      genreCount[track.genre] = (genreCount[track.genre] || 0) + 1;
    });
    
    console.log('📊 Распределение по жанрам:');
    Object.entries(genreCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([genre, count]) => {
        console.log(`  ${genre}: ${count} треков`);
      });
  }

  updateScene(): void {
    // AnimationManager теперь управляет всеми анимациями
    // Обновляем эффекты
    this.effectsManager.update(16); // ~60 FPS
    
    // Обновляем оптимизацию производительности
    this.performanceOptimizer.update(16); // ~60 FPS
    
    // Обновляем Soul Galaxy рендерер
    this.soulGalaxyRenderer.updateScene(16); // ~60 FPS
  }

  dispose(): void {
    console.log('Освобождение ресурсов SceneManager...');
    
    // Освобождение ресурсов Soul Galaxy рендерера
    this.soulGalaxyRenderer.dispose();
    
    // Освобождение ресурсов оптимизатора производительности
    this.performanceOptimizer.dispose();
    
    // Освобождение ресурсов менеджера эффектов
    this.effectsManager.dispose();
    
    // Освобождение ресурсов менеджера анимаций
    this.animationManager.dispose();
    
    // Освобождение ресурсов менеджера взаимодействия
    this.interactionManager.dispose();
    
    // Удаление обработчика изменения размера
    window.removeEventListener('resize', this.handleResize.bind(this));
    
    // Очистка объектов треков
    this.clearTrackObjects();
    
    // Удаление тестового объекта
    if (this.testObject) {
      this.scene.remove(this.testObject);
      this.testObject.geometry.dispose();
      if (this.testObject.material instanceof THREE.Material) {
        this.testObject.material.dispose();
      }
    }
    
    // Освобождение ресурсов рендерера
    this.renderer.dispose();
    
    // Удаление canvas из DOM
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
    
    console.log('Ресурсы SceneManager освобождены');
  }

  // Геттеры для доступа к основным объектам
  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.Camera {
    return this.camera;
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  // Classic track objects removed - Soul Galaxy handles visualization

  getTestObject(): THREE.Mesh | undefined {
    return this.testObject;
  }

  getInteractionManager(): InteractionManager {
    return this.interactionManager;
  }

  getAnimationManager(): AnimationManager {
    return this.animationManager;
  }

  getEffectsManager(): EffectsManager {
    return this.effectsManager;
  }

  getPerformanceOptimizer(): PerformanceOptimizer {
    return this.performanceOptimizer;
  }

  // Soul Galaxy is now the only mode - no mode switching needed

  getSoulGalaxyRenderer(): SoulGalaxyRenderer {
    return this.soulGalaxyRenderer;
  }
}