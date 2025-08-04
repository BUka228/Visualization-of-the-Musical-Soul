import * as THREE from 'three';
import { CrystalTrack } from '../types';
import { DepthOfFieldSystem } from './DepthOfFieldSystem';

/**
 * Настройки анимации фокуса
 */
export interface FocusAnimationSettings {
    transitionDuration: number;     // Длительность перехода в секундах
    easing: 'linear' | 'easeInOut' | 'easeOut' | 'easeIn';
    optimalDistance: number;        // Оптимальное расстояние до кристалла
    optimalAngle: number;          // Оптимальный угол обзора в радианах
    returnDuration: number;         // Длительность возврата в секундах
    enableDepthOfField: boolean;    // Включать ли depth of field при фокусе
}

/**
 * Состояние анимации фокуса
 */
interface FocusState {
    isAnimating: boolean;
    isReturning: boolean;
    isFocused: boolean;
    startTime: number;
    duration: number;
    startPosition: THREE.Vector3;
    targetPosition: THREE.Vector3;
    startTarget: THREE.Vector3;
    targetTarget: THREE.Vector3;
    focusedCrystal?: CrystalTrack;
    savedPosition?: THREE.Vector3;
    savedTarget?: THREE.Vector3;
}

/**
 * Система анимации фокуса на кристалле
 * Реализует резкую фокусировку сцены с быстрым и плавным полетом камеры
 */
export class FocusAnimationSystem {
    private camera: THREE.PerspectiveCamera;
    private depthOfFieldSystem?: DepthOfFieldSystem;
    
    // Настройки системы
    private settings: FocusAnimationSettings = {
        transitionDuration: 1.5,        // 1.5 секунды для перехода
        easing: 'easeInOut',
        optimalDistance: 8.0,           // Оптимальное расстояние до кристалла
        optimalAngle: Math.PI / 6,      // 30 градусов
        returnDuration: 2.0,            // 2 секунды для возврата
        enableDepthOfField: true
    };
    
    // Состояние анимации
    private focusState: FocusState = {
        isAnimating: false,
        isReturning: false,
        isFocused: false,
        startTime: 0,
        duration: 0,
        startPosition: new THREE.Vector3(),
        targetPosition: new THREE.Vector3(),
        startTarget: new THREE.Vector3(),
        targetTarget: new THREE.Vector3()
    };
    
    // Коллбэки для событий
    private onFocusStart?: (crystal: CrystalTrack) => void;
    private onFocusComplete?: (crystal: CrystalTrack) => void;
    private onReturnStart?: () => void;
    private onReturnComplete?: () => void;
    
    constructor(camera: THREE.PerspectiveCamera, depthOfFieldSystem?: DepthOfFieldSystem, scene?: THREE.Scene) {
        this.camera = camera;
        this.depthOfFieldSystem = depthOfFieldSystem;
        
        // Сохраняем ссылку на сцену для поиска кристаллов
        if (scene) {
            (this.camera as any).scene = scene;
        }
        
        console.log('🎯 Focus Animation System created');
    }
    
    /**
     * Начать анимацию фокуса на кристалле
     */
    public async focusOnCrystal(crystal: CrystalTrack): Promise<void> {
        if (this.focusState.isAnimating) {
            console.warn('⚠️ Focus animation already in progress');
            return;
        }
        
        console.log(`🎯 Starting focus animation on crystal: ${crystal.name} by ${crystal.artist}`);
        
        // Сохраняем текущую позицию камеры для возврата
        this.saveCameraPosition();
        
        // Рассчитываем оптимальную позицию камеры
        const optimalPosition = this.calculateOptimalCameraPosition(crystal);
        const targetPoint = this.getCrystalWorldPosition(crystal);
        
        // Настраиваем состояние анимации
        this.focusState = {
            isAnimating: true,
            isReturning: false,
            isFocused: false,
            startTime: performance.now(),
            duration: this.settings.transitionDuration * 1000, // Конвертируем в миллисекунды
            startPosition: this.camera.position.clone(),
            targetPosition: optimalPosition,
            startTarget: this.getCameraLookAtTarget(),
            targetTarget: targetPoint,
            focusedCrystal: crystal
        };
        
        // Включаем depth of field если настроено
        if (this.settings.enableDepthOfField && this.depthOfFieldSystem) {
            this.depthOfFieldSystem.enableDepthOfField({
                focus: this.settings.optimalDistance,
                aperture: 0.05,
                maxblur: 0.02
            });
        }
        
        // Вызываем коллбэк начала фокуса
        if (this.onFocusStart) {
            this.onFocusStart(crystal);
        }
        
        // Возвращаем промис, который разрешится по завершении анимации
        return new Promise((resolve) => {
            const checkComplete = () => {
                if (!this.focusState.isAnimating && this.focusState.isFocused) {
                    resolve();
                } else {
                    requestAnimationFrame(checkComplete);
                }
            };
            checkComplete();
        });
    }
    
    /**
     * Начать анимацию возврата к предыдущей позиции
     */
    public async returnToPreviousPosition(): Promise<void> {
        if (this.focusState.isAnimating || !this.focusState.isFocused) {
            console.warn('⚠️ Cannot return: not focused or animation in progress');
            return;
        }
        
        if (!this.focusState.savedPosition || !this.focusState.savedTarget) {
            console.warn('⚠️ No saved camera position to return to');
            return;
        }
        
        console.log('🔄 Starting return animation to previous position');
        
        // Настраиваем состояние анимации возврата
        this.focusState = {
            ...this.focusState,
            isAnimating: true,
            isReturning: true,
            isFocused: false,
            startTime: performance.now(),
            duration: this.settings.returnDuration * 1000,
            startPosition: this.camera.position.clone(),
            targetPosition: this.focusState.savedPosition.clone(),
            startTarget: this.getCameraLookAtTarget(),
            targetTarget: this.focusState.savedTarget.clone()
        };
        
        // Отключаем depth of field
        if (this.depthOfFieldSystem) {
            this.depthOfFieldSystem.disableDepthOfField();
        }
        
        // Вызываем коллбэк начала возврата
        if (this.onReturnStart) {
            this.onReturnStart();
        }
        
        // Возвращаем промис, который разрешится по завершении анимации
        return new Promise((resolve) => {
            const checkComplete = () => {
                if (!this.focusState.isAnimating && !this.focusState.isReturning) {
                    resolve();
                } else {
                    requestAnimationFrame(checkComplete);
                }
            };
            checkComplete();
        });
    }
    
    /**
     * Рассчитывает оптимальную позицию камеры для просмотра кристалла
     */
    private calculateOptimalCameraPosition(crystal: CrystalTrack): THREE.Vector3 {
        // Получаем реальную мировую позицию кристалла с учетом трансформаций группы
        const crystalWorldPosition = this.getCrystalWorldPosition(crystal);
        
        // Рассчитываем направление от центра к кристаллу
        const directionFromCenter = crystalWorldPosition.clone().normalize();
        
        // Добавляем небольшое смещение для более интересного угла
        const offsetAngle = this.settings.optimalAngle;
        const perpendicular = new THREE.Vector3()
            .crossVectors(directionFromCenter, new THREE.Vector3(0, 1, 0))
            .normalize();
        
        // Если perpendicular получился нулевым (кристалл на оси Y), используем другой вектор
        if (perpendicular.length() < 0.001) {
            perpendicular.set(1, 0, 0);
        }
        
        // Создаем поворот для более кинематографического угла
        const rotationMatrix = new THREE.Matrix4().makeRotationAxis(perpendicular, offsetAngle);
        const optimalDirection = directionFromCenter.clone().applyMatrix4(rotationMatrix);
        
        // Позиционируем камеру на оптимальном расстоянии
        const optimalPosition = crystalWorldPosition.clone()
            .add(optimalDirection.multiplyScalar(this.settings.optimalDistance));
        
        console.log(`📐 Calculated optimal camera position:`, {
            crystalLocal: crystal.position,
            crystalWorld: crystalWorldPosition,
            camera: optimalPosition,
            distance: optimalPosition.distanceTo(crystalWorldPosition)
        });
        
        return optimalPosition;
    }
    
    /**
     * Получает реальную мировую позицию кристалла с учетом трансформаций группы
     */
    private getCrystalWorldPosition(crystal: CrystalTrack): THREE.Vector3 {
        // Пытаемся найти mesh кристалла в сцене для получения точной позиции
        const scene = this.findSceneFromCamera();
        
        if (scene) {
            const crystalMesh = this.findCrystalMeshInScene(scene, crystal.id);
            if (crystalMesh) {
                const worldPosition = new THREE.Vector3();
                crystalMesh.getWorldPosition(worldPosition);
                console.log(`✅ Found crystal mesh for ${crystal.name}, world position:`, worldPosition);
                return worldPosition;
            } else {
                console.warn(`⚠️ Crystal mesh not found in scene for ${crystal.name} (ID: ${crystal.id})`);
                // Попробуем найти по имени трека как fallback
                const meshByName = this.findCrystalMeshByName(scene, crystal.name, crystal.artist);
                if (meshByName) {
                    const worldPosition = new THREE.Vector3();
                    meshByName.getWorldPosition(worldPosition);
                    console.log(`✅ Found crystal mesh by name for ${crystal.name}, world position:`, worldPosition);
                    return worldPosition;
                }
            }
        } else {
            console.warn('⚠️ Could not find scene from camera');
        }
        
        // Fallback: если кристалл находится в группе, учитываем трансформацию группы
        if (crystal.position) {
            // Попробуем найти группу кристаллов в сцене
            const crystalCluster = this.findCrystalClusterInScene();
            if (crystalCluster) {
                const worldPosition = crystal.position.clone();
                crystalCluster.localToWorld(worldPosition);
                console.log(`🔄 Using cluster-transformed position for ${crystal.name}:`, worldPosition);
                return worldPosition;
            }
        }
        
        // Последний fallback на локальную позицию кристалла
        console.warn(`⚠️ Using local position for ${crystal.name} as final fallback`);
        return crystal.position.clone();
    }
    
    /**
     * Находит сцену через иерархию объектов
     */
    private findSceneFromCamera(): THREE.Scene | null {
        // Сначала пытаемся найти через иерархию родителей
        let current: THREE.Object3D | null = this.camera;
        while (current && current.parent) {
            current = current.parent;
            if (current instanceof THREE.Scene) {
                return current;
            }
        }
        
        // Если не нашли через родителей, пытаемся найти через userData камеры
        if ((this.camera as any).scene) {
            return (this.camera as any).scene;
        }
        
        // Последний способ - поиск через глобальные переменные (если они есть)
        if (typeof window !== 'undefined') {
            // Проверяем глобальные переменные, которые могут содержать сцену
            const globalVars = ['scene', 'mainScene', 'threeScene'];
            for (const varName of globalVars) {
                const globalScene = (window as any)[varName];
                if (globalScene && globalScene instanceof THREE.Scene) {
                    console.log(`🔍 Found scene through global variable: ${varName}`);
                    return globalScene;
                }
            }
        }
        
        console.warn('⚠️ Could not find scene from camera - all methods failed');
        return null;
    }
    
    /**
     * Находит mesh кристалла в сцене по ID
     */
    private findCrystalMeshInScene(scene: THREE.Scene, trackId: string): THREE.Mesh | null {
        let foundMesh: THREE.Mesh | null = null;
        
        scene.traverse((object) => {
            if (object instanceof THREE.Mesh && 
                object.userData.trackId === trackId && 
                object.userData.isCrystal) {
                foundMesh = object;
            }
        });
        
        return foundMesh;
    }
    
    /**
     * Находит mesh кристалла в сцене по имени трека и исполнителю
     */
    private findCrystalMeshByName(scene: THREE.Scene, trackName: string, artist: string): THREE.Mesh | null {
        let foundMesh: THREE.Mesh | null = null;
        
        scene.traverse((object) => {
            if (object instanceof THREE.Mesh && 
                object.userData.isCrystal &&
                object.userData.trackName === trackName &&
                object.userData.artist === artist) {
                foundMesh = object;
            }
        });
        
        return foundMesh;
    }
    
    /**
     * Находит группу кристаллов в сцене
     */
    private findCrystalClusterInScene(): THREE.Group | null {
        const scene = this.findSceneFromCamera();
        if (!scene) return null;
        
        let crystalCluster: THREE.Group | null = null;
        
        scene.traverse((object) => {
            if (object instanceof THREE.Group && 
                (object.name === 'CrystalCluster' || object.userData.isCrystalCluster)) {
                crystalCluster = object;
            }
        });
        
        return crystalCluster;
    }
    
    /**
     * Получает текущую цель камеры (точку, на которую она смотрит)
     */
    private getCameraLookAtTarget(): THREE.Vector3 {
        // Рассчитываем точку, на которую смотрит камера
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        
        // Используем фиксированное расстояние для более предсказуемого поведения
        const targetDistance = 50; // Расстояние до цели
        return this.camera.position.clone().add(direction.multiplyScalar(targetDistance));
    }
    
    /**
     * Сохраняет текущую позицию камеры
     */
    private saveCameraPosition(): void {
        this.focusState.savedPosition = this.camera.position.clone();
        this.focusState.savedTarget = this.getCameraLookAtTarget();
        
        console.log('💾 Camera position saved:', {
            position: this.focusState.savedPosition,
            target: this.focusState.savedTarget
        });
    }
    
    /**
     * Функции easing для плавных переходов
     */
    private applyEasing(t: number, easingType: string): number {
        switch (easingType) {
            case 'linear':
                return t;
            case 'easeIn':
                return t * t;
            case 'easeOut':
                return 1 - Math.pow(1 - t, 2);
            case 'easeInOut':
                return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            default:
                return t;
        }
    }
    
    /**
     * Обновляет анимацию фокуса (должно вызываться в цикле рендеринга)
     */
    public update(deltaTime: number): void {
        if (!this.focusState.isAnimating) {
            // Сбрасываем глобальные флаги если анимация не активна
            if (typeof window !== 'undefined') {
                if ((window as any).isCameraFocusAnimating === true) {
                    (window as any).isCameraFocusAnimating = false;
                }
                // НЕ сбрасываем globalFocusProtection здесь, так как он может быть нужен
                // для защиты после завершения анимации
            }
            return;
        }
        
        // Устанавливаем глобальные флаги во время анимации для защиты от прерываний
        if (typeof window !== 'undefined') {
            (window as any).isCameraFocusAnimating = true;
            (window as any).globalFocusProtection = true;
        }
        
        const currentTime = performance.now();
        const elapsed = currentTime - this.focusState.startTime;
        const progress = Math.min(elapsed / this.focusState.duration, 1.0);
        
        // Применяем easing
        const easedProgress = this.applyEasing(progress, this.settings.easing);
        
        // Интерполируем позицию камеры
        const currentPosition = this.focusState.startPosition.clone()
            .lerp(this.focusState.targetPosition, easedProgress);
        
        // Интерполируем цель камеры
        const currentTarget = this.focusState.startTarget.clone()
            .lerp(this.focusState.targetTarget, easedProgress);
        
        // Применяем новую позицию и направление
        this.camera.position.copy(currentPosition);
        this.camera.lookAt(currentTarget);
        
        // Обновляем матрицы камеры для корректного отображения
        this.camera.updateMatrixWorld();
        
        // Обновляем depth of field фокус если включен
        if (this.settings.enableDepthOfField && this.depthOfFieldSystem && 
            this.focusState.focusedCrystal && !this.focusState.isReturning) {
            const distanceToTarget = this.camera.position.distanceTo(this.focusState.focusedCrystal.position);
            this.depthOfFieldSystem.setFocus(distanceToTarget, true);
        }
        
        // Проверяем завершение анимации
        if (progress >= 1.0) {
            this.completeAnimation();
        }
    }
    
    /**
     * Завершает текущую анимацию
     */
    private completeAnimation(): void {
        const wasReturning = this.focusState.isReturning;
        const focusedCrystal = this.focusState.focusedCrystal;
        
        // Устанавливаем финальное состояние
        this.focusState.isAnimating = false;
        
        if (wasReturning) {
            // Завершение анимации возврата
            this.focusState.isReturning = false;
            this.focusState.isFocused = false;
            this.focusState.focusedCrystal = undefined;
            
            console.log('✅ Return animation completed');
            
            if (this.onReturnComplete) {
                this.onReturnComplete();
            }
        } else {
            // Завершение анимации фокуса
            this.focusState.isFocused = true;
            
            console.log(`✅ Focus animation completed on crystal: ${focusedCrystal?.name}`);
            
            if (this.onFocusComplete && focusedCrystal) {
                this.onFocusComplete(focusedCrystal);
            }
        }
    }
    
    /**
     * Проверяет, находится ли система в состоянии фокуса
     */
    public isFocused(): boolean {
        return this.focusState.isFocused;
    }
    
    /**
     * Проверяет, выполняется ли анимация
     */
    public isAnimating(): boolean {
        return this.focusState.isAnimating;
    }
    
    /**
     * Получает текущий сфокусированный кристалл
     */
    public getFocusedCrystal(): CrystalTrack | undefined {
        return this.focusState.focusedCrystal;
    }
    
    /**
     * Принудительно останавливает текущую анимацию
     */
    public stopAnimation(): void {
        if (this.focusState.isAnimating) {
            console.log('⏹️ Stopping focus animation');
            this.focusState.isAnimating = false;
            this.focusState.isReturning = false;
        }
    }
    
    /**
     * Настройка параметров анимации
     */
    public setSettings(newSettings: Partial<FocusAnimationSettings>): void {
        this.settings = { ...this.settings, ...newSettings };
        console.log('⚙️ Focus animation settings updated:', this.settings);
    }
    
    /**
     * Получение текущих настроек
     */
    public getSettings(): FocusAnimationSettings {
        return { ...this.settings };
    }
    
    /**
     * Установка коллбэков для событий
     */
    public setCallbacks(callbacks: {
        onFocusStart?: (crystal: CrystalTrack) => void;
        onFocusComplete?: (crystal: CrystalTrack) => void;
        onReturnStart?: () => void;
        onReturnComplete?: () => void;
    }): void {
        this.onFocusStart = callbacks.onFocusStart;
        this.onFocusComplete = callbacks.onFocusComplete;
        this.onReturnStart = callbacks.onReturnStart;
        this.onReturnComplete = callbacks.onReturnComplete;
    }
    
    /**
     * Создание предустановок для различных стилей анимации
     */
    public applyPreset(preset: 'fast' | 'smooth' | 'cinematic' | 'dramatic'): void {
        const presets: { [key: string]: Partial<FocusAnimationSettings> } = {
            fast: {
                transitionDuration: 0.8,
                returnDuration: 1.0,
                easing: 'easeOut',
                optimalDistance: 6.0,
                optimalAngle: Math.PI / 8
            },
            smooth: {
                transitionDuration: 1.5,
                returnDuration: 2.0,
                easing: 'easeInOut',
                optimalDistance: 8.0,
                optimalAngle: Math.PI / 6
            },
            cinematic: {
                transitionDuration: 2.5,
                returnDuration: 3.0,
                easing: 'easeInOut',
                optimalDistance: 10.0,
                optimalAngle: Math.PI / 4,
                enableDepthOfField: true
            },
            dramatic: {
                transitionDuration: 3.0,
                returnDuration: 2.5,
                easing: 'easeIn',
                optimalDistance: 12.0,
                optimalAngle: Math.PI / 3,
                enableDepthOfField: true
            }
        };
        
        const presetSettings = presets[preset];
        if (presetSettings) {
            this.setSettings(presetSettings);
            console.log(`🎬 Applied focus animation preset: ${preset}`);
        }
    }
    
    /**
     * Получение статистики производительности
     */
    public getPerformanceStats(): {
        isAnimating: boolean;
        isFocused: boolean;
        animationProgress: number;
        focusedCrystal?: string;
    } {
        let animationProgress = 0;
        if (this.focusState.isAnimating) {
            const elapsed = performance.now() - this.focusState.startTime;
            animationProgress = Math.min(elapsed / this.focusState.duration, 1.0);
        }
        
        return {
            isAnimating: this.focusState.isAnimating,
            isFocused: this.focusState.isFocused,
            animationProgress,
            focusedCrystal: this.focusState.focusedCrystal?.name
        };
    }
    
    /**
     * Освобождение ресурсов
     */
    public dispose(): void {
        console.log('🗑️ Disposing Focus Animation System...');
        
        // Останавливаем текущую анимацию
        this.stopAnimation();
        
        // Очищаем состояние
        this.focusState = {
            isAnimating: false,
            isReturning: false,
            isFocused: false,
            startTime: 0,
            duration: 0,
            startPosition: new THREE.Vector3(),
            targetPosition: new THREE.Vector3(),
            startTarget: new THREE.Vector3(),
            targetTarget: new THREE.Vector3()
        };
        
        // Очищаем коллбэки
        this.onFocusStart = undefined;
        this.onFocusComplete = undefined;
        this.onReturnStart = undefined;
        this.onReturnComplete = undefined;
        
        console.log('✅ Focus Animation System disposed');
    }
}