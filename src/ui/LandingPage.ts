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
      justify-content: flex-start;
      align-items: center;
      z-index: 9999;
      font-family: 'Arial', sans-serif;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 20px 0;
      box-sizing: border-box;
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
        max-width: 900px;
        padding: 20px;
        animation: fadeInUp 1s ease-out;
        width: 100%;
        box-sizing: border-box;
      ">
        <!-- Заголовок -->
        <h1 style="
          font-size: 3rem;
          font-weight: bold;
          background: linear-gradient(45deg, #4fc3f7, #29b6f6, #03a9f4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 15px 0;
          text-shadow: 0 0 30px rgba(79, 195, 247, 0.3);
          animation: glow 2s ease-in-out infinite alternate;
        ">
          🌌 Твоя музыкальная вселенная
        </h1>

        <!-- Подзаголовок -->
        <p style="
          font-size: 1.2rem;
          color: #e0e0e0;
          margin: 0 0 25px 0;
          line-height: 1.4;
          opacity: 0.9;
        ">
          Визуализируй свою музыкальную коллекцию в интерактивной 3D-галактике
        </p>

        <!-- Инструкция по подготовке данных -->
        <div class="instructions-container" style="
          background: rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 25px;
          margin: 25px auto 30px auto;
          backdrop-filter: blur(15px);
          border: 1px solid rgba(79, 195, 247, 0.3);
          text-align: left;
          max-width: 700px;
          animation: fadeInUp 1s ease-out 0.3s both;
        ">
          <h3 style="
            color: #4fc3f7;
            margin: 0 0 20px 0;
            font-size: 1.2rem;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
          ">
            <span>📋</span> Подготовка музыкальной коллекции
          </h3>
          
          <div class="instructions-grid" style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          ">
            <!-- Вариант 1: Автоматический сбор -->
            <div class="instruction-card" style="
              background: rgba(79, 195, 247, 0.1);
              border-radius: 15px;
              padding: 18px;
              border: 1px solid rgba(79, 195, 247, 0.2);
            ">
              <h4 style="
                color: #4fc3f7;
                margin: 0 0 12px 0;
                font-size: 1rem;
                display: flex;
                align-items: center;
                gap: 8px;
              ">
                <span>🤖</span> Автоматический сбор
              </h4>
              <p style="color: #ccc; margin: 0 0 15px 0; font-size: 0.85rem; line-height: 1.4;">
                Готовый сборщик для Яндекс.Музыки
              </p>
              <a href="https://github.com/BUka228/Visualization-of-the-Musical-Soul/releases/download/v1.0.0/YandexMusicCollector.exe" 
                 target="_blank"
                 style="
                   display: inline-flex;
                   align-items: center;
                   gap: 8px;
                   background: linear-gradient(45deg, #4fc3f7, #29b6f6);
                   color: #fff;
                   text-decoration: none;
                   padding: 8px 14px;
                   border-radius: 20px;
                   font-size: 0.8rem;
                   font-weight: bold;
                   transition: all 0.3s ease;
                   box-shadow: 0 4px 15px rgba(79, 195, 247, 0.3);
                 "
                 onmouseover="this.style.transform = 'translateY(-2px)'; this.style.boxShadow = '0 6px 20px rgba(79, 195, 247, 0.4)';"
                 onmouseout="this.style.transform = 'translateY(0)'; this.style.boxShadow = '0 4px 15px rgba(79, 195, 247, 0.3)';">
                <span>⬇️</span> Скачать сборщик
              </a>
            </div>

            <!-- Вариант 2: Ручная подготовка -->
            <div class="instruction-card" style="
              background: rgba(255, 193, 7, 0.1);
              border-radius: 15px;
              padding: 18px;
              border: 1px solid rgba(255, 193, 7, 0.2);
            ">
              <h4 style="
                color: #ffc107;
                margin: 0 0 12px 0;
                font-size: 1rem;
                display: flex;
                align-items: center;
                gap: 8px;
              ">
                <span>📁</span> Ручная подготовка
              </h4>
              <p style="color: #ccc; margin: 0 0 15px 0; font-size: 0.85rem; line-height: 1.4;">
                Папка с MP3 + metadata.json
              </p>
              <button onclick="document.getElementById('manual-instructions').style.display = document.getElementById('manual-instructions').style.display === 'none' ? 'block' : 'none';"
                      style="
                        background: linear-gradient(45deg, #ffc107, #ff9800);
                        color: #fff;
                        border: none;
                        padding: 8px 14px;
                        border-radius: 20px;
                        font-size: 0.8rem;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
                      "
                      onmouseover="this.style.transform = 'translateY(-2px)'; this.style.boxShadow = '0 6px 20px rgba(255, 193, 7, 0.4)';"
                      onmouseout="this.style.transform = 'translateY(0)'; this.style.boxShadow = '0 4px 15px rgba(255, 193, 7, 0.3)';">
                📖 Подробнее
              </button>
            </div>
          </div>

          <!-- Детальная инструкция для ручной подготовки -->
          <div id="manual-instructions" style="
            display: none;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 15px;
            padding: 20px;
            margin-top: 15px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          ">
            <h5 style="color: #ffc107; margin: 0 0 15px 0; font-size: 1rem; font-weight: bold;">
              📁 Структура папки с музыкой:
            </h5>
            
            <div style="
              background: rgba(0, 0, 0, 0.4);
              border-radius: 10px;
              padding: 15px;
              margin: 0 0 15px 0;
              font-family: 'Courier New', monospace;
              font-size: 0.8rem;
              color: #4fc3f7;
              overflow-x: auto;
            ">
📁 Моя_музыка/
├── 📄 metadata.json
└── 📁 audio/
    ├── 🎵 track001.mp3
    ├── 🎵 track002.mp3
    └── 🎵 track003.mp3
            </div>

            <h6 style="color: #ffc107; margin: 0 0 10px 0; font-size: 0.9rem; font-weight: bold;">
              📄 Содержимое metadata.json:
            </h6>
            
            <div style="
              background: rgba(0, 0, 0, 0.4);
              border-radius: 10px;
              padding: 15px;
              margin: 0 0 15px 0;
              font-family: 'Courier New', monospace;
              font-size: 0.75rem;
              color: #a5d6a7;
              overflow-x: auto;
            ">
{
  "metadata": {
    "total_tracks": 3,
    "generated_at": "2024-01-15T12:00:00Z",
    "source": "Local Music Collection"
  },
  "tracks": [
    {
      "id": "track001",
      "title": "Название песни",
      "artist": "Исполнитель",
      "album": "Альбом",
      "duration": 180,
      "genre": "rock",
      "available": true
    },
    {
      "id": "track002",
      "title": "Another Song",
      "artist": "Artist Name",
      "album": "Album Name",
      "duration": 240,
      "genre": "pop",
      "available": true
    }
  ]
}
            </div>

            <h6 style="color: #ffc107; margin: 0 0 10px 0; font-size: 0.9rem; font-weight: bold;">
              ⚙️ Важные требования:
            </h6>
            
            <ul style="color: #ccc; font-size: 0.8rem; margin: 0; padding-left: 20px; line-height: 1.5;">
              <li><strong>ID треков</strong> в metadata.json должны совпадать с именами MP3 файлов</li>
              <li><strong>Поддерживаемые жанры:</strong> rock, pop, indie, metal, electronic, jazz, classical, hip-hop, rap, kpop, dance, rnb, alternative, punk, blues, country, folk, reggae, ambient, house, techno, trance, dubstep</li>
              <li><strong>Формат аудио:</strong> только MP3 файлы</li>
              <li><strong>Кодировка:</strong> metadata.json должен быть в UTF-8</li>
              <li><strong>Обязательные поля:</strong> id, title, artist, album, duration, genre, available</li>
            </ul>

            <div style="
              background: rgba(79, 195, 247, 0.1);
              border-radius: 10px;
              padding: 12px;
              margin-top: 15px;
              border: 1px solid rgba(79, 195, 247, 0.2);
            ">
              <p style="color: #4fc3f7; margin: 0; font-size: 0.8rem; font-weight: bold;">
                💡 Совет: Используйте автоматический сборщик для простоты!
              </p>
            </div>
          </div>

          <!-- Краткая инструкция по использованию сборщика -->
          <div style="
            background: rgba(79, 195, 247, 0.05);
            border-radius: 15px;
            padding: 15px;
            margin-top: 15px;
            border: 1px solid rgba(79, 195, 247, 0.1);
          ">
            <p style="color: #4fc3f7; margin: 0 0 10px 0; font-size: 0.9rem; font-weight: bold;">
              🔑 Использование сборщика:
            </p>
            <p style="color: #ccc; font-size: 0.8rem; margin: 0; line-height: 1.4;">
              1. Запустите exe → 2. Получите токен по ссылке → 3. Выберите папку → 4. Дождитесь скачивания
            </p>
          </div>
        </div>

        <!-- Особенности -->
        <div class="features-grid" style="
          display: flex;
          justify-content: center;
          gap: 40px;
          margin: 40px 0 60px 0;
          flex-wrap: wrap;
        ">
          <div class="feature-card" style="
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

          <div class="feature-card" style="
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

          <div class="feature-card" style="
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

      /* Адаптивные стили для мобильных устройств */
      @media (max-width: 768px) {
        #landing-page h1 {
          font-size: 2.5rem !important;
          margin-bottom: 15px !important;
        }
        
        #landing-page p {
          font-size: 1.2rem !important;
        }
        
        .instructions-grid {
          grid-template-columns: 1fr !important;
          gap: 15px !important;
        }
        
        .instruction-card {
          padding: 15px !important;
        }
        
        .features-grid {
          flex-direction: column !important;
          gap: 20px !important;
        }
        
        .feature-card {
          min-width: auto !important;
          max-width: 300px !important;
        }
        
        #create-galaxy-btn {
          padding: 15px 30px !important;
          font-size: 1.1rem !important;
        }
        
        .instructions-container {
          padding: 20px !important;
          margin: 20px 0 30px 0 !important;
        }
        
        pre {
          font-size: 0.7rem !important;
          padding: 10px !important;
        }
      }

      @media (max-width: 480px) {
        #landing-page h1 {
          font-size: 2rem !important;
        }
        
        #landing-page p {
          font-size: 1rem !important;
        }
        
        .instructions-container {
          padding: 15px !important;
        }
        
        .instruction-card {
          padding: 12px !important;
        }
        
        #create-galaxy-btn {
          padding: 12px 25px !important;
          font-size: 1rem !important;
        }
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