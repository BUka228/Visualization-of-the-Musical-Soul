import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Прокси-сервер для аудио файлов Яндекс.Музыки
 * Решает проблему CORS при воспроизведении превью
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Обработка CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Принимаем только GET-запросы
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Проверяем, что URL от Яндекс.Музыки
    if (!url.includes('storage.yandex.net') && !url.includes('music.yandex.net')) {
      return res.status(403).json({ error: 'Only Yandex Music URLs are allowed' });
    }

    console.log('🎵 Proxying audio request to:', url);

    // Подготавливаем заголовки для запроса к Яндексу
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'audio/*,*/*;q=0.9',
      'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
      'Referer': 'https://music.yandex.ru/',
      'Origin': 'https://music.yandex.ru'
    };

    // Передаем Range заголовок если есть (для поддержки частичной загрузки)
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    // Делаем запрос к оригинальному URL
    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      console.error(`❌ Failed to fetch audio: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        error: `Failed to fetch audio: ${response.statusText}` 
      });
    }

    // Копируем важные заголовки ответа
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    const acceptRanges = response.headers.get('accept-ranges');
    const contentRange = response.headers.get('content-range');

    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    
    if (acceptRanges) {
      res.setHeader('Accept-Ranges', acceptRanges);
    }
    
    if (contentRange) {
      res.setHeader('Content-Range', contentRange);
    }

    // Устанавливаем статус код (важно для Range запросов)
    res.status(response.status);

    // Передаем аудио данные
    if (response.body) {
      const reader = response.body.getReader();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          res.write(Buffer.from(value));
        }
      } finally {
        reader.releaseLock();
      }
    }

    res.end();

  } catch (error) {
    console.error('❌ Audio proxy error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return res.status(500).json({
      error: 'Failed to proxy audio request',
      details: errorMessage
    });
  }
}