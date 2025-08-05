/**
 * Модальное окно настроек сбора данных
 */

export interface CollectionSettings {
  previewLimit: number;
  loadAllTracks: boolean;
}

export class CollectionSettingsModal {
  private modal?: HTMLElement;
  private onConfirm?: (settings: CollectionSettings) => void;
  private onCancel?: () => void;

  /**
   * Показывает модальное окно настроек
   */
  show(onConfirm: (settings: CollectionSettings) => void, onCancel?: () => void): void {
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
    this.render();
  }

  /**
   * Скрывает модальное окно
   */
  hide(): void {
    if (this.modal) {
      this.modal.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        if (this.modal && this.modal.parentElement) {
          this.modal.remove();
        }
      }, 300);
    }
  }

  /**
   * Отрисовывает модальное окно
   */
  private render(): void {
    this.modal = document.createElement('div');
    this.modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: 'Arial', sans-serif;
      animation: fadeIn 0.3s ease-out;
    `;

    this.modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        border-radius: 16px;
        padding: 30px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        animation: slideIn 0.3s ease-out;
      ">
        <h2 style="
          color: #4fc3f7;
          font-size: 1.8rem;
          margin: 0 0 20px 0;
          text-align: center;
        ">⚙️ Настройки загрузки</h2>

        <div style="
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 25px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        ">
          <h3 style="
            color: #e0e0e0;
            font-size: 1.2rem;
            margin: 0 0 15px 0;
          ">🎵 Превью треков</h3>
          
          <p style="
            color: #ccc;
            font-size: 0.9rem;
            margin: 0 0 20px 0;
            line-height: 1.4;
          ">
            Получение превью треков занимает больше времени. Вы можете ограничить количество для ускорения загрузки.
          </p>

          <div style="margin-bottom: 20px;">
            <label style="
              display: flex;
              align-items: center;
              gap: 10px;
              color: #e0e0e0;
              cursor: pointer;
              margin-bottom: 15px;
            ">
              <input type="radio" name="preview-mode" value="all" checked style="
                accent-color: #4fc3f7;
                transform: scale(1.2);
              ">
              <span>Загрузить превью для всех треков (может занять до 5 минут)</span>
            </label>

            <label style="
              display: flex;
              align-items: center;
              gap: 10px;
              color: #e0e0e0;
              cursor: pointer;
              margin-bottom: 15px;
            ">
              <input type="radio" name="preview-mode" value="maximum" style="
                accent-color: #4fc3f7;
                transform: scale(1.2);
              ">
              <span>🚀 Максимальная загрузка (все треки + оптимизация)</span>
            </label>

            <label style="
              display: flex;
              align-items: center;
              gap: 10px;
              color: #e0e0e0;
              cursor: pointer;
              margin-bottom: 15px;
            ">
              <input type="radio" name="preview-mode" value="turbo" style="
                accent-color: #ff6b35;
                transform: scale(1.2);
              ">
              <span style="color: #ff6b35;">⚡ ТУРБО-режим (для 500+ треков)</span>
            </label>

            <label style="
              display: flex;
              align-items: center;
              gap: 10px;
              color: #e0e0e0;
              cursor: pointer;
              margin-bottom: 15px;
            ">
              <input type="radio" name="preview-mode" value="limited" style="
                accent-color: #4fc3f7;
                transform: scale(1.2);
              ">
              <span>Ограничить количество превью:</span>
            </label>

            <div id="preview-limit-container" style="
              margin-left: 30px;
              opacity: 0.5;
              transition: opacity 0.3s;
            ">
              <input type="range" id="preview-limit-slider" min="10" max="200" value="50" step="10" style="
                width: 100%;
                margin: 10px 0;
                accent-color: #4fc3f7;
              ">
              <div style="
                display: flex;
                justify-content: space-between;
                color: #999;
                font-size: 0.8rem;
              ">
                <span>10</span>
                <span id="preview-limit-value" style="color: #4fc3f7; font-weight: bold;">50</span>
                <span>200</span>
              </div>
            </div>

            <label style="
              display: flex;
              align-items: center;
              gap: 10px;
              color: #e0e0e0;
              cursor: pointer;
            ">
              <input type="radio" name="preview-mode" value="none" style="
                accent-color: #4fc3f7;
                transform: scale(1.2);
              ">
              <span>Без превью (только основные данные)</span>
            </label>
          </div>
        </div>

        <div style="
          background: rgba(255, 193, 7, 0.1);
          border: 1px solid rgba(255, 193, 7, 0.3);
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 25px;
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 10px;
            color: #ffc107;
            font-size: 0.9rem;
            margin-bottom: 8px;
          ">
            <span>⚠️</span>
            <strong>Ограничения Vercel</strong>
          </div>
          <p style="
            color: #ffecb3;
            font-size: 0.85rem;
            margin: 0;
            line-height: 1.4;
          ">
            Функция имеет лимит времени выполнения 5 минут. Для библиотек >500 треков рекомендуется режим "Максимальная загрузка".
          </p>
        </div>

        <div style="
          display: flex;
          gap: 15px;
          justify-content: flex-end;
        ">
          <button id="cancel-btn" style="
            background: rgba(255, 255, 255, 0.1);
            color: #ccc;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
          ">
            Отмена
          </button>

          <button id="confirm-btn" style="
            background: linear-gradient(45deg, #4fc3f7, #29b6f6);
            color: #fff;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(79, 195, 247, 0.3);
          ">
            🚀 Начать загрузку
          </button>
        </div>
      </div>
    `;

    // Добавляем стили анимации
    this.addStyles();

    // Настраиваем обработчики событий
    this.setupEventListeners();

    document.body.appendChild(this.modal);
  }

  /**
   * Добавляет стили анимации
   */
  private addStyles(): void {
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

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-50px) scale(0.9);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      #confirm-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(79, 195, 247, 0.4) !important;
      }

      #cancel-btn:hover {
        background: rgba(255, 255, 255, 0.2) !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Настраивает обработчики событий
   */
  private setupEventListeners(): void {
    if (!this.modal) return;

    // Радио-кнопки режима превью
    const radioButtons = this.modal.querySelectorAll('input[name="preview-mode"]');
    const limitContainer = this.modal.querySelector('#preview-limit-container') as HTMLElement;
    const limitSlider = this.modal.querySelector('#preview-limit-slider') as HTMLInputElement;
    const limitValue = this.modal.querySelector('#preview-limit-value') as HTMLElement;

    radioButtons.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (limitContainer) {
          limitContainer.style.opacity = target.value === 'limited' ? '1' : '0.5';
        }
      });
    });

    // Слайдер лимита превью
    if (limitSlider && limitValue) {
      limitSlider.addEventListener('input', () => {
        limitValue.textContent = limitSlider.value;
      });
    }

    // Кнопка отмены
    const cancelBtn = this.modal.querySelector('#cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.hide();
        if (this.onCancel) {
          this.onCancel();
        }
      });
    }

    // Кнопка подтверждения
    const confirmBtn = this.modal.querySelector('#confirm-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const settings = this.getSettings();
        this.hide();
        if (this.onConfirm) {
          this.onConfirm(settings);
        }
      });
    }

    // Закрытие по клику вне модального окна
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
        if (this.onCancel) {
          this.onCancel();
        }
      }
    });

    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide();
        if (this.onCancel) {
          this.onCancel();
        }
      }
    });
  }

  /**
   * Получает настройки из формы
   */
  private getSettings(): CollectionSettings {
    if (!this.modal) {
      return { previewLimit: 0, loadAllTracks: true };
    }

    const selectedMode = this.modal.querySelector('input[name="preview-mode"]:checked') as HTMLInputElement;
    const limitSlider = this.modal.querySelector('#preview-limit-slider') as HTMLInputElement;

    let previewLimit = 0;
    let loadAllTracks = true;

    if (selectedMode) {
      switch (selectedMode.value) {
        case 'all':
          previewLimit = 0; // 0 означает все треки
          break;
        case 'maximum':
          previewLimit = -1; // -1 означает максимальную оптимизацию
          break;
        case 'turbo':
          previewLimit = -2; // -2 означает ТУРБО-режим для больших библиотек
          break;
        case 'limited':
          previewLimit = parseInt(limitSlider?.value || '50');
          break;
        case 'none':
          previewLimit = 0;
          loadAllTracks = false; // Не загружаем превью вообще
          break;
      }
    }

    return { previewLimit, loadAllTracks };
  }
}