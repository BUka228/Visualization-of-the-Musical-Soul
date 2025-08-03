/**
 * Модуль обработки данных треков для 3D-визуализации
 */

import { Vector3 } from 'three';
import { Track, ProcessedTrack, GenreStats, DataProcessor as IDataProcessor } from '../types/index.js';
import { YandexTrackData } from './DataLoader.js';

/**
 * Класс для обработки и анализа музыкальных данных
 */
export class DataProcessor implements IDataProcessor {
  // Цветовая схема для жанров согласно дизайн-документу
  private static readonly GENRE_COLORS: { [genre: string]: string } = {
    'metal': '#FF0000',        // Красный
    'rock': '#FF4500',         // Оранжево-красный
    'indie': '#4169E1',        // Синий
    'pop': '#FFD700',          // Желтый
    'pop-rock': '#FFD700',     // Желтый (как поп)
    'electronic': '#9400D3',   // Фиолетовый
    'jazz': '#228B22',         // Зеленый
    'classical': '#F5F5DC',    // Бежевый
    'hip-hop': '#8B4513',      // Коричневый
    'rap': '#8B4513',          // Коричневый (как хип-хоп)
    'kpop': '#FF69B4',         // Розовый
    'dance': '#00CED1',        // Бирюзовый
    'rnb': '#8A2BE2',          // Фиолетово-синий
    'r&b': '#8A2BE2',          // Фиолетово-синий
    'alternative': '#4169E1',   // Синий (как инди)
    'punk': '#FF0000',         // Красный (как метал)
    'blues': '#4682B4',        // Стальной синий
    'country': '#DAA520',      // Золотисто-желтый
    'folk': '#8FBC8F',         // Темно-зеленый
    'reggae': '#32CD32',       // Лайм-зеленый
    'default': '#FFFFFF'       // Белый для неизвестных жанров
  };

  // Конфигурация для размещения объектов
  private static readonly GALAXY_CONFIG = {
    radius: 50,           // Радиус галактики
    minSize: 0.5,         // Минимальный размер объекта
    maxSize: 3.0,         // Максимальный размер объекта
    heightVariation: 20,  // Вариация по высоте (Y-координата)
    genreSeparation: 0.3  // Коэффициент разделения жанров
  };

  /**
   * Обрабатывает массив треков и возвращает обработанные данные для 3D-визуализации
   */
  processTrackData(tracks: Track[]): ProcessedTrack[] {
    console.log(`🔄 Обработка ${tracks.length} треков...`);

    if (tracks.length === 0) {
      console.warn('⚠️ Массив треков пуст');
      return [];
    }

    // Группируем треки по жанрам для лучшего распределения
    const tracksByGenre = this.groupTracksByGenre(tracks);
    
    const processedTracks: ProcessedTrack[] = [];
    let globalIndex = 0;

    // Обрабатываем треки по жанрам
    for (const [genre, genreTracks] of Object.entries(tracksByGenre)) {
      for (let i = 0; i < genreTracks.length; i++) {
        const track = genreTracks[i];
        
        const processedTrack: ProcessedTrack = {
          id: track.id,
          name: track.name,
          artist: track.artist,
          album: track.album,
          genre: track.genre,
          popularity: this.calculatePopularity(track),
          duration: track.duration,
          previewUrl: track.previewUrl,
          color: this.getGenreColor(track.genre),
          size: this.calculateSize(track),
          position: this.calculatePosition(globalIndex, tracks.length, track.genre)
        };

        processedTracks.push(processedTrack);
        globalIndex++;
      }
    }

    console.log(`✅ Обработано ${processedTracks.length} треков`);
    return processedTracks;
  }

  /**
   * Конвертирует данные из Яндекс.Музыки в стандартный формат Track
   */
  convertYandexTrackData(yandexTracks: YandexTrackData[]): Track[] {
    console.log(`🔄 Конвертация ${yandexTracks.length} треков из Яндекс.Музыки...`);

    const tracks: Track[] = yandexTracks
      .filter(track => track.available) // Фильтруем только доступные треки
      .map(yandexTrack => ({
        id: yandexTrack.id,
        name: yandexTrack.title,
        artist: yandexTrack.artist,
        album: yandexTrack.album,
        genre: this.normalizeGenre(yandexTrack.genre),
        duration: yandexTrack.duration,
        popularity: this.estimatePopularityFromDuration(yandexTrack.duration),
        previewUrl: yandexTrack.preview_url || undefined,
        imageUrl: yandexTrack.cover_url || undefined,
        playCount: undefined // Яндекс.Музыка не предоставляет эти данные
      }));

    console.log(`✅ Конвертировано ${tracks.length} треков`);
    return tracks;
  }

  /**
   * Анализирует жанры в коллекции треков
   */
  analyzeGenres(tracks: Track[]): GenreStats {
    const genreStats: GenreStats = {};
    const totalTracks = tracks.length;

    if (totalTracks === 0) {
      return genreStats;
    }

    // Подсчитываем треки по жанрам
    const genreCounts: { [genre: string]: number } = {};
    
    tracks.forEach(track => {
      const genre = track.genre || 'unknown';
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });

    // Создаем статистику с процентами и цветами
    Object.entries(genreCounts).forEach(([genre, count]) => {
      genreStats[genre] = {
        count: count,
        percentage: Math.round((count / totalTracks) * 100 * 100) / 100, // Округляем до 2 знаков
        color: this.getGenreColor(genre)
      };
    });

    console.log(`📊 Анализ жанров: найдено ${Object.keys(genreStats).length} жанров`);
    return genreStats;
  }

  /**
   * Вычисляет популярность трека на основе доступных данных
   */
  calculatePopularity(track: Track): number {
    let popularity = 50; // Базовое значение

    // Если есть данные о прослушиваниях, используем их
    if (track.playCount !== undefined) {
      // Нормализуем количество прослушиваний к шкале 0-100
      popularity = Math.min(100, Math.max(0, Math.log10(track.playCount + 1) * 10));
    } else if (track.popularity !== undefined) {
      popularity = track.popularity;
    } else {
      // Оцениваем популярность по длительности (более короткие треки часто популярнее)
      const durationMinutes = track.duration / 60;
      if (durationMinutes < 3) {
        popularity = 70; // Короткие треки часто популярны
      } else if (durationMinutes > 6) {
        popularity = 30; // Длинные треки менее популярны
      } else {
        popularity = 50; // Средняя длительность
      }

      // Добавляем случайную вариацию для разнообразия
      popularity += (Math.random() - 0.5) * 20;
      popularity = Math.max(0, Math.min(100, popularity));
    }

    return Math.round(popularity);
  }

  /**
   * Вычисляет размер объекта на основе популярности и длительности
   */
  calculateSize(track: Track): number {
    const popularity = this.calculatePopularity(track);
    const durationMinutes = track.duration / 60;

    // Базовый размер на основе популярности (70% влияния)
    const popularityFactor = (popularity / 100) * 0.7;
    
    // Фактор длительности (30% влияния)
    const normalizedDuration = Math.min(1, durationMinutes / 8); // 8 минут = максимум
    const durationFactor = normalizedDuration * 0.3;

    // Комбинируем факторы
    const sizeFactor = popularityFactor + durationFactor;
    
    // Применяем к диапазону размеров
    const size = DataProcessor.GALAXY_CONFIG.minSize + 
                 sizeFactor * (DataProcessor.GALAXY_CONFIG.maxSize - DataProcessor.GALAXY_CONFIG.minSize);

    return Math.round(size * 100) / 100; // Округляем до 2 знаков
  }

  /**
   * Вычисляет позицию объекта в 3D-пространстве с использованием сферического распределения
   */
  calculatePosition(index: number, total: number, genre: string): Vector3 {
    // Получаем хэш жанра для стабильного распределения
    const genreHash = this.getGenreHash(genre);
    
    // Базовые углы для сферического распределения
    const phi = (index / total) * Math.PI * 2; // Азимутальный угол (0 до 2π)
    const theta = Math.acos(1 - 2 * (index / total)); // Полярный угол (0 до π)
    
    // Добавляем смещение на основе жанра для группировки
    const genreOffset = (genreHash / 1000) * Math.PI * 2 * DataProcessor.GALAXY_CONFIG.genreSeparation;
    const adjustedPhi = phi + genreOffset;
    
    // Вариация радиуса для более естественного вида
    const radiusVariation = 0.8 + Math.random() * 0.4; // 0.8 - 1.2
    const radius = DataProcessor.GALAXY_CONFIG.radius * radiusVariation;
    
    // Преобразуем сферические координаты в декартовы
    const x = radius * Math.sin(theta) * Math.cos(adjustedPhi);
    const y = radius * Math.cos(theta) + (Math.random() - 0.5) * DataProcessor.GALAXY_CONFIG.heightVariation;
    const z = radius * Math.sin(theta) * Math.sin(adjustedPhi);

    return new Vector3(x, y, z);
  }

  /**
   * Возвращает цвет для указанного жанра
   */
  getGenreColor(genre: string): string {
    const normalizedGenre = this.normalizeGenre(genre);
    return DataProcessor.GENRE_COLORS[normalizedGenre] || DataProcessor.GENRE_COLORS['default'];
  }

  /**
   * Группирует треки по жанрам
   */
  private groupTracksByGenre(tracks: Track[]): { [genre: string]: Track[] } {
    const grouped: { [genre: string]: Track[] } = {};
    
    tracks.forEach(track => {
      const genre = track.genre || 'unknown';
      if (!grouped[genre]) {
        grouped[genre] = [];
      }
      grouped[genre].push(track);
    });

    return grouped;
  }

  /**
   * Нормализует название жанра к стандартному формату
   */
  private normalizeGenre(genre: string): string {
    if (!genre) return 'unknown';
    
    const normalized = genre.toLowerCase().trim();
    
    // Маппинг различных вариантов названий к стандартным
    const genreMapping: { [key: string]: string } = {
      'поп': 'pop',
      'рок': 'rock',
      'метал': 'metal',
      'металл': 'metal',
      'инди': 'indie',
      'электроника': 'electronic',
      'джаз': 'jazz',
      'классика': 'classical',
      'классическая': 'classical',
      'хип-хоп': 'hip-hop',
      'хип хоп': 'hip-hop',
      'рэп': 'rap',
      'рнб': 'rnb',
      'r&b': 'rnb',
      'кпоп': 'kpop',
      'k-pop': 'kpop',
      'танцевальная': 'dance',
      'альтернатива': 'alternative',
      'альтернативная': 'alternative',
      'панк': 'punk',
      'блюз': 'blues',
      'кантри': 'country',
      'фолк': 'folk',
      'регги': 'reggae',
      'поп-рок': 'pop-rock',
      'pop rock': 'pop-rock'
    };

    return genreMapping[normalized] || normalized;
  }

  /**
   * Создает числовой хэш для жанра (для стабильного распределения)
   */
  private getGenreHash(genre: string): number {
    let hash = 0;
    for (let i = 0; i < genre.length; i++) {
      const char = genre.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Преобразуем в 32-битное число
    }
    return Math.abs(hash);
  }

  /**
   * Оценивает популярность на основе длительности трека (для треков без данных о популярности)
   */
  private estimatePopularityFromDuration(durationSeconds: number): number {
    const durationMinutes = durationSeconds / 60;
    
    // Популярные треки обычно 3-4 минуты
    if (durationMinutes >= 3 && durationMinutes <= 4) {
      return 60 + Math.random() * 30; // 60-90
    } else if (durationMinutes >= 2.5 && durationMinutes <= 5) {
      return 40 + Math.random() * 40; // 40-80
    } else {
      return 20 + Math.random() * 40; // 20-60
    }
  }

  /**
   * Возвращает статистику обработки данных
   */
  getProcessingStats(tracks: ProcessedTrack[]): {
    totalTracks: number;
    genreDistribution: { [genre: string]: number };
    averagePopularity: number;
    averageSize: number;
    sizeRange: { min: number; max: number };
  } {
    if (tracks.length === 0) {
      return {
        totalTracks: 0,
        genreDistribution: {},
        averagePopularity: 0,
        averageSize: 0,
        sizeRange: { min: 0, max: 0 }
      };
    }

    const genreDistribution: { [genre: string]: number } = {};
    let totalPopularity = 0;
    let totalSize = 0;
    let minSize = tracks[0].size;
    let maxSize = tracks[0].size;

    tracks.forEach(track => {
      // Распределение по жанрам
      genreDistribution[track.genre] = (genreDistribution[track.genre] || 0) + 1;
      
      // Суммы для средних значений
      totalPopularity += track.popularity;
      totalSize += track.size;
      
      // Диапазон размеров
      minSize = Math.min(minSize, track.size);
      maxSize = Math.max(maxSize, track.size);
    });

    return {
      totalTracks: tracks.length,
      genreDistribution,
      averagePopularity: Math.round(totalPopularity / tracks.length),
      averageSize: Math.round((totalSize / tracks.length) * 100) / 100,
      sizeRange: { min: minSize, max: maxSize }
    };
  }
}