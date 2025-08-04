import * as THREE from 'three';
import { GenreColorPalette } from '../types';

/**
 * Configuration for genre color system
 */
export interface GenreColorConfig {
  /** Base intensity multiplier for all colors */
  baseIntensity: number;
  /** Saturation boost for noir-style colors */
  saturationBoost: number;
  /** Enable dynamic intensity changes */
  enableDynamicIntensity: boolean;
  /** Color mixing strength for subgenres */
  mixingStrength: number;
}

/**
 * Subgenre mapping for color mixing
 */
export interface SubgenreMapping {
  [subgenre: string]: {
    primary: keyof GenreColorPalette;
    secondary?: keyof GenreColorPalette;
    mixRatio: number; // 0.0 = full primary, 1.0 = full secondary
  };
}

/**
 * Enhanced genre color system with noir-style deep neon colors
 * Supports color mixing for subgenres and dynamic intensity changes
 */
export class GenreColorSystem {
  private config: GenreColorConfig;
  private baseColors!: GenreColorPalette;
  private subgenreMap!: SubgenreMapping;
  private intensityModifiers: Map<string, number> = new Map();

  constructor(config: Partial<GenreColorConfig> = {}) {
    this.config = {
      baseIntensity: 1.2,
      saturationBoost: 0.3,
      enableDynamicIntensity: true,
      mixingStrength: 0.4,
      ...config
    };

    this.initializeBaseColors();
    this.initializeSubgenreMapping();
  }

  /**
   * Gets the color for a specific genre or subgenre
   */
  getGenreColor(genre: string, intensity: number = 1.0): THREE.Color {
    const normalizedGenre = genre.toLowerCase();
    
    // Check if it's a mapped subgenre
    if (this.subgenreMap[normalizedGenre]) {
      return this.getMixedColor(normalizedGenre, intensity);
    }
    
    // Get base color
    const baseColor = this.getBaseColor(normalizedGenre);
    
    // Apply intensity and dynamic modifications
    return this.applyIntensityModifications(baseColor, normalizedGenre, intensity);
  }

  /**
   * Sets dynamic intensity modifier for a genre
   */
  setGenreIntensity(genre: string, intensity: number): void {
    const normalizedGenre = genre.toLowerCase();
    this.intensityModifiers.set(normalizedGenre, Math.max(0.1, Math.min(3.0, intensity)));
  }

  /**
   * Gets all available genre colors
   */
  getAllGenreColors(): GenreColorPalette {
    const colors: GenreColorPalette = {} as GenreColorPalette;
    
    Object.entries(this.baseColors).forEach(([genre, color]) => {
      colors[genre as keyof GenreColorPalette] = this.getGenreColor(genre);
    });
    
    return colors;
  }

  /**
   * Creates a color gradient between two genres
   */
  createGenreGradient(genre1: string, genre2: string, steps: number = 10): THREE.Color[] {
    const color1 = this.getGenreColor(genre1);
    const color2 = this.getGenreColor(genre2);
    const gradient: THREE.Color[] = [];
    
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const mixedColor = color1.clone().lerp(color2, t);
      gradient.push(mixedColor);
    }
    
    return gradient;
  }

  /**
   * Gets complementary color for a genre
   */
  getComplementaryColor(genre: string): THREE.Color {
    const baseColor = this.getGenreColor(genre);
    const hsl = { h: 0, s: 0, l: 0 };
    baseColor.getHSL(hsl);
    
    // Shift hue by 180 degrees for complementary color
    hsl.h = (hsl.h + 0.5) % 1.0;
    
    const complementary = new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l);
    return this.applyNoirStyling(complementary);
  }

  /**
   * Gets analogous colors for a genre (colors adjacent on color wheel)
   */
  getAnalogousColors(genre: string, count: number = 3): THREE.Color[] {
    const baseColor = this.getGenreColor(genre);
    const hsl = { h: 0, s: 0, l: 0 };
    baseColor.getHSL(hsl);
    
    const analogous: THREE.Color[] = [];
    const hueStep = 0.083; // 30 degrees in normalized hue (30/360)
    
    for (let i = 0; i < count; i++) {
      const offset = (i - Math.floor(count / 2)) * hueStep;
      const newHue = (hsl.h + offset + 1.0) % 1.0;
      const analogousColor = new THREE.Color().setHSL(newHue, hsl.s, hsl.l);
      analogous.push(this.applyNoirStyling(analogousColor));
    }
    
    return analogous;
  }

  /**
   * Updates configuration
   */
  updateConfig(newConfig: Partial<GenreColorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets current configuration
   */
  getConfig(): GenreColorConfig {
    return { ...this.config };
  }

  // Private methods

  private initializeBaseColors(): void {
    // Deep neon colors in noir film style - more saturated and dramatic
    this.baseColors = {
      // Primary genres with enhanced noir styling
      metal: new THREE.Color(0xFF0030),      // Deep blood red with slight magenta
      rock: new THREE.Color(0x0070FF),       // Electric blue with more saturation
      punk: new THREE.Color(0x00FF30),       // Toxic green with slight yellow
      electronic: new THREE.Color(0x7000FF), // Deep electric purple
      jazz: new THREE.Color(0xFFCC00),       // Rich golden yellow
      classical: new THREE.Color(0xD0D0FF),  // Cool silver-blue
      pop: new THREE.Color(0xFF0070),        // Hot pink neon
      indie: new THREE.Color(0x00FFCC),      // Cyan-turquoise
      hiphop: new THREE.Color(0xFF7000),     // Deep orange-red
      default: new THREE.Color(0xF0F0F0)     // Warm white
    };

    // Apply noir styling to all base colors
    Object.keys(this.baseColors).forEach(genre => {
      const color = this.baseColors[genre as keyof GenreColorPalette];
      this.baseColors[genre as keyof GenreColorPalette] = this.applyNoirStyling(color);
    });
  }

  private initializeSubgenreMapping(): void {
    // Mapping of subgenres to primary/secondary genre colors for mixing
    this.subgenreMap = {
      // Metal subgenres
      'death metal': { primary: 'metal', secondary: 'punk', mixRatio: 0.2 },
      'black metal': { primary: 'metal', secondary: 'classical', mixRatio: 0.3 },
      'power metal': { primary: 'metal', secondary: 'classical', mixRatio: 0.4 },
      'thrash metal': { primary: 'metal', secondary: 'punk', mixRatio: 0.3 },
      'doom metal': { primary: 'metal', secondary: 'jazz', mixRatio: 0.2 },
      
      // Rock subgenres
      'hard rock': { primary: 'rock', secondary: 'metal', mixRatio: 0.3 },
      'prog rock': { primary: 'rock', secondary: 'classical', mixRatio: 0.4 },
      'psychedelic rock': { primary: 'rock', secondary: 'electronic', mixRatio: 0.3 },
      'blues rock': { primary: 'rock', secondary: 'jazz', mixRatio: 0.4 },
      'alternative rock': { primary: 'rock', secondary: 'indie', mixRatio: 0.3 },
      
      // Electronic subgenres
      'techno': { primary: 'electronic', secondary: 'punk', mixRatio: 0.2 },
      'house': { primary: 'electronic', secondary: 'pop', mixRatio: 0.3 },
      'ambient': { primary: 'electronic', secondary: 'classical', mixRatio: 0.4 },
      'drum and bass': { primary: 'electronic', secondary: 'hiphop', mixRatio: 0.3 },
      'synthwave': { primary: 'electronic', secondary: 'pop', mixRatio: 0.4 },
      
      // Hip-hop subgenres
      'trap': { primary: 'hiphop', secondary: 'electronic', mixRatio: 0.3 },
      'old school hip hop': { primary: 'hiphop', secondary: 'jazz', mixRatio: 0.2 },
      'conscious hip hop': { primary: 'hiphop', secondary: 'jazz', mixRatio: 0.3 },
      
      // Pop subgenres
      'synthpop': { primary: 'pop', secondary: 'electronic', mixRatio: 0.4 },
      'indie pop': { primary: 'pop', secondary: 'indie', mixRatio: 0.5 },
      'electropop': { primary: 'pop', secondary: 'electronic', mixRatio: 0.3 },
      
      // Jazz subgenres
      'fusion': { primary: 'jazz', secondary: 'rock', mixRatio: 0.3 },
      'smooth jazz': { primary: 'jazz', secondary: 'pop', mixRatio: 0.2 },
      'free jazz': { primary: 'jazz', secondary: 'punk', mixRatio: 0.2 },
      
      // Indie subgenres
      'indie rock': { primary: 'indie', secondary: 'rock', mixRatio: 0.4 },
      'indie electronic': { primary: 'indie', secondary: 'electronic', mixRatio: 0.4 },
      'indie folk': { primary: 'indie', secondary: 'classical', mixRatio: 0.3 }
    };
  }

  private getBaseColor(genre: string): THREE.Color {
    const genreKey = genre as keyof GenreColorPalette;
    return this.baseColors[genreKey] || this.baseColors.default;
  }

  private getMixedColor(subgenre: string, intensity: number): THREE.Color {
    const mapping = this.subgenreMap[subgenre];
    if (!mapping) {
      return this.getBaseColor('default');
    }

    const primaryColor = this.getBaseColor(mapping.primary);
    
    if (!mapping.secondary) {
      return this.applyIntensityModifications(primaryColor, subgenre, intensity);
    }

    const secondaryColor = this.getBaseColor(mapping.secondary);
    const mixRatio = mapping.mixRatio * this.config.mixingStrength;
    
    const mixedColor = primaryColor.clone().lerp(secondaryColor, mixRatio);
    return this.applyIntensityModifications(mixedColor, subgenre, intensity);
  }

  private applyIntensityModifications(color: THREE.Color, genre: string, intensity: number): THREE.Color {
    let modifiedColor = color.clone();
    
    // Apply base intensity
    modifiedColor.multiplyScalar(this.config.baseIntensity);
    
    // Apply dynamic intensity if enabled
    if (this.config.enableDynamicIntensity) {
      const dynamicIntensity = this.intensityModifiers.get(genre) || 1.0;
      modifiedColor.multiplyScalar(dynamicIntensity);
    }
    
    // Apply provided intensity
    modifiedColor.multiplyScalar(intensity);
    
    // Apply noir styling
    modifiedColor = this.applyNoirStyling(modifiedColor);
    
    // Ensure color values don't exceed maximum
    modifiedColor.r = Math.min(modifiedColor.r, 1.0);
    modifiedColor.g = Math.min(modifiedColor.g, 1.0);
    modifiedColor.b = Math.min(modifiedColor.b, 1.0);
    
    return modifiedColor;
  }

  private applyNoirStyling(color: THREE.Color): THREE.Color {
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    
    // Increase saturation for more dramatic noir effect
    hsl.s = Math.min(1.0, hsl.s + this.config.saturationBoost);
    
    // Slightly reduce lightness for deeper colors
    hsl.l = Math.max(0.1, hsl.l * 0.9);
    
    return new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l);
  }
}

/**
 * Global instance of the genre color system
 */
export const genreColorSystem = new GenreColorSystem();

/**
 * Utility functions for easy access
 */
export const GenreColorUtils = {
  /**
   * Get color for any genre or subgenre
   */
  getColor: (genre: string, intensity: number = 1.0): THREE.Color => {
    return genreColorSystem.getGenreColor(genre, intensity);
  },

  /**
   * Set dynamic intensity for a genre
   */
  setIntensity: (genre: string, intensity: number): void => {
    genreColorSystem.setGenreIntensity(genre, intensity);
  },

  /**
   * Get complementary color
   */
  getComplementary: (genre: string): THREE.Color => {
    return genreColorSystem.getComplementaryColor(genre);
  },

  /**
   * Get analogous colors
   */
  getAnalogous: (genre: string, count: number = 3): THREE.Color[] => {
    return genreColorSystem.getAnalogousColors(genre, count);
  },

  /**
   * Create gradient between genres
   */
  createGradient: (genre1: string, genre2: string, steps: number = 10): THREE.Color[] => {
    return genreColorSystem.createGenreGradient(genre1, genre2, steps);
  }
};