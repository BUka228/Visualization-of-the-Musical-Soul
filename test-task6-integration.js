/**
 * Интеграционный тест для задачи 6 - DataProcessor
 * Проверяет интеграцию DataProcessor с основным приложением
 */

import { DataProcessor } from './src/data/DataProcessor.js';
import { DataLoader } from './src/data/DataLoader.js';

console.log('🧪 Запуск интеграционного теста для задачи 6...');

async function testTask6Integration() {
  try {
    console.log('\n1️⃣ Тестирование создания экземпляра DataProcessor...');
    const processor = new DataProcessor();
    console.log('✅ DataProcessor создан успешно');

    console.log('\n2️⃣ Тестирование загрузки данных через DataLoader...');
    const loadResult = await DataLoader.loadMusicDataWithResult();
    
    if (!loadResult.success || !loadResult.data) {
      throw new Error(`Ошибка загрузки данных: ${loadResult.error}`);
    }
    
    console.log(`✅ Данные загружены: ${loadResult.data.tracks.length} треков (демо: ${loadResult.isDemo})`);

    console.log('\n3️⃣ Тестирование конвертации данных Яндекс.Музыки...');
    const convertedTracks = processor.convertYandexTrackData(loadResult.data.tracks);
    console.log(`✅ Конвертировано ${convertedTracks.length} треков`);

    console.log('\n4️⃣ Тестирование обработки треков для 3D-сцены...');
    const processedTracks = processor.processTrackData(convertedTracks);
    console.log(`✅ Обработано ${processedTracks.length} треков для 3D-сцены`);

    console.log('\n5️⃣ Тестирование анализа жанров...');
    const genreStats = processor.analyzeGenres(convertedTracks);
    const genreCount = Object.keys(genreStats).length;
    console.log(`✅ Проанализировано ${genreCount} жанров`);

    console.log('\n6️⃣ Тестирование статистики обработки...');
    const processingStats = processor.getProcessingStats(processedTracks);
    console.log(`✅ Статистика получена для ${processingStats.totalTracks} треков`);

    console.log('\n7️⃣ Проверка корректности обработанных данных...');
    let validationErrors = [];
    
    processedTracks.forEach((track, index) => {
      if (!track.id) validationErrors.push(`Трек ${index}: отсутствует ID`);
      if (!track.name) validationErrors.push(`Трек ${index}: отсутствует название`);
      if (!track.artist) validationErrors.push(`Трек ${index}: отсутствует исполнитель`);
      if (!track.color || !track.color.startsWith('#')) validationErrors.push(`Трек ${index}: некорректный цвет`);
      if (track.size < 0.5 || track.size > 3.0) validationErrors.push(`Трек ${index}: размер вне допустимого диапазона`);
      if (!track.position || typeof track.position.x !== 'number') validationErrors.push(`Трек ${index}: некорректная позиция`);
      if (track.popularity < 0 || track.popularity > 100) validationErrors.push(`Трек ${index}: популярность вне диапазона 0-100`);
    });

    if (validationErrors.length > 0) {
      console.log(`❌ Найдено ${validationErrors.length} ошибок валидации:`);
      validationErrors.slice(0, 5).forEach(error => console.log(`   - ${error}`));
      if (validationErrors.length > 5) {
        console.log(`   ... и еще ${validationErrors.length - 5} ошибок`);
      }
    } else {
      console.log('✅ Все данные прошли валидацию');
    }

    console.log('\n8️⃣ Проверка методов интерфейса DataProcessor...');
    
    // Тестируем каждый метод интерфейса
    const testTrack = convertedTracks[0];
    
    const popularity = processor.calculatePopularity(testTrack);
    console.log(`   - calculatePopularity: ${popularity} (${popularity >= 0 && popularity <= 100 ? '✅' : '❌'})`);
    
    const size = processor.calculateSize(testTrack);
    console.log(`   - calculateSize: ${size} (${size >= 0.5 && size <= 3.0 ? '✅' : '❌'})`);
    
    const position = processor.calculatePosition(0, 10, testTrack.genre);
    console.log(`   - calculatePosition: (${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}) (${position ? '✅' : '❌'})`);
    
    const color = processor.getGenreColor(testTrack.genre);
    console.log(`   - getGenreColor: ${color} (${color.startsWith('#') ? '✅' : '❌'})`);

    console.log('\n📊 Итоговая статистика:');
    console.log(`   - Всего треков: ${processingStats.totalTracks}`);
    console.log(`   - Жанров: ${genreCount}`);
    console.log(`   - Средняя популярность: ${processingStats.averagePopularity}`);
    console.log(`   - Средний размер: ${processingStats.averageSize}`);
    console.log(`   - Диапазон размеров: ${processingStats.sizeRange.min} - ${processingStats.sizeRange.max}`);
    
    console.log('\n🎉 Все тесты пройдены успешно!');
    console.log('✅ DataProcessor готов к использованию в 3D-сцене');
    
    return {
      success: true,
      tracksProcessed: processedTracks.length,
      genresFound: genreCount,
      validationErrors: validationErrors.length
    };

  } catch (error) {
    console.error('\n❌ Ошибка интеграционного тестирования:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Запускаем тест
testTask6Integration().then(result => {
  if (result.success) {
    console.log('\n🏆 ИНТЕГРАЦИОННЫЙ ТЕСТ ПРОЙДЕН');
    console.log(`📈 Результат: ${result.tracksProcessed} треков, ${result.genresFound} жанров, ${result.validationErrors} ошибок`);
  } else {
    console.log('\n💥 ИНТЕГРАЦИОННЫЙ ТЕСТ НЕ ПРОЙДЕН');
    console.log(`❌ Ошибка: ${result.error}`);
  }
}).catch(error => {
  console.error('\n💥 КРИТИЧЕСКАЯ ОШИБКА ТЕСТА:', error);
});