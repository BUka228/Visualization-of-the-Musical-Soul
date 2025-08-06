/**
 * Кнопка поиска треков
 * Создает плавающую кнопку для открытия модального окна поиска
 */

export class SearchButton {
  private button?: HTMLElement;
  private onSearchClick?: () => void;

  constructor() {
    this.createButton();
  }

  /**
   * Показывает кнопку поиска
   */
  show(onSearchClick: () => void): void {
    this.onSearchClick = onSearchClick;
    
    if (this.button) {
      this.button.style.display = 'flex';
      console.log('🔍 Search button shown');
    }
  }

  /**
   * Скрывает кнопку поиска
   */
  hide(): void {
    if (this.button) {
      this.button.style.display = 'none';
      console.log('🔍 Search button hidden');
    }
  }

  /**
   * Создает HTML элемент кнопки
   */
  private createButton(): void {
    this.button = document.createElement('button');
    this.button.id = 'track-search-button';
    this.button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <span>Поиск треков</span>
    `;
    
    this.button.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(79, 195, 247, 0.9);
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 25px;
      cursor: pointer;
      z-index: 1500;
      font-size: 14px;
      font-weight: 500;
      display: none;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 12px rgba(79, 195, 247, 0.3);
    `;

    // Добавляем hover эффекты
    this.button.addEventListener('mouseenter', () => {
      if (this.button) {
        this.button.style.background = 'rgba(79, 195, 247, 1)';
        this.button.style.transform = 'translateY(-2px)';
        this.button.style.boxShadow = '0 6px 16px rgba(79, 195, 247, 0.4)';
      }
    });

    this.button.addEventListener('mouseleave', () => {
      if (this.button) {
        this.button.style.background = 'rgba(79, 195, 247, 0.9)';
        this.button.style.transform = 'translateY(0)';
        this.button.style.boxShadow = '0 4px 12px rgba(79, 195, 247, 0.3)';
      }
    });

    // Обработчик клика
    this.button.addEventListener('click', () => {
      if (this.onSearchClick) {
        this.onSearchClick();
      }
    });

    // Добавляем кнопку в DOM
    document.body.appendChild(this.button);

    console.log('🔍 Search button created');
  }

  /**
   * Освобождает ресурсы
   */
  dispose(): void {
    console.log('🗑️ Disposing Search Button...');
    
    if (this.button && this.button.parentNode) {
      this.button.parentNode.removeChild(this.button);
    }
    
    this.button = undefined;
    this.onSearchClick = undefined;
    
    console.log('✅ Search Button disposed');
  }
}