import * as THREE from 'three';
import { CrystalTrack } from '../types';

/**
 * Простая система приближения к кристаллам
 * Заменяет сложную систему фокуса на простое приближение камеры
 */
export class SimpleZoomSystem {
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene;
    
    // Состояние приближения
    private isZooming: boolean = false;
    private targetCrystal?: CrystalTrack;
    
    // Настройки приближения
    private zoomDistance: number = 25.0; // Расстояние приближения (увеличено для большей дистанции)
    private animationDuration: number = 1000; // 1 секунда
    
    // Анимация
    private animationId?: number;
    
    // Коллбэки
    private onZoomStart?: (crystal: CrystalTrack) => void;
    private onZoomComplete?: (crystal: CrystalTrack) => void;
    
    constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
        this.camera = camera;
        this.scene = scene;
        
        console.log('🔍 Simple Zoom System initialized');
    }
    
    /**
     * Приближается к кристаллу
     */
    public async zoomToCrystal(crystal: CrystalTrack): Promise<void> {
        if (this.isZooming) {
            console.warn('⚠️ Zoom animation already in progress, skipping');
            return;
        }
        
        console.log(`🔍 Zooming to crystal: ${crystal.name} by ${crystal.artist}`);
        
        // Находим позицию кристалла
        const crystalPosition = this.getCrystalWorldPosition(crystal);
        if (!crystalPosition) {
            console.error(`❌ Could not find crystal position for ${crystal.name}`);
            return;
        }
        
        // Рассчитываем целевую позицию камеры более безопасным способом
        const targetPosition = this.calculateSafeZoomPosition(crystalPosition);
        
        // Проверяем, что целевая позиция разумна
        if (!this.isValidCameraPosition(targetPosition, crystalPosition)) {
            console.error(`❌ Invalid camera position calculated for ${crystal.name}`);
            return;
        }
        
        // Устанавливаем состояние
        this.isZooming = true;
        this.targetCrystal = crystal;
        
        // Вызываем коллбэк начала приближения
        if (this.onZoomStart) {
            this.onZoomStart(crystal);
        }
        
        try {
            // Запускаем анимацию приближения
            await this.animateToPosition(targetPosition, crystalPosition);
            
            console.log(`✅ Zoom completed to crystal: ${crystal.name}`);
        } catch (error) {
            console.error(`❌ Zoom animation failed for ${crystal.name}:`, error);
        } finally {
            // Завершаем приближение
            this.isZooming = false;
            
            // Вызываем коллбэк завершения приближения
            if (this.onZoomComplete) {
                this.onZoomComplete(crystal);
            }
        }
    }
    
    /**
     * Анимирует камеру к целевой позиции
     */
    private animateToPosition(targetPosition: THREE.Vector3, lookAtTarget: THREE.Vector3): Promise<void> {
        return new Promise((resolve) => {
            const startPosition = this.camera.position.clone();
            const startTime = performance.now();
            
            const animate = () => {
                const elapsed = performance.now() - startTime;
                const progress = Math.min(elapsed / this.animationDuration, 1.0);
                
                // Применяем easing (ease-out для плавного замедления)
                const easedProgress = 1 - Math.pow(1 - progress, 3);
                
                // Интерполируем позицию камеры
                const currentPosition = startPosition.clone().lerp(targetPosition, easedProgress);
                
                // Применяем к камере
                this.camera.position.copy(currentPosition);
                this.camera.lookAt(lookAtTarget);
                this.camera.updateMatrixWorld();
                
                if (progress < 1.0) {
                    this.animationId = requestAnimationFrame(animate);
                } else {
                    this.animationId = undefined;
                    resolve();
                }
            };
            
            animate();
        });
    }
    
    /**
     * Получает мировую позицию кристалла
     */
    private getCrystalWorldPosition(crystal: CrystalTrack): THREE.Vector3 | null {
        // Ищем mesh кристалла в сцене
        const meshes: THREE.Mesh[] = [];
        
        this.scene.traverse((object) => {
            if (object instanceof THREE.Mesh && 
                object.userData.trackId === crystal.id && 
                object.userData.isCrystal) {
                meshes.push(object);
            }
        });
        
        if (meshes.length > 0) {
            const mesh = meshes[0];
            const worldPosition = new THREE.Vector3();
            mesh.getWorldPosition(worldPosition);
            console.log(`✅ Found crystal mesh for ${crystal.name}, world position:`, worldPosition);
            return worldPosition;
        }
        
        // Fallback на позицию из данных кристалла
        if (crystal.position) {
            console.log(`🔄 Using crystal data position for ${crystal.name}:`, crystal.position);
            return crystal.position.clone();
        }
        
        console.error(`❌ Could not find position for crystal: ${crystal.name}`);
        return null;
    }
    
    /**
     * Рассчитывает безопасную позицию для приближения камеры
     */
    private calculateSafeZoomPosition(crystalPosition: THREE.Vector3): THREE.Vector3 {
        // Получаем направление от центра к кристаллу
        const directionFromCenter = crystalPosition.clone().normalize();
        
        // Позиционируем камеру ПОЗАДИ кристалла (между кристаллом и центром)
        // чтобы камера смотрела в сторону центральной сферы
        const cameraPosition = crystalPosition.clone()
            .sub(directionFromCenter.multiplyScalar(this.zoomDistance));
        
        console.log(`📐 Calculated zoom position (behind crystal):`, {
            crystal: crystalPosition,
            camera: cameraPosition,
            distance: cameraPosition.distanceTo(crystalPosition),
            directionToCenter: directionFromCenter.clone().negate()
        });
        
        return cameraPosition;
    }
    
    /**
     * Проверяет, является ли позиция камеры валидной
     */
    private isValidCameraPosition(cameraPosition: THREE.Vector3, crystalPosition: THREE.Vector3): boolean {
        // Проверяем, что позиция не содержит NaN или Infinity
        if (!isFinite(cameraPosition.x) || !isFinite(cameraPosition.y) || !isFinite(cameraPosition.z)) {
            console.error('❌ Camera position contains invalid values:', cameraPosition);
            return false;
        }
        
        // Проверяем, что расстояние до кристалла разумное
        const distance = cameraPosition.distanceTo(crystalPosition);
        if (distance < 1 || distance > 1000) {
            console.error(`❌ Invalid distance to crystal: ${distance}`);
            return false;
        }
        
        // Проверяем, что камера не слишком далеко от центра
        const distanceFromCenter = cameraPosition.length();
        if (distanceFromCenter > 5000) { // Увеличено с 2000 до 5000
            console.error(`❌ Camera too far from center: ${distanceFromCenter}`);
            return false;
        }
        
        return true;
    }
    
    /**
     * Останавливает текущую анимацию
     */
    public stopAnimation(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = undefined;
        }
        
        this.isZooming = false;
        
        console.log('⏹️ Zoom animation stopped');
    }
    
    /**
     * Проверяет, выполняется ли приближение
     */
    public getIsZooming(): boolean {
        return this.isZooming;
    }
    
    /**
     * Получает текущий целевой кристалл
     */
    public getTargetCrystal(): CrystalTrack | undefined {
        return this.targetCrystal;
    }
    
    /**
     * Устанавливает коллбэки для событий
     */
    public setCallbacks(callbacks: {
        onZoomStart?: (crystal: CrystalTrack) => void;
        onZoomComplete?: (crystal: CrystalTrack) => void;
    }): void {
        this.onZoomStart = callbacks.onZoomStart;
        this.onZoomComplete = callbacks.onZoomComplete;
    }
    
    /**
     * Настройка параметров системы
     */
    public setSettings(settings: {
        zoomDistance?: number;
        animationDuration?: number;
    }): void {
        if (settings.zoomDistance !== undefined) {
            this.zoomDistance = Math.max(5, settings.zoomDistance);
        }
        if (settings.animationDuration !== undefined) {
            this.animationDuration = Math.max(100, settings.animationDuration);
        }
        
        console.log('⚙️ Zoom system settings updated:', {
            zoomDistance: this.zoomDistance,
            animationDuration: this.animationDuration
        });
    }
    
    /**
     * Освобождение ресурсов
     */
    public dispose(): void {
        console.log('🗑️ Disposing Simple Zoom System...');
        
        this.stopAnimation();
        
        this.isZooming = false;
        this.targetCrystal = undefined;
        
        this.onZoomStart = undefined;
        this.onZoomComplete = undefined;
        
        console.log('✅ Simple Zoom System disposed');
    }
}