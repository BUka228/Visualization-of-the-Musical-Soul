/**
 * Бургер-меню для управления настройками и токенами
 */

import { TokenManager } from '../auth/TokenManager';
import { DataCollector, CollectionProgress } from '../data/DataCollector';
import { DataLoader } from '../data/DataLoader';

export class BurgerMenu {
  private isOpen = false;
  private collector?: DataCollector;

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
    const tokenInfo = TokenManager.getTokenInfo();
    
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

        <!-- Информация о токене -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #fff; margin: 0 0 15px 0; font-size: 18px;">🔑 Токен авторизации</h3>
          ${this.getTokenStatusHTML(tokenInfo)}
        </div>

        <!-- Управление данными -->
        <div style="margin-bottom: 30px;">
          <h3 style="color: #fff; margin: 0 0 15px 0; font-size: 18px;">📊 Данные</h3>
          <div id="data-status-section">
            ${this.getDataStatusHTML()}
          </div>
        </div>

        <!-- Прогресс загрузки -->
        <div id="menu-progress-section" style="display: none; margin-bottom: 30px;">
          <div style="background: rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 15px;">
            <div id="menu-progress-message" style="color: #fff; margin-bottom: 10px; font-size: 14px;"></div>
            <div style="background: rgba(255, 255, 255, 0.2); border-radius: 10px; height: 8px; overflow: hidden;">
              <div id="menu-progress-bar" style="
                background: linear-gradient(90deg, #4fc3f7, #29b6f6);
                height: 100%;
                width: 0%;
                transition: width 0.3s ease;
                border-radius: 10px;
              "></div>
            </div>
            <div id="menu-progress-details" style="color: #ccc; margin-top: 8px; font-size: 12px;"></div>
          </div>
        </div>

        <!-- Инструкции -->
        <div style="margin-bottom: 30px;">
          <details>
            <summary style="color: #4fc3f7; cursor: pointer; font-weight: bold; margin-bottom: 10px;">
              📋 Инструкции по получению токена
            </summary>
            <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 6px; margin-top: 10px;">
              <ol style="color: #ccc; line-height: 1.6; margin: 0; padding-left: 20px; font-size: 14px;">
                <li>Откройте <a href="https://music.yandex.ru" target="_blank" style="color: #4fc3f7;">music.yandex.ru</a></li>
                <li>Войдите в свой аккаунт Яндекс</li>
                <li>Откройте DevTools (F12)</li>
                <li>Перейдите: Application → Cookies</li>
                <li>Найдите cookie 'Session_id'</li>
                <li>Скопируйте его значение</li>
              </ol>
              <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                ⚠️ Токен действует ограниченное время и требует периодического обновления
              </p>
            </div>
          </details>
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
                Интерактивная 3D-визуализация музыкальных предпочтений из Яндекс.Музыки.
              </p>
              <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                Версия: 1.0.0<br>
                Использует неофициальное API Яндекс.Музыки
              </p>
            </div>
          </details>
        </div>
      </div>
    `;
  }

  /**
   * Генерирует HTML статуса токена
   */
  private getTokenStatusHTML(tokenInfo: any): string {
    if (!tokenInfo.hasToken) {
      return `
        <div style="background: rgba(255, 193, 7, 0.2); border: 1px solid rgba(255, 193, 7, 0.5); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
          <p style="color: #ffc107; margin: 0 0 10px 0; font-weight: bold;">⚠️ Токен не настроен</p>
          <p style="color: #ccc; margin: 0; font-size: 14px;">Для загрузки данных необходимо добавить токен</p>
        </div>
        <button id="add-token-btn" style="
          background: linear-gradient(90deg, #4fc3f7, #29b6f6);
          color: #fff;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          width: 100%;
        ">
          ➕ Добавить токен
        </button>
      `;
    }

    if (!tokenInfo.isValid) {
      return `
        <div style="background: rgba(244, 67, 54, 0.2); border: 1px solid rgba(244, 67, 54, 0.5); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
          <p style="color: #f44336; margin: 0 0 10px 0; font-weight: bold;">❌ Токен недействителен</p>
          <p style="color: #ccc; margin: 0; font-size: 14px;">${tokenInfo.error}</p>
        </div>
        <button id="update-token-btn" style="
          background: rgba(244, 67, 54, 0.8);
          color: #fff;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          width: 100%;
        ">
          🔄 Обновить токен
        </button>
      `;
    }

    const formattedToken = TokenManager.formatTokenForDisplay(TokenManager.getToken()?.token || '');
    return `
      <div style="background: rgba(76, 175, 80, 0.2); border: 1px solid rgba(76, 175, 80, 0.5); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
        <p style="color: #4caf50; margin: 0 0 10px 0; font-weight: bold;">✅ Токен действителен</p>
        <div style="color: #ccc; font-size: 14px;">
          <p style="margin: 0;">Токен: ${formattedToken}</p>
          <p style="margin: 5px 0 0 0;">Создан: ${tokenInfo.createdAt?.toLocaleString('ru')}</p>
          <p style="margin: 5px 0 0 0;">Возраст: ${tokenInfo.ageHours?.toFixed(1)} ч.</p>
        </div>
      </div>
      <div style="display: flex; gap: 10px;">
        <button id="update-token-btn" style="
          background: rgba(255, 255, 255, 0.1);
          color: #ccc;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          flex: 1;
        ">
          🔄 Обновить
        </button>
        <button id="clear-token-btn" style="
          background: rgba(244, 67, 54, 0.8);
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          flex: 1;
        ">
          🗑️ Удалить
        </button>
      </div>
    `;
  }

  /**
   * Генерирует HTML статуса данных
   */
  private getDataStatusHTML(): string {
    // Эта функция будет обновляться асинхронно
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

    // Обработчики кнопок токена (будут добавлены динамически)
    this.setupTokenEventListeners();

    // Загружаем статус данных
    this.loadDataStatus();
  }

  /**
   * Настраивает обработчики для кнопок токена
   */
  private setupTokenEventListeners(): void {
    // Используем делегирование событий
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      if (target.id === 'add-token-btn' || target.id === 'update-token-btn') {
        this.showTokenInput();
      } else if (target.id === 'clear-token-btn') {
        this.clearToken();
      } else if (target.id === 'save-token-menu-btn') {
        this.saveTokenFromMenu();
      } else if (target.id === 'cancel-token-btn') {
        this.cancelTokenInput();
      } else if (target.id === 'refresh-data-btn') {
        this.refreshData();
      }
    });
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
   * Показывает поле ввода токена
   */
  private showTokenInput(): void {
    const tokenSection = document.querySelector('#burger-menu-panel h3:first-of-type')?.nextElementSibling;
    if (tokenSection) {
      tokenSection.innerHTML = `
        <div style="margin-bottom: 15px;">
          <label style="color: #fff; display: block; margin-bottom: 8px; font-size: 14px;">
            Новый токен Session_id:
          </label>
          <textarea 
            id="token-menu-input" 
            placeholder="Вставьте токен Session_id"
            style="
              width: 100%;
              height: 80px;
              padding: 10px;
              border: 1px solid rgba(255, 255, 255, 0.3);
              border-radius: 6px;
              background: rgba(255, 255, 255, 0.1);
              color: #fff;
              font-size: 12px;
              resize: vertical;
              box-sizing: border-box;
              font-family: monospace;
            "
          ></textarea>
        </div>
        <div style="display: flex; gap: 10px;">
          <button id="save-token-menu-btn" style="
            background: linear-gradient(90deg, #4fc3f7, #29b6f6);
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            flex: 1;
          ">
            💾 Сохранить
          </button>
          <button id="cancel-token-btn" style="
            background: rgba(255, 255, 255, 0.1);
            color: #ccc;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            flex: 1;
          ">
            Отмена
          </button>
        </div>
      `;

      // Фокус на поле ввода
      const input = document.getElementById('token-menu-input') as HTMLTextAreaElement;
      if (input) {
        input.focus();
      }
    }
  }

  /**
   * Сохраняет токен из меню
   */
  private saveTokenFromMenu(): void {
    const input = document.getElementById('token-menu-input') as HTMLTextAreaElement;
    if (!input) return;

    const token = input.value.trim();
    if (!token) {
      this.showMenuNotification('Введите токен', 'error');
      return;
    }

    if (token.length < 10) {
      this.showMenuNotification('Токен слишком короткий', 'error');
      return;
    }

    try {
      TokenManager.saveToken(token);
      this.showMenuNotification('Токен сохранен!', 'success');
      this.updateMenuContent();
    } catch (error) {
      this.showMenuNotification('Ошибка сохранения токена', 'error');
    }
  }

  /**
   * Отменяет ввод токена
   */
  private cancelTokenInput(): void {
    this.updateMenuContent();
  }

  /**
   * Очищает токен
   */
  private clearToken(): void {
    if (confirm('Удалить сохраненный токен?')) {
      TokenManager.clearToken();
      this.showMenuNotification('Токен удален', 'success');
      this.updateMenuContent();
    }
  }

  /**
   * Загружает статус данных
   */
  private async loadDataStatus(): Promise<void> {
    const statusContent = document.getElementById('data-status-content');
    if (!statusContent) return;

    try {
      const dataExists = await DataLoader.checkDataFileExists();
      const stats = await DataLoader.getDataStatistics();

      if (!dataExists || !stats) {
        statusContent.innerHTML = `
          <div style="background: rgba(255, 193, 7, 0.2); border: 1px solid rgba(255, 193, 7, 0.5); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
            <p style="color: #ffc107; margin: 0 0 10px 0; font-weight: bold;">⚠️ Данные отсутствуют</p>
            <p style="color: #ccc; margin: 0; font-size: 14px;">Необходимо загрузить данные из Яндекс.Музыки</p>
          </div>
          <button id="refresh-data-btn" style="
            background: linear-gradient(90deg, #4fc3f7, #29b6f6);
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            width: 100%;
          ">
            📥 Загрузить данные
          </button>
        `;
        return;
      }

      const lastUpdate = new Date(stats.lastUpdate);
      const ageHours = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
      const isStale = ageHours > 24;

      statusContent.innerHTML = `
        <div style="background: rgba(${isStale ? '255, 193, 7' : '76, 175, 80'}, 0.2); border: 1px solid rgba(${isStale ? '255, 193, 7' : '76, 175, 80'}, 0.5); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
          <p style="color: ${isStale ? '#ffc107' : '#4caf50'}; margin: 0 0 10px 0; font-weight: bold;">
            ${isStale ? '⚠️ Данные устарели' : '✅ Данные актуальны'}
          </p>
          <div style="color: #ccc; font-size: 14px;">
            <p style="margin: 0;">Треков: ${stats.totalTracks}</p>
            <p style="margin: 5px 0 0 0;">Обновлено: ${lastUpdate.toLocaleString('ru')}</p>
            <p style="margin: 5px 0 0 0;">Возраст: ${ageHours.toFixed(1)} ч.</p>
            <p style="margin: 5px 0 0 0;">Источник: ${stats.isDemo ? 'Демо-данные' : 'Яндекс.Музыка'}</p>
          </div>
        </div>
        <button id="refresh-data-btn" style="
          background: ${isStale ? 'rgba(255, 193, 7, 0.8)' : 'rgba(255, 255, 255, 0.1)'};
          color: ${isStale ? '#fff' : '#ccc'};
          border: ${isStale ? 'none' : '1px solid rgba(255, 255, 255, 0.3)'};
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          width: 100%;
        ">
          🔄 ${isStale ? 'Обновить данные' : 'Обновить данные'}
        </button>
      `;
    } catch (error) {
      statusContent.innerHTML = `
        <div style="background: rgba(244, 67, 54, 0.2); border: 1px solid rgba(244, 67, 54, 0.5); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
          <p style="color: #f44336; margin: 0 0 10px 0; font-weight: bold;">❌ Ошибка загрузки статуса</p>
          <p style="color: #ccc; margin: 0; font-size: 14px;">Не удалось получить информацию о данных</p>
        </div>
      `;
    }
  }

  /**
   * Обновляет данные
   */
  private async refreshData(): Promise<void> {
    const tokenData = TokenManager.getToken();
    if (!tokenData || !TokenManager.hasValidToken()) {
      this.showMenuNotification('Сначала настройте действительный токен', 'error');
      return;
    }

    // Показываем прогресс
    const progressSection = document.getElementById('menu-progress-section');
    const refreshBtn = document.getElementById('refresh-data-btn');
    
    if (progressSection) progressSection.style.display = 'block';
    if (refreshBtn) refreshBtn.style.display = 'none';

    // Создаем коллектор
    this.collector = new DataCollector((progress) => this.updateMenuProgress(progress));

    try {
      const result = await this.collector.collectData(tokenData.token);
      
      if (result.success) {
        this.showMenuNotification(`Данные обновлены! Загружено ${result.tracksCollected} треков`, 'success');
        
        // Перезагружаем страницу для применения новых данных
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        this.showMenuNotification(`Ошибка обновления: ${result.error}`, 'error');
      }
    } catch (error) {
      this.showMenuNotification('Ошибка обновления данных', 'error');
    } finally {
      if (progressSection) progressSection.style.display = 'none';
      if (refreshBtn) refreshBtn.style.display = 'block';
    }
  }

  /**
   * Обновляет прогресс в меню
   */
  private updateMenuProgress(progress: CollectionProgress): void {
    const messageEl = document.getElementById('menu-progress-message');
    const barEl = document.getElementById('menu-progress-bar');
    const detailsEl = document.getElementById('menu-progress-details');

    if (messageEl) messageEl.textContent = progress.message;
    if (barEl) barEl.style.width = `${progress.progress}%`;
    
    if (detailsEl && progress.totalTracks) {
      const processed = progress.processedTracks || 0;
      detailsEl.textContent = `${processed}/${progress.totalTracks} треков`;
    }
  }

  /**
   * Показывает уведомление в меню
   */
  private showMenuNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const colors = {
      success: { bg: 'rgba(76, 175, 80, 0.9)', text: '#fff' },
      error: { bg: 'rgba(244, 67, 54, 0.9)', text: '#fff' },
      info: { bg: 'rgba(33, 150, 243, 0.9)', text: '#fff' }
    };

    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type].bg};
      color: ${colors[type].text};
      padding: 12px 16px;
      border-radius: 6px;
      z-index: 10001;
      font-size: 14px;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, type === 'success' ? 3000 : 4000);
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

    if (this.collector) {
      this.collector.abort();
    }
  }
}