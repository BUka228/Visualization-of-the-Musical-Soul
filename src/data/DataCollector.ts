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
   * Собирает данные из Яндекс.Музыки
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

      // Тестируем токен
      const tokenValidation = await this.testToken(token);
      if (!tokenValidation.isValid) {
        throw new Error(tokenValidation.error || 'Неверный токен');
      }

      this.updateProgress({
        stage: 'fetching',
        message: 'Получение списка лайкнутых треков...',
        progress: 20
      });

      // Получаем треки
      const tracks = await this.fetchLikedTracks(token);
      
      this.updateProgress({
        stage: 'processing',
        message: 'Обработка треков...',
        progress: 40,
        totalTracks: tracks.length,
        processedTracks: 0
      });

      // Обрабатываем треки
      const processedTracks = await this.processTracksWithProgress(tracks, token);

      this.updateProgress({
        stage: 'saving',
        message: 'Сохранение данных...',
        progress: 90
      });

      // Создаем финальный объект данных
      const musicData: MusicDataFile = {
        metadata: {
          total_tracks: processedTracks.length,
          generated_at: new Date().toISOString(),
          source: 'Yandex Music API'
        },
        tracks: processedTracks
      };

      // Сохраняем данные
      await this.saveData(musicData);

      this.updateProgress({
        stage: 'complete',
        message: 'Данные успешно собраны!',
        progress: 100
      });

      const tracksWithPreview = processedTracks.filter(t => t.preview_url).length;

      return {
        success: true,
        data: musicData,
        tracksCollected: processedTracks.length,
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
   * Тестирует токен
   */
  private async testToken(token: string): Promise<TokenValidationResult> {
    try {
      const response = await fetch('/api/yandex-music/test', {
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
   * Получает лайкнутые треки
   */
  private async fetchLikedTracks(token: string): Promise<any[]> {
    try {
      const response = await fetch('/api/yandex-music/liked-tracks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
        signal: this.abortController?.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Ошибка получения треков: HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.tracks || [];
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Операция отменена');
      }
      throw error;
    }
  }

  /**
   * Обрабатывает треки с отображением прогресса
   */
  private async processTracksWithProgress(tracks: any[], token: string): Promise<YandexTrackData[]> {
    const processedTracks: YandexTrackData[] = [];
    const batchSize = 10; // Обрабатываем по 10 треков за раз
    
    for (let i = 0; i < tracks.length; i += batchSize) {
      if (this.abortController?.signal.aborted) {
        throw new Error('Операция отменена');
      }

      const batch = tracks.slice(i, Math.min(i + batchSize, tracks.length));
      const batchResults = await Promise.allSettled(
        batch.map(track => this.processTrack(track, token))
      );

      // Добавляем успешно обработанные треки
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          processedTracks.push(result.value);
        } else {
          console.warn(`Не удалось обработать трек ${i + index + 1}:`, 
            result.status === 'rejected' ? result.reason : 'Неизвестная ошибка');
        }
      });

      // Обновляем прогресс
      const progress = Math.round(((i + batch.length) / tracks.length) * 50) + 40; // 40-90%
      this.updateProgress({
        stage: 'processing',
        message: 'Обработка треков...',
        progress,
        totalTracks: tracks.length,
        processedTracks: processedTracks.length,
        currentTrack: batch[0]?.title || ''
      });

      // Небольшая пауза между батчами
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return processedTracks;
  }

  /**
   * Обрабатывает один трек
   */
  private async processTrack(track: any, token: string): Promise<YandexTrackData | null> {
    try {
      // Получаем детальную информацию о треке
      const trackDetails = await this.fetchTrackDetails(track.id, token);
      
      return {
        id: String(trackDetails.id || track.id),
        title: trackDetails.title || track.title || 'Unknown Title',
        artist: this.extractArtist(trackDetails.artists || track.artists),
        album: this.extractAlbum(trackDetails.albums || track.albums),
        duration: Math.floor((trackDetails.duration_ms || track.duration_ms || 0) / 1000),
        genre: this.extractGenre(trackDetails),
        cover_url: this.extractCoverUrl(trackDetails),
        preview_url: await this.getPreviewUrl(trackDetails, token) || undefined,
        available: trackDetails.available !== false
      };
    } catch (error) {
      console.warn(`Ошибка обработки трека ${track.id}:`, error);
      return null;
    }
  }

  /**
   * Получает детальную информацию о треке
   */
  private async fetchTrackDetails(trackId: string, token: string): Promise<any> {
    try {
      const response = await fetch('/api/yandex-music/track-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, trackId }),
        signal: this.abortController?.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.track || {};
    } catch (error) {
      // Возвращаем базовую информацию, если детали недоступны
      return { id: trackId };
    }
  }

  /**
   * Получает URL превью трека
   */
  private async getPreviewUrl(track: any, token: string): Promise<string | null> {
    try {
      const response = await fetch('/api/yandex-music/track-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, trackId: track.id }),
        signal: this.abortController?.signal
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.preview_url || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Извлекает имя исполнителя
   */
  private extractArtist(artists: any[]): string {
    if (!artists || !Array.isArray(artists) || artists.length === 0) {
      return 'Unknown Artist';
    }
    return artists[0].name || 'Unknown Artist';
  }

  /**
   * Извлекает название альбома
   */
  private extractAlbum(albums: any[]): string {
    if (!albums || !Array.isArray(albums) || albums.length === 0) {
      return 'Unknown Album';
    }
    return albums[0].title || 'Unknown Album';
  }

  /**
   * Извлекает жанр
   */
  private extractGenre(track: any): string {
    try {
      // Пробуем получить жанр из исполнителя
      if (track.artists && track.artists[0] && track.artists[0].genres) {
        return track.artists[0].genres[0] || 'unknown';
      }
      
      // Пробуем получить жанр из альбома
      if (track.albums && track.albums[0] && track.albums[0].genre) {
        return track.albums[0].genre;
      }
      
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Извлекает URL обложки
   */
  private extractCoverUrl(track: any): string | undefined {
    try {
      if (track.cover_uri) {
        return `https://${track.cover_uri.replace('%%', '400x400')}`;
      }
      
      if (track.albums && track.albums[0] && track.albums[0].cover_uri) {
        return `https://${track.albums[0].cover_uri.replace('%%', '400x400')}`;
      }
      
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Сохраняет данные в файл
   */
  private async saveData(data: MusicDataFile): Promise<void> {
    try {
      const response = await fetch('/api/save-music-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: this.abortController?.signal
      });

      if (!response.ok) {
        throw new Error(`Ошибка сохранения: HTTP ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Операция отменена');
      }
      
      // Fallback: сохраняем в localStorage для последующего использования
      console.warn('Не удалось сохранить на сервер, сохраняем локально');
      localStorage.setItem('collected_music_data', JSON.stringify(data));
      throw error;
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