import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { InteractionManager as IInteractionManager, SceneManager, TrackObject } from '../types';

export class InteractionManager implements IInteractionManager {
  private sceneManager?: SceneManager;
  private controls?: OrbitControls;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private container?: HTMLElement;
  
  // Состояние взаимодействия
  private selectedTrack?: TrackObject;
  private hoveredTrack?: TrackObject;
  private animationPaused: boolean = false;
  
  // Коллбэки для событий
  private onTrackSelected?: (track: TrackObject) => void;
  private onTrackDeselected?: () => void;
  private onTrackHovered?: (track: TrackObject) => void;
  private onTrackUnhovered?: () => void;
  private onAnimationToggled?: (paused: boolean) => void;

  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  initialize(sceneManager: SceneManager): void {
    console.log('Инициализация InteractionManager...');
    
    this.sceneManager = sceneManager;
    this.container = sceneManager.getRenderer().domElement.parentElement || undefined;
    
    if (!this.container) {
      throw new Error('Не удалось найти контейнер для инициализации управления');
    }
    
    // Инициализация OrbitControls
    this.setupOrbitControls();
    
    // Настройка обработчиков событий
    this.setupEventListeners();
    
    console.log('InteractionManager инициализирован успешно');
  }

  private setupOrbitControls(): void {
    if (!this.sceneManager) return;
    
    const camera = this.sceneManager.getCamera() as THREE.PerspectiveCamera;
    const renderer = this.sceneManager.getRenderer();
    
    this.controls = new OrbitControls(camera, renderer.domElement);
    
    // Настройка параметров управления
    this.controls.enableDamping = true; // плавное затухание
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    
    // Ограничения зума
    this.controls.minDistance = 10;
    this.controls.maxDistance = 500;
    
    // Ограничения вертикального угла
    this.controls.maxPolarAngle = Math.PI;
    
    // Настройка скорости
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 1.0;
    this.controls.panSpeed = 0.8;
    
    // Включение правой кнопки мыши для панорамирования
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    
    console.log('OrbitControls настроены');
  }

  private setupEventListeners(): void {
    if (!this.container) return;
    
    // События мыши
    this.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.container.addEventListener('click', this.handleClick.bind(this));
    this.container.addEventListener('wheel', this.handleWheel.bind(this));
    
    // События клавиатуры
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    console.log('Обработчики событий настроены');
  }

  handleMouseMove(event: MouseEvent): void {
    if (!this.container || !this.sceneManager) return;
    
    // Обновление координат мыши в нормализованном пространстве (-1 до +1)
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Проверка пересечения с объектами
    this.checkIntersections();
  }

  handleClick(event: MouseEvent): void {
    if (!this.container || !this.sceneManager) return;
    
    // Обновление координат мыши
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Проверка пересечения и выбор объекта
    const intersectedTrack = this.getIntersectedTrack();
    
    if (intersectedTrack) {
      this.selectTrack(intersectedTrack);
    } else {
      this.deselectTrack();
    }
  }

  handleWheel(event: WheelEvent): void {
    // OrbitControls автоматически обрабатывает события колеса мыши
    // Этот метод можно использовать для дополнительной логики
    event.preventDefault();
  }

  handleKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyR':
        event.preventDefault();
        this.resetCamera();
        break;
      case 'Space':
        event.preventDefault();
        this.toggleAnimation();
        break;
    }
  }

  private checkIntersections(): void {
    if (!this.sceneManager) return;
    
    const intersectedTrack = this.getIntersectedTrack();
    
    // Обработка наведения
    if (intersectedTrack !== this.hoveredTrack) {
      // Убираем подсветку с предыдущего объекта
      if (this.hoveredTrack) {
        this.unhoverTrack(this.hoveredTrack);
      }
      
      // Подсвечиваем новый объект
      if (intersectedTrack) {
        this.hoverTrack(intersectedTrack);
      }
      
      this.hoveredTrack = intersectedTrack || undefined;
    }
  }

  private getIntersectedTrack(): TrackObject | null {
    if (!this.sceneManager) return null;
    
    const camera = this.sceneManager.getCamera();
    const scene = this.sceneManager.getScene();
    
    // Настройка raycaster
    this.raycaster.setFromCamera(this.mouse, camera);
    
    // Получение всех объектов треков
    const trackObjects = scene.children.filter(child => 
      child.userData && child.userData.isTrackObject
    ) as TrackObject[];
    
    // Получение тестового объекта
    const testObject = scene.children.find(child => 
      child.userData && child.userData.isTestObject
    );
    
    // Создаем массив всех интерактивных объектов
    const interactiveObjects: THREE.Object3D[] = [...trackObjects];
    if (testObject) {
      interactiveObjects.push(testObject);
    }
    
    // Проверка пересечений
    if (interactiveObjects.length > 0) {
      const intersects = this.raycaster.intersectObjects(interactiveObjects);
      return intersects.length > 0 ? intersects[0].object as TrackObject : null;
    }
    
    return null;
  }

  private hoverTrack(trackObject: TrackObject): void {
    // Увеличение размера объекта при наведении
    trackObject.scale.setScalar(1.2);
    
    // Увеличение интенсивности свечения
    if (trackObject.material instanceof THREE.MeshStandardMaterial) {
      trackObject.material.emissiveIntensity = 0.3;
    }
    
    trackObject.isHovered = true;
    
    // Изменение курсора
    if (this.container) {
      this.container.style.cursor = 'pointer';
    }
    
    // Вызов коллбэка
    if (this.onTrackHovered) {
      this.onTrackHovered(trackObject);
    }
  }

  private unhoverTrack(trackObject: TrackObject): void {
    // Возврат к исходному размеру (если объект не выбран)
    if (!trackObject.isSelected) {
      trackObject.scale.setScalar(1.0);
    }
    
    // Возврат к исходной интенсивности свечения
    if (trackObject.material instanceof THREE.MeshStandardMaterial) {
      trackObject.material.emissiveIntensity = trackObject.isSelected ? 0.2 : 0.1;
    }
    
    trackObject.isHovered = false;
    
    // Возврат курсора
    if (this.container) {
      this.container.style.cursor = 'default';
    }
    
    // Вызов коллбэка
    if (this.onTrackUnhovered) {
      this.onTrackUnhovered();
    }
  }

  selectTrack(trackObject: TrackObject): void {
    // Отмена выбора предыдущего объекта
    if (this.selectedTrack && this.selectedTrack !== trackObject) {
      this.deselectTrack();
    }
    
    this.selectedTrack = trackObject;
    trackObject.isSelected = true;
    
    // Визуальные эффекты выбора
    trackObject.scale.setScalar(1.5);
    
    if (trackObject.material instanceof THREE.MeshStandardMaterial) {
      trackObject.material.emissiveIntensity = 0.5;
    }
    
    // Приближение камеры к объекту
    this.animateCameraToTrack(trackObject);
    
    console.log('Трек выбран:', trackObject.trackData?.name || 'Тестовый объект');
    
    // Вызов коллбэка
    if (this.onTrackSelected) {
      this.onTrackSelected(trackObject);
    }
  }

  deselectTrack(): void {
    if (!this.selectedTrack) return;
    
    const trackObject = this.selectedTrack;
    trackObject.isSelected = false;
    
    // Возврат к исходному размеру
    trackObject.scale.setScalar(trackObject.isHovered ? 1.2 : 1.0);
    
    // Возврат к исходной интенсивности свечения
    if (trackObject.material instanceof THREE.MeshStandardMaterial) {
      trackObject.material.emissiveIntensity = trackObject.isHovered ? 0.3 : 0.1;
    }
    
    this.selectedTrack = undefined;
    
    console.log('Трек отменен');
    
    // Вызов коллбэка
    if (this.onTrackDeselected) {
      this.onTrackDeselected();
    }
  }

  resetCamera(): void {
    if (!this.controls) return;
    
    console.log('Сброс камеры в исходное положение');
    
    // Сброс позиции камеры
    this.controls.reset();
    
    // Отмена выбора объекта
    this.deselectTrack();
  }

  toggleAnimation(): void {
    this.animationPaused = !this.animationPaused;
    
    console.log(`Анимация ${this.animationPaused ? 'приостановлена' : 'возобновлена'}`);
    
    // Вызов коллбэка
    if (this.onAnimationToggled) {
      this.onAnimationToggled(this.animationPaused);
    }
  }

  private animateCameraToTrack(trackObject: TrackObject): void {
    if (!this.controls) return;
    
    // Плавное перемещение камеры к объекту
    const targetPosition = trackObject.position.clone();
    const offset = new THREE.Vector3(0, 0, 10); // смещение от объекта
    
    // Установка цели для OrbitControls
    this.controls.target.copy(targetPosition);
    
    // Анимация будет выполнена через OrbitControls с dampingFactor
    this.controls.update();
  }

  // Методы для установки коллбэков
  setOnTrackSelected(callback: (track: TrackObject) => void): void {
    this.onTrackSelected = callback;
  }

  setOnTrackDeselected(callback: () => void): void {
    this.onTrackDeselected = callback;
  }

  setOnTrackHovered(callback: (track: TrackObject) => void): void {
    this.onTrackHovered = callback;
  }

  setOnTrackUnhovered(callback: () => void): void {
    this.onTrackUnhovered = callback;
  }

  setOnAnimationToggled(callback: (paused: boolean) => void): void {
    this.onAnimationToggled = callback;
  }

  // Геттеры для состояния
  getSelectedTrack(): TrackObject | undefined {
    return this.selectedTrack;
  }

  getHoveredTrack(): TrackObject | undefined {
    return this.hoveredTrack;
  }

  isAnimationPaused(): boolean {
    return this.animationPaused;
  }

  // Обновление (должно вызываться в цикле рендеринга)
  update(): void {
    if (this.controls) {
      this.controls.update();
    }
  }

  dispose(): void {
    console.log('Освобождение ресурсов InteractionManager...');
    
    // Удаление обработчиков событий
    if (this.container) {
      this.container.removeEventListener('mousemove', this.handleMouseMove.bind(this));
      this.container.removeEventListener('click', this.handleClick.bind(this));
      this.container.removeEventListener('wheel', this.handleWheel.bind(this));
      this.container.style.cursor = 'default';
    }
    
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Освобождение OrbitControls
    if (this.controls) {
      this.controls.dispose();
      this.controls = undefined;
    }
    
    // Сброс состояния
    this.selectedTrack = undefined;
    this.hoveredTrack = undefined;
    this.sceneManager = undefined;
    this.container = undefined;
    
    console.log('Ресурсы InteractionManager освобождены');
  }
}