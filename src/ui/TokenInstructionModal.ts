/**
 * Модальное окно с пошаговыми инструкциями получения токена
 */

import { TokenManager } from '../auth/TokenManager';

export class TokenInstructionModal {
  private modal?: HTMLElement;
  private currentStep: number = 1;
  private totalSteps: number = 6;

  /**
   * Показывает модальное окно
   */
  show(): void {
    this.render();
    this.setupEventListeners();
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
    this.modal.id = 'token-instruction-modal';
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
      backdrop-filter: blur(5px);
    `;

    this.modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border-radius: 20px;
        padding: 0;
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
        position: relative;
        animation: slideIn 0.4s ease-out;
      ">
        <!-- Заголовок -->
        <div style="
          background: linear-gradient(45deg, #4fc3f7, #29b6f6);
          padding: 25px 30px;
          color: white;
          position: relative;
          overflow: hidden;
        ">
          <button id="close-modal-btn" style="
            position: absolute;
            top: 15px;
            right: 20px;
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.3s;
          " onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='none'">×</button>
          
          <h2 style="margin: 0 0 8px 0; font-size: 1.8rem; font-weight: bold;">
            🔑 Получение токена доступа
          </h2>
          <p style="margin: 0; opacity: 0.9; font-size: 1rem;">
            Простые шаги для подключения к Яндекс.Музыке
          </p>
        </div>

        <!-- Контент -->
        <div style="padding: 30px;">
          <!-- Прогресс-бар -->
          <div style="margin-bottom: 30px;">
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 10px;
            ">
              <span style="color: #4fc3f7; font-weight: bold;">Шаг ${this.currentStep} из ${this.totalSteps}</span>
              <span style="color: #ccc; font-size: 0.9rem;" id="progress-text">Инструкции</span>
            </div>
            <div style="
              background: rgba(255, 255, 255, 0.1);
              border-radius: 10px;
              height: 8px;
              overflow: hidden;
            ">
              <div id="step-progress-bar" style="
                background: linear-gradient(90deg, #4fc3f7, #29b6f6);
                height: 100%;
                width: ${(this.currentStep / this.totalSteps) * 100}%;
                transition: width 0.3s ease;
                border-radius: 10px;
              "></div>
            </div>
          </div>

          <!-- Шаги инструкции -->
          <div id="instruction-steps">
            ${this.getStepContent()}
          </div>

          <!-- Поле для ввода токена -->
          <div id="token-input-section" style="display: none; margin-top: 30px;">
            <div style="
              background: rgba(255, 255, 255, 0.05);
              border-radius: 12px;
              padding: 20px;
              border: 1px solid rgba(255, 255, 255, 0.1);
            ">
              <label style="
                color: #fff;
                display: block;
                margin-bottom: 12px;
                font-weight: bold;
                font-size: 1.1rem;
              ">
                🎵 Вставьте токен Session_id:
              </label>
              <input 
                type="text" 
                id="token-input" 
                placeholder="Например: y0_AgAAAAAj2vgeAAG8XgAAAAEJa-6RAAAdPHm_OlpI_4ludZXEeCSbWupQkA"
                style="
                  width: 100%;
                  padding: 15px;
                  border: 2px solid rgba(79, 195, 247, 0.3);
                  border-radius: 8px;
                  background: rgba(255, 255, 255, 0.1);
                  color: #fff;
                  font-size: 14px;
                  box-sizing: border-box;
                  transition: border-color 0.3s;
                  font-family: monospace;
                "
                onfocus="this.style.borderColor='#4fc3f7'"
                onblur="this.style.borderColor='rgba(79, 195, 247, 0.3)'"
              />
              <div style="
                display: flex;
                align-items: center;
                gap: 10px;
                margin-top: 15px;
                padding: 10px;
                background: rgba(255, 193, 7, 0.1);
                border-radius: 6px;
                border-left: 4px solid #ffc107;
              ">
                <span style="font-size: 1.2rem;">💡</span>
                <p style="
                  color: #ffc107;
                  margin: 0;
                  font-size: 0.9rem;
                  line-height: 1.4;
                ">
                  Токен может начинаться с y0_ или AQA и обычно довольно длинный (50+ символов).
                </p>
              </div>
            </div>
          </div>

          <!-- Кнопки навигации -->
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 30px;
            gap: 15px;
          ">
            <button id="prev-step-btn" style="
              background: rgba(255, 255, 255, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.3);
              color: #ccc;
              padding: 12px 24px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              transition: all 0.3s;
              ${this.currentStep === 1 ? 'opacity: 0.5; cursor: not-allowed;' : ''}
            " ${this.currentStep === 1 ? 'disabled' : ''}>
              ← Назад
            </button>

            <div style="flex: 1; text-align: center;">
              <div style="display: flex; gap: 8px; justify-content: center;">
                ${Array.from({length: this.totalSteps}, (_, i) => `
                  <div style="
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: ${i + 1 <= this.currentStep ? '#4fc3f7' : 'rgba(255, 255, 255, 0.3)'};
                    transition: background 0.3s;
                  "></div>
                `).join('')}
              </div>
            </div>

            <button id="next-step-btn" style="
              background: linear-gradient(45deg, #4fc3f7, #29b6f6);
              border: none;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: bold;
              transition: all 0.3s;
            " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
              ${this.currentStep === this.totalSteps ? '🚀 Создать галактику' : 'Далее →'}
            </button>
          </div>
        </div>
      </div>
    `;

    // Добавляем стили анимации
    this.addModalStyles();

    document.body.appendChild(this.modal);

    // Фокусируемся на поле ввода, если оно видимо
    setTimeout(() => {
      const tokenInput = document.getElementById('token-input') as HTMLInputElement;
      if (tokenInput && tokenInput.offsetParent !== null) {
        tokenInput.focus();
      }
    }, 100);
  }

  /**
   * Добавляет стили для модального окна
   */
  private addModalStyles(): void {
    if (document.getElementById('modal-styles')) return;

    const style = document.createElement('style');
    style.id = 'modal-styles';
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
          transform: translateY(-30px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .step-content {
        animation: stepFadeIn 0.3s ease-out;
      }

      @keyframes stepFadeIn {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Получает контент для текущего шага
   */
  private getStepContent(): string {
    const steps = [
      {
        icon: '🔧',
        title: 'Подготовка (опционально)',
        content: `
          <p style="color: #ccc; line-height: 1.6; margin-bottom: 20px;">
            Откройте DevTools в браузере (F12) и на вкладке <strong style="color: #4fc3f7;">Network</strong> включите троттлинг.
          </p>
          <div style="
            background: rgba(255, 193, 7, 0.1);
            border: 1px solid rgba(255, 193, 7, 0.3);
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
          ">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span style="font-size: 1.2rem;">💡</span>
              <strong style="color: #ffc107;">Подсказка:</strong>
            </div>
            <p style="color: #ccc; margin: 0; font-size: 0.9rem;">
              Это поможет замедлить редирект и даст больше времени для копирования токена.
            </p>
          </div>
        `
      },
      {
        icon: '🌐',
        title: 'Перейдите по OAuth ссылке',
        content: `
          <p style="color: #ccc; line-height: 1.6; margin-bottom: 20px;">
            Перейдите по ссылке: <br>
            <a href="https://oauth.yandex.ru/authorize?response_type=token&client_id=23cabbbdc6cd418abb4b39c32c41195d" 
               target="_blank" 
               style="color: #4fc3f7; text-decoration: none; word-break: break-all; font-size: 0.9rem;">
              https://oauth.yandex.ru/authorize?response_type=token&client_id=23cabbbdc6cd418abb4b39c32c41195d
            </a>
          </p>
          <div style="
            background: rgba(76, 175, 80, 0.1);
            border: 1px solid rgba(76, 175, 80, 0.3);
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
          ">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span style="font-size: 1.2rem;">✅</span>
              <strong style="color: #4caf50;">Важно:</strong>
            </div>
            <p style="color: #ccc; margin: 0; font-size: 0.9rem;">
              Ссылка откроется в новой вкладке для удобства.
            </p>
          </div>
        `
      },
      {
        icon: '🔐',
        title: 'Авторизуйтесь',
        content: `
          <p style="color: #ccc; line-height: 1.6; margin-bottom: 20px;">
            Авторизуйтесь при необходимости и предоставьте доступ приложению к вашему аккаунту Яндекс.Музыки.
          </p>
          <div style="
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
          ">
            <p style="color: #ccc; margin: 0; font-size: 0.9rem;">
              <strong>Что произойдет:</strong><br>
              Яндекс попросит разрешение на доступ к вашей музыкальной библиотеке. Нажмите "Разрешить".
            </p>
          </div>
        `
      },
      {
        icon: '⚡',
        title: 'Скопируйте ссылку быстро!',
        content: `
          <p style="color: #ccc; line-height: 1.6; margin-bottom: 20px;">
            Браузер перенаправит на адрес вида:<br>
            <code style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 4px; color: #4fc3f7; font-size: 0.8rem; word-break: break-all;">
              https://music.yandex.ru/#access_token=AQAAAAAYc***&token_type=bearer&expires_in=31535645
            </code>
          </p>
          <div style="
            background: rgba(244, 67, 54, 0.1);
            border: 1px solid rgba(244, 67, 54, 0.3);
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
          ">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span style="font-size: 1.2rem;">⚠️</span>
              <strong style="color: #f44336;">Внимание:</strong>
            </div>
            <p style="color: #ccc; margin: 0; font-size: 0.9rem;">
              Очень быстро произойдет редирект на другую страницу! Нужно успеть скопировать ссылку из адресной строки.
            </p>
          </div>
        `
      },
      {
        icon: '🎵',
        title: 'Извлеките токен',
        content: `
          <p style="color: #ccc; line-height: 1.6; margin-bottom: 20px;">
            Ваш токен - это то, что находится после <strong style="color: #4fc3f7;">access_token=</strong> в скопированной ссылке.
          </p>
          <div style="
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
            border-left: 4px solid #4fc3f7;
          ">
            <p style="color: #ccc; margin: 0; font-size: 0.9rem;">
              <strong style="color: #4fc3f7;">Пример:</strong><br>
              Из ссылки <code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 3px;">access_token=AQAAAAAYc123...</code><br>
              Токен: <code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 3px;">AQAAAAAYc123...</code>
            </p>
          </div>
        `
      },
      {
        icon: '🚀',
        title: 'Введите токен',
        content: `
          <p style="color: #ccc; line-height: 1.6; margin-bottom: 20px;">
            Вставьте скопированный токен в поле ниже и нажмите кнопку для создания вашей музыкальной галактики.
          </p>
          <div style="
            background: rgba(76, 175, 80, 0.1);
            border: 1px solid rgba(76, 175, 80, 0.3);
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
          ">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span style="font-size: 1.2rem;">🔒</span>
              <strong style="color: #4caf50;">Безопасность:</strong>
            </div>
            <p style="color: #ccc; margin: 0; font-size: 0.9rem;">
              Токен сохраняется только локально в вашем браузере и используется исключительно для доступа к вашей музыкальной библиотеке.
            </p>
          </div>
        `
      }
    ];

    const step = steps[this.currentStep - 1];
    return `
      <div class="step-content">
        <div style="
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        ">
          <div style="
            font-size: 2.5rem;
            width: 60px;
            height: 60px;
            background: rgba(79, 195, 247, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid rgba(79, 195, 247, 0.3);
          ">
            ${step.icon}
          </div>
          <h3 style="
            color: #fff;
            margin: 0;
            font-size: 1.3rem;
            font-weight: bold;
          ">
            ${step.title}
          </h3>
        </div>
        ${step.content}
      </div>
    `;
  }

  /**
   * Настраивает обработчики событий
   */
  private setupEventListeners(): void {
    // Закрытие модального окна
    const closeBtn = document.getElementById('close-modal-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Закрытие по клику вне модального окна
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.hide();
        }
      });
    }

    // Навигация по шагам
    const prevBtn = document.getElementById('prev-step-btn');
    const nextBtn = document.getElementById('next-step-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previousStep());
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextStep());
    }

    // Обработка ввода токена
    const tokenInput = document.getElementById('token-input') as HTMLInputElement;
    if (tokenInput) {
      tokenInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleTokenSubmit();
        }
      });

      // Валидация токена в реальном времени
      tokenInput.addEventListener('input', () => {
        this.validateTokenInput();
      });
    }

    // Обработка клавиш
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide();
      } else if (e.key === 'ArrowLeft' && this.currentStep > 1) {
        this.previousStep();
      } else if (e.key === 'ArrowRight' && this.currentStep < this.totalSteps) {
        this.nextStep();
      }
    });
  }

  /**
   * Переход к предыдущему шагу
   */
  private previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateStep();
    }
  }

  /**
   * Переход к следующему шагу
   */
  private nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.updateStep();
    } else {
      // Последний шаг - отправка токена
      this.handleTokenSubmit();
    }
  }

  /**
   * Обновляет отображение шага
   */
  private updateStep(): void {
    // Обновляем прогресс-бар
    const progressBar = document.getElementById('step-progress-bar');
    if (progressBar) {
      progressBar.style.width = `${(this.currentStep / this.totalSteps) * 100}%`;
    }

    // Обновляем контент
    const stepsContainer = document.getElementById('instruction-steps');
    if (stepsContainer) {
      stepsContainer.innerHTML = this.getStepContent();
    }

    // Показываем/скрываем поле ввода токена
    const tokenSection = document.getElementById('token-input-section');
    if (tokenSection) {
      tokenSection.style.display = this.currentStep === this.totalSteps ? 'block' : 'none';
    }

    // Обновляем кнопки
    const prevBtn = document.getElementById('prev-step-btn') as HTMLButtonElement;
    const nextBtn = document.getElementById('next-step-btn');

    if (prevBtn) {
      prevBtn.disabled = this.currentStep === 1;
      prevBtn.style.opacity = this.currentStep === 1 ? '0.5' : '1';
      prevBtn.style.cursor = this.currentStep === 1 ? 'not-allowed' : 'pointer';
    }

    if (nextBtn) {
      nextBtn.textContent = this.currentStep === this.totalSteps ? '🚀 Создать галактику' : 'Далее →';
    }

    // Обновляем индикаторы шагов
    const indicators = this.modal?.querySelectorAll('[style*="border-radius: 50%"]');
    if (indicators) {
      indicators.forEach((indicator, index) => {
        if (index < this.totalSteps) {
          (indicator as HTMLElement).style.background = 
            index + 1 <= this.currentStep ? '#4fc3f7' : 'rgba(255, 255, 255, 0.3)';
        }
      });
    }

    // Фокусируемся на поле ввода, если показан последний шаг
    if (this.currentStep === this.totalSteps) {
      setTimeout(() => {
        const tokenInput = document.getElementById('token-input') as HTMLInputElement;
        if (tokenInput) {
          tokenInput.focus();
        }
      }, 100);
    }
  }

  /**
   * Валидирует ввод токена
   */
  private validateTokenInput(): void {
    const tokenInput = document.getElementById('token-input') as HTMLInputElement;
    const nextBtn = document.getElementById('next-step-btn') as HTMLButtonElement;
    
    if (!tokenInput || !nextBtn) return;

    const token = tokenInput.value.trim();
    const isValid = this.isValidTokenFormat(token);

    // Обновляем стиль поля ввода
    tokenInput.style.borderColor = token.length === 0 ? 
      'rgba(79, 195, 247, 0.3)' : 
      (isValid ? '#4caf50' : '#f44336');

    // Обновляем кнопку
    nextBtn.disabled = !isValid;
    nextBtn.style.opacity = isValid ? '1' : '0.6';
    nextBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
  }

  /**
   * Проверяет формат токена
   */
  private isValidTokenFormat(token: string): boolean {
    if (token.length < 20) return false;
    
    // Токен может начинаться с y0_ или быть в другом формате
    // Основная проверка - достаточная длина и отсутствие пробелов
    return !token.includes(' ') && token.length >= 20;
  }

  /**
   * Обрабатывает отправку токена
   */
  private handleTokenSubmit(): void {
    const tokenInput = document.getElementById('token-input') as HTMLInputElement;
    if (!tokenInput) return;

    const token = tokenInput.value.trim();
    
    if (!this.isValidTokenFormat(token)) {
      this.showTokenError('Неверный формат токена. Убедитесь, что скопировали значение Session_id полностью.');
      return;
    }

    try {
      // Сохраняем токен
      TokenManager.saveToken(token);
      
      // Показываем успех
      this.showTokenSuccess();
      
      // Отправляем событие завершения
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('token-setup-completed', {
          detail: { token, success: true }
        }));
      }, 1500);
      
    } catch (error) {
      this.showTokenError('Ошибка сохранения токена: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  }

  /**
   * Показывает ошибку токена
   */
  private showTokenError(message: string): void {
    const tokenInput = document.getElementById('token-input') as HTMLInputElement;
    if (!tokenInput) return;

    // Создаем уведомление об ошибке
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      background: rgba(244, 67, 54, 0.2);
      border: 1px solid rgba(244, 67, 54, 0.5);
      border-radius: 6px;
      padding: 12px;
      margin-top: 10px;
      color: #f44336;
      font-size: 0.9rem;
      animation: shake 0.5s ease-in-out;
    `;
    errorDiv.textContent = message;

    // Удаляем предыдущую ошибку
    const existingError = tokenInput.parentElement?.querySelector('[style*="244, 67, 54"]');
    if (existingError) {
      existingError.remove();
    }

    tokenInput.parentElement?.appendChild(errorDiv);

    // Добавляем анимацию тряски
    const shakeStyle = document.createElement('style');
    shakeStyle.textContent = `
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
    `;
    document.head.appendChild(shakeStyle);

    // Удаляем ошибку через 5 секунд
    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove();
      }
      if (shakeStyle.parentElement) {
        shakeStyle.remove();
      }
    }, 5000);
  }

  /**
   * Показывает успешное сохранение токена
   */
  private showTokenSuccess(): void {
    const tokenSection = document.getElementById('token-input-section');
    if (!tokenSection) return;

    tokenSection.innerHTML = `
      <div style="
        background: rgba(76, 175, 80, 0.2);
        border: 1px solid rgba(76, 175, 80, 0.5);
        border-radius: 12px;
        padding: 30px;
        text-align: center;
        animation: successPulse 0.6s ease-out;
      ">
        <div style="font-size: 3rem; margin-bottom: 15px;">✅</div>
        <h3 style="color: #4caf50; margin: 0 0 10px 0; font-size: 1.3rem;">
          Токен успешно сохранен!
        </h3>
        <p style="color: #ccc; margin: 0; font-size: 1rem;">
          Начинаем создание вашей музыкальной галактики...
        </p>
      </div>
    `;

    // Добавляем анимацию успеха
    const successStyle = document.createElement('style');
    successStyle.textContent = `
      @keyframes successPulse {
        0% {
          transform: scale(0.8);
          opacity: 0;
        }
        50% {
          transform: scale(1.05);
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(successStyle);
  }

  /**
   * Освобождает ресурсы
   */
  dispose(): void {
    this.hide();
    
    // Удаляем стили
    const modalStyles = document.getElementById('modal-styles');
    if (modalStyles) {
      modalStyles.remove();
    }
  }
}