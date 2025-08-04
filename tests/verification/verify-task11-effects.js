/**
 * Скрипт для проверки системы частиц и эффектов (Task 11)
 * Проверяет функциональность ParticleSystem, LightingEffects и EffectsManager
 */

console.log('🎭 Начинаем проверку системы частиц и эффектов...');

// Функция для проверки создания и инициализации эффектов
function checkEffectsInitialization() {
    console.log('\n📋 Проверка 1: Инициализация системы эффектов');
    
    try {
        // Проверяем, что EffectsManager создан и инициализирован
        if (typeof window.sceneManager === 'undefined') {
            console.error('❌ SceneManager не найден');
            return false;
        }
        
        const effectsManager = window.sceneManager.getEffectsManager();
        if (!effectsManager) {
            console.error('❌ EffectsManager не найден');
            return false;
        }
        
        if (!effectsManager.isReady()) {
            console.error('❌ EffectsManager не инициализирован');
            return false;
        }
        
        console.log('✅ EffectsManager успешно создан и инициализирован');
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка при проверке инициализации:', error);
        return false;
    }
}

// Функция для проверки звездного поля
function checkStarField() {
    console.log('\n📋 Проверка 2: Звездное поле');
    
    try {
        const effectsManager = window.sceneManager.getEffectsManager();
        const stats = effectsManager.getEffectsStats();
        
        if (stats.starCount === 0) {
            console.error('❌ Звездное поле не создано');
            return false;
        }
        
        console.log(`✅ Звездное поле создано с ${stats.starCount} звездами`);
        
        // Проверяем, что звезды видны в сцене
        const scene = window.sceneManager.getScene();
        const starField = scene.children.find(child => 
            child.type === 'Points' && child.geometry && child.geometry.attributes.position
        );
        
        if (!starField) {
            console.error('❌ Звездное поле не найдено в сцене');
            return false;
        }
        
        console.log('✅ Звездное поле присутствует в сцене');
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка при проверке звездного поля:', error);
        return false;
    }
}

// Функция для проверки частиц выбора
function checkSelectionParticles() {
    console.log('\n📋 Проверка 3: Частицы вокруг выбранного объекта');
    
    try {
        const effectsManager = window.sceneManager.getEffectsManager();
        const stats = effectsManager.getEffectsStats();
        
        if (stats.selectionParticleCount === 0) {
            console.error('❌ Система частиц выбора не создана');
            return false;
        }
        
        console.log(`✅ Система частиц выбора создана с ${stats.selectionParticleCount} частицами`);
        
        // Проверяем активацию частиц при выборе объекта
        const trackObjects = window.sceneManager.getTrackObjects();
        if (trackObjects.length === 0) {
            console.warn('⚠️ Нет объектов треков для тестирования');
            return true;
        }
        
        // Выбираем первый трек
        const firstTrack = trackObjects[0];
        const interactionManager = window.sceneManager.getInteractionManager();
        interactionManager.selectTrack(firstTrack);
        
        // Проверяем, что частицы активированы
        setTimeout(() => {
            const updatedStats = effectsManager.getEffectsStats();
            if (updatedStats.isSelectionActive) {
                console.log('✅ Частицы выбора успешно активированы');
            } else {
                console.error('❌ Частицы выбора не активированы при выборе объекта');
            }
        }, 100);
        
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка при проверке частиц выбора:', error);
        return false;
    }
}

// Функция для проверки световых эффектов
function checkLightingEffects() {
    console.log('\n📋 Проверка 4: Световые эффекты и блики');
    
    try {
        const effectsManager = window.sceneManager.getEffectsManager();
        const stats = effectsManager.getEffectsStats();
        
        // Проверяем, что есть активные эффекты свечения при выборе объекта
        if (stats.activeGlowCount === 0 && stats.isSelectionActive) {
            console.warn('⚠️ Нет активных эффектов свечения при выбранном объекте');
        } else if (stats.activeGlowCount > 0) {
            console.log(`✅ Активны ${stats.activeGlowCount} эффектов свечения`);
        }
        
        // Проверяем наличие динамических источников света в сцене
        const scene = window.sceneManager.getScene();
        const lights = scene.children.filter(child => 
            child.type === 'PointLight' || child.type === 'AmbientLight'
        );
        
        if (lights.length === 0) {
            console.error('❌ Динамические источники света не найдены');
            return false;
        }
        
        console.log(`✅ Найдено ${lights.length} источников света в сцене`);
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка при проверке световых эффектов:', error);
        return false;
    }
}

// Функция для проверки пульсации в ритм музыки
function checkMusicPulse() {
    console.log('\n📋 Проверка 5: Пульсация объектов в ритм музыки');
    
    try {
        const effectsManager = window.sceneManager.getEffectsManager();
        const stats = effectsManager.getEffectsStats();
        
        if (!stats.isMusicPulseEnabled) {
            console.warn('⚠️ Пульсация в ритм музыки отключена');
        } else {
            console.log('✅ Пульсация в ритм музыки включена');
        }
        
        console.log(`📊 Количество пульсирующих объектов: ${stats.pulseObjectsCount}`);
        
        // Тестируем включение/выключение пульсации
        effectsManager.setMusicPulseEnabled(false);
        const disabledStats = effectsManager.getEffectsStats();
        
        if (disabledStats.isMusicPulseEnabled) {
            console.error('❌ Не удалось отключить пульсацию в ритм музыки');
            return false;
        }
        
        effectsManager.setMusicPulseEnabled(true);
        const enabledStats = effectsManager.getEffectsStats();
        
        if (!enabledStats.isMusicPulseEnabled) {
            console.error('❌ Не удалось включить пульсацию в ритм музыки');
            return false;
        }
        
        console.log('✅ Управление пульсацией в ритм музыки работает корректно');
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка при проверке пульсации в ритм музыки:', error);
        return false;
    }
}

// Функция для проверки дополнительных эффектов
function checkAdditionalEffects() {
    console.log('\n📋 Проверка 6: Дополнительные эффекты');
    
    try {
        const effectsManager = window.sceneManager.getEffectsManager();
        const trackObjects = window.sceneManager.getTrackObjects();
        
        if (trackObjects.length === 0) {
            console.warn('⚠️ Нет объектов треков для тестирования дополнительных эффектов');
            return true;
        }
        
        // Тестируем эффект взрыва
        const randomTrack = trackObjects[Math.floor(Math.random() * trackObjects.length)];
        effectsManager.createTrackChangeExplosion(randomTrack.position, randomTrack.trackData.color);
        console.log('✅ Эффект взрыва создан успешно');
        
        // Тестируем эффект ауры жанра
        const rockTracks = trackObjects.filter(obj => obj.trackData.genre === 'rock');
        if (rockTracks.length > 0) {
            effectsManager.createGenreAura(rockTracks, '#ff4444');
            console.log(`✅ Эффект ауры создан для ${rockTracks.length} треков жанра rock`);
        }
        
        // Тестируем эффекты появления и исчезновения
        if (trackObjects.length > 0) {
            effectsManager.createTrackAppearanceEffect(trackObjects[0]);
            console.log('✅ Эффект появления трека создан');
            
            setTimeout(() => {
                effectsManager.createTrackDisappearanceEffect(trackObjects[0]);
                console.log('✅ Эффект исчезновения трека создан');
            }, 1000);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка при проверке дополнительных эффектов:', error);
        return false;
    }
}

// Функция для проверки производительности эффектов
function checkEffectsPerformance() {
    console.log('\n📋 Проверка 7: Производительность эффектов');
    
    try {
        const startTime = performance.now();
        const effectsManager = window.sceneManager.getEffectsManager();
        
        // Выполняем несколько циклов обновления эффектов
        for (let i = 0; i < 100; i++) {
            effectsManager.update(16); // 60 FPS
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`⏱️ Время выполнения 100 обновлений эффектов: ${duration.toFixed(2)}ms`);
        
        if (duration > 100) {
            console.warn('⚠️ Производительность эффектов может быть недостаточной');
        } else {
            console.log('✅ Производительность эффектов в норме');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка при проверке производительности:', error);
        return false;
    }
}

// Функция для проверки управления эффектами
function checkEffectsControl() {
    console.log('\n📋 Проверка 8: Управление эффектами');
    
    try {
        const effectsManager = window.sceneManager.getEffectsManager();
        
        // Тестируем включение/выключение эффектов
        effectsManager.setEffectsEnabled(false);
        if (effectsManager.areEffectsEnabled()) {
            console.error('❌ Не удалось отключить эффекты');
            return false;
        }
        
        effectsManager.setEffectsEnabled(true);
        if (!effectsManager.areEffectsEnabled()) {
            console.error('❌ Не удалось включить эффекты');
            return false;
        }
        
        console.log('✅ Управление включением/выключением эффектов работает');
        
        // Тестируем настройки освещения
        effectsManager.setLightingSettings(3.0, 0.8);
        console.log('✅ Настройки освещения применены');
        
        // Тестируем настройки системы частиц
        effectsManager.setParticleSystemSettings(3000, 150);
        console.log('✅ Настройки системы частиц применены');
        
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка при проверке управления эффектами:', error);
        return false;
    }
}

// Основная функция проверки
async function runEffectsVerification() {
    console.log('🎭 Запуск полной проверки системы частиц и эффектов...\n');
    
    // Ждем инициализации сцены
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const checks = [
        { name: 'Инициализация системы эффектов', fn: checkEffectsInitialization },
        { name: 'Звездное поле', fn: checkStarField },
        { name: 'Частицы выбора', fn: checkSelectionParticles },
        { name: 'Световые эффекты', fn: checkLightingEffects },
        { name: 'Пульсация в ритм музыки', fn: checkMusicPulse },
        { name: 'Дополнительные эффекты', fn: checkAdditionalEffects },
        { name: 'Производительность эффектов', fn: checkEffectsPerformance },
        { name: 'Управление эффектами', fn: checkEffectsControl }
    ];
    
    let passedChecks = 0;
    const totalChecks = checks.length;
    
    for (const check of checks) {
        try {
            const result = await check.fn();
            if (result) {
                passedChecks++;
            }
        } catch (error) {
            console.error(`❌ Ошибка в проверке "${check.name}":`, error);
        }
        
        // Небольшая пауза между проверками
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Итоговый отчет
    console.log('\n' + '='.repeat(50));
    console.log('📊 ИТОГОВЫЙ ОТЧЕТ ПРОВЕРКИ ЭФФЕКТОВ');
    console.log('='.repeat(50));
    console.log(`✅ Пройдено проверок: ${passedChecks}/${totalChecks}`);
    console.log(`📈 Процент успешности: ${Math.round((passedChecks / totalChecks) * 100)}%`);
    
    if (passedChecks === totalChecks) {
        console.log('🎉 ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ УСПЕШНО!');
        console.log('🎭 Система частиц и эффектов работает корректно');
    } else {
        console.log('⚠️ Некоторые проверки не пройдены');
        console.log('🔧 Требуется дополнительная отладка');
    }
    
    // Дополнительная информация о системе
    try {
        const effectsManager = window.sceneManager.getEffectsManager();
        const stats = effectsManager.getEffectsStats();
        
        console.log('\n📋 Текущая статистика эффектов:');
        console.log(`⭐ Звезды: ${stats.starCount}`);
        console.log(`✨ Частицы выбора: ${stats.selectionParticleCount}`);
        console.log(`💡 Активные свечения: ${stats.activeGlowCount}`);
        console.log(`🎵 Пульсирующие объекты: ${stats.pulseObjectsCount}`);
        console.log(`🎯 Эффекты выбора активны: ${stats.isSelectionActive ? 'Да' : 'Нет'}`);
        console.log(`🎶 Пульсация музыки: ${stats.isMusicPulseEnabled ? 'Включена' : 'Выключена'}`);
        
    } catch (error) {
        console.error('❌ Ошибка при получении статистики:', error);
    }
    
    console.log('\n🎭 Проверка системы частиц и эффектов завершена');
}

// Экспортируем функцию для использования в HTML
window.runEffectsVerification = runEffectsVerification;

// Автоматический запуск проверки через 3 секунды после загрузки
setTimeout(() => {
    if (typeof window.sceneManager !== 'undefined') {
        runEffectsVerification();
    } else {
        console.log('⏳ Ожидание инициализации сцены...');
        setTimeout(runEffectsVerification, 2000);
    }
}, 3000);

console.log('📝 Скрипт проверки эффектов загружен. Проверка начнется автоматически...');