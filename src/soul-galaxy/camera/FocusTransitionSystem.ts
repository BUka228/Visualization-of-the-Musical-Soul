import * as THREE from 'three';

/**
 * Типы easing функций для естественных переходов
 */
export enum EasingType {
    LINEAR = 'linear',
    EASE_IN = 'easeIn',
    EASE_OUT = 'easeOut',
    EASE_IN_OUT = 'easeInOut',
    EASE_IN_CUBIC = 'easeInCubic',
    EASE_OUT_CUBIC = 'easeOutCubic',
    EASE_IN_OUT_CUBIC = 'easeInOutCubic',
    EASE_IN_QUART = 'easeInQuart',
    EASE_OUT_QUART = 'easeOutQuart',
    EASE_IN_OUT_QUART = 'easeInOutQuart'
}

/**
 * Интерфейс для объекта кристалла
 */
export interface CrystalTarget {
    position: THREE.Vector3;
    boundingBox?: THREE.Box3;
    radius?: number;
}

/**
 * Настройки перехода камеры
 */
export interface TransitionSettings {
    duration: number;
    easing: EasingType;
    lookAtTarget: boolean;
    maintainDistance?: number;
    approachAngle?: number;
    smoothLookAt: boolean;
}

/**
 * Система кинематографических переходов для плавных переходов к выбранным кристаллам
 */
export class FocusTransitionSystem {
    private camera: THREE.PerspectiveCamera;
    private isTransitioning: boolean = false;
    private currentTransition: TransitionData | null = null;
    
    // Настройки по умолчанию
    private defaultSettings: TransitionSettings = {
        duration: 2.0,
        easing: EasingType.EASE_IN_OUT_CUBIC,
        lookAtTarget: true,
        maintainDistance: 15,
        approachAngle: Math.PI / 6, // 30 градусов
        smoothLookAt: true
    };
    
    // Сохраненная позиция для возврата
    private savedCameraState: {
        position: THREE.Vector3;
        target: THREE.Vector3;
        up: THREE.Vector3;
    } | null = null;
    
    constructor(camera: THREE.PerspectiveCamera) {
        this.camera = camera;
        console.log('FocusTransitionSystem инициализирован');
    }
    
    /**
     * Начать переход фокуса к кристаллу
     */
    public async focusOnCrystal(
        crystal: CrystalTarget,
        settings: Partial<TransitionSettings> = {}
    ): Promise<void> {
        if (this.isTransitioning) {
            console.warn('Переход уже выполняется, отменяем предыдущий');
            this.stopTransition();
        }
        
        const finalSettings = { ...this.defaultSettings, ...settings };
        
        // Сохраняем текущее состояние камеры
        this.saveCameraState();
        
        // Рассчитываем оптимальную позицию камеры
        const targetCameraPosition = this.calculateOptimalCameraPosition(crystal, finalSettings);
        const targetLookAt = crystal.position.clone();
        
        // Создаем данные перехода
        this.currentTransition = {
            startTime: performance.now(),
            duration: finalSettings.duration * 1000, // конвертируем в миллисекунды
            easing: finalSettings.easing,
            
            startPosition: this.camera.position.clone(),
            targetPosition: targetCameraPosition,
            
            startLookAt: this.getCurrentLookAtTarget(),
            targetLookAt: targetLookAt,
            
            lookAtTarget: finalSettings.lookAtTarget,
            smoothLookAt: finalSettings.smoothLookAt,
            
            // Создаем сплайновую траекторию
            splinePath: this.createCameraPath(this.camera.position, targetCameraPosition, crystal)
        };
        
        this.isTransitioning = true;
        
        console.log('Начат переход фокуса к кристаллу:', {
            from: this.camera.position,
            to: targetCameraPosition,
            duration: finalSettings.duration
        });
        
        // Возвращаем промис, который разрешится по завершении перехода
        return new Promise((resolve) => {
            this.currentTransition!.onComplete = resolve;
        });
    }
    
    /**
     * Вернуться к предыдущей позиции камеры
     */
    public async returnToOverview(settings: Partial<TransitionSettings> = {}): Promise<void> {
        if (!this.savedCameraState) {
            console.warn('Нет сохраненного состояния камеры для возврата');
            return;
        }
        
        if (this.isTransitioning) {
            this.stopTransition();
        }
        
        const finalSettings = { ...this.defaultSettings, ...settings };
        
        // Создаем переход обратно к сохраненной позиции
        this.currentTransition = {
            startTime: performance.now(),
            duration: finalSettings.duration * 1000,
            easing: finalSettings.easing,
            
            startPosition: this.camera.position.clone(),
            targetPosition: this.savedCameraState.position.clone(),
            
            startLookAt: this.getCurrentLookAtTarget(),
            targetLookAt: this.savedCameraState.target.clone(),
            
            lookAtTarget: true,
            smoothLookAt: finalSettings.smoothLookAt,
            
            splinePath: this.createReturnPath(this.camera.position, this.savedCameraState.position)
        };
        
        this.isTransitioning = true;
        
        console.log('Начат возврат к обзорной позиции');
        
        return new Promise((resolve) => {
            this.currentTransition!.onComplete = () => {
                this.savedCameraState = null;
                resolve();
            };
        });
    }
    
    /**
     * Рассчитать оптимальную позицию камеры для фокуса на кристалле
     */
    private calculateOptimalCameraPosition(
        crystal: CrystalTarget,
        settings: TransitionSettings
    ): THREE.Vector3 {
        const crystalPosition = crystal.position;
        const distance = settings.maintainDistance || 15;
        const approachAngle = settings.approachAngle || Math.PI / 6;
        
        // Рассчитываем размер кристалла для оптимального расстояния
        let crystalRadius = crystal.radius || 2;
        if (crystal.boundingBox) {
            crystalRadius = crystal.boundingBox.getSize(new THREE.Vector3()).length() / 2;
        }
        
        // Адаптируем расстояние к размеру кристалла
        const adaptiveDistance = Math.max(distance, crystalRadius * 3);
        
        // Определяем направление подлета
        // Используем текущую позицию камеры как базу для расчета угла подлета
        const currentDirection = new THREE.Vector3()
            .subVectors(this.camera.position, crystalPosition)
            .normalize();
        
        // Создаем небольшое отклонение для более интересного угла
        const offsetDirection = new THREE.Vector3(
            currentDirection.x + (Math.random() - 0.5) * 0.3,
            currentDirection.y + (Math.random() - 0.5) * 0.3,
            currentDirection.z + (Math.random() - 0.5) * 0.3
        ).normalize();
        
        // Рассчитываем финальную позицию
        const targetPosition = crystalPosition.clone()
            .add(offsetDirection.multiplyScalar(adaptiveDistance));
        
        // Убеждаемся, что камера не слишком близко к центру сцены
        const minDistanceFromCenter = 5;
        if (targetPosition.length() < minDistanceFromCenter) {
            targetPosition.normalize().multiplyScalar(minDistanceFromCenter);
        }
        
        return targetPosition;
    }
    
    /**
     * Создать сплайновую траекторию камеры
     */
    private createCameraPath(
        start: THREE.Vector3,
        end: THREE.Vector3,
        crystal: CrystalTarget
    ): THREE.CatmullRomCurve3 {
        const points: THREE.Vector3[] = [];
        
        // Начальная точка
        points.push(start.clone());
        
        // Промежуточные контрольные точки для плавной траектории
        const midPoint = start.clone().lerp(end, 0.5);
        
        // Добавляем небольшое отклонение для более естественной траектории
        const perpendicular = new THREE.Vector3()
            .subVectors(end, start)
            .cross(new THREE.Vector3(0, 1, 0))
            .normalize()
            .multiplyScalar(5);
        
        const controlPoint1 = start.clone().lerp(midPoint, 0.3).add(perpendicular);
        const controlPoint2 = midPoint.clone().add(perpendicular.multiplyScalar(-0.5));
        
        points.push(controlPoint1);
        points.push(controlPoint2);
        
        // Конечная точка
        points.push(end.clone());
        
        return new THREE.CatmullRomCurve3(points);
    }
    
    /**
     * Создать траекторию возврата
     */
    private createReturnPath(start: THREE.Vector3, end: THREE.Vector3): THREE.CatmullRomCurve3 {
        const points: THREE.Vector3[] = [];
        
        points.push(start.clone());
        
        // Для возврата используем более простую траекторию
        const midPoint = start.clone().lerp(end, 0.5);
        midPoint.y += 10; // Небольшой подъем для более красивой траектории
        
        points.push(midPoint);
        points.push(end.clone());
        
        return new THREE.CatmullRomCurve3(points);
    }
    
    /**
     * Получить текущую цель взгляда камеры
     */
    private getCurrentLookAtTarget(): THREE.Vector3 {
        // Приблизительно рассчитываем, куда смотрит камера
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        
        return this.camera.position.clone().add(direction.multiplyScalar(50));
    }
    
    /**
     * Сохранить текущее состояние камеры
     */
    private saveCameraState(): void {
        this.savedCameraState = {
            position: this.camera.position.clone(),
            target: this.getCurrentLookAtTarget(),
            up: this.camera.up.clone()
        };
    }
    
    /**
     * Остановить текущий переход
     */
    private stopTransition(): void {
        if (this.currentTransition && this.currentTransition.onComplete) {
            this.currentTransition.onComplete();
        }
        this.currentTransition = null;
        this.isTransitioning = false;
    }
    
    /**
     * Применить easing функцию
     */
    private applyEasing(t: number, easingType: EasingType): number {
        switch (easingType) {
            case EasingType.LINEAR:
                return t;
            case EasingType.EASE_IN:
                return t * t;
            case EasingType.EASE_OUT:
                return 1 - (1 - t) * (1 - t);
            case EasingType.EASE_IN_OUT:
                return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            case EasingType.EASE_IN_CUBIC:
                return t * t * t;
            case EasingType.EASE_OUT_CUBIC:
                return 1 - Math.pow(1 - t, 3);
            case EasingType.EASE_IN_OUT_CUBIC:
                return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            case EasingType.EASE_IN_QUART:
                return t * t * t * t;
            case EasingType.EASE_OUT_QUART:
                return 1 - Math.pow(1 - t, 4);
            case EasingType.EASE_IN_OUT_QUART:
                return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
            default:
                return t;
        }
    }
    
    /**
     * Обновление системы переходов (вызывается в цикле рендеринга)
     */
    public update(): void {
        if (!this.isTransitioning || !this.currentTransition) {
            return;
        }
        
        const currentTime = performance.now();
        const elapsed = currentTime - this.currentTransition.startTime;
        const progress = Math.min(elapsed / this.currentTransition.duration, 1);
        
        // Применяем easing
        const easedProgress = this.applyEasing(progress, this.currentTransition.easing);
        
        // Обновляем позицию камеры по сплайновой траектории
        if (this.currentTransition.splinePath) {
            const newPosition = this.currentTransition.splinePath.getPoint(easedProgress);
            this.camera.position.copy(newPosition);
        } else {
            // Fallback на линейную интерполяцию
            this.camera.position.lerpVectors(
                this.currentTransition.startPosition,
                this.currentTransition.targetPosition,
                easedProgress
            );
        }
        
        // Обновляем направление взгляда
        if (this.currentTransition.lookAtTarget) {
            if (this.currentTransition.smoothLookAt) {
                // Плавное изменение направления взгляда
                const currentLookAt = new THREE.Vector3().lerpVectors(
                    this.currentTransition.startLookAt,
                    this.currentTransition.targetLookAt,
                    easedProgress
                );
                this.camera.lookAt(currentLookAt);
            } else {
                // Мгновенное направление на цель
                this.camera.lookAt(this.currentTransition.targetLookAt);
            }
        }
        
        // Проверяем завершение перехода
        if (progress >= 1) {
            this.isTransitioning = false;
            
            // Устанавливаем финальные значения
            this.camera.position.copy(this.currentTransition.targetPosition);
            if (this.currentTransition.lookAtTarget) {
                this.camera.lookAt(this.currentTransition.targetLookAt);
            }
            
            console.log('Переход камеры завершен');
            
            // Вызываем коллбэк завершения
            if (this.currentTransition.onComplete) {
                this.currentTransition.onComplete();
            }
            
            this.currentTransition = null;
        }
    }
    
    /**
     * Проверить, выполняется ли переход
     */
    public isTransitionActive(): boolean {
        return this.isTransitioning;
    }
    
    /**
     * Получить прогресс текущего перехода (0-1)
     */
    public getTransitionProgress(): number {
        if (!this.isTransitioning || !this.currentTransition) {
            return 0;
        }
        
        const currentTime = performance.now();
        const elapsed = currentTime - this.currentTransition.startTime;
        return Math.min(elapsed / this.currentTransition.duration, 1);
    }
    
    /**
     * Установить настройки по умолчанию
     */
    public setDefaultSettings(settings: Partial<TransitionSettings>): void {
        this.defaultSettings = { ...this.defaultSettings, ...settings };
    }
    
    /**
     * Получить настройки по умолчанию
     */
    public getDefaultSettings(): TransitionSettings {
        return { ...this.defaultSettings };
    }
    
    /**
     * Освобождение ресурсов
     */
    public dispose(): void {
        this.stopTransition();
        this.savedCameraState = null;
        console.log('FocusTransitionSystem освобожден');
    }
}

/**
 * Внутренние данные перехода
 */
interface TransitionData {
    startTime: number;
    duration: number;
    easing: EasingType;
    
    startPosition: THREE.Vector3;
    targetPosition: THREE.Vector3;
    
    startLookAt: THREE.Vector3;
    targetLookAt: THREE.Vector3;
    
    lookAtTarget: boolean;
    smoothLookAt: boolean;
    
    splinePath?: THREE.CatmullRomCurve3;
    onComplete?: () => void;
}