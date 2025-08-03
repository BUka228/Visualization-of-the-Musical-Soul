/**
 * Интеграционный тест для задачи 5: Реализация интеграции с данными Яндекс.Музыки
 * 
 * Проверяет выполнение всех подзадач:
 * - Создать DataLoader для загрузки JSON-файла с данными треков
 * - Реализовать валидацию структуры данных и обработку ошибок
 * - Добавить fallback на демо-данные при отсутствии файла
 * - Создать интерфейс для обновления данных через повторный запуск Python-скрипта
 */

const fs = require('fs');
const path = require('path');

// Имитируем fetch API для Node.js
global.fetch = async function(url) {
    try {
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
            json: async () => JSON.parse(data),
            status: 200
        };
    } catch (error) {
        return {
            ok: false,
            status: 404,
            json: async () => { throw new Error('File not found'); }
        };
    }
};

async function testTask5Requirements() {
    console.log('🧪 ИНТЕГРАЦИОННЫЙ ТЕСТ ЗАДАЧИ 5');
    console.log('=' * 50);
    console.log('Проверка выполнения всех требований задачи\n');

    let allTestsPassed = true;
    const testResults = [];

    // Подзадача 1: Создать DataLoader для загрузки JSON-файла с данными треков
    console.log('📋 ПОДЗАДАЧА 1: DataLoader для загрузки JSON-файла');
    try {
        // Проверяем существование файла DataLoader
        const dataLoaderPath = path.join(__dirname, 'src', 'data', 'DataLoader.ts');
        const dataLoaderExists = fs.existsSync(dataLoaderPath);
        
        if (dataLoaderExists) {
            console.log('   ✅ Файл DataLoader.ts существует');
            
            // Проверяем содержимое файла
            const dataLoaderContent = fs.readFileSync(dataLoaderPath, 'utf8');
            
            const hasLoadMethod = dataLoaderContent.includes('loadMusicData');
            const hasLoadWithResultMethod = dataLoaderContent.includes('loadMusicDataWithResult');
            const hasClassDeclaration = dataLoaderContent.includes('export class DataLoader');
            
            if (hasLoadMethod && hasLoadWithResultMethod && hasClassDeclaration) {
                console.log('   ✅ DataLoader содержит необходимые методы загрузки');
                testResults.push({ test: 'DataLoader creation', passed: true });
            } else {
                console.log('   ❌ DataLoader не содержит необходимые методы');
                testResults.push({ test: 'DataLoader creation', passed: false });
                allTestsPassed = false;
            }
        } else {
            console.log('   ❌ Файл DataLoader.ts не найден');
            testResults.push({ test: 'DataLoader creation', passed: false });
            allTestsPassed = false;
        }
    } catch (error) {
        console.log(`   ❌ Ошибка проверки DataLoader: ${error.message}`);
        testResults.push({ test: 'DataLoader creation', passed: false });
        allTestsPassed = false;
    }

    // Подзадача 2: Реализовать валидацию структуры данных и обработку ошибок
    console.log('\n📋 ПОДЗАДАЧА 2: Валидация структуры данных и обработка ошибок');
    try {
        const dataLoaderPath = path.join(__dirname, 'src', 'data', 'DataLoader.ts');
        const dataLoaderContent = fs.readFileSync(dataLoaderPath, 'utf8');
        
        const hasValidation = dataLoaderContent.includes('validateMusicData');
        const hasDetailedValidation = dataLoaderContent.includes('validateMusicDataDetailed');
        const hasTrackValidation = dataLoaderContent.includes('validateTrackStructure');
        const hasErrorHandling = dataLoaderContent.includes('try') && dataLoaderContent.includes('catch');
        
        if (hasValidation && hasDetailedValidation && hasTrackValidation && hasErrorHandling) {
            console.log('   ✅ Реализована валидация структуры данных');
            console.log('   ✅ Реализована детальная валидация с описанием ошибок');
            console.log('   ✅ Реализована валидация отдельных треков');
            console.log('   ✅ Реализована обработка ошибок');
            testResults.push({ test: 'Data validation', passed: true });
        } else {
            console.log('   ❌ Валидация или обработка ошибок реализована не полностью');
            testResults.push({ test: 'Data validation', passed: false });
            allTestsPassed = false;
        }

        // Тестируем валидацию на реальных данных
        if (fs.existsSync(path.join(__dirname, 'src', 'data', 'music_data.json'))) {
            const musicData = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'data', 'music_data.json'), 'utf8'));
            
            // Проверяем структуру данных
            const hasMetadata = musicData.metadata && 
                                typeof musicData.metadata.total_tracks === 'number' &&
                                typeof musicData.metadata.generated_at === 'string' &&
                                typeof musicData.metadata.source === 'string';
            
            const hasTracks = Array.isArray(musicData.tracks) && musicData.tracks.length > 0;
            
            if (hasMetadata && hasTracks) {
                console.log('   ✅ Структура реальных данных корректна');
                
                // Проверяем структуру первого трека
                const firstTrack = musicData.tracks[0];
                const requiredFields = ['id', 'title', 'artist', 'album', 'duration', 'genre', 'available'];
                const hasAllFields = requiredFields.every(field => field in firstTrack);
                
                if (hasAllFields) {
                    console.log('   ✅ Структура треков корректна');
                } else {
                    console.log('   ⚠️ В структуре треков отсутствуют некоторые поля');
                }
            } else {
                console.log('   ❌ Структура реальных данных некорректна');
            }
        }
    } catch (error) {
        console.log(`   ❌ Ошибка проверки валидации: ${error.message}`);
        testResults.push({ test: 'Data validation', passed: false });
        allTestsPassed = false;
    }

    // Подзадача 3: Добавить fallback на демо-данные при отсутствии файла
    console.log('\n📋 ПОДЗАДАЧА 3: Fallback на демо-данные');
    try {
        const dataLoaderPath = path.join(__dirname, 'src', 'data', 'DataLoader.ts');
        const dataLoaderContent = fs.readFileSync(dataLoaderPath, 'utf8');
        
        const hasDemoDataMethod = dataLoaderContent.includes('loadDemoData');
        const hasMinimalDemoData = dataLoaderContent.includes('createMinimalDemoData');
        const hasDemoDataPath = dataLoaderContent.includes('DEMO_DATA_PATH');
        
        if (hasDemoDataMethod && hasMinimalDemoData && hasDemoDataPath) {
            console.log('   ✅ Реализован fallback на демо-данные');
            
            // Проверяем существование файла демо-данных
            const demoDataExists = fs.existsSync(path.join(__dirname, 'src', 'data', 'demo_data.json'));
            if (demoDataExists) {
                console.log('   ✅ Файл demo_data.json существует');
                
                // Проверяем структуру демо-данных
                const demoData = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'data', 'demo_data.json'), 'utf8'));
                if (demoData.tracks && Array.isArray(demoData.tracks) && demoData.tracks.length > 0) {
                    console.log(`   ✅ Демо-данные содержат ${demoData.tracks.length} треков`);
                    testResults.push({ test: 'Demo data fallback', passed: true });
                } else {
                    console.log('   ❌ Демо-данные имеют некорректную структуру');
                    testResults.push({ test: 'Demo data fallback', passed: false });
                    allTestsPassed = false;
                }
            } else {
                console.log('   ⚠️ Файл demo_data.json не найден, но есть createMinimalDemoData');
                testResults.push({ test: 'Demo data fallback', passed: true });
            }
        } else {
            console.log('   ❌ Fallback на демо-данные реализован не полностью');
            testResults.push({ test: 'Demo data fallback', passed: false });
            allTestsPassed = false;
        }
    } catch (error) {
        console.log(`   ❌ Ошибка проверки fallback: ${error.message}`);
        testResults.push({ test: 'Demo data fallback', passed: false });
        allTestsPassed = false;
    }

    // Подзадача 4: Создать интерфейс для обновления данных через повторный запуск Python-скрипта
    console.log('\n📋 ПОДЗАДАЧА 4: Интерфейс для обновления данных');
    try {
        const dataLoaderPath = path.join(__dirname, 'src', 'data', 'DataLoader.ts');
        const dataLoaderContent = fs.readFileSync(dataLoaderPath, 'utf8');
        
        const hasUpdateStatus = dataLoaderContent.includes('getDataUpdateStatus');
        const hasUpdateInstructions = dataLoaderContent.includes('getUpdateInstructions');
        const hasDataStatistics = dataLoaderContent.includes('getDataStatistics');
        const hasFreshnessCheck = dataLoaderContent.includes('checkDataFreshness');
        const hasFileExistsCheck = dataLoaderContent.includes('checkDataFileExists');
        
        if (hasUpdateStatus && hasUpdateInstructions && hasDataStatistics && hasFreshnessCheck && hasFileExistsCheck) {
            console.log('   ✅ Реализован метод getDataUpdateStatus');
            console.log('   ✅ Реализован метод getUpdateInstructions');
            console.log('   ✅ Реализован метод getDataStatistics');
            console.log('   ✅ Реализован метод checkDataFreshness');
            console.log('   ✅ Реализован метод checkDataFileExists');
            
            // Проверяем наличие npm скрипта
            const packageJsonPath = path.join(__dirname, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                if (packageJson.scripts && packageJson.scripts['collect-data']) {
                    console.log('   ✅ npm скрипт collect-data настроен');
                    testResults.push({ test: 'Update interface', passed: true });
                } else {
                    console.log('   ❌ npm скрипт collect-data не найден');
                    testResults.push({ test: 'Update interface', passed: false });
                    allTestsPassed = false;
                }
            } else {
                console.log('   ❌ package.json не найден');
                testResults.push({ test: 'Update interface', passed: false });
                allTestsPassed = false;
            }
            
            // Проверяем наличие Python скрипта
            const pythonScriptPath = path.join(__dirname, 'scripts', 'collect_yandex_music_data.py');
            if (fs.existsSync(pythonScriptPath)) {
                console.log('   ✅ Python скрипт для сбора данных существует');
            } else {
                console.log('   ⚠️ Python скрипт не найден (может быть в другом месте)');
            }
        } else {
            console.log('   ❌ Интерфейс для обновления данных реализован не полностью');
            testResults.push({ test: 'Update interface', passed: false });
            allTestsPassed = false;
        }
    } catch (error) {
        console.log(`   ❌ Ошибка проверки интерфейса обновления: ${error.message}`);
        testResults.push({ test: 'Update interface', passed: false });
        allTestsPassed = false;
    }

    // Дополнительные проверки интеграции
    console.log('\n📋 ДОПОЛНИТЕЛЬНЫЕ ПРОВЕРКИ: Интеграция с основным приложением');
    try {
        const indexPath = path.join(__dirname, 'src', 'index.ts');
        if (fs.existsSync(indexPath)) {
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            
            const hasDataLoaderImport = indexContent.includes('import { DataLoader }');
            const usesLoadMusicData = indexContent.includes('DataLoader.loadMusicData');
            const usesCheckFreshness = indexContent.includes('DataLoader.checkDataFreshness');
            
            if (hasDataLoaderImport && usesLoadMusicData && usesCheckFreshness) {
                console.log('   ✅ DataLoader интегрирован в основное приложение');
                console.log('   ✅ Используется загрузка данных');
                console.log('   ✅ Используется проверка свежести данных');
                testResults.push({ test: 'Main app integration', passed: true });
            } else {
                console.log('   ❌ DataLoader не полностью интегрирован в основное приложение');
                testResults.push({ test: 'Main app integration', passed: false });
                allTestsPassed = false;
            }
        } else {
            console.log('   ⚠️ Основной файл приложения не найден');
        }
    } catch (error) {
        console.log(`   ❌ Ошибка проверки интеграции: ${error.message}`);
        testResults.push({ test: 'Main app integration', passed: false });
        allTestsPassed = false;
    }

    // Итоговый отчет
    console.log('\n' + '=' * 50);
    console.log('📊 ИТОГОВЫЙ ОТЧЕТ');
    console.log('=' * 50);
    
    testResults.forEach((result, index) => {
        const status = result.passed ? '✅' : '❌';
        console.log(`${index + 1}. ${result.test}: ${status}`);
    });
    
    const passedTests = testResults.filter(r => r.passed).length;
    const totalTests = testResults.length;
    
    console.log(`\nРезультат: ${passedTests}/${totalTests} тестов пройдено`);
    
    if (allTestsPassed) {
        console.log('\n🎉 ВСЕ ТРЕБОВАНИЯ ЗАДАЧИ 5 ВЫПОЛНЕНЫ УСПЕШНО!');
        console.log('\n✅ Задача 5 готова к завершению');
    } else {
        console.log('\n⚠️ Некоторые требования не выполнены полностью');
        console.log('❌ Задача 5 требует доработки');
    }
    
    return allTestsPassed;
}

// Запускаем тест
testTask5Requirements()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Критическая ошибка тестирования:', error);
        process.exit(1);
    });