# Design Document

## Overview

Дизайн эволюции визуала "Галактика души" представляет собой кардинальное переосмысление текущей 3D-визуализации музыкальной коллекции. Новый подход создает глубокую эмоциональную связь между пользователем и музыкой через кинематографическую космическую эстетику, превращая простое отображение треков в захватывающий опыт исследования персональной музыкальной вселенной.

Ключевые принципы дизайна:
- **Кинематографичность**: каждое взаимодействие должно ощущаться как сцена из научно-фантастического фильма
- **Эмоциональная глубина**: визуал должен вызывать чувство благоговения перед собственной музыкальной коллекцией
- **Плавность и отзывчивость**: все переходы должны быть гладкими, без лагов и резких движений
- **Атмосферность**: создание ощущения глубокого космоса и бесконечности

## Architecture

### Компонентная архитектура

```
SoulGalaxyVisual/
├── Core/
│   ├── SoulGalaxyRenderer.ts      # Основной рендерер с кастомными шейдерами
│   ├── DeepSpaceEnvironment.ts    # Система глубокого космического фона
│   └── CrystalTrackSystem.ts      # Система кристаллических треков
├── Effects/
│   ├── NebulaSystem.ts           # Система туманностей и космических эффектов
│   ├── ParallaxParticles.ts      # Частицы для создания параллакса
│   ├── CrystalPulseSystem.ts     # Система пульсации кристаллов
│   └── FocusTransitionSystem.ts  # Система кинематографических переходов
├── Materials/
│   ├── CrystalShaderMaterial.ts  # Шейдерный материал для кристаллов
│   ├── NebulaShaderMaterial.ts   # Шейдерный материал для туманности
│   └── AlbumTextureManager.ts    # Менеджер текстур обложек
├── Camera/
│   ├── CinematicCameraController.ts # Кинематографическое управление камерой
│   └── FocusAnimationSystem.ts      # Система анимации фокуса на треке
└── UI/
    ├── MinimalistHUD.ts          # Минималистичный HUD
    └── TrackInfoDisplay.ts       # Отображение информации о треке
```

### Интеграция с существующей системой

Новая система будет интегрирована как альтернативный визуальный режим:

```typescript
interface VisualMode {
  CLASSIC: 'classic';    // Текущая система
  SOUL_GALAXY: 'soul_galaxy'; // Новая система
}

interface SceneManager {
  setVisualMode(mode: VisualMode): void;
  getCurrentMode(): VisualMode;
}
```

## Components and Interfaces

### 1. DeepSpaceEnvironment

Создает атмосферу глубокого космоса с туманностью и частицами:

```typescript
interface DeepSpaceEnvironment {
  // Основные методы
  initialize(scene: THREE.Scene, camera: THREE.Camera): void;
  createNebulaBackground(): void;
  createParallaxParticles(): void;
  updateParallax(cameraMovement: THREE.Vector3): void;
  
  // Настройки атмосферы
  setNebulaIntensity(intensity: number): void;
  setParticleCount(count: number): void;
  setDepthLayers(layers: number): void;
}
```

**Технические детали:**
- Использование кастомных шейдеров для создания реалистичной туманности
- Многослойная система частиц для создания эффекта параллакса
- Процедурная генерация звездного поля с различными размерами и яркостью
- Динамическое LOD для оптимизации производительности

### 2. CrystalTrackSystem

Система представления треков как пульсирующих кристаллов:

```typescript
interface CrystalTrackSystem {
  // Создание кристаллов
  createCrystalCluster(tracks: ProcessedTrack[]): void;
  generateCrystalGeometry(track: ProcessedTrack): THREE.BufferGeometry;
  createCrystalMaterial(track: ProcessedTrack): CrystalShaderMaterial;
  
  // Анимация и пульсация
  updatePulsation(deltaTime: number): void;
  setPulsationFromBPM(track: ProcessedTrack, bpm?: number): void;
  
  // Управление кластером
  rotateCluster(deltaTime: number): void;
  focusOnCrystal(crystal: CrystalTrack): void;
}
```

**Технические детали:**
- Процедурная генерация неровных граней кристаллов с использованием Voronoi диаграмм
- Кастомные шейдеры для создания эффекта пульсации в зависимости от BPM
- Система инстансинга для оптимизации рендеринга множества кристаллов
- Динамическое наложение текстур обложек с искажением

### 3. CrystalShaderMaterial

Кастомный шейдерный материал для кристаллов:

```glsl
// Vertex Shader
attribute float pulsePhase;
attribute float bpmMultiplier;
uniform float time;
uniform float globalPulse;

varying vec3 vNormal;
varying vec2 vUv;
varying float vPulse;

void main() {
  // Пульсация на основе BPM
  float pulse = sin(time * bpmMultiplier + pulsePhase) * 0.1 + 1.0;
  vPulse = pulse;
  
  // Деформация вершин для создания живого эффекта
  vec3 newPosition = position * pulse;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vUv = uv;
}
```

```glsl
// Fragment Shader
uniform vec3 genreColor;
uniform sampler2D albumTexture;
uniform float emissiveIntensity;
uniform float time;

varying vec3 vNormal;
varying vec2 vUv;
varying float vPulse;

void main() {
  // Базовый цвет жанра
  vec3 baseColor = genreColor;
  
  // Наложение текстуры обложки с искажением
  vec2 distortedUv = vUv + sin(vUv * 10.0 + time) * 0.02;
  vec4 albumColor = texture2D(albumTexture, distortedUv);
  
  // Смешивание цветов
  vec3 finalColor = mix(baseColor, albumColor.rgb, 0.3);
  
  // Эффект свечения граней
  float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
  vec3 emissive = finalColor * emissiveIntensity * fresnel * vPulse;
  
  gl_FragColor = vec4(finalColor + emissive, 1.0);
}
```

### 4. CinematicCameraController

Система кинематографического управления камерой:

```typescript
interface CinematicCameraController {
  // Основное управление
  initialize(camera: THREE.Camera, scene: THREE.Scene): void;
  enableInertialControls(): void;
  updateInertia(deltaTime: number): void;
  
  // Кинематографические переходы
  focusOnCrystal(crystal: CrystalTrack, duration: number): Promise<void>;
  returnToOverview(duration: number): Promise<void>;
  createCameraPath(start: THREE.Vector3, end: THREE.Vector3): THREE.CatmullRomCurve3;
  
  // Эффекты камеры
  enableDepthOfField(focusDistance: number, aperture: number): void;
  disableDepthOfField(): void;
  createCameraShake(intensity: number, duration: number): void;
}
```

**Технические детали:**
- Использование сплайнов Catmull-Rom для плавных траекторий камеры
- Система инерции с физически корректным затуханием
- Интеграция с Three.js EffectComposer для depth of field эффектов
- Адаптивная система LOD в зависимости от расстояния камеры

### 5. FocusTransitionSystem

Система кинематографических переходов при выборе трека:

```typescript
interface FocusTransitionSystem {
  // Переходы фокуса
  startFocusTransition(crystal: CrystalTrack): Promise<void>;
  endFocusTransition(): Promise<void>;
  
  // Эффекты перехода
  createBokeEffect(excludeCrystal: CrystalTrack): void;
  removeBokeEffect(): void;
  animateCrystalRotation(crystal: CrystalTrack): void;
  
  // Управление временем
  setTransitionDuration(duration: number): void;
  setEasingFunction(easing: EasingFunction): void;
}
```

## Data Models

### CrystalTrack

Расширенная модель трека для кристаллического представления:

```typescript
interface CrystalTrack extends ProcessedTrack {
  // Геометрические свойства
  crystalGeometry: THREE.BufferGeometry;
  facetCount: number;
  roughnessLevel: number;
  
  // Анимационные свойства
  pulseSpeed: number;        // Скорость пульсации (из BPM)
  pulseAmplitude: number;    // Амплитуда пульсации
  pulsePhase: number;        // Фаза пульсации для синхронизации
  
  // Визуальные свойства
  genreColor: THREE.Color;   // Глубокий неоновый цвет жанра
  emissiveIntensity: number; // Интенсивность свечения
  albumTexture?: THREE.Texture; // Искаженная текстура обложки
  
  // Состояние
  isFocused: boolean;
  isHovered: boolean;
  distanceFromCenter: number;
}
```

### NebulaConfig

Конфигурация туманности и космического фона:

```typescript
interface NebulaConfig {
  // Основные параметры
  intensity: number;         // Интенсивность туманности (0-1)
  colorPalette: THREE.Color[]; // Палитра цветов туманности
  density: number;           // Плотность частиц
  
  // Анимация
  driftSpeed: number;        // Скорость дрейфа туманности
  turbulence: number;        // Уровень турбулентности
  
  // Слои глубины
  layerCount: number;        // Количество слоев для параллакса
  layerSeparation: number;   // Расстояние между слоями
}
```

### GenreColorPalette

Расширенная палитра цветов для жанров в стиле неонового нуара:

```typescript
interface GenreColorPalette {
  metal: THREE.Color;        // Насыщенный красный #FF0040
  rock: THREE.Color;         // Холодный синий #0080FF
  punk: THREE.Color;         // Ядовито-зеленый #00FF40
  electronic: THREE.Color;  // Электрический фиолетовый #8000FF
  jazz: THREE.Color;         // Золотисто-желтый #FFD700
  classical: THREE.Color;    // Серебристо-белый #E0E0FF
  pop: THREE.Color;          // Розовый неон #FF0080
  indie: THREE.Color;        // Бирюзовый #00FFFF
  hiphop: THREE.Color;       // Оранжевый неон #FF8000
  default: THREE.Color;      // Нейтральный белый #FFFFFF
}
```

## Error Handling

### Система обработки ошибок

```typescript
interface SoulGalaxyErrorHandler {
  // Типы ошибок
  handleShaderCompilationError(error: Error): void;
  handleTextureLoadError(trackId: string, error: Error): void;
  handleGeometryGenerationError(track: ProcessedTrack, error: Error): void;
  handleAnimationError(error: Error): void;
  
  // Fallback стратегии
  useFallbackShader(): void;
  useDefaultTexture(trackId: string): void;
  useSimpleGeometry(track: ProcessedTrack): void;
  
  // Мониторинг производительности
  handlePerformanceWarning(warning: PerformanceWarning): void;
  enablePerformanceMode(): void;
}
```

### Стратегии восстановления

1. **Шейдерные ошибки**: Автоматический fallback на стандартные материалы Three.js
2. **Ошибки текстур**: Использование процедурных текстур на основе цвета жанра
3. **Ошибки геометрии**: Fallback на простые геометрические формы
4. **Проблемы производительности**: Автоматическое снижение качества эффектов

## Testing Strategy

### Модульное тестирование

```typescript
describe('CrystalTrackSystem', () => {
  test('should generate unique crystal geometry for each track', () => {
    // Тест генерации уникальной геометрии
  });
  
  test('should calculate correct pulse speed from BPM', () => {
    // Тест расчета скорости пульсации
  });
  
  test('should handle missing BPM data gracefully', () => {
    // Тест обработки отсутствующих данных BPM
  });
});

describe('CinematicCameraController', () => {
  test('should create smooth camera transitions', () => {
    // Тест плавности переходов камеры
  });
  
  test('should maintain 60fps during transitions', () => {
    // Тест производительности переходов
  });
});
```

### Интеграционное тестирование

```typescript
describe('Soul Galaxy Integration', () => {
  test('should switch between visual modes seamlessly', () => {
    // Тест переключения между режимами визуализации
  });
  
  test('should maintain audio synchronization during focus transitions', () => {
    // Тест синхронизации аудио и визуала
  });
  
  test('should handle large music collections (1000+ tracks)', () => {
    // Тест производительности с большими коллекциями
  });
});
```

### Производительное тестирование

```typescript
describe('Performance Tests', () => {
  test('should maintain 60fps with 500+ crystals', () => {
    // Тест производительности с множеством объектов
  });
  
  test('should use less than 512MB GPU memory', () => {
    // Тест использования GPU памяти
  });
  
  test('should load within 3 seconds on average hardware', () => {
    // Тест времени загрузки
  });
});
```

### Визуальное тестирование

1. **Кроссбраузерная совместимость**: Тестирование в Chrome, Firefox, Safari, Edge
2. **Различные разрешения**: От 1280x720 до 4K
3. **Производительность на разных GPU**: От интегрированных до высокопроизводительных
4. **Мобильные устройства**: Адаптация для планшетов и смартфонов

## Technical Implementation Notes

### Оптимизация производительности

1. **Instanced Rendering**: Использование THREE.InstancedMesh для кристаллов одного жанра
2. **Level of Detail (LOD)**: Автоматическое упрощение геометрии на расстоянии
3. **Frustum Culling**: Отсечение объектов вне поля зрения
4. **Texture Atlasing**: Объединение текстур обложек в атласы
5. **Shader Optimization**: Минимизация вычислений во фрагментном шейдере

### Совместимость с WebGL

- **WebGL 2.0**: Использование для расширенных возможностей шейдеров
- **WebGL 1.0 Fallback**: Упрощенная версия для старых браузеров
- **Extension Detection**: Автоматическое определение поддерживаемых расширений

### Адаптивность

- **Автоматическое определение производительности**: Динамическая настройка качества
- **Responsive Design**: Адаптация под различные размеры экрана
- **Touch Controls**: Поддержка сенсорного управления для мобильных устройств

Этот дизайн создает основу для реализации захватывающего визуального опыта "Галактика души", который превратит музыкальную коллекцию в кинематографическое путешествие через персональную вселенную звуков.