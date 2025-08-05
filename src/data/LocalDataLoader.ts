/**
 * Загрузчик данных из локальной папки пользователя
 */

import { ProcessedTrack } from '../types/index.js';

export interface LocalTrackData {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  genre: string;
  available: boolean;
  cover_url?: string;
}

export interface LocalMusicDataFile {
  metadata: {
    total_tracks: number;
    generated_at: string;
    source: string;
  };
  tracks: LocalTrackData[];
}

export interface LocalDataLoadResult {
  success: boolean;
  data?: LocalMusicDataFile;
  audioFiles?: Map<string, File>;
  error?: string;
  totalTracks: number;
  availableTracks: number;
}

/**
 * Загрузчик локальных музыкальных данных
 */
export class LocalDataLoader {
  private folderHandle?: FileSystemDirectoryHandle;
  private audioCache = new Map<string, File>();

  constructor(folderHandle: FileSystemDirectoryHandle) {
    this.folderHandle = folderHandle;
  }

  /**
   * Загружает данные из выбранной папки
   */
  async loadMusicData(): Promise<LocalDataLoadResult> {
    if (!this.folderHandle) {
      return {
        success: false,
        error: 'Папка не выбрана',
        totalTracks: 0,
        availableTracks: 0
      };
    }

    try {
      console.log('🔄 Загрузка данных из локальной папки...');

      // Загружаем метаданные
      const metadata = await this.loadMetadata();
      
      // Загружаем аудиофайлы
      const audioFiles = await this.loadAudioFiles();
      
      // Фильтруем треки, для которых есть аудиофайлы
      const availableTracks = metadata.tracks.filter(track => 
        audioFiles.has(track.id)
      );

      const result: LocalDataLoadResult = {
        success: true,
        data: {
          ...metadata,
          tracks: availableTracks.map(track => ({
            ...track,
            available: true
          }))
        },
        audioFiles,
        totalTracks: metadata.tracks.length,
        availableTracks: availableTracks.length
      };

      console.log(`✅ Загружено ${availableTracks.length} из ${metadata.tracks.length} треков`);
      
      if (availableTracks.length < metadata.tracks.length) {
        const missingCount = metadata.tracks.length - availableTracks.length;
        console.warn(`⚠️ Отсутствует ${missingCount} аудиофайлов`);
      }

      return result;

    } catch (error) {
      console.error('❌ Ошибка загрузки локальных данных:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        totalTracks: 0,
        availableTracks: 0
      };
    }
  }

  /**
   * Загружает метаданные из metadata.json
   */
  private async loadMetadata(): Promise<LocalMusicDataFile> {
    if (!this.folderHandle) {
      throw new Error('Папка не выбрана');
    }

    try {
      const metadataHandle = await this.folderHandle.getFileHandle('metadata.json');
      const metadataFile = await metadataHandle.getFile();
      const metadataText = await metadataFile.text();
      
      const metadata: LocalMusicDataFile = JSON.parse(metadataText);
      
      // Валидация структуры
      this.validateMetadata(metadata);
      
      return metadata;
      
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFoundError') {
        throw new Error('Файл metadata.json не найден в выбранной папке');
      }
      throw error;
    }
  }

  /**
   * Загружает аудиофайлы из папки audio
   */
  private async loadAudioFiles(): Promise<Map<string, File>> {
    if (!this.folderHandle) {
      throw new Error('Папка не выбрана');
    }

    const audioFiles = new Map<string, File>();

    try {
      const audioHandle = await this.folderHandle.getDirectoryHandle('audio');
      
      for await (const [name, handle] of (audioHandle as any).entries()) {
        if (handle.kind === 'file' && name.endsWith('.mp3')) {
          const file = await handle.getFile();
          const trackId = name.replace('.mp3', '');
          audioFiles.set(trackId, file);
        }
      }
      
      console.log(`📁 Найдено ${audioFiles.size} аудиофайлов`);
      return audioFiles;
      
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFoundError') {
        throw new Error('Папка audio не найдена в выбранной папке');
      }
      throw error;
    }
  }

  /**
   * Валидирует структуру метаданных
   */
  private validateMetadata(metadata: any): void {
    if (!metadata || typeof metadata !== 'object') {
      throw new Error('Некорректная структура metadata.json');
    }

    if (!metadata.metadata || typeof metadata.metadata !== 'object') {
      throw new Error('Отсутствует секция metadata в файле');
    }

    if (!metadata.tracks || !Array.isArray(metadata.tracks)) {
      throw new Error('Отсутствует или некорректный массив tracks');
    }

    if (metadata.tracks.length === 0) {
      throw new Error('Массив tracks пуст');
    }

    // Проверяем структуру первых нескольких треков
    const sampleTracks = metadata.tracks.slice(0, Math.min(3, metadata.tracks.length));
    for (let i = 0; i < sampleTracks.length; i++) {
      const track = sampleTracks[i];
      this.validateTrack(track, i);
    }
  }

  /**
   * Валидирует структуру отдельного трека
   */
  private validateTrack(track: any, index: number): void {
    const requiredFields = ['id', 'title', 'artist', 'album', 'duration', 'genre'];
    
    for (const field of requiredFields) {
      if (!(field in track)) {
        throw new Error(`Трек ${index + 1}: отсутствует обязательное поле '${field}'`);
      }
    }

    if (typeof track.id !== 'string' || track.id.trim().length === 0) {
      throw new Error(`Трек ${index + 1}: поле 'id' должно быть непустой строкой`);
    }

    if (typeof track.title !== 'string' || track.title.trim().length === 0) {
      throw new Error(`Трек ${index + 1}: поле 'title' должно быть непустой строкой`);
    }

    if (typeof track.artist !== 'string' || track.artist.trim().length === 0) {
      throw new Error(`Трек ${index + 1}: поле 'artist' должно быть непустой строкой`);
    }

    if (typeof track.duration !== 'number' || track.duration <= 0) {
      throw new Error(`Трек ${index + 1}: поле 'duration' должно быть положительным числом`);
    }
  }

  /**
   * Получает аудиофайл по ID трека
   */
  async getAudioFile(trackId: string): Promise<File | null> {
    if (!this.folderHandle) {
      return null;
    }

    // Проверяем кэш
    if (this.audioCache.has(trackId)) {
      return this.audioCache.get(trackId)!;
    }

    try {
      const audioHandle = await this.folderHandle.getDirectoryHandle('audio');
      const fileHandle = await audioHandle.getFileHandle(`${trackId}.mp3`);
      const file = await fileHandle.getFile();
      
      // Кэшируем файл
      this.audioCache.set(trackId, file);
      
      return file;
    } catch (error) {
      console.warn(`Аудиофайл для трека ${trackId} не найден:`, error);
      return null;
    }
  }

  /**
   * Создает URL для воспроизведения трека
   */
  createAudioUrl(trackId: string): string | null {
    const file = this.audioCache.get(trackId);
    if (!file) {
      return null;
    }

    return URL.createObjectURL(file);
  }

  /**
   * Освобождает созданные URL объекты
   */
  revokeAudioUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Конвертирует LocalTrackData в ProcessedTrack
   */
  static convertToProcessedTrack(localTrack: LocalTrackData, index: number = 0): ProcessedTrack {
    // Цвета для жанров
    const genreColors: { [key: string]: string } = {
      'rock': '#FF4500',
      'pop': '#FFD700',
      'indie': '#4169E1',
      'metal': '#FF0000',
      'electronic': '#9400D3',
      'jazz': '#228B22',
      'classical': '#F5F5DC',
      'hip-hop': '#8B4513',
      'rap': '#8B4513',
      'kpop': '#FF69B4',
      'dance': '#00CED1',
      'rnb': '#8A2BE2',
      'r&b': '#8A2BE2',
      'folk': '#DEB887',
      'country': '#CD853F',
      'blues': '#4682B4',
      'reggae': '#32CD32',
      'punk': '#DC143C',
      'alternative': '#9370DB',
      'ambient': '#708090',
      'house': '#FF1493',
      'techno': '#00FFFF',
      'trance': '#FF00FF',
      'dubstep': '#8A2BE2',
      'default': '#FFFFFF'
    };

    const normalizedGenre = localTrack.genre.toLowerCase();
    const color = genreColors[normalizedGenre] || genreColors['default'];
    
    // Размер на основе длительности трека
    const baseSize = Math.max(0.5, Math.min(3.0, localTrack.duration / 120));
    
    // Базовая позиция (будет переопределена в DataProcessor)
    const angle = (index / 100) * Math.PI * 2;
    const radius = 20 + Math.random() * 30;
    const position = {
      x: Math.cos(angle) * radius,
      y: (Math.random() - 0.5) * 20,
      z: Math.sin(angle) * radius
    } as any;

    return {
      id: localTrack.id,
      name: localTrack.title,
      artist: localTrack.artist,
      album: localTrack.album,
      genre: localTrack.genre,
      popularity: Math.min(100, Math.max(10, localTrack.duration / 3)), // Базовая популярность на основе длительности
      duration: localTrack.duration,
      previewUrl: undefined, // Будет установлен позже через createAudioUrl
      color: color,
      size: baseSize,
      position: position
    };
  }

  /**
   * Получает статистику загруженных данных
   */
  async getStatistics(): Promise<{
    totalTracks: number;
    availableTracks: number;
    genres: { [genre: string]: number };
    totalDuration: number;
    averageDuration: number;
  } | null> {
    const result = await this.loadMusicData();
    
    if (!result.success || !result.data) {
      return null;
    }

    const tracks = result.data.tracks;
    const genres: { [genre: string]: number } = {};
    let totalDuration = 0;

    for (const track of tracks) {
      const genre = track.genre || 'unknown';
      genres[genre] = (genres[genre] || 0) + 1;
      totalDuration += track.duration;
    }

    return {
      totalTracks: result.totalTracks,
      availableTracks: result.availableTracks,
      genres,
      totalDuration,
      averageDuration: tracks.length > 0 ? totalDuration / tracks.length : 0
    };
  }

  /**
   * Очищает кэш аудиофайлов
   */
  clearCache(): void {
    // Освобождаем все созданные URL объекты
    for (const file of this.audioCache.values()) {
      const url = URL.createObjectURL(file);
      URL.revokeObjectURL(url);
    }
    
    this.audioCache.clear();
  }

  /**
   * Освобождает ресурсы
   */
  dispose(): void {
    this.clearCache();
    this.folderHandle = undefined;
  }
}