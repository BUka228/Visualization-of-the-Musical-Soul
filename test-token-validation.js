/**
 * Тест валидации OAuth токена Яндекс.Музыки
 * Используйте настоящий OAuth токен, полученный через get-real-token.html
 */

// ВСТАВЬТЕ СЮДА ВАШ НАСТОЯЩИЙ OAUTH ТОКЕН
const REAL_OAUTH_TOKEN = 'ВСТАВЬТЕ_СЮДА_ВАШ_ТОКЕН';

async function testRealToken() {
    console.log('🔑 Тестирование настоящего OAuth токена');
    console.log('=====================================');
    
    if (REAL_OAUTH_TOKEN === 'ВСТАВЬТЕ_СЮДА_ВАШ_ТОКЕН') {
        console.log('❌ ОШИБКА: Замените REAL_OAUTH_TOKEN на ваш настоящий токен!');
        console.log('');
        console.log('📋 Инструкция:');
        console.log('1. Откройте get-real-token.html в браузере');
        console.log('2. Получите OAuth токен по инструкции');
        console.log('3. Замените REAL_OAUTH_TOKEN в этом файле на полученный токен');
        console.log('4. Запустите скрипт снова: node test-token-validation.js');
        return;
    }

    console.log(`Токен: ${REAL_OAUTH_TOKEN.substring(0, 15)}...`);
    console.log('');

    const https = require('https');

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

    const headers = {
        'Authorization': `OAuth ${REAL_OAUTH_TOKEN}`,
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
            console.log('');
            console.log('💡 Возможные причины:');
            console.log('   1. Токен истек (OAuth токены имеют ограниченный срок действия)');
            console.log('   2. Токен скопирован неполностью');
            console.log('   3. Токен поврежден при копировании');
            console.log('');
            console.log('🔄 Решение: Получите новый токен через get-real-token.html');
            return;
        }

        const userId = userResponse.data.result?.account?.uid;
        console.log(`   ✅ Успешно! User ID: ${userId}`);
        console.log(`   Аккаунт: ${userResponse.data.result?.account?.login || 'Неизвестно'}`);
        console.log('');

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
            console.log('   💡 Добавьте несколько треков в "Мне нравится" в Яндекс.Музыке');
            return;
        }

        // Тест 3: Получение информации о треках
        console.log('🎵 Тест 3: Получение информации о треках...');
        const testTrackIds = trackIds.slice(0, 10); // Тестируем первые 10 треков
        console.log(`   Тестируем ${testTrackIds.length} треков`);

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

        // Анализ треков
        console.log('📊 Анализ треков:');
        const availableCount = tracks.filter(t => t.available).length;
        const unavailableCount = tracks.filter(t => !t.available).length;
        const withTitleCount = tracks.filter(t => t.title).length;
        const withArtistsCount = tracks.filter(t => t.artists && t.artists.length > 0).length;
        
        console.log(`   Всего треков: ${tracks.length}`);
        console.log(`   Доступных: ${availableCount} (${Math.round(availableCount/tracks.length*100)}%)`);
        console.log(`   Недоступных: ${unavailableCount} (${Math.round(unavailableCount/tracks.length*100)}%)`);
        console.log(`   С названием: ${withTitleCount}`);
        console.log(`   С исполнителями: ${withArtistsCount}`);
        console.log('');

        // Примеры треков
        console.log('🎼 Примеры треков:');
        tracks.slice(0, 5).forEach((track, index) => {
            console.log(`   ${index + 1}. "${track.title || 'Без названия'}" - ${track.artists?.map(a => a.name).join(', ') || 'Неизвестный исполнитель'}`);
            console.log(`      Доступен: ${track.available ? '✅' : '❌'}`);
            console.log(`      Альбом: ${track.albums?.[0]?.title || 'Неизвестно'}`);
            console.log(`      Длительность: ${Math.floor((track.durationMs || 0) / 1000)}с`);
            console.log('');
        });

        // Симуляция обработки как в нашем API
        console.log('🔄 Симуляция обработки (как в нашем API):');
        
        const processedTracks = tracks
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

        console.log(`   Исходных треков: ${tracks.length}`);
        console.log(`   После обработки: ${processedTracks.length}`);
        console.log(`   Отфильтровано: ${tracks.length - processedTracks.length}`);
        console.log('');

        if (processedTracks.length === 0) {
            console.log('❌ ПРОБЛЕМА НАЙДЕНА!');
            console.log('   После обработки не осталось треков');
            console.log('   Причины:');
            console.log('   - Все треки не имеют названия или исполнителя');
            console.log('   - Проблема с структурой данных API');
            console.log('');
            console.log('🔍 Детальный анализ первого трека:');
            if (tracks.length > 0) {
                console.log(JSON.stringify(tracks[0], null, 2));
            }
        } else {
            console.log('✅ Обработка прошла успешно!');
            console.log('   Примеры обработанных треков:');
            processedTracks.slice(0, 3).forEach((track, index) => {
                console.log(`   ${index + 1}. "${track.title}" - ${track.artist}`);
            });
        }

        console.log('');
        console.log('🎯 ЗАКЛЮЧЕНИЕ:');
        if (processedTracks.length > 0) {
            console.log('✅ Токен работает корректно, треки обрабатываются успешно');
            console.log(`✅ Ожидаемое количество треков в приложении: ${Math.round(processedTracks.length * trackIds.length / testTrackIds.length)}`);
        } else {
            console.log('❌ Найдена проблема с обработкой треков');
            console.log('💡 Нужно исправить логику фильтрации в API');
        }

    } catch (error) {
        console.log(`❌ Ошибка: ${error.message}`);
        console.log('');
        console.log('💡 Возможные причины:');
        console.log('   1. Проблемы с сетью');
        console.log('   2. Токен истек');
        console.log('   3. Изменения в API Яндекс.Музыки');
    }
}

// Запускаем тест
testRealToken().then(() => {
    console.log('');
    console.log('✅ Тестирование завершено');
}).catch((error) => {
    console.log(`❌ Критическая ошибка: ${error.message}`);
});

// Экспорт для использования в других модулях
module.exports = { testRealToken };