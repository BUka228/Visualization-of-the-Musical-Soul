const { contextBridge, ipcRenderer } = require('electron');

// Безопасно предоставляем API для рендерера
contextBridge.exposeInMainWorld('electronAPI', {
  // Открыть окно авторизации
  openAuthWindow: () => ipcRenderer.invoke('open-auth-window'),
  
  // Получить сохраненный токен
  getStoredToken: () => ipcRenderer.invoke('get-stored-token'),
  
  // Собрать данные через Python скрипт
  collectYandexData: (token) => ipcRenderer.invoke('collect-yandex-data', token),
  
  // Слушать получение токена
  onTokenReceived: (callback) => {
    ipcRenderer.on('auth-token-received', (event, token) => {
      callback(token);
    });
  },
  
  // Слушать прогресс сбора данных
  onCollectionProgress: (callback) => {
    ipcRenderer.on('collection-progress', (event, message) => {
      callback(message);
    });
  },
  
  // Удалить слушатель токена
  removeTokenListener: () => {
    ipcRenderer.removeAllListeners('auth-token-received');
  },
  
  // Удалить слушатель прогресса
  removeProgressListener: () => {
    ipcRenderer.removeAllListeners('collection-progress');
  }
});