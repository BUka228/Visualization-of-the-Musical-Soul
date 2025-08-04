import { CrystalTrack } from '../types';

/**
 * Минималистичный HUD для отображения информации о треках
 * Показывает информацию снизу экрана с тонким гротескным шрифтом
 */
export class MinimalistHUD {
  private container: HTMLElement;
  private hudElement?: HTMLElement;
  private trackNameElement?: HTMLElement;
  private artistNameElement?: HTMLElement;
  private genreElement?: HTMLElement;
  private additionalInfoElement?: HTMLElement;
  private initialized: boolean = false;
  private currentTrack?: CrystalTrack;
  private isVisible: boolean = false;

  // Настройки стилей
  private static readonly HUD_STYLES = {
    position: 'fixed',
    bottom: '30px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '1000',
    pointerEvents: 'none',
    userSelect: 'none',
    textAlign: 'center',
    fontFamily: '"Helvetica Neue", "Arial", sans-serif', // Тонкий гротеск
    fontWeight: '200', // Очень тонкий
    color: '#ffffff',
    textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
    opacity: '0',
    transition: 'opacity 0.4s ease, transform 0.4s ease',
    maxWidth: '600px',
    padding: '0 20px'
  };

  private static readonly TRACK_NAME_STYLES = {
    fontSize: '24px',
    fontWeight: '300',
    letterSpacing: '1px',
    marginBottom: '8px',
    color: '#ffffff',
    textShadow: '0 0 15px rgba(255, 255, 255, 0.4)'
  };

  private static readonly ARTIST_NAME_STYLES = {
    fontSize: '16px',
    fontWeight: '200',
    letterSpacing: '0.5px',
    marginBottom: '12px',
    color: '#cccccc',
    textShadow: '0 0 10px rgba(255, 255, 255, 0.2)'
  };

  private static readonly GENRE_STYLES = {
    fontSize: '12px',
    fontWeight: '200',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    marginBottom: '6px',
    opacity: '0.8'
  };

  private static readonly ADDITIONAL_INFO_STYLES = {
    fontSize: '11px',
    fontWeight: '200',
    letterSpacing: '1px',
    opacity: '0.6',
    color: '#aaaaaa'
  };

  // Настройки анимации
  private static readonly ANIMATION_CONFIG = {
    showDuration: 400,    // Длительность появления
    hideDuration: 300,    // Длительность исчезновения
    showDelay: 100,       // Задержка перед появлением
    hideDelay: 0          // Задержка перед исчезновением
  };

  constructor(container: HTMLElement) {
    this.container = container;
    console.log('🎨 Minimalist HUD created');
  }

  /**
   * Инициализация HUD системы
   */
  initialize(): void {
    console.log('🎨 Initializing Minimalist HUD...');
    
    this.createHUDElements();
    this.setupResponsiveDesign();
    this.initialized = true;
    
    console.log('✅ Minimalist HUD initialized');
  }

  /**
   * Создает элементы HUD
   */
  private createHUDElements(): void {
    // Создаем основной контейнер HUD
    this.hudElement = document.createElement('div');
    this.hudElement.id = 'soul-galaxy-hud';
    this.applyStyles(this.hudElement, MinimalistHUD.HUD_STYLES);

    // Создаем элемент для названия трека
    this.trackNameElement = document.createElement('div');
    this.trackNameElement.className = 'hud-track-name';
    this.applyStyles(this.trackNameElement, MinimalistHUD.TRACK_NAME_STYLES);

    // Создаем элемент для имени исполнителя
    this.artistNameElement = document.createElement('div');
    this.artistNameElement.className = 'hud-artist-name';
    this.applyStyles(this.artistNameElement, MinimalistHUD.ARTIST_NAME_STYLES);

    // Создаем элемент для жанра
    this.genreElement = document.createElement('div');
    this.genreElement.className = 'hud-genre';
    this.applyStyles(this.genreElement, MinimalistHUD.GENRE_STYLES);

    // Создаем элемент для дополнительной информации
    this.additionalInfoElement = document.createElement('div');
    this.additionalInfoElement.className = 'hud-additional-info';
    this.applyStyles(this.additionalInfoElement, MinimalistHUD.ADDITIONAL_INFO_STYLES);

    // Собираем HUD
    this.hudElement.appendChild(this.trackNameElement);
    this.hudElement.appendChild(this.artistNameElement);
    this.hudElement.appendChild(this.genreElement);
    this.hudElement.appendChild(this.additionalInfoElement);

    // Добавляем в контейнер
    this.container.appendChild(this.hudElement);

    console.log('🎨 HUD elements created and added to DOM');
  }

  /**
   * Применяет стили к элементу
   */
  private applyStyles(element: HTMLElement, styles: { [key: string]: string }): void {
    Object.entries(styles).forEach(([property, value]) => {
      (element.style as any)[property] = value;
    });
  }

  /**
   * Настраивает адаптивный дизайн для разных размеров экрана
   */
  private setupResponsiveDesign(): void {
    const updateResponsiveStyles = () => {
      if (!this.hudElement) return;

      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      // Адаптация для мобильных устройств
      if (screenWidth <= 768) {
        this.hudElement.style.bottom = '20px';
        this.hudElement.style.padding = '0 15px';
        this.hudElement.style.maxWidth = '90%';
        
        if (this.trackNameElement) {
          this.trackNameElement.style.fontSize = '20px';
        }
        if (this.artistNameElement) {
          this.artistNameElement.style.fontSize = '14px';
        }
        if (this.genreElement) {
          this.genreElement.style.fontSize = '10px';
        }
        if (this.additionalInfoElement) {
          this.additionalInfoElement.style.fontSize = '9px';
        }
      }
      // Адаптация для планшетов
      else if (screenWidth <= 1024) {
        this.hudElement.style.bottom = '25px';
        this.hudElement.style.padding = '0 18px';
        this.hudElement.style.maxWidth = '80%';
        
        if (this.trackNameElement) {
          this.trackNameElement.style.fontSize = '22px';
        }
        if (this.artistNameElement) {
          this.artistNameElement.style.fontSize = '15px';
        }
      }
      // Адаптация для больших экранов
      else if (screenWidth >= 1920) {
        this.hudElement.style.bottom = '40px';
        this.hudElement.style.maxWidth = '700px';
        
        if (this.trackNameElement) {
          this.trackNameElement.style.fontSize = '28px';
        }
        if (this.artistNameElement) {
          this.artistNameElement.style.fontSize = '18px';
        }
        if (this.genreElement) {
          this.genreElement.style.fontSize = '14px';
        }
        if (this.additionalInfoElement) {
          this.additionalInfoElement.style.fontSize = '12px';
        }
      }

      // Адаптация для очень высоких экранов
      if (screenHeight >= 1200) {
        this.hudElement.style.bottom = '50px';
      }
    };

    // Применяем адаптивные стили при инициализации
    updateResponsiveStyles();

    // Обновляем при изменении размера окна
    window.addEventListener('resize', updateResponsiveStyles);

    console.log('📱 Responsive design configured');
  }

  /**
   * Показывает информацию о треке
   */
  showTrackInfo(track: CrystalTrack): void {
    if (!this.initialized || !this.hudElement) {
      console.warn('⚠️ Minimalist HUD not initialized');
      return;
    }

    console.log(`🎨 Showing track info: ${track.name} by ${track.artist}`);

    this.currentTrack = track;
    this.updateTrackInfo(track);

    // Анимация появления с задержкой
    setTimeout(() => {
      this.showHUD();
    }, MinimalistHUD.ANIMATION_CONFIG.showDelay);
  }

  /**
   * Скрывает информацию о треке
   */
  hideTrackInfo(): void {
    if (!this.initialized || !this.hudElement) {
      return;
    }

    console.log('🎨 Hiding track info');

    // Анимация исчезновения с задержкой
    setTimeout(() => {
      this.hideHUD();
    }, MinimalistHUD.ANIMATION_CONFIG.hideDelay);

    this.currentTrack = undefined;
  }

  /**
   * Обновляет содержимое HUD с информацией о треке
   */
  private updateTrackInfo(track: CrystalTrack): void {
    if (!this.trackNameElement || !this.artistNameElement || 
        !this.genreElement || !this.additionalInfoElement) {
      return;
    }

    // Название трека
    this.trackNameElement.textContent = track.name;

    // Исполнитель
    this.artistNameElement.textContent = track.artist;

    // Жанр с цветом
    this.genreElement.textContent = track.genre;
    this.genreElement.style.color = track.genreColor.getHexString();
    this.genreElement.style.textShadow = `0 0 15px ${track.genreColor.getHexString()}40`;

    // Дополнительная информация
    const additionalInfo = this.formatAdditionalInfo(track);
    this.additionalInfoElement.textContent = additionalInfo;
  }

  /**
   * Форматирует дополнительную информацию о треке
   */
  private formatAdditionalInfo(track: CrystalTrack): string {
    const info: string[] = [];

    // Добавляем размер кристалла (как индикатор энергии)
    if (track.size !== undefined) {
      info.push(`Size ${Math.round(track.size * 100)}%`);
    }

    // Добавляем популярность
    if (track.popularity !== undefined && track.popularity > 0) {
      info.push(`Popularity ${track.popularity}%`);
    }

    // Добавляем длительность
    if (track.duration) {
      const minutes = Math.floor(track.duration / 60000);
      const seconds = Math.floor((track.duration % 60000) / 1000);
      info.push(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }

    return info.join(' • ');
  }

  /**
   * Показывает HUD с анимацией
   */
  private showHUD(): void {
    if (!this.hudElement || this.isVisible) return;

    this.isVisible = true;
    this.hudElement.style.opacity = '1';
    this.hudElement.style.transform = 'translateX(-50%) translateY(0)';

    // Добавляем класс для CSS анимаций
    this.hudElement.classList.add('hud-visible');
  }

  /**
   * Скрывает HUD с анимацией
   */
  private hideHUD(): void {
    if (!this.hudElement || !this.isVisible) return;

    this.isVisible = false;
    this.hudElement.style.opacity = '0';
    this.hudElement.style.transform = 'translateX(-50%) translateY(10px)';

    // Убираем класс для CSS анимаций
    this.hudElement.classList.remove('hud-visible');
  }

  /**
   * Обновляет HUD (может использоваться для анимаций)
   */
  update(deltaTime: number): void {
    if (!this.initialized || !this.isVisible || !this.currentTrack) {
      return;
    }

    // Здесь можно добавить дополнительные анимации или эффекты
    // Например, пульсацию текста в ритм музыки
    this.updatePulseEffect(deltaTime);
  }

  /**
   * Обновляет эффект пульсации текста
   */
  private updatePulseEffect(deltaTime: number): void {
    if (!this.currentTrack || !this.trackNameElement) return;

    // Создаем тонкий эффект пульсации для названия трека
    const pulseSpeed = this.currentTrack.pulseSpeed || 1.0;
    const time = performance.now() * 0.001;
    const pulse = Math.sin(time * pulseSpeed) * 0.1 + 1.0;
    
    // Применяем очень тонкую пульсацию к тени текста
    const shadowIntensity = 0.3 + pulse * 0.1;
    this.trackNameElement.style.textShadow = 
      `0 0 15px rgba(255, 255, 255, ${shadowIntensity})`;
  }

  /**
   * Устанавливает кастомные стили для HUD
   */
  setCustomStyles(styles: {
    fontFamily?: string;
    fontSize?: string;
    color?: string;
    position?: { bottom?: string; left?: string; };
  }): void {
    if (!this.hudElement) return;

    if (styles.fontFamily) {
      this.hudElement.style.fontFamily = styles.fontFamily;
    }

    if (styles.color) {
      this.hudElement.style.color = styles.color;
    }

    if (styles.position) {
      if (styles.position.bottom) {
        this.hudElement.style.bottom = styles.position.bottom;
      }
      if (styles.position.left) {
        this.hudElement.style.left = styles.position.left;
      }
    }

    if (styles.fontSize && this.trackNameElement) {
      this.trackNameElement.style.fontSize = styles.fontSize;
    }
  }

  /**
   * Получает текущий отображаемый трек
   */
  getCurrentTrack(): CrystalTrack | undefined {
    return this.currentTrack;
  }

  /**
   * Проверяет, виден ли HUD
   */
  isHUDVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Принудительно скрывает HUD (например, при фокусе)
   */
  forceHide(): void {
    this.hideTrackInfo();
  }

  /**
   * Получает статистику HUD
   */
  getHUDStats(): {
    initialized: boolean;
    visible: boolean;
    currentTrack: string | null;
    elementCount: number;
  } {
    return {
      initialized: this.initialized,
      visible: this.isVisible,
      currentTrack: this.currentTrack ? `${this.currentTrack.name} by ${this.currentTrack.artist}` : null,
      elementCount: this.hudElement ? this.hudElement.children.length : 0
    };
  }

  /**
   * Освобождает ресурсы HUD
   */
  dispose(): void {
    console.log('🗑️ Disposing Minimalist HUD...');

    // Убираем обработчик изменения размера окна
    window.removeEventListener('resize', this.setupResponsiveDesign);

    // Удаляем HUD из DOM
    if (this.hudElement && this.container.contains(this.hudElement)) {
      this.container.removeChild(this.hudElement);
    }

    // Очищаем ссылки
    this.hudElement = undefined;
    this.trackNameElement = undefined;
    this.artistNameElement = undefined;
    this.genreElement = undefined;
    this.additionalInfoElement = undefined;
    this.currentTrack = undefined;

    // Сбрасываем состояние
    this.initialized = false;
    this.isVisible = false;

    console.log('✅ Minimalist HUD disposed');
  }
}