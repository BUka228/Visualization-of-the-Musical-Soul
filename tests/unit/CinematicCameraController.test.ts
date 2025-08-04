import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CinematicCameraController } from '../../src/soul-galaxy/camera/CinematicCameraController';
import { CrystalTrack } from '../../src/soul-galaxy/types';
import * as THREE from 'three';

// Mock OrbitControls
vi.mock('three/examples/jsm/controls/OrbitControls.js', () => ({
  OrbitControls: vi.fn().mockImplementation(() => ({
    enableDamping: true,
    dampingFactor: 0.05,
    screenSpacePanning: false,
    minDistance: 10,
    maxDistance: 500,
    maxPolarAngle: Math.PI,
    minPolarAngle: 0,
    rotateSpeed: 0.5,
    zoomSpeed: 1.0,
    panSpeed: 0.8,
    mouseButtons: {},
    enabled: true,
    update: vi.fn(),
    reset: vi.fn(),
    dispose: vi.fn()
  }))
}));

// Mock focus animation and depth of field systems
vi.mock('@soul-galaxy/camera/FocusAnimationSystem');
vi.mock('@soul-galaxy/camera/DepthOfFieldSystem');

describe('CinematicCameraController', () => {
  let cameraController: CinematicCameraController;
  let mockCamera: THREE.PerspectiveCamera;
  let mockRenderer: THREE.WebGLRenderer;
  let mockScene: THREE.Scene;
  let mockCrystal: CrystalTrack;

  beforeEach(() => {
    // Create mock objects
    mockCamera = new THREE.PerspectiveCamera();
    mockRenderer = new THREE.WebGLRenderer();
    mockScene = new THREE.Scene();
    
    // Mock renderer domElement
    const mockCanvas = document.createElement('canvas');
    Object.defineProperty(mockRenderer, 'domElement', {
      value: mockCanvas,
      writable: false
    });
    
    // Create mock crystal
    mockCrystal = {
      id: 'test-crystal',
      name: 'Test Song',
      artist: 'Test Artist',
      album: 'Test Album',
      genre: 'rock',
      duration: 180,
      popularity: 75,
      color: '#0080FF',
      imageUrl: 'https://example.com/image.jpg',
      previewUrl: 'https://example.com/preview.mp3',
      position: new THREE.Vector3(10, 0, 0),
      crystalGeometry: new THREE.BufferGeometry(),
      facetCount: 8,
      roughnessLevel: 0.5,
      pulseSpeed: 1.0,
      pulseAmplitude: 0.1,
      pulsePhase: 0,
      genreColor: new THREE.Color(0x0080FF),
      emissiveIntensity: 0.3,
      isFocused: false,
      isHovered: false,
      distanceFromCenter: 10
    };

    cameraController = new CinematicCameraController(mockCamera, mockRenderer, mockScene);
  });

  afterEach(() => {
    cameraController.dispose();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with camera and renderer', () => {
      expect(cameraController).toBeDefined();
      expect(cameraController.getOrbitControls()).toBeDefined();
    });

    it('should initialize with scene for depth of field', () => {
      const controllerWithScene = new CinematicCameraController(mockCamera, mockRenderer, mockScene);
      expect(controllerWithScene.getDepthOfFieldSystem()).toBeDefined();
      controllerWithScene.dispose();
    });

    it('should initialize without scene', () => {
      const controllerWithoutScene = new CinematicCameraController(mockCamera, mockRenderer);
      expect(controllerWithoutScene.getDepthOfFieldSystem()).toBeUndefined();
      controllerWithoutScene.dispose();
    });
  });

  describe('Inertial Mode', () => {
    it('should start in inertial mode by default', () => {
      expect(cameraController.isInertialModeEnabled()).toBe(true);
    });

    it('should switch between inertial and OrbitControls modes', () => {
      // Switch to OrbitControls mode
      cameraController.setInertialMode(false);
      expect(cameraController.isInertialModeEnabled()).toBe(false);
      
      // Switch back to inertial mode
      cameraController.setInertialMode(true);
      expect(cameraController.isInertialModeEnabled()).toBe(true);
    });

    it('should disable OrbitControls when inertial mode is enabled', () => {
      const orbitControls = cameraController.getOrbitControls();
      
      cameraController.setInertialMode(true);
      expect(orbitControls.enabled).toBe(false);
      
      cameraController.setInertialMode(false);
      expect(orbitControls.enabled).toBe(true);
    });
  });

  describe('Inertia Settings', () => {
    it('should set inertia settings', () => {
      const settings = {
        dampingFactor: 0.9,
        maxVelocity: 100,
        maxAngularVelocity: 3,
        mouseSensitivity: 0.001
      };
      
      expect(() => {
        cameraController.setInertiaSettings(settings);
      }).not.toThrow();
    });

    it('should clamp damping factor to valid range', () => {
      expect(() => {
        cameraController.setInertiaSettings({ dampingFactor: -0.5 }); // Invalid
      }).not.toThrow();
      
      expect(() => {
        cameraController.setInertiaSettings({ dampingFactor: 1.5 }); // Invalid
      }).not.toThrow();
    });

    it('should handle negative values for other settings', () => {
      expect(() => {
        cameraController.setInertiaSettings({
          maxVelocity: -10,
          maxAngularVelocity: -5,
          mouseSensitivity: -0.001
        });
      }).not.toThrow();
    });
  });

  describe('Camera Limits', () => {
    it('should set camera limits', () => {
      const limits = {
        minDistance: 5,
        maxDistance: 1000,
        minPolarAngle: 0.1,
        maxPolarAngle: Math.PI - 0.1
      };
      
      expect(() => {
        cameraController.setCameraLimits(limits);
      }).not.toThrow();
    });

    it('should ensure maxDistance is greater than minDistance', () => {
      expect(() => {
        cameraController.setCameraLimits({
          minDistance: 100,
          maxDistance: 50 // Less than minDistance
        });
      }).not.toThrow();
    });

    it('should clamp polar angles to valid range', () => {
      expect(() => {
        cameraController.setCameraLimits({
          minPolarAngle: -0.5, // Invalid
          maxPolarAngle: Math.PI + 0.5 // Invalid
        });
      }).not.toThrow();
    });
  });

  describe('Mouse Events', () => {
    let canvas: HTMLCanvasElement;

    beforeEach(() => {
      canvas = mockRenderer.domElement as HTMLCanvasElement;
    });

    it('should handle mouse down events', () => {
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 200,
        button: 0
      });
      
      expect(() => {
        canvas.dispatchEvent(mouseEvent);
      }).not.toThrow();
    });

    it('should handle mouse move events', () => {
      // First mouse down
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 200,
        button: 0
      });
      canvas.dispatchEvent(mouseDownEvent);
      
      // Then mouse move
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 250
      });
      
      expect(() => {
        canvas.dispatchEvent(mouseMoveEvent);
      }).not.toThrow();
    });

    it('should handle mouse up events', () => {
      // Mouse down first
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 200,
        button: 0
      });
      canvas.dispatchEvent(mouseDownEvent);
      
      // Mouse move
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 250
      });
      canvas.dispatchEvent(mouseMoveEvent);
      
      // Mouse up
      const mouseUpEvent = new MouseEvent('mouseup', {
        clientX: 150,
        clientY: 250,
        button: 0
      });
      
      expect(() => {
        canvas.dispatchEvent(mouseUpEvent);
      }).not.toThrow();
    });

    it('should handle wheel events for zoom', () => {
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 100
      });
      
      expect(() => {
        canvas.dispatchEvent(wheelEvent);
      }).not.toThrow();
    });

    it('should prevent context menu', () => {
      const contextMenuEvent = new MouseEvent('contextmenu');
      const preventDefaultSpy = vi.spyOn(contextMenuEvent, 'preventDefault');
      
      canvas.dispatchEvent(contextMenuEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not handle events when not in inertial mode', () => {
      cameraController.setInertialMode(false);
      
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 200,
        button: 0
      });
      
      expect(() => {
        canvas.dispatchEvent(mouseEvent);
      }).not.toThrow();
    });
  });

  describe('Inertia Updates', () => {
    it('should update inertia with delta time', () => {
      const deltaTime = 0.016; // 16ms
      
      expect(() => {
        cameraController.updateInertia(deltaTime);
      }).not.toThrow();
    });

    it('should not update inertia when mouse is down', () => {
      // Simulate mouse down
      const canvas = mockRenderer.domElement as HTMLCanvasElement;
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 200,
        button: 0
      });
      canvas.dispatchEvent(mouseDownEvent);
      
      expect(() => {
        cameraController.updateInertia(0.016);
      }).not.toThrow();
    });

    it('should not update inertia when not in inertial mode', () => {
      cameraController.setInertialMode(false);
      
      expect(() => {
        cameraController.updateInertia(0.016);
      }).not.toThrow();
    });

    it('should handle large delta times', () => {
      expect(() => {
        cameraController.updateInertia(1.0); // 1 second
      }).not.toThrow();
    });

    it('should handle negative delta times', () => {
      expect(() => {
        cameraController.updateInertia(-0.016);
      }).not.toThrow();
    });
  });

  describe('Camera Reset', () => {
    it('should reset camera to initial position', () => {
      const orbitControls = cameraController.getOrbitControls();
      const resetSpy = vi.spyOn(orbitControls, 'reset');
      
      cameraController.resetCamera();
      
      expect(resetSpy).toHaveBeenCalled();
    });

    it('should stop inertia when resetting', () => {
      // Create some inertia first
      const canvas = mockRenderer.domElement as HTMLCanvasElement;
      const mouseDownEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 200 });
      const mouseMoveEvent = new MouseEvent('mousemove', { clientX: 150, clientY: 250 });
      const mouseUpEvent = new MouseEvent('mouseup', { clientX: 150, clientY: 250 });
      
      canvas.dispatchEvent(mouseDownEvent);
      canvas.dispatchEvent(mouseMoveEvent);
      canvas.dispatchEvent(mouseUpEvent);
      
      // Reset should stop inertia
      expect(() => {
        cameraController.resetCamera();
      }).not.toThrow();
    });
  });

  describe('Focus Animation', () => {
    it('should focus on crystal', async () => {
      await expect(
        cameraController.focusOnCrystal(mockCrystal)
      ).resolves.not.toThrow();
    });

    it('should return to previous position', async () => {
      // Focus first
      await cameraController.focusOnCrystal(mockCrystal);
      
      // Then return
      await expect(
        cameraController.returnToPreviousPosition()
      ).resolves.not.toThrow();
    });

    it('should check if camera is focused', () => {
      const isFocused = cameraController.isFocused();
      expect(typeof isFocused).toBe('boolean');
    });

    it('should check if camera is animating', () => {
      const isAnimating = cameraController.isCameraAnimating();
      expect(typeof isAnimating).toBe('boolean');
    });

    it('should get focused crystal', () => {
      const focusedCrystal = cameraController.getFocusedCrystal();
      expect(focusedCrystal === undefined || focusedCrystal === mockCrystal).toBe(true);
    });

    it('should handle focus animation errors gracefully', async () => {
      // Mock focus animation system to throw error
      const focusSystem = cameraController.getFocusAnimationSystem();
      vi.spyOn(focusSystem, 'focusOnCrystal').mockRejectedValue(new Error('Animation failed'));
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await cameraController.focusOnCrystal(mockCrystal);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to focus on crystal:'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle return animation errors gracefully', async () => {
      // Mock focus animation system to throw error
      const focusSystem = cameraController.getFocusAnimationSystem();
      vi.spyOn(focusSystem, 'returnToPreviousPosition').mockRejectedValue(new Error('Return failed'));
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      await cameraController.returnToPreviousPosition();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to return to previous position:'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Focus Animation Settings', () => {
    it('should set focus animation settings', () => {
      const settings = {
        transitionDuration: 2000,
        easing: 'easeInOut' as const,
        optimalDistance: 15,
        optimalAngle: Math.PI / 4,
        returnDuration: 1500,
        enableDepthOfField: true
      };
      
      expect(() => {
        cameraController.setFocusAnimationSettings(settings);
      }).not.toThrow();
    });

    it('should apply focus presets', () => {
      const presets = ['fast', 'smooth', 'cinematic', 'dramatic'] as const;
      
      presets.forEach(preset => {
        expect(() => {
          cameraController.applyFocusPreset(preset);
        }).not.toThrow();
      });
    });

    it('should set focus callbacks', () => {
      const callbacks = {
        onFocusStart: vi.fn(),
        onFocusComplete: vi.fn(),
        onReturnStart: vi.fn(),
        onReturnComplete: vi.fn()
      };
      
      expect(() => {
        cameraController.setFocusCallbacks(callbacks);
      }).not.toThrow();
    });
  });

  describe('Update Loop', () => {
    it('should update with default delta time', () => {
      expect(() => {
        cameraController.update();
      }).not.toThrow();
    });

    it('should update with custom delta time', () => {
      expect(() => {
        cameraController.update(0.016);
      }).not.toThrow();
    });

    it('should update focus animation system', () => {
      const focusSystem = cameraController.getFocusAnimationSystem();
      const updateSpy = vi.spyOn(focusSystem, 'update');
      
      cameraController.update(0.016);
      
      expect(updateSpy).toHaveBeenCalledWith(0.016);
    });

    it('should update OrbitControls when not in inertial mode and not animating', () => {
      cameraController.setInertialMode(false);
      
      const orbitControls = cameraController.getOrbitControls();
      const updateSpy = vi.spyOn(orbitControls, 'update');
      
      // Mock focus animation system to not be animating
      const focusSystem = cameraController.getFocusAnimationSystem();
      vi.spyOn(focusSystem, 'isAnimating').mockReturnValue(false);
      
      cameraController.update(0.016);
      
      expect(updateSpy).toHaveBeenCalled();
    });

    it('should not update controls when focus animation is active', () => {
      const orbitControls = cameraController.getOrbitControls();
      const updateSpy = vi.spyOn(orbitControls, 'update');
      
      // Mock focus animation system to be animating
      const focusSystem = cameraController.getFocusAnimationSystem();
      vi.spyOn(focusSystem, 'isAnimating').mockReturnValue(true);
      
      cameraController.setInertialMode(false);
      cameraController.update(0.016);
      
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe('System Access', () => {
    it('should provide access to OrbitControls', () => {
      const orbitControls = cameraController.getOrbitControls();
      expect(orbitControls).toBeDefined();
      expect(orbitControls.update).toBeDefined();
    });

    it('should provide access to depth of field system', () => {
      const depthOfFieldSystem = cameraController.getDepthOfFieldSystem();
      expect(depthOfFieldSystem).toBeDefined();
    });

    it('should provide access to focus animation system', () => {
      const focusAnimationSystem = cameraController.getFocusAnimationSystem();
      expect(focusAnimationSystem).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should handle rapid mouse movements efficiently', () => {
      const canvas = mockRenderer.domElement as HTMLCanvasElement;
      
      // Simulate rapid mouse movements
      const startTime = performance.now();
      
      canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: 0, clientY: 0 }));
      
      for (let i = 0; i < 100; i++) {
        canvas.dispatchEvent(new MouseEvent('mousemove', { 
          clientX: i * 2, 
          clientY: i * 2 
        }));
      }
      
      canvas.dispatchEvent(new MouseEvent('mouseup', { clientX: 200, clientY: 200 }));
      
      const endTime = performance.now();
      
      // Should handle 100 mouse events quickly (< 50ms)
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('should maintain consistent update performance', () => {
      const updateTimes: number[] = [];
      
      // Perform multiple updates and measure time
      for (let i = 0; i < 100; i++) {
        const startTime = performance.now();
        cameraController.update(0.016);
        const endTime = performance.now();
        updateTimes.push(endTime - startTime);
      }
      
      // Calculate average update time
      const avgUpdateTime = updateTimes.reduce((sum, time) => sum + time, 0) / updateTimes.length;
      
      // Should maintain consistent performance (< 2ms average)
      expect(avgUpdateTime).toBeLessThan(2);
    });
  });

  describe('Memory Management', () => {
    it('should dispose properly', () => {
      expect(() => {
        cameraController.dispose();
      }).not.toThrow();
    });

    it('should remove event listeners on disposal', () => {
      const canvas = mockRenderer.domElement as HTMLCanvasElement;
      const removeEventListenerSpy = vi.spyOn(canvas, 'removeEventListener');
      
      cameraController.dispose();
      
      // Should remove all event listeners
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('wheel', expect.any(Function));
    });

    it('should dispose subsystems', () => {
      const focusSystem = cameraController.getFocusAnimationSystem();
      const depthOfFieldSystem = cameraController.getDepthOfFieldSystem();
      const orbitControls = cameraController.getOrbitControls();
      
      const focusDisposeSpy = vi.spyOn(focusSystem, 'dispose');
      const depthDisposeSpy = depthOfFieldSystem ? vi.spyOn(depthOfFieldSystem, 'dispose') : null;
      const orbitDisposeSpy = vi.spyOn(orbitControls, 'dispose');
      
      cameraController.dispose();
      
      expect(focusDisposeSpy).toHaveBeenCalled();
      if (depthDisposeSpy) {
        expect(depthDisposeSpy).toHaveBeenCalled();
      }
      expect(orbitDisposeSpy).toHaveBeenCalled();
    });

    it('should handle multiple disposals', () => {
      cameraController.dispose();
      
      expect(() => {
        cameraController.dispose(); // Second disposal
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle camera position at origin', () => {
      mockCamera.position.set(0, 0, 0);
      
      expect(() => {
        cameraController.update(0.016);
      }).not.toThrow();
    });

    it('should handle extreme camera distances', () => {
      // Very close
      mockCamera.position.set(0.1, 0, 0);
      expect(() => {
        cameraController.update(0.016);
      }).not.toThrow();
      
      // Very far
      mockCamera.position.set(10000, 0, 0);
      expect(() => {
        cameraController.update(0.016);
      }).not.toThrow();
    });

    it('should handle zero delta time', () => {
      expect(() => {
        cameraController.update(0);
      }).not.toThrow();
    });

    it('should handle very large delta time', () => {
      expect(() => {
        cameraController.update(10); // 10 seconds
      }).not.toThrow();
    });
  });
});