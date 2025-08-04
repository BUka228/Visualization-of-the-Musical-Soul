/**
 * Basic Integration Test
 * Task 10.2: Simple test to verify integration testing setup works
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
    Mesh: class extends actual.Mesh { constructor(geometry?: any, material?: any) { super(geometry, material); } },
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

HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
  if (contextType === 'webgl' || contextType === 'experimental-webgl') {
    return mockWebGLContext;
  }
  return null;
});

describe('Basic Integration Tests', () => {
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

  describe('Application Initialization', () => {
    it('should initialize the application successfully', async () => {
      await expect(app.initialize(mockContainer)).resolves.not.toThrow();
      
      const state = app.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.isLoading).toBe(false);
      
      console.log('✅ Application initialized successfully');
    });

    it('should create canvas element', async () => {
      await app.initialize(mockContainer);
      
      const canvas = mockContainer.querySelector('canvas');
      expect(canvas).toBeTruthy();
      
      console.log('✅ Canvas element created');
    });
  });

  describe('Track Loading', () => {
    it('should load tracks successfully', async () => {
      await app.initialize(mockContainer);
      
      const testTracks: ProcessedTrack[] = [
        {
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
        }
      ];
      
      await expect(app.loadTracks(testTracks)).resolves.not.toThrow();
      
      const state = app.getState();
      expect(state.tracks).toHaveLength(1);
      expect(state.tracks[0].id).toBe('test-1');
      
      console.log('✅ Tracks loaded successfully');
    });

    it('should handle multiple tracks', async () => {
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
        position: new THREE.Vector3(i, 0, 0),
        size: 1.0,
        color: '#FFFFFF',
        previewUrl: `https://example.com/preview${i}.mp3`,
        albumArtUrl: `https://example.com/art${i}.jpg`
      }));
      
      await app.loadTracks(testTracks);
      
      const state = app.getState();
      expect(state.tracks).toHaveLength(5);
      
      // Check genre stats are calculated
      expect(Object.keys(state.genreStats)).toContain('rock');
      expect(Object.keys(state.genreStats)).toContain('metal');
      
      console.log('✅ Multiple tracks handled successfully');
    });
  });

  describe('User Interactions', () => {
    it('should handle basic user interactions', async () => {
      await app.initialize(mockContainer);
      
      const testTracks: ProcessedTrack[] = [{
        id: 'interaction-test',
        title: 'Interaction Test Track',
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
      
      await app.loadTracks(testTracks);
      
      // Test basic interactions
      expect(() => app.resetView()).not.toThrow();
      expect(() => app.toggleAnimation()).not.toThrow();
      expect(() => app.selectTrack('interaction-test')).not.toThrow();
      
      console.log('✅ Basic user interactions work');
    });

    it('should handle mouse events', async () => {
      await app.initialize(mockContainer);
      
      // Test mouse interactions
      expect(() => {
        const moveEvent = new MouseEvent('mousemove', {
          clientX: 100,
          clientY: 100
        });
        mockContainer.dispatchEvent(moveEvent);
      }).not.toThrow();
      
      expect(() => {
        const clickEvent = new MouseEvent('click', {
          clientX: 150,
          clientY: 150
        });
        mockContainer.dispatchEvent(clickEvent);
      }).not.toThrow();
      
      console.log('✅ Mouse events handled successfully');
    });
  });

  describe('Error Handling', () => {
    it('should handle WebGL initialization failure', async () => {
      // Mock WebGL failure
      HTMLCanvasElement.prototype.getContext = vi.fn(() => null);
      
      await expect(app.initialize(mockContainer)).rejects.toThrow();
      
      const state = app.getState();
      expect(state.isInitialized).toBe(false);
      
      console.log('✅ WebGL initialization failure handled');
    });

    it('should handle invalid track data gracefully', async () => {
      // Restore WebGL for initialization
      HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
        if (contextType === 'webgl' || contextType === 'experimental-webgl') {
          return mockWebGLContext;
        }
        return null;
      });
      
      await app.initialize(mockContainer);
      
      // Test with empty tracks array
      await expect(app.loadTracks([])).resolves.not.toThrow();
      
      const state = app.getState();
      expect(state.tracks).toHaveLength(0);
      
      console.log('✅ Invalid track data handled gracefully');
    });
  });

  describe('Performance', () => {
    it('should initialize within reasonable time', async () => {
      const startTime = performance.now();
      
      await app.initialize(mockContainer);
      
      const initTime = performance.now() - startTime;
      
      // Should initialize within 2 seconds
      expect(initTime).toBeLessThan(2000);
      
      console.log(`✅ Initialization time: ${initTime.toFixed(2)}ms`);
    });

    it('should load tracks within reasonable time', async () => {
      await app.initialize(mockContainer);
      
      const testTracks: ProcessedTrack[] = Array.from({ length: 50 }, (_, i) => ({
        id: `perf-test-${i}`,
        title: `Performance Track ${i + 1}`,
        artist: `Artist ${i % 10}`,
        album: `Album ${i % 5}`,
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
        position: new THREE.Vector3(i, 0, 0),
        size: 1.0,
        color: '#FFFFFF',
        previewUrl: `https://example.com/perf${i}.mp3`,
        albumArtUrl: `https://example.com/perf-art${i}.jpg`
      }));
      
      const startTime = performance.now();
      await app.loadTracks(testTracks);
      const loadTime = performance.now() - startTime;
      
      // Should load within 1 second
      expect(loadTime).toBeLessThan(1000);
      
      console.log(`✅ Track loading time: ${loadTime.toFixed(2)}ms for ${testTracks.length} tracks`);
    });
  });
});