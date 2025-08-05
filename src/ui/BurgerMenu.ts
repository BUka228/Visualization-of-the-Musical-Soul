/**
 * Бургер-меню для управления настройками (упрощенная версия для локальных файлов)
 */

import { DataLoader } from '../data/DataLoader';

export class BurgerMenu {
  private isOpen = false;

  /**
   * Инициализирует бургер-меню
   */
  initialize(): void {
    this.createMenuButton();
    this.createMenuPanel();
    this.setupEventListeners();
  }

  /**
   * Создает кнопку бургер-меню
   */
  private createMenuButton(): void {
    const button = document.createElement('button');
    button.id = 'burger-menu-btn';
    button.innerHTML = '☰';
    button.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      width: 50px;
      height: 50px;
      background: rgba(0, 0, 0, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      color: white;
      font-size: 20px;
      cursor: pointer;
      z-index: 1000;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(0, 0, 0, 0.9)';
      button.style.borderColor = 'rgba(255, 255, 255, 0.5)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(0, 0, 0, 0.8)';
      button.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    });

    document.body.appendChild(button);
  }

  /**
   * Создает панель меню
   */
  private createMenuPanel(): void {
    const panel = document.createElement('div');
    panel.id = 'burger-menu-panel';
    panel.style.cssText = `
      position: fixed;
      top: 0;
      left: -350px;
      width: 350px;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      border-right: 1px solid rgba(255, 255, 255, 0.2);
      z-index: 999;
      transition: left 0.3s ease;
      overflow-y: auto;
      font-family: 'Arial', sans-serif;
    `;

    panel.innerHTML = this.getMenuHTML();
    document.body.appendChild(panel);

    // Создаем overlay для закрытия меню
    const overlay = document.createElement('div');
    overlay.id = 'burger-menu-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 998;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    `;

    document.body.appendChild(overlay);
  }

  /**
   * Генерирует HTML меню
   */
  private getMenuHTML(): string {
    return `
      <div style="padding: 20px;">
        <!-- Заголовок -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">
          <h2 style="color: #4fc3f7; margin: 0; font-size: 24px;">⚙️ Настройки</h2>
          <button id="close-menu-btn" style="
            background: none;
            border: none;
            color: #ccc;
            font-size: 24px;
            cursor: pointer;
            padding: 5px;
          ">×</button>
        </div>

        <!-- Информация о данных -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #fff; margin: 0 0 15px 0; font-size: 18px;">📁 Локальные данные</h3>
          <div id="data-status-section">
            ${this.getDataStatusHTML()}
          </div>
        </div>

        <!-- Инструкции -->
        <div style="margin-bottom: 30px;">
          <details>
            <summary style="color: #4fc3f7; cursor: pointer; font-weight: bold; margin-bottom: 10px;">
              📋 Как подготовить файлы
            </summary>
            <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 6px; margin-top: 10px;">
              <p style="color: #ccc; line-height: 1.6; margin: 0 0 10px 0; font-size: 14px;">
                Создайте папку со следующей структурой:
              </p>
              <div style="background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #a0a0a0; margin: 10px 0;">
📁 Моя музыка/<br>
├── 📄 metadata.json<br>
└── 📁 audio/<br>
&nbsp;&nbsp;&nbsp;&nbsp;├── 🎵 track1.mp3<br>
&nbsp;&nbsp;&nbsp;&nbsp;└── 🎵 track2.mp3
              </div>
              <ul style="color: #ccc; line-height: 1.6; margin: 10px 0 0 20px; font-size: 14px;">
                <li>metadata.json - информация о треках</li>
                <li>audio/ - папка с MP3 файлами</li>
                <li>Имена файлов = ID в metadata.json</li>
              </ul>
            </div>
          </details>
        </div>

        <!-- Управление -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #fff; margin: 0 0 15px 0; font-size: 18px;">🎮 Управление</h3>
          <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 6px;">
            <div style="color: #ccc; font-size: 14px; line-height: 1.6;">
              <p style="margin: 0 0 8px 0;"><strong>R</strong> - Сброс камеры</p>
              <p style="margin: 0 0 8px 0;"><strong>Пробел</strong> - Пауза анимации</p>
              <p style="margin: 0 0 8px 0;"><strong>Клик по треку</strong> - Воспроизведение</p>
              <p style="margin: 0;"><strong>Колесо мыши</strong> - Приближение</p>
            </div>
          </div>
        </div>

        <!-- О приложении -->
        <div style="margin-bottom: 20px;">
          <details>
            <summary style="color: #4fc3f7; cursor: pointer; font-weight: bold; margin-bottom: 10px;">
              ℹ️ О приложении
            </summary>
            <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 6px; margin-top: 10px;">
              <p style="color: #ccc; line-height: 1.6; margin: 0; font-size: 14px;">
                <strong>Music Galaxy 3D</strong><br>
                Интерактивная 3D-визуализация музыкальной коллекции.
              </p>
              <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                Версия: 2.0.0 (Локальные файлы)<br>
                Работает полностью в браузере
              </p>
            </div>
          </details>
        </div>
      </div>
    `;
  }

  /**
   * Генерирует HTML статуса данных
   */
  private getDataStatusHTML(): string {
    return `
      <div id="data-status-content">
        <div style="color: #ccc; text-align: center; padding: 20px;">
          Загрузка информации о данных...
        </div>
      </div>
    `;
  }

  /**
   * Настраивает обработчики событий
   */
  private setupEventListeners(): void {
    // Открытие/закрытие меню
    const menuBtn = document.getElementById('burger-menu-btn');
    const closeBtn = document.getElementById('close-menu-btn');
    const overlay = document.getElementById('burger-menu-overlay');

    if (menuBtn) {
      menuBtn.addEventListener('click', () => this.toggleMenu());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeMenu());
    }

    if (overlay) {
      overlay.addEventListener('click', () => this.closeMenu());
    }

    // Загружаем статус данных
    this.loadDataStatus();
  }

  /**
   * Переключает состояние меню
   */
  private toggleMenu(): void {
    if (this.isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  /**
   * Открывает меню
   */
  private openMenu(): void {
    const panel = document.getElementById('burger-menu-panel');
    const overlay = document.getElementById('burger-menu-overlay');

    if (panel && overlay) {
      panel.style.left = '0';
      overlay.style.opacity = '1';
      overlay.style.visibility = 'visible';
      this.isOpen = true;

      // Обновляем содержимое при открытии
      this.updateMenuContent();
    }
  }

  /**
   * Закрывает меню
   */
  private closeMenu(): void {
    const panel = document.getElementById('burger-menu-panel');
    const overlay = document.getElementById('burger-menu-overlay');

    if (panel && overlay) {
      panel.style.left = '-350px';
      overlay.style.opacity = '0';
      overlay.style.visibility = 'hidden';
      this.isOpen = false;
    }
  }

  /**
   * Обновляет содержимое меню
   */
  private updateMenuContent(): void {
    const panel = document.getElementById('burger-menu-panel');
    if (panel) {
      panel.innerHTML = this.getMenuHTML();
      this.loadDataStatus();
    }
  }

  /**
   * Загружает статус данных
   */
  private async loadDataStatus(): Promise<void> {
    const statusContent = document.getElementById('data-status-content');
    if (!statusContent) return;

    try {
      // Проверяем наличие локальных данных
      const localStats = await DataLoader.getLocalDataStatistics();
      
      if (localStats) {
        const totalDurationMinutes = Math.round(localStats.totalDuration / 60);
        const avgDurationMinutes = Math.round(localStats.averageDuration / 60);
        
        statusContent.innerHTML = `
          <div style="background: rgba(76, 175, 80, 0.2); border: 1px solid rgba(76, 175, 80, 0.5); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
            <p style="color: #4caf50; margin: 0 0 10px 0; font-weight: bold;">✅ Локальные данные загружены</p>
            <div style="color: #ccc; font-size: 14px;">
              <p style="margin: 0;">Всего треков: ${localStats.totalTracks}</p>
              <p style="margin: 5px 0 0 0;">Доступно: ${localStats.availableTracks}</p>
              <p style="margin: 5px 0 0 0;">Общая длительность: ${totalDurationMinutes} мин</p>
              <p style="margin: 5px 0 0 0;">Средняя длительность: ${avgDurationMinutes} мин</p>
            </div>
          </div>
          
          <!-- Статистика по жанрам -->
          <div style="background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 15px;">
            <h4 style="color: #4fc3f7; margin: 0 0 10px 0; font-size: 16px;">🎨 Жанры</h4>
            <div style="max-height: 150px; overflow-y: auto;">
              ${this.getGenreStatsHTML(localStats.genres)}
            </div>
          </div>
        `;
      } else {
        // Fallback к старым данным или демо-данным
        const stats = await DataLoader.getDataStatistics();
        
        if (stats) {
          statusContent.innerHTML = `
            <div style="background: rgba(255, 193, 7, 0.2); border: 1px solid rgba(255, 193, 7, 0.5); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
              <p style="color: #ffc107; margin: 0 0 10px 0; font-weight: bold;">⚠️ Используются демо-данные</p>
              <div style="color: #ccc; font-size: 14px;">
                <p style="margin: 0;">Треков: ${stats.totalTracks}</p>
                <p style="margin: 5px 0 0 0;">Источник: ${stats.isDemo ? 'Демо' : 'Кэш'}</p>
              </div>
            </div>
            <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 6px;">
              <p style="color: #ccc; font-size: 14px; margin: 0; line-height: 1.6;">
                💡 Для полной функциональности выберите папку с вашей музыкальной коллекцией на лендинг-странице.
              </p>
            </div>
          `;
        } else {
          statusContent.innerHTML = `
            <div style="background: rgba(244, 67, 54, 0.2); border: 1px solid rgba(244, 67, 54, 0.5); border-radius: 8px; padding: 15px;">
              <p style="color: #f44336; margin: 0 0 10px 0; font-weight: bold;">❌ Данные не найдены</p>
              <p style="color: #ccc; margin: 0; font-size: 14px;">Выберите папку с музыкой на главной странице</p>
            </div>
          `;
        }
      }
    } catch (error) {
      statusContent.innerHTML = `
        <div style="background: rgba(244, 67, 54, 0.2); border: 1px solid rgba(244, 67, 54, 0.5); border-radius: 8px; padding: 15px;">
          <p style="color: #f44336; margin: 0 0 10px 0; font-weight: bold;">❌ Ошибка загрузки</p>
          <p style="color: #ccc; margin: 0; font-size: 14px;">Не удалось получить информацию о данных</p>
        </div>
      `;
    }
  }

  /**
   * Генерирует HTML статистики по жанрам
   */
  private getGenreStatsHTML(genres: { [genre: string]: number }): string {
    const sortedGenres = Object.entries(genres)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10); // Показываем топ-10 жанров

    if (sortedGenres.length === 0) {
      return '<p style="color: #999; margin: 0; font-size: 14px;">Нет данных о жанрах</p>';
    }

    return sortedGenres.map(([genre, count]) => `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
        <span style="color: #ccc; font-size: 14px;">${genre}</span>
        <span style="color: #4fc3f7; font-size: 14px; font-weight: bold;">${count}</span>
      </div>
    `).join('');
  }

  /**
   * Уничтожает меню
   */
  dispose(): void {
    const elements = [
      'burger-menu-btn',
      'burger-menu-panel', 
      'burger-menu-overlay'
    ];

    elements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.remove();
      }
    });
  }
}