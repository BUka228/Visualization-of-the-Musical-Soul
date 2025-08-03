import { AudioManager as IAudioManager } from '../types';

export class AudioManager implements IAudioManager {
  private currentAudio?: HTMLAudioElement;
  private volume: number = 0.5;
  private fadeInDuration: number = 500; // ms
  private fadeOutDuration: number = 300; // ms
  private isCurrentlyPlaying: boolean = false;
  
  // Коллбэки для событий
  private onPlayStart?: () => void;
  private onPlayEnd?: () => void;
  private onError?: (error: Error) => void;

  constructor() {
    console.log('AudioManager инициализирован');
  }

  async playPreview(url: string): Promise<void> {
    console.log(`🎵 Попытка воспроизведения превью: ${url}`);
    
    try {
      // Останавливаем текущее воспроизведение
      await this.stopPreview();
      
      // Создаем новый аудио элемент
      this.currentAudio = new Audio();
      this.currentAudio.crossOrigin = 'anonymous';
      this.currentAudio.preload = 'auto';
      
      // Настройка обработчиков событий
      this.setupAudioEventListeners();
      
      // Устанавливаем источник и начальную громкость
      this.currentAudio.src = url;
      this.currentAudio.volume = 0; // Начинаем с нулевой громкости для fade-in
      
      // Загружаем и воспроизводим
      await this.loadAndPlay();
      
      // Применяем fade-in эффект
      this.fadeIn();
      
      this.isCurrentlyPlaying = true;
      
      if (this.onPlayStart) {
        this.onPlayStart();
      }
      
      console.log('✅ Превью начато успешно');
      
    } catch (error) {
      const audioError = error instanceof Error ? error : new Error('Неизвестная ошибка аудио');
      console.error('❌ Ошибка воспроизведения превью:', audioError.message);
      
      // Очищаем состояние при ошибке
      this.cleanup();
      
      if (this.onError) {
        this.onError(audioError);
      }
      
      throw audioError;
    }
  }

  private async loadAndPlay(): Promise<void> {
    if (!this.currentAudio) {
      throw new Error('Аудио элемент не инициализирован');
    }

    return new Promise((resolve, reject) => {
      if (!this.currentAudio) {
        reject(new Error('Аудио элемент не инициализирован'));
        return;
      }

      const handleCanPlay = () => {
        if (!this.currentAudio) return;
        
        this.currentAudio.removeEventListener('canplay', handleCanPlay);
        this.currentAudio.removeEventListener('error', handleError);
        
        // Попытка воспроизведения
        const playPromise = this.currentAudio.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => resolve())
            .catch((error) => reject(new Error(`Ошибка воспроизведения: ${error.message}`)));
        } else {
          resolve();
        }
      };

      const handleError = () => {
        if (!this.currentAudio) return;
        
        this.currentAudio.removeEventListener('canplay', handleCanPlay);
        this.currentAudio.removeEventListener('error', handleError);
        
        const error = this.currentAudio.error;
        const errorMessage = error ? `Код ошибки: ${error.code}` : 'Неизвестная ошибка загрузки';
        reject(new Error(`Ошибка загрузки аудио: ${errorMessage}`));
      };

      // Устанавливаем обработчики
      this.currentAudio.addEventListener('canplay', handleCanPlay);
      this.currentAudio.addEventListener('error', handleError);
      
      // Начинаем загрузку
      this.currentAudio.load();
    });
  }

  private setupAudioEventListeners(): void {
    if (!this.currentAudio) return;

    // Обработчик окончания воспроизведения
    this.currentAudio.addEventListener('ended', () => {
      console.log('🎵 Превью завершено');
      this.isCurrentlyPlaying = false;
      
      if (this.onPlayEnd) {
        this.onPlayEnd();
      }
      
      this.cleanup();
    });

    // Обработчик ошибок во время воспроизведения
    this.currentAudio.addEventListener('error', (event) => {
      const target = event.target as HTMLAudioElement;
      const error = target.error;
      const errorMessage = error ? `Код ошибки: ${error.code}` : 'Неизвестная ошибка';
      
      console.error('❌ Ошибка во время воспроизведения:', errorMessage);
      
      this.isCurrentlyPlaying = false;
      
      if (this.onError) {
        this.onError(new Error(`Ошибка воспроизведения: ${errorMessage}`));
      }
      
      this.cleanup();
    });

    // Обработчик паузы
    this.currentAudio.addEventListener('pause', () => {
      console.log('⏸️ Превью приостановлено');
      this.isCurrentlyPlaying = false;
    });

    // Обработчик возобновления
    this.currentAudio.addEventListener('play', () => {
      console.log('▶️ Превью возобновлено');
      this.isCurrentlyPlaying = true;
    });
  }

  stopPreview(): void {
    if (!this.currentAudio || !this.isCurrentlyPlaying) {
      return;
    }

    console.log('⏹️ Остановка превью');

    // Применяем fade-out эффект перед остановкой
    this.fadeOut().then(() => {
      this.cleanup();
    });

    this.isCurrentlyPlaying = false;
  }

  private fadeIn(): void {
    if (!this.currentAudio) return;

    const targetVolume = this.volume;
    const steps = 20;
    const stepDuration = this.fadeInDuration / steps;
    const volumeStep = targetVolume / steps;
    
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      if (!this.currentAudio || currentStep >= steps) {
        clearInterval(fadeInterval);
        return;
      }

      currentStep++;
      this.currentAudio.volume = Math.min(volumeStep * currentStep, targetVolume);

      if (currentStep >= steps) {
        clearInterval(fadeInterval);
      }
    }, stepDuration);
  }

  private fadeOut(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.currentAudio) {
        resolve();
        return;
      }

      const initialVolume = this.currentAudio.volume;
      const steps = 15;
      const stepDuration = this.fadeOutDuration / steps;
      const volumeStep = initialVolume / steps;
      
      let currentStep = 0;

      const fadeInterval = setInterval(() => {
        if (!this.currentAudio || currentStep >= steps) {
          clearInterval(fadeInterval);
          resolve();
          return;
        }

        currentStep++;
        this.currentAudio.volume = Math.max(initialVolume - (volumeStep * currentStep), 0);

        if (currentStep >= steps) {
          clearInterval(fadeInterval);
          resolve();
        }
      }, stepDuration);
    });
  }

  private cleanup(): void {
    if (this.currentAudio) {
      // Останавливаем воспроизведение
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      
      // Удаляем все обработчики событий
      this.currentAudio.removeEventListener('ended', () => {});
      this.currentAudio.removeEventListener('error', () => {});
      this.currentAudio.removeEventListener('pause', () => {});
      this.currentAudio.removeEventListener('play', () => {});
      
      // Очищаем источник
      this.currentAudio.src = '';
      this.currentAudio.load();
      
      this.currentAudio = undefined;
    }
    
    this.isCurrentlyPlaying = false;
  }

  setVolume(volume: number): void {
    // Ограничиваем значение громкости от 0 до 1
    this.volume = Math.max(0, Math.min(1, volume));
    
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
    
    console.log(`🔊 Громкость установлена: ${Math.round(this.volume * 100)}%`);
  }

  getCurrentTime(): number {
    if (!this.currentAudio) {
      return 0;
    }
    
    return this.currentAudio.currentTime;
  }

  isPlaying(): boolean {
    return this.isCurrentlyPlaying;
  }

  // Дополнительные методы для управления
  
  /**
   * Получает общую длительность текущего трека
   */
  getDuration(): number {
    if (!this.currentAudio) {
      return 0;
    }
    
    return this.currentAudio.duration || 0;
  }

  /**
   * Получает прогресс воспроизведения в процентах (0-100)
   */
  getProgress(): number {
    if (!this.currentAudio) {
      return 0;
    }
    
    const duration = this.getDuration();
    const currentTime = this.getCurrentTime();
    
    if (duration === 0) {
      return 0;
    }
    
    return (currentTime / duration) * 100;
  }

  /**
   * Устанавливает позицию воспроизведения
   */
  setCurrentTime(time: number): void {
    if (!this.currentAudio) {
      return;
    }
    
    const duration = this.getDuration();
    const clampedTime = Math.max(0, Math.min(time, duration));
    
    this.currentAudio.currentTime = clampedTime;
  }

  /**
   * Приостанавливает воспроизведение
   */
  pause(): void {
    if (this.currentAudio && this.isCurrentlyPlaying) {
      this.currentAudio.pause();
    }
  }

  /**
   * Возобновляет воспроизведение
   */
  resume(): void {
    if (this.currentAudio && !this.isCurrentlyPlaying) {
      const playPromise = this.currentAudio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('❌ Ошибка возобновления воспроизведения:', error);
          
          if (this.onError) {
            this.onError(new Error(`Ошибка возобновления: ${error.message}`));
          }
        });
      }
    }
  }

  // Методы для установки коллбэков
  
  setOnPlayStart(callback: () => void): void {
    this.onPlayStart = callback;
  }

  setOnPlayEnd(callback: () => void): void {
    this.onPlayEnd = callback;
  }

  setOnError(callback: (error: Error) => void): void {
    this.onError = callback;
  }

  // Освобождение ресурсов
  dispose(): void {
    console.log('🗑️ Освобождение ресурсов AudioManager...');
    
    this.stopPreview();
    this.cleanup();
    
    // Сброс коллбэков
    this.onPlayStart = undefined;
    this.onPlayEnd = undefined;
    this.onError = undefined;
    
    console.log('✅ Ресурсы AudioManager освобождены');
  }
}