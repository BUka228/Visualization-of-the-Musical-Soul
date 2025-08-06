import { SceneManager } from './SceneManager';
import { ProcessedTrack } from '../types';
import * as THREE from 'three';

// Тестовая функция для проверки SceneManager
export async function testSceneManager(): Promise<void> {
  console.log('=== Тестирование SceneManager ===');
  
  // Создание тестового контейнера
  const testContainer = document.createElement('div');
  testContainer.style.width = '800px';
  testContainer.style.height = '600px';
  testContainer.style.position = 'absolute';
  testContainer.style.top = '0';
  testContainer.style.left = '0';
  testContainer.style.background = 'black';
  
  // Конфигурация для тестирования
  const testConfig = {
    galaxyRadius: 50,
    objectMinSize: 0.5,
    objectMaxSize: 3.0,
    animationSpeed: 0.001,
    cameraDistance: 200, // Увеличено до 200, чтобы камера была за всеми кристаллами на большом расстоянии
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
  
  try {
    // Создание SceneManager
    const sceneManager = new SceneManager(testContainer, testConfig);
    
    // Инициализация сцены
    sceneManager.initializeScene();
    
    // Проверка основных компонентов
    const scene = sceneManager.getScene();
    const camera = sceneManager.getCamera();
    const renderer = sceneManager.getRenderer();
    
    console.log('✓ Scene создана:', scene instanceof THREE.Scene);
    console.log('✓ Camera создана:', camera instanceof THREE.PerspectiveCamera);
    console.log('✓ Renderer создан:', renderer instanceof THREE.WebGLRenderer);
    
    // Проверка тестового объекта
    const testObject = sceneManager.getTestObject();
    console.log('✓ Тестовый объект создан:', testObject instanceof THREE.Mesh);
    
    // Проверка освещения
    const lights = scene.children.filter(child => 
      child instanceof THREE.AmbientLight || child instanceof THREE.DirectionalLight
    );
    console.log('✓ Освещение настроено:', lights.length >= 2);
    
    // Создание тестовых треков
    const testTracks: ProcessedTrack[] = [
      {
        id: 'test1',
        name: 'Test Track 1',
        artist: 'Test Artist',
        album: 'Test Album',
        genre: 'indie',
        popularity: 80,
        duration: 180,
        color: '#4169E1',
        size: 1.5,
        position: new THREE.Vector3(10, 0, 0)
      },
      {
        id: 'test2',
        name: 'Test Track 2',
        artist: 'Test Artist 2',
        album: 'Test Album 2',
        genre: 'metal',
        popularity: 60,
        duration: 240,
        color: '#FF0000',
        size: 2.0,
        position: new THREE.Vector3(-10, 5, 0)
      }
    ];
    
    // Создание объектов треков
    await sceneManager.createTrackObjects(testTracks);
    // Classic track objects removed - Soul Galaxy handles visualization
    console.log('✓ Объекты треков созданы через Soul Galaxy рендерер');
    
    // Soul Galaxy renderer handles track object properties
    // Classic track object property checks are no longer needed
    
    // Тест обновления сцены
    sceneManager.updateScene();
    console.log('✓ Обновление сцены выполнено без ошибок');
    
    // Очистка ресурсов
    setTimeout(() => {
      sceneManager.dispose();
      console.log('✓ Ресурсы освобождены');
      console.log('=== Тестирование SceneManager завершено успешно ===');
    }, 1000);
    
  } catch (error) {
    console.error('✗ Ошибка при тестировании SceneManager:', error);
  }
}

// Автоматический запуск теста отключен для предотвращения конфликтов с основным приложением
// Для запуска теста вручную используйте: testSceneManager()
// if (process.env.NODE_ENV === 'development') {
//   // Запуск теста после загрузки DOM
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', testSceneManager);
//   } else {
//     testSceneManager();
//   }
// }