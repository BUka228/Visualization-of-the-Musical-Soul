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
    
    // Настройка raycaster с оптимизированными параметрами
    this.raycaster.setFromCamera(this.mouse, camera);
    
    // Получаем объекты треков напрямую из SceneManager для лучшей производительности
    const trackObjects = this.sceneManager.getTrackObjects();
    
    // Получение тестового объекта
    const testObject = this.sceneManager.getTestObject();
    
    // Создаем массив всех интерактивных объектов
    const interactiveObjects: THREE.Object3D[] = [...trackObjects];
    if (testObject) {
      interactiveObjects.push(testObject);
    }
    
    // Проверка пересечений с оптимизацией
    if (interactiveObjects.length > 0) {
      // Сортируем объекты по расстоянию до камеры для оптимизации
      const sortedObjects = interactiveObjects.sort((a, b) => {
        const distA = a.position.distanceTo(camera.position);
        const distB = b.position.distanceTo(camera.position);
        return distA - distB;
      });
      
      // Проверяем пересечения только с ближайшими объектами
      const maxObjectsToCheck = Math.min(50, sortedObjects.length); // Ограничиваем количество проверяемых объектов
      const nearObjects = sortedObjects.slice(0, maxObjectsToCheck);
      
      const intersects = this.raycaster.intersectObjects(nearObjects);
      
      if (intersects.length > 0) {
        // Возвращаем ближайший пересекаемый объект
        return intersects[0].object as TrackObject;
      }
    }
    
    return null;
  }

  private hoverTrack(trackObject: TrackObject): void {
    // Используем метод TrackObject для установки состояния наведения
    trackObject.setHovered(true);
    
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
    // Используем метод TrackObject для снятия состояния наведения
    trackObject.setHovered(false);
    
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
    
    // Делегируем анимацию выбора AnimationManager
    if (this.sceneManager) {
      const animationManager = this.sceneManager.getAnimationManager();
      if (animationManager) {
        animationManager.animateTrackSelection(trackObject);
      }
    }
    
    // Обновляем UI с информацией о треке
    this.updateTrackInfoUI(trackObject);
    
    console.log('Трек выбран:', trackObject.trackData?.name || 'Тестовый объект');
    
    // Вызов коллбэка
    if (this.onTrackSelected) {
      this.onTrackSelected(trackObject);
    }
  }

  deselectTrack(): void {
    if (!this.selectedTrack) return;
    
    const trackObject = this.selectedTrack;
    
    // Делегируем анимацию отмены выбора AnimationManager
    if (this.sceneManager) {
      const animationManager = this.sceneManager.getAnimationManager();
      if (animationManager) {
        animationManager.animateTrackDeselection();
      }
    }
    
    // Скрываем информацию о треке в UI
    this.hideTrackInfoUI();
    
    // Сбрасываем состояние выбора
    trackObject.setSelected(false);
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
    
    // Делегируем управление анимацией AnimationManager
    if (this.sceneManager) {
      const animationManager = this.sceneManager.getAnimationManager();
      if (animationManager) {
        animationManager.toggleAnimation();
      }
    }
    
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

  /**
   * Обновляет UI с информацией о выбранном треке
   */
  private updateTrackInfoUI(trackObject: TrackObject): void {
    const trackInfoPanel = document.getElementById('track-info');
    const trackTitle = document.getElementById('track-title');
    const trackArtist = document.getElementById('track-artist');
    const trackAlbum = document.getElementById('track-album');
    
    if (!trackInfoPanel || !trackTitle || !trackArtist || !trackAlbum) {
      console.warn('UI элементы для отображения информации о треке не найдены');
      return;
    }
    
    // Получаем информацию о треке
    if (trackObject.trackData) {
      const trackInfo = trackObject.getTrackInfo();
      
      // Обновляем содержимое элементов
      trackTitle.textContent = trackInfo.name;
      trackArtist.textContent = `Исполнитель: ${trackInfo.artist}`;
      trackAlbum.textContent = `Альбом: ${trackInfo.album}`;
      
      // Добавляем дополнительную информацию
      const existingDetails = trackInfoPanel.querySelector('.track-details');
      if (existingDetails) {
        existingDetails.remove();
      }
      
      const detailsDiv = document.createElement('div');
      detailsDiv.className = 'track-details';
      detailsDiv.style.cssText = `
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        font-size: 12px;
        color: #ccc;
      `;
      
      detailsDiv.innerHTML = `
        <div style="margin: 4px 0;"><strong>Жанр:</strong> ${trackInfo.genre}</div>
        <div style="margin: 4px 0;"><strong>Длительность:</strong> ${trackInfo.duration}</div>
        <div style="margin: 4px 0;"><strong>Популярность:</strong> ${trackInfo.popularity}/100</div>
      `;
      
      trackInfoPanel.appendChild(detailsDiv);
      
      // Показываем панель
      trackInfoPanel.style.display = 'block';
      
      // Добавляем анимацию появления
      trackInfoPanel.style.opacity = '0';
      trackInfoPanel.style.transform = 'translateY(-10px)';
      trackInfoPanel.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      
      // Запускаем анимацию через небольшую задержку
      setTimeout(() => {
        trackInfoPanel.style.opacity = '1';
        trackInfoPanel.style.transform = 'translateY(0)';
      }, 50);
      
    } else {
      // Для тестового объекта
      trackTitle.textContent = 'Тестовый объект';
      trackArtist.textContent = 'Исполнитель: Демо';
      trackAlbum.textContent = 'Альбом: Тестовый альбом';
      
      trackInfoPanel.style.display = 'block';
    }
    
    console.log('UI обновлен с информацией о треке');
  }

  /**
   * Скрывает UI с информацией о треке
   */
  private hideTrackInfoUI(): void {
    const trackInfoPanel = document.getElementById('track-info');
    
    if (!trackInfoPanel) {
      return;
    }
    
    // Добавляем анимацию исчезновения
    trackInfoPanel.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    trackInfoPanel.style.opacity = '0';
    trackInfoPanel.style.transform = 'translateY(-10px)';
    
    // Скрываем панель после анимации
    setTimeout(() => {
      trackInfoPanel.style.display = 'none';
      
      // Удаляем дополнительные детали
      const existingDetails = trackInfoPanel.querySelector('.track-details');
      if (existingDetails) {
        existingDetails.remove();
      }
    }, 300);
    
    console.log('UI с информацией о треке скрыт');
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