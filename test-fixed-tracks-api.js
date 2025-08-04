// Исправленный браузерный тест Yandex Music API
async function testYandexMusicAPIFixed() {
    console.log('🎵 Тестирование Yandex Music API в браузере (исправленная версия)');
    const token = 'y0_AgAAAAAj2vgeAAG8XgAAAAEJa-6RAAAdPHm_OlpI_4ludZXEeCSbWupQkA';
    const headers = {
        'Authorization': `OAuth ${token}`,
        'User-Agent': 'Yandex-Music-API/1.0',
        'Content-Type': 'application/json'
    };

    try {
        // Проверка аутентификации
        console.log('📋 Шаг 1: Проверка аутентификации...');
        const userResponse = await fetch('https://api.music.yandex.net/account/status', {
            method: 'GET', 
            headers: headers
        });
        console.log('Статус аутентификации:', userResponse.status);
        
        if (userResponse.ok) {
            const userData = await userResponse.json();
            const userId = userData.result?.account?.uid;
            console.log('✅ User ID:', userId);
            
            // Получение лайков
            console.log('❤️ Шаг 2: Получение лайкнутых треков...');
            const likesResponse = await fetch(`https://api.music.yandex.net/users/${userId}/likes/tracks`, {
                method: 'GET', 
                headers: headers
            });
            
            if (likesResponse.ok) {
                const likesData = await likesResponse.json();
                const trackIds = likesData.result?.library?.tracks?.map(track => track.id) || [];
                console.log('✅ Найдено лайкнутых треков:', trackIds.length);
                
                if (trackIds.length > 0) {
                    // Тестируем разные форматы запроса треков
                    console.log('🎵 Шаг 3: Тестирование разных форматов запроса треков...');
                    
                    const testTrackIds = trackIds.slice(0, 3);
                    console.log('Тестируем треки:', testTrackIds);
                    
                    // Вариант 1: Массив строк
                    console.log('🔧 Вариант 1: Массив строк...');
                    try {
                        const tracksResponse1 = await fetch('https://api.music.yandex.net/tracks', {
                            method: 'POST', 
                            headers: headers,
                            body: JSON.stringify(testTrackIds)
                        });
                        console.log('Статус варианта 1:', tracksResponse1.status);
                        
                        if (tracksResponse1.ok) {
                            const tracksData1 = await tracksResponse1.json();
                            const tracks1 = tracksData1.result || [];
                            console.log('✅ Вариант 1 работает! Получено треков:', tracks1.length);
                            console.log('Доступных:', tracks1.filter(t => t.available).length);
                            console.log('Недоступных:', tracks1.filter(t => !t.available).length);
                            console.log('Пример трека:', tracks1[0]);
                            return tracks1; // Успех!
                        } else {
                            const errorText1 = await tracksResponse1.text();
                            console.log('❌ Вариант 1 не работает:', errorText1);
                        }
                    } catch (error1) {
                        console.log('❌ Ошибка варианта 1:', error1.message);
                    }
                    
                    // Вариант 2: Объект с track-ids
                    console.log('🔧 Вариант 2: Объект с track-ids...');
                    try {
                        const tracksResponse2 = await fetch('https://api.music.yandex.net/tracks', {
                            method: 'POST', 
                            headers: headers,
                            body: JSON.stringify({
                                'track-ids': testTrackIds,
                                'with-positions': false
                            })
                        });
                        console.log('Статус варианта 2:', tracksResponse2.status);
                        
                        if (tracksResponse2.ok) {
                            const tracksData2 = await tracksResponse2.json();
                            const tracks2 = tracksData2.result || [];
                            console.log('✅ Вариант 2 работает! Получено треков:', tracks2.length);
                            console.log('Доступных:', tracks2.filter(t => t.available).length);
                            console.log('Недоступных:', tracks2.filter(t => !t.available).length);
                            console.log('Пример трека:', tracks2[0]);
                            return tracks2; // Успех!
                        } else {
                            const errorText2 = await tracksResponse2.text();
                            console.log('❌ Вариант 2 не работает:', errorText2);
                        }
                    } catch (error2) {
                        console.log('❌ Ошибка варианта 2:', error2.message);
                    }
                    
                    // Вариант 3: GET запрос с параметрами
                    console.log('🔧 Вариант 3: GET запрос с параметрами...');
                    try {
                        const trackIdsParam = testTrackIds.join(',');
                        const tracksResponse3 = await fetch(`https://api.music.yandex.net/tracks?track-ids=${trackIdsParam}`, {
                            method: 'GET', 
                            headers: headers
                        });
                        console.log('Статус варианта 3:', tracksResponse3.status);
                        
                        if (tracksResponse3.ok) {
                            const tracksData3 = await tracksResponse3.json();
                            const tracks3 = tracksData3.result || [];
                            console.log('✅ Вариант 3 работает! Получено треков:', tracks3.length);
                            console.log('Доступных:', tracks3.filter(t => t.available).length);
                            console.log('Недоступных:', tracks3.filter(t => !t.available).length);
                            console.log('Пример трека:', tracks3[0]);
                            return tracks3; // Успех!
                        } else {
                            const errorText3 = await tracksResponse3.text();
                            console.log('❌ Вариант 3 не работает:', errorText3);
                        }
                    } catch (error3) {
                        console.log('❌ Ошибка варианта 3:', error3.message);
                    }
                    
                    // Вариант 4: Отдельные запросы для каждого трека
                    console.log('🔧 Вариант 4: Отдельные запросы для каждого трека...');
                    try {
                        const singleTrackId = testTrackIds[0];
                        const singleTrackResponse = await fetch(`https://api.music.yandex.net/tracks/${singleTrackId}`, {
                            method: 'GET', 
                            headers: headers
                        });
                        console.log('Статус варианта 4 (один трек):', singleTrackResponse.status);
                        
                        if (singleTrackResponse.ok) {
                            const singleTrackData = await singleTrackResponse.json();
                            console.log('✅ Вариант 4 работает! Данные одного трека:', singleTrackData);
                            return [singleTrackData.result]; // Успех!
                        } else {
                            const errorText4 = await singleTrackResponse.text();
                            console.log('❌ Вариант 4 не работает:', errorText4);
                        }
                    } catch (error4) {
                        console.log('❌ Ошибка варианта 4:', error4.message);
                    }
                    
                    // Вариант 5: Проверим структуру ID треков
                    console.log('🔍 Вариант 5: Анализ структуры ID треков...');
                    console.log('Первые 5 ID треков:', trackIds.slice(0, 5));
                    console.log('Типы ID:', trackIds.slice(0, 5).map(id => typeof id));
                    console.log('Примеры ID:', trackIds.slice(0, 5).map(id => `"${id}"`));
                    
                    // Попробуем с числовыми ID
                    const numericIds = testTrackIds.map(id => parseInt(id));
                    console.log('Числовые ID:', numericIds);
                    
                    try {
                        const tracksResponse5 = await fetch('https://api.music.yandex.net/tracks', {
                            method: 'POST', 
                            headers: headers,
                            body: JSON.stringify(numericIds)
                        });
                        console.log('Статус варианта 5 (числовые ID):', tracksResponse5.status);
                        
                        if (tracksResponse5.ok) {
                            const tracksData5 = await tracksResponse5.json();
                            const tracks5 = tracksData5.result || [];
                            console.log('✅ Вариант 5 работает! Получено треков:', tracks5.length);
                            return tracks5; // Успех!
                        } else {
                            const errorText5 = await tracksResponse5.text();
                            console.log('❌ Вариант 5 не работает:', errorText5);
                        }
                    } catch (error5) {
                        console.log('❌ Ошибка варианта 5:', error5.message);
                    }
                    
                    console.log('❌ Все варианты не сработали. Возможно, изменился API.');
                }
            } else {
                console.log('❌ Ошибка получения лайков:', likesResponse.status);
            }
        } else {
            console.log('❌ Ошибка аутентификации:', userResponse.status);
        }
    } catch (error) {
        console.error('❌ Критическая ошибка:', error);
    }
}

// Запуск исправленного теста
testYandexMusicAPIFixed();