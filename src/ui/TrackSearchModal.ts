/**
 * Модальное окно поиска треков
 * Позволяет искать треки по названию, исполнителю и альбому
 */

import { ProcessedTrack } from '../types';

export interface SearchResult {
  track: ProcessedTrack;
  relevanceScore: number;
  matchType: 'title' | 'artist' | 'album' | 'combined';
}

export interface TrackSearchCallbacks {
  onTrackSelected: (trackId: string) => void;
  onSearchClosed: () => void;
}

export class TrackSearchModal {
  private modal?: HTMLElement;
  private searchInput?: HTMLInputElement;
  private resultsContainer?: HTMLElement;
  private tracks: ProcessedTrack[] = [];
  private callbacks?: TrackSearchCallbacks;
  private isVisible: boolean = false;
  private searchTimeout?: number;
  private maxResults: number = 50;

  constructor() {
    this.createModal();
    this.setupEventListeners();
  }

  /**
   * Показывает модальное окно поиска
   */
  show(tracks: ProcessedTrack[], callbacks: TrackSearchCallbacks): void {
    this.tracks = tracks;
    this.callbacks = callbacks;
    
    if (!this.modal) {
      console.error('❌ Search modal not initialized');
      return;
    }

    this.modal.style.display = 'flex';
    this.isVisible = true;
    
    // Фокусируемся на поле поиска
    if (this.searchInput) {
      this.searchInput.focus();
      this.searchInput.value = '';
    }
    
    // Показываем все треки изначально (первые 50)
    this.displaySearchResults(this.tracks.slice(0, this.maxResults).map(track => ({
      track,
      relevanceScore: 1.0,
      matchType: 'combined' as const
    })));

    console.log(`🔍 Track search modal opened with ${tracks.length} tracks`);
  }

  /**
   * Скрывает модальное окно поиска
   */
  hide(): void {
    if (!this.modal) return;

    this.modal.style.display = 'none';
    this.isVisible = false;
    
    // Очищаем поиск
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    
    if (this.resultsContainer) {
      this.resultsContainer.innerHTML = '';
    }

    // Вызываем коллбэк закрытия
    if (this.callbacks?.onSearchClosed) {
      this.callbacks.onSearchClosed();
    }

    console.log('🔍 Track search modal closed');
  }

  /**
   * Проверяет, видимо ли модальное окно
   */
  isOpen(): boolean {
    return this.isVisible;
  }

  /**
   * Создает HTML структуру модального окна
   */
  private createModal(): void {
    this.modal = document.createElement('div');
    this.modal.id = 'track-search-modal';
    this.modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: none;
      justify-content: center;
      align-items: flex-start;
      padding-top: 10vh;
      z-index: 2000;
      backdrop-filter: blur(5px);
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: rgba(20, 20, 30, 0.95);
      border-radius: 12px;
      padding: 24px;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    `;

    // Заголовок
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    `;

    const title = document.createElement('h2');
    title.textContent = '🔍 Поиск треков';
    title.style.cssText = `
      margin: 0;
      color: #fff;
      font-size: 20px;
      font-weight: 600;
    `;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '✕';
    closeButton.style.cssText = `
      background: none;
      border: none;
      color: #ccc;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s;
    `;
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.background = 'rgba(255, 255, 255, 0.1)';
      closeButton.style.color = '#fff';
    });
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.background = 'none';
      closeButton.style.color = '#ccc';
    });
    closeButton.addEventListener('click', () => this.hide());

    header.appendChild(title);
    header.appendChild(closeButton);

    // Поле поиска
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = `
      position: relative;
      margin-bottom: 20px;
    `;

    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Введите название трека, исполнителя или альбома...';
    this.searchInput.style.cssText = `
      width: 100%;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: #fff;
      font-size: 16px;
      outline: none;
      transition: all 0.2s;
      box-sizing: border-box;
    `;

    // Стили для фокуса поля поиска
    this.searchInput.addEventListener('focus', () => {
      if (this.searchInput) {
        this.searchInput.style.borderColor = '#4fc3f7';
        this.searchInput.style.boxShadow = '0 0 0 2px rgba(79, 195, 247, 0.2)';
      }
    });
    this.searchInput.addEventListener('blur', () => {
      if (this.searchInput) {
        this.searchInput.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        this.searchInput.style.boxShadow = 'none';
      }
    });

    searchContainer.appendChild(this.searchInput);

    // Контейнер результатов
    this.resultsContainer = document.createElement('div');
    this.resultsContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      max-height: 50vh;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.2);
    `;

    // Добавляем кастомный скроллбар
    const style = document.createElement('style');
    style.textContent = `
      #track-search-modal .results-container::-webkit-scrollbar {
        width: 8px;
      }
      #track-search-modal .results-container::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }
      #track-search-modal .results-container::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
      }
      #track-search-modal .results-container::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
      }
    `;
    document.head.appendChild(style);
    this.resultsContainer.className = 'results-container';

    // Подсказка
    const hint = document.createElement('div');
    hint.textContent = 'Нажмите Enter или кликните на трек для перехода к нему';
    hint.style.cssText = `
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      color: #999;
      font-size: 12px;
      text-align: center;
    `;

    modalContent.appendChild(header);
    modalContent.appendChild(searchContainer);
    modalContent.appendChild(this.resultsContainer);
    modalContent.appendChild(hint);

    this.modal.appendChild(modalContent);
    document.body.appendChild(this.modal);

    console.log('🔍 Track search modal created');
  }

  /**
   * Настраивает обработчики событий
   */
  private setupEventListeners(): void {
    if (!this.searchInput || !this.modal) return;

    // Поиск по вводу текста с задержкой
    this.searchInput.addEventListener('input', (event) => {
      const query = (event.target as HTMLInputElement).value.trim();
      
      // Очищаем предыдущий таймер
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      
      // Устанавливаем новый таймер для поиска
      this.searchTimeout = window.setTimeout(() => {
        this.performSearch(query);
      }, 300); // Задержка 300мс для оптимизации
    });

    // Обработка Enter для выбора первого результата
    this.searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.selectFirstResult();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.hide();
      }
    });

    // Закрытие по клику на фон
    this.modal.addEventListener('click', (event) => {
      if (event.target === this.modal) {
        this.hide();
      }
    });

    // Закрытие по Escape
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  /**
   * Выполняет поиск треков
   */
  private performSearch(query: string): void {
    if (!query) {
      // Показываем все треки если запрос пустой
      this.displaySearchResults(this.tracks.slice(0, this.maxResults).map(track => ({
        track,
        relevanceScore: 1.0,
        matchType: 'combined' as const
      })));
      return;
    }

    const results = this.searchTracks(query);
    this.displaySearchResults(results);

    console.log(`🔍 Search performed for "${query}", found ${results.length} results`);
  }

  /**
   * Ищет треки по запросу
   */
  private searchTracks(query: string): SearchResult[] {
    const normalizedQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    for (const track of this.tracks) {
      const titleMatch = this.calculateMatchScore(track.name.toLowerCase(), normalizedQuery);
      const artistMatch = this.calculateMatchScore(track.artist.toLowerCase(), normalizedQuery);
      const albumMatch = this.calculateMatchScore(track.album.toLowerCase(), normalizedQuery);

      // Определяем лучшее совпадение
      const maxScore = Math.max(titleMatch, artistMatch, albumMatch);
      
      if (maxScore > 0) {
        let matchType: SearchResult['matchType'] = 'combined';
        
        if (titleMatch === maxScore && titleMatch > artistMatch && titleMatch > albumMatch) {
          matchType = 'title';
        } else if (artistMatch === maxScore && artistMatch > titleMatch && artistMatch > albumMatch) {
          matchType = 'artist';
        } else if (albumMatch === maxScore && albumMatch > titleMatch && albumMatch > artistMatch) {
          matchType = 'album';
        }

        results.push({
          track,
          relevanceScore: maxScore,
          matchType
        });
      }
    }

    // Сортируем по релевантности
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Ограничиваем количество результатов
    return results.slice(0, this.maxResults);
  }

  /**
   * Вычисляет оценку совпадения строк
   */
  private calculateMatchScore(text: string, query: string): number {
    if (!text || !query) return 0;

    // Точное совпадение
    if (text === query) return 1.0;

    // Совпадение с начала
    if (text.startsWith(query)) return 0.9;

    // Содержит запрос
    if (text.includes(query)) return 0.7;

    // Нечеткое совпадение (простая версия)
    const words = query.split(' ').filter(word => word.length > 0);
    let matchedWords = 0;
    
    for (const word of words) {
      if (text.includes(word)) {
        matchedWords++;
      }
    }

    if (matchedWords > 0) {
      return 0.5 * (matchedWords / words.length);
    }

    return 0;
  }

  /**
   * Отображает результаты поиска
   */
  private displaySearchResults(results: SearchResult[]): void {
    if (!this.resultsContainer) return;

    this.resultsContainer.innerHTML = '';

    if (results.length === 0) {
      const noResults = document.createElement('div');
      noResults.textContent = 'Треки не найдены';
      noResults.style.cssText = `
        padding: 40px 20px;
        text-align: center;
        color: #999;
        font-style: italic;
      `;
      this.resultsContainer.appendChild(noResults);
      return;
    }

    results.forEach((result, index) => {
      const resultItem = this.createResultItem(result, index);
      this.resultsContainer!.appendChild(resultItem);
    });
  }

  /**
   * Создает элемент результата поиска
   */
  private createResultItem(result: SearchResult, index: number): HTMLElement {
    const item = document.createElement('div');
    item.style.cssText = `
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 12px;
    `;

    // Добавляем hover эффект
    item.addEventListener('mouseenter', () => {
      item.style.background = 'rgba(255, 255, 255, 0.1)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.background = 'transparent';
    });

    // Обработчик клика
    item.addEventListener('click', () => {
      this.selectTrack(result.track.id);
    });

    // Иконка жанра (цветной кружок)
    const genreIcon = document.createElement('div');
    genreIcon.style.cssText = `
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: ${result.track.color};
      flex-shrink: 0;
    `;

    // Информация о треке
    const trackInfo = document.createElement('div');
    trackInfo.style.cssText = `
      flex: 1;
      min-width: 0;
    `;

    const title = document.createElement('div');
    title.textContent = result.track.name;
    title.style.cssText = `
      color: #fff;
      font-weight: 500;
      font-size: 14px;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;

    const artist = document.createElement('div');
    artist.textContent = result.track.artist;
    artist.style.cssText = `
      color: #ccc;
      font-size: 12px;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;

    const album = document.createElement('div');
    album.textContent = result.track.album;
    album.style.cssText = `
      color: #999;
      font-size: 11px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;

    trackInfo.appendChild(title);
    trackInfo.appendChild(artist);
    trackInfo.appendChild(album);

    // Тип совпадения и оценка релевантности
    const matchInfo = document.createElement('div');
    matchInfo.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
      flex-shrink: 0;
    `;

    const matchType = document.createElement('div');
    const matchTypeText = {
      'title': '🎵',
      'artist': '👤',
      'album': '💿',
      'combined': '🔍'
    }[result.matchType];
    matchType.textContent = matchTypeText;
    matchType.style.cssText = `
      font-size: 12px;
      opacity: 0.7;
    `;

    const relevanceScore = document.createElement('div');
    relevanceScore.textContent = `${Math.round(result.relevanceScore * 100)}%`;
    relevanceScore.style.cssText = `
      font-size: 10px;
      color: #666;
    `;

    matchInfo.appendChild(matchType);
    matchInfo.appendChild(relevanceScore);

    item.appendChild(genreIcon);
    item.appendChild(trackInfo);
    item.appendChild(matchInfo);

    return item;
  }

  /**
   * Выбирает первый результат поиска
   */
  private selectFirstResult(): void {
    if (!this.resultsContainer) return;

    const firstResult = this.resultsContainer.querySelector('div[style*="cursor: pointer"]') as HTMLElement;
    if (firstResult) {
      firstResult.click();
    }
  }

  /**
   * Выбирает трек и закрывает модальное окно
   */
  private selectTrack(trackId: string): void {
    console.log(`🎯 Track selected from search: ${trackId}`);
    
    // Вызываем коллбэк выбора трека
    if (this.callbacks?.onTrackSelected) {
      this.callbacks.onTrackSelected(trackId);
    }
    
    // Закрываем модальное окно
    this.hide();
  }

  /**
   * Освобождает ресурсы
   */
  dispose(): void {
    console.log('🗑️ Disposing Track Search Modal...');
    
    // Очищаем таймер поиска
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = undefined;
    }
    
    // Удаляем модальное окно из DOM
    if (this.modal && this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal);
    }
    
    // Очищаем ссылки
    this.modal = undefined;
    this.searchInput = undefined;
    this.resultsContainer = undefined;
    this.tracks = [];
    this.callbacks = undefined;
    this.isVisible = false;
    
    console.log('✅ Track Search Modal disposed');
  }
}