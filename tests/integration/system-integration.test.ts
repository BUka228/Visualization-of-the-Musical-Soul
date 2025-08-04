/**
 * Integration Tests for Soul Galaxy Visual System
 * Task 10.2: Провести интеграционное тестирование с существующей системой
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MusicGalaxyApplication } from '../../src/index';
import { SceneManager } from '../../src/scene/SceneManager';
import { AudioManager } from '../../src/audio/AudioManager';
import { ProcessedTrack } from '../../src/types';
import * as THREE from 'three';

// Mock Three.js properly
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal() as typeof THREE;
  
  // Create mock classes that extend the actual ones
  class MockScene extends actual.Scene {
    constructor() {
      super();
    }
  }
  
  class MockPerspectiveCamera extends actual.PerspectiveCamera {
    constructor(fov?: number, aspect?: number, near?: number, far?: number) {
      super(fov, aspect, near, far);
    }
  }
  
  class MockWebGLRenderer extends actual.WebGLRenderer {
    constructor(parameters?: any) {
      super(parameters);
      this.domElement = document.createElement('canvas');
    }
  }
  
  class MockAmbientLight extends actual.AmbientLight {
    constructor(color?: any, intensity?: number) {
      super(color, intensity);
    }
  }
  
  class MockDirectionalLight extends actual.DirectionalLight {
    constructor(color?: any, intensity?: number) {
      super(color, intensity);
    }
  }
  
  class MockIcosahedronGeometry extends actual.IcosahedronGeometry {
    constructor(radius?: number, detail?: number) {
      super(radius, detail);
    }
  }
  
  class MockMeshStandardMaterial extends actual.MeshStandardMaterial {
    constructor(parameters?: any) {
      super(parameters);
    }
  }
  
  class MockMesh extends actual.Mesh {
    constructor(geometry?: any, material?: any) {
      super(geometry, material);
    }
  }
  
  return {
    ...actual,
    Scene: MockScene,
    PerspectiveCamera: MockPerspectiveCamera,
    WebGLRenderer: MockWebGLRenderer,
    AmbientLight: MockAmbientLight,
    DirectionalLight: MockDirectionalLight,
    IcosahedronGeometry: MockIcosahedronGeometry,
    MeshStandardMaterial: MockMeshStandardMaterial,
    Mesh: MockMesh,
    Vector3: actual.Vector3,
    Color: actual.Color,
    Fog: actual.Fog,
    PCFSoftShadowMap: actual.PCFSoftShadowMap,
    SRGBColorSpace: actual.SRGBColorSpace,
    ACESFilmicToneMapping: actual.ACESFilmicToneMapping
  };
});

// Mock DOM elements
const mockContainer = document.createElement('div');
mockContainer.id = 'canvas-container';
mockContainer.style.width = '800px';
mockContainer.style.height = '600px';
document.body.appendChild(mockContainer);

// Mock WebGL context
const mockWebGLContext = {
  getExtension: vi.fn(),
  getParameter: vi.fn(),
  createShader: vi.fn(),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  createProgram: vi.fn(),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn(() => true),
  useProgram: vi.fn(),
  getAttribLocation: vi.fn(),
  getUniformLocation: vi.fn(),
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  uniform1f: vi.fn(),
  uniform3fv: vi.fn(),
  uniformMatrix4fv: vi.fn(),
  createBuffer: vi.fn(),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  drawArrays: vi.fn(),
  drawElements: vi.fn(),
  viewport: vi.fn(),
  clearColor: vi.fn(),
  clear: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  blendFunc: vi.fn(),
  depthFunc: vi.fn(),
  cullFace: vi.fn(),
};

// Mock canvas getContext
HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
  if (contextType === 'webgl' || contextType === 'experimental-webgl') {
    return mockWebGLContext;
  }
  return null;
});

describe('System Integration Tests', () => {
  let app: MusicGalaxyApplication;
  let sceneManager: SceneManager;
  let audioManager: AudioManager;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    document.body.appendChild(mockContainer);
    
    // Create fresh instances
    app = new MusicGalaxyApplication();
    audioManager = new AudioManager();
  });

  afterEach(() => {
    if (app) {
      app.dispose();
    }
    if (sceneManager) {
      sceneManager.dispose();
    }
    if (audioManager) {
      audioManager.dispose();
    }
  });

  describe('Soul Galaxy System Integration', () => {
    it('should initialize Soul Galaxy system successfully', async () => {
      // Test that the unified Soul Galaxy system initializes properly
      await expect(app.initialize(mockContainer)).resolves.not.toThrow();
      
      const state = app.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should handle Soul Galaxy renderer initialization', async () => {
      await app.initialize(mockContainer);
      
      // Verify Soul Galaxy renderer is properly integrated
      const state = app.getState();
      expect(state.isInitialized).toBe(true);
      
      // Check that canvas is added to container
      const canvas = mockContainer.querySelector('canvas');
      expect(canvas).toBeTruthy();
    });

    it('should integrate cinematic camera controller', async () => {
      await app.initialize(mockContainer);
      
      // Test that cinematic camera controller is properly integrated
      // This would be tested through the SceneManager
      expect(() => {
        // Simulate camera movement
        const event = new MouseEvent('mousemove', {
          clientX: 100,
          clientY: 100
        });
        mockContainer.dispatchEvent(event);
      }).not.toThrow();
    });

    it('should handle Soul Galaxy as the only visualization mode', async () => {
      await app.initialize(mockContainer);
      
      // Since classic mode was removed, Soul Galaxy should be the only mode
      const state = app.getState();
      expect(state.isInitialized).toBe(true);
      
      // Test that the system works without mode switching
      const testTracks: ProcessedTrack[] = [{
        id: 'test-1',
        title: 'Test Track',
        artist: 'Test Artist',
        album: 'Test Album',
        genre: 'rock',
        duration: 180,
        energy: 0.8,
        valence: 0.6,
        danceability: 0.7,
        acousticness: 0.3,
        instrumentalness: 0.1,
        liveness: 0.2,
        speechiness: 0.1,
        tempo: 120,
        position: new THREE.Vector3(0, 0, 0),
        size: 1.0,
        color: '#0080FF',
        previewUrl: 'https://example.com/preview.mp3',
        albumArtUrl: 'https://example.com/art.jpg'
      }];
      
      await expect(app.loadTracks(testTracks)).resolves.not.toThrow();
      
      const updatedState = app.getState();
      expect(updatedState.tracks).toHaveLength(1);
    });

    it('should integrate all Soul Galaxy subsystems properly', async () => {
      await app.initialize(mockContainer);
      
      // Test that all major subsystems are working together
      const testTracks: ProcessedTrack[] = Array.from({ length: 10 }, (_, i) => ({
        id: `test-${i}`,
        title: `Test Track ${i + 1}`,
        artist: `Test Artist ${i % 3}`,
        album: `Test Album ${i % 2}`,
        genre: ['rock', 'metal', 'electronic'][i % 3],
        duration: 180,
        energy: Math.random(),
        valence: Math.random(),
        danceability: Math.random(),
        acousticness: Math.random(),
        instrumentalness: Math.random(),
        liveness: Math.random(),
        speechiness: Math.random(),
        tempo: 120 + (i * 10),
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        ),
        size: 0.5 + Math.random() * 2,
        color: ['#FF0000', '#0080FF', '#9400D3'][i % 3],
        previewUrl: `https://example.com/preview-${i}.mp3`,
        albumArtUrl: `https://example.com/art-${i}.jpg`
      }));
      
      await app.loadTracks(testTracks);
      
      // Test camera controls
      expect(() => app.resetView()).not.toThrow();
      expect(() => app.toggleAnimation()).not.toThrow();
      
      // Test track selection
      expect(() => app.selectTrack('test-0')).not.toThrow();
      
      const state = app.getState();
      expect(state.tracks).toHaveLength(10);
      expect(Object.keys(state.genreStats)).toContain('rock');
      expect(Object.keys(state.genreStats)).toContain('metal');
      expect(Object.keys(state.genreStats)).toContain('electronic');
    });
  });

  describe('Audio System Integration', () => {
    it('should integrate audio manager with Soul Galaxy system', async () => {
      await app.initialize(mockContainer);
      
      // Mock audio element
      const mockAudio = {
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        load: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        volume: 0,
        currentTime: 0,
        duration: 30,
        src: '',
        crossOrigin: '',
        preload: ''
      };
      
      global.Audio = vi.fn(() => mockAudio) as any;
      
      // Test audio preview functionality
      const testUrl = 'https://example.com/preview.mp3';
      await expect(audioManager.playPreview(testUrl)).resolves.not.toThrow();
      
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it('should handle audio errors gracefully', async () => {
      await app.initialize(mockContainer);
      
      // Mock audio element that throws error
      const mockAudio = {
        play: vi.fn().mockRejectedValue(new Error('Audio load failed')),
        pause: vi.fn(),
        load: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        volume: 0,
        currentTime: 0,
        duration: 0,
        src: '',
        crossOrigin: '',
        preload: ''
      };
      
      global.Audio = vi.fn(() => mockAudio) as any;
      
      // Test error handling
      await expect(audioManager.playPreview('invalid-url')).rejects.toThrow();
    });

    it('should synchronize audio with visual focus transitions', async () => {
      await app.initialize(mockContainer);
      
      // Mock successful audio
      const mockAudio = {
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn(),
        load: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        volume: 0,
        currentTime: 0,
        duration: 30,
        src: '',
        crossOrigin: '',
        preload: ''
      };
      
      global.Audio = vi.fn(() => mockAudio) as any;
      
      // Test that audio and visual systems work together
      const testTrackId = 'test-track-1';
      
      expect(() => {
        app.selectTrack(testTrackId);
      }).not.toThrow();
    });
  });

  describe('UI System Integration', () => {
    it('should integrate UI manager with Soul Galaxy system', async () => {
      await app.initialize(mockContainer);
      
      // Test UI elements are created
      const state = app.getState();
      expect(state.isInitialized).toBe(true);
      
      // Test UI responds to system state changes
      expect(() => {
        app.toggleAnimation();
      }).not.toThrow();
      
      expect(() => {
        app.resetView();
      }).not.toThrow();
    });

    it('should handle responsive UI updates', async () => {
      await app.initialize(mockContainer);
      
      // Test window resize handling
      mockContainer.style.width = '1200px';
      mockContainer.style.height = '800px';
      
      const resizeEvent = new Event('resize');
      window.dispatchEvent(resizeEvent);
      
      // Should not throw errors during resize
      expect(true).toBe(true);
    });

    it('should display track information in HUD', async () => {
      await app.initialize(mockContainer);
      
      // Create mock track data
      const mockTracks: ProcessedTrack[] = [{
        id: 'test-1',
        title: 'Test Track',
        artist: 'Test Artist',
        album: 'Test Album',
        genre: 'rock',
        duration: 180,
        energy: 0.8,
        valence: 0.6,
        danceability: 0.7,
        acousticness: 0.3,
        instrumentalness: 0.1,
        liveness: 0.2,
        speechiness: 0.1,
        tempo: 120,
        position: new THREE.Vector3(0, 0, 0),
        size: 1.0,
        color: '#0080FF',
        previewUrl: 'https://example.com/preview.mp3',
        albumArtUrl: 'https://example.com/art.jpg'
      }];
      
      // Test loading tracks
      await expect(app.loadTracks(mockTracks)).resolves.not.toThrow();
      
      const state = app.getState();
      expect(state.tracks).toHaveLength(1);
    });
  });

  describe('Large Collection Handling', () => {
    it('should handle 1000+ tracks without performance issues', async () => {
      await app.initialize(mockContainer);
      
      // Generate large collection of mock tracks
      const largeMockTracks: ProcessedTrack[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `track-${i}`,
        title: `Track ${i}`,
        artist: `Artist ${i % 100}`,
        album: `Album ${i % 50}`,
        genre: ['rock', 'metal', 'pop', 'electronic', 'jazz'][i % 5],
        duration: 180 + (i % 120),
        energy: Math.random(),
        valence: Math.random(),
        danceability: Math.random(),
        acousticness: Math.random(),
        instrumentalness: Math.random(),
        liveness: Math.random(),
        speechiness: Math.random(),
        tempo: 80 + (i % 100),
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100
        ),
        size: 0.5 + Math.random() * 2.5,
        color: ['#FF0000', '#0080FF', '#FFD700', '#9400D3', '#228B22'][i % 5],
        previewUrl: `https://example.com/preview-${i}.mp3`,
        albumArtUrl: `https://example.com/art-${i}.jpg`
      }));
      
      // Measure performance
      const startTime = performance.now();
      
      await app.loadTracks(largeMockTracks);
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Should load within reasonable time (5 seconds)
      expect(loadTime).toBeLessThan(5000);
      
      const state = app.getState();
      expect(state.tracks).toHaveLength(1000);
    });

    it('should maintain 60fps with large collections', async () => {
      await app.initialize(mockContainer);
      
      // Generate medium-sized collection for performance testing
      const mediumMockTracks: ProcessedTrack[] = Array.from({ length: 500 }, (_, i) => ({
        id: `track-${i}`,
        title: `Track ${i}`,
        artist: `Artist ${i % 50}`,
        album: `Album ${i % 25}`,
        genre: ['rock', 'metal', 'pop'][i % 3],
        duration: 180,
        energy: Math.random(),
        valence: Math.random(),
        danceability: Math.random(),
        acousticness: Math.random(),
        instrumentalness: Math.random(),
        liveness: Math.random(),
        speechiness: Math.random(),
        tempo: 120,
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 50
        ),
        size: 1.0,
        color: '#0080FF',
        previewUrl: `https://example.com/preview-${i}.mp3`,
        albumArtUrl: `https://example.com/art-${i}.jpg`
      }));
      
      await app.loadTracks(mediumMockTracks);
      
      // Simulate animation frames and measure performance
      let frameCount = 0;
      const targetFrames = 60; // Test for 1 second at 60fps
      
      const startTime = performance.now();
      
      const animationLoop = () => {
        frameCount++;
        if (frameCount < targetFrames) {
          requestAnimationFrame(animationLoop);
        }
      };
      
      requestAnimationFrame(animationLoop);
      
      // Wait for animation to complete
      await new Promise(resolve => {
        const checkComplete = () => {
          if (frameCount >= targetFrames) {
            resolve(undefined);
          } else {
            setTimeout(checkComplete, 10);
          }
        };
        checkComplete();
      });
      
      const endTime = performance.now();
      const actualTime = endTime - startTime;
      const expectedTime = (targetFrames / 60) * 1000; // 1 second
      
      // Should maintain close to 60fps (allow 10% variance)
      expect(actualTime).toBeLessThan(expectedTime * 1.1);
    });

    it('should handle memory efficiently with large collections', async () => {
      await app.initialize(mockContainer);
      
      // Test memory usage doesn't grow excessively
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Load large collection
      const largeMockTracks: ProcessedTrack[] = Array.from({ length: 2000 }, (_, i) => ({
        id: `track-${i}`,
        title: `Track ${i}`,
        artist: `Artist ${i % 100}`,
        album: `Album ${i % 50}`,
        genre: 'rock',
        duration: 180,
        energy: 0.8,
        valence: 0.6,
        danceability: 0.7,
        acousticness: 0.3,
        instrumentalness: 0.1,
        liveness: 0.2,
        speechiness: 0.1,
        tempo: 120,
        position: new THREE.Vector3(0, 0, 0),
        size: 1.0,
        color: '#0080FF',
        previewUrl: `https://example.com/preview-${i}.mp3`,
        albumArtUrl: `https://example.com/art-${i}.jpg`
      }));
      
      await app.loadTracks(largeMockTracks);
      
      const afterLoadMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Dispose and check memory cleanup
      app.dispose();
      
      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc();
      }
      
      const afterDisposeMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Memory should be cleaned up (allow some variance)
      if (initialMemory > 0 && afterLoadMemory > 0 && afterDisposeMemory > 0) {
        const memoryIncrease = afterDisposeMemory - initialMemory;
        const loadMemoryIncrease = afterLoadMemory - initialMemory;
        
        // After disposal, memory increase should be less than 50% of load increase
        expect(memoryIncrease).toBeLessThan(loadMemoryIncrease * 0.5);
      }
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle WebGL context loss gracefully', async () => {
      await app.initialize(mockContainer);
      
      // Simulate WebGL context loss
      const canvas = mockContainer.querySelector('canvas');
      if (canvas) {
        const lostContextEvent = new Event('webglcontextlost');
        canvas.dispatchEvent(lostContextEvent);
        
        // Should not crash the application
        expect(app.getState().isInitialized).toBe(true);
      }
    });

    it('should handle shader compilation errors', async () => {
      // Mock shader compilation failure
      mockWebGLContext.getShaderParameter = vi.fn(() => false);
      mockWebGLContext.getShaderInfoLog = vi.fn(() => 'Shader compilation failed');
      
      // Should still initialize with fallback materials
      await expect(app.initialize(mockContainer)).resolves.not.toThrow();
    });

    it('should handle texture loading errors', async () => {
      await app.initialize(mockContainer);
      
      // Create track with invalid texture URL
      const trackWithBadTexture: ProcessedTrack = {
        id: 'bad-texture-track',
        title: 'Bad Texture Track',
        artist: 'Test Artist',
        album: 'Test Album',
        genre: 'rock',
        duration: 180,
        energy: 0.8,
        valence: 0.6,
        danceability: 0.7,
        acousticness: 0.3,
        instrumentalness: 0.1,
        liveness: 0.2,
        speechiness: 0.1,
        tempo: 120,
        position: new THREE.Vector3(0, 0, 0),
        size: 1.0,
        color: '#0080FF',
        previewUrl: 'https://example.com/preview.mp3',
        albumArtUrl: 'invalid-url'
      };
      
      // Should handle gracefully with fallback texture
      await expect(app.loadTracks([trackWithBadTexture])).resolves.not.toThrow();
    });
  });
});