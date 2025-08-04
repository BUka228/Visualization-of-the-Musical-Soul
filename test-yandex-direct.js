/**
 * Прямой тест Yandex Music API без сервера
 */

const https = require('https');

const TOKEN = 'available';

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

async function testYandexAPI() {
    console.log('🎵 Тестирование Yandex Music API');
    console.log('================================');
    console.log(`Токен: ${TOKEN.substring(0, 10)}...`);
    console.log('');

    const headers = {
        'Authorization': `OAuth ${TOKEN}`,
        'User-Agent': 'Yandex-Music-API/1.0',
        'Content-Type': 'application/json'
    };

    try {
        // Тест 1: Проверка аутентификации
        console.log('📋 Тест 1: Проверка аутентификации...');
        const userResponse = await makeRequest('https://api.music.yandex.net/account/status', {
            method: 'GET',
            headers: headers
        });

        console.log(`   Статус: ${userResponse.status}`);
        
        if (userResponse.status !== 200) {
            console.log(`   ❌ Ошибка аутентификации: ${JSON.stringify(userResponse.data, null, 2)}`);
            return;
        }

        const userId = userResponse.data.result?.account?.uid;
        console.log(`   ✅ Успешно! User ID: ${userId}`);
        console.log('');

        if (!userId) {
            console.log('   ❌ Не удалось получить ID пользователя');
            return;
        }

        // Тест 2: Получение лайкнутых треков
        console.log('❤️ Тест 2: Получение лайкнутых треков...');
        const likesResponse = await makeRequest(`https://api.music.yandex.net/users/${userId}/likes/tracks`, {
            method: 'GET',
            headers: headers
        });

        console.log(`   Статус: ${likesResponse.status}`);
        
        if (likesResponse.status !== 200) {
            console.log(`   ❌ Ошибка получения лайков: ${JSON.stringify(likesResponse.data, null, 2)}`);
            return;
        }

        const trackIds = likesResponse.data.result?.library?.tracks?.map(track => track.id) || [];
        console.log(`   ✅ Найдено лайкнутых треков: ${trackIds.length}`);
        console.log('');

        if (trackIds.length === 0) {
            console.log('   ℹ️ У пользователя нет лайкнутых треков');
            return;
        }

        // Тест 3: Получение информации о первых 5 треках
        console.log('🎵 Тест 3: Получение информации о треках...');
        const testTrackIds = trackIds.slice(0, 5);
        console.log(`   Тестируем треки: ${testTrackIds.join(', ')}`);

        const tracksResponse = await makeRequest('https://api.music.yandex.net/tracks', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                'track-ids': testTrackIds,
                'with-positions': false
            })
        });

        console.log(`   Статус: ${tracksResponse.status}`);
        
        if (tracksResponse.status !== 200) {
            console.log(`   ❌ Ошибка получения треков: ${JSON.stringify(tracksResponse.data, null, 2)}`);
            return;
        }

        const tracks = tracksResponse.data.result || [];
        console.log(`   ✅ Получено треков: ${tracks.length}`);
        console.log('');

        if (tracks.length > 0) {
            console.log('📊 Анализ треков:');
            
            const availableCount = tracks.filter(t => t.available).length;
            const unavailableCount = tracks.filter(t => !t.available).length;
            
            console.log(`   Доступных: ${availableCount}`);
            console.log(`   Недоступных: ${unavailableCount}`);
            console.log('');

            console.log('🎼 Примеры треков:');
            tracks.slice(0, 3).forEach((track, index) => {
                console.log(`   ${index + 1}. "${track.title}" - ${track.artists?.map(a => a.name).join(', ')}`);
                console.log(`      Альбом: ${track.albums?.[0]?.title || 'Неизвестно'}`);
                console.log(`      Доступен: ${track.available ? '✅' : '❌'}`);
                console.log(`      Длительность: ${Math.floor((track.durationMs || 0) / 1000)}с`);
                console.log(`      ID: ${track.id}`);
                console.log('');
            });

            // Показываем полную структуру первого трека
            console.log('🔍 Полная структура первого трека:');
            console.log(JSON.stringify(tracks[0], null, 2));
        }

        // Тест 4: Получение всех лайкнутых треков (как в API)
        console.log('🚀 Тест 4: Получение всех треков (как в API)...');
        
        const batchSize = 100;
        const allTracks = [];
        
        for (let i = 0; i < Math.min(trackIds.length, 200); i += batchSize) { // Ограничиваем 200 треками для теста
            const batch = trackIds.slice(i, i + batchSize);
            console.log(`   Обрабатываем батч ${Math.floor(i/batchSize) + 1}: треки ${i + 1}-${Math.min(i + batchSize, trackIds.length)}`);
            
            const batchResponse = await makeRequest('https://api.music.yandex.net/tracks', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    'track-ids': batch,
                    'with-positions': false
                })
            });

            if (batchResponse.status === 200) {
                const batchTracks = batchResponse.data.result || [];
                allTracks.push(...batchTracks);
                console.log(`   ✅ Получено ${batchTracks.length} треков в батче`);
            } else {
                console.log(`   ❌ Ошибка в батче: ${batchResponse.status}`);
            }
        }

        console.log('');
        console.log('📈 Итоговая статистика:');
        console.log(`   Всего треков получено: ${allTracks.length}`);
        console.log(`   Доступных треков: ${allTracks.filter(t => t.available).length}`);
        console.log(`   Недоступных треков: ${allTracks.filter(t => !t.available).length}`);
        console.log(`   Треков с названием: ${allTracks.filter(t => t.title).length}`);
        console.log(`   Треков с исполнителем: ${allTracks.filter(t => t.artists && t.artists.length > 0).length}`);

        // Проверяем, что происходит с фильтрацией
        const processedTracks = allTracks
            .map((track) => ({
                id: String(track.id),
                title: track.title || 'Unknown Title',
                artist: track.artists?.map((a) => a.name).join(', ') || 'Unknown Artist',
                album: track.albums?.[0]?.title || 'Unknown Album',
                duration: Math.floor((track.durationMs || 0) / 1000),
                genre: track.albums?.[0]?.genre || 'unknown',
                available: track.available !== false,
            }))
            .filter((track) => track.title && track.artist);

        console.log(`   После обработки и фильтрации: ${processedTracks.length}`);
        
        if (processedTracks.length === 0) {
            console.log('');
            console.log('❌ ПРОБЛЕМА: После фильтрации не осталось треков!');
            console.log('   Возможные причины:');
            console.log('   1. Все треки имеют available: false');
            console.log('   2. У треков отсутствуют title или artists');
            console.log('   3. Проблема с структурой данных API');
        }

    } catch (error) {
        console.log(`❌ Ошибка: ${error.message}`);
        console.log(error.stack);
    }
}

// Запускаем тест
testYandexAPI().then(() => {
    console.log('');
    console.log('✅ Тестирование завершено');
}).catch((error) => {
    console.log(`❌ Критическая ошибка: ${error.message}`);
});