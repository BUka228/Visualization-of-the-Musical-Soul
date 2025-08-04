import type { VercelRequest, VercelResponse } from '@vercel/node';

// Интерфейсы для данных Яндекс.Музыки
interface ProcessedTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  genre: string;
  cover_url?: string;
  preview_url?: string;
  available: boolean;
}

interface YandexMusicData {
  metadata: {
    total_tracks: number;
    generated_at: string;
    source: string;
  };
  tracks: ProcessedTrack[];
}

/**
 * Главная Serverless-функция для получения данных из Яндекс.Музыки
 * Использует прямые HTTP запросы к API
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Обработка CORS для локальной разработки и preflight-запросов
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Принимаем только POST-запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Session_id token is required' });
    }

    console.log('Session_id received, length:', token.length);
    console.log('Получение данных из Яндекс.Музыки...');

    // Базовые настройки для запросов к API
    const baseURL = 'https://api.music.yandex.net';
    const headers = {
      'Authorization': `OAuth ${token}`,
      'User-Agent': 'Yandex-Music-API/1.0',
      'Content-Type': 'application/json'
    };

    // Получаем информацию о пользователе для проверки токена
    console.log('Checking user authentication...');
    const userResponse = await fetch(`${baseURL}/account/status`, {
      method: 'GET',
      headers
    });

    if (!userResponse.ok) {
      throw new Error(`Authentication failed: ${userResponse.status} ${userResponse.statusText}`);
    }

    const userData = await userResponse.json();
    const userId = userData.result.account.uid;
    console.log(`Authenticated as user: ${userId}`);

    // Получаем лайкнутые треки
    console.log('Fetching liked tracks...');
    const likesResponse = await fetch(`${baseURL}/users/${userId}/likes/tracks`, {
      method: 'GET',
      headers
    });

    if (!likesResponse.ok) {
      throw new Error(`Failed to fetch liked tracks: ${likesResponse.status} ${likesResponse.statusText}`);
    }

    const likesData = await likesResponse.json();
    const trackIds = likesData.result.library.tracks.map((track: any) => track.id);

    if (trackIds.length === 0) {
      console.log('No liked tracks found.');
      return res.status(200).json({
        metadata: { 
          total_tracks: 0, 
          generated_at: new Date().toISOString(),
          source: 'Yandex Music API (Direct HTTP)'
        },
        tracks: []
      });
    }

    console.log(`Found ${trackIds.length} liked tracks.`);

    // Получаем полную информацию о треках (батчами по 100)
    const batchSize = 100;
    const allTracks: any[] = [];

    for (let i = 0; i < trackIds.length; i += batchSize) {
      const batch = trackIds.slice(i, i + batchSize);
      const trackIdsParam = batch.join(',');
      
      const tracksResponse = await fetch(`${baseURL}/tracks?track-ids=${trackIdsParam}`, {
        method: 'GET',
        headers
      });

      if (tracksResponse.ok) {
        const tracksData = await tracksResponse.json();
        allTracks.push(...tracksData.result);
      }
    }

    console.log(`Fetched full info for ${allTracks.length} tracks.`);

    // Анализируем первые несколько треков для отладки
    if (allTracks.length > 0) {
      console.log('Sample track data:', JSON.stringify(allTracks[0], null, 2));
      const availableCount = allTracks.filter(t => t.available).length;
      const unavailableCount = allTracks.filter(t => !t.available).length;
      console.log(`Available tracks: ${availableCount}, Unavailable: ${unavailableCount}`);
    }

    // Обрабатываем треки (убираем фильтрацию по available)
    const processedTracks: ProcessedTrack[] = allTracks
      .map((track: any): ProcessedTrack => {
        return {
          id: String(track.id),
          title: track.title || 'Unknown Title',
          artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
          album: track.albums?.[0]?.title || 'Unknown Album',
          duration: Math.floor((track.durationMs || 0) / 1000),
          genre: track.albums?.[0]?.genre || 'unknown',
          cover_url: track.coverUri ? `https://${track.coverUri.replace('%%', '400x400')}` : undefined,
          preview_url: undefined, // Превью требуют дополнительных запросов
          available: track.available !== false, // Считаем доступными все треки, кроме явно недоступных
        };
      })
      .filter((track: ProcessedTrack) => track.title && track.artist); // Фильтруем только треки без базовой информации

    console.log(`Processed ${processedTracks.length} tracks after filtering.`);
    
    if (processedTracks.length > 0) {
      console.log('Sample processed track:', JSON.stringify(processedTracks[0], null, 2));
    }

    // Формируем и отправляем успешный ответ
    const result: YandexMusicData = {
      metadata: {
        total_tracks: processedTracks.length,
        generated_at: new Date().toISOString(),
        source: 'Yandex Music API (Direct HTTP)'
      },
      tracks: processedTracks,
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error('Yandex Music API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Возвращаем более понятную ошибку, если проблема в авторизации
    if (errorMessage.toLowerCase().includes('auth') || 
        errorMessage.toLowerCase().includes('401') ||
        errorMessage.toLowerCase().includes('unauthorized')) {
      return res.status(401).json({
        error: 'Authorization failed. Your Session_id is likely invalid or expired. Please update it.',
        details: errorMessage
      });
    }

    // Общая ошибка сервера
    return res.status(500).json({
      error: 'Failed to fetch data from Yandex Music.',
      details: errorMessage
    });
  }
}

