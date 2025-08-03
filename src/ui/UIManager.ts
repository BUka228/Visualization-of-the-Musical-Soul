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

  dispose(): void {
    console.log('Освобождение ресурсов UI Manager...');
    
    // Удаляем созданные элементы
    const collectButton = document.getElementById('collect-data-button');
    if (collectButton) {
      collectButton.remove();
    }
    
    this.initialized = false;
  }
}