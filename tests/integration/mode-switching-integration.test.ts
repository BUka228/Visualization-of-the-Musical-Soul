/**
 * Mode Switching Integration Tests
 * Task 10.2: Протестировать переключение между классическим и Soul Galaxy режимами
 * 
 * Note: Classic mode has been removed, so these tests verify that the system
 * works properly with Soul Galaxy as the only visualization mode.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MusicGalaxyApplication } from '../../src/index';
import { ProcessedTrack } from '../../src/types';
import * as THREE from 'three';

// Mock Three.js properly
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal() as typeof THREE;
  return {
    ...actual,
    Scene: class extends actual.Scene { constructor() { super(); } },
    PerspectiveCamera: class extends actual.PerspectiveCamera { constructor(fov?: number, aspect?: number, near?: number, far?: number) { super(fov, aspect, near, far); } },
    WebGLRenderer: class extends actual.WebGLRenderer { constructor(parameters?: any) { super(parameters); this.domElement = document.createElement('canvas'); } },
    AmbientLight: class extends actual.AmbientLight { constructor(color?: any, intensity?: number) { super(color, intensity); } },
    DirectionalLight: class extends actual.DirectionalLight { constructor(color?: any, intensity?: number) { super(color, intensity); } },
    IcosahedronGeometry: class extends actual.IcosahedronGeometry { constructor(radius?: number, detail?: number) { super(radius, detail); } },
    MeshStandardMaterial: class extends actual.MeshStandardMaterial { constructor(parameters?: any) { super(parameters); } },
    Mesh: class extends actual.Mesh { constructor(geometry?: any, material?: any) { super(geometry, material); } }
  };
});

// Mock DOM elements
const mockContainer = document.createElement('div');
mockContainer.id = 'canvas-container';
mockContainer.style.width = '1000px';
mockContainer.style.height = '700px';
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

HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
  if (contextType === 'webgl' || contextType === 'experimental-webgl') {
    return mockWebGLContext;
  }
  return null;
});

describe('Mode Switching Integration Tests', () => {
  let app: MusicGalaxyApplication;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    document.body.appendChild(mockContainer);
    
    app = new MusicGalaxyApplication();
  });

  afterEach(() => {
    if (app) {
      app.dispose();
    }
  });

  describe('Soul Galaxy as Single Mode', () => {
    it('should initialize directly in Soul Galaxy mode', async () => {
      await app.initialize(mockContainer);
      
      const state = app.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.isLoading).toBe(false);
      
      // Verify canvas is created
      const canvas = mockContainer.querySelector('canvas');
      expect(canvas).toBeTruthy();
      
      console.log('✅ Soul Galaxy mode initialized successfully');
    });

    it('should handle track loading in Soul Galaxy mode', async () => {
      await app.initialize(mockContainer);
      
      const testTracks: ProcessedTrack[] = [
        {
          id: 'test-1',
          title: 'Test Track 1',
          artist: 'Test Artist 1',
          album: 'Test Album 1',
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
          previewUrl: 'https://example.com/preview1.mp3',
          albumArtUrl: 'https://example.com/art1.jpg'
        },
        {
          id: 'test-2',
          title: 'Test Track 2',
          artist: 'Test Artist 2',
          album: 'Test Album 2',
          genre: 'metal',
          duration: 240,
          energy: 0.9,
          valence: 0.4,
          danceability: 0.6,
          acousticness: 0.2,
          instrumentalness: 0.3,
          liveness: 0.3,
          speechiness: 0.05,
          tempo: 140,
          position: new THREE.Vector3(5, 0, 0),
          size: 1.2,
          color: '#FF0000',
          previewUrl: 'https://example.com/preview2.mp3',
          albumArtUrl: 'https://example.com/art2.jpg'
        }
      ];
      
      await app.loadTracks(testTracks);
      
      const state = app.getState();
      expect(state.tracks).toHaveLength(2);
      expect(state.genreStats.rock?.count).toBe(1);
      expect(state.genreStats.metal?.count).toBe(1);
      
      console.log('✅ Tracks loaded successfully in Soul Galaxy mode');
    });

    it('should handle all user interactions in Soul Galaxy mode', async () => {
      await app.initialize(mockContainer);
      
      const testTracks: ProcessedTrack[] = Array.from({ length: 5 }, (_, i) => ({
        id: `test-${i}`,
        title: `Test Track ${i + 1}`,
        artist: `Test Artist ${i + 1}`,
        album: `Test Album ${i + 1}`,
        genre: ['rock', 'metal', 'pop', 'electronic', 'jazz'][i],
        duration: 180,
        energy: Math.random(),
        valence: Math.random(),
        danceability: Math.random(),
        acousticness: Math.random(),
        instrumentalness: Math.random(),
        liveness: Math.random(),
        speechiness: Math.random(),
        tempo: 120,
        position: new THREE.Vector3(i * 2, 0, 0),
        size: 1.0,
        color: '#FFFFFF',
        previewUrl: `https://example.com/preview${i}.mp3`,
        albumArtUrl: `https://example.com/art${i}.jpg`
      }));
      
      await app.loadTracks(testTracks);
      
      // Test camera controls
      expect(() => app.resetView()).not.toThrow();
      expect(() => app.toggleAnimation()).not.toThrow();
      
      // Test track selection
      expect(() => app.selectTrack('test-0')).not.toThrow();
      expect(() => app.selectTrack('test-2')).not.toThrow();
      
      // Test mouse interactions
      expect(() => {
        const moveEvent = new MouseEvent('mousemove', {
          clientX: 200,
          clientY: 150
        });
        mockContainer.dispatchEvent(moveEvent);
      }).not.toThrow();
      
      expect(() => {
        const clickEvent = new MouseEvent('click', {
          clientX: 250,
          clientY: 200
        });
        mockContainer.dispatchEvent(clickEvent);
      }).not.toThrow();
      
      console.log('✅ All user interactions work in Soul Galaxy mode');
    });
  });

  describe('Legacy Mode Compatibility', () => {
    it('should not have any references to classic mode', async () => {
      await app.initialize(mockContainer);
      
      // Check that there are no UI elements for mode switching
      const modeToggle = document.querySelector('[data-mode-toggle]');
      expect(modeToggle).toBeNull();
      
      const classicModeButton = document.querySelector('[data-classic-mode]');
      expect(classicModeButton).toBeNull();
      
      const soulGalaxyModeButton = document.querySelector('[data-soul-galaxy-mode]');
      expect(soulGalaxyModeButton).toBeNull();
      
      console.log('✅ No legacy mode switching UI elements found');
    });

    it('should handle configuration without mode settings', async () => {
      // Test that the app works without any mode-related configuration
      const customConfig = {
        scene: {
          galaxyRadius: 60,
          objectMinSize: 0.3,
          objectMaxSize: 2.5,
          animationSpeed: 0.002,
          cameraDistance: 80,
          genreColors: {
            'rock': '#FF4500',
            'metal': '#FF0000',
            'default': '#FFFFFF'
          }
        }
      };
      
      const customApp = new MusicGalaxyApplication(customConfig);
      
      await expect(customApp.initialize(mockContainer)).resolves.not.toThrow();
      
      const state = customApp.getState();
      expect(state.isInitialized).toBe(true);
      
      customApp.dispose();
      
      console.log('✅ App works with custom configuration without mode settings');
    });

    it('should maintain state consistency without mode switching', async () => {
      await app.initialize(mockContainer);
      
      const testTracks: ProcessedTrack[] = Array.from({ length: 3 }, (_, i) => ({
        id: `consistency-test-${i}`,
        title: `Consistency Track ${i + 1}`,
        artist: `Artist ${i + 1}`,
        album: `Album ${i + 1}`,
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
        position: new THREE.Vector3(i, 0, 0),
        size: 1.0,
        color: '#0080FF',
        previewUrl: `https://example.com/consistency${i}.mp3`,
        albumArtUrl: `https://example.com/consistency-art${i}.jpg`
      }));
      
      await app.loadTracks(testTracks);
      
      // Perform various operations and check state consistency
      const initialState = app.getState();
      expect(initialState.tracks).toHaveLength(3);
      expect(initialState.isInitialized).toBe(true);
      
      // Reset view
      app.resetView();
      const afterResetState = app.getState();
      expect(afterResetState.tracks).toHaveLength(3);
      expect(afterResetState.isInitialized).toBe(true);
      
      // Toggle animation
      app.toggleAnimation();
      const afterToggleState = app.getState();
      expect(afterToggleState.tracks).toHaveLength(3);
      expect(afterToggleState.isInitialized).toBe(true);
      
      // Select track
      app.selectTrack('consistency-test-1');
      const afterSelectState = app.getState();
      expect(afterSelectState.tracks).toHaveLength(3);
      expect(afterSelectState.isInitialized).toBe(true);
      
      console.log('✅ State remains consistent across all operations');
    });
  });

  describe('Performance Without Mode Switching', () => {
    it('should have optimal performance without mode switching overhead', async () => {
      const startTime = performance.now();
      
      await app.initialize(mockContainer);
      
      const initTime = performance.now() - startTime;
      
      // Should initialize faster without mode switching logic
      expect(initTime).toBeLessThan(2000);
      
      const testTracks: ProcessedTrack[] = Array.from({ length: 100 }, (_, i) => ({
        id: `perf-test-${i}`,
        title: `Performance Track ${i + 1}`,
        artist: `Artist ${i % 20}`,
        album: `Album ${i % 10}`,
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
        size: 0.5 + Math.random() * 2,
        color: '#FFFFFF',
        previewUrl: `https://example.com/perf${i}.mp3`,
        albumArtUrl: `https://example.com/perf-art${i}.jpg`
      }));
      
      const loadStartTime = performance.now();
      await app.loadTracks(testTracks);
      const loadTime = performance.now() - loadStartTime;
      
      // Should load tracks efficiently
      expect(loadTime).toBeLessThan(3000);
      
      console.log(`✅ Performance test: Init ${initTime.toFixed(2)}ms, Load ${loadTime.toFixed(2)}ms`);
    });

    it('should handle rapid operations without mode switching delays', async () => {
      await app.initialize(mockContainer);
      
      const testTracks: ProcessedTrack[] = Array.from({ length: 20 }, (_, i) => ({
        id: `rapid-test-${i}`,
        title: `Rapid Track ${i + 1}`,
        artist: `Artist ${i}`,
        album: `Album ${i}`,
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
        position: new THREE.Vector3(i, 0, 0),
        size: 1.0,
        color: '#0080FF',
        previewUrl: `https://example.com/rapid${i}.mp3`,
        albumArtUrl: `https://example.com/rapid-art${i}.jpg`
      }));
      
      await app.loadTracks(testTracks);
      
      // Perform rapid operations
      const operations = 50;
      const startTime = performance.now();
      
      for (let i = 0; i < operations; i++) {
        switch (i % 4) {
          case 0:
            app.resetView();
            break;
          case 1:
            app.toggleAnimation();
            break;
          case 2:
            app.selectTrack(`rapid-test-${i % 20}`);
            break;
          case 3:
            // Simulate mouse movement
            const event = new MouseEvent('mousemove', {
              clientX: 100 + (i % 200),
              clientY: 100 + (i % 150)
            });
            mockContainer.dispatchEvent(event);
            break;
        }
      }
      
      const operationsTime = performance.now() - startTime;
      const avgOperationTime = operationsTime / operations;
      
      // Each operation should be fast
      expect(avgOperationTime).toBeLessThan(5);
      
      console.log(`✅ Rapid operations: ${operations} ops in ${operationsTime.toFixed(2)}ms (avg: ${avgOperationTime.toFixed(2)}ms/op)`);
    });
  });

  describe('Error Handling Without Mode Switching', () => {
    it('should handle initialization errors gracefully', async () => {
      // Mock WebGL failure
      HTMLCanvasElement.prototype.getContext = vi.fn(() => null);
      
      await expect(app.initialize(mockContainer)).rejects.toThrow();
      
      const state = app.getState();
      expect(state.isInitialized).toBe(false);
      expect(state.isLoading).toBe(false);
      
      console.log('✅ Initialization errors handled gracefully');
    });

    it('should handle track loading errors without mode confusion', async () => {
      // Restore WebGL for initialization
      HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
        if (contextType === 'webgl' || contextType === 'experimental-webgl') {
          return mockWebGLContext;
        }
        return null;
      });
      
      await app.initialize(mockContainer);
      
      // Test with invalid track data
      const invalidTracks = [
        {
          id: '', // Invalid empty ID
          title: 'Invalid Track',
          artist: 'Test Artist',
          album: 'Test Album',
          genre: 'rock',
          duration: -1, // Invalid duration
          energy: 2.0, // Invalid energy (should be 0-1)
          valence: 0.6,
          danceability: 0.7,
          acousticness: 0.3,
          instrumentalness: 0.1,
          liveness: 0.2,
          speechiness: 0.1,
          tempo: -50, // Invalid tempo
          position: new THREE.Vector3(0, 0, 0),
          size: 1.0,
          color: '#0080FF',
          previewUrl: 'invalid-url',
          albumArtUrl: 'invalid-art-url'
        }
      ] as ProcessedTrack[];
      
      // Should handle invalid data gracefully
      await expect(app.loadTracks(invalidTracks)).resolves.not.toThrow();
      
      console.log('✅ Track loading errors handled without mode confusion');
    });

    it('should maintain stability during errors', async () => {
      await app.initialize(mockContainer);
      
      const validTracks: ProcessedTrack[] = [{
        id: 'valid-track',
        title: 'Valid Track',
        artist: 'Valid Artist',
        album: 'Valid Album',
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
        previewUrl: 'https://example.com/valid.mp3',
        albumArtUrl: 'https://example.com/valid-art.jpg'
      }];
      
      await app.loadTracks(validTracks);
      
      // Verify system is stable
      const state = app.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.tracks).toHaveLength(1);
      
      // Try operations that might cause errors
      expect(() => app.selectTrack('non-existent-track')).not.toThrow();
      expect(() => app.resetView()).not.toThrow();
      expect(() => app.toggleAnimation()).not.toThrow();
      
      // System should still be stable
      const finalState = app.getState();
      expect(finalState.isInitialized).toBe(true);
      expect(finalState.tracks).toHaveLength(1);
      
      console.log('✅ System maintains stability during error conditions');
    });
  });
});