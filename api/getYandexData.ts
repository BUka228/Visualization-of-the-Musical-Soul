import type { VercelRequest, VercelResponse } from '@vercel/node';

// Интерфейсы для данных Яндекс.Музыки
interface DownloadInfo {
  codec: string;
  bitrateInKbps: number;
  downloadInfoUrl: string;
  direct: boolean;
}

interface ProcessedTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  genre: string;
  cover_url?: string;
  preview_url?: string;
  download_urls?: DownloadInfo[];
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
    } else {
      console.log('❌ No tracks fetched! Debugging batch requests...');
      // Попробуем получить хотя бы один трек для отладки
      if (trackIds.length > 0) {
        const singleTrackId = trackIds[0];
        console.log(`Trying to fetch single track: ${singleTrackId}`);
        
        try {
          const singleTrackResponse = await fetch(`${baseURL}/tracks?track-ids=${singleTrackId}`, {
            method: 'GET',
            headers
          });
          
          console.log(`Single track response status: ${singleTrackResponse.status}`);
          
          if (singleTrackResponse.ok) {
            const singleTrackData = await singleTrackResponse.json();
            console.log('Single track data:', JSON.stringify(singleTrackData, null, 2));
          } else {
            const errorText = await singleTrackResponse.text();
            console.log('Single track error:', errorText);
          }
        } catch (singleTrackError) {
          console.log('Single track fetch error:', singleTrackError instanceof Error ? singleTrackError.message : 'Unknown error');
        }
      }
    }

    // Получаем ссылки на превью и скачивание для треков
    console.log('Fetching download info for tracks...');
    const tracksWithDownloadInfo: any[] = [];
    
    // Обрабатываем треки батчами для получения ссылок на скачивание
    const downloadBatchSize = 50; // Меньший размер батча для download info
    
    for (let i = 0; i < allTracks.length; i += downloadBatchSize) {
      const batch = allTracks.slice(i, i + downloadBatchSize);
      const trackIds = batch.map(track => track.id);
      
      try {
        // Получаем информацию о скачивании
        const downloadInfoResponse = await fetch(`${baseURL}/tracks/${trackIds.join(',')}/download-info`, {
          method: 'GET',
          headers
        });

        if (downloadInfoResponse.ok) {
          const downloadInfoData = await downloadInfoResponse.json();
          const downloadInfos = downloadInfoData.result || [];
          
          // Объединяем информацию о треках с информацией о скачивании
          batch.forEach((track, index) => {
            const downloadInfo = downloadInfos.find((info: any) => info.trackId === track.id);
            tracksWithDownloadInfo.push({
              ...track,
              downloadInfo: downloadInfo
            });
          });
        } else {
          // Если не удалось получить download info, добавляем треки без него
          tracksWithDownloadInfo.push(...batch);
        }
      } catch (downloadError) {
        console.log(`Error fetching download info for batch ${Math.floor(i/downloadBatchSize) + 1}:`, downloadError);
        // Добавляем треки без download info
        tracksWithDownloadInfo.push(...batch);
      }
      
      // Небольшая пауза между запросами
      if (i + downloadBatchSize < allTracks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Processed download info for ${tracksWithDownloadInfo.length} tracks.`);

    // Обрабатываем треки с улучшенной информацией
    const processedTracks: ProcessedTrack[] = tracksWithDownloadInfo
      .map((track: any): ProcessedTrack => {
        // Пытаемся найти превью URL и полные ссылки на скачивание
        let previewUrl: string | undefined = undefined;
        let downloadUrls: DownloadInfo[] = [];
        
        if (track.downloadInfo && Array.isArray(track.downloadInfo)) {
          // Обрабатываем все доступные форматы
          downloadUrls = track.downloadInfo.map((info: any) => ({
            codec: info.codec || 'unknown',
            bitrateInKbps: info.bitrateInKbps || 0,
            downloadInfoUrl: info.downloadInfoUrl || '',
            direct: info.direct || false
          }));
          
          // Ищем превью среди доступных форматов (низкое качество для превью)
          const previewInfo = track.downloadInfo.find((info: any) => 
            info.codec === 'mp3' && info.bitrateInKbps <= 128
          ) || track.downloadInfo.find((info: any) => info.codec === 'mp3') || track.downloadInfo[0];
          
          if (previewInfo && previewInfo.downloadInfoUrl) {
            previewUrl = previewInfo.downloadInfoUrl;
          }
        }

        return {
          id: String(track.id),
          title: track.title || 'Unknown Title',
          artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
          album: track.albums?.[0]?.title || 'Unknown Album',
          duration: Math.floor((track.durationMs || 0) / 1000),
          genre: track.albums?.[0]?.genre || 'unknown',
          cover_url: track.coverUri ? `https://${track.coverUri.replace('%%', '400x400')}` : undefined,
          preview_url: previewUrl,
          download_urls: downloadUrls.length > 0 ? downloadUrls : undefined,
          available: track.available !== false,
        };
      })
      .filter((track: ProcessedTrack) => track.title && track.artist);

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

