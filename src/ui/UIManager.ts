import { AppState } from '../types';

export class UIManager {
  private initialized: boolean = false;

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

  // Visual mode switcher removed - only Soul Galaxy mode remains

  // Visual mode switching methods removed - only Soul Galaxy mode remains

  updateAppState(state: AppState): void {
    console.log('Обновление состояния UI:', state);
    // Здесь можно добавить логику обновления UI элементов
    // на основе состояния приложения
  }

  /**
   * Показывает уведомление о том, как выйти из режима фокуса
   */
  showFocusExitHint(crystalName: string): void {
    // Удаляем предыдущее уведомление если есть
    this.hideFocusExitHint();
    
    const hint = document.createElement('div');
    hint.id = 'focus-exit-hint';
    hint.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: bold;">🎯 Фокус на: ${crystalName}</div>
      <div style="font-size: 12px; opacity: 0.8;">
        • ESC или Пробел - выйти из фокуса<br>
        • Движение мыши/колеса - выйти из фокуса<br>
        • Автоматический выход через 15 сек
      </div>
    `;
    hint.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-family: Arial, sans-serif;
      z-index: 1001;
      max-width: 300px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      animation: fadeIn 0.3s ease-out;
    `;
    
    // Добавляем CSS анимацию
    if (!document.getElementById('focus-hint-styles')) {
      const style = document.createElement('style');
      style.id = 'focus-hint-styles';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-10px); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(hint);
    
    console.log(`💡 Focus exit hint shown for crystal: ${crystalName}`);
  }

  /**
   * Скрывает уведомление о выходе из режима фокуса
   */
  hideFocusExitHint(): void {
    const hint = document.getElementById('focus-exit-hint');
    if (hint) {
      hint.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        if (hint.parentNode) {
          hint.parentNode.removeChild(hint);
        }
      }, 300);
      console.log('💡 Focus exit hint hidden');
    }
  }

  dispose(): void {
    console.log('Освобождение ресурсов UI Manager...');
    
    // Удаляем созданные элементы
    const collectButton = document.getElementById('collect-data-button');
    if (collectButton) {
      collectButton.remove();
    }
    
    // Удаляем уведомление о фокусе
    this.hideFocusExitHint();
    
    // Удаляем стили
    const styles = document.getElementById('focus-hint-styles');
    if (styles) {
      styles.remove();
    }
    
    this.initialized = false;
  }
}