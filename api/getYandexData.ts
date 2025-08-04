import type { VercelRequest, VercelResponse } from '@vercel/node';
const { YandexMusicApi } = require('yandex-music-api');

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

/**
 * Главная Serverless-функция для получения данных из Яндекс.Музыки
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

    // Инициализация API клиента
    const api = new YandexMusicApi();

    // ВАЖНО: Устанавливаем cookie для авторизации
    api.setCookie(token);

    // Получаем лайкнутые треки пользователя
    console.log('Fetching liked tracks...');
    const likedTracksResponse = await api.users.getLikesTracks();
    const trackShorts = likedTracksResponse.tracks;

    if (!trackShorts || trackShorts.length === 0) {
      console.log('No liked tracks found.');
      return res.status(200).json({
        metadata: { total_tracks: 0, generated_at: new Date().toISOString() },
        tracks: []
      });
    }

    console.log(`Found ${trackShorts.length} liked tracks.`);

    // Получаем полную информацию о треках
    // Библиотека сама разбивает запросы на батчи при необходимости
    const fullTracks = await trackShorts.getFullTracks();
    console.log(`Fetched full info for ${fullTracks.length} tracks.`);

    // Получаем ссылки на превью для всех треков одним запросом
    const previews = await api.tracks.getDownloadInfo(fullTracks.map(t => String(t.id)));

    // Обрабатываем и собираем данные
    const processedTracks = fullTracks.map((track, index) => {
      const trackPreview = previews.find(p => p.trackId === String(track.id));
      const previewUrl = trackPreview ? trackPreview.getURL('mp3', 128) : undefined;

      const processedTrack: ProcessedTrack = {
        id: String(track.id),
        title: track.title || 'Unknown Title',
        artist: track.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
        album: track.albums?.[0]?.title || 'Unknown Album',
        duration: Math.floor((track.durationMs || 0) / 1000),
        genre: track.albums?.[0]?.genre || 'unknown',
        cover_url: track.getCoverURL('400x400'),
        preview_url: previewUrl,
        available: track.available,
      };

      return processedTrack;
    }).filter(t => t.available); // Убираем недоступные треки

    console.log(`Processed ${processedTracks.length} available tracks.`);

    // Формируем и отправляем успешный ответ
    return res.status(200).json({
      metadata: {
        total_tracks: processedTracks.length,
        generated_at: new Date().toISOString(),
        source: 'Yandex Music API (via Vercel Proxy)'
      },
      tracks: processedTracks,
    });

  } catch (error) {
    console.error('Yandex Music API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Возвращаем более понятную ошибку, если проблема в авторизации
    if (errorMessage.toLowerCase().includes('auth') || errorMessage.toLowerCase().includes('cookie')) {
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

