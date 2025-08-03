import { AppState } from '../types';
import { VisualMode } from '../soul-galaxy/types';

export class UIManager {
  private initialized: boolean = false;
  private onVisualModeChange?: (mode: VisualMode) => void;

  initialize(): void {
    console.log('Инициализация UI Manager...');
    this.initialized = true;
  }

  createDataCollectionButton(): void {
    // Создаем кнопку для сбора данных, если её ещё нет
    if (!document.getElementById('collect-data-button')) {
      const button = document.createElement('button');
      button.id = 'collect-data-button';
      button.textContent = 'Обновить данные';
      button.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4fc3f7;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        z-index: 1000;
        font-size: 14px;
      `;
      document.body.appendChild(button);
    }
  }

  createVisualModeSwitcher(): void {
    // Создаем переключатель режимов визуализации, если его ещё нет
    if (!document.getElementById('visual-mode-switcher')) {
      const container = document.createElement('div');
      container.id = 'visual-mode-switcher';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border: 1px solid #333;
        border-radius: 8px;
        padding: 15px;
        z-index: 1000;
        font-family: Arial, sans-serif;
      `;

      container.innerHTML = `
        <div style="margin-bottom: 10px; font-weight: bold; color: #4fc3f7;">
          🌌 Режим визуализации
        </div>
        <div style="display: flex; gap: 10px;">
          <button id="classic-mode-btn" style="
            background: #4fc3f7;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          ">
            🌟 Классический
          </button>
          <button id="soul-galaxy-mode-btn" style="
            background: #333;
            color: white;
            border: 1px solid #666;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          ">
            🔮 Soul Galaxy
          </button>
        </div>
      `;

      document.body.appendChild(container);

      // Добавляем обработчики событий
      const classicBtn = document.getElementById('classic-mode-btn');
      const soulGalaxyBtn = document.getElementById('soul-galaxy-mode-btn');

      if (classicBtn && soulGalaxyBtn) {
        classicBtn.addEventListener('click', () => {
          this.setActiveMode(VisualMode.CLASSIC);
          if (this.onVisualModeChange) {
            this.onVisualModeChange(VisualMode.CLASSIC);
          }
        });

        soulGalaxyBtn.addEventListener('click', () => {
          this.setActiveMode(VisualMode.SOUL_GALAXY);
          if (this.onVisualModeChange) {
            this.onVisualModeChange(VisualMode.SOUL_GALAXY);
          }
        });
      }
    }
  }

  private setActiveMode(mode: VisualMode): void {
    const classicBtn = document.getElementById('classic-mode-btn');
    const soulGalaxyBtn = document.getElementById('soul-galaxy-mode-btn');

    if (classicBtn && soulGalaxyBtn) {
      // Сброс стилей
      classicBtn.style.background = '#333';
      classicBtn.style.border = '1px solid #666';
      soulGalaxyBtn.style.background = '#333';
      soulGalaxyBtn.style.border = '1px solid #666';

      // Установка активного режима
      if (mode === VisualMode.CLASSIC) {
        classicBtn.style.background = '#4fc3f7';
        classicBtn.style.border = 'none';
      } else {
        soulGalaxyBtn.style.background = '#9c27b0';
        soulGalaxyBtn.style.border = 'none';
      }
    }
  }

  setOnVisualModeChange(callback: (mode: VisualMode) => void): void {
    this.onVisualModeChange = callback;
  }

  updateAppState(state: AppState): void {
    console.log('Обновление состояния UI:', state);
    // Здесь можно добавить логику обновления UI элементов
    // на основе состояния приложения
  }

  dispose(): void {
    console.log('Освобождение ресурсов UI Manager...');
    
    // Удаляем созданные элементы
    const collectButton = document.getElementById('collect-data-button');
    if (collectButton) {
      collectButton.remove();
    }
    
    const visualModeSwitcher = document.getElementById('visual-mode-switcher');
    if (visualModeSwitcher) {
      visualModeSwitcher.remove();
    }
    
    this.initialized = false;
  }
}