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
 * Обрабатывает информацию о скачивании для одного трека
 */
async function processTrackDownloadInfo(track: any, baseURL: string, headers: any): Promise<any> {
  try {
    const downloadInfoResponse = await fetch(`${baseURL}/tracks/${track.id}/download-info`, {
      method: 'GET',
      headers
    });

    if (downloadInfoResponse.ok) {
      const downloadInfoData = await downloadInfoResponse.json();
      const downloadInfos = downloadInfoData.result || [];
      
      // Получаем прямые ссылки для первых 2 форматов (для производительности)
      const downloadInfosWithDirectLinks = await Promise.all(
        downloadInfos.slice(0, 2).map(async (info: any) => {
          try {
            if (info.downloadInfoUrl) {
              const directLinkResponse = await fetch(info.downloadInfoUrl, {
                method: 'GET',
                headers
              });
              
              if (directLinkResponse.ok) {
                const xmlData = await directLinkResponse.text();
                
                // Парсим XML для получения прямой ссылки
                const hostMatch = xmlData.match(/<host>([^<]+)<\/host>/);
                const pathMatch = xmlData.match(/<path>([^<]+)<\/path>/);
                const tsMatch = xmlData.match(/<ts>([^<]+)<\/ts>/);
                const sMatch = xmlData.match(/<s>([^<]+)<\/s>/);
                
                if (hostMatch && pathMatch && tsMatch && sMatch) {
                  const directUrl = `https://${hostMatch[1]}${pathMatch[1]}?ts=${tsMatch[1]}&s=${sMatch[1]}`;
                  return {
                    ...info,
                    directUrl: directUrl
                  };
                }
              }
            }
            return info;
          } catch (directLinkError) {
            console.log(`Error getting direct link for track ${track.id}:`, directLinkError instanceof Error ? directLinkError.message : 'Unknown error');
            return info;
          }
        })
      );
      
      return {
        ...track,
        downloadInfo: downloadInfosWithDirectLinks
      };
    } else {
      return track;
    }
  } catch (trackDownloadError) {
    console.log(`Error getting download info for track ${track.id}:`, trackDownloadError instanceof Error ? trackDownloadError.message : 'Unknown error');
    return track;
  }
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
    
    // Настраиваемый лимит превью (можно передать в query параметрах)
    const previewLimitParam = req.query.previewLimit as string;
    const maxTracksForPreview = previewLimitParam ? parseInt(previewLimitParam) : allTracks.length;
    
    // Определяем режим загрузки и оптимизации
    let actualPreviewLimit: number;
    let downloadBatchSize: number;
    let requestDelay: number;
    
    if (maxTracksForPreview === -2) {
      // ТУРБО-режим для очень больших библиотек (500+ треков)
      actualPreviewLimit = allTracks.length; // Все треки
      downloadBatchSize = 20; // Максимальный размер батча
      requestDelay = 25; // Минимальная задержка
      console.log(`⚡ ТУРБО-РЕЖИМ: ${allTracks.length} треков с максимальной скоростью`);
    } else if (maxTracksForPreview === -1) {
      // Режим максимальной оптимизации для больших библиотек
      actualPreviewLimit = allTracks.length; // Все треки
      downloadBatchSize = 10; // Увеличиваем размер батча
      requestDelay = 50; // Уменьшаем задержку
      console.log(`🚀 МАКСИМАЛЬНАЯ ЗАГРУЗКА: ${allTracks.length} треков с оптимизацией`);
    } else if (maxTracksForPreview === 0) {
      // Стандартный режим "все треки"
      actualPreviewLimit = allTracks.length;
      downloadBatchSize = 5;
      requestDelay = 100;
      console.log(`📚 Стандартная загрузка всех ${allTracks.length} треков`);
    } else {
      // Ограниченный режим
      actualPreviewLimit = maxTracksForPreview;
      downloadBatchSize = 5;
      requestDelay = 100;
      console.log(`⚙️ Ограниченная загрузка: ${actualPreviewLimit} треков с превью`);
    }
    
    // Обрабатываем все треки, но превью получаем только для указанного количества
    const tracksToProcess = allTracks.slice(0, Math.min(actualPreviewLimit, allTracks.length));
    const remainingTracks = allTracks.slice(tracksToProcess.length);
    
    console.log(`Processing preview for ${tracksToProcess.length} tracks, basic info for ${remainingTracks.length} tracks`);
    
    // В ТУРБО-режиме используем параллельную обработку нескольких батчей
    if (maxTracksForPreview === -2 && tracksToProcess.length > 100) {
      console.log(`⚡ Запуск параллельной обработки для ${tracksToProcess.length} треков`);
      
      // Разбиваем на супер-батчи для параллельной обработки
      const superBatchSize = Math.ceil(tracksToProcess.length / 4); // 4 параллельных потока
      const superBatches = [];
      
      for (let i = 0; i < tracksToProcess.length; i += superBatchSize) {
        superBatches.push(tracksToProcess.slice(i, i + superBatchSize));
      }
      
      console.log(`Создано ${superBatches.length} параллельных потоков`);
      
      // Обрабатываем супер-батчи параллельно
      const allBatchResults = await Promise.all(
        superBatches.map(async (superBatch, superBatchIndex) => {
          console.log(`Поток ${superBatchIndex + 1}: обработка ${superBatch.length} треков`);
          const batchResults = [];
          
          for (let i = 0; i < superBatch.length; i += downloadBatchSize) {
            const batch = superBatch.slice(i, i + downloadBatchSize);
            
            try {
              const batchWithDownloadInfo = await Promise.all(
                batch.map(async (track) => {
                  return await processTrackDownloadInfo(track, baseURL, headers);
                })
              );
              
              batchResults.push(...batchWithDownloadInfo);
              
              // Минимальная задержка только в ТУРБО-режиме
              if (i + downloadBatchSize < superBatch.length) {
                await new Promise(resolve => setTimeout(resolve, requestDelay));
              }
            } catch (error) {
              console.log(`Ошибка в потоке ${superBatchIndex + 1}, батч ${Math.floor(i/downloadBatchSize) + 1}:`, error);
              batchResults.push(...batch);
            }
          }
          
          console.log(`Поток ${superBatchIndex + 1} завершен: ${batchResults.length} треков`);
          return batchResults;
        })
      );
      
      // Объединяем результаты всех потоков
      tracksWithDownloadInfo.push(...allBatchResults.flat());
      
    } else {
      // Стандартная последовательная обработка
      for (let i = 0; i < tracksToProcess.length; i += downloadBatchSize) {
        const batch = tracksToProcess.slice(i, i + downloadBatchSize);
        
        try {
          // Получаем информацию о скачивании для каждого трека отдельно
          const batchWithDownloadInfo = await Promise.all(
            batch.map(async (track) => {
              return await processTrackDownloadInfo(track, baseURL, headers);
            })
          );
          
          tracksWithDownloadInfo.push(...batchWithDownloadInfo);
        } catch (downloadError) {
          console.log(`Error fetching download info for batch ${Math.floor(i/downloadBatchSize) + 1}:`, downloadError instanceof Error ? downloadError.message : 'Unknown error');
          // Добавляем треки без download info
          tracksWithDownloadInfo.push(...batch);
        }
        
        // Динамическая пауза между запросами в зависимости от режима
        if (i + downloadBatchSize < tracksToProcess.length) {
          await new Promise(resolve => setTimeout(resolve, requestDelay));
        }
      }
    }

    // Добавляем оставшиеся треки без превью
    tracksWithDownloadInfo.push(...remainingTracks);

    console.log(`Processed download info for ${tracksWithDownloadInfo.length} tracks (${actualPreviewLimit} with preview attempts).`);

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
            info.codec === 'mp3' && info.bitrateInKbps <= 192 && info.directUrl
          ) || track.downloadInfo.find((info: any) => info.codec === 'mp3' && info.directUrl) || track.downloadInfo.find((info: any) => info.directUrl);
          
          if (previewInfo && previewInfo.directUrl) {
            // Возвращаем прямую ссылку - AudioManager сам будет использовать прокси
            previewUrl = previewInfo.directUrl;
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

