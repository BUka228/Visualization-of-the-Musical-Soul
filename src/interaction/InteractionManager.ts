import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { InteractionManager as IInteractionManager, SceneManager, AudioManager } from '../types';
import { AudioManager as AudioManagerImpl } from '../audio/AudioManager';

export class InteractionManager implements IInteractionManager {
  private sceneManager?: SceneManager;
  private controls?: OrbitControls;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private container?: HTMLElement;
  
  // Аудио менеджер
  private audioManager: AudioManager;
  
  // Состояние взаимодействия
  private selectedTrackId?: string;
  private hoveredTrackId?: string;
  private animationPaused: boolean = false;
  
  // Коллбэки для событий
  private onTrackSelected?: (trackId: string) => void;
  private onTrackDeselected?: () => void;
  private onTrackHovered?: (trackId: string) => void;
  private onTrackUnhovered?: () => void;
  private onAnimationToggled?: (paused: boolean) => void;

  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.audioManager = new AudioManagerImpl();
    
    // Настройка коллбэков аудио менеджера
    this.setupAudioCallbacks();
  }

  private setupAudioCallbacks(): void {
    this.audioManager.setOnPlayStart(() => {
      console.log('🎵 Воспроизведение превью началось');
    });

    this.audioManager.setOnPlayEnd(() => {
      console.log('🎵 Воспроизведение превью завершено');
    });

    this.audioManager.setOnError((error: Error) => {
      console.error('❌ Ошибка воспроизведения аудио:', error.message);
      this.showAudioErrorMessage(error.message);
    });
  }

  private showAudioErrorMessage(message: string): void {
    // Создаем временное уведомление об ошибке аудио
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(255, 0, 0, 0.8);
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      font-size: 14px;
      z-index: 1000;
      max-width: 300px;
      word-wrap: break-word;
    `;
    errorDiv.textContent = `Ошибка аудио: ${message}`;
    
    document.body.appendChild(errorDiv);
    
    // Удаляем уведомление через 5 секунд
    setTimeout(() => {
      if (document.body.contains(errorDiv)) {
        document.body.removeChild(errorDiv);
      }
    }, 5000);
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
    
    const intersectedTrackId = this.getIntersectedTrack();
    
    // Обработка наведения
    if (intersectedTrackId !== this.hoveredTrackId) {
      // Убираем подсветку с предыдущего объекта
      if (this.hoveredTrackId) {
        this.unhoverTrack(this.hoveredTrackId);
      }
      
      // Подсвечиваем новый объект
      if (intersectedTrackId) {
        this.hoverTrack(intersectedTrackId);
      }
      
      this.hoveredTrackId = intersectedTrackId || undefined;
    }
  }

  private getIntersectedTrack(): string | null {
    if (!this.sceneManager) return null;
    
    // Обновляем позицию мыши в Soul Galaxy рендерере для системы подсветки
    const soulGalaxyRenderer = this.sceneManager.getSoulGalaxyRenderer();
    soulGalaxyRenderer.updateMousePosition(this.mouse.x, this.mouse.y);
    
    // Получаем наведенный кристалл из системы подсветки
    const crystalTrackSystem = soulGalaxyRenderer.getCrystalTrackSystem();
    const hoveredCrystal = crystalTrackSystem.getHoveredCrystal();
    
    return hoveredCrystal ? hoveredCrystal.id : null;
  }

  private hoverTrack(trackId: string): void {
    // Soul Galaxy renderer handles its own hover effects
    // Classic track object hover effects are no longer needed
    
    // Изменение курсора
    if (this.container) {
      this.container.style.cursor = 'pointer';
    }
    
    // Вызов коллбэка
    if (this.onTrackHovered) {
      this.onTrackHovered(trackId);
    }
  }

  private unhoverTrack(trackId: string): void {
    // Soul Galaxy renderer handles its own hover effects
    // Classic track object hover effects are no longer needed
    
    // Возврат курсора
    if (this.container) {
      this.container.style.cursor = 'default';
    }
    
    // Вызов коллбэка
    if (this.onTrackUnhovered) {
      this.onTrackUnhovered();
    }
  }

  selectTrack(trackId: string): void {
    // Отмена выбора предыдущего объекта
    if (this.selectedTrackId && this.selectedTrackId !== trackId) {
      this.deselectTrack();
    }
    
    this.selectedTrackId = trackId;
    
    // Обрабатываем клик через Soul Galaxy систему
    if (this.sceneManager) {
      const soulGalaxyRenderer = this.sceneManager.getSoulGalaxyRenderer();
      const crystalTrackSystem = soulGalaxyRenderer.getCrystalTrackSystem();
      
      // Воспроизводим трек с кинематографическим переходом
      crystalTrackSystem.handleCrystalClick(trackId).catch((error: Error) => {
        console.error('❌ Failed to handle crystal click:', error);
      });
      
      // Делегируем анимацию выбора AnimationManager
      const animationManager = this.sceneManager.getAnimationManager();
      if (animationManager) {
        animationManager.animateTrackSelection(trackId);
      }
      
      // Активируем эффекты для выбранного трека
      const effectsManager = this.sceneManager.getEffectsManager();
      if (effectsManager) {
        effectsManager.activateSelectionEffects(trackId);
      }
    }
    
    console.log('Трек выбран:', trackId);
    
    // Вызов коллбэка
    if (this.onTrackSelected) {
      this.onTrackSelected(trackId);
    }
  }

  deselectTrack(): void {
    if (!this.selectedTrackId) return;
    
    // Останавливаем воспроизведение через Soul Galaxy аудио интеграцию
    if (this.sceneManager) {
      const soulGalaxyRenderer = this.sceneManager.getSoulGalaxyRenderer();
      const crystalTrackSystem = soulGalaxyRenderer.getCrystalTrackSystem();
      
      // Останавливаем текущее воспроизведение
      crystalTrackSystem.stopCurrentPlayback().catch((error: Error) => {
        console.error('❌ Failed to stop current playback:', error);
      });
      
      // Делегируем анимацию отмены выбора AnimationManager
      const animationManager = this.sceneManager.getAnimationManager();
      if (animationManager) {
        animationManager.animateTrackDeselection();
      }
      
      // Деактивируем эффекты
      const effectsManager = this.sceneManager.getEffectsManager();
      if (effectsManager) {
        effectsManager.deactivateSelectionEffects();
      }
    }
    
    // Также останавливаем старый аудио менеджер для совместимости
    this.audioManager.stopPreview();
    
    // Сбрасываем состояние выбора
    this.selectedTrackId = undefined;
    
    console.log('Трек отменен');
    
    // Вызов коллбэка
    if (this.onTrackDeselected) {
      this.onTrackDeselected();
    }
  }

  /**
   * Воспроизводит превью выбранного трека
   */
  private async playTrackPreview(trackId: string): Promise<void> {
    // Soul Galaxy renderer handles its own audio preview
    // Classic track object audio preview is no longer needed
    
    console.log(`🎵 Попытка воспроизведения превью: ${trackId}`);
  }

  /**
   * Обновляет UI с информацией о статусе воспроизведения аудио
   */
  private updateAudioStatusUI(isPlaying: boolean, trackName?: string): void {
    const trackInfoPanel = document.getElementById('track-info');
    
    if (!trackInfoPanel) {
      return;
    }

    // Удаляем существующий индикатор аудио
    const existingAudioStatus = trackInfoPanel.querySelector('.audio-status');
    if (existingAudioStatus) {
      existingAudioStatus.remove();
    }

    if (isPlaying && trackName) {
      // Создаем индикатор воспроизведения
      const audioStatusDiv = document.createElement('div');
      audioStatusDiv.className = 'audio-status';
      audioStatusDiv.style.cssText = `
        margin-top: 10px;
        padding: 8px 12px;
        background: rgba(0, 255, 0, 0.2);
        border: 1px solid rgba(0, 255, 0, 0.4);
        border-radius: 4px;
        font-size: 12px;
        color: #00ff00;
        display: flex;
        align-items: center;
        gap: 8px;
      `;

      // Добавляем анимированный индикатор
      const indicator = document.createElement('div');
      indicator.style.cssText = `
        width: 8px;
        height: 8px;
        background: #00ff00;
        border-radius: 50%;
        animation: pulse 1s infinite;
      `;

      // Добавляем CSS анимацию для пульсации
      if (!document.querySelector('#audio-pulse-animation')) {
        const style = document.createElement('style');
        style.id = 'audio-pulse-animation';
        style.textContent = `
          @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
            100% { opacity: 1; transform: scale(1); }
          }
        `;
        document.head.appendChild(style);
      }

      const text = document.createElement('span');
      text.textContent = '♪ Воспроизводится превью';

      audioStatusDiv.appendChild(indicator);
      audioStatusDiv.appendChild(text);
      trackInfoPanel.appendChild(audioStatusDiv);
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

  // Classic track object camera animation removed - Soul Galaxy handles its own camera animations

  // Classic track object UI updates removed - Soul Galaxy handles its own UI updates

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
  setOnTrackSelected(callback: (trackId: string) => void): void {
    this.onTrackSelected = callback;
  }

  setOnTrackDeselected(callback: () => void): void {
    this.onTrackDeselected = callback;
  }

  setOnTrackHovered(callback: (trackId: string) => void): void {
    this.onTrackHovered = callback;
  }

  setOnTrackUnhovered(callback: () => void): void {
    this.onTrackUnhovered = callback;
  }

  setOnAnimationToggled(callback: (paused: boolean) => void): void {
    this.onAnimationToggled = callback;
  }

  // Геттеры для состояния
  getSelectedTrackId(): string | undefined {
    return this.selectedTrackId;
  }

  getHoveredTrackId(): string | undefined {
    return this.hoveredTrackId;
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

  // Геттер для AudioManager
  getAudioManager(): AudioManager {
    return this.audioManager;
  }

  dispose(): void {
    console.log('Освобождение ресурсов InteractionManager...');
    
    // Освобождение ресурсов AudioManager
    this.audioManager.dispose();
    
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
    this.selectedTrackId = undefined;
    this.hoveredTrackId = undefined;
    this.sceneManager = undefined;
    this.container = undefined;
    
    console.log('Ресурсы InteractionManager освобождены');
  }
}