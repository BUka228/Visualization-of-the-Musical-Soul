import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Безопасный прокси-сервер для аудио файлов Яндекс.Музыки
 * Принимает POST-запрос с URL и токеном, возвращает аудио как Blob
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { url, token } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // ВАЖНО: Добавляем проверку токена
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token is required' });
    }

    if (!url.includes('storage.yandex.net')) {
      return res.status(403).json({ error: 'Only Yandex Music URLs are allowed' });
    }

    console.log('🎵 Proxying audio request for:', url);

    const headers: Record<string, string> = {
      // ВАЖНО: Добавляем заголовок авторизации
      'Authorization': `OAuth ${token}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'audio/*,*/*;q=0.9',
      'Referer': 'https://music.yandex.ru/',
      'Origin': 'https://music.yandex.ru'
    };

    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.error(`❌ Failed to fetch audio: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      return res.status(response.status).json({
        error: `Failed to fetch audio from Yandex: ${response.statusText}`,
        details: errorBody
      });
    }

    // Копируем важные заголовки от Яндекса
    res.setHeader('Content-Type', response.headers.get('content-type') || 'audio/mpeg');
    if(response.headers.get('content-length')) res.setHeader('Content-Length', response.headers.get('content-length')!);
    if(response.headers.get('accept-ranges')) res.setHeader('Accept-Ranges', response.headers.get('accept-ranges')!);

    // Передаем аудиоданные клиенту
    res.status(response.status);
    const bodyBuffer = await response.arrayBuffer();
    res.send(Buffer.from(bodyBuffer));

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Audio proxy internal error:', errorMessage);
    return res.status(500).json({ error: 'Internal proxy error', details: errorMessage });
  }
}