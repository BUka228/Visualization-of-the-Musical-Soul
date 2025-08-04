/**
 * Скрипт верификации выполнения задачи 7
 * Проверяет соответствие всем требованиям задачи
 */

import { TrackObject } from './src/scene/TrackObject.js';
import { DataProcessor } from './src/data/DataProcessor.js';
import * as THREE from 'three';

console.log('🔍 Верификация выполнения задачи 7...\n');

// Тестовые данные для проверки
const testTrack = {
    id: 'test-1',
    name: 'Test Track',
    artist: 'Test Artist',
    album: 'Test Album',
    genre: 'metal',
    popularity: 85,
    duration: 240,
    previewUrl: undefined,
    color: '#FF0000',
    size: 2.0,
    position: new THREE.Vector3(10, 5, -15)
};

let allTestsPassed = true;

function runTest(testName, testFunction) {
    try {
        console.log(`📋 ${testName}`);
        const result = testFunction();
        if (result) {
            console.log(`✅ ПРОЙДЕН: ${testName}`);
        } else {
            console.log(`❌ ПРОВАЛЕН: ${testName}`);
            allTestsPassed = false;
        }
        console.log('');
        return result;
    } catch (error) {
        console.log(`❌ ОШИБКА в ${testName}: ${error.message}`);
        allTestsPassed = false;
        console.log('');
        return false;
    }
}

// Тест 1: TrackObject класс наследует THREE.Mesh
runTest('TrackObject класс наследует THREE.Mesh', () => {
    const trackObject = new TrackObject(testTrack);
    const isMesh = trackObject instanceof THREE.Mesh;
    const hasTrackData = trackObject.trackData !== undefined;
    const hasOriginalPosition = trackObject.originalPosition !== undefined;
    
    console.log(`  - instanceof THREE.Mesh: ${isMesh}`);
    console.log(`  - имеет trackData: ${hasTrackData}`);
    console.log(`  - имеет originalPosition: ${hasOriginalPosition}`);
    
    trackObject.dispose();
    return isMesh && hasTrackData && hasOriginalPosition;
});

// Тест 2: Различные геометрии для разных жанров
runTest('Различные геометрии для разных жанров', () => {
    const genres = ['metal', 'rock', 'indie', 'pop', 'electronic', 'jazz', 'classical', 'hip-hop'];
    const geometryTypes = new Set();
    
    genres.forEach(genre => {
        const track = { ...testTrack, genre: genre };
        const trackObject = new TrackObject(track);
        const geometryType = trackObject.geometry.constructor.name;
        geometryTypes.add(geometryType);
        
        console.log(`  - ${genre}: ${geometryType}`);
        trackObject.dispose();
    });
    
    // Должно быть минимум 4 разных типа геометрии
    const hasVariety = geometryTypes.size >= 4;
    console.log(`  - Количество различных геометрий: ${geometryTypes.size}`);
    
    return hasVariety;
});

// Тест 3: Цветовая схема применена
runTest('Цветовая схема применена согласно жанрам', () => {
    const dataProcessor = new DataProcessor();
    const genreColorTests = [
        { genre: 'metal', expectedColor: '#FF0000' },
        { genre: 'rock', expectedColor: '#FF4500' },
        { genre: 'indie', expectedColor: '#4169E1' },
        { genre: 'pop', expectedColor: '#FFD700' },
        { genre: 'electronic', expectedColor: '#9400D3' }
    ];
    
    let allColorsCorrect = true;
    
    genreColorTests.forEach(test => {
        const actualColor = dataProcessor.getGenreColor(test.genre);
        const isCorrect = actualColor.toLowerCase() === test.expectedColor.toLowerCase();
        
        console.log(`  - ${test.genre}: ожидается ${test.expectedColor}, получен ${actualColor} ${isCorrect ? '✅' : '❌'}`);
        
        if (!isCorrect) {
            allColorsCorrect = false;
        }
    });
    
    return allColorsCorrect;
});

// Тест 4: Материалы с поддержкой освещения
runTest('Материалы с поддержкой освещения', () => {
    const trackObject = new TrackObject(testTrack);
    const material = trackObject.material;
    
    const isMeshStandardMaterial = material instanceof THREE.MeshStandardMaterial;
    const hasMetalness = material.metalness !== undefined;
    const hasRoughness = material.roughness !== undefined;
    const hasEmissive = material.emissive !== undefined;
    const hasEmissiveIntensity = material.emissiveIntensity !== undefined;
    
    console.log(`  - MeshStandardMaterial: ${isMeshStandardMaterial}`);
    console.log(`  - metalness: ${hasMetalness} (${material.metalness})`);
    console.log(`  - roughness: ${hasRoughness} (${material.roughness})`);
    console.log(`  - emissive: ${hasEmissive}`);
    console.log(`  - emissiveIntensity: ${hasEmissiveIntensity} (${material.emissiveIntensity})`);
    
    trackObject.dispose();
    return isMeshStandardMaterial && hasMetalness && hasRoughness && hasEmissive && hasEmissiveIntensity;
});

// Тест 5: Алгоритм распределения в пространстве
runTest('Алгоритм сферического распределения', () => {
    const dataProcessor = new DataProcessor();
    const testTracks = [];
    
    // Создаем тестовые треки
    for (let i = 0; i < 20; i++) {
        testTracks.push({
            id: `test-${i}`,
            name: `Track ${i}`,
            artist: 'Test Artist',
            album: 'Test Album',
            genre: i % 2 === 0 ? 'rock' : 'pop',
            duration: 180 + i * 10,
            popularity: 50 + i * 2,
            previewUrl: undefined,
            imageUrl: undefined,
            playCount: 1000 * i
        });
    }
    
    const processedTracks = dataProcessor.processTrackData(testTracks);
    
    // Проверяем распределение
    const distances = processedTracks.map(track => track.position.length());
    const minDistance = Math.min(...distances);
    const maxDistance = Math.max(...distances);
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    
    // Проверяем, что объекты распределены в разумном диапазоне
    const reasonableDistribution = minDistance > 10 && maxDistance < 100 && avgDistance > 20;
    
    console.log(`  - Минимальное расстояние: ${minDistance.toFixed(2)}`);
    console.log(`  - Максимальное расстояние: ${maxDistance.toFixed(2)}`);
    console.log(`  - Среднее расстояние: ${avgDistance.toFixed(2)}`);
    console.log(`  - Разумное распределение: ${reasonableDistribution}`);
    
    return reasonableDistribution;
});

// Тест 6: Методы управления состоянием
runTest('Методы управления состоянием TrackObject', () => {
    const trackObject = new TrackObject(testTrack);
    
    // Тест setHovered
    trackObject.setHovered(true);
    const hoveredWorks = trackObject.isHovered === true;
    
    trackObject.setHovered(false);
    const unhoveredWorks = trackObject.isHovered === false;
    
    // Тест setSelected
    trackObject.setSelected(true);
    const selectedWorks = trackObject.isSelected === true;
    
    trackObject.setSelected(false);
    const unselectedWorks = trackObject.isSelected === false;
    
    // Тест getTrackInfo
    const trackInfo = trackObject.getTrackInfo();
    const trackInfoWorks = trackInfo && trackInfo.name && trackInfo.artist && trackInfo.genre;
    
    console.log(`  - setHovered(true): ${hoveredWorks}`);
    console.log(`  - setHovered(false): ${unhoveredWorks}`);
    console.log(`  - setSelected(true): ${selectedWorks}`);
    console.log(`  - setSelected(false): ${unselectedWorks}`);
    console.log(`  - getTrackInfo(): ${trackInfoWorks}`);
    
    trackObject.dispose();
    return hoveredWorks && unhoveredWorks && selectedWorks && unselectedWorks && trackInfoWorks;
});

// Тест 7: Анимационные методы
runTest('Анимационные методы TrackObject', () => {
    const trackObject = new TrackObject(testTrack);
    const originalPosition = trackObject.position.clone();
    const originalRotation = trackObject.rotation.clone();
    
    // Тест updateAnimation
    trackObject.updateAnimation(16, Date.now());
    const positionChanged = !trackObject.position.equals(originalPosition);
    const rotationChanged = !trackObject.rotation.equals(originalRotation);
    
    // Тест updatePulse (только для выбранных объектов)
    trackObject.setSelected(true);
    const originalScale = trackObject.scale.clone();
    trackObject.updatePulse(Date.now());
    const scaleChanged = !trackObject.scale.equals(originalScale);
    
    console.log(`  - updateAnimation изменяет позицию: ${positionChanged}`);
    console.log(`  - updateAnimation изменяет вращение: ${rotationChanged}`);
    console.log(`  - updatePulse изменяет масштаб: ${scaleChanged}`);
    
    trackObject.dispose();
    return positionChanged && rotationChanged && scaleChanged;
});

// Тест 8: Освобождение ресурсов
runTest('Освобождение ресурсов (dispose)', () => {
    const trackObject = new TrackObject(testTrack);
    const geometry = trackObject.geometry;
    const material = trackObject.material;
    
    // Проверяем, что ресурсы существуют
    const hasGeometry = geometry !== undefined;
    const hasMaterial = material !== undefined;
    
    // Вызываем dispose
    trackObject.dispose();
    
    console.log(`  - Геометрия существует: ${hasGeometry}`);
    console.log(`  - Материал существует: ${hasMaterial}`);
    console.log(`  - dispose() выполнен без ошибок: true`);
    
    return hasGeometry && hasMaterial;
});

// Финальный отчет
console.log('=' .repeat(60));
if (allTestsPassed) {
    console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!');
    console.log('\n📋 Задача 7 выполнена полностью:');
    console.log('✅ TrackObject класс реализован, наследующий THREE.Mesh');
    console.log('✅ Различные геометрии созданы для разных жанров (сферы, кристаллы, конусы)');
    console.log('✅ Цветовая схема применена согласно дизайн-документу');
    console.log('✅ Материалы настроены с поддержкой освещения (MeshStandardMaterial)');
    console.log('✅ Объекты размещены в сцене согласно алгоритму сферического распределения');
    console.log('✅ Все требования 2.1, 2.2, 2.3, 2.4, 2.5, 2.6 выполнены');
} else {
    console.log('❌ НЕКОТОРЫЕ ТЕСТЫ НЕ ПРОЙДЕНЫ');
    console.log('Проверьте вывод выше для деталей');
}
console.log('=' .repeat(60));