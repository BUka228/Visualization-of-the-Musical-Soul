/**
 * Красивый экран прогресса создания галактики
 */

import { CollectionProgress } from '../data/DataCollector';

export class GalaxyCreationProgress {
  private container: HTMLElement;
  private progressScreen?: HTMLElement;
  private animationId?: number;
  private particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    color: string;
  }> = [];

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Показывает экран прогресса
   */
  show(): void {
    this.render();
    this.startBackgroundAnimation();
  }

  /**
   * Скрывает экран прогресса
   */
  hide(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }

    if (this.progressScreen) {
      this.progressScreen.style.animation = 'fadeOut 0.5s ease-out';
      setTimeout(() => {
        if (this.progressScreen && this.progressScreen.parentElement) {
          this.progressScreen.remove();
        }
      }, 500);
    }
  }

  /**
   * Обновляет прогресс
   */
  updateProgress(progress: CollectionProgress): void {
    this.updateProgressBar(progress.progress);
    this.updateStatusMessage(progress.message);
    this.updateProgressDetails(progress);
    this.updateStageAnimation(progress.stage);
  }

  /**
   * Отрисовывает экран прогресса
   */
  private render(): void {
    this.progressScreen = document.createElement('div');
    this.progressScreen.id = 'galaxy-creation-progress';
    this.progressScreen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 30%, #16213e 70%, #0f3460 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      font-family: 'Arial', sans-serif;
      overflow: hidden;
      animation: fadeIn 0.5s ease-out;
    `;

    this.progressScreen.innerHTML = `
      <!-- Фоновая анимация -->
      <canvas id="progress-background" style="
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0.4;
        z-index: 1;
      "></canvas>

      <!-- Основной контент -->
      <div style="
        position: relative;
        z-index: 2;
        text-align: center;
        max-width: 600px;
        padding: 40px;
      ">
        <!-- Анимированная иконка -->
        <div id="stage-icon" style="
          font-size: 4rem;
          margin-bottom: 30px;
          animation: pulse 2s ease-in-out infinite;
        ">🌌</div>

        <!-- Заголовок -->
        <h1 style="
          font-size: 2.5rem;
          font-weight: bold;
          background: linear-gradient(45deg, #4fc3f7, #29b6f6, #03a9f4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 20px 0;
          animation: glow 2s ease-in-out infinite alternate;
        ">
          Создание галактики
        </h1>

        <!-- Статус -->
        <p id="status-message" style="
          font-size: 1.3rem;
          color: #e0e0e0;
          margin: 0 0 40px 0;
          min-height: 1.5em;
          animation: fadeInUp 0.5s ease-out;
        ">
          Инициализация...
        </p>

        <!-- Прогресс-бар -->
        <div style="
          background: rgba(255, 255, 255, 0.1);
          border-radius: 25px;
          height: 20px;
          overflow: hidden;
          margin-bottom: 20px;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
        ">
          <div id="main-progress-bar" style="
            background: linear-gradient(90deg, #4fc3f7, #29b6f6, #03a9f4, #4fc3f7);
            background-size: 200% 100%;
            height: 100%;
            width: 0%;
            border-radius: 25px;
            transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            animation: shimmer 2s linear infinite;
            position: relative;
            overflow: hidden;
          ">
            <div style="
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
              animation: slide 2s linear infinite;
            "></div>
          </div>
        </div>

        <!-- Процент -->
        <div id="progress-percentage" style="
          font-size: 1.1rem;
          color: #4fc3f7;
          font-weight: bold;
          margin-bottom: 30px;
        ">0%</div>

        <!-- Детали прогресса -->
        <div id="progress-details" style="
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          margin-top: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        ">
          <div id="tracks-info" style="
            color: #ccc;
            font-size: 0.95rem;
            margin-bottom: 10px;
          ">
            Подготовка к загрузке...
          </div>
          <div id="current-track" style="
            color: #4fc3f7;
            font-size: 0.9rem;
            font-style: italic;
            min-height: 1.2em;
          "></div>
        </div>

        <!-- Этапы -->
        <div style="
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 30px;
          flex-wrap: wrap;
        ">
          <div id="stage-connecting" class="stage-indicator" style="
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.1);
            font-size: 0.9rem;
            color: #999;
            transition: all 0.3s;
          ">
            <div class="stage-dot" style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #666;
              transition: all 0.3s;
            "></div>
            Подключение
          </div>

          <div id="stage-fetching" class="stage-indicator" style="
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.1);
            font-size: 0.9rem;
            color: #999;
            transition: all 0.3s;
          ">
            <div class="stage-dot" style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #666;
              transition: all 0.3s;
            "></div>
            Загрузка
          </div>

          <div id="stage-processing" class="stage-indicator" style="
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.1);
            font-size: 0.9rem;
            color: #999;
            transition: all 0.3s;
          ">
            <div class="stage-dot" style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #666;
              transition: all 0.3s;
            "></div>
            Обработка
          </div>

          <div id="stage-saving" class="stage-indicator" style="
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.1);
            font-size: 0.9rem;
            color: #999;
            transition: all 0.3s;
          ">
            <div class="stage-dot" style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #666;
              transition: all 0.3s;
            "></div>
            Сохранение
          </div>
        </div>

        <!-- Подсказка -->
        <p style="
          color: #999;
          font-size: 0.85rem;
          margin-top: 30px;
          line-height: 1.4;
        ">
          Не закрывайте страницу во время создания галактики.<br>
          Процесс может занять несколько минут в зависимости от размера библиотеки.
        </p>
      </div>
    `;

    // Добавляем стили анимации
    this.addProgressStyles();

    document.body.appendChild(this.progressScreen);

    // Инициализируем canvas для фоновой анимации
    this.initializeCanvas();
  }

  /**
   * Добавляет стили анимации
   */
  private addProgressStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
          opacity: 0.8;
        }
        50% {
          transform: scale(1.1);
          opacity: 1;
        }
      }

      @keyframes glow {
        from {
          text-shadow: 0 0 20px rgba(79, 195, 247, 0.3);
        }
        to {
          text-shadow: 0 0 30px rgba(79, 195, 247, 0.6), 0 0 40px rgba(79, 195, 247, 0.4);
        }
      }

      @keyframes shimmer {
        0% {
          background-position: 0% 50%;
        }
        100% {
          background-position: 200% 50%;
        }
      }

      @keyframes slide {
        0% {
          left: -100%;
        }
        100% {
          left: 100%;
        }
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      .stage-indicator.active {
        background: rgba(79, 195, 247, 0.2) !important;
        color: #4fc3f7 !important;
        border: 1px solid rgba(79, 195, 247, 0.3);
      }

      .stage-indicator.active .stage-dot {
        background: #4fc3f7 !important;
        animation: pulse 1s ease-in-out infinite;
      }

      .stage-indicator.completed {
        background: rgba(76, 175, 80, 0.2) !important;
        color: #4caf50 !important;
        border: 1px solid rgba(76, 175, 80, 0.3);
      }

      .stage-indicator.completed .stage-dot {
        background: #4caf50 !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Инициализирует canvas для фоновой анимации
   */
  private initializeCanvas(): void {
    const canvas = document.getElementById('progress-background') as HTMLCanvasElement;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Создаем частицы
    for (let i = 0; i < 80; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.6 + 0.2,
        color: ['#4fc3f7', '#29b6f6', '#03a9f4', '#81c784', '#ffb74d'][Math.floor(Math.random() * 5)]
      });
    }
  }

  /**
   * Запускает фоновую анимацию
   */
  private startBackgroundAnimation(): void {
    const canvas = document.getElementById('progress-background') as HTMLCanvasElement;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      this.particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Отражение от границ
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        
        // Рисуем частицу
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color + Math.floor(particle.opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();
        
        // Соединяем близкие частицы линиями
        this.particles.forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = `rgba(79, 195, 247, ${0.1 * (1 - distance / 100)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });
      
      this.animationId = requestAnimationFrame(animate);
    };
    
    animate();
  }

  /**
   * Обновляет прогресс-бар
   */
  private updateProgressBar(progress: number): void {
    const progressBar = document.getElementById('main-progress-bar');
    const progressPercentage = document.getElementById('progress-percentage');
    
    if (progressBar) {
      progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
    }
    
    if (progressPercentage) {
      progressPercentage.textContent = `${Math.round(progress)}%`;
    }
  }

  /**
   * Обновляет сообщение статуса
   */
  private updateStatusMessage(message: string): void {
    const statusElement = document.getElementById('status-message');
    if (statusElement) {
      statusElement.style.animation = 'none';
      statusElement.textContent = message;
      // Перезапускаем анимацию
      setTimeout(() => {
        statusElement.style.animation = 'fadeInUp 0.5s ease-out';
      }, 10);
    }
  }

  /**
   * Обновляет детали прогресса
   */
  private updateProgressDetails(progress: CollectionProgress): void {
    const tracksInfo = document.getElementById('tracks-info');
    const currentTrack = document.getElementById('current-track');
    
    if (tracksInfo && progress.totalTracks) {
      const processed = progress.processedTracks || 0;
      tracksInfo.textContent = `Обработано треков: ${processed} из ${progress.totalTracks}`;
    }
    
    if (currentTrack) {
      if (progress.currentTrack) {
        currentTrack.textContent = `♪ ${progress.currentTrack}`;
        currentTrack.style.animation = 'fadeInUp 0.3s ease-out';
      } else {
        currentTrack.textContent = '';
      }
    }
  }

  /**
   * Обновляет анимацию этапа
   */
  private updateStageAnimation(stage: CollectionProgress['stage']): void {
    // Сбрасываем все этапы
    const stages = ['connecting', 'fetching', 'processing', 'saving'];
    stages.forEach(stageName => {
      const element = document.getElementById(`stage-${stageName}`);
      if (element) {
        element.classList.remove('active', 'completed');
      }
    });

    // Отмечаем завершенные этапы
    const stageOrder = ['connecting', 'fetching', 'processing', 'saving'];
    const currentIndex = stageOrder.indexOf(stage);
    
    stageOrder.forEach((stageName, index) => {
      const element = document.getElementById(`stage-${stageName}`);
      if (element) {
        if (index < currentIndex) {
          element.classList.add('completed');
        } else if (index === currentIndex) {
          element.classList.add('active');
        }
      }
    });

    // Обновляем иконку этапа
    const stageIcon = document.getElementById('stage-icon');
    if (stageIcon) {
      const icons = {
        connecting: '🔗',
        fetching: '📥',
        processing: '⚙️',
        saving: '💾',
        complete: '✅',
        error: '❌'
      };
      
      stageIcon.textContent = icons[stage] || '🌌';
      
      if (stage === 'complete') {
        stageIcon.style.animation = 'pulse 0.6s ease-out';
      } else if (stage === 'error') {
        stageIcon.style.animation = 'shake 0.5s ease-in-out';
      }
    }
  }

  /**
   * Показывает экран успешного завершения
   */
  showSuccess(tracksCount: number, tracksWithPreview: number): void {
    const content = this.progressScreen?.querySelector('[style*="z-index: 2"]');
    if (!content) return;

    content.innerHTML = `
      <div style="
        text-align: center;
        animation: successZoom 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      ">
        <div style="
          font-size: 5rem;
          margin-bottom: 30px;
          animation: bounce 1s ease-out;
        ">🎉</div>

        <h1 style="
          font-size: 2.8rem;
          font-weight: bold;
          background: linear-gradient(45deg, #4caf50, #81c784);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 20px 0;
        ">
          Галактика создана!
        </h1>

        <p style="
          font-size: 1.2rem;
          color: #e0e0e0;
          margin: 0 0 40px 0;
          line-height: 1.6;
        ">
          Ваша музыкальная вселенная готова к исследованию
        </p>

        <div style="
          display: flex;
          justify-content: center;
          gap: 40px;
          margin: 40px 0;
          flex-wrap: wrap;
        ">
          <div style="
            background: rgba(76, 175, 80, 0.2);
            border: 1px solid rgba(76, 175, 80, 0.3);
            border-radius: 16px;
            padding: 20px;
            min-width: 150px;
            backdrop-filter: blur(10px);
          ">
            <div style="font-size: 2rem; margin-bottom: 10px;">🎵</div>
            <div style="color: #4caf50; font-size: 1.5rem; font-weight: bold;">${tracksCount}</div>
            <div style="color: #ccc; font-size: 0.9rem;">треков загружено</div>
          </div>

          <div style="
            background: rgba(79, 195, 247, 0.2);
            border: 1px solid rgba(79, 195, 247, 0.3);
            border-radius: 16px;
            padding: 20px;
            min-width: 150px;
            backdrop-filter: blur(10px);
          ">
            <div style="font-size: 2rem; margin-bottom: 10px;">🎧</div>
            <div style="color: #4fc3f7; font-size: 1.5rem; font-weight: bold;">${tracksWithPreview}</div>
            <div style="color: #ccc; font-size: 0.9rem;">с превью</div>
          </div>
        </div>

        <button id="enter-galaxy-btn" style="
          background: linear-gradient(45deg, #4fc3f7, #29b6f6);
          color: #fff;
          border: none;
          padding: 18px 40px;
          border-radius: 50px;
          font-size: 1.2rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(79, 195, 247, 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 20px;
        " onmouseover="
          this.style.transform = 'translateY(-3px) scale(1.05)';
          this.style.boxShadow = '0 15px 40px rgba(79, 195, 247, 0.6)';
        " onmouseout="
          this.style.transform = 'translateY(0) scale(1)';
          this.style.boxShadow = '0 10px 30px rgba(79, 195, 247, 0.4)';
        ">
          🚀 Войти в галактику
        </button>
      </div>
    `;

    // Добавляем анимацию успеха
    const successStyle = document.createElement('style');
    successStyle.textContent = `
      @keyframes successZoom {
        0% {
          transform: scale(0.8);
          opacity: 0;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      @keyframes bounce {
        0%, 20%, 53%, 80%, 100% {
          transform: translate3d(0,0,0);
        }
        40%, 43% {
          transform: translate3d(0, -30px, 0);
        }
        70% {
          transform: translate3d(0, -15px, 0);
        }
        90% {
          transform: translate3d(0, -4px, 0);
        }
      }
    `;
    document.head.appendChild(successStyle);

    // Настраиваем кнопку входа
    const enterBtn = document.getElementById('enter-galaxy-btn');
    if (enterBtn) {
      enterBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('galaxy-ready', {
          detail: { tracksCount, tracksWithPreview }
        }));
      });
    }
  }

  /**
   * Показывает экран ошибки
   */
  showError(error: string): void {
    const content = this.progressScreen?.querySelector('[style*="z-index: 2"]');
    if (!content) return;

    content.innerHTML = `
      <div style="
        text-align: center;
        animation: errorShake 0.6s ease-out;
      ">
        <div style="
          font-size: 4rem;
          margin-bottom: 30px;
          color: #f44336;
        ">❌</div>

        <h1 style="
          font-size: 2.5rem;
          font-weight: bold;
          color: #f44336;
          margin: 0 0 20px 0;
        ">
          Ошибка создания галактики
        </h1>

        <p style="
          font-size: 1.1rem;
          color: #e0e0e0;
          margin: 0 0 30px 0;
          line-height: 1.6;
        ">
          ${error}
        </p>

        <div style="
          display: flex;
          justify-content: center;
          gap: 15px;
          flex-wrap: wrap;
        ">
          <button id="retry-btn" style="
            background: linear-gradient(45deg, #f44336, #e57373);
            color: #fff;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
          ">
            🔄 Попробовать снова
          </button>

          <button id="use-demo-btn" style="
            background: rgba(255, 255, 255, 0.1);
            color: #ccc;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
          ">
            📊 Использовать демо-данные
          </button>
        </div>
      </div>
    `;

    // Добавляем анимацию ошибки
    const errorStyle = document.createElement('style');
    errorStyle.textContent = `
      @keyframes errorShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
      }
    `;
    document.head.appendChild(errorStyle);

    // Настраиваем кнопки
    const retryBtn = document.getElementById('retry-btn');
    const demoBtn = document.getElementById('use-demo-btn');

    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('galaxy-creation-retry'));
      });
    }

    if (demoBtn) {
      demoBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('galaxy-use-demo'));
      });
    }
  }

  /**
   * Освобождает ресурсы
   */
  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }
    
    this.hide();
    this.particles = [];
  }
}