import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Обрабатываем preflight запрос
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('Test API called with method:', req.method);
    console.log('Request body:', req.body);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Test API works!',
      method: req.method,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test API error:', error);
    return res.status(500).json({ 
      error: 'Test API failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}