/**
 * Красивая лендинг-страница с призывом к действию
 */

import { FolderSelectionModal } from './FolderSelectionModal';

export class LandingPage {
  private container: HTMLElement;
  private folderModal?: FolderSelectionModal;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Показывает лендинг-страницу
   */
  show(): void {
    this.render();
    this.setupEventListeners();
  }

  /**
   * Скрывает лендинг-страницу
   */
  hide(): void {
    const landing = document.getElementById('landing-page');
    if (landing) {
      landing.remove();
    }
  }

  /**
   * Отрисовывает лендинг-страницу
   */
  private render(): void {
    const landing = document.createElement('div');
    landing.id = 'landing-page';
    landing.style.cssText = `
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
    `;

    landing.innerHTML = `
      <!-- Фоновая анимация -->
      <div id="background-animation" style="
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0.3;
        z-index: 1;
      "></div>

      <!-- Основной контент -->
      <div style="
        position: relative;
        z-index: 2;
        text-align: center;
        max-width: 800px;
        padding: 40px;
        animation: fadeInUp 1s ease-out;
      ">
        <!-- Заголовок -->
        <h1 style="
          font-size: 4rem;
          font-weight: bold;
          background: linear-gradient(45deg, #4fc3f7, #29b6f6, #03a9f4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 20px 0;
          text-shadow: 0 0 30px rgba(79, 195, 247, 0.3);
          animation: glow 2s ease-in-out infinite alternate;
        ">
          🌌 Твоя музыкальная вселенная
        </h1>

        <!-- Подзаголовок -->
        <p style="
          font-size: 1.5rem;
          color: #e0e0e0;
          margin: 0 0 40px 0;
          line-height: 1.6;
          opacity: 0.9;
        ">
          Визуализируй свою музыкальную коллекцию<br>
          в интерактивной 3D-галактике
        </p>

        <!-- Особенности -->
        <div style="
          display: flex;
          justify-content: center;
          gap: 40px;
          margin: 40px 0 60px 0;
          flex-wrap: wrap;
        ">
          <div style="
            background: rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            min-width: 200px;
            animation: float 3s ease-in-out infinite;
          ">
            <div style="font-size: 2rem; margin-bottom: 10px;">📁</div>
            <h3 style="color: #4fc3f7; margin: 0 0 8px 0; font-size: 1.1rem;">Локальные файлы</h3>
            <p style="color: #ccc; margin: 0; font-size: 0.9rem;">Используй свою коллекцию MP3</p>
          </div>

          <div style="
            background: rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            min-width: 200px;
            animation: float 3s ease-in-out infinite 0.5s;
          ">
            <div style="font-size: 2rem; margin-bottom: 10px;">🎵</div>
            <h3 style="color: #4fc3f7; margin: 0 0 8px 0; font-size: 1.1rem;">3D Визуализация</h3>
            <p style="color: #ccc; margin: 0; font-size: 0.9rem;">Каждый трек — звезда в галактике</p>
          </div>

          <div style="
            background: rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            min-width: 200px;
            animation: float 3s ease-in-out infinite 1s;
          ">
            <div style="font-size: 2rem; margin-bottom: 10px;">🎨</div>
            <h3 style="color: #4fc3f7; margin: 0 0 8px 0; font-size: 1.1rem;">Умная группировка</h3>
            <p style="color: #ccc; margin: 0; font-size: 0.9rem;">Автоматическое распознавание жанров</p>
          </div>
        </div>

        <!-- Главная кнопка CTA -->
        <button id="create-galaxy-btn" style="
          background: linear-gradient(45deg, #ff6b35, #f7931e, #ff6b35);
          background-size: 200% 200%;
          color: #fff;
          border: none;
          padding: 20px 50px;
          border-radius: 50px;
          font-size: 1.3rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(255, 107, 53, 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
          animation: pulse-cta 2s ease-in-out infinite;
          position: relative;
          overflow: hidden;
        " onmouseover="
          this.style.transform = 'translateY(-3px) scale(1.05)';
          this.style.boxShadow = '0 15px 40px rgba(255, 107, 53, 0.6)';
        " onmouseout="
          this.style.transform = 'translateY(0) scale(1)';
          this.style.boxShadow = '0 10px 30px rgba(255, 107, 53, 0.4)';
        ">
          <span style="position: relative; z-index: 2;">🚀 Создать свою галактику</span>
          <div style="
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
          "></div>
        </button>

        <!-- Дополнительная информация -->
        <p style="
          color: #999;
          font-size: 0.9rem;
          margin-top: 30px;
          line-height: 1.5;
        ">
          Безопасно и конфиденциально • Данные обрабатываются локально<br>
          Поддерживает MP3 файлы с метаданными
        </p>
      </div>

      <!-- Декоративные элементы -->
      <div class="stars"></div>
    `;

    // Добавляем CSS анимации
    this.addAnimationStyles();
    
    // Создаем фоновую анимацию
    this.createBackgroundAnimation();
    
    // Создаем звезды
    this.createStars();

    document.body.appendChild(landing);
  }

  /**
   * Добавляет CSS анимации
   */
  private addAnimationStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes glow {
        from {
          text-shadow: 0 0 30px rgba(79, 195, 247, 0.3);
        }
        to {
          text-shadow: 0 0 50px rgba(79, 195, 247, 0.6), 0 0 70px rgba(79, 195, 247, 0.4);
        }
      }

      @keyframes float {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-10px);
        }
      }

      @keyframes pulse-cta {
        0%, 100% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
      }

      @keyframes twinkle {
        0%, 100% {
          opacity: 0.3;
          transform: scale(1);
        }
        50% {
          opacity: 1;
          transform: scale(1.2);
        }
      }

      .stars {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }

      .star {
        position: absolute;
        background: #fff;
        border-radius: 50%;
        animation: twinkle 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Создает фоновую анимацию
   */
  private createBackgroundAnimation(): void {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const container = document.getElementById('background-animation');
    
    if (!ctx || !container) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    
    container.appendChild(canvas);

    // Создаем частицы для фоновой анимации
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }> = [];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(79, 195, 247, ${particle.opacity})`;
        ctx.fill();
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  /**
   * Создает декоративные звезды
   */
  private createStars(): void {
    const starsContainer = document.querySelector('.stars');
    if (!starsContainer) return;

    for (let i = 0; i < 100; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.cssText = `
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        width: ${Math.random() * 3 + 1}px;
        height: ${Math.random() * 3 + 1}px;
        animation-delay: ${Math.random() * 2}s;
        animation-duration: ${Math.random() * 3 + 2}s;
      `;
      starsContainer.appendChild(star);
    }
  }

  /**
   * Настраивает обработчики событий
   */
  private setupEventListeners(): void {
    const createBtn = document.getElementById('create-galaxy-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.handleCreateGalaxy());
    }

    // Обработка изменения размера окна для canvas
    window.addEventListener('resize', () => {
      const canvas = document.querySelector('#background-animation canvas') as HTMLCanvasElement;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    });
  }

  /**
   * Обработчик создания галактики
   */
  private handleCreateGalaxy(): void {
    // Создаем и показываем модальное окно выбора папки
    this.folderModal = new FolderSelectionModal();
    this.folderModal.show();

    // Слушаем событие выбора папки
    window.addEventListener('folder-selected', (event: any) => {
      this.handleFolderSelected(event.detail);
    }, { once: true });
  }

  /**
   * Обработчик выбора папки
   */
  private handleFolderSelected(detail: any): void {
    if (this.folderModal) {
      this.folderModal.hide();
      this.folderModal = undefined;
    }

    this.hide();

    // Запускаем процесс создания галактики с выбранной папкой
    window.dispatchEvent(new CustomEvent('galaxy-creation-started', { 
      detail 
    }));
  }

  /**
   * Освобождает ресурсы
   */
  dispose(): void {
    this.hide();
    
    if (this.folderModal) {
      this.folderModal.dispose();
      this.folderModal = undefined;
    }
  }
}