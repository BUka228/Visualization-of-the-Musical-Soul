const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// API route - импортируем нашу Vercel функцию
app.post('/api/getYandexData', async (req, res) => {
  try {
    // Импортируем функцию из api/getYandexData.js
    const handler = require('./api/getYandexData.js').default;
    
    // Создаем mock объекты для Vercel Request/Response
    const mockReq = {
      method: 'POST',
      body: req.body,
      headers: req.headers
    };
    
    const mockRes = {
      status: (code) => ({
        json: (data) => res.status(code).json(data),
        end: () => res.status(code).end()
      }),
      setHeader: (name, value) => res.setHeader(name, value)
    };
    
    await handler(mockReq, mockRes);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Serve test page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-api.html'));
});

app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log('Open this URL in your browser to test the API');
});