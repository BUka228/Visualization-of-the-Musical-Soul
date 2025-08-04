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

interface MusicDataResponse {
  metadata: {
    total_tracks: number;
    generated_at: string;
    source: string;
  };
  tracks: ProcessedTrack[];
}

// Базовый URL API Яндекс.Музыки
const YANDEX_API_BASE = 'https://api.music.yandex.net';

/**
 * Serverless-функция для получения данных из Яндекс.Музыки
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Обрабатываем preflight запрос
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Принимаем только POST-запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    console.log('API called with method:', req.method);
    console.log('Request headers:', req.headers);
    console.log('Request body type:', typeof req.body);
    
    const { token } = req.body;

    if (!token) {
      console.log('No token provided');
      return res.status(400).json({ error: 'Token is required' });
    }

    console.log('Token received, length:', token.length);
    console.log('Получение данных из Яндекс.Музыки...');

    // Сначала просто проверим токен
    try {
      const testResponse = await fetch(`${YANDEX_API_BASE}/account/status`, {
        headers: {
          'Authorization': `OAuth ${token}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log('Token test response status:', testResponse.status);
      
      if (!testResponse.ok) {
        throw new Error(`Token validation failed: HTTP ${testResponse.status}`);
      }
      
      const accountData = await testResponse.json();
      console.log('Account data received:', !!accountData.result);
      
    } catch (tokenError) {
      console.error('Token validation error:', tokenError);
      throw tokenError;
    }

    // Получаем лайкнутые треки
    const likedTracks = await fetchLikedTracks(token);
    console.log(`Найдено ${likedTracks.length} лайкнутых треков`);

    // Для начала вернем только первые 5 треков для тестирования
    const limitedTracks = likedTracks.slice(0, 5);
    console.log(`Обрабатываем ${limitedTracks.length} треков для тестирования`);

    // Обрабатываем треки батчами для лучшей производительности
    const processedTracks = await processTracksInBatches(limitedTracks, token);
    console.log(`Обработано ${processedTracks.length} треков`);

    // Формируем ответ
    const response: MusicDataResponse = {
      metadata: {
        total_tracks: processedTracks.length,
        generated_at: new Date().toISOString(),
        source: 'Yandex Music API (via Vercel) - Test Mode'
      },
      tracks: processedTracks
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Ошибка API Яндекс.Музыки:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Определяем тип ошибки
    if (errorMessage.toLowerCase().includes('auth') || 
        errorMessage.toLowerCase().includes('unauthorized') ||
        errorMessage.toLowerCase().includes('forbidden')) {
      return res.status(401).json({ 
        error: 'Authorization failed. Check your token.',
        details: errorMessage 
      });
    }

    if (errorMessage.toLowerCase().includes('network') ||
        errorMessage.toLowerCase().includes('fetch')) {
      return res.status(503).json({ 
        error: 'Service temporarily unavailable. Please try again later.',
        details: errorMessage 
      });
    }

    return res.status(500).json({ 
      error: 'Failed to fetch data from Yandex Music', 
      details: errorMessage 
    });
  }
}

/**
 * Получает список лайкнутых треков
 */
async function fetchLikedTracks(token: string): Promise<any[]> {
  const response = await fetch(`${YANDEX_API_BASE}/users/me/likes/tracks`, {
    headers: {
      'Authorization': `OAuth ${token}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Invalid or expired token');
    }
    throw new Error(`Failed to fetch liked tracks: HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.result?.library?.tracks || [];
}

/**
 * Обрабатывает треки батчами
 */
async function processTracksInBatches(tracks: any[], token: string): Promise<ProcessedTrack[]> {
  const processedTracks: ProcessedTrack[] = [];
  const batchSize = 20; // Обрабатываем по 20 треков за раз

  for (let i = 0; i < tracks.length; i += batchSize) {
    const batch = tracks.slice(i, Math.min(i + batchSize, tracks.length));
    
    // Получаем детальную информацию о треках в батче
    const trackIds = batch.map(track => track.id).join(',');
    const detailedTracks = await fetchTrackDetails(trackIds, token);
    
    // Обрабатываем каждый трек в батче
    for (const track of detailedTracks) {
      try {
        const processedTrack = await processTrack(track, token);
        if (processedTrack) {
          processedTracks.push(processedTrack);
        }
      } catch (error) {
        console.warn(`Ошибка обработки трека ${track.id}:`, error);
      }
    }

    // Небольшая пауза между батчами
    if (i + batchSize < tracks.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return processedTracks;
}

/**
 * Получает детальную информацию о треках
 */
async function fetchTrackDetails(trackIds: string, token: string): Promise<any[]> {
  try {
    const response = await fetch(`${YANDEX_API_BASE}/tracks?track-ids=${trackIds}`, {
      headers: {
        'Authorization': `OAuth ${token}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.warn('Ошибка получения деталей треков:', error);
    return [];
  }
}

/**
 * Обрабатывает один трек
 */
async function processTrack(track: any, token: string): Promise<ProcessedTrack | null> {
  try {
    const processedTrack: ProcessedTrack = {
      id: String(track.id),
      title: track.title || 'Unknown Title',
      artist: extractArtist(track.artists),
      album: extractAlbum(track.albums),
      duration: Math.floor((track.durationMs || 0) / 1000),
      genre: extractGenre(track),
      cover_url: extractCoverUrl(track),
      available: track.available !== false
    };

    // Пытаемся получить превью (это может быть медленно, поэтому делаем опционально)
    try {
      processedTrack.preview_url = await getPreviewUrl(track.id, token);
    } catch (error) {
      // Превью не критично, продолжаем без него
      console.warn(`Не удалось получить превью для трека ${track.id}`);
    }

    return processedTrack;
  } catch (error) {
    console.warn(`Ошибка обработки трека ${track.id}:`, error);
    return null;
  }
}

/**
 * Извлекает имя исполнителя
 */
function extractArtist(artists: any[]): string {
  if (!artists || !Array.isArray(artists) || artists.length === 0) {
    return 'Unknown Artist';
  }
  return artists[0].name || 'Unknown Artist';
}

/**
 * Извлекает название альбома
 */
function extractAlbum(albums: any[]): string {
  if (!albums || !Array.isArray(albums) || albums.length === 0) {
    return 'Unknown Album';
  }
  return albums[0].title || 'Unknown Album';
}

/**
 * Извлекает жанр
 */
function extractGenre(track: any): string {
  try {
    // Пробуем получить жанр из исполнителя
    if (track.artists && track.artists[0] && track.artists[0].genres && track.artists[0].genres.length > 0) {
      return track.artists[0].genres[0];
    }
    
    // Пробуем получить жанр из альбома
    if (track.albums && track.albums[0] && track.albums[0].genre) {
      return track.albums[0].genre;
    }
    
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Извлекает URL обложки
 */
function extractCoverUrl(track: any): string | undefined {
  try {
    // Пробуем получить обложку трека
    if (track.coverUri) {
      return `https://${track.coverUri.replace('%%', '400x400')}`;
    }
    
    // Пробуем получить обложку альбома
    if (track.albums && track.albums[0] && track.albums[0].coverUri) {
      return `https://${track.albums[0].coverUri.replace('%%', '400x400')}`;
    }
    
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Получает URL превью трека
 */
async function getPreviewUrl(trackId: string, token: string): Promise<string | undefined> {
  try {
    // Получаем информацию о загрузке трека
    const response = await fetch(`${YANDEX_API_BASE}/tracks/${trackId}/download-info`, {
      headers: {
        'Authorization': `OAuth ${token}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return undefined;
    }

    const data = await response.json();
    const downloadInfo = data.result;

    if (!downloadInfo || downloadInfo.length === 0) {
      return undefined;
    }

    // Ищем превью или самое низкое качество для экономии трафика
    const previewInfo = downloadInfo.find((info: any) => 
      info.codec === 'mp3' && (info.bitrateInKbps <= 128 || info.preview)
    ) || downloadInfo[0];

    if (!previewInfo) {
      return undefined;
    }

    // Получаем прямую ссылку на файл
    const directLinkResponse = await fetch(previewInfo.downloadInfoUrl);
    if (!directLinkResponse.ok) {
      return undefined;
    }

    const directLinkData = await directLinkResponse.text();
    
    // Парсим XML ответ для получения прямой ссылки
    const urlMatch = directLinkData.match(/<host>(.*?)<\/host>.*?<path>(.*?)<\/path>.*?<s>(.*?)<\/s>/s);
    if (!urlMatch) {
      return undefined;
    }

    const [, host, path, s] = urlMatch;
    return `https://${host}/get-mp3/${s}${path}`;

  } catch (error) {
    console.warn(`Ошибка получения превью для трека ${trackId}:`, error);
    return undefined;
  }
}