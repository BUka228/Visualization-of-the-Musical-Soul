/**
 * Менеджер токенов для работы с Яндекс.Музыка API
 */

export interface TokenData {
  token: string;
  expiresAt?: Date;
  createdAt: Date;
  isValid: boolean;
}

export interface TokenValidationResult {
  isValid: boolean;
  error?: string;
  needsRefresh?: boolean;
}

export class TokenManager {
  private static readonly STORAGE_KEY = 'yandex_music_token';
  private static readonly TOKEN_LIFETIME_HOURS = 24; // Примерное время жизни токена
  
  // Проверяем, работаем ли мы в Electron
  private static get isElectron(): boolean {
    return typeof window !== 'undefined' && window.electronAPI !== undefined;
  }

  /**
   * Сохраняет токен в localStorage
   */
  static saveToken(token: string): void {
    const tokenData: TokenData = {
      token: token.trim(),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.TOKEN_LIFETIME_HOURS * 60 * 60 * 1000),
      isValid: true
    };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tokenData));
      console.log('✅ Токен сохранен');
    } catch (error) {
      console.error('❌ Ошибка сохранения токена:', error);
      throw new Error('Не удалось сохранить токен');
    }
  }

  /**
   * Получает сохраненный токен
   */
  static getToken(): TokenData | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const tokenData: TokenData = JSON.parse(stored);
      
      // Восстанавливаем даты из строк
      tokenData.createdAt = new Date(tokenData.createdAt);
      if (tokenData.expiresAt) {
        tokenData.expiresAt = new Date(tokenData.expiresAt);
      }

      return tokenData;
    } catch (error) {
      console.error('❌ Ошибка загрузки токена:', error);
      this.clearToken(); // Очищаем поврежденные данные
      return null;
    }
  }

  /**
   * Проверяет валидность токена
   */
  static validateToken(tokenData?: TokenData | null): TokenValidationResult {
    if (!tokenData) {
      tokenData = this.getToken();
    }

    if (!tokenData) {
      return {
        isValid: false,
        error: 'Токен не найден',
        needsRefresh: true
      };
    }

    // Проверяем формат токена
    if (!tokenData.token || tokenData.token.length < 10) {
      return {
        isValid: false,
        error: 'Неверный формат токена',
        needsRefresh: true
      };
    }

    // Проверяем срок действия
    if (tokenData.expiresAt && new Date() > tokenData.expiresAt) {
      return {
        isValid: false,
        error: 'Токен истек',
        needsRefresh: true
      };
    }

    // Проверяем возраст токена (если нет expiresAt)
    const ageHours = (Date.now() - tokenData.createdAt.getTime()) / (1000 * 60 * 60);
    if (ageHours > this.TOKEN_LIFETIME_HOURS) {
      return {
        isValid: false,
        error: 'Токен устарел',
        needsRefresh: true
      };
    }

    return {
      isValid: true
    };
  }

  /**
   * Проверяет, есть ли валидный токен
   */
  static hasValidToken(): boolean {
    const validation = this.validateToken();
    return validation.isValid;
  }

  /**
   * Очищает сохраненный токен
   */
  static clearToken(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('✅ Токен очищен');
    } catch (error) {
      console.error('❌ Ошибка очистки токена:', error);
    }
  }

  /**
   * Получает информацию о токене для отображения
   */
  static getTokenInfo(): {
    hasToken: boolean;
    isValid: boolean;
    createdAt?: Date;
    expiresAt?: Date;
    ageHours?: number;
    error?: string;
  } {
    const tokenData = this.getToken();
    const validation = this.validateToken(tokenData);

    if (!tokenData) {
      return {
        hasToken: false,
        isValid: false,
        error: 'Токен не найден'
      };
    }

    const ageHours = (Date.now() - tokenData.createdAt.getTime()) / (1000 * 60 * 60);

    return {
      hasToken: true,
      isValid: validation.isValid,
      createdAt: tokenData.createdAt,
      expiresAt: tokenData.expiresAt,
      ageHours: Math.round(ageHours * 100) / 100,
      error: validation.error
    };
  }

  /**
   * Тестирует токен, отправляя запрос к API
   */
  static async testToken(token?: string): Promise<TokenValidationResult> {
    const testToken = token || this.getToken()?.token;
    
    if (!testToken) {
      return {
        isValid: false,
        error: 'Токен не предоставлен',
        needsRefresh: true
      };
    }

    try {
      // Простой тест - пытаемся получить информацию о пользователе
      const response = await fetch('/api/test-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: testToken })
      });

      if (response.ok) {
        return { isValid: true };
      } else if (response.status === 401 || response.status === 403) {
        return {
          isValid: false,
          error: 'Токен недействителен или истек',
          needsRefresh: true
        };
      } else {
        return {
          isValid: false,
          error: `Ошибка API: ${response.status}`,
          needsRefresh: false
        };
      }
    } catch (error) {
      console.warn('⚠️ Не удалось протестировать токен через API:', error);
      
      // Если API недоступно, используем локальную валидацию
      return this.validateToken();
    }
  }

  /**
   * Форматирует токен для отображения (скрывает большую часть)
   */
  static formatTokenForDisplay(token: string): string {
    if (token.length <= 10) return token;
    
    const start = token.substring(0, 4);
    const end = token.substring(token.length - 4);
    const middle = '*'.repeat(Math.min(12, token.length - 8));
    
    return `${start}${middle}${end}`;
  }

  /**
   * Открывает окно авторизации в Electron
   */
  static async openElectronAuth(): Promise<string> {
    if (!this.isElectron) {
      throw new Error('Метод доступен только в Electron');
    }

    return new Promise((resolve, reject) => {
      // Устанавливаем слушатель для получения токена
      (window as any).electronAPI.onTokenReceived((token: string) => {
        console.log('✅ Токен получен через Electron');
        this.saveToken(token);
        resolve(token);
      });

      // Открываем окно авторизации
      (window as any).electronAPI.openAuthWindow().catch((error: any) => {
        console.error('❌ Ошибка открытия окна авторизации:', error);
        reject(error);
      });
    });
  }

  /**
   * Получает инструкции по получению токена
   */
  static getTokenInstructions(): string {
    if (this.isElectron) {
      return `
Авторизация в Electron приложении:

1. Нажмите кнопку "Войти через Яндекс.Музыку"
2. В открывшемся окне войдите в свой аккаунт Яндекс
3. После успешного входа окно закроется автоматически
4. Токен будет сохранен и приложение готово к работе

⚠️ Важно:
- Токен действует ограниченное время (обычно 24 часа)
- При истечении токена потребуется повторная авторизация
      `.trim();
    }

    return `
Как получить токен Яндекс.Музыки:

1. Откройте music.yandex.ru в браузере
2. Войдите в свой аккаунт Яндекс
3. Откройте DevTools (F12)
4. Перейдите на вкладку Application → Cookies
5. Найдите cookie с именем 'Session_id'
6. Скопируйте его значение (длинная строка символов)

⚠️ Важно:
- Токен действует ограниченное время (обычно 24 часа)
- Не делитесь токеном с другими людьми
- При истечении токена потребуется получить новый
    `.trim();
  }
}