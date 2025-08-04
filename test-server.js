/**
 * Тест исправленного API с настоящим OAuth токеном
 * Запускается в Node.js для тестирования Vercel API
 */

const https = require('https');

const OAUTH_TOKEN = 'y0_AgAAAAAj2vgeAAG8XgAAAAEJa-6RAAAdPHm_OlpI_4ludZXEeCSbWupQkA';

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
                } catch (error) {
                    resolve({ status: res.statusCode, data: data, headers: res.headers });
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

async function testFixedAPI() {
    console.log('🚀 Тестирование исправленного API');
    console.log('================================');
    console.log(`OAuth токен: ${OAUTH_TOKEN.substring(0, 20)}...`);
    console.log('');

    try {
        // Тест нашего исправленного API
        console.log('🌐 Тестируем наш исправленный Vercel API...');
        
        const apiResponse = await makeRequest('https://visualization-of-the-musical-soul.vercel.app/api/getYandexData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: OAUTH_TOKEN })
        });

        console.log(`Статус API: ${apiResponse.status}`);
        
        if (apiResponse.status === 200) {
            const data = apiResponse.data;
            console.log('✅ API работает успешно!');
            console.log(`📊 Статистика:`);
            console.log(`   Всего треков: ${data.tracks?.length || 0}`);
            console.log(`   Источник: ${data.metadata?.source}`);
            console.log(`   Время генерации: ${data.metadata?.generated_at}`);
            
            if (data.tracks && data.tracks.length > 0) {
                const availableCount = data.tracks.filter(t => t.available).length;
                const withPreviewCount = data.tracks.filter(t => t.preview_url).length;
                
                console.log(`   Доступных треков: ${availableCount}`);
                console.log(`   С превью: ${withPreviewCount}`);
                console.log('');
                console.log('🎵 Примеры треков:');
                
                data.tracks.slice(0, 5).forEach((track, index) => {
                    console.log(`   ${index + 1}. "${track.title}" - ${track.artist}`);
                    console.log(`      Альбом: ${track.album}`);
                    console.log(`      Жанр: ${track.genre}`);
                    console.log(`      Доступен: ${track.available ? '✅' : '❌'}`);
                    console.log('');
                });
                
                console.log('🎉 УСПЕХ! Проблема решена!');
                console.log(`🎯 Ожидаемый результат в приложении: ${data.tracks.length} треков`);
            } else {
                console.log('❌ API не вернул треков');
            }
        } else {
            console.log(`❌ Ошибка API: ${apiResponse.status}`);
            console.log('Детали ошибки:', JSON.stringify(apiResponse.data, null, 2));
        }

    } catch (error) {
        console.log(`❌ Ошибка тестирования: ${error.message}`);
    }
}

// Запускаем тест
testFixedAPI().then(() => {
    console.log('');
    console.log('✅ Тестирование завершено');
}).catch((error) => {
    console.log(`❌ Критическая ошибка: ${error.message}`);
});