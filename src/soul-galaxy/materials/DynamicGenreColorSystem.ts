import * as THREE from 'three';
import { GenreColorPalette } from '../types';

/**
 * Расширенная палитра цветов для всех жанров с динамическими вариациями
 */
export interface ExtendedGenreColorPalette extends GenreColorPalette {
  // Основные жанры
  kpop: THREE.Color;
  electronics: THREE.Color;
  dance: THREE.Color;
  rnb: THREE.Color;
  edmgenre: THREE.Color;
  hardrock: THREE.Color;
  videogame: THREE.Color;
  soundtrack: THREE.Color;
  
  // Дополнительные жанры
  ambient: THREE.Color;
  techno: THREE.Color;
  house: THREE.Color;
  trance: THREE.Color;
  dubstep: THREE.Color;
  trap: THREE.Color;
  synthwave: THREE.Color;
  chillout: THREE.Color;
  lofi: THREE.Color;
  
  // Рок подвиды
  alternativerock: THREE.Color;
  progressiverock: THREE.Color;
  psychedelicrock: THREE.Color;
  bluesrock: THREE.Color;
  
  // Метал подвиды
  deathmetal: THREE.Color;
  blackmetal: THREE.Color;
  powermetal: THREE.Color;
  thrashmetal: THREE.Color;
  doommetal: THREE.Color;
  
  // Поп подвиды
  synthpop: THREE.Color;
  indiepop: THREE.Color;
  electropop: THREE.Color;
  
  // Джаз подвиды
  fusion: THREE.Color;
  smoothjazz: THREE.Color;
  freejazz: THREE.Color;
  
  // Хип-хоп подвиды
  oldschoolhiphop: THREE.Color;
  conscioushiphop: THREE.Color;
  
  // Инди подвиды
  indierock: THREE.Color;
  indieelectronic: THREE.Color;
  indiefolk: THREE.Color;
  
  // Специальные категории
  experimental: THREE.Color;
  newage: THREE.Color;
  world: THREE.Color;
  folk: THREE.Color;
  country: THREE.Color;
  reggae: THREE.Color;
  latin: THREE.Color;
  asian: THREE.Color;
  
  // Fallback
  unknown: THREE.Color;
}

/**
 * Конфигурация для динамической системы цветов
 */
export interface DynamicColorConfig {
  /** Базовая интенсивность цветов */
  baseIntensity: number;
  /** Усиление насыщенности */
  saturationBoost: number;
  /** Включить динамические изменения интенсивности */
  enableDynamicIntensity: boolean;
  /** Сила смешивания цветов для поджанров */
  mixingStrength: number;
  /** Включить цветовые вариации на основе BPM */
  enableBpmColorShift: boolean;
  /** Включить цветовые вариации на основе популярности */
  enablePopularityColorShift: boolean;
  /** Включить временные цветовые эффекты */
  enableTemporalEffects: boolean;
  /** Диапазон цветовых вариаций */
  colorVariationRange: number;
}

/**
 * Информация о цветовой схеме жанра
 */
export interface GenreColorInfo {
  baseColor: THREE.Color;
  accentColor: THREE.Color;
  complementaryColor: THREE.Color;
  analogousColors: THREE.Color[];
  intensity: number;
  saturation: number;
  brightness: number;
  temperature: 'warm' | 'cool' | 'neutral';
  mood: 'energetic' | 'calm' | 'aggressive' | 'melancholic' | 'uplifting';
}

/**
 * Расширенная система динамических цветов для жанров
 * Поддерживает большое количество жанров с интеллектуальным смешиванием цветов
 */
export class DynamicGenreColorSystem {
  private config: DynamicColorConfig;
  private baseColors!: ExtendedGenreColorPalette;
  private genreColorInfo!: Map<string, GenreColorInfo>;
  private intensityModifiers: Map<string, number> = new Map();
  private temporalEffects: Map<string, { phase: number; amplitude: number }> = new Map();
  private colorCache: Map<string, THREE.Color> = new Map();

  constructor(config: Partial<DynamicColorConfig> = {}) {
    this.config = {
      baseIntensity: 1.3,
      saturationBoost: 0.4,
      enableDynamicIntensity: true,
      mixingStrength: 0.5,
      enableBpmColorShift: true,
      enablePopularityColorShift: true,
      enableTemporalEffects: true,
      colorVariationRange: 0.2,
      ...config
    };

    this.initializeExtendedColors();
    this.initializeGenreColorInfo();
  }

  /**
   * Получает цвет для жанра с учетом всех динамических параметров
   */
  getGenreColor(
    genre: string, 
    options: {
      intensity?: number;
      bpm?: number;
      popularity?: number;
      time?: number;
      energy?: number;
    } = {}
  ): THREE.Color {
    const {
      intensity = 1.0,
      bpm,
      popularity,
      time = 0,
      energy
    } = options;

    const cacheKey = this.generateCacheKey(genre, options);
    
    // Проверяем кэш
    if (this.colorCache.has(cacheKey)) {
      return this.colorCache.get(cacheKey)!.clone();
    }

    const normalizedGenre = this.normalizeGenreName(genre);
    let baseColor = this.getBaseColorForGenre(normalizedGenre);
    
    // Применяем динамические модификации
    baseColor = this.applyIntensityModifications(baseColor, normalizedGenre, intensity);
    baseColor = this.applyBpmColorShift(baseColor, bpm);
    baseColor = this.applyPopularityColorShift(baseColor, popularity);
    baseColor = this.applyEnergyColorShift(baseColor, energy);
    baseColor = this.applyTemporalEffects(baseColor, normalizedGenre, time);
    
    // Кэшируем результат
    this.colorCache.set(cacheKey, baseColor.clone());
    
    return baseColor;
  }

  /**
   * Получает информацию о цветовой схеме жанра
   */
  getGenreColorInfo(genre: string): GenreColorInfo {
    const normalizedGenre = this.normalizeGenreName(genre);
    return this.genreColorInfo.get(normalizedGenre) || this.createDefaultColorInfo(normalizedGenre);
  }

  /**
   * Создает градиент между жанрами с учетом их характеристик
   */
  createSmartGenreGradient(
    genre1: string, 
    genre2: string, 
    steps: number = 10,
    options: { respectMood?: boolean; respectTemperature?: boolean } = {}
  ): THREE.Color[] {
    const { respectMood = true, respectTemperature = true } = options;
    
    const info1 = this.getGenreColorInfo(genre1);
    const info2 = this.getGenreColorInfo(genre2);
    
    const gradient: THREE.Color[] = [];
    
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      
      // Базовое смешивание цветов
      let mixedColor = info1.baseColor.clone().lerp(info2.baseColor, t);
      
      // Учитываем настроение жанров
      if (respectMood && info1.mood !== info2.mood) {
        const moodInfluence = this.getMoodColorInfluence(info1.mood, info2.mood, t);
        mixedColor = mixedColor.lerp(moodInfluence, 0.2);
      }
      
      // Учитываем температуру цветов
      if (respectTemperature && info1.temperature !== info2.temperature) {
        const tempInfluence = this.getTemperatureColorInfluence(info1.temperature, info2.temperature, t);
        mixedColor = mixedColor.lerp(tempInfluence, 0.15);
      }
      
      gradient.push(this.applyNoirStyling(mixedColor));
    }
    
    return gradient;
  }

  /**
   * Получает цвета для визуализации жанрового спектра
   */
  getGenreSpectrum(genres: string[], options: { sortByHue?: boolean } = {}): THREE.Color[] {
    const { sortByHue = true } = options;
    
    let genreColors = genres.map(genre => ({
      genre,
      color: this.getGenreColor(genre),
      hue: 0
    }));
    
    // Вычисляем HSL для сортировки
    genreColors.forEach(item => {
      const hsl = { h: 0, s: 0, l: 0 };
      item.color.getHSL(hsl);
      item.hue = hsl.h;
    });
    
    if (sortByHue) {
      genreColors.sort((a, b) => a.hue - b.hue);
    }
    
    return genreColors.map(item => item.color);
  }

  /**
   * Создает цветовую палитру на основе доминирующих жанров
   */
  createDominantGenrePalette(
    genreFrequency: { [genre: string]: number },
    maxColors: number = 8
  ): { genre: string; color: THREE.Color; weight: number }[] {
    // Сортируем жанры по частоте
    const sortedGenres = Object.entries(genreFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxColors);
    
    const totalWeight = sortedGenres.reduce((sum, [, freq]) => sum + freq, 0);
    
    return sortedGenres.map(([genre, frequency]) => ({
      genre,
      color: this.getGenreColor(genre, { intensity: 1.2 }),
      weight: frequency / totalWeight
    }));
  }

  /**
   * Получает цвет на основе аудио характеристик
   */
  getAudioBasedColor(
    genre: string,
    audioFeatures: {
      bpm?: number;
      energy?: number;
      valence?: number; // позитивность
      danceability?: number;
      acousticness?: number;
      instrumentalness?: number;
    }
  ): THREE.Color {
    const baseColor = this.getGenreColor(genre);
    let modifiedColor = baseColor.clone();
    
    const { energy, valence, danceability, acousticness, instrumentalness } = audioFeatures;
    
    // Энергия влияет на яркость
    if (energy !== undefined) {
      const hsl = { h: 0, s: 0, l: 0 };
      modifiedColor.getHSL(hsl);
      hsl.l = Math.min(1.0, hsl.l + (energy - 0.5) * 0.3);
      modifiedColor.setHSL(hsl.h, hsl.s, hsl.l);
    }
    
    // Валентность влияет на теплоту цвета
    if (valence !== undefined) {
      const warmth = (valence - 0.5) * 0.1;
      if (warmth > 0) {
        // Добавляем теплые тона
        modifiedColor.r = Math.min(1.0, modifiedColor.r + warmth);
        modifiedColor.g = Math.min(1.0, modifiedColor.g + warmth * 0.5);
      } else {
        // Добавляем холодные тона
        modifiedColor.b = Math.min(1.0, modifiedColor.b - warmth);
        modifiedColor.g = Math.min(1.0, modifiedColor.g - warmth * 0.5);
      }
    }
    
    // Танцевальность влияет на насыщенность
    if (danceability !== undefined) {
      const hsl = { h: 0, s: 0, l: 0 };
      modifiedColor.getHSL(hsl);
      hsl.s = Math.min(1.0, hsl.s + (danceability - 0.5) * 0.4);
      modifiedColor.setHSL(hsl.h, hsl.s, hsl.l);
    }
    
    // Акустичность делает цвет более приглушенным
    if (acousticness !== undefined && acousticness > 0.5) {
      modifiedColor.multiplyScalar(0.8 + acousticness * 0.2);
    }
    
    // Инструментальность добавляет металлический оттенок
    if (instrumentalness !== undefined && instrumentalness > 0.5) {
      const metallic = new THREE.Color(0xC0C0C0);
      modifiedColor.lerp(metallic, instrumentalness * 0.2);
    }
    
    return this.applyNoirStyling(modifiedColor);
  }

  /**
   * Устанавливает динамическую интенсивность для жанра
   */
  setGenreIntensity(genre: string, intensity: number): void {
    const normalizedGenre = this.normalizeGenreName(genre);
    this.intensityModifiers.set(normalizedGenre, Math.max(0.1, Math.min(3.0, intensity)));
    this.clearCache();
  }

  /**
   * Обновляет временные эффекты
   */
  updateTemporalEffects(deltaTime: number): void {
    if (!this.config.enableTemporalEffects) return;
    
    this.temporalEffects.forEach((effect, genre) => {
      effect.phase += deltaTime * 0.001; // Медленные изменения
      if (effect.phase > Math.PI * 2) {
        effect.phase -= Math.PI * 2;
      }
    });
    
    this.clearCache();
  }

  /**
   * Очищает кэш цветов
   */
  clearCache(): void {
    this.colorCache.clear();
  }

  /**
   * Получает статистику использования цветов
   */
  getColorStats(): {
    totalGenres: number;
    cachedColors: number;
    dynamicIntensities: number;
    temporalEffects: number;
  } {
    return {
      totalGenres: Object.keys(this.baseColors).length,
      cachedColors: this.colorCache.size,
      dynamicIntensities: this.intensityModifiers.size,
      temporalEffects: this.temporalEffects.size
    };
  }

  // Приватные методы

  private initializeExtendedColors(): void {
    this.baseColors = {
      // Основные жанры (обновленные)
      metal: new THREE.Color(0xFF0020),
      rock: new THREE.Color(0x0060FF),
      punk: new THREE.Color(0x00FF20),
      electronic: new THREE.Color(0x6000FF),
      jazz: new THREE.Color(0xFFB000),
      classical: new THREE.Color(0xC0C0FF),
      pop: new THREE.Color(0xFF0060),
      indie: new THREE.Color(0x00FFB0),
      hiphop: new THREE.Color(0xFF6000),
      
      // Новые основные жанры
      kpop: new THREE.Color(0xFF00A0),        // Яркий розово-фиолетовый
      electronics: new THREE.Color(0x00A0FF), // Электрический голубой
      dance: new THREE.Color(0xA0FF00),       // Энергичный лайм
      rnb: new THREE.Color(0xFF8040),         // Теплый оранжево-красный
      edmgenre: new THREE.Color(0x8000FF),    // Глубокий фиолетовый
      hardrock: new THREE.Color(0xFF4000),    // Агрессивный красно-оранжевый
      videogame: new THREE.Color(0x00FF80),   // Пиксельный зеленый
      soundtrack: new THREE.Color(0x4080FF),  // Кинематографический синий
      
      // Электронные подвиды
      ambient: new THREE.Color(0x8080C0),     // Спокойный сиреневый
      techno: new THREE.Color(0xFF0080),      // Техно-розовый
      house: new THREE.Color(0x80FF80),       // Хаус-зеленый
      trance: new THREE.Color(0x0080FF),      // Транс-синий
      dubstep: new THREE.Color(0x80FF00),     // Дабстеп-лайм
      trap: new THREE.Color(0xFF8000),        // Трап-оранжевый
      synthwave: new THREE.Color(0xFF0040),   // Синтвейв-неон
      chillout: new THREE.Color(0x40C0C0),    // Чилл-бирюзовый
      lofi: new THREE.Color(0xC0A080),        // Лофи-бежевый
      
      // Рок подвиды
      alternativerock: new THREE.Color(0x4060FF),
      progressiverock: new THREE.Color(0x6040FF),
      psychedelicrock: new THREE.Color(0xFF4080),
      bluesrock: new THREE.Color(0x4080FF),
      
      // Метал подвиды
      deathmetal: new THREE.Color(0x800020),
      blackmetal: new THREE.Color(0x200020),
      powermetal: new THREE.Color(0xFF4040),
      thrashmetal: new THREE.Color(0xFF2020),
      doommetal: new THREE.Color(0x404040),
      
      // Поп подвиды
      synthpop: new THREE.Color(0xFF4080),
      indiepop: new THREE.Color(0x80FF40),
      electropop: new THREE.Color(0x8040FF),
      
      // Джаз подвиды
      fusion: new THREE.Color(0xFFD040),
      smoothjazz: new THREE.Color(0xC0B080),
      freejazz: new THREE.Color(0xFF8040),
      
      // Хип-хоп подвиды
      oldschoolhiphop: new THREE.Color(0xC08040),
      conscioushiphop: new THREE.Color(0x80C040),
      
      // Инди подвиды
      indierock: new THREE.Color(0x40C080),
      indieelectronic: new THREE.Color(0x4080C0),
      indiefolk: new THREE.Color(0x80C040),
      
      // Специальные категории
      experimental: new THREE.Color(0xC040C0),
      newage: new THREE.Color(0x80C0C0),
      world: new THREE.Color(0xC0C040),
      folk: new THREE.Color(0x80A040),
      country: new THREE.Color(0xA08040),
      reggae: new THREE.Color(0x40A040),
      latin: new THREE.Color(0xA04040),
      asian: new THREE.Color(0x4040A0),
      
      // Fallback
      default: new THREE.Color(0xF0F0F0),
      unknown: new THREE.Color(0x808080)
    };

    // Применяем нуар-стилизацию ко всем цветам
    Object.keys(this.baseColors).forEach(genre => {
      const color = this.baseColors[genre as keyof ExtendedGenreColorPalette];
      this.baseColors[genre as keyof ExtendedGenreColorPalette] = this.applyNoirStyling(color);
    });
  }

  private initializeGenreColorInfo(): void {
    this.genreColorInfo = new Map();
    
    // Определяем характеристики для каждого жанра
    const genreCharacteristics: { [key: string]: Partial<GenreColorInfo> } = {
      metal: { temperature: 'warm', mood: 'aggressive', intensity: 1.4 },
      rock: { temperature: 'cool', mood: 'energetic', intensity: 1.2 },
      punk: { temperature: 'warm', mood: 'aggressive', intensity: 1.5 },
      electronic: { temperature: 'cool', mood: 'energetic', intensity: 1.1 },
      jazz: { temperature: 'warm', mood: 'calm', intensity: 0.9 },
      classical: { temperature: 'cool', mood: 'calm', intensity: 0.8 },
      pop: { temperature: 'warm', mood: 'uplifting', intensity: 1.0 },
      indie: { temperature: 'cool', mood: 'melancholic', intensity: 0.9 },
      hiphop: { temperature: 'warm', mood: 'energetic', intensity: 1.1 },
      kpop: { temperature: 'warm', mood: 'uplifting', intensity: 1.3 },
      electronics: { temperature: 'cool', mood: 'energetic', intensity: 1.2 },
      dance: { temperature: 'warm', mood: 'energetic', intensity: 1.4 },
      rnb: { temperature: 'warm', mood: 'calm', intensity: 1.0 },
      edmgenre: { temperature: 'cool', mood: 'energetic', intensity: 1.3 },
      hardrock: { temperature: 'warm', mood: 'aggressive', intensity: 1.4 },
      videogame: { temperature: 'cool', mood: 'energetic', intensity: 1.1 },
      soundtrack: { temperature: 'neutral', mood: 'calm', intensity: 0.9 }
    };
    
    Object.entries(this.baseColors).forEach(([genre, baseColor]) => {
      const characteristics = genreCharacteristics[genre] || {};
      
      const colorInfo: GenreColorInfo = {
        baseColor: baseColor.clone(),
        accentColor: this.generateAccentColor(baseColor),
        complementaryColor: this.generateComplementaryColor(baseColor),
        analogousColors: this.generateAnalogousColors(baseColor),
        intensity: characteristics.intensity || 1.0,
        saturation: this.calculateSaturation(baseColor),
        brightness: this.calculateBrightness(baseColor),
        temperature: characteristics.temperature || 'neutral',
        mood: characteristics.mood || 'calm'
      };
      
      this.genreColorInfo.set(genre, colorInfo);
    });
  }

  private normalizeGenreName(genre: string): string {
    return genre.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/-/g, '')
      .replace(/_/g, '');
  }

  private getBaseColorForGenre(normalizedGenre: string): THREE.Color {
    // Прямое соответствие
    if (this.baseColors[normalizedGenre as keyof ExtendedGenreColorPalette]) {
      return this.baseColors[normalizedGenre as keyof ExtendedGenreColorPalette].clone();
    }
    
    // Поиск частичного соответствия
    for (const [key, color] of Object.entries(this.baseColors)) {
      if (key.includes(normalizedGenre) || normalizedGenre.includes(key)) {
        return color.clone();
      }
    }
    
    // Интеллектуальное сопоставление
    return this.intelligentGenreMapping(normalizedGenre);
  }

  private intelligentGenreMapping(genre: string): THREE.Color {
    // Ключевые слова для определения жанра
    const genreKeywords = {
      electronic: ['electro', 'synth', 'digital', 'cyber'],
      rock: ['rock', 'guitar', 'band'],
      metal: ['metal', 'heavy', 'death', 'black'],
      pop: ['pop', 'mainstream', 'radio'],
      dance: ['dance', 'club', 'beat', 'rhythm'],
      jazz: ['jazz', 'swing', 'blues'],
      classical: ['classical', 'orchestra', 'symphony'],
      indie: ['indie', 'alternative', 'underground'],
      hiphop: ['hip', 'hop', 'rap', 'urban']
    };
    
    for (const [baseGenre, keywords] of Object.entries(genreKeywords)) {
      if (keywords.some(keyword => genre.includes(keyword))) {
        return this.baseColors[baseGenre as keyof ExtendedGenreColorPalette].clone();
      }
    }
    
    return this.baseColors.unknown.clone();
  }

  private generateCacheKey(genre: string, options: any): string {
    return `${genre}_${JSON.stringify(options)}`;
  }

  private applyIntensityModifications(color: THREE.Color, genre: string, intensity: number): THREE.Color {
    let modifiedColor = color.clone();
    
    // Базовая интенсивность
    modifiedColor.multiplyScalar(this.config.baseIntensity);
    
    // Динамическая интенсивность
    if (this.config.enableDynamicIntensity) {
      const dynamicIntensity = this.intensityModifiers.get(genre) || 1.0;
      modifiedColor.multiplyScalar(dynamicIntensity);
    }
    
    // Переданная интенсивность
    modifiedColor.multiplyScalar(intensity);
    
    return modifiedColor;
  }

  private applyBpmColorShift(color: THREE.Color, bpm?: number): THREE.Color {
    if (!this.config.enableBpmColorShift || !bpm) return color;
    
    const modifiedColor = color.clone();
    const hsl = { h: 0, s: 0, l: 0 };
    modifiedColor.getHSL(hsl);
    
    // BPM влияет на оттенок и яркость
    const bpmNormalized = Math.min(200, Math.max(60, bpm)) / 200; // Нормализуем 60-200 BPM
    
    // Быстрые треки становятся более теплыми и яркими
    hsl.h = (hsl.h + (bpmNormalized - 0.5) * 0.1 + 1) % 1;
    hsl.l = Math.min(1.0, hsl.l + (bpmNormalized - 0.5) * 0.2);
    
    modifiedColor.setHSL(hsl.h, hsl.s, hsl.l);
    return modifiedColor;
  }

  private applyPopularityColorShift(color: THREE.Color, popularity?: number): THREE.Color {
    if (!this.config.enablePopularityColorShift || popularity === undefined) return color;
    
    const modifiedColor = color.clone();
    const popularityNormalized = popularity / 100;
    
    // Популярные треки становятся более насыщенными
    const hsl = { h: 0, s: 0, l: 0 };
    modifiedColor.getHSL(hsl);
    hsl.s = Math.min(1.0, hsl.s + popularityNormalized * 0.3);
    modifiedColor.setHSL(hsl.h, hsl.s, hsl.l);
    
    return modifiedColor;
  }

  private applyEnergyColorShift(color: THREE.Color, energy?: number): THREE.Color {
    if (!energy) return color;
    
    const modifiedColor = color.clone();
    
    // Энергия влияет на яркость и насыщенность
    const energyMultiplier = 0.8 + energy * 0.4; // 0.8 - 1.2
    modifiedColor.multiplyScalar(energyMultiplier);
    
    return modifiedColor;
  }

  private applyTemporalEffects(color: THREE.Color, genre: string, time: number): THREE.Color {
    if (!this.config.enableTemporalEffects) return color;
    
    let effect = this.temporalEffects.get(genre);
    if (!effect) {
      effect = {
        phase: Math.random() * Math.PI * 2,
        amplitude: 0.05 + Math.random() * 0.1
      };
      this.temporalEffects.set(genre, effect);
    }
    
    const modifiedColor = color.clone();
    const oscillation = Math.sin(time * 0.001 + effect.phase) * effect.amplitude;
    
    modifiedColor.multiplyScalar(1.0 + oscillation);
    
    return modifiedColor;
  }

  private applyNoirStyling(color: THREE.Color): THREE.Color {
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    
    // Увеличиваем насыщенность
    hsl.s = Math.min(1.0, hsl.s + this.config.saturationBoost);
    
    // Немного уменьшаем яркость для глубины
    hsl.l = Math.max(0.1, hsl.l * 0.9);
    
    return new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l);
  }

  private generateAccentColor(baseColor: THREE.Color): THREE.Color {
    const hsl = { h: 0, s: 0, l: 0 };
    baseColor.getHSL(hsl);
    
    // Акцентный цвет - более яркая версия
    hsl.l = Math.min(1.0, hsl.l * 1.3);
    hsl.s = Math.min(1.0, hsl.s * 1.2);
    
    return new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l);
  }

  private generateComplementaryColor(baseColor: THREE.Color): THREE.Color {
    const hsl = { h: 0, s: 0, l: 0 };
    baseColor.getHSL(hsl);
    
    // Комплементарный цвет - противоположный на цветовом круге
    hsl.h = (hsl.h + 0.5) % 1.0;
    
    return new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l);
  }

  private generateAnalogousColors(baseColor: THREE.Color, count: number = 3): THREE.Color[] {
    const hsl = { h: 0, s: 0, l: 0 };
    baseColor.getHSL(hsl);
    
    const analogous: THREE.Color[] = [];
    const hueStep = 0.083; // 30 градусов
    
    for (let i = 0; i < count; i++) {
      const offset = (i - Math.floor(count / 2)) * hueStep;
      const newHue = (hsl.h + offset + 1.0) % 1.0;
      analogous.push(new THREE.Color().setHSL(newHue, hsl.s, hsl.l));
    }
    
    return analogous;
  }

  private calculateSaturation(color: THREE.Color): number {
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    return hsl.s;
  }

  private calculateBrightness(color: THREE.Color): number {
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    return hsl.l;
  }

  private getMoodColorInfluence(mood1: string, mood2: string, t: number): THREE.Color {
    const moodColors = {
      energetic: new THREE.Color(0xFF4000),
      calm: new THREE.Color(0x4080C0),
      aggressive: new THREE.Color(0xFF0020),
      melancholic: new THREE.Color(0x6060A0),
      uplifting: new THREE.Color(0xFFD000)
    };
    
    const color1 = moodColors[mood1 as keyof typeof moodColors] || new THREE.Color(0x808080);
    const color2 = moodColors[mood2 as keyof typeof moodColors] || new THREE.Color(0x808080);
    
    return color1.clone().lerp(color2, t);
  }

  private getTemperatureColorInfluence(temp1: string, temp2: string, t: number): THREE.Color {
    const tempColors = {
      warm: new THREE.Color(0xFF8040),
      cool: new THREE.Color(0x4080FF),
      neutral: new THREE.Color(0x808080)
    };
    
    const color1 = tempColors[temp1 as keyof typeof tempColors] || tempColors.neutral;
    const color2 = tempColors[temp2 as keyof typeof tempColors] || tempColors.neutral;
    
    return color1.clone().lerp(color2, t);
  }

  private createDefaultColorInfo(genre: string): GenreColorInfo {
    const baseColor = this.baseColors.unknown.clone();
    
    return {
      baseColor,
      accentColor: this.generateAccentColor(baseColor),
      complementaryColor: this.generateComplementaryColor(baseColor),
      analogousColors: this.generateAnalogousColors(baseColor),
      intensity: 1.0,
      saturation: 0.5,
      brightness: 0.5,
      temperature: 'neutral',
      mood: 'calm'
    };
  }
}

/**
 * Глобальный экземпляр динамической системы цветов
 */
export const dynamicGenreColorSystem = new DynamicGenreColorSystem();

/**
 * Утилиты для работы с динамическими цветами жанров
 */
export const DynamicGenreColorUtils = {
  /**
   * Получить цвет жанра с динамическими параметрами
   */
  getColor: (genre: string, options: Parameters<DynamicGenreColorSystem['getGenreColor']>[1] = {}): THREE.Color => {
    return dynamicGenreColorSystem.getGenreColor(genre, options);
  },

  /**
   * Получить информацию о цветовой схеме жанра
   */
  getColorInfo: (genre: string): GenreColorInfo => {
    return dynamicGenreColorSystem.getGenreColorInfo(genre);
  },

  /**
   * Создать умный градиент между жанрами
   */
  createSmartGradient: (genre1: string, genre2: string, steps?: number, options?: Parameters<DynamicGenreColorSystem['createSmartGenreGradient']>[3]): THREE.Color[] => {
    return dynamicGenreColorSystem.createSmartGenreGradient(genre1, genre2, steps, options);
  },

  /**
   * Получить цветовой спектр жанров
   */
  getSpectrum: (genres: string[], options?: Parameters<DynamicGenreColorSystem['getGenreSpectrum']>[1]): THREE.Color[] => {
    return dynamicGenreColorSystem.getGenreSpectrum(genres, options);
  },

  /**
   * Создать палитру доминирующих жанров
   */
  createDominantPalette: (genreFrequency: { [genre: string]: number }, maxColors?: number) => {
    return dynamicGenreColorSystem.createDominantGenrePalette(genreFrequency, maxColors);
  },

  /**
   * Получить цвет на основе аудио характеристик
   */
  getAudioBasedColor: (genre: string, audioFeatures: Parameters<DynamicGenreColorSystem['getAudioBasedColor']>[1]): THREE.Color => {
    return dynamicGenreColorSystem.getAudioBasedColor(genre, audioFeatures);
  },

  /**
   * Установить динамическую интенсивность жанра
   */
  setIntensity: (genre: string, intensity: number): void => {
    dynamicGenreColorSystem.setGenreIntensity(genre, intensity);
  },

  /**
   * Обновить временные эффекты
   */
  updateEffects: (deltaTime: number): void => {
    dynamicGenreColorSystem.updateTemporalEffects(deltaTime);
  },

  /**
   * Получить статистику системы цветов
   */
  getStats: () => {
    return dynamicGenreColorSystem.getColorStats();
  }
};