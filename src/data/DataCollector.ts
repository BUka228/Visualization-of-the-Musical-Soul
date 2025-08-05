/**
 * Автоматизированный сборщик данных из Яндекс.Музыки
 */

import { TokenManager, TokenValidationResult } from '../auth/TokenManager';
import { YandexTrackData, MusicDataFile } from './DataLoader';

export interface CollectionProgress {
  stage: 'connecting' | 'fetching' | 'processing' | 'saving' | 'complete' | 'error';
  message: string;
  progress: number; // 0-100
  currentTrack?: string;
  totalTracks?: number;
  processedTracks?: number;
}

export interface CollectionResult {
  success: boolean;
  data?: MusicDataFile;
  error?: string;
  tracksCollected?: number;
  tracksWithPreview?: number;
}

export type ProgressCallback = (progress: CollectionProgress) => void;

export class DataCollector {
  private progressCallback?: ProgressCallback;
  private abortController?: AbortController;

  constructor(progressCallback?: ProgressCallback) {
    this.progressCallback = progressCallback;
  }

  /**
   * Собирает данные из Яндекс.Музыки через Vercel API
   * @param token - токен авторизации
   * @param previewLimit - максимальное количество треков для получения превью (по умолчанию все)
   */
  async collectData(token: string, previewLimit?: number): Promise<CollectionResult> {
    this.abortController = new AbortController();
    
    try {
      // Сохраняем токен
      TokenManager.saveToken(token);
      
      this.updateProgress({
        stage: 'connecting',
        message: 'Подключаемся к Яндекс.Музыке...',
        progress: 5
      });

      // Небольшая задержка для показа анимации подключения
      await this.delay(800);

      this.updateProgress({
        stage: 'connecting',
        message: 'Проверяем токен авторизации...',
        progress: 15
      });

      await this.delay(500);

      this.updateProgress({
        stage: 'fetching',
        message: 'Получаем ваши любимые треки...',
        progress: 25
      });

      // Получаем все данные одним запросом через наш API
      const url = previewLimit ? `/api/getYandexData?previewLimit=${previewLimit}` : '/api/getYandexData';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
        signal: this.abortController?.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      this.updateProgress({
        stage: 'fetching',
        message: 'Загружаем информацию о треках...',
        progress: 50
      });

      const musicData: MusicDataFile = await response.json();

      this.updateProgress({
        stage: 'processing',
        message: 'Строим вашу галактику...',
        progress: 65,
        totalTracks: musicData.tracks.length,
        processedTracks: 0
      });

      // Симулируем обработку треков с прогрессом
      await this.simulateTrackProcessing(musicData.tracks);

      this.updateProgress({
        stage: 'processing',
        message: 'Настраиваем звезды...',
        progress: 85,
        totalTracks: musicData.tracks.length,
        processedTracks: musicData.tracks.length
      });

      await this.delay(800);

      this.updateProgress({
        stage: 'saving',
        message: 'Сохраняем данные...',
        progress: 95
      });

      // Сохраняем данные локально
      await this.saveData(musicData);

      await this.delay(300);

      this.updateProgress({
        stage: 'complete',
        message: 'Галактика создана успешно!',
        progress: 100
      });

      const tracksWithPreview = musicData.tracks.filter(t => t.preview_url).length;

      return {
        success: true,
        data: musicData,
        tracksCollected: musicData.tracks.length,
        tracksWithPreview: tracksWithPreview
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      
      this.updateProgress({
        stage: 'error',
        message: `Ошибка: ${errorMessage}`,
        progress: 0
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Симулирует обработку треков с показом прогресса
   */
  private async simulateTrackProcessing(tracks: YandexTrackData[]): Promise<void> {
    const totalTracks = tracks.length;
    const batchSize = Math.max(1, Math.floor(totalTracks / 20)); // Обрабатываем по батчам
    
    for (let i = 0; i < totalTracks; i += batchSize) {
      if (this.abortController?.signal.aborted) {
        throw new Error('Операция отменена');
      }

      const endIndex = Math.min(i + batchSize, totalTracks);
      const currentTrack = tracks[i];
      const progress = 65 + (i / totalTracks) * 20; // От 65% до 85%

      this.updateProgress({
        stage: 'processing',
        message: 'Обрабатываем треки...',
        progress: Math.round(progress),
        totalTracks: totalTracks,
        processedTracks: endIndex,
        currentTrack: currentTrack ? `${currentTrack.title} - ${currentTrack.artist}` : undefined
      });

      // Небольшая задержка для показа прогресса
      await this.delay(50);
    }
  }

  /**
   * Создает задержку
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Отменяет сбор данных
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Тестирует токен через Vercel API
   */
  private async testToken(token: string): Promise<TokenValidationResult> {
    try {
      // Делаем тестовый запрос к нашему API
      const response = await fetch('/api/getYandexData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
        signal: this.abortController?.signal
      });

      if (response.ok) {
        return { isValid: true };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          isValid: false,
          error: errorData.error || `HTTP ${response.status}`,
          needsRefresh: response.status === 401 || response.status === 403
        };
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Операция отменена');
      }
      
      // Если API недоступно, используем базовую валидацию
      console.warn('API недоступно, используем базовую валидацию токена');
      return TokenManager.validateToken({ 
        token, 
        createdAt: new Date(), 
        isValid: true 
      });
    }
  }



  /**
   * Сохраняет данные локально
   */
  private async saveData(data: MusicDataFile): Promise<void> {
    try {
      // Сохраняем в localStorage с кэшированием
      localStorage.setItem('music_data', JSON.stringify(data));
      localStorage.setItem('music_data_timestamp', new Date().toISOString());
      
      console.log('Данные сохранены в localStorage');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Операция отменена');
      }
      
      console.error('Ошибка сохранения данных:', error);
      throw new Error('Не удалось сохранить данные');
    }
  }

  /**
   * Обновляет прогресс
   */
  private updateProgress(progress: CollectionProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  /**
   * Проверяет, поддерживается ли автоматический сбор данных
   */
  static isSupported(): boolean {
    // Проверяем доступность API endpoints
    return typeof fetch !== 'undefined';
  }

  /**
   * Получает статус последнего сбора данных
   */
  static getLastCollectionStatus(): {
    hasData: boolean;
    lastCollection?: Date;
    tracksCount?: number;
    source?: string;
  } {
    try {
      // Проверяем localStorage на случай, если данные сохранены там
      const localData = localStorage.getItem('collected_music_data');
      if (localData) {
        const data: MusicDataFile = JSON.parse(localData);
        return {
          hasData: true,
          lastCollection: new Date(data.metadata.generated_at),
          tracksCount: data.tracks.length,
          source: 'localStorage'
        };
      }

      return { hasData: false };
    } catch {
      return { hasData: false };
    }
  }
}