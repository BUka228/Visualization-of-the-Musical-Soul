/**
 * Детальный тест получения превью и ссылок на скачивание
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

async function testPreviewAPI() {
    console.log('🎵 Тестирование получения превью и ссылок на скачивание');
    console.log('====================================================');
    console.log(`OAuth токен: ${OAUTH_TOKEN.substring(0, 20)}...`);
    console.log('');

    const baseURL = 'https://api.music.yandex.net';
    const headers = {
        'Authorization': `OAuth ${OAUTH_TOKEN}`,
        'User-Agent': 'Yandex-Music-API/1.0',
        'Content-Type': 'application/json'
    };

    try {
        // Получаем информацию о пользователе
        console.log('📋 Шаг 1: Получение информации о пользователе...');
        const userResponse = await makeRequest(`${baseURL}/account/status`, {
            method: 'GET',
            headers
        });

        if (userResponse.status !== 200) {
            console.log('❌ Ошибка аутентификации:', userResponse.status);
            return;
        }

        const userId = userResponse.data.result.account.uid;
        console.log(`✅ User ID: ${userId}`);

        // Получаем лайкнутые треки
        console.log('❤️ Шаг 2: Получение лайкнутых треков...');
        const likesResponse = await makeRequest(`${baseURL}/users/${userId}/likes/tracks`, {
            method: 'GET',
            headers
        });

        if (likesResponse.status !== 200) {
            console.log('❌ Ошибка получения лайков:', likesResponse.status);
            return;
        }

        const trackIds = likesResponse.data.result.library.tracks.map(track => track.id);
        console.log(`✅ Найдено лайкнутых треков: ${trackIds.length}`);

        // Тестируем получение информации о скачивании для первых 3 треков
        console.log('🔍 Шаг 3: Тестирование download-info endpoint...');
        const testTrackIds = trackIds.slice(0, 3);
        
        for (let i = 0; i < testTrackIds.length; i++) {
            const trackId = testTrackIds[i];
            console.log(`\n🎵 Трек ${i + 1}: ID ${trackId}`);
            
            try {
                // Получаем информацию о треке
                const trackResponse = await makeRequest(`${baseURL}/tracks?track-ids=${trackId}`, {
                    method: 'GET',
                    headers
                });

                if (trackResponse.status === 200) {
                    const track = trackResponse.data.result[0];
                    console.log(`   Название: "${track.title}" - ${track.artists?.map(a => a.name).join(', ')}`);
                    console.log(`   Доступен: ${track.available}`);
                } else {
                    console.log(`   ❌ Ошибка получения информации о треке: ${trackResponse.status}`);
                    continue;
                }

                // Пробуем получить download info
                console.log('   🔗 Получение download-info...');
                const downloadResponse = await makeRequest(`${baseURL}/tracks/${trackId}/download-info`, {
                    method: 'GET',
                    headers
                });

                console.log(`   Статус download-info: ${downloadResponse.status}`);

                if (downloadResponse.status === 200) {
                    const downloadInfo = downloadResponse.data.result;
                    console.log(`   ✅ Найдено форматов: ${downloadInfo.length}`);
                    
                    downloadInfo.forEach((info, index) => {
                        console.log(`     ${index + 1}. ${info.codec} ${info.bitrateInKbps}kbps - ${info.downloadInfoUrl ? 'есть URL' : 'нет URL'}`);
                    });

                    // Пробуем получить прямую ссылку для первого формата
                    if (downloadInfo.length > 0 && downloadInfo[0].downloadInfoUrl) {
                        console.log('   🎯 Получение прямой ссылки...');
                        
                        try {
                            const directLinkResponse = await makeRequest(downloadInfo[0].downloadInfoUrl, {
                                method: 'GET',
                                headers
                            });

                            console.log(`   Статус прямой ссылки: ${directLinkResponse.status}`);
                            
                            if (directLinkResponse.status === 200) {
                                console.log('   ✅ Прямая ссылка получена:', directLinkResponse.data);
                            } else {
                                console.log('   ❌ Ошибка получения прямой ссылки');
                            }
                        } catch (directLinkError) {
                            console.log('   ❌ Ошибка запроса прямой ссылки:', directLinkError.message);
                        }
                    }
                } else {
                    console.log(`   ❌ Ошибка download-info: ${downloadResponse.status}`);
                    if (downloadResponse.data) {
                        console.log('   Детали ошибки:', JSON.stringify(downloadResponse.data, null, 2));
                    }
                }

                // Пауза между запросами
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (trackError) {
                console.log(`   ❌ Ошибка обработки трека: ${trackError.message}`);
            }
        }

        // Тестируем альтернативные способы получения превью
        console.log('\n🔄 Шаг 4: Тестирование альтернативных способов получения превью...');
        
        // Способ 1: Через /tracks/{id}/supplement
        console.log('🧪 Способ 1: /tracks/{id}/supplement');
        try {
            const supplementResponse = await makeRequest(`${baseURL}/tracks/${testTrackIds[0]}/supplement`, {
                method: 'GET',
                headers
            });
            
            console.log(`Статус supplement: ${supplementResponse.status}`);
            if (supplementResponse.status === 200) {
                console.log('Supplement данные:', JSON.stringify(supplementResponse.data, null, 2));
            }
        } catch (supplementError) {
            console.log('Ошибка supplement:', supplementError.message);
        }

        // Способ 2: Через /tracks/{id}/similar
        console.log('\n🧪 Способ 2: /tracks/{id}/similar');
        try {
            const similarResponse = await makeRequest(`${baseURL}/tracks/${testTrackIds[0]}/similar`, {
                method: 'GET',
                headers
            });
            
            console.log(`Статус similar: ${similarResponse.status}`);
            if (similarResponse.status === 200) {
                console.log('Similar данные (первые 2):', JSON.stringify(similarResponse.data.result?.similarTracks?.slice(0, 2), null, 2));
            }
        } catch (similarError) {
            console.log('Ошибка similar:', similarError.message);
        }

    } catch (error) {
        console.log(`❌ Критическая ошибка: ${error.message}`);
    }
}

// Запускаем тест
testPreviewAPI().then(() => {
    console.log('\n✅ Тестирование завершено');
}).catch((error) => {
    console.log(`❌ Критическая ошибка: ${error.message}`);
});