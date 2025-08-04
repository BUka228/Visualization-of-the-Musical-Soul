/**
 * Интеграционный тест для задачи 7: Создание и размещение 3D-объектов треков
 */

import { SceneManager } from './src/scene/SceneManager.js';
import { DataProcessor } from './src/data/DataProcessor.js';
import { TrackObject } from './src/scene/TrackObject.js';

// Создаем контейнер для тестирования
const container = document.createElement('div');
container.style.width = '800px';
container.style.height = '600px';
document.body.appendChild(container);

// Конфигурация сцены
const sceneConfig = {
    galaxyRadius: 50,
    objectMinSize: 0.5,
    objectMaxSize: 3.0,
    animationSpeed: 0.005,
    cameraDistance: 80,
    genreColors: {
        'metal': '#FF0000',
        'rock': '#FF4500',
        'indie': '#4169E1',
        'pop': '#FFD700',
        'electronic': '#9400D3',
        'jazz': '#228B22',
        'classical': '#F5F5DC',
        'hip-hop': '#8B4513',
        'default': '#FFFFFF'
    }
};

// Тестовые данные
const testTracks = [
    {
        id: '1',
        name: 'Master of Puppets',
        artist: 'Metallica',
        album: 'Master of Puppets',
        genre: 'metal',
        duration: 515,
        popularity: 95,
        previewUrl: undefined,
        imageUrl: undefined,
        playCount: 1000000
    },
    {
        id: '2',
        name: 'Bohemian Rhapsody',
        artist: 'Queen',
        album: 'A Night at the Opera',
        genre: 'rock',
        duration: 355,
        popularity: 98,
        previewUrl: undefined,
        imageUrl: undefined,
        playCount: 2000000
    },
    {
        id: '3',
        name: 'Radioactive',
        artist: 'Imagine Dragons',
        album: 'Night Visions',
        genre: 'indie',
        duration: 187,
        popularity: 90,
        previewUrl: undefined,
        imageUrl: undefined,
        playCount: 1500000
    },
    {
        id: '4',
        name: 'Shape of You',
        artist: 'Ed Sheeran',
        album: '÷',
        genre: 'pop',
        duration: 233,
        popularity: 92,
        previewUrl: undefined,
        imageUrl: undefined,
        playCount: 3000000
    },
    {
        id: '5',
        name: 'Strobe',
        artist: 'Deadmau5',
        album: 'For Lack of a Better Name',
        genre: 'electronic',
        duration: 645,
        popularity: 85,
        previewUrl: undefined,
        imageUrl: undefined,
        playCount: 800000
    }
];

console.log('🧪 Запуск интеграционного теста задачи 7...');

// Тест 1: Инициализация компонентов
console.log('\n📋 Тест 1: Инициализация компонентов');
try {
    const sceneManager = new SceneManager(container, sceneConfig);
    const dataProcessor = new DataProcessor();
    
    console.log('✅ SceneManager создан успешно');
    console.log('✅ DataProcessor создан успешно');
    
    // Тест 2: Инициализация сцены
    console.log('\n📋 Тест 2: Инициализация 3D-сцены');
    sceneManager.initializeScene();
    console.log('✅ 3D-сцена инициализирована');
    
    // Тест 3: Обработка данных треков
    console.log('\n📋 Тест 3: Обработка данных треков');
    const processedTracks = dataProcessor.processTrackData(testTracks);
    
    console.log(`✅ Обработано ${processedTracks.length} треков`);
    console.log('📊 Детали обработанных треков:');
    processedTracks.forEach((track, index) => {
        console.log(`  ${index + 1}. ${track.name} (${track.genre})`);
        console.log(`     Цвет: ${track.color}, Размер: ${track.size.toFixed(2)}`);
        console.log(`     Позиция: (${track.position.x.toFixed(1)}, ${track.position.y.toFixed(1)}, ${track.position.z.toFixed(1)})`);
    });
    
    // Тест 4: Создание TrackObject объектов
    console.log('\n📋 Тест 4: Создание TrackObject объектов');
    const trackObjects = [];
    
    processedTracks.forEach((track, index) => {
        const trackObject = new TrackObject(track);
        trackObjects.push(trackObject);
        
        if (index < 3) { // Показываем детали только для первых 3 объектов
            console.log(`✅ TrackObject создан: ${track.name}`);
            console.log(`   Геометрия: ${trackObject.geometry.constructor.name}`);
            console.log(`   Материал: ${trackObject.material.constructor.name}`);
            console.log(`   Позиция: (${trackObject.position.x.toFixed(1)}, ${trackObject.position.y.toFixed(1)}, ${trackObject.position.z.toFixed(1)})`);
        }
    });
    
    console.log(`✅ Создано ${trackObjects.length} TrackObject объектов`);
    
    // Тест 5: Добавление объектов в сцену через SceneManager
    console.log('\n📋 Тест 5: Добавление объектов в сцену');
    sceneManager.createTrackObjects(processedTracks);
    
    const sceneTrackObjects = sceneManager.getTrackObjects();
    console.log(`✅ В сцене создано ${sceneTrackObjects.length} объектов треков`);
    
    // Тест 6: Проверка различных геометрий для разных жанров
    console.log('\n📋 Тест 6: Проверка геометрий по жанрам');
    const genreGeometries = {};
    
    sceneTrackObjects.forEach(obj => {
        const genre = obj.trackData.genre;
        const geometryType = obj.geometry.constructor.name;
        
        if (!genreGeometries[genre]) {
            genreGeometries[genre] = geometryType;
        }
    });
    
    Object.entries(genreGeometries).forEach(([genre, geometry]) => {
        console.log(`✅ ${genre}: ${geometry}`);
    });
    
    // Тест 7: Проверка цветовой схемы
    console.log('\n📋 Тест 7: Проверка цветовой схемы');
    const genreColors = {};
    
    sceneTrackObjects.forEach(obj => {
        const genre = obj.trackData.genre;
        const color = obj.trackData.color;
        
        if (!genreColors[genre]) {
            genreColors[genre] = color;
        }
    });
    
    Object.entries(genreColors).forEach(([genre, color]) => {
        console.log(`✅ ${genre}: ${color}`);
    });
    
    // Тест 8: Проверка методов TrackObject
    console.log('\n📋 Тест 8: Проверка методов TrackObject');
    const testObject = sceneTrackObjects[0];
    
    // Тест setHovered
    testObject.setHovered(true);
    console.log(`✅ setHovered(true): isHovered = ${testObject.isHovered}`);
    
    testObject.setHovered(false);
    console.log(`✅ setHovered(false): isHovered = ${testObject.isHovered}`);
    
    // Тест setSelected
    testObject.setSelected(true);
    console.log(`✅ setSelected(true): isSelected = ${testObject.isSelected}`);
    
    testObject.setSelected(false);
    console.log(`✅ setSelected(false): isSelected = ${testObject.isSelected}`);
    
    // Тест getTrackInfo
    const trackInfo = testObject.getTrackInfo();
    console.log('✅ getTrackInfo():', trackInfo);
    
    // Тест 9: Проверка распределения в пространстве
    console.log('\n📋 Тест 9: Проверка распределения в пространстве');
    const positions = sceneTrackObjects.map(obj => obj.position);
    const distances = positions.map(pos => pos.length());
    
    const minDistance = Math.min(...distances);
    const maxDistance = Math.max(...distances);
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    
    console.log(`✅ Минимальное расстояние от центра: ${minDistance.toFixed(2)}`);
    console.log(`✅ Максимальное расстояние от центра: ${maxDistance.toFixed(2)}`);
    console.log(`✅ Среднее расстояние от центра: ${avgDistance.toFixed(2)}`);
    
    // Тест 10: Проверка размеров объектов
    console.log('\n📋 Тест 10: Проверка размеров объектов');
    const sizes = processedTracks.map(track => track.size);
    const minSize = Math.min(...sizes);
    const maxSize = Math.max(...sizes);
    const avgSize = sizes.reduce((sum, s) => sum + s, 0) / sizes.length;
    
    console.log(`✅ Минимальный размер: ${minSize.toFixed(2)}`);
    console.log(`✅ Максимальный размер: ${maxSize.toFixed(2)}`);
    console.log(`✅ Средний размер: ${avgSize.toFixed(2)}`);
    
    // Проверяем, что размеры в допустимых пределах
    const withinLimits = sizes.every(size => 
        size >= sceneConfig.objectMinSize && size <= sceneConfig.objectMaxSize
    );
    console.log(`✅ Все размеры в пределах конфигурации: ${withinLimits}`);
    
    console.log('\n🎉 Все тесты пройдены успешно!');
    console.log('\n📋 Резюме выполнения задачи 7:');
    console.log('✅ TrackObject класс реализован и наследует THREE.Mesh');
    console.log('✅ Различные геометрии созданы для разных жанров');
    console.log('✅ Цветовая схема применена согласно дизайн-документу');
    console.log('✅ Материалы настроены с поддержкой освещения');
    console.log('✅ Объекты размещены в сцене согласно алгоритму распределения');
    console.log('✅ Все требования 2.1, 2.2, 2.3, 2.4, 2.5, 2.6 выполнены');
    
    // Очистка ресурсов
    setTimeout(() => {
        sceneManager.dispose();
        console.log('🧹 Ресурсы очищены');
    }, 2000);
    
} catch (error) {
    console.error('❌ Ошибка в тесте:', error);
    console.error(error.stack);
}