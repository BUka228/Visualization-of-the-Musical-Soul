/**
 * Браузерный тест Yandex Music API
 * Скопируйте этот код в консоль браузера на странице music.yandex.ru
 */

async function testYandexMusicAPI() {
    console.log('🎵 Тестирование Yandex Music API в браузере');
    console.log('==========================================');
    
    const token = 'available';
    console.log(`Токен: ${token}`);
    console.log('');

    const headers = {
        'Authorization': `OAuth ${token}`,
        'User-Agent': 'Yandex-Music-API/1.0',
        'Content-Type': 'application/json'
    };

    try {
        // Тест 1: Проверка аутентификации
        console.log('📋 Тест 1: Проверка аутентификации...');
        const userResponse = await fetch('https://api.music.yandex.net/account/status', {
            method: 'GET',
            headers: headers
        });

        console.log(`   Статус: ${userResponse.status}`);
        
        if (!userResponse.ok) {
            const errorData = await userResponse.json().catch(() => userResponse.text());
            console.log(`   ❌ Ошибка аутентификации:`, errorData);
            return;
        }

        const userData = await userResponse.json();
        const userId = userData.result?.account?.uid;
        console.log(`   ✅ Успешно! User ID: ${userId}`);
        console.log('   Данные пользователя:', userData.result?.account);
        console.log('');

        if (!userId) {
            console.log('   ❌ Не удалось получить ID пользователя');
            return;
        }

        // Тест 2: Получение лайкнутых треков
        console.log('❤️ Тест 2: Получение лайкнутых треков...');
        const likesResponse = await fetch(`https://api.music.yandex.net/users/${userId}/likes/tracks`, {
            method: 'GET',
            headers: headers
        });

        console.log(`   Статус: ${likesResponse.status}`);
        
        if (!likesResponse.ok) {
            const errorData = await likesResponse.json().catch(() => likesResponse.text());
            console.log(`   ❌ Ошибка получения лайков:`, errorData);
            return;
        }

        const likesData = await likesResponse.json();
        const trackIds = likesData.result?.library?.tracks?.map(track => track.id) || [];
        console.log(`   ✅ Найдено лайкнутых треков: ${trackIds.length}`);
        console.log('   Первые 10 ID:', trackIds.slice(0, 10));
        console.log('');

        if (trackIds.length === 0) {
            console.log('   ℹ️ У пользователя нет лайкнутых треков');
            return;
        }

        // Тест 3: Получение информации о первых 5 треках
        console.log('🎵 Тест 3: Получение информации о треках...');
        const testTrackIds = trackIds.slice(0, 5);
        console.log(`   Тестируем треки: ${testTrackIds.join(', ')}`);

        const tracksResponse = await fetch('https://api.music.yandex.net/tracks', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                'track-ids': testTrackIds,
                'with-positions': false
            })
        });

        console.log(`   Статус: ${tracksResponse.status}`);
        
        if (!tracksResponse.ok) {
            const errorData = await tracksResponse.json().catch(() => tracksResponse.text());
            console.log(`   ❌ Ошибка получения треков:`, errorData);
            return;
        }

        const tracksData = await tracksResponse.json();
        const tracks = tracksData.result || [];
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
                console.log(`      Жанр: ${track.albums?.[0]?.genre || 'неизвестно'}`);
                console.log(`      Cover URI: ${track.coverUri || 'нет'}`);
                console.log('');
            });

            // Показываем полную структуру первого трека
            console.log('🔍 Полная структура первого трека:');
            console.log(tracks[0]);
            console.log('');
        }

        // Тест 4: Симуляция обработки как в API
        console.log('🚀 Тест 4: Симуляция обработки треков (как в нашем API)...');
        
        const processedTracks = tracks
            .map((track) => {
                const processed = {
                    id: String(track.id),
                    title: track.title || 'Unknown Title',
                    artist: track.artists?.map((a) => a.name).join(', ') || 'Unknown Artist',
                    album: track.albums?.[0]?.title || 'Unknown Album',
                    duration: Math.floor((track.durationMs || 0) / 1000),
                    genre: track.albums?.[0]?.genre || 'unknown',
                    cover_url: track.coverUri ? `https://${track.coverUri.replace('%%', '400x400')}` : undefined,
                    preview_url: undefined,
                    available: track.available !== false,
                };
                console.log(`   Обработан трек: "${processed.title}" - ${processed.artist} (available: ${processed.available})`);
                return processed;
            })
            .filter((track) => track.title && track.artist);

        console.log('');
        console.log('📈 Результат обработки:');
        console.log(`   Исходных треков: ${tracks.length}`);
        console.log(`   После обработки: ${processedTracks.length}`);
        console.log(`   Доступных после обработки: ${processedTracks.filter(t => t.available).length}`);
        
        if (processedTracks.length > 0) {
            console.log('');
            console.log('✅ Обработанные треки:');
            processedTracks.forEach((track, index) => {
                console.log(`   ${index + 1}. "${track.title}" - ${track.artist} (${track.available ? 'доступен' : 'недоступен'})`);
            });
        } else {
            console.log('');
            console.log('❌ ПРОБЛЕМА: После обработки не осталось треков!');
        }

        // Тест 5: Тестируем наш Vercel API endpoint
        console.log('');
        console.log('🌐 Тест 5: Тестирование нашего API endpoint...');
        
        try {
            const apiResponse = await fetch('/api/getYandexData', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: token })
            });

            console.log(`   Статус API: ${apiResponse.status}`);
            
            if (apiResponse.ok) {
                const apiData = await apiResponse.json();
                console.log(`   ✅ API вернул ${apiData.tracks?.length || 0} треков`);
                console.log('   Метаданные:', apiData.metadata);
                
                if (apiData.tracks && apiData.tracks.length > 0) {
                    console.log('   Пример трека из API:', apiData.tracks[0]);
                }
            } else {
                const errorData = await apiResponse.json().catch(() => apiResponse.text());
                console.log(`   ❌ Ошибка API:`, errorData);
            }
        } catch (apiError) {
            console.log(`   ❌ Ошибка вызова API: ${apiError.message}`);
        }

    } catch (error) {
        console.log(`❌ Ошибка: ${error.message}`);
        console.error(error);
    }
}

// Инструкции для пользователя
console.log(`
🔧 ИНСТРУКЦИЯ ПО ЗАПУСКУ ТЕСТА:

1. Откройте https://music.yandex.ru в браузере
2. Войдите в свой аккаунт Яндекс.Музыки
3. Откройте консоль разработчика (F12)
4. Скопируйте и вставьте этот код в консоль
5. Выполните команду: testYandexMusicAPI()

Код готов к выполнению!
`);

// Экспортируем функцию для использования
if (typeof window !== 'undefined') {
    window.testYandexMusicAPI = testYandexMusicAPI;
}