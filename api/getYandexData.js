// JavaScript версия API функции для тестирования

/**
 * Главная Serverless-функция для получения данных из Яндекс.Музыки
 * Использует прямые HTTP запросы к API
 */
async function handler(req, res) {
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
    const trackIds = likesData.result.library.tracks.map(track => track.id);

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
    const allTracks = [];

    for (let i = 0; i < trackIds.length; i += batchSize) {
      const batch = trackIds.slice(i, i + batchSize);
      const tracksResponse = await fetch(`${baseURL}/tracks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          'track-ids': batch,
          'with-positions': false
        })
      });

      if (tracksResponse.ok) {
        const tracksData = await tracksResponse.json();
        allTracks.push(...tracksData.result);
      }
    }

    console.log(`Fetched full info for ${allTracks.length} tracks.`);

    // Обрабатываем треки
    const processedTracks = allTracks
      .filter(track => track.available)
      .map(track => {
        return {
          id: String(track.id),
          title: track.title || 'Unknown Title',
          artist: track.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
          album: track.albums?.[0]?.title || 'Unknown Album',
          duration: Math.floor((track.durationMs || 0) / 1000),
          genre: track.albums?.[0]?.genre || 'unknown',
          cover_url: track.coverUri ? `https://${track.coverUri.replace('%%', '400x400')}` : undefined,
          preview_url: undefined, // Превью требуют дополнительных запросов
          available: track.available,
        };
      });

    console.log(`Processed ${processedTracks.length} available tracks.`);

    // Формируем и отправляем успешный ответ
    const result = {
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

module.exports = { default: handler };