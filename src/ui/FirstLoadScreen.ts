/**
 * Экран первой загрузки с настройкой токена
 */

import { TokenManager } from '../auth/TokenManager';
import { DataCollector, CollectionProgress, CollectionResult } from '../data/DataCollector';
import { DataLoader } from '../data/DataLoader';

export class FirstLoadScreen {
  private container: HTMLElement;
  private collector?: DataCollector;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Показывает экран первой загрузки
   */
  async show(): Promise<boolean> {
    // Проверяем, есть ли уже данные
    const hasData = await this.checkExistingData();
    
    if (hasData.hasValidData && !hasData.needsUpdate) {
      return false; // Данные есть, экран не нужен
    }

    this.render(hasData);
    return true;
  }

  /**
   * Скрывает экран первой загрузки
   */
  hide(): void {
    const screen = document.getElementById('first-load-screen');
    if (screen) {
      screen.remove();
    }
  }

  /**
   * Проверяет существующие данные
   */
  private async checkExistingData(): Promise<{
    hasValidData: boolean;
    needsUpdate: boolean;
    dataAge?: number;
    tracksCount?: number;
    hasToken: boolean;
    tokenValid: boolean;
  }> {
    try {
      const dataExists = await DataLoader.checkDataFileExists();
      const tokenInfo = TokenManager.getTokenInfo();
      
      if (!dataExists) {
        return {
          hasValidData: false,
          needsUpdate: true,
          hasToken: tokenInfo.hasToken,
          tokenValid: tokenInfo.isValid
        };
      }

      const dataResult = await DataLoader.loadMusicDataWithResult();
      const isFresh = await DataLoader.checkDataFreshness();
      
      if (dataResult.success && dataResult.data) {
        const ageHours = dataResult.data.metadata.generated_at ? 
          (Date.now() - new Date(dataResult.data.metadata.generated_at).getTime()) / (1000 * 60 * 60) : 
          999;

        return {
          hasValidData: true,
          needsUpdate: !isFresh || ageHours > 24,
          dataAge: Math.round(ageHours * 100) / 100,
          tracksCount: dataResult.data.tracks.length,
          hasToken: tokenInfo.hasToken,
          tokenValid: tokenInfo.isValid
        };
      }

      return {
        hasValidData: false,
        needsUpdate: true,
        hasToken: tokenInfo.hasToken,
        tokenValid: tokenInfo.isValid
      };
    } catch (error) {
      console.error('Ошибка проверки данных:', error);
      return {
        hasValidData: false,
        needsUpdate: true,
        hasToken: false,
        tokenValid: false
      };
    }
  }

  /**
   * Отрисовывает экран
   */
  private render(dataStatus: any): void {
    const screen = document.createElement('div');
    screen.id = 'first-load-screen';
    screen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      font-family: 'Arial', sans-serif;
    `;

    screen.innerHTML = this.getScreenHTML(dataStatus);
    document.body.appendChild(screen);

    this.setupEventListeners();
  }

  /**
   * Генерирует HTML для экрана
   */
  private getScreenHTML(dataStatus: any): string {
    const title = dataStatus.hasValidData ? 
      '🔄 Обновление данных' : 
      '🎵 Добро пожаловать в Music Galaxy 3D';

    const subtitle = dataStatus.hasValidData ?
      `Данные устарели (${dataStatus.dataAge?.toFixed(1)} ч. назад). Рекомендуется обновление.` :
      'Для начала работы необходимо загрузить данные из Яндекс.Музыки';

    const tokenSection = this.getTokenSectionHTML(dataStatus);
    const actionSection = this.getActionSectionHTML(dataStatus);

    return `
      <div style="
        background: rgba(0, 0, 0, 0.9);
        border-radius: 16px;
        padding: 40px;
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      ">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4fc3f7; margin: 0 0 10px 0; font-size: 28px;">
            ${title}
          </h1>
          <p style="color: #ccc; margin: 0; font-size: 16px; line-height: 1.5;">
            ${subtitle}
          </p>
        </div>

        ${tokenSection}
        ${actionSection}

        <div id="progress-section" style="display: none; margin-top: 30px;">
          <div style="background: rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 20px;">
            <div id="progress-message" style="color: #fff; margin-bottom: 15px; font-size: 16px;"></div>
            <div style="background: rgba(255, 255, 255, 0.2); border-radius: 10px; height: 20px; overflow: hidden;">
              <div id="progress-bar" style="
                background: linear-gradient(90deg, #4fc3f7, #29b6f6);
                height: 100%;
                width: 0%;
                transition: width 0.3s ease;
                border-radius: 10px;
              "></div>
            </div>
            <div id="progress-details" style="color: #ccc; margin-top: 10px; font-size: 14px;"></div>
          </div>
        </div>

        <div id="result-section" style="display: none; margin-top: 30px;">
          <div id="result-content"></div>
        </div>

        ${dataStatus.hasValidData ? this.getSkipSectionHTML() : ''}
      </div>
    `;
  }

  /**
   * Генерирует секцию токена
   */
  private getTokenSectionHTML(dataStatus: any): string {
    const tokenInfo = TokenManager.getTokenInfo();
    const isElectron = typeof window !== 'undefined' && (window as any).electronAPI !== undefined;
    
    if (tokenInfo.hasToken && tokenInfo.isValid) {
      const formattedToken = TokenManager.formatTokenForDisplay(TokenManager.getToken()?.token || '');
      return `
        <div style="margin-bottom: 30px;">
          <div style="background: rgba(76, 175, 80, 0.2); border: 1px solid rgba(76, 175, 80, 0.5); border-radius: 8px; padding: 15px;">
            <h3 style="color: #4caf50; margin: 0 0 10px 0; font-size: 18px;">✅ Токен настроен</h3>
            <p style="color: #ccc; margin: 0; font-size: 14px;">
              Токен: ${formattedToken}<br>
              Создан: ${tokenInfo.createdAt?.toLocaleString('ru')}<br>
              Возраст: ${tokenInfo.ageHours?.toFixed(1)} часов
            </p>
            <button id="change-token-btn" style="
              background: transparent;
              border: 1px solid rgba(255, 255, 255, 0.3);
              color: #ccc;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              margin-top: 10px;
              font-size: 12px;
            ">
              Изменить токен
            </button>
          </div>
        </div>
      `;
    }

    // Для Electron показываем кнопку авторизации
    if (isElectron) {
      return `
        <div style="margin-bottom: 30px;">
          <div style="background: rgba(255, 193, 7, 0.2); border: 1px solid rgba(255, 193, 7, 0.5); border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <h3 style="color: #ffc107; margin: 0 0 10px 0; font-size: 18px;">🔑 Авторизация</h3>
            <p style="color: #ccc; margin: 0; font-size: 14px; line-height: 1.5;">
              ${tokenInfo.hasToken ? 
                `Токен недействителен: ${tokenInfo.error}` : 
                'Для загрузки данных необходимо войти в Яндекс.Музыку'
              }
            </p>
          </div>

          <div style="text-align: center; margin-bottom: 20px;">
            <button 
              id="electron-auth-btn"
              style="
                background: linear-gradient(90deg, #ff6b35, #f7931e);
                color: #fff;
                border: none;
                padding: 15px 30px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-bottom: 15px;
              "
            >
              🎵 Войти через Яндекс.Музыку
            </button>
          </div>

          <details style="margin-bottom: 20px;">
            <summary style="color: #4fc3f7; cursor: pointer; font-weight: bold; margin-bottom: 10px;">
              💡 Как это работает?
            </summary>
            <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 6px; margin-top: 10px;">
              <p style="color: #ccc; line-height: 1.6; margin: 0;">
                При нажатии кнопки откроется окно Яндекс.Музыки. Войдите в свой аккаунт, 
                и токен авторизации будет автоматически сохранен в приложении.
              </p>
            </div>
          </details>

          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
            <button 
              id="manual-token-btn"
              style="
                background: transparent;
                color: #ccc;
                border: 1px solid rgba(255, 255, 255, 0.3);
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
              "
            >
              Ввести токен вручную
            </button>
          </div>

          <div id="manual-token-section" style="display: none; margin-top: 20px;">
            <div style="margin-bottom: 15px;">
              <label style="color: #fff; display: block; margin-bottom: 8px; font-weight: bold;">
                Токен Session_id:
              </label>
              <input 
                type="text" 
                id="token-input" 
                placeholder="Вставьте токен Session_id из cookies"
                style="
                  width: 100%;
                  padding: 12px;
                  border: 1px solid rgba(255, 255, 255, 0.3);
                  border-radius: 6px;
                  background: rgba(255, 255, 255, 0.1);
                  color: #fff;
                  font-size: 14px;
                  box-sizing: border-box;
                "
              />
            </div>
          </div>
        </div>
      `;
    }

    // Для браузера показываем обычный ввод токена
    return `
      <div style="margin-bottom: 30px;">
        <div style="background: rgba(255, 193, 7, 0.2); border: 1px solid rgba(255, 193, 7, 0.5); border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <h3 style="color: #ffc107; margin: 0 0 10px 0; font-size: 18px;">🔑 Настройка токена</h3>
          <p style="color: #ccc; margin: 0; font-size: 14px; line-height: 1.5;">
            ${tokenInfo.hasToken ? 
              `Токен недействителен: ${tokenInfo.error}` : 
              'Для загрузки данных необходим токен Яндекс.Музыки'
            }
          </p>
        </div>

        <div id="token-input-section">
          <div style="margin-bottom: 15px;">
            <label style="color: #fff; display: block; margin-bottom: 8px; font-weight: bold;">
              Токен Session_id:
            </label>
            <input 
              type="text" 
              id="token-input" 
              placeholder="Вставьте токен Session_id из cookies"
              style="
                width: 100%;
                padding: 12px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 6px;
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
                font-size: 14px;
                box-sizing: border-box;
              "
            />
          </div>
          
          <details style="margin-bottom: 20px;">
            <summary style="color: #4fc3f7; cursor: pointer; font-weight: bold; margin-bottom: 10px;">
              📋 Как получить токен?
            </summary>
            <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 6px; margin-top: 10px;">
              <ol style="color: #ccc; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>Откройте <a href="https://music.yandex.ru" target="_blank" style="color: #4fc3f7;">music.yandex.ru</a></li>
                <li>Войдите в свой аккаунт</li>
                <li>Откройте DevTools (F12)</li>
                <li>Перейдите: Application → Cookies</li>
                <li>Найдите cookie 'Session_id'</li>
                <li>Скопируйте его значение</li>
              </ol>
            </div>
          </details>
        </div>
      </div>
    `;
  }

  /**
   * Генерирует секцию действий
   */
  private getActionSectionHTML(dataStatus: any): string {
    const tokenInfo = TokenManager.getTokenInfo();
    const canCollect = tokenInfo.hasToken && tokenInfo.isValid;

    return `
      <div style="text-align: center;">
        <button 
          id="collect-data-btn" 
          ${canCollect ? '' : 'disabled'}
          style="
            background: ${canCollect ? 'linear-gradient(90deg, #4fc3f7, #29b6f6)' : 'rgba(255, 255, 255, 0.1)'};
            color: ${canCollect ? '#fff' : '#666'};
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: ${canCollect ? 'pointer' : 'not-allowed'};
            transition: all 0.3s ease;
            margin-right: 10px;
          "
        >
          ${dataStatus.hasValidData ? '🔄 Обновить данные' : '📥 Загрузить данные'}
        </button>

        ${!canCollect ? `
          <button 
            id="save-token-btn"
            style="
              background: rgba(76, 175, 80, 0.8);
              color: #fff;
              border: none;
              padding: 15px 30px;
              border-radius: 8px;
              font-size: 16px;
              font-weight: bold;
              cursor: pointer;
              transition: all 0.3s ease;
            "
          >
            💾 Сохранить токен
          </button>
        ` : ''}
      </div>
    `;
  }

  /**
   * Генерирует секцию пропуска (если есть старые данные)
   */
  private getSkipSectionHTML(): string {
    return `
      <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
        <button 
          id="skip-btn"
          style="
            background: transparent;
            color: #ccc;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
          "
        >
          Пропустить и использовать существующие данные
        </button>
      </div>
    `;
  }

  /**
   * Настраивает обработчики событий
   */
  private setupEventListeners(): void {
    // Сохранение токена
    const saveTokenBtn = document.getElementById('save-token-btn');
    if (saveTokenBtn) {
      saveTokenBtn.addEventListener('click', () => this.handleSaveToken());
    }

    // Изменение токена
    const changeTokenBtn = document.getElementById('change-token-btn');
    if (changeTokenBtn) {
      changeTokenBtn.addEventListener('click', () => this.handleChangeToken());
    }

    // Сбор данных
    const collectBtn = document.getElementById('collect-data-btn');
    if (collectBtn) {
      collectBtn.addEventListener('click', () => this.handleCollectData());
    }

    // Пропуск
    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.handleSkip());
    }

    // Electron авторизация
    const electronAuthBtn = document.getElementById('electron-auth-btn');
    if (electronAuthBtn) {
      electronAuthBtn.addEventListener('click', () => this.handleElectronAuth());
    }

    // Показать ручной ввод токена
    const manualTokenBtn = document.getElementById('manual-token-btn');
    if (manualTokenBtn) {
      manualTokenBtn.addEventListener('click', () => this.handleShowManualToken());
    }

    // Enter в поле токена
    const tokenInput = document.getElementById('token-input') as HTMLInputElement;
    if (tokenInput) {
      tokenInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleSaveToken();
        }
      });
    }
  }

  /**
   * Обработчик сохранения токена
   */
  private handleSaveToken(): void {
    const tokenInput = document.getElementById('token-input') as HTMLInputElement;
    if (!tokenInput) return;

    const token = tokenInput.value.trim();
    if (!token) {
      this.showError('Введите токен');
      return;
    }

    if (token.length < 10) {
      this.showError('Токен слишком короткий');
      return;
    }

    try {
      TokenManager.saveToken(token);
      this.showSuccess('Токен сохранен!');
      
      // Перерисовываем экран
      setTimeout(() => {
        this.hide();
        this.show();
      }, 1000);
    } catch (error) {
      this.showError('Ошибка сохранения токена');
    }
  }

  /**
   * Обработчик изменения токена
   */
  private handleChangeToken(): void {
    TokenManager.clearToken();
    this.hide();
    this.show();
  }

  /**
   * Обработчик сбора данных
   */
  private async handleCollectData(): Promise<void> {
    const tokenData = TokenManager.getToken();
    if (!tokenData) {
      this.showError('Токен не найден');
      return;
    }

    // Показываем секцию прогресса
    const progressSection = document.getElementById('progress-section');
    const collectBtn = document.getElementById('collect-data-btn');
    
    if (progressSection) progressSection.style.display = 'block';
    if (collectBtn) collectBtn.style.display = 'none';

    // Создаем коллектор с callback прогресса
    this.collector = new DataCollector((progress) => this.updateProgress(progress));

    try {
      const result = await this.collector.collectData(tokenData.token);
      this.showResult(result);
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Неизвестная ошибка');
    }
  }

  /**
   * Обработчик пропуска
   */
  private handleSkip(): void {
    this.hide();
    // Запускаем приложение с существующими данными
    window.dispatchEvent(new CustomEvent('first-load-completed', { 
      detail: { skipped: true } 
    }));
  }

  /**
   * Обновляет прогресс
   */
  private updateProgress(progress: CollectionProgress): void {
    const messageEl = document.getElementById('progress-message');
    const barEl = document.getElementById('progress-bar');
    const detailsEl = document.getElementById('progress-details');

    if (messageEl) messageEl.textContent = progress.message;
    if (barEl) barEl.style.width = `${progress.progress}%`;
    
    if (detailsEl && progress.totalTracks) {
      const processed = progress.processedTracks || 0;
      detailsEl.textContent = `Обработано: ${processed}/${progress.totalTracks} треков`;
      
      if (progress.currentTrack) {
        detailsEl.textContent += ` | Текущий: ${progress.currentTrack}`;
      }
    }
  }

  /**
   * Показывает результат сбора данных
   */
  private showResult(result: CollectionResult): void {
    const resultSection = document.getElementById('result-section');
    const progressSection = document.getElementById('progress-section');
    
    if (progressSection) progressSection.style.display = 'none';
    if (resultSection) {
      resultSection.style.display = 'block';
      
      if (result.success) {
        resultSection.innerHTML = `
          <div style="background: rgba(76, 175, 80, 0.2); border: 1px solid rgba(76, 175, 80, 0.5); border-radius: 8px; padding: 20px; text-align: center;">
            <h3 style="color: #4caf50; margin: 0 0 15px 0;">✅ Данные успешно загружены!</h3>
            <p style="color: #ccc; margin: 0 0 10px 0;">
              Собрано треков: ${result.tracksCollected}<br>
              С превью: ${result.tracksWithPreview}
            </p>
            <button 
              id="continue-btn"
              style="
                background: linear-gradient(90deg, #4fc3f7, #29b6f6);
                color: #fff;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                margin-top: 15px;
              "
            >
              🚀 Запустить приложение
            </button>
          </div>
        `;

        const continueBtn = document.getElementById('continue-btn');
        if (continueBtn) {
          continueBtn.addEventListener('click', () => {
            this.hide();
            window.dispatchEvent(new CustomEvent('first-load-completed', { 
              detail: { success: true, data: result.data } 
            }));
          });
        }
      } else {
        resultSection.innerHTML = `
          <div style="background: rgba(244, 67, 54, 0.2); border: 1px solid rgba(244, 67, 54, 0.5); border-radius: 8px; padding: 20px; text-align: center;">
            <h3 style="color: #f44336; margin: 0 0 15px 0;">❌ Ошибка загрузки данных</h3>
            <p style="color: #ccc; margin: 0 0 15px 0;">${result.error}</p>
            <button 
              id="retry-btn"
              style="
                background: rgba(244, 67, 54, 0.8);
                color: #fff;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-size: 16px;
                cursor: pointer;
                margin-right: 10px;
              "
            >
              🔄 Попробовать снова
            </button>
            <button 
              id="use-demo-btn"
              style="
                background: rgba(255, 255, 255, 0.1);
                color: #ccc;
                border: 1px solid rgba(255, 255, 255, 0.3);
                padding: 12px 24px;
                border-radius: 6px;
                font-size: 16px;
                cursor: pointer;
              "
            >
              📊 Использовать демо-данные
            </button>
          </div>
        `;

        const retryBtn = document.getElementById('retry-btn');
        const useDemoBtn = document.getElementById('use-demo-btn');
        
        if (retryBtn) {
          retryBtn.addEventListener('click', () => {
            this.hide();
            this.show();
          });
        }
        
        if (useDemoBtn) {
          useDemoBtn.addEventListener('click', () => {
            this.hide();
            window.dispatchEvent(new CustomEvent('first-load-completed', { 
              detail: { useDemo: true } 
            }));
          });
        }
      }
    }
  }

  /**
   * Показывает ошибку
   */
  private showError(message: string): void {
    // Создаем временное уведомление об ошибке
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(244, 67, 54, 0.9);
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 10000;
      font-size: 14px;
      max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 3000);
  }

  /**
   * Обработчик Electron авторизации
   */
  private async handleElectronAuth(): Promise<void> {
    const electronAuthBtn = document.getElementById('electron-auth-btn');
    if (electronAuthBtn) {
      electronAuthBtn.textContent = '⏳ Открытие окна авторизации...';
      (electronAuthBtn as HTMLButtonElement).disabled = true;
    }

    try {
      const token = await TokenManager.openElectronAuth();
      this.showSuccess('Авторизация успешна!');
      
      // Перерисовываем экран
      setTimeout(() => {
        this.hide();
        this.show();
      }, 1000);
    } catch (error) {
      this.showError('Ошибка авторизации: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
      
      // Восстанавливаем кнопку
      if (electronAuthBtn) {
        electronAuthBtn.textContent = '🎵 Войти через Яндекс.Музыку';
        (electronAuthBtn as HTMLButtonElement).disabled = false;
      }
    }
  }

  /**
   * Обработчик показа ручного ввода токена
   */
  private handleShowManualToken(): void {
    const manualSection = document.getElementById('manual-token-section');
    const manualBtn = document.getElementById('manual-token-btn');
    
    if (manualSection && manualBtn) {
      if (manualSection.style.display === 'none') {
        manualSection.style.display = 'block';
        manualBtn.textContent = 'Скрыть ручной ввод';
        
        // Фокусируемся на поле ввода
        const tokenInput = document.getElementById('token-input') as HTMLInputElement;
        if (tokenInput) {
          setTimeout(() => tokenInput.focus(), 100);
        }
      } else {
        manualSection.style.display = 'none';
        manualBtn.textContent = 'Ввести токен вручную';
      }
    }
  }

  /**
   * Показывает успешное сообщение
   */
  private showSuccess(message: string): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(76, 175, 80, 0.9);
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 10000;
      font-size: 14px;
      max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 2000);
  }
}