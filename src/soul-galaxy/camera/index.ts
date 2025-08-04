/**
 * Soul Galaxy Camera System
 * 
 * Простая система камеры с приближением к кристаллам
 * и эффектами глубины резкости
 */

export { SimpleCameraController } from './SimpleCameraController';
export { SimpleZoomSystem } from './SimpleZoomSystem';
export { FocusTransitionSystem, EasingType } from './FocusTransitionSystem';
export { DepthOfFieldSystem } from './DepthOfFieldSystem';

export type { CrystalTarget, TransitionSettings } from './FocusTransitionSystem';
export type { DepthOfFieldSettings } from './DepthOfFieldSystem';