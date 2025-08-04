/**
 * Mock API для демонстрации работы системы сбора данных
 * В реальном проекте это должно быть заменено на серверный API
 */

import { YandexTrackData } from '../data/DataLoader';

export class MockYandexAPI {
  /**
   * Имитирует тестирование токена
   */
  static async testToken(token: string): Promise<{ isValid: boolean; error?: string }> {
    // Простая проверка формата токена
    if (!token || token.length < 20) {
      return { isValid: false, error: 'Неверный формат токена' };
    }

    // Имитируем задержку API
    await new Promise(resolve => setTimeout(resolve, 500));

    // Считаем токен валидным если он содержит определенные символы
    const isValid = token.includes('Session_id') || token.length > 50;
    
    return { 
      isValid, 
      error: isValid ? undefined : 'Токен недействителен или истек' 
    };
  }

  /**
   * Имитирует получение лайкнутых треков
   */
  static async getLikedTracks(token: string): Promise<any[]> {
    // Имитируем задержку API
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Возвращаем пустой массив треков
    return [];
  }

  /**
   * Имитирует получение деталей трека
   */
  static async getTrackDetails(trackId: string, token: string): Promise<any> {
    // Имитируем задержку API
    await new Promise(resolve => setTimeout(resolve, 200));

    // Базовые данные трека
    const baseTrack = {
      id: trackId,
      title: `Track ${trackId}`,
      artists: [{ name: 'Mock Artist', genres: ['rock'] }],
      albums: [{ title: 'Mock Album' }],
      duration_ms: 180000,
      available: true,
      cover_uri: 'avatars.yandex.net/get-music-content/mock/400x400'
    };

    return baseTrack;
  }

  /**
   * Имитирует получение превью трека
   */
  static async getTrackPreview(trackId: string, token: string): Promise<string | null> {
    // Имитируем задержку API
    await new Promise(resolve => setTimeout(resolve, 300));

    // Возвращаем тестовый аудио файл
    return 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3';
  }

  /**
   * Имитирует сохранение данных
   */
  static async saveData(data: any): Promise<void> {
    // Имитируем задержку сохранения
    await new Promise(resolve => setTimeout(resolve, 500));

    // В реальном приложении здесь был бы запрос к серверу
    // Пока просто сохраняем в localStorage
    localStorage.setItem('music_data_backup', JSON.stringify(data));
    
    console.log('Mock API: Данные сохранены в localStorage');
  }
}

/**
 * Перехватчик fetch для имитации API endpoints
 */
export function setupMockAPI(): void {
  const originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();

    // Перехватываем API вызовы к Яндекс.Музыке
    if (url.includes('/api/yandex-music/')) {
      try {
        const body = init?.body ? JSON.parse(init.body as string) : {};
        const token = body.token || '';

        if (url.includes('/test')) {
          const result = await MockYandexAPI.testToken(token);
          return new Response(JSON.stringify(result), {
            status: result.isValid ? 200 : 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        if (url.includes('/liked-tracks')) {
          const tracks = await MockYandexAPI.getLikedTracks(token);
          return new Response(JSON.stringify({ tracks }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        if (url.includes('/track-details')) {
          const track = await MockYandexAPI.getTrackDetails(body.trackId, token);
          return new Response(JSON.stringify({ track }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        if (url.includes('/track-preview')) {
          const previewUrl = await MockYandexAPI.getTrackPreview(body.trackId, token);
          return new Response(JSON.stringify({ preview_url: previewUrl }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Mock API Error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Перехватываем сохранение данных
    if (url.includes('/api/save-music-data')) {
      try {
        const data = init?.body ? JSON.parse(init.body as string) : {};
        await MockYandexAPI.saveData(data);
        
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Save failed' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Для всех остальных запросов используем оригинальный fetch
    return originalFetch(input, init);
  };

  console.log('🔧 Mock API настроен для демонстрации');
}