import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SimpleZoomSystem } from './SimpleZoomSystem';
import { CrystalTrack } from '../types';

/**
 * Упрощенный контроллер камеры с простой системой приближения
 * Заменяет сложную систему фокуса на простое приближение к кристаллам
 */
export class SimpleCameraController {
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private orbitControls: OrbitControls;
    private zoomSystem: SimpleZoomSystem;
    
    // UI Manager для уведомлений
    private uiManager?: any;
    
    // Система кристаллов для управления вращением кластера
    private crystalTrackSystem?: any;
    
    constructor(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
        this.camera = camera;
        this.renderer = renderer;
        this.scene = scene;
        
        // Создаем OrbitControls
        this.orbitControls = new OrbitControls(camera, renderer.domElement);
        this.setupOrbitControls();
        
        // Создаем систему приближения
        this.zoomSystem = new SimpleZoomSystem(camera, scene);
        this.setupZoomCallbacks();
        
        console.log('📹 Simple Camera Controller initialized');
    }
    
    /**
     * Настройка OrbitControls
     */
    private setupOrbitControls(): void {
        this.orbitControls.enableDamping = true;
        this.orbitControls.dampingFactor = 0.05;
        this.orbitControls.screenSpacePanning = false;
        
        // Ограничения
        this.orbitControls.minDistance = 10;
        this.orbitControls.maxDistance = 500;
        this.orbitControls.maxPolarAngle = Math.PI;
        this.orbitControls.minPolarAngle = 0;
        
        // Настройка скоростей
        this.orbitControls.rotateSpeed = 0.5;
        this.orbitControls.zoomSpeed = 1.0;
        this.orbitControls.panSpeed = 0.8;
        
        console.log('🎮 OrbitControls configured');
    }
    
    /**
     * Настройка коллбэков системы приближения
     */
    private setupZoomCallbacks(): void {
        this.zoomSystem.setCallbacks({
            onZoomStart: (crystal: CrystalTrack) => {
                console.log(`🔍 Zoom started to: ${crystal.name}`);
                // Не останавливаем вращение здесь - это уже делается в handleCrystalClick
                // Избегаем дублирования логики управления вращением
            },
            
            onZoomComplete: (crystal: CrystalTrack) => {
                console.log(`✅ Zoom completed to: ${crystal.name}`);
                // Не возобновляем вращение здесь - это управляется аудио коллбэками и кликами мыши
            }
        });
    }
    

    
    /**
     * Приближается к кристаллу
     */
    public async zoomToCrystal(crystal: CrystalTrack): Promise<void> {
        return this.zoomSystem.zoomToCrystal(crystal);
    }
    
    /**
     * Проверяет, выполняется ли приближение
     */
    public isZooming(): boolean {
        return this.zoomSystem.getIsZooming();
    }
    
    /**
     * Получает текущий целевой кристалл
     */
    public getTargetCrystal(): CrystalTrack | undefined {
        return this.zoomSystem.getTargetCrystal();
    }
    
    /**
     * Устанавливает UI Manager для уведомлений
     */
    public setUIManager(uiManager: any): void {
        this.uiManager = uiManager;
        console.log('🎨 UI Manager integrated with Simple Camera Controller');
    }
    
    /**
     * Устанавливает систему кристаллов для управления вращением кластера
     */
    public setCrystalTrackSystem(crystalTrackSystem: any): void {
        this.crystalTrackSystem = crystalTrackSystem;
        console.log('💎 Crystal Track System integrated with Simple Camera Controller');
    }
    
    /**
     * Настройка параметров приближения
     */
    public setZoomSettings(settings: {
        zoomDistance?: number;
        animationDuration?: number;
    }): void {
        this.zoomSystem.setSettings(settings);
    }
    
    /**
     * Получение OrbitControls для совместимости
     */
    public getOrbitControls(): OrbitControls {
        return this.orbitControls;
    }
    
    /**
     * Обновление (вызывается в цикле рендеринга)
     */
    public update(deltaTime: number = 0.016): void {
        // Обновляем OrbitControls всегда (приближение не блокирует управление)
        this.orbitControls.update();
    }
    
    /**
     * Освобождение ресурсов
     */
    public dispose(): void {
        console.log('🗑️ Disposing Simple Camera Controller...');
        
        // Освобождаем системы
        this.zoomSystem.dispose();
        this.orbitControls.dispose();
        
        console.log('✅ Simple Camera Controller disposed');
    }
}