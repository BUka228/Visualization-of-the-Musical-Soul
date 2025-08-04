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
   */
  async collectData(token: string): Promise<CollectionResult> {
    this.abortController = new AbortController();
    
    try {
      // Сохраняем токен
      TokenManager.saveToken(token);
      
      this.updateProgress({
        stage: 'connecting',
        message: 'Подключение к Яндекс.Музыке...',
        progress: 10
      });

      this.updateProgress({
        stage: 'fetching',
        message: 'Получение данных из Яндекс.Музыки...',
        progress: 30
      });

      // Получаем все данные одним запросом через наш API
      const response = await fetch('/api/getYandexData', {
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

      const musicData: MusicDataFile = await response.json();

      this.updateProgress({
        stage: 'processing',
        message: 'Обработка полученных данных...',
        progress: 70
      });

      this.updateProgress({
        stage: 'saving',
        message: 'Сохранение данных...',
        progress: 90
      });

      // Сохраняем данные локально
      await this.saveData(musicData);

      this.updateProgress({
        stage: 'complete',
        message: 'Данные успешно собраны!',
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