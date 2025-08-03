import { MusicGalaxyApp, AppConfig, AppState, ProcessedTrack } from './types';
import { SceneManager } from './scene/SceneManager';
import { DataLoader } from './data/DataLoader';
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
      
    } catch (error) {
      this.state.isLoading = false;
      console.error('Ошибка инициализации:', error);
      this.showError(error as Error);
      throw error;
    }
  }

  private async loadMusicData(): Promise<void> {
    try {
      console.log('🔄 Загрузка музыкальных данных...');
      
      // Проверяем свежесть данных
      const isFresh = await DataLoader.checkDataFreshness();
      if (!isFresh) {
        console.warn('⚠️ Данные устарели или отсутствуют');
        this.showDataUpdateNotification();
      }
      
      // Загружаем данные
      const musicData = await DataLoader.loadMusicData();
      
      // Обрабатываем треки для 3D-сцены
      const processedTracks = this.processTracksForScene(musicData.tracks);
      
      // Загружаем треки в сцену
      this.loadTracks(processedTracks);
      
      // Обновляем статистику
      this.updateGenreStats(processedTracks);
      
      console.log(`✅ Загружено ${processedTracks.length} треков`);
      
    } catch (error) {
      console.error('❌ Ошибка загрузки музыкальных данных:', error);
      throw error;
    }
  }

  loadTracks(tracks: ProcessedTrack[]): void {
    console.log(`Загрузка ${tracks.length} треков в 3D-сцену...`);
    
    this.state.tracks = tracks;
    
    if (this.sceneManager) {
      // Создаем 3D-объекты для треков
      // Реализация будет добавлена в следующих задачах
      console.log('Создание 3D-объектов треков...');
    }
  }

  selectTrack(trackId: string): void {
    console.log(`Выбор трека: ${trackId}`);
    // Реализация будет добавлена в следующих задачах
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
      this.state.animationPaused = this.sceneManager.getInteractionManager().isAnimationPaused();
    }
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

  private processTracksForScene(tracks: any[]): ProcessedTrack[] {
    return tracks.map((track, index) => {
      // Определяем цвет по жанру
      const color = this.config.scene.genreColors[track.genre] || this.config.scene.genreColors.default;
      
      // Определяем размер (базовый размер + случайная вариация)
      const baseSize = this.config.scene.objectMinSize;
      const sizeRange = this.config.scene.objectMaxSize - this.config.scene.objectMinSize;
      const size = baseSize + (track.duration / 600) * sizeRange; // Размер зависит от длительности
      
      // Генерируем случайную позицию в сфере
      const position = this.generateSpherePosition(this.config.scene.galaxyRadius);
      
      return {
        id: track.id,
        name: track.title,
        artist: track.artist,
        album: track.album,
        genre: track.genre,
        duration: track.duration,
        popularity: Math.random() * 100, // Заглушка для популярности
        previewUrl: track.preview_url,
        imageUrl: track.cover_url,
        color,
        size: Math.max(baseSize, Math.min(size, this.config.scene.objectMaxSize)),
        position
      };
    });
  }

  private generateSpherePosition(radius: number): Vector3 {
    // Генерируем случайную точку на поверхности сферы
    const theta = Math.random() * Math.PI * 2; // Азимутальный угол
    const phi = Math.acos(2 * Math.random() - 1); // Полярный угол
    const r = radius * (0.5 + Math.random() * 0.5); // Радиус с вариацией
    
    return new Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
  }

  private updateGenreStats(tracks: ProcessedTrack[]): void {
    const stats: { [genre: string]: { count: number; percentage: number; color: string } } = {};
    
    // Подсчитываем треки по жанрам
    tracks.forEach(track => {
      if (!stats[track.genre]) {
        stats[track.genre] = {
          count: 0,
          percentage: 0,
          color: this.config.scene.genreColors[track.genre] || this.config.scene.genreColors.default
        };
      }
      stats[track.genre].count++;
    });
    
    // Вычисляем проценты
    const totalTracks = tracks.length;
    Object.keys(stats).forEach(genre => {
      stats[genre].percentage = (stats[genre].count / totalTracks) * 100;
    });
    
    this.state.genreStats = stats;
    
    // Обновляем UI статистики
    this.updateStatsUI();
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
  // Кнопка обновления данных
  const collectDataButton = document.getElementById('collect-data-button');
  if (collectDataButton) {
    collectDataButton.addEventListener('click', () => {
      showDataCollectionInstructions();
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

function showDataCollectionInstructions(): void {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;
  
  modal.innerHTML = `
    <div style="
      background: #1a1a1a;
      color: white;
      padding: 30px;
      border-radius: 12px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      border: 1px solid #333;
    ">
      <h2 style="margin-top: 0; color: #4fc3f7;">🎵 Обновление данных из Яндекс.Музыки</h2>
      
      <div style="margin: 20px 0;">
        <h3>📋 Пошаговая инструкция:</h3>
        <ol style="line-height: 1.6;">
          <li>Откройте <a href="https://music.yandex.ru" target="_blank" style="color: #4fc3f7;">music.yandex.ru</a> в новой вкладке</li>
          <li>Войдите в свой аккаунт Яндекс</li>
          <li>Откройте DevTools (нажмите F12)</li>
          <li>Перейдите на вкладку <strong>Application</strong> → <strong>Cookies</strong></li>
          <li>Найдите cookie с именем <code style="background: #333; padding: 2px 4px; border-radius: 3px;">Session_id</code></li>
          <li>Скопируйте его значение (длинная строка символов)</li>
        </ol>
      </div>
      
      <div style="margin: 20px 0;">
        <h3>💻 Запуск скрипта:</h3>
        <p>Откройте терминал в корне проекта и выполните:</p>
        <div style="background: #333; padding: 15px; border-radius: 8px; font-family: monospace;">
          npm run collect-data
        </div>
        <p style="margin-top: 10px; font-size: 14px; color: #ccc;">
          Или альтернативно: <code style="background: #333; padding: 2px 4px;">python scripts/collect_yandex_music_data.py</code>
        </p>
      </div>
      
      <div style="margin: 20px 0;">
        <h3>⚠️ Важные замечания:</h3>
        <ul style="line-height: 1.6; color: #ccc;">
          <li>Используется неофициальное API Яндекс.Музыки</li>
          <li>Токен действителен ограниченное время</li>
          <li>Данные сохраняются локально в файл <code>src/data/music_data.json</code></li>
          <li>После завершения скрипта перезагрузите эту страницу</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <button onclick="this.closest('div').parentElement.remove()" style="
          background: #4fc3f7;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
        ">
          Понятно
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Закрытие по клику вне модального окна
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Экспорт для использования в других модулях
export { MusicGalaxyApplication, DEFAULT_CONFIG };
export * from './types';