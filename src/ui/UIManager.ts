import { AppState, ProcessedTrack } from '../types';
import { TrackSearchModal, TrackSearchCallbacks } from './TrackSearchModal';
import { SearchButton } from './SearchButton';

export class UIManager {
  private initialized: boolean = false;
  private trackSearchModal: TrackSearchModal;
  private searchButton: SearchButton;
  private tracks: ProcessedTrack[] = [];
  private onTrackSelected?: (trackId: string) => void;

  constructor() {
    this.trackSearchModal = new TrackSearchModal();
    this.searchButton = new SearchButton();
  }

  initialize(): void {
    console.log('Инициализация UI Manager...');
    this.initialized = true;
  }

  /**
   * Устанавливает треки для поиска
   */
  setTracks(tracks: ProcessedTrack[]): void {
    this.tracks = tracks;
    
    // Показываем кнопку поиска если есть треки
    if (tracks.length > 0) {
      this.searchButton.show(() => this.openTrackSearch());
      console.log(`🔍 Search functionality enabled for ${tracks.length} tracks`);
    } else {
      this.searchButton.hide();
    }
  }

  /**
   * Устанавливает коллбэк для выбора трека
   */
  setOnTrackSelected(callback: (trackId: string) => void): void {
    this.onTrackSelected = callback;
  }

  /**
   * Открывает модальное окно поиска треков
   */
  openTrackSearch(): void {
    if (this.tracks.length === 0) {
      console.warn('⚠️ No tracks available for search');
      return;
    }

    const callbacks: TrackSearchCallbacks = {
      onTrackSelected: (trackId: string) => {
        console.log(`🎯 Track selected from search: ${trackId}`);
        if (this.onTrackSelected) {
          this.onTrackSelected(trackId);
        }
      },
      onSearchClosed: () => {
        console.log('🔍 Track search closed');
      }
    };

    this.trackSearchModal.show(this.tracks, callbacks);
  }

  /**
   * Закрывает модальное окно поиска треков
   */
  closeTrackSearch(): void {
    this.trackSearchModal.hide();
  }

  /**
   * Проверяет, открыто ли модальное окно поиска
   */
  isTrackSearchOpen(): boolean {
    return this.trackSearchModal.isOpen();
  }

  createDataCollectionButton(): void {
    // Создаем кнопку для сбора данных, если её ещё нет
    if (!document.getElementById('collect-data-button')) {
      const button = document.createElement('button');
      button.id = 'collect-data-button';
      button.textContent = 'Обновить данные';
      button.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4fc3f7;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        z-index: 1000;
        font-size: 14px;
      `;
      document.body.appendChild(button);
    }
  }

  // Visual mode switcher removed - only Soul Galaxy mode remains

  // Visual mode switching methods removed - only Soul Galaxy mode remains

  updateAppState(state: AppState): void {
    console.log('Обновление состояния UI:', state);
    // Здесь можно добавить логику обновления UI элементов
    // на основе состояния приложения
  }

  /**
   * Показывает уведомление о том, как выйти из режима фокуса
   */
  showFocusExitHint(crystalName: string): void {
    // Удаляем предыдущее уведомление если есть
    this.hideFocusExitHint();
    
    const hint = document.createElement('div');
    hint.id = 'focus-exit-hint';
    hint.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: bold;">🎯 Фокус на: ${crystalName}</div>
      <div style="font-size: 12px; opacity: 0.8;">
        • ESC или Пробел - выйти из фокуса<br>
        • Движение мыши/колеса - выйти из фокуса<br>
        • Автоматический выход через 15 сек
      </div>
    `;
    hint.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-family: Arial, sans-serif;
      z-index: 1001;
      max-width: 300px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      animation: fadeIn 0.3s ease-out;
    `;
    
    // Добавляем CSS анимацию
    if (!document.getElementById('focus-hint-styles')) {
      const style = document.createElement('style');
      style.id = 'focus-hint-styles';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-10px); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(hint);
    
    console.log(`💡 Focus exit hint shown for crystal: ${crystalName}`);
  }

  /**
   * Скрывает уведомление о выходе из режима фокуса
   */
  hideFocusExitHint(): void {
    const hint = document.getElementById('focus-exit-hint');
    if (hint) {
      hint.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        if (hint.parentNode) {
          hint.parentNode.removeChild(hint);
        }
      }, 300);
      console.log('💡 Focus exit hint hidden');
    }
  }

  /**
   * Показывает панель воспроизведения трека вверху экрана
   */
  showNowPlayingPanel(trackData: {
    title: string;
    artist: string;
    album: string;
    coverUrl?: string;
  }): void {
    const panel = document.getElementById('now-playing-panel');
    const titleEl = document.getElementById('now-playing-title');
    const artistEl = document.getElementById('now-playing-artist');
    const albumEl = document.getElementById('now-playing-album');
    const coverEl = document.getElementById('now-playing-cover') as HTMLImageElement;

    if (!panel || !titleEl || !artistEl || !albumEl || !coverEl) {
      console.warn('⚠️ Now playing panel elements not found');
      return;
    }

    // Заполняем данные
    titleEl.textContent = trackData.title;
    artistEl.textContent = trackData.artist;
    albumEl.textContent = trackData.album;

    // Устанавливаем обложку альбома
    if (trackData.coverUrl) {
      coverEl.src = trackData.coverUrl;
      coverEl.style.display = 'block';
    } else {
      // Используем заглушку если нет обложки
      coverEl.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjMzMzIiByeD0iOCIvPgo8cGF0aCBkPSJNMzAgMTVWNDVNMTUgMzBINDUiIHN0cm9rZT0iIzY2NiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPHN2Zz4K';
      coverEl.style.display = 'block';
    }

    // Убираем класс fade-out если есть
    panel.classList.remove('fade-out');
    
    // Показываем панель
    panel.style.display = 'block';

    console.log(`🎵 Now playing panel shown: ${trackData.title} by ${trackData.artist}`);
  }

  /**
   * Скрывает панель воспроизведения трека
   */
  hideNowPlayingPanel(): void {
    const panel = document.getElementById('now-playing-panel');
    
    if (!panel || panel.style.display === 'none') {
      return;
    }

    // Добавляем анимацию исчезновения
    panel.classList.add('fade-out');
    
    // Скрываем панель после анимации
    setTimeout(() => {
      panel.style.display = 'none';
      panel.classList.remove('fade-out');
    }, 300);

    console.log('🎵 Now playing panel hidden');
  }

  dispose(): void {
    console.log('Освобождение ресурсов UI Manager...');
    
    // Освобождаем ресурсы поиска треков
    this.trackSearchModal.dispose();
    this.searchButton.dispose();
    
    // Удаляем созданные элементы
    const collectButton = document.getElementById('collect-data-button');
    if (collectButton) {
      collectButton.remove();
    }
    
    // Удаляем уведомление о фокусе
    this.hideFocusExitHint();
    
    // Скрываем панель воспроизведения
    this.hideNowPlayingPanel();
    
    // Удаляем стили
    const styles = document.getElementById('focus-hint-styles');
    if (styles) {
      styles.remove();
    }
    
    // Очищаем данные
    this.tracks = [];
    this.onTrackSelected = undefined;
    this.initialized = false;
  }
}