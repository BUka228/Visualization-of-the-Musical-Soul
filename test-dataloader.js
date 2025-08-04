// Простой тест загрузки данных
console.log('🔄 Тестирование загрузки данных...');

// Тест 1: Проверка доступности демо-данных
fetch('/src/data/demo_data.json')
  .then(response => {
    console.log('📂 Демо-данные:', response.ok ? '✅ Доступны' : '❌ Недоступны');
    return response.json();
  })
  .then(data => {
    console.log('📊 Статистика демо-данных:');
    console.log(`  - Всего треков: ${data.tracks.length}`);
    console.log(`  - Источник: ${data.metadata.source}`);
    
    const tracksWithPreview = data.tracks.filter(t => t.preview_url && t.preview_url !== null);
    console.log(`  - Треков с превью: ${tracksWithPreview.length}/${data.tracks.length}`);
    
    // Тест первого трека
    if (data.tracks.length > 0) {
      const firstTrack = data.tracks[0];
      console.log('🎵 Первый трек:');
      console.log(`  - Название: ${firstTrack.title}`);
      console.log(`  - Исполнитель: ${firstTrack.artist}`);
      console.log(`  - Превью: ${firstTrack.preview_url ? '✅ Есть' : '❌ Нет'}`);
      
      // Тест загрузки аудио
      if (firstTrack.preview_url) {
        console.log('🔄 Тестирование загрузки аудио...');
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        
        audio.addEventListener('loadstart', () => {
          console.log('🔄 Начало загрузки аудио');
        });
        
        audio.addEventListener('canplay', () => {
          console.log('✅ Аудио готово к воспроизведению');
          console.log(`  - Длительность: ${audio.duration}с`);
        });
        
        audio.addEventListener('error', (e) => {
          console.error('❌ Ошибка загрузки аудио:', e);
          const error = audio.error;
          if (error) {
            console.error(`  - Код ошибки: ${error.code}`);
            console.error(`  - Сообщение: ${error.message || 'Нет сообщения'}`);
          }
        });
        
        audio.src = firstTrack.preview_url;
        audio.load();
      }
    }
  })
  .catch(error => {
    console.error('❌ Ошибка загрузки демо-данных:', error);
  });

// Тест 2: Проверка доступности основных данных
fetch('/src/data/music_data.json')
  .then(response => {
    console.log('📂 Основные данные:', response.ok ? '✅ Доступны' : '❌ Недоступны');
    if (response.ok) {
      return response.json();
    } else {
      throw new Error('Основные данные недоступны');
    }
  })
  .then(data => {
    console.log('📊 Статистика основных данных:');
    console.log(`  - Всего треков: ${data.tracks.length}`);
    console.log(`  - Источник: ${data.metadata.source}`);
    console.log(`  - Дата создания: ${data.metadata.generated_at}`);
    
    const tracksWithPreview = data.tracks.filter(t => t.preview_url && t.preview_url !== null);
    const previewPercentage = ((tracksWithPreview.length / data.tracks.length) * 100).toFixed(1);
    console.log(`  - Треков с превью: ${tracksWithPreview.length}/${data.tracks.length} (${previewPercentage}%)`);
    
    // Анализ жанров
    const genres = {};
    data.tracks.forEach(track => {
      genres[track.genre] = (genres[track.genre] || 0) + 1;
    });
    console.log('🎭 Жанры:', Object.keys(genres).length);
    Object.entries(genres)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([genre, count]) => {
        console.log(`  - ${genre}: ${count} треков`);
      });
  })
  .catch(error => {
    console.log('ℹ️ Основные данные недоступны, будут использованы демо-данные');
  });

console.log('✅ Тест загрузки данных завершен. Проверьте консоль для результатов.');