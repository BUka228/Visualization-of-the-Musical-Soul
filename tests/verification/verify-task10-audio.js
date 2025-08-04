// Скрипт для проверки интеграции аудио-системы (Task 10)

console.log('🎵 Начинаем проверку интеграции аудио-системы...');

// Проверяем, что все необходимые модули загружены
function checkModulesLoaded() {
    const checks = [
        { name: 'SceneManager', condition: window.sceneManager !== undefined },
        { name: 'AudioManager', condition: window.audioManager !== undefined },
        { name: 'InteractionManager', condition: window.sceneManager?.getInteractionManager !== undefined }
    ];

    console.log('\n📋 Проверка загрузки модулей:');
    checks.forEach(check => {
        const status = check.condition ? '✅' : '❌';
        console.log(`${status} ${check.name}: ${check.condition ? 'Загружен' : 'Не найден'}`);
    });

    return checks.every(check => check.condition);
}

// Проверяем интерфейс AudioManager
function checkAudioManagerInterface() {
    console.log('\n🔍 Проверка интерфейса AudioManager:');
    
    if (!window.audioManager) {
        console.log('❌ AudioManager не найден');
        return false;
    }

    const requiredMethods = [
        'playPreview',
        'stopPreview', 
        'setVolume',
        'getCurrentTime',
        'isPlaying',
        'getDuration',
        'getProgress',
        'setCurrentTime',
        'pause',
        'resume',
        'setOnPlayStart',
        'setOnPlayEnd',
        'setOnError',
        'dispose'
    ];

    let allMethodsPresent = true;
    requiredMethods.forEach(method => {
        const exists = typeof window.audioManager[method] === 'function';
        const status = exists ? '✅' : '❌';
        console.log(`${status} ${method}: ${exists ? 'Присутствует' : 'Отсутствует'}`);
        if (!exists) allMethodsPresent = false;
    });

    return allMethodsPresent;
}

// Проверяем интеграцию с InteractionManager
function checkInteractionIntegration() {
    console.log('\n🔗 Проверка интеграции с InteractionManager:');
    
    const interactionManager = window.sceneManager?.getInteractionManager();
    if (!interactionManager) {
        console.log('❌ InteractionManager не найден');
        return false;
    }

    const hasGetAudioManager = typeof interactionManager.getAudioManager === 'function';
    console.log(`${hasGetAudioManager ? '✅' : '❌'} getAudioManager: ${hasGetAudioManager ? 'Присутствует' : 'Отсутствует'}`);

    if (hasGetAudioManager) {
        const audioManager = interactionManager.getAudioManager();
        const isAudioManagerValid = audioManager && typeof audioManager.playPreview === 'function';
        console.log(`${isAudioManagerValid ? '✅' : '❌'} AudioManager из InteractionManager: ${isAudioManagerValid ? 'Валидный' : 'Невалидный'}`);
        return isAudioManagerValid;
    }

    return false;
}

// Проверяем обработку ошибок аудио
function checkAudioErrorHandling() {
    console.log('\n⚠️ Проверка обработки ошибок аудио:');
    
    return new Promise((resolve) => {
        if (!window.audioManager) {
            console.log('❌ AudioManager не найден для тестирования ошибок');
            resolve(false);
            return;
        }

        let errorHandled = false;
        
        // Устанавливаем обработчик ошибок
        window.audioManager.setOnError((error) => {
            console.log('✅ Обработчик ошибок сработал:', error.message);
            errorHandled = true;
        });

        // Пытаемся воспроизвести несуществующий файл
        const invalidUrl = 'https://invalid-url-for-testing.com/nonexistent.mp3';
        
        window.audioManager.playPreview(invalidUrl)
            .then(() => {
                console.log('⚠️ Неожиданно: воспроизведение прошло без ошибок');
                resolve(false);
            })
            .catch((error) => {
                console.log('✅ Ошибка корректно обработана в Promise:', error.message);
                
                // Даем время для срабатывания коллбэка
                setTimeout(() => {
                    resolve(errorHandled);
                }, 1000);
            });
    });
}

// Проверяем управление громкостью
function checkVolumeControl() {
    console.log('\n🔊 Проверка управления громкостью:');
    
    if (!window.audioManager) {
        console.log('❌ AudioManager не найден');
        return false;
    }

    try {
        // Тестируем различные значения громкости
        const testVolumes = [0, 0.5, 1.0, 1.5, -0.5]; // Включая граничные случаи
        
        testVolumes.forEach(volume => {
            window.audioManager.setVolume(volume);
            console.log(`✅ Громкость ${volume} установлена успешно`);
        });
        
        return true;
    } catch (error) {
        console.log('❌ Ошибка при установке громкости:', error.message);
        return false;
    }
}

// Проверяем состояние воспроизведения
function checkPlaybackState() {
    console.log('\n▶️ Проверка состояния воспроизведения:');
    
    if (!window.audioManager) {
        console.log('❌ AudioManager не найден');
        return false;
    }

    try {
        const isPlaying = window.audioManager.isPlaying();
        const currentTime = window.audioManager.getCurrentTime();
        const duration = window.audioManager.getDuration();
        const progress = window.audioManager.getProgress();

        console.log(`✅ isPlaying(): ${isPlaying}`);
        console.log(`✅ getCurrentTime(): ${currentTime}`);
        console.log(`✅ getDuration(): ${duration}`);
        console.log(`✅ getProgress(): ${progress}%`);

        return true;
    } catch (error) {
        console.log('❌ Ошибка при проверке состояния:', error.message);
        return false;
    }
}

// Проверяем интеграцию с выбором треков
function checkTrackSelectionIntegration() {
    console.log('\n🎯 Проверка интеграции с выбором треков:');
    
    const interactionManager = window.sceneManager?.getInteractionManager();
    if (!interactionManager) {
        console.log('❌ InteractionManager не найден');
        return false;
    }

    // Проверяем, что методы selectTrack и deselectTrack существуют
    const hasSelectTrack = typeof interactionManager.selectTrack === 'function';
    const hasDeselectTrack = typeof interactionManager.deselectTrack === 'function';

    console.log(`${hasSelectTrack ? '✅' : '❌'} selectTrack: ${hasSelectTrack ? 'Присутствует' : 'Отсутствует'}`);
    console.log(`${hasDeselectTrack ? '✅' : '❌'} deselectTrack: ${hasDeselectTrack ? 'Присутствует' : 'Отсутствует'}`);

    // Проверяем, что есть треки для выбора
    const trackObjects = window.sceneManager?.getTrackObjects();
    const hasTrackObjects = trackObjects && trackObjects.length > 0;
    console.log(`${hasTrackObjects ? '✅' : '❌'} Объекты треков: ${hasTrackObjects ? `${trackObjects.length} найдено` : 'Не найдены'}`);

    return hasSelectTrack && hasDeselectTrack && hasTrackObjects;
}

// Основная функция проверки
async function runAudioSystemVerification() {
    console.log('🎵 === ПРОВЕРКА ИНТЕГРАЦИИ АУДИО-СИСТЕМЫ (TASK 10) ===\n');

    const results = {
        modulesLoaded: false,
        audioManagerInterface: false,
        interactionIntegration: false,
        errorHandling: false,
        volumeControl: false,
        playbackState: false,
        trackSelectionIntegration: false
    };

    try {
        // Ждем инициализации приложения
        await new Promise(resolve => {
            if (window.sceneManager && window.audioManager) {
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (window.sceneManager && window.audioManager) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                
                // Таймаут через 10 секунд
                setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve();
                }, 10000);
            }
        });

        // Выполняем проверки
        results.modulesLoaded = checkModulesLoaded();
        results.audioManagerInterface = checkAudioManagerInterface();
        results.interactionIntegration = checkInteractionIntegration();
        results.errorHandling = await checkAudioErrorHandling();
        results.volumeControl = checkVolumeControl();
        results.playbackState = checkPlaybackState();
        results.trackSelectionIntegration = checkTrackSelectionIntegration();

    } catch (error) {
        console.error('❌ Ошибка во время проверки:', error);
    }

    // Подводим итоги
    console.log('\n📊 === РЕЗУЛЬТАТЫ ПРОВЕРКИ ===');
    const totalChecks = Object.keys(results).length;
    const passedChecks = Object.values(results).filter(Boolean).length;

    Object.entries(results).forEach(([check, passed]) => {
        const status = passed ? '✅' : '❌';
        const checkName = check.replace(/([A-Z])/g, ' $1').toLowerCase();
        console.log(`${status} ${checkName}: ${passed ? 'ПРОЙДЕНО' : 'НЕ ПРОЙДЕНО'}`);
    });

    console.log(`\n🎯 Общий результат: ${passedChecks}/${totalChecks} проверок пройдено`);
    
    if (passedChecks === totalChecks) {
        console.log('🎉 ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ! Интеграция аудио-системы работает корректно.');
    } else {
        console.log('⚠️ Некоторые проверки не пройдены. Требуется дополнительная отладка.');
    }

    return results;
}

// Экспортируем функцию для использования в консоли
window.runAudioSystemVerification = runAudioSystemVerification;

// Автоматически запускаем проверку через 3 секунды после загрузки
setTimeout(() => {
    runAudioSystemVerification();
}, 3000);

console.log('✅ Скрипт проверки аудио-системы загружен. Автоматическая проверка начнется через 3 секунды.');
console.log('💡 Для ручного запуска используйте: runAudioSystemVerification()');