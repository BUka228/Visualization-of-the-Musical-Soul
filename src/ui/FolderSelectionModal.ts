/**
 * Модальное окно для выбора папки с музыкальной коллекцией
 */

export class FolderSelectionModal {
  private modal?: HTMLElement;
  private selectedFolder?: FileSystemDirectoryHandle;

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
      this.modal.remove();
      this.modal = undefined;
    }
  }

  /**
   * Отрисовывает модальное окно
   */
  private render(): void {
    const modal = document.createElement('div');
    modal.id = 'folder-selection-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(10px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: 'Arial', sans-serif;
      animation: fadeIn 0.3s ease-out;
    `;

    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        border-radius: 20px;
        padding: 40px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        position: relative;
        animation: slideUp 0.3s ease-out;
      ">
        <!-- Кнопка закрытия -->
        <button id="close-modal" style="
          position: absolute;
          top: 15px;
          right: 15px;
          background: none;
          border: none;
          color: #999;
          font-size: 24px;
          cursor: pointer;
          padding: 5px;
          border-radius: 50%;
          transition: all 0.3s ease;
        " onmouseover="this.style.color='#fff'; this.style.background='rgba(255,255,255,0.1)'" 
           onmouseout="this.style.color='#999'; this.style.background='none'">
          ✕
        </button>

        <!-- Заголовок -->
        <h2 style="
          color: #4fc3f7;
          font-size: 2rem;
          margin: 0 0 20px 0;
          text-align: center;
          background: linear-gradient(45deg, #4fc3f7, #29b6f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        ">
          🎵 Выберите папку с музыкой
        </h2>

        <!-- Описание -->
        <div style="
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 30px;
          border-left: 4px solid #4fc3f7;
        ">
          <p style="
            color: #e0e0e0;
            margin: 0 0 15px 0;
            line-height: 1.6;
            font-size: 1rem;
          ">
            Для создания вашей музыкальной галактики нужна папка со следующей структурой:
          </p>
          
          <div style="
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
            color: #a0a0a0;
            margin: 15px 0;
          ">
            📁 Моя музыка/<br>
            ├── 📄 metadata.json<br>
            └── 📁 audio/<br>
            &nbsp;&nbsp;&nbsp;&nbsp;├── 🎵 track1.mp3<br>
            &nbsp;&nbsp;&nbsp;&nbsp;├── 🎵 track2.mp3<br>
            &nbsp;&nbsp;&nbsp;&nbsp;└── 🎵 ...
          </div>

          <ul style="
            color: #ccc;
            margin: 15px 0 0 20px;
            line-height: 1.8;
          ">
            <li><strong>metadata.json</strong> - файл с информацией о треках</li>
            <li><strong>audio/</strong> - папка с MP3 файлами</li>
            <li>Имена файлов должны соответствовать ID в metadata.json</li>
          </ul>
        </div>

        <!-- Кнопка выбора папки -->
        <div style="text-align: center; margin: 30px 0;">
          <button id="select-folder-btn" style="
            background: linear-gradient(45deg, #4fc3f7, #29b6f6);
            color: #fff;
            border: none;
            padding: 15px 40px;
            border-radius: 25px;
            font-size: 1.1rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 8px 25px rgba(79, 195, 247, 0.3);
            text-transform: uppercase;
            letter-spacing: 1px;
          " onmouseover="
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 12px 35px rgba(79, 195, 247, 0.4)';
          " onmouseout="
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 8px 25px rgba(79, 195, 247, 0.3)';
          ">
            📁 Выбрать папку
          </button>
        </div>

        <!-- Статус выбора -->
        <div id="folder-status" style="
          text-align: center;
          margin: 20px 0;
          min-height: 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        ">
          <p style="
            color: #999;
            margin: 0;
            font-size: 0.9rem;
          ">
            Папка не выбрана
          </p>
        </div>

        <!-- Кнопка продолжения -->
        <div style="text-align: center;">
          <button id="continue-btn" style="
            background: linear-gradient(45deg, #ff6b35, #f7931e);
            color: #fff;
            border: none;
            padding: 15px 40px;
            border-radius: 25px;
            font-size: 1.1rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 8px 25px rgba(255, 107, 53, 0.3);
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.5;
            pointer-events: none;
          ">
            🚀 Создать галактику
          </button>
        </div>

        <!-- Дополнительная информация -->
        <div style="
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
        ">
          <p style="
            color: #999;
            font-size: 0.8rem;
            margin: 0;
            line-height: 1.5;
          ">
            💡 Не знаете, как подготовить файлы? 
            <a href="#" id="help-link" style="color: #4fc3f7; text-decoration: none;">
              Посмотрите инструкцию
            </a>
          </p>
        </div>
      </div>
    `;

    // Добавляем CSS анимации
    this.addModalStyles();

    document.body.appendChild(modal);
    this.modal = modal;
  }

  /**
   * Добавляет CSS стили для модального окна
   */
  private addModalStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Настраивает обработчики событий
   */
  private setupEventListeners(): void {
    // Закрытие модального окна
    const closeBtn = document.getElementById('close-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Клик вне модального окна
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });

    // Выбор папки
    const selectBtn = document.getElementById('select-folder-btn');
    if (selectBtn) {
      selectBtn.addEventListener('click', () => this.handleFolderSelection());
    }

    // Кнопка продолжения
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => this.handleContinue());
    }

    // Ссылка на помощь
    const helpLink = document.getElementById('help-link');
    if (helpLink) {
      helpLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showHelp();
      });
    }

    // Обработка Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide();
      }
    });
  }

  /**
   * Обработчик выбора папки
   */
  private async handleFolderSelection(): Promise<void> {
    try {
      // Проверяем поддержку File System Access API
      if (!('showDirectoryPicker' in window)) {
        this.showError('Ваш браузер не поддерживает выбор папок. Используйте Chrome, Edge или другой современный браузер.');
        return;
      }

      // Показываем диалог выбора папки
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'read'
      });

      this.selectedFolder = dirHandle;
      await this.validateFolder(dirHandle);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Пользователь отменил выбор
        return;
      }
      
      console.error('Ошибка выбора папки:', error);
      this.showError('Не удалось выбрать папку: ' + error.message);
    }
  }

  /**
   * Валидирует выбранную папку
   */
  private async validateFolder(dirHandle: FileSystemDirectoryHandle): Promise<void> {
    const statusDiv = document.getElementById('folder-status');
    const continueBtn = document.getElementById('continue-btn');
    
    if (!statusDiv || !continueBtn) return;

    try {
      statusDiv.innerHTML = `
        <div style="color: #4fc3f7;">
          <div style="margin-bottom: 10px;">🔍 Проверяем папку...</div>
          <div style="font-size: 0.8rem; color: #999;">${dirHandle.name}</div>
        </div>
      `;

      // Проверяем наличие metadata.json
      let metadataHandle: FileSystemFileHandle;
      try {
        metadataHandle = await dirHandle.getFileHandle('metadata.json');
      } catch {
        throw new Error('Файл metadata.json не найден');
      }

      // Проверяем наличие папки audio
      let audioHandle: FileSystemDirectoryHandle;
      try {
        audioHandle = await dirHandle.getDirectoryHandle('audio');
      } catch {
        throw new Error('Папка audio не найдена');
      }

      // Читаем и валидируем metadata.json
      const metadataFile = await metadataHandle.getFile();
      const metadataText = await metadataFile.text();
      let metadata;
      
      try {
        metadata = JSON.parse(metadataText);
      } catch {
        throw new Error('Файл metadata.json содержит некорректный JSON');
      }

      if (!metadata.tracks || !Array.isArray(metadata.tracks)) {
        throw new Error('В metadata.json отсутствует массив tracks');
      }

      // Проверяем наличие аудиофайлов
      const audioFiles = new Set<string>();
      for await (const [name, handle] of (audioHandle as any).entries()) {
        if (handle.kind === 'file' && name.endsWith('.mp3')) {
          audioFiles.add(name.replace('.mp3', ''));
        }
      }

      const missingFiles = metadata.tracks
        .filter((track: any) => !audioFiles.has(track.id))
        .slice(0, 5); // Показываем только первые 5 отсутствующих файлов

      if (missingFiles.length > 0) {
        const totalMissing = metadata.tracks.filter((track: any) => !audioFiles.has(track.id)).length;
        console.warn(`Отсутствует ${totalMissing} аудиофайлов из ${metadata.tracks.length}`);
      }

      // Успешная валидация
      statusDiv.innerHTML = `
        <div style="color: #4caf50;">
          <div style="margin-bottom: 10px;">✅ Папка готова к использованию</div>
          <div style="font-size: 0.8rem; color: #ccc;">
            📁 ${dirHandle.name}<br>
            🎵 ${metadata.tracks.length} треков найдено<br>
            ${missingFiles.length > 0 ? `⚠️ ${metadata.tracks.filter((track: any) => !audioFiles.has(track.id)).length} файлов отсутствует` : '🎧 Все файлы на месте'}
          </div>
        </div>
      `;

      // Активируем кнопку продолжения
      continueBtn.style.opacity = '1';
      continueBtn.style.pointerEvents = 'auto';
      continueBtn.addEventListener('mouseover', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 12px 35px rgba(255, 107, 53, 0.4)';
      });
      continueBtn.addEventListener('mouseout', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 8px 25px rgba(255, 107, 53, 0.3)';
      });

    } catch (error: any) {
      statusDiv.innerHTML = `
        <div style="color: #f44336;">
          <div style="margin-bottom: 10px;">❌ Ошибка валидации</div>
          <div style="font-size: 0.8rem; color: #ffcdd2;">${error.message}</div>
        </div>
      `;

      // Деактивируем кнопку продолжения
      continueBtn.style.opacity = '0.5';
      continueBtn.style.pointerEvents = 'none';
    }
  }

  /**
   * Обработчик продолжения
   */
  private handleContinue(): void {
    if (!this.selectedFolder) {
      this.showError('Папка не выбрана');
      return;
    }

    // Отправляем событие с выбранной папкой
    window.dispatchEvent(new CustomEvent('folder-selected', {
      detail: {
        folderHandle: this.selectedFolder
      }
    }));

    this.hide();
  }

  /**
   * Показывает ошибку
   */
  private showError(message: string): void {
    const statusDiv = document.getElementById('folder-status');
    if (statusDiv) {
      statusDiv.innerHTML = `
        <div style="color: #f44336;">
          <div style="margin-bottom: 10px;">❌ Ошибка</div>
          <div style="font-size: 0.8rem; color: #ffcdd2;">${message}</div>
        </div>
      `;
    }
  }

  /**
   * Показывает справку
   */
  private showHelp(): void {
    // Создаем простое окно справки
    const helpWindow = window.open('', '_blank', 'width=600,height=400,scrollbars=yes');
    if (helpWindow) {
      helpWindow.document.write(`
        <html>
          <head>
            <title>Подготовка файлов для Music Galaxy</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
              h1 { color: #4fc3f7; }
              code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
              pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
            </style>
          </head>
          <body>
            <h1>🎵 Подготовка файлов для Music Galaxy</h1>
            
            <h2>Структура папки</h2>
            <pre>
📁 Моя музыка/
├── 📄 metadata.json
└── 📁 audio/
    ├── 🎵 track1.mp3
    ├── 🎵 track2.mp3
    └── 🎵 ...
            </pre>

            <h2>Формат metadata.json</h2>
            <pre>
{
  "metadata": {
    "total_tracks": 2,
    "generated_at": "2024-01-01T00:00:00Z",
    "source": "Local Collection"
  },
  "tracks": [
    {
      "id": "track1",
      "title": "Название песни",
      "artist": "Исполнитель",
      "album": "Альбом",
      "duration": 180,
      "genre": "rock",
      "available": true
    }
  ]
}
            </pre>

            <h2>Требования</h2>
            <ul>
              <li>Файлы MP3 должны называться по ID из metadata.json</li>
              <li>Все треки из metadata.json должны иметь соответствующие MP3 файлы</li>
              <li>Поддерживаются только MP3 файлы</li>
            </ul>
          </body>
        </html>
      `);
    }
  }

  /**
   * Освобождает ресурсы
   */
  dispose(): void {
    this.hide();
    this.selectedFolder = undefined;
  }
}