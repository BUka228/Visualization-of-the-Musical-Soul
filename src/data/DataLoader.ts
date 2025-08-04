/**
 * Модуль для загрузки данных треков из JSON файла
 */

import { ProcessedTrack } from '../types/index.js';

export interface YandexTrackData {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  genre: string;
  cover_url?: string;
  preview_url?: string;
  available: boolean;
}

export interface MusicDataFile {
  metadata: {
    total_tracks: number;
    generated_at: string;
    source: string;
  };
  tracks: YandexTrackData[];
}

export interface DataLoadResult {
  success: boolean;
  data?: MusicDataFile;
  error?: string;
  isDemo: boolean;
  freshness?: 'fresh' | 'stale' | 'unknown';
}

export interface DataUpdateStatus {
  canUpdate: boolean;
  lastUpdate?: Date;
  hoursOld?: number;
  instructions: string;
}

/**
 * Загрузчик данных музыкальных треков
 */
export class DataLoader {
  private static readonly DATA_FILE_PATH = '/src/data/music_data.json';
  private static readonly DEMO_DATA_PATH = '/src/data/demo_data.json';

  /**
   * Загружает данные треков из JSON файла с расширенной информацией о результате
   */
  static async loadMusicDataWithResult(): Promise<DataLoadResult> {
    try {
      console.log('🔄 Загрузка данных треков...');
      
      // Пробуем загрузить реальные данные
      const response = await fetch(this.DATA_FILE_PATH);
      
      if (!response.ok) {
        console.warn('⚠️ Файл с данными не найден, загружаем демо-данные');
        const demoData = await this.loadDemoData();
        return {
          success: true,
          data: demoData,
          isDemo: true,
          freshness: 'unknown'
        };
      }

      const data: MusicDataFile = await response.json();
      
      // Валидация структуры данных
      const validationResult = this.validateMusicDataDetailed(data);
      if (!validationResult.isValid) {
        throw new Error(`Неверная структура данных: ${validationResult.errors.join(', ')}`);
      }

      // Проверяем свежесть данных
      const freshness = await this.getDataFreshness(data);
      
      console.log(`✅ Загружено ${data.tracks.length} треков`);
      return {
        success: true,
        data: data,
        isDemo: false,
        freshness: freshness
      };

    } catch (error) {
      console.error('❌ Ошибка загрузки данных:', error);
      console.log('🔄 Загружаем демо-данные...');
      
      try {
        const demoData = await this.loadDemoData();
        return {
          success: true,
          data: demoData,
          error: error instanceof Error ? error.message : 'Неизвестная ошибка',
          isDemo: true,
          freshness: 'unknown'
        };
      } catch (demoError) {
        return {
          success: false,
          error: `Не удалось загрузить ни основные, ни демо-данные: ${demoError}`,
          isDemo: true,
          freshness: 'unknown'
        };
      }
    }
  }

  /**
   * Загружает данные треков из JSON файла (совместимость с существующим кодом)
   */
  static async loadMusicData(): Promise<MusicDataFile> {
    const result = await this.loadMusicDataWithResult();
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Не удалось загрузить данные');
    }
    return result.data;
  }

  /**
   * Загружает демо-данные для тестирования
   */
  private static async loadDemoData(): Promise<MusicDataFile> {
    try {
      const response = await fetch(this.DEMO_DATA_PATH);
      
      if (!response.ok) {
        // Если демо-данных тоже нет, создаем минимальный набор
        return this.createMinimalDemoData();
      }

      const data: MusicDataFile = await response.json();
      console.log(`✅ Загружены демо-данные: ${data.tracks.length} треков`);
      return data;

    } catch (error) {
      console.warn('⚠️ Не удалось загрузить демо-данные, создаем минимальный набор');
      return this.createMinimalDemoData();
    }
  }

  /**
   * Создает минимальный набор демо-данных
   */
  private static createMinimalDemoData(): MusicDataFile {
    const demoTracks: YandexTrackData[] = [];

    return {
      metadata: {
        total_tracks: 0,
        generated_at: new Date().toISOString(),
        source: 'Empty Demo Data'
      },
      tracks: demoTracks
    };
  }

  /**
   * Валидирует структуру загруженных данных (простая версия)
   */
  private static validateMusicData(data: any): data is MusicDataFile {
    const result = this.validateMusicDataDetailed(data);
    return result.isValid;
  }

  /**
   * Детальная валидация структуры данных с описанием ошибок
   */
  private static validateMusicDataDetailed(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Проверка основной структуры
    if (!data || typeof data !== 'object') {
      errors.push('Данные должны быть объектом');
      return { isValid: false, errors };
    }

    // Проверка метаданных
    if (!data.metadata || typeof data.metadata !== 'object') {
      errors.push('Отсутствуют или некорректные метаданные');
    } else {
      if (typeof data.metadata.total_tracks !== 'number') {
        errors.push('Некорректное поле total_tracks в метаданных');
      }
      if (typeof data.metadata.generated_at !== 'string') {
        errors.push('Некорректное поле generated_at в метаданных');
      }
      if (typeof data.metadata.source !== 'string') {
        errors.push('Некорректное поле source в метаданных');
      }
    }

    // Проверка треков
    if (!data.tracks || !Array.isArray(data.tracks)) {
      errors.push('Отсутствует или некорректный массив треков');
      return { isValid: false, errors };
    }

    if (data.tracks.length === 0) {
      // Пустой массив треков допустим для демо-данных
      console.warn('⚠️ Массив треков пуст');
      return { isValid: true, errors };
    }

    // Проверяем структуру треков (первые 5 для производительности)
    const sampleTracks = data.tracks.slice(0, Math.min(5, data.tracks.length));
    for (let i = 0; i < sampleTracks.length; i++) {
      const track = sampleTracks[i];
      const trackErrors = this.validateTrackStructure(track, i);
      errors.push(...trackErrors);
    }

    // Проверка соответствия количества треков
    if (data.metadata && data.metadata.total_tracks !== data.tracks.length) {
      errors.push(`Несоответствие количества треков: заявлено ${data.metadata.total_tracks}, найдено ${data.tracks.length}`);
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Валидирует структуру отдельного трека
   */
  private static validateTrackStructure(track: any, index: number): string[] {
    const errors: string[] = [];
    const prefix = `Трек ${index + 1}:`;

    if (!track || typeof track !== 'object') {
      errors.push(`${prefix} должен быть объектом`);
      return errors;
    }

    // Обязательные поля
    const requiredFields = ['id', 'title', 'artist', 'album', 'duration', 'genre', 'available'];
    for (const field of requiredFields) {
      if (!(field in track)) {
        errors.push(`${prefix} отсутствует обязательное поле '${field}'`);
      }
    }

    // Проверка типов
    if (track.id && typeof track.id !== 'string') {
      errors.push(`${prefix} поле 'id' должно быть строкой`);
    }
    if (track.title && typeof track.title !== 'string') {
      errors.push(`${prefix} поле 'title' должно быть строкой`);
    }
    if (track.artist && typeof track.artist !== 'string') {
      errors.push(`${prefix} поле 'artist' должно быть строкой`);
    }
    if (track.album && typeof track.album !== 'string') {
      errors.push(`${prefix} поле 'album' должно быть строкой`);
    }
    if (track.duration && typeof track.duration !== 'number') {
      errors.push(`${prefix} поле 'duration' должно быть числом`);
    }
    if (track.genre && typeof track.genre !== 'string') {
      errors.push(`${prefix} поле 'genre' должно быть строкой`);
    }
    if (track.available && typeof track.available !== 'boolean') {
      errors.push(`${prefix} поле 'available' должно быть булевым значением`);
    }

    // Проверка опциональных полей
    if (track.cover_url && typeof track.cover_url !== 'string') {
      errors.push(`${prefix} поле 'cover_url' должно быть строкой`);
    }
    if (track.preview_url && track.preview_url !== null && typeof track.preview_url !== 'string') {
      errors.push(`${prefix} поле 'preview_url' должно быть строкой или null`);
    }

    // Проверка значений
    if (track.duration && track.duration < 0) {
      errors.push(`${prefix} длительность не может быть отрицательной`);
    }
    if (track.title && track.title.trim().length === 0) {
      errors.push(`${prefix} название не может быть пустым`);
    }
    if (track.artist && track.artist.trim().length === 0) {
      errors.push(`${prefix} исполнитель не может быть пустым`);
    }

    return errors;
  }

  /**
   * Проверяет, доступны ли свежие данные
   */
  static async checkDataFreshness(): Promise<boolean> {
    try {
      const response = await fetch(this.DATA_FILE_PATH);
      if (!response.ok) return false;

      const data: MusicDataFile = await response.json();
      const generatedAt = new Date(data.metadata.generated_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60);

      // Данные считаются свежими, если им меньше 24 часов
      return hoursDiff < 24;
    } catch {
      return false;
    }
  }

  /**
   * Определяет свежесть данных
   */
  private static async getDataFreshness(data: MusicDataFile): Promise<'fresh' | 'stale' | 'unknown'> {
    try {
      const generatedAt = new Date(data.metadata.generated_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        return 'fresh';
      } else {
        return 'stale';
      }
    } catch {
      return 'unknown';
    }
  }

  /**
   * Возвращает статус обновления данных
   */
  static async getDataUpdateStatus(): Promise<DataUpdateStatus> {
    try {
      const response = await fetch(this.DATA_FILE_PATH);
      
      if (!response.ok) {
        return {
          canUpdate: true,
          instructions: this.getUpdateInstructions()
        };
      }

      const data: MusicDataFile = await response.json();
      const generatedAt = new Date(data.metadata.generated_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60);

      return {
        canUpdate: true,
        lastUpdate: generatedAt,
        hoursOld: Math.round(hoursDiff * 100) / 100,
        instructions: this.getUpdateInstructions()
      };

    } catch (error) {
      return {
        canUpdate: true,
        instructions: this.getUpdateInstructions()
      };
    }
  }

  /**
   * Возвращает инструкции по обновлению данных
   */
  static getUpdateInstructions(): string {
    return `
Для обновления данных из Яндекс.Музыки:

1. Откройте терминал в корне проекта
2. Выполните команду: npm run collect-data
3. Следуйте инструкциям для получения токена
4. Перезагрузите страницу после завершения

Альтернативно:
python scripts/collect_yandex_music_data.py
    `.trim();
  }

  /**
   * Возвращает статистику загруженных данных
   */
  static async getDataStatistics(): Promise<{
    totalTracks: number;
    genres: { [genre: string]: number };
    source: string;
    lastUpdate: string;
    isDemo: boolean;
  } | null> {
    try {
      const result = await this.loadMusicDataWithResult();
      
      if (!result.success || !result.data) {
        return null;
      }

      const data = result.data;
      const genres: { [genre: string]: number } = {};

      // Подсчитываем треки по жанрам
      for (const track of data.tracks) {
        const genre = track.genre || 'unknown';
        genres[genre] = (genres[genre] || 0) + 1;
      }

      return {
        totalTracks: data.tracks.length,
        genres: genres,
        source: data.metadata.source,
        lastUpdate: data.metadata.generated_at,
        isDemo: result.isDemo
      };

    } catch (error) {
      console.error('Ошибка получения статистики:', error);
      return null;
    }
  }

  /**
   * Проверяет доступность файла с данными
   */
  static async checkDataFileExists(): Promise<boolean> {
    try {
      const response = await fetch(this.DATA_FILE_PATH, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Конвертирует YandexTrackData в ProcessedTrack (базовая конвертация)
   */
  static convertToProcessedTrack(yandexTrack: YandexTrackData, index: number = 0): ProcessedTrack {
    // Базовые цвета для жанров (будут переопределены в DataProcessor)
    const genreColors: { [key: string]: string } = {
      'rock': '#FF4500',
      'pop': '#FFD700',
      'indie': '#4169E1',
      'metal': '#FF0000',
      'electronic': '#9400D3',
      'jazz': '#228B22',
      'classical': '#F5F5DC',
      'hip-hop': '#8B4513',
      'kpop': '#FF69B4',
      'dance': '#00CED1',
      'rnb': '#8A2BE2',
      'default': '#FFFFFF'
    };

    const color = genreColors[yandexTrack.genre] || genreColors['default'];
    
    // Базовый размер (будет переопределен в DataProcessor)
    const baseSize = Math.max(0.5, Math.min(3.0, yandexTrack.duration / 100));
    
    // Базовая позиция (будет переопределена в DataProcessor)
    const angle = (index / 100) * Math.PI * 2;
    const radius = 20 + Math.random() * 30;
    const position = {
      x: Math.cos(angle) * radius,
      y: (Math.random() - 0.5) * 20,
      z: Math.sin(angle) * radius
    } as any; // Временно как any, так как Vector3 будет создан в DataProcessor

    return {
      id: yandexTrack.id,
      name: yandexTrack.title,
      artist: yandexTrack.artist,
      album: yandexTrack.album,
      genre: yandexTrack.genre,
      popularity: 50, // Базовое значение, будет переопределено в DataProcessor
      duration: yandexTrack.duration,
      previewUrl: yandexTrack.preview_url || undefined,
      color: color,
      size: baseSize,
      position: position
    };
  }
}