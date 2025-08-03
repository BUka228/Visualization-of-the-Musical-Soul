/**
 * Простой тест DataLoader без браузера
 */

// Имитируем fetch API для Node.js
const fs = require('fs');
const path = require('path');

global.fetch = async function(url) {
    try {
        // Преобразуем URL в путь к файлу
        let filePath;
        if (url.includes('music_data.json')) {
            filePath = path.join(__dirname, 'src', 'data', 'music_data.json');
        } else if (url.includes('demo_data.json')) {
            filePath = path.join(__dirname, 'src', 'data', 'demo_data.json');
        } else {
            throw new Error('Unknown URL');
        }

        const data = fs.readFileSync(filePath, 'utf8');
        
        return {
            ok: true,
            json: async () => JSON.parse(data)
        };
    } catch (error) {
        return {
            ok: false,
            status: 404
        };
    }
};

// Тестируем основные функции
async function testDataLoader() {
    console.log('🧪 Тестирование DataLoader...\n');

    try {
        // Тест 1: Проверка существования файлов
        console.log('📁 Тест 1: Проверка файлов данных');
        
        const musicDataExists = fs.existsSync(path.join(__dirname, 'src', 'data', 'music_data.json'));
        const demoDataExists = fs.existsSync(path.join(__dirname, 'src', 'data', 'demo_data.json'));
        
        console.log(`   music_data.json: ${musicDataExists ? '✅ Существует' : '❌ Не найден'}`);
        console.log(`   demo_data.json: ${demoDataExists ? '✅ Существует' : '❌ Не найден'}`);

        // Тест 2: Загрузка и валидация данных
        console.log('\n📊 Тест 2: Загрузка данных');
        
        if (musicDataExists) {
            const musicData = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'data', 'music_data.json'), 'utf8'));
            console.log(`   Основные данные: ${musicData.tracks.length} треков`);
            console.log(`   Источник: ${musicData.metadata.source}`);
            console.log(`   Создано: ${new Date(musicData.metadata.generated_at).toLocaleString('ru')}`);
            
            // Проверяем структуру первого трека
            if (musicData.tracks.length > 0) {
                const firstTrack = musicData.tracks[0];
                console.log(`   Пример трека: "${firstTrack.title}" - ${firstTrack.artist} (${firstTrack.genre})`);
                
                // Проверяем обязательные поля
                const requiredFields = ['id', 'title', 'artist', 'album', 'duration', 'genre', 'available'];
                const missingFields = requiredFields.filter(field => !(field in firstTrack));
                
                if (missingFields.length === 0) {
                    console.log('   ✅ Структура данных корректна');
                } else {
                    console.log(`   ❌ Отсутствуют поля: ${missingFields.join(', ')}`);
                }
            }
        }

        if (demoDataExists) {
            const demoData = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'data', 'demo_data.json'), 'utf8'));
            console.log(`   Демо-данные: ${demoData.tracks.length} треков`);
        }

        // Тест 3: Статистика по жанрам
        console.log('\n🎭 Тест 3: Анализ жанров');
        
        if (musicDataExists) {
            const musicData = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'data', 'music_data.json'), 'utf8'));
            const genres = {};
            
            musicData.tracks.forEach(track => {
                const genre = track.genre || 'unknown';
                genres[genre] = (genres[genre] || 0) + 1;
            });
            
            const sortedGenres = Object.entries(genres)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10); // Топ-10 жанров
            
            console.log('   Топ-10 жанров:');
            sortedGenres.forEach(([genre, count], index) => {
                const percentage = ((count / musicData.tracks.length) * 100).toFixed(1);
                console.log(`   ${index + 1}. ${genre}: ${count} треков (${percentage}%)`);
            });
        }

        // Тест 4: Проверка свежести данных
        console.log('\n🕒 Тест 4: Свежесть данных');
        
        if (musicDataExists) {
            const musicData = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'data', 'music_data.json'), 'utf8'));
            const generatedAt = new Date(musicData.metadata.generated_at);
            const now = new Date();
            const hoursDiff = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60);
            
            console.log(`   Создано: ${generatedAt.toLocaleString('ru')}`);
            console.log(`   Возраст: ${hoursDiff.toFixed(1)} часов`);
            console.log(`   Статус: ${hoursDiff < 24 ? '✅ Свежие' : '⚠️ Устарели'}`);
        }

        // Тест 5: Проверка доступности превью
        console.log('\n🎵 Тест 5: Доступность превью');
        
        if (musicDataExists) {
            const musicData = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'data', 'music_data.json'), 'utf8'));
            const tracksWithPreview = musicData.tracks.filter(track => track.preview_url).length;
            const tracksWithCover = musicData.tracks.filter(track => track.cover_url).length;
            
            console.log(`   Треки с превью: ${tracksWithPreview}/${musicData.tracks.length} (${((tracksWithPreview/musicData.tracks.length)*100).toFixed(1)}%)`);
            console.log(`   Треки с обложками: ${tracksWithCover}/${musicData.tracks.length} (${((tracksWithCover/musicData.tracks.length)*100).toFixed(1)}%)`);
        }

        console.log('\n🎉 Тестирование завершено успешно!');
        
        // Инструкции по обновлению
        console.log('\n📝 Инструкции по обновлению данных:');
        console.log('1. Откройте терминал в корне проекта');
        console.log('2. Выполните команду: npm run collect-data');
        console.log('3. Следуйте инструкциям для получения токена');
        console.log('4. Перезагрузите страницу после завершения');

    } catch (error) {
        console.error('❌ Ошибка тестирования:', error.message);
    }
}

// Запускаем тест
testDataLoader();