import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * Настройки эффекта depth of field
 */
export interface DepthOfFieldSettings {
    focus: number;          // Расстояние фокуса
    aperture: number;       // Размер диафрагмы (влияет на силу размытия)
    maxblur: number;        // Максимальное размытие
    enabled: boolean;       // Включен ли эффект
}

/**
 * Система depth of field и боке эффектов для кинематографических переходов
 */
export class DepthOfFieldSystem {
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    
    // Post-processing компоненты
    private composer!: EffectComposer;
    private renderPass!: RenderPass;
    private bokehPass!: BokehPass;
    private outputPass!: OutputPass;
    
    // Настройки эффекта
    private settings: DepthOfFieldSettings = {
        focus: 50.0,
        aperture: 0.025,
        maxblur: 0.01,
        enabled: false
    };
    
    // Состояние системы
    private isInitialized: boolean = false;
    private isEnabled: boolean = false;
    
    // Анимация параметров
    private targetFocus: number = 50.0;
    private focusTransitionSpeed: number = 2.0;
    private targetAperture: number = 0.025;
    private apertureTransitionSpeed: number = 1.0;
    
    constructor(
        renderer: THREE.WebGLRenderer,
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera
    ) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        
        this.initialize();
    }
    
    /**
     * Инициализация системы post-processing
     */
    private initialize(): void {
        try {
            // Создаем EffectComposer
            this.composer = new EffectComposer(this.renderer);
            
            // Основной render pass
            this.renderPass = new RenderPass(this.scene, this.camera);
            this.composer.addPass(this.renderPass);
            
            // Bokeh pass для depth of field эффекта
            this.bokehPass = new BokehPass(this.scene, this.camera, {
                focus: this.settings.focus,
                aperture: this.settings.aperture,
                maxblur: this.settings.maxblur
            });
            
            // Изначально отключаем эффект
            this.bokehPass.enabled = false;
            this.composer.addPass(this.bokehPass);
            
            // Output pass для корректного отображения
            this.outputPass = new OutputPass();
            this.composer.addPass(this.outputPass);
            
            this.isInitialized = true;
            
            console.log('DepthOfFieldSystem инициализирован');
        } catch (error) {
            console.error('Ошибка инициализации DepthOfFieldSystem:', error);
            this.isInitialized = false;
        }
    }
    
    /**
     * Включить depth of field эффект
     */
    public enableDepthOfField(settings: Partial<DepthOfFieldSettings> = {}): void {
        if (!this.isInitialized) {
            console.warn('DepthOfFieldSystem не инициализирован');
            return;
        }
        
        // Обновляем настройки
        this.settings = { ...this.settings, ...settings, enabled: true };
        
        // Применяем настройки к bokeh pass
        this.updateBokehPassSettings();
        
        // Включаем эффект
        this.bokehPass.enabled = true;
        this.isEnabled = true;
        
        console.log('Depth of field включен:', this.settings);
    }
    
    /**
     * Отключить depth of field эффект
     */
    public disableDepthOfField(): void {
        if (!this.isInitialized) return;
        
        this.bokehPass.enabled = false;
        this.isEnabled = false;
        this.settings.enabled = false;
        
        console.log('Depth of field отключен');
    }
    
    /**
     * Установить фокусное расстояние с плавным переходом
     */
    public setFocus(distance: number, smooth: boolean = true): void {
        if (smooth) {
            this.targetFocus = distance;
        } else {
            this.settings.focus = distance;
            this.targetFocus = distance;
            this.updateBokehPassSettings();
        }
    }
    
    /**
     * Установить размер диафрагмы с плавным переходом
     */
    public setAperture(aperture: number, smooth: boolean = true): void {
        if (smooth) {
            this.targetAperture = aperture;
        } else {
            this.settings.aperture = aperture;
            this.targetAperture = aperture;
            this.updateBokehPassSettings();
        }
    }
    
    /**
     * Установить максимальное размытие
     */
    public setMaxBlur(maxblur: number): void {
        this.settings.maxblur = maxblur;
        this.updateBokehPassSettings();
    }
    
    /**
     * Автоматически рассчитать фокусное расстояние до объекта
     */
    public focusOnObject(object: THREE.Object3D, smooth: boolean = true): void {
        const distance = this.camera.position.distanceTo(object.position);
        this.setFocus(distance, smooth);
        
        console.log(`Фокус установлен на объект на расстоянии ${distance.toFixed(2)}`);
    }
    
    /**
     * Автоматически рассчитать фокусное расстояние до точки
     */
    public focusOnPoint(point: THREE.Vector3, smooth: boolean = true): void {
        const distance = this.camera.position.distanceTo(point);
        this.setFocus(distance, smooth);
        
        console.log(`Фокус установлен на точку на расстоянии ${distance.toFixed(2)}`);
    }
    
    /**
     * Создать эффект боке для размытия остальных объектов
     */
    public createBokehEffect(focusObject: THREE.Object3D, intensity: number = 0.025): void {
        this.focusOnObject(focusObject, true);
        this.setAperture(intensity, true);
        
        if (!this.isEnabled) {
            this.enableDepthOfField();
        }
    }
    
    /**
     * Убрать эффект боке
     */
    public removeBokehEffect(): void {
        this.disableDepthOfField();
    }
    
    /**
     * Обновить настройки bokeh pass
     */
    private updateBokehPassSettings(): void {
        if (!this.bokehPass) return;
        
        // Обновляем uniforms bokeh pass
        if (this.bokehPass.uniforms && 'focus' in this.bokehPass.uniforms) {
            (this.bokehPass.uniforms as any)['focus'].value = this.settings.focus;
            (this.bokehPass.uniforms as any)['aperture'].value = this.settings.aperture;
            (this.bokehPass.uniforms as any)['maxblur'].value = this.settings.maxblur;
        }
    }
    
    /**
     * Плавная анимация параметров
     */
    private updateTransitions(deltaTime: number): void {
        let needsUpdate = false;
        
        // Плавное изменение фокуса
        if (Math.abs(this.settings.focus - this.targetFocus) > 0.1) {
            const focusDelta = (this.targetFocus - this.settings.focus) * this.focusTransitionSpeed * deltaTime;
            this.settings.focus += focusDelta;
            needsUpdate = true;
        } else {
            this.settings.focus = this.targetFocus;
        }
        
        // Плавное изменение диафрагмы
        if (Math.abs(this.settings.aperture - this.targetAperture) > 0.001) {
            const apertureDelta = (this.targetAperture - this.settings.aperture) * this.apertureTransitionSpeed * deltaTime;
            this.settings.aperture += apertureDelta;
            needsUpdate = true;
        } else {
            this.settings.aperture = this.targetAperture;
        }
        
        // Обновляем настройки если были изменения
        if (needsUpdate) {
            this.updateBokehPassSettings();
        }
    }
    
    /**
     * Настроить скорость переходов
     */
    public setTransitionSpeeds(focusSpeed: number, apertureSpeed: number): void {
        this.focusTransitionSpeed = Math.max(0.1, focusSpeed);
        this.apertureTransitionSpeed = Math.max(0.1, apertureSpeed);
    }
    
    /**
     * Получить текущие настройки
     */
    public getSettings(): DepthOfFieldSettings {
        return { ...this.settings };
    }
    
    /**
     * Проверить, включен ли эффект
     */
    public isDepthOfFieldEnabled(): boolean {
        return this.isEnabled;
    }
    
    /**
     * Обработка изменения размера окна
     */
    public handleResize(width: number, height: number): void {
        if (!this.isInitialized) return;
        
        this.composer.setSize(width, height);
        
        // Обновляем размеры в bokeh pass
        if (this.bokehPass.uniforms && 'textureWidth' in this.bokehPass.uniforms) {
            (this.bokehPass.uniforms as any)['textureWidth'].value = width;
            (this.bokehPass.uniforms as any)['textureHeight'].value = height;
        }
        
        console.log(`DepthOfFieldSystem размер обновлен: ${width}x${height}`);
    }
    
    /**
     * Рендеринг с post-processing эффектами
     */
    public render(deltaTime: number = 0.016): void {
        if (!this.isInitialized) {
            // Fallback на обычный рендеринг
            this.renderer.render(this.scene, this.camera);
            return;
        }
        
        // Обновляем плавные переходы
        if (this.isEnabled) {
            this.updateTransitions(deltaTime);
        }
        
        // Рендерим через composer
        this.composer.render();
    }
    
    /**
     * Получить composer для дополнительных эффектов
     */
    public getComposer(): EffectComposer {
        return this.composer;
    }
    
    /**
     * Добавить дополнительный pass
     */
    public addPass(pass: any): void {
        if (!this.isInitialized) return;
        
        // Вставляем pass перед output pass
        const passes = this.composer.passes;
        const outputPassIndex = passes.indexOf(this.outputPass);
        
        if (outputPassIndex > -1) {
            passes.splice(outputPassIndex, 0, pass);
        } else {
            this.composer.addPass(pass);
        }
    }
    
    /**
     * Создать предустановки для различных сценариев
     */
    public applyPreset(preset: 'subtle' | 'medium' | 'strong' | 'cinematic'): void {
        const presets = {
            subtle: {
                aperture: 0.01,
                maxblur: 0.005,
                focusTransitionSpeed: 1.0,
                apertureTransitionSpeed: 0.5
            },
            medium: {
                aperture: 0.025,
                maxblur: 0.01,
                focusTransitionSpeed: 2.0,
                apertureTransitionSpeed: 1.0
            },
            strong: {
                aperture: 0.05,
                maxblur: 0.02,
                focusTransitionSpeed: 3.0,
                apertureTransitionSpeed: 1.5
            },
            cinematic: {
                aperture: 0.08,
                maxblur: 0.03,
                focusTransitionSpeed: 1.5,
                apertureTransitionSpeed: 0.8
            }
        };
        
        const settings = presets[preset];
        if (settings) {
            this.setAperture(settings.aperture, false);
            this.setMaxBlur(settings.maxblur);
            this.setTransitionSpeeds(settings.focusTransitionSpeed, settings.apertureTransitionSpeed);
            
            console.log(`Применена предустановка depth of field: ${preset}`);
        }
    }
    
    /**
     * Освобождение ресурсов
     */
    public dispose(): void {
        if (this.composer) {
            this.composer.dispose();
        }
        
        if (this.bokehPass) {
            this.bokehPass.dispose();
        }
        
        this.isInitialized = false;
        this.isEnabled = false;
        
        console.log('DepthOfFieldSystem освобожден');
    }
}