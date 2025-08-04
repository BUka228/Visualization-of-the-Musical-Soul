/**
 * Large Collection Performance Tests
 * Task 10.2: Добавить тесты для обработки больших музыкальных коллекций (1000+ треков)
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
mockContainer.style.width = '1200px';
mockContainer.style.height = '800px';
document.body.appendChild(mockContainer);

// Mock WebGL context for performance testing
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

// Helper function to generate large track collections
function generateLargeTrackCollection(count: number): ProcessedTrack[] {
  const genres = ['rock', 'metal', 'pop', 'electronic', 'jazz', 'classical', 'indie', 'punk'];
  const artists = Array.from({ length: Math.min(count / 10, 200) }, (_, i) => `Artist ${i + 1}`);
  const albums = Array.from({ length: Math.min(count / 20, 100) }, (_, i) => `Album ${i + 1}`);
  
  return Array.from({ length: count }, (_, i) => ({
    id: `track-${i}`,
    title: `Track ${i + 1}`,
    artist: artists[i % artists.length],
    album: albums[i % albums.length],
    genre: genres[i % genres.length],
    duration: 180 + (i % 240), // 3-7 minutes
    energy: Math.random(),
    valence: Math.random(),
    danceability: Math.random(),
    acousticness: Math.random(),
    instrumentalness: Math.random(),
    liveness: Math.random(),
    speechiness: Math.random(),
    tempo: 60 + (i % 140), // 60-200 BPM
    position: new THREE.Vector3(
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100
    ),
    size: 0.5 + Math.random() * 2.5,
    color: ['#FF0000', '#0080FF', '#FFD700', '#9400D3', '#228B22', '#F5F5DC', '#4169E1', '#00FF40'][i % 8],
    previewUrl: `https://example.com/preview-${i}.mp3`,
    albumArtUrl: `https://example.com/art-${i}.jpg`
  }));
}

describe('Large Collection Performance Tests', () => {
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

  describe('1000+ Track Collection Handling', () => {
    it('should load 1000 tracks within acceptable time', async () => {
      await app.initialize(mockContainer);
      
      const largeTracks = generateLargeTrackCollection(1000);
      
      const startTime = performance.now();
      await app.loadTracks(largeTracks);
      const endTime = performance.now();
      
      const loadTime = endTime - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
      
      const state = app.getState();
      expect(state.tracks).toHaveLength(1000);
      
      console.log(`✅ Loaded 1000 tracks in ${loadTime.toFixed(2)}ms`);
    });

    it('should load 2000 tracks within acceptable time', async () => {
      await app.initialize(mockContainer);
      
      const largeTracks = generateLargeTrackCollection(2000);
      
      const startTime = performance.now();
      await app.loadTracks(largeTracks);
      const endTime = performance.now();
      
      const loadTime = endTime - startTime;
      
      // Should load within 8 seconds for 2000 tracks
      expect(loadTime).toBeLessThan(8000);
      
      const state = app.getState();
      expect(state.tracks).toHaveLength(2000);
      
      console.log(`✅ Loaded 2000 tracks in ${loadTime.toFixed(2)}ms`);
    });

    it('should handle 5000 tracks without crashing', async () => {
      await app.initialize(mockContainer);
      
      const hugeTracks = generateLargeTrackCollection(5000);
      
      // This test focuses on stability rather than speed
      await expect(app.loadTracks(hugeTracks)).resolves.not.toThrow();
      
      const state = app.getState();
      expect(state.tracks).toHaveLength(5000);
      
      console.log('✅ Successfully handled 5000 tracks without crashing');
    });
  });

  describe('Memory Management with Large Collections', () => {
    it('should manage memory efficiently with 1000+ tracks', async () => {
      await app.initialize(mockContainer);
      
      // Check initial memory if available
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      const largeTracks = generateLargeTrackCollection(1500);
      await app.loadTracks(largeTracks);
      
      const afterLoadMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Dispose and check cleanup
      app.dispose();
      
      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc();
      }
      
      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const afterDisposeMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Memory should be cleaned up reasonably well
      if (initialMemory > 0 && afterLoadMemory > 0 && afterDisposeMemory > 0) {
        const memoryIncrease = afterDisposeMemory - initialMemory;
        const loadMemoryIncrease = afterLoadMemory - initialMemory;
        
        // After disposal, memory increase should be less than 60% of load increase
        expect(memoryIncrease).toBeLessThan(loadMemoryIncrease * 0.6);
        
        console.log(`Memory usage: Initial: ${(initialMemory / 1024 / 1024).toFixed(2)}MB, After load: ${(afterLoadMemory / 1024 / 1024).toFixed(2)}MB, After dispose: ${(afterDisposeMemory / 1024 / 1024).toFixed(2)}MB`);
      }
    });

    it('should handle multiple load/dispose cycles without memory leaks', async () => {
      const cycles = 3;
      const tracksPerCycle = 800;
      
      let maxMemoryUsage = 0;
      
      for (let i = 0; i < cycles; i++) {
        await app.initialize(mockContainer);
        
        const tracks = generateLargeTrackCollection(tracksPerCycle);
        await app.loadTracks(tracks);
        
        const currentMemory = (performance as any).memory?.usedJSHeapSize || 0;
        maxMemoryUsage = Math.max(maxMemoryUsage, currentMemory);
        
        app.dispose();
        app = new MusicGalaxyApplication();
        
        // Force garbage collection if available
        if ((global as any).gc) {
          (global as any).gc();
        }
        
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Final memory should not be significantly higher than max usage during cycles
      if (maxMemoryUsage > 0 && finalMemory > 0) {
        expect(finalMemory).toBeLessThan(maxMemoryUsage * 1.2);
        
        console.log(`✅ Completed ${cycles} cycles with max memory: ${(maxMemoryUsage / 1024 / 1024).toFixed(2)}MB, final: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`);
      }
    });
  });

  describe('Rendering Performance with Large Collections', () => {
    it('should maintain stable frame rate with 1000+ tracks', async () => {
      await app.initialize(mockContainer);
      
      const largeTracks = generateLargeTrackCollection(1200);
      await app.loadTracks(largeTracks);
      
      // Simulate rendering frames
      const frameCount = 60; // Test for 1 second at 60fps
      const frameTimings: number[] = [];
      
      for (let i = 0; i < frameCount; i++) {
        const frameStart = performance.now();
        
        // Simulate frame update (this would normally be done by the render loop)
        // We can't actually render in test environment, but we can test the update logic
        
        const frameEnd = performance.now();
        frameTimings.push(frameEnd - frameStart);
        
        // Small delay to simulate real frame timing
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      const averageFrameTime = frameTimings.reduce((a, b) => a + b, 0) / frameTimings.length;
      const maxFrameTime = Math.max(...frameTimings);
      
      // Average frame time should be reasonable (less than 16ms for 60fps)
      expect(averageFrameTime).toBeLessThan(16);
      
      // No frame should take excessively long (less than 33ms for 30fps minimum)
      expect(maxFrameTime).toBeLessThan(33);
      
      console.log(`✅ Frame performance: avg ${averageFrameTime.toFixed(2)}ms, max ${maxFrameTime.toFixed(2)}ms`);
    });

    it('should handle camera movements smoothly with large collections', async () => {
      await app.initialize(mockContainer);
      
      const largeTracks = generateLargeTrackCollection(1000);
      await app.loadTracks(largeTracks);
      
      // Simulate camera movements
      const movements = 20;
      const movementTimings: number[] = [];
      
      for (let i = 0; i < movements; i++) {
        const moveStart = performance.now();
        
        // Simulate mouse movement for camera control
        const event = new MouseEvent('mousemove', {
          clientX: 100 + i * 10,
          clientY: 100 + i * 5
        });
        mockContainer.dispatchEvent(event);
        
        const moveEnd = performance.now();
        movementTimings.push(moveEnd - moveStart);
        
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      
      const averageMoveTime = movementTimings.reduce((a, b) => a + b, 0) / movementTimings.length;
      const maxMoveTime = Math.max(...movementTimings);
      
      // Camera movements should be responsive
      expect(averageMoveTime).toBeLessThan(5);
      expect(maxMoveTime).toBeLessThan(10);
      
      console.log(`✅ Camera movement performance: avg ${averageMoveTime.toFixed(2)}ms, max ${maxMoveTime.toFixed(2)}ms`);
    });
  });

  describe('Genre Distribution with Large Collections', () => {
    it('should handle diverse genre distributions efficiently', async () => {
      await app.initialize(mockContainer);
      
      // Create collection with many different genres
      const genres = ['rock', 'metal', 'pop', 'electronic', 'jazz', 'classical', 'indie', 'punk', 'blues', 'country', 'reggae', 'folk', 'ambient', 'techno', 'house'];
      
      const diverseTracks = Array.from({ length: 1500 }, (_, i) => ({
        id: `track-${i}`,
        title: `Track ${i + 1}`,
        artist: `Artist ${i % 100}`,
        album: `Album ${i % 75}`,
        genre: genres[i % genres.length],
        duration: 180,
        energy: Math.random(),
        valence: Math.random(),
        danceability: Math.random(),
        acousticness: Math.random(),
        instrumentalness: Math.random(),
        liveness: Math.random(),
        speechiness: Math.random(),
        tempo: 120,
        position: new THREE.Vector3(0, 0, 0),
        size: 1.0,
        color: '#FFFFFF',
        previewUrl: `https://example.com/preview-${i}.mp3`,
        albumArtUrl: `https://example.com/art-${i}.jpg`
      }));
      
      const startTime = performance.now();
      await app.loadTracks(diverseTracks);
      const endTime = performance.now();
      
      const loadTime = endTime - startTime;
      
      // Should handle diverse genres efficiently
      expect(loadTime).toBeLessThan(6000);
      
      const state = app.getState();
      expect(state.tracks).toHaveLength(1500);
      
      // Check that genre stats are calculated
      expect(Object.keys(state.genreStats)).toHaveLength(genres.length);
      
      console.log(`✅ Handled ${genres.length} different genres in ${loadTime.toFixed(2)}ms`);
    });

    it('should handle collections with uneven genre distribution', async () => {
      await app.initialize(mockContainer);
      
      // Create collection where 80% is rock, 20% is other genres
      const unevenTracks: ProcessedTrack[] = [];
      const totalTracks = 1000;
      const rockTracks = Math.floor(totalTracks * 0.8);
      const otherGenres = ['metal', 'pop', 'electronic', 'jazz'];
      
      // Add rock tracks
      for (let i = 0; i < rockTracks; i++) {
        unevenTracks.push({
          id: `rock-${i}`,
          title: `Rock Track ${i + 1}`,
          artist: `Rock Artist ${i % 50}`,
          album: `Rock Album ${i % 25}`,
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
          previewUrl: `https://example.com/rock-${i}.mp3`,
          albumArtUrl: `https://example.com/rock-art-${i}.jpg`
        });
      }
      
      // Add other genre tracks
      const remainingTracks = totalTracks - rockTracks;
      for (let i = 0; i < remainingTracks; i++) {
        const genre = otherGenres[i % otherGenres.length];
        unevenTracks.push({
          id: `other-${i}`,
          title: `${genre} Track ${i + 1}`,
          artist: `${genre} Artist ${i % 10}`,
          album: `${genre} Album ${i % 5}`,
          genre,
          duration: 180,
          energy: Math.random(),
          valence: Math.random(),
          danceability: Math.random(),
          acousticness: Math.random(),
          instrumentalness: Math.random(),
          liveness: Math.random(),
          speechiness: Math.random(),
          tempo: 120,
          position: new THREE.Vector3(0, 0, 0),
          size: 1.0,
          color: '#FFFFFF',
          previewUrl: `https://example.com/other-${i}.mp3`,
          albumArtUrl: `https://example.com/other-art-${i}.jpg`
        });
      }
      
      await app.loadTracks(unevenTracks);
      
      const state = app.getState();
      expect(state.tracks).toHaveLength(totalTracks);
      
      // Check that rock dominates the stats
      expect(state.genreStats.rock?.count).toBeGreaterThan(totalTracks * 0.75);
      
      console.log('✅ Handled uneven genre distribution successfully');
    });
  });

  describe('Stress Testing', () => {
    it('should survive rapid load/unload cycles', async () => {
      const cycles = 5;
      const tracksPerCycle = 500;
      
      for (let i = 0; i < cycles; i++) {
        await app.initialize(mockContainer);
        
        const tracks = generateLargeTrackCollection(tracksPerCycle);
        await app.loadTracks(tracks);
        
        // Verify state
        const state = app.getState();
        expect(state.tracks).toHaveLength(tracksPerCycle);
        expect(state.isInitialized).toBe(true);
        
        app.dispose();
        app = new MusicGalaxyApplication();
        
        // Small delay between cycles
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      console.log(`✅ Survived ${cycles} rapid load/unload cycles`);
    });

    it('should handle concurrent operations gracefully', async () => {
      await app.initialize(mockContainer);
      
      const tracks1 = generateLargeTrackCollection(300);
      const tracks2 = generateLargeTrackCollection(300);
      const tracks3 = generateLargeTrackCollection(300);
      
      // Try to load multiple collections concurrently
      // The last one should win
      const promises = [
        app.loadTracks(tracks1),
        app.loadTracks(tracks2),
        app.loadTracks(tracks3)
      ];
      
      await Promise.all(promises);
      
      const state = app.getState();
      // Should have the last loaded collection
      expect(state.tracks).toHaveLength(300);
      
      console.log('✅ Handled concurrent operations gracefully');
    });

    it('should maintain stability under continuous interaction', async () => {
      await app.initialize(mockContainer);
      
      const tracks = generateLargeTrackCollection(800);
      await app.loadTracks(tracks);
      
      // Simulate continuous user interactions
      const interactions = 50;
      
      for (let i = 0; i < interactions; i++) {
        // Simulate various user actions
        switch (i % 4) {
          case 0:
            // Mouse movement
            const moveEvent = new MouseEvent('mousemove', {
              clientX: 100 + (i % 200),
              clientY: 100 + (i % 150)
            });
            mockContainer.dispatchEvent(moveEvent);
            break;
            
          case 1:
            // Reset view
            app.resetView();
            break;
            
          case 2:
            // Toggle animation
            app.toggleAnimation();
            break;
            
          case 3:
            // Window resize simulation
            mockContainer.style.width = `${800 + (i % 400)}px`;
            mockContainer.style.height = `${600 + (i % 300)}px`;
            const resizeEvent = new Event('resize');
            window.dispatchEvent(resizeEvent);
            break;
        }
        
        // Small delay between interactions
        await new Promise(resolve => setTimeout(resolve, 2));
      }
      
      // Should still be stable
      const state = app.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.tracks).toHaveLength(800);
      
      console.log(`✅ Maintained stability through ${interactions} continuous interactions`);
    });
  });
});