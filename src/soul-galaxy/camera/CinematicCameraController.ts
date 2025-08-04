import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FocusAnimationSystem } from './FocusAnimationSystem';
import { DepthOfFieldSystem } from './DepthOfFieldSystem';
import { CrystalTrack } from '../types';

/**
 * Кинематографический контроллер камеры с плавной инерцией как в космосиме
 * Интегрируется с существующей системой OrbitControls для совместимости
 */
export class CinematicCameraController {
    private camera: THREE.PerspectiveCamera;
    private orbitControls: OrbitControls;
    private renderer: THREE.WebGLRenderer;
    
    // Системы кинематографических эффектов
    private focusAnimationSystem: FocusAnimationSystem;
    private depthOfFieldSystem?: DepthOfFieldSystem;
    
    // Система инерции
    private velocity: THREE.Vector3 = new THREE.Vector3();
    private angularVelocity: THREE.Euler = new THREE.Euler();
    private dampingFactor: number = 0.95;
    private maxVelocity: number = 50;
    private maxAngularVelocity: number = 2;
    
    // Ограничения движения
    private minDistance: number = 10;
    private maxDistance: number = 500;
    private maxPolarAngle: number = Math.PI;
    private minPolarAngle: number = 0;
    
    // Состояние управления
    private isInertialMode: boolean = true;
    private lastMousePosition: THREE.Vector2;
    private mouseMovement: THREE.Vector2;
    private isMouseDown: boolean = false;
    
    // Настройки чувствительности
    private mouseSensitivity: number = 0.002;
    private zoomSensitivity: number = 1.0;
    private panSensitivity: number = 0.8;
    
    constructor(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, scene?: THREE.Scene) {
        this.camera = camera;
        this.renderer = renderer;
        
        // Инициализируем переменные состояния
        this.lastMousePosition = new THREE.Vector2();
        this.mouseMovement = new THREE.Vector2();
        
        // Создаем системы кинематографических эффектов
        if (scene) {
            this.depthOfFieldSystem = new DepthOfFieldSystem(renderer, scene, camera);
        }
        this.focusAnimationSystem = new FocusAnimationSystem(camera, this.depthOfFieldSystem);
        
        // Создаем OrbitControls для совместимости
        this.orbitControls = new OrbitControls(camera, renderer.domElement);
        this.setupOrbitControls();
        
        // Настраиваем кинематографическое управление
        this.setupCinematicControls();
        
        console.log('CinematicCameraController инициализирован');
    }
    
    /**
     * Настройка базовых OrbitControls для совместимости
     */
    private setupOrbitControls(): void {
        // Базовые настройки OrbitControls
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.05;
        this.orbitControls.screenSpacePanning = false;
        
        // Ограничения
        this.orbitControls.minDistance = this.minDistance;
        this.orbitControls.maxDistance = this.maxDistance;
        this.orbitControls.maxPolarAngle = this.maxPolarAngle;
        this.orbitControls.minPolarAngle = this.minPolarAngle;
        
        // Настройка скоростей
        this.orbitControls.rotateSpeed = 0.5;
        this.orbitControls.zoomSpeed = this.zoomSensitivity;
        this.orbitControls.panSpeed = this.panSensitivity;
        
        // Кнопки мыши
        this.orbitControls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
        };
        
        // Отключаем OrbitControls если включен инерциальный режим
        if (this.isInertialMode) {
            this.orbitControls.enabled = false;
        }
    }
    
    /**
     * Настройка кинематографического управления с инерцией
     */
    private setupCinematicControls(): void {
        const domElement = this.renderer.domElement;
        
        // События мыши для инерциального управления
        domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
        domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
        domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
        domElement.addEventListener('wheel', this.onWheel.bind(this));
        
        // Предотвращение контекстного меню
        domElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        
        console.log('Кинематографические контролы настроены');
    }
    
    /**
     * Обработчик нажатия мыши
     */
    private onMouseDown(event: MouseEvent): void {
        if (!this.isInertialMode) return;
        
        // Не обрабатываем события мыши во время анимации фокуса
        if (this.focusAnimationSystem.isAnimating()) return;
        
        this.isMouseDown = true;
        this.lastMousePosition.set(event.clientX, event.clientY);
        this.mouseMovement.set(0, 0);
        
        // Останавливаем текущую инерцию
        this.velocity.set(0, 0, 0);
        this.angularVelocity.set(0, 0, 0);
    }
    
    /**
     * Обработчик движения мыши
     */
    private onMouseMove(event: MouseEvent): void {
        if (!this.isInertialMode || !this.isMouseDown) return;
        
        // Не обрабатываем события мыши во время анимации фокуса
        if (this.focusAnimationSystem.isAnimating()) return;
        
        const currentMousePosition = new THREE.Vector2(event.clientX, event.clientY);
        
        // Проверяем, что lastMousePosition и mouseMovement инициализированы
        if (!this.lastMousePosition || !this.mouseMovement) {
            this.lastMousePosition = new THREE.Vector2(event.clientX, event.clientY);
            this.mouseMovement = new THREE.Vector2(0, 0);
            return;
        }
        
        // Безопасное вычисление движения мыши
        try {
            this.mouseMovement.copy(currentMousePosition).sub(this.lastMousePosition);
        } catch (error) {
            // Если произошла ошибка, инициализируем заново
            this.mouseMovement = new THREE.Vector2(0, 0);
            this.lastMousePosition = new THREE.Vector2(event.clientX, event.clientY);
            return;
        }
        
        // Применяем вращение камеры
        this.applyCameraRotation(this.mouseMovement);
        
        this.lastMousePosition.copy(currentMousePosition);
    }
    
    /**
     * Обработчик отпускания мыши
     */
    private onMouseUp(event: MouseEvent): void {
        if (!this.isInertialMode) return;
        
        this.isMouseDown = false;
        
        // Устанавливаем угловую скорость для инерции
        this.angularVelocity.set(
            -this.mouseMovement.y * this.mouseSensitivity,
            -this.mouseMovement.x * this.mouseSensitivity,
            0
        );
        
        // Ограничиваем максимальную угловую скорость
        const angularSpeed = Math.sqrt(
            this.angularVelocity.x * this.angularVelocity.x +
            this.angularVelocity.y * this.angularVelocity.y
        );
        
        if (angularSpeed > this.maxAngularVelocity) {
            const scale = this.maxAngularVelocity / angularSpeed;
            this.angularVelocity.x *= scale;
            this.angularVelocity.y *= scale;
        }
    }
    
    /**
     * Обработчик колеса мыши для зума
     */
    private onWheel(event: WheelEvent): void {
        if (!this.isInertialMode) return;
        
        // Не обрабатываем события колеса мыши во время анимации фокуса
        if (this.focusAnimationSystem.isAnimating()) return;
        
        event.preventDefault();
        
        const zoomDelta = event.deltaY * 0.001 * this.zoomSensitivity;
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        
        // Применяем зум с ограничениями
        const currentDistance = this.camera.position.length();
        const newDistance = Math.max(
            this.minDistance,
            Math.min(this.maxDistance, currentDistance + zoomDelta * currentDistance)
        );
        
        const scale = newDistance / currentDistance;
        this.camera.position.multiplyScalar(scale);
    }
    
    /**
     * Применение вращения камеры
     */
    private applyCameraRotation(movement: THREE.Vector2): void {
        const rotationX = -movement.y * this.mouseSensitivity;
        const rotationY = -movement.x * this.mouseSensitivity;
        
        // Создаем кватернионы для вращения
        const quaternionY = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            rotationY
        );
        
        const quaternionX = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(1, 0, 0),
            rotationX
        );
        
        // Применяем вращение к позиции камеры
        this.camera.position.applyQuaternion(quaternionY);
        
        // Для вертикального вращения нужно учитывать ограничения
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(this.camera.position);
        
        spherical.phi = Math.max(
            this.minPolarAngle,
            Math.min(this.maxPolarAngle, spherical.phi + rotationX)
        );
        
        this.camera.position.setFromSpherical(spherical);
        this.camera.lookAt(0, 0, 0);
    }
    
    /**
     * Обновление инерции (вызывается в цикле рендеринга)
     */
    public updateInertia(deltaTime: number): void {
        if (!this.isInertialMode || this.isMouseDown) return;
        
        // Не применяем инерцию во время анимации фокуса
        if (this.focusAnimationSystem.isAnimating()) return;
        
        // Применяем угловую инерцию
        if (this.angularVelocity.x !== 0 || this.angularVelocity.y !== 0) {
            this.applyCameraRotation(new THREE.Vector2(
                this.angularVelocity.y * deltaTime * 1000,
                this.angularVelocity.x * deltaTime * 1000
            ));
            
            // Затухание угловой скорости
            this.angularVelocity.x *= this.dampingFactor;
            this.angularVelocity.y *= this.dampingFactor;
            
            // Останавливаем инерцию при малых значениях
            if (Math.abs(this.angularVelocity.x) < 0.001) this.angularVelocity.x = 0;
            if (Math.abs(this.angularVelocity.y) < 0.001) this.angularVelocity.y = 0;
        }
    }
    
    /**
     * Переключение между инерциальным и OrbitControls режимами
     */
    public setInertialMode(enabled: boolean): void {
        this.isInertialMode = enabled;
        this.orbitControls.enabled = !enabled;
        
        if (enabled) {
            console.log('Включен кинематографический режим камеры');
        } else {
            console.log('Включен стандартный OrbitControls режим');
        }
    }
    
    /**
     * Получение текущего режима
     */
    public isInertialModeEnabled(): boolean {
        return this.isInertialMode;
    }
    
    /**
     * Настройка параметров инерции
     */
    public setInertiaSettings(settings: {
        dampingFactor?: number;
        maxVelocity?: number;
        maxAngularVelocity?: number;
        mouseSensitivity?: number;
    }): void {
        if (settings.dampingFactor !== undefined) {
            this.dampingFactor = Math.max(0, Math.min(1, settings.dampingFactor));
        }
        if (settings.maxVelocity !== undefined) {
            this.maxVelocity = Math.max(0, settings.maxVelocity);
        }
        if (settings.maxAngularVelocity !== undefined) {
            this.maxAngularVelocity = Math.max(0, settings.maxAngularVelocity);
        }
        if (settings.mouseSensitivity !== undefined) {
            this.mouseSensitivity = Math.max(0, settings.mouseSensitivity);
        }
    }
    
    /**
     * Настройка ограничений камеры
     */
    public setCameraLimits(limits: {
        minDistance?: number;
        maxDistance?: number;
        minPolarAngle?: number;
        maxPolarAngle?: number;
    }): void {
        if (limits.minDistance !== undefined) {
            this.minDistance = Math.max(0.1, limits.minDistance);
            this.orbitControls.minDistance = this.minDistance;
        }
        if (limits.maxDistance !== undefined) {
            this.maxDistance = Math.max(this.minDistance, limits.maxDistance);
            this.orbitControls.maxDistance = this.maxDistance;
        }
        if (limits.minPolarAngle !== undefined) {
            this.minPolarAngle = Math.max(0, Math.min(Math.PI, limits.minPolarAngle));
            this.orbitControls.minPolarAngle = this.minPolarAngle;
        }
        if (limits.maxPolarAngle !== undefined) {
            this.maxPolarAngle = Math.max(this.minPolarAngle, Math.min(Math.PI, limits.maxPolarAngle));
            this.orbitControls.maxPolarAngle = this.maxPolarAngle;
        }
    }
    
    /**
     * Сброс камеры в исходное положение
     */
    public resetCamera(): void {
        // Останавливаем инерцию
        this.velocity.set(0, 0, 0);
        this.angularVelocity.set(0, 0, 0);
        
        // Сбрасываем позицию через OrbitControls
        this.orbitControls.reset();
        
        console.log('Камера сброшена в исходное положение');
    }
    
    /**
     * Получение OrbitControls для совместимости
     */
    public getOrbitControls(): OrbitControls {
        return this.orbitControls;
    }
    
    /**
     * Фокусировка на кристалле с кинематографическим переходом
     */
    public async focusOnCrystal(crystal: CrystalTrack): Promise<void> {
        console.log(`🎯 Focusing camera on crystal: ${crystal.name} by ${crystal.artist}`);
        
        // Останавливаем инерцию и отключаем управление на время анимации
        this.velocity.set(0, 0, 0);
        this.angularVelocity.set(0, 0, 0);
        
        // Временно отключаем все системы управления
        const wasInertialEnabled = this.isInertialMode;
        const wasOrbitEnabled = this.orbitControls.enabled;
        
        this.orbitControls.enabled = false;
        
        try {
            // Запускаем анимацию фокуса
            await this.focusAnimationSystem.focusOnCrystal(crystal);
            
            console.log(`✅ Camera focused on crystal: ${crystal.name}`);
        } catch (error) {
            console.error('❌ Failed to focus on crystal:', error);
        } finally {
            // Восстанавливаем управление только после завершения анимации
            // Но не включаем OrbitControls если был инерциальный режим
            if (!wasInertialEnabled) {
                this.orbitControls.enabled = wasOrbitEnabled;
            }
        }
    }
    
    /**
     * Возврат к предыдущей позиции камеры
     */
    public async returnToPreviousPosition(): Promise<void> {
        console.log('🔄 Returning camera to previous position');
        
        // Останавливаем инерцию и отключаем управление на время анимации
        this.velocity.set(0, 0, 0);
        this.angularVelocity.set(0, 0, 0);
        
        // Временно отключаем все системы управления
        const wasInertialEnabled = this.isInertialMode;
        const wasOrbitEnabled = this.orbitControls.enabled;
        
        this.orbitControls.enabled = false;
        
        try {
            // Запускаем анимацию возврата
            await this.focusAnimationSystem.returnToPreviousPosition();
            
            console.log('✅ Camera returned to previous position');
        } catch (error) {
            console.error('❌ Failed to return to previous position:', error);
        } finally {
            // Восстанавливаем управление только после завершения анимации
            // Но не включаем OrbitControls если был инерциальный режим
            if (!wasInertialEnabled) {
                this.orbitControls.enabled = wasOrbitEnabled;
            }
        }
    }
    
    /**
     * Проверяет, находится ли камера в состоянии фокуса
     */
    public isFocused(): boolean {
        return this.focusAnimationSystem.isFocused();
    }
    
    /**
     * Проверяет, выполняется ли анимация камеры
     */
    public isCameraAnimating(): boolean {
        return this.focusAnimationSystem.isAnimating();
    }
    
    /**
     * Получает текущий сфокусированный кристалл
     */
    public getFocusedCrystal(): CrystalTrack | undefined {
        return this.focusAnimationSystem.getFocusedCrystal();
    }
    
    /**
     * Настройка параметров анимации фокуса
     */
    public setFocusAnimationSettings(settings: {
        transitionDuration?: number;
        easing?: 'linear' | 'easeInOut' | 'easeOut' | 'easeIn';
        optimalDistance?: number;
        optimalAngle?: number;
        returnDuration?: number;
        enableDepthOfField?: boolean;
    }): void {
        this.focusAnimationSystem.setSettings(settings);
    }
    
    /**
     * Применение предустановки анимации фокуса
     */
    public applyFocusPreset(preset: 'fast' | 'smooth' | 'cinematic' | 'dramatic'): void {
        this.focusAnimationSystem.applyPreset(preset);
    }
    
    /**
     * Установка коллбэков для событий фокуса
     */
    public setFocusCallbacks(callbacks: {
        onFocusStart?: (crystal: CrystalTrack) => void;
        onFocusComplete?: (crystal: CrystalTrack) => void;
        onReturnStart?: () => void;
        onReturnComplete?: () => void;
    }): void {
        this.focusAnimationSystem.setCallbacks(callbacks);
    }
    
    /**
     * Получение системы depth of field
     */
    public getDepthOfFieldSystem(): DepthOfFieldSystem | undefined {
        return this.depthOfFieldSystem;
    }
    
    /**
     * Получение системы анимации фокуса
     */
    public getFocusAnimationSystem(): FocusAnimationSystem {
        return this.focusAnimationSystem;
    }
    
    /**
     * Обновление (вызывается в цикле рендеринга)
     */
    public update(deltaTime: number = 0.016): void {
        // Обновляем систему анимации фокуса
        this.focusAnimationSystem.update(deltaTime);
        
        // Обновляем depth of field если включен
        if (this.depthOfFieldSystem) {
            // Рендеринг будет выполнен через depth of field систему
            this.depthOfFieldSystem.render(deltaTime);
        }
        
        // Обновляем управление камерой только если не идет анимация фокуса
        if (!this.focusAnimationSystem.isAnimating()) {
            if (this.isInertialMode) {
                this.updateInertia(deltaTime);
            } else {
                this.orbitControls.update();
            }
        }
    }
    
    /**
     * Освобождение ресурсов
     */
    public dispose(): void {
        const domElement = this.renderer.domElement;
        
        // Удаляем обработчики событий
        domElement.removeEventListener('mousedown', this.onMouseDown.bind(this));
        domElement.removeEventListener('mousemove', this.onMouseMove.bind(this));
        domElement.removeEventListener('mouseup', this.onMouseUp.bind(this));
        domElement.removeEventListener('wheel', this.onWheel.bind(this));
        
        // Освобождаем системы кинематографических эффектов
        this.focusAnimationSystem.dispose();
        if (this.depthOfFieldSystem) {
            this.depthOfFieldSystem.dispose();
        }
        
        // Освобождаем OrbitControls
        this.orbitControls.dispose();
        
        console.log('CinematicCameraController освобожден');
    }
}