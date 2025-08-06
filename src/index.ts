import { MusicGalaxyApp, AppConfig, AppState, ProcessedTrack } from './types';
import { SceneManager } from './scene/SceneManager';
import { DataLoader } from './data/DataLoader';
import { DataProcessor } from './data/DataProcessor';
import { UIManager } from './ui/UIManager';
import { LandingPage } from './ui/LandingPage';
import { GalaxyCreationProgress } from './ui/GalaxyCreationProgress';
import { BurgerMenu } from './ui/BurgerMenu';
import { setupMockAPI } from './api/MockYandexAPI';
import { Vector3 } from 'three';

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
    cameraDistance: 600, // Увеличено до 600, чтобы камера была за всеми кристаллами на значительно большем расстоянии
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
  private uiManager?: UIManager;
  private landingPage?: LandingPage;
  private progressScreen?: GalaxyCreationProgress;
  private burgerMenu?: BurgerMenu;

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
      
      // Проверяем, нужен ли экран первой загрузки
      await this.checkFirstLoadRequirement();
      
    } catch (error) {
      this.state.isLoading = false;
      console.error('Ошибка инициализации:', error);
      this.showError(error as Error);
      throw error;
    }
  }

  /**
   * Проверяет, нужен ли экран первой загрузки
   */
  private async checkFirstLoadRequirement(): Promise<void> {
    // В новой архитектуре всегда показываем лендинг для выбора папки
    // Пользователь сам решает, какие данные использовать
    await this.showLandingPage();
  }

  /**
   * Показывает лендинг-страницу
   */
  private async showLandingPage(): Promise<void> {
    this.landingPage = new LandingPage(this.container!);
    this.landingPage.show();
    
    // Настраиваем обработчики событий нового онбординга
    this.setupOnboardingEventHandlers();
  }

  /**
   * Настраивает обработчики событий онбординга
   */
  private setupOnboardingEventHandlers(): void {
    // Обработчик начала создания галактики
    window.addEventListener('galaxy-creation-started', (event: any) => {
      this.handleGalaxyCreationStarted(event.detail);
    }, { once: true });

    // Обработчик готовности галактики
    window.addEventListener('galaxy-ready', (event: any) => {
      this.handleGalaxyReady(event.detail);
    }, { once: true });

    // Обработчик повтора создания галактики
    window.addEventListener('galaxy-creation-retry', () => {
      this.handleGalaxyCreationRetry();
    });

    // Обработчик использования демо-данных
    window.addEventListener('galaxy-use-demo', () => {
      this.handleUseDemoData();
    });
  }

  /**
   * Обрабатывает начало создания галактики
   */
  private async handleGalaxyCreationStarted(detail: any): Promise<void> {
    console.log('Начало создания галактики:', detail);
    
    if (this.landingPage) {
      this.landingPage.hide();
      this.landingPage = undefined;
    }

    // Показываем экран прогресса
    this.progressScreen = new GalaxyCreationProgress(this.container!);
    this.progressScreen.show();

    // Устанавливаем локальный загрузчик данных
    if (detail.folderHandle) {
      DataLoader.setLocalDataLoader(detail.folderHandle);
      await this.startLocalDataLoading();
    } else {
      // Fallback для старой архитектуры (если нужно)
      await this.startDataCollection(detail.token);
    }
  }

  /**
   * Запускает сбор данных с отображением прогресса (fallback для старой архитектуры)
   */
  private async startDataCollection(token: string): Promise<void> {
    console.warn('⚠️ Fallback к старой архитектуре - используем демо-данные');
    await this.handleUseDemoData();
  }

  /**
   * Запускает загрузку локальных данных
   */
  private async startLocalDataLoading(): Promise<void> {
    try {
      if (this.progressScreen) {
        this.progressScreen.updateProgress({
          stage: 'loading',
          message: 'Загрузка локальных данных...',
          progress: 0
        });
      }

      const result = await DataLoader.loadLocalMusicData();
      
      if (result.success && result.data) {
        if (this.progressScreen) {
          this.progressScreen.updateProgress({
            stage: 'processing',
            message: 'Обработка треков...',
            progress: 50
          });
        }

        // Небольшая задержка для показа прогресса
        await new Promise(resolve => setTimeout(resolve, 500));

        if (this.progressScreen) {
          this.progressScreen.updateProgress({
            stage: 'complete',
            message: 'Данные загружены успешно!',
            progress: 100
          });
        }

        // Показываем успех
        if (this.progressScreen) {
          this.progressScreen.showSuccess(
            result.availableTracks,
            result.availableTracks // Все локальные треки доступны для воспроизведения
          );
        }
      } else {
        if (this.progressScreen) {
          this.progressScreen.showError(result.error || 'Не удалось загрузить локальные данные');
        }
      }
    } catch (error) {
      if (this.progressScreen) {
        this.progressScreen.showError(
          error instanceof Error ? error.message : 'Неизвестная ошибка при загрузке локальных данных'
        );
      }
    }
  }



  /**
   * Обрабатывает готовность галактики
   */
  private async handleGalaxyReady(detail: any): Promise<void> {
    console.log('Галактика готова:', detail);
    
    if (this.progressScreen) {
      this.progressScreen.hide();
      this.progressScreen = undefined;
    }

    // Инициализируем основное приложение
    await this.initializeMainApp();
  }

  /**
   * Обрабатывает повтор создания галактики
   */
  private handleGalaxyCreationRetry(): void {
    if (this.progressScreen) {
      this.progressScreen.hide();
      this.progressScreen = undefined;
    }

    // Возвращаемся к лендинг-странице
    this.showLandingPage();
  }

  /**
   * Обрабатывает использование демо-данных
   */
  private async handleUseDemoData(): Promise<void> {
    if (this.progressScreen) {
      this.progressScreen.hide();
      this.progressScreen = undefined;
    }

    // Инициализируем приложение с демо-данными
    await this.initializeMainApp();
  }

  /**
   * Инициализирует основное приложение
   */
  private async initializeMainApp(): Promise<void> {
    console.log('Инициализация основного приложения...');
    
    // Инициализация UI менеджера
    this.uiManager = new UIManager();
    this.uiManager.initialize();
    
    // Инициализация бургер-меню
    this.burgerMenu = new BurgerMenu();
    this.burgerMenu.initialize();
    
    // Инициализация 3D-сцены
    this.sceneManager = new SceneManager(this.container!, this.config.scene);
    this.sceneManager.initializeScene();
    
    // Интеграция UI Manager с SceneManager
    this.sceneManager.setUIManager(this.uiManager);
    
    // Настраиваем коллбэк для выбора трека из поиска
    this.uiManager.setOnTrackSelected((trackId: string) => {
      this.selectTrackFromSearch(trackId);
    });
    
    // Загрузка данных треков
    await this.loadMusicData();
    
    this.state.isInitialized = true;
    this.state.isLoading = false;
    
    // Скрыть индикатор загрузки
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    console.log('Music Galaxy 3D инициализировано успешно');
  }

  private async loadMusicData(): Promise<void> {
    try {
      console.log('🔄 Загрузка музыкальных данных...');
      
      // Создаем экземпляр DataProcessor
      const dataProcessor = new DataProcessor();
      
      // Пробуем загрузить локальные данные
      const localResult = await DataLoader.loadLocalMusicData();
      
      if (localResult.success && localResult.data) {
        console.log('📁 Используем локальные данные');
        
        // Конвертируем локальные данные в стандартный формат
        const convertedTracks = dataProcessor.convertLocalTrackData(localResult.data.tracks);
        
        // Обрабатываем треки для 3D-сцены
        const processedTracks = dataProcessor.processTrackData(convertedTracks);
        
        // Загружаем треки в сцену
        this.loadTracks(processedTracks);
        
        // Обновляем статистику
        const genreStats = dataProcessor.analyzeGenres(convertedTracks);
        this.state.genreStats = genreStats;
        
        console.log(`✅ Загружено ${processedTracks.length} локальных треков`);
        
      } else {
        // Fallback к старой архитектуре или демо-данным
        console.log('🔄 Загружаем демо-данные...');
        
        const musicData = await DataLoader.loadMusicData();
        
        // Конвертируем данные Яндекс.Музыки в стандартный формат
        const convertedTracks = dataProcessor.convertYandexTrackData(musicData.tracks);
        
        // Обрабатываем треки для 3D-сцены
        const processedTracks = dataProcessor.processTrackData(convertedTracks);
        
        // Загружаем треки в сцену
        this.loadTracks(processedTracks);
        
        // Обновляем статистику
        const genreStats = dataProcessor.analyzeGenres(convertedTracks);
        this.state.genreStats = genreStats;
        
        console.log(`✅ Загружено ${processedTracks.length} демо-треков`);
      }
      
      // Обновляем UI через UIManager
      if (this.uiManager) {
        this.uiManager.updateAppState(this.state);
      }
      
    } catch (error) {
      console.error('❌ Ошибка загрузки музыкальных данных:', error);
      throw error;
    }
  }

  async loadTracks(tracks: ProcessedTrack[]): Promise<void> {
    console.log(`Загрузка ${tracks.length} треков в 3D-сцену...`);
    
    this.state.tracks = tracks;
    
    if (this.sceneManager) {
      // Создаем 3D-объекты для треков
      await this.sceneManager.createTrackObjects(tracks);
      console.log('3D-объекты треков созданы и анимации запущены');
    }
    
    // Устанавливаем треки в UI Manager для поиска
    if (this.uiManager) {
      this.uiManager.setTracks(tracks);
      console.log(`🔍 Search functionality enabled for ${tracks.length} tracks`);
    }
  }

  selectTrack(trackId: string): void {
    console.log(`Выбор трека: ${trackId}`);
    // Реализация будет добавлена в следующих задачах
  }

  /**
   * Выбирает трек из поиска и переходит к нему
   */
  private selectTrackFromSearch(trackId: string): void {
    console.log(`🎯 Selecting track from search: ${trackId}`);
    
    if (!this.sceneManager) {
      console.warn('⚠️ Scene manager not available');
      return;
    }

    // Получаем систему кристаллов из Soul Galaxy рендерера
    const soulGalaxyRenderer = this.sceneManager.getSoulGalaxyRenderer();
    const crystalTrackSystem = soulGalaxyRenderer.getCrystalTrackSystem();
    
    // Имитируем клик по кристаллу для навигации и воспроизведения
    crystalTrackSystem.handleCrystalClick(trackId).catch((error: Error) => {
      console.error(`❌ Failed to navigate to track from search: ${trackId}`, error);
    });
    
    // Обновляем состояние приложения
    this.state.selectedTrackId = trackId;
    
    console.log(`✅ Navigated to track from search: ${trackId}`);
  }

  resetView(): void {
    console.log('Сброс вида камеры');
    if (this.sceneManager) {
      this.sceneManager.getInteractionManager().resetCamera();
    }
  }

  toggleAnimation(): void {
    console.log('Переключение анимации');
    if (this.sceneManager) {
      this.sceneManager.getInteractionManager().toggleAnimation();
      this.state.animationPaused = this.sceneManager.getAnimationManager().isPausedState();
    }
  }

  dispose(): void {
    console.log('Освобождение ресурсов...');
    
    if (this.sceneManager) {
      this.sceneManager.dispose();
      this.sceneManager = undefined;
    }
    
    if (this.uiManager) {
      this.uiManager.dispose();
      this.uiManager = undefined;
    }
    
    if (this.burgerMenu) {
      this.burgerMenu.dispose();
      this.burgerMenu = undefined;
    }
    
    if (this.landingPage) {
      this.landingPage.dispose();
      this.landingPage = undefined;
    }
    
    if (this.progressScreen) {
      this.progressScreen.dispose();
      this.progressScreen = undefined;
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



  private updateStatsUI(): void {
    const statsContainer = document.getElementById('genre-stats');
    if (!statsContainer) return;
    
    const sortedGenres = Object.entries(this.state.genreStats)
      .sort(([,a], [,b]) => b.count - a.count);
    
    statsContainer.innerHTML = `
      <h3>Статистика по жанрам</h3>
      <div class="genre-list">
        ${sortedGenres.map(([genre, stats]) => `
          <div class="genre-item" style="border-left: 4px solid ${stats.color}">
            <span class="genre-name">${genre}</span>
            <span class="genre-count">${stats.count} треков (${stats.percentage.toFixed(1)}%)</span>
          </div>
        `).join('')}
      </div>
      <div class="total-tracks">
        Всего треков: ${this.state.tracks.length}
      </div>
    `;
  }

  private async showDataUpdateNotification(): Promise<void> {
    try {
      // Получаем детальную информацию о статусе обновления
      const updateStatus = await DataLoader.getDataUpdateStatus();
      
      const notification = document.createElement('div');
      notification.className = 'data-update-notification';
      
      let ageInfo = '';
      if (updateStatus.lastUpdate && updateStatus.hoursOld) {
        const lastUpdateStr = updateStatus.lastUpdate.toLocaleString('ru');
        ageInfo = `<p><small>Последнее обновление: ${lastUpdateStr} (${updateStatus.hoursOld.toFixed(1)} ч. назад)</small></p>`;
      }
      
      notification.innerHTML = `
        <div style="
          background: #ffd93d; 
          color: #333; 
          padding: 15px; 
          border-radius: 8px; 
          margin: 10px;
          border-left: 4px solid #ffb700;
          position: relative;
        ">
          <h4>⚠️ Данные устарели</h4>
          ${ageInfo}
          <p>Для получения актуальных данных из Яндекс.Музыки:</p>
          <code style="background: #f0f0f0; padding: 5px; border-radius: 4px; display: block; margin: 10px 0;">npm run collect-data</code>
          <details style="margin-top: 10px;">
            <summary style="cursor: pointer; font-weight: bold;">📝 Подробные инструкции</summary>
            <pre style="background: #f0f0f0; padding: 10px; border-radius: 4px; margin-top: 5px; font-size: 12px; white-space: pre-wrap;">${updateStatus.instructions}</pre>
          </details>
          <button onclick="this.parentElement.parentElement.remove()" style="
            position: absolute;
            top: 10px;
            right: 15px;
            background: none; 
            border: none; 
            font-size: 18px; 
            cursor: pointer;
            color: #666;
          ">×</button>
        </div>
      `;
      
      document.body.insertBefore(notification, document.body.firstChild);
      
      // Автоматически скрыть через 15 секунд (увеличено из-за дополнительной информации)
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 15000);
      
    } catch (error) {
      console.error('Ошибка отображения уведомления об обновлении:', error);
      
      // Fallback к простому уведомлению
      const notification = document.createElement('div');
      notification.className = 'data-update-notification';
      notification.innerHTML = `
        <div style="
          background: #ffd93d; 
          color: #333; 
          padding: 15px; 
          border-radius: 8px; 
          margin: 10px;
          border-left: 4px solid #ffb700;
        ">
          <h4>⚠️ Данные устарели</h4>
          <p>Для получения актуальных данных из Яндекс.Музыки запустите:</p>
          <code style="background: #f0f0f0; padding: 5px; border-radius: 4px;">npm run collect-data</code>
          <button onclick="this.parentElement.parentElement.remove()" style="
            float: right; 
            background: none; 
            border: none; 
            font-size: 18px; 
            cursor: pointer;
          ">×</button>
        </div>
      `;
      
      document.body.insertBefore(notification, document.body.firstChild);
      
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 10000);
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
  // Настраиваем Mock API для демонстрации
  setupMockAPI();
  
  const container = document.getElementById('canvas-container');
  if (!container) {
    console.error('Контейнер canvas-container не найден');
    return;
  }

  const app = new MusicGalaxyApplication();
  
  try {
    await app.initialize(container);
    
    // Настройка базовых обработчиков событий UI
    setupBasicUIEventHandlers(app);
    
  } catch (error) {
    console.error('Не удалось инициализировать приложение:', error);
  }
});

function setupBasicUIEventHandlers(app: MusicGalaxyApp): void {
  // Обработчики клавиатуры остаются для удобства пользователей
  document.addEventListener('keydown', (event) => {
    // Проверяем, не открыто ли модальное окно поиска
    const appInstance = app as MusicGalaxyApplication;
    const isSearchOpen = appInstance['uiManager']?.isTrackSearchOpen();
    
    switch (event.code) {
      case 'KeyR':
        if (!isSearchOpen) {
          app.resetView();
        }
        break;
      case 'Space':
        if (!isSearchOpen) {
          event.preventDefault();
          app.toggleAnimation();
        }
        break;
      case 'KeyF':
        // Ctrl+F или Cmd+F для открытия поиска
        if ((event.ctrlKey || event.metaKey) && !isSearchOpen) {
          event.preventDefault();
          const uiManager = appInstance['uiManager'];
          if (uiManager) {
            uiManager.openTrackSearch();
          }
        }
        break;
    }
  });
}

// Экспорт для использования в других модулях
export { MusicGalaxyApplication, DEFAULT_CONFIG };
export { AudioManager } from './audio/AudioManager';
export { SceneManager } from './scene/SceneManager';
export { DataProcessor } from './data/DataProcessor';
export * from './types';

// Глобальный экспорт для использования в браузере
if (typeof window !== 'undefined') {
  (window as any).MusicGalaxyApplication = MusicGalaxyApplication;
  (window as any).SceneManager = SceneManager;
  (window as any).DataProcessor = DataProcessor;
}