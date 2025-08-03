import { MusicGalaxyApp, AppConfig, AppState } from './types';
import { SceneManager } from './scene/SceneManager';

// Импорт тестов в режиме разработки
if (process.env.NODE_ENV === 'development') {
  import('./scene/test-scene');
}

// Конфигурация по умолчанию
const DEFAULT_CONFIG: AppConfig = {
  scene: {
    galaxyRadius: 50,
    objectMinSize: 0.5,
    objectMaxSize: 3.0,
    animationSpeed: 0.001,
    cameraDistance: 100,
    genreColors: {
      'metal': '#FF0000',
      'rock': '#FF4500',
      'indie': '#4169E1',
      'pop': '#FFD700',
      'electronic': '#9400D3',
      'jazz': '#228B22',
      'classical': '#F5F5DC',
      'hip-hop': '#8B4513',
      'default': '#FFFFFF'
    }
  },
  api: {
    baseUrl: 'https://api.music.yandex.net',
    clientId: 'demo-client-id',
    redirectUri: window.location.origin
  },
  audio: {
    defaultVolume: 0.7,
    fadeInDuration: 500,
    fadeOutDuration: 300
  },
  animation: {
    rotationSpeed: 0.001,
    cameraTransitionDuration: 1000,
    objectAppearDuration: 2000
  }
};

class MusicGalaxyApplication implements MusicGalaxyApp {
  private config: AppConfig;
  private state: AppState;
  private container?: HTMLElement;
  private sceneManager?: SceneManager;

  constructor(config: Partial<AppConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      isInitialized: false,
      isLoading: false,
      isAuthenticated: false,
      tracks: [],
      genreStats: {},
      animationPaused: false
    };
  }

  async initialize(container: HTMLElement): Promise<void> {
    console.log('Initializing Music Galaxy 3D...');
    
    this.container = container;
    this.state.isLoading = true;
    
    try {
      // Проверка поддержки WebGL
      if (!this.checkWebGLSupport()) {
        throw new Error('WebGL не поддерживается в данном браузере');
      }

      console.log('WebGL поддерживается');
      console.log('Конфигурация приложения:', this.config);
      
      // Инициализация 3D-сцены
      this.sceneManager = new SceneManager(container, this.config.scene);
      this.sceneManager.initializeScene();
      
      this.state.isInitialized = true;
      this.state.isLoading = false;
      
      // Скрыть индикатор загрузки
      const loadingElement = document.getElementById('loading');
      if (loadingElement) {
        loadingElement.style.display = 'none';
      }
      
      console.log('Music Galaxy 3D инициализировано успешно');
      
    } catch (error) {
      this.state.isLoading = false;
      console.error('Ошибка инициализации:', error);
      this.showError(error as Error);
      throw error;
    }
  }

  loadTracks(tracks: any[]): void {
    console.log(`Загрузка ${tracks.length} треков...`);
    // Реализация будет добавлена в следующих задачах
  }

  selectTrack(trackId: string): void {
    console.log(`Выбор трека: ${trackId}`);
    // Реализация будет добавлена в следующих задачах
  }

  resetView(): void {
    console.log('Сброс вида камеры');
    // Реализация будет добавлена в следующих задачах
  }

  toggleAnimation(): void {
    this.state.animationPaused = !this.state.animationPaused;
    console.log(`Анимация ${this.state.animationPaused ? 'приостановлена' : 'возобновлена'}`);
    // Реализация будет добавлена в следующих задачах
  }

  dispose(): void {
    console.log('Освобождение ресурсов...');
    
    if (this.sceneManager) {
      this.sceneManager.dispose();
      this.sceneManager = undefined;
    }
    
    this.state.isInitialized = false;
  }

  getState(): AppState {
    return { ...this.state };
  }

  private checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!context;
    } catch (e) {
      return false;
    }
  }

  private showError(error: Error): void {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.innerHTML = `
        <div style="color: #ff6b6b; text-align: center;">
          <h3>Ошибка инициализации</h3>
          <p>${error.message}</p>
          <button onclick="location.reload()" style="
            background: #ff6b6b; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 4px; 
            cursor: pointer;
            margin-top: 10px;
          ">
            Перезагрузить страницу
          </button>
        </div>
      `;
    }
  }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('canvas-container');
  if (!container) {
    console.error('Контейнер canvas-container не найден');
    return;
  }

  const app = new MusicGalaxyApplication();
  
  try {
    await app.initialize(container);
    
    // Настройка обработчиков событий UI
    setupUIEventHandlers(app);
    
  } catch (error) {
    console.error('Не удалось инициализировать приложение:', error);
  }
});

function setupUIEventHandlers(app: MusicGalaxyApp): void {
  // Кнопка авторизации
  const authButton = document.getElementById('auth-button');
  if (authButton) {
    authButton.addEventListener('click', () => {
      console.log('Авторизация будет реализована в следующих задачах');
      alert('Авторизация будет реализована в следующих задачах');
    });
  }

  // Кнопка сброса камеры
  const resetCameraButton = document.getElementById('reset-camera');
  if (resetCameraButton) {
    resetCameraButton.addEventListener('click', () => {
      app.resetView();
    });
  }

  // Кнопка паузы анимации
  const toggleAnimationButton = document.getElementById('toggle-animation');
  if (toggleAnimationButton) {
    toggleAnimationButton.addEventListener('click', () => {
      app.toggleAnimation();
    });
  }

  // Обработчики клавиатуры
  document.addEventListener('keydown', (event) => {
    switch (event.code) {
      case 'KeyR':
        app.resetView();
        break;
      case 'Space':
        event.preventDefault();
        app.toggleAnimation();
        break;
    }
  });
}

// Экспорт для использования в других модулях
export { MusicGalaxyApplication, DEFAULT_CONFIG };
export * from './types';