import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CrystalTrackSystem } from '@soul-galaxy/core/CrystalTrackSystem';
import { CrystalPulseSystem } from '@soul-galaxy/effects/CrystalPulseSystem';
import { CinematicCameraController } from '@soul-galaxy/camera/CinematicCameraController';
import { ProcessedTrack } from '@/types';
import { CrystalTrack } from '@soul-galaxy/types';
import * as THREE from 'three';

// Mock dependencies for performance tests
vi.mock('@soul-galaxy/core/CrystalGeometryGenerator');
vi.mock('@soul-galaxy/effects/CrystalPulseSystem');
vi.mock('@soul-galaxy/materials/CrystalShaderMaterial');
vi.mock('@soul-galaxy/materials/AlbumTextureManager');
vi.mock('@soul-galaxy/materials/TextureClaritySystem');
vi.mock('@soul-galaxy/interaction/CrystalHoverSystem');
vi.mock('@soul-galaxy/audio/SoulGalaxyAudioIntegration');
vi.mock('@soul-galaxy/effects/CrystalRotationSystem');
vi.mock('three/examples/jsm/controls/OrbitControls.js');
vi.mock('@soul-galaxy/camera/FocusAnimationSystem');
vi.mock('@soul-galaxy/camera/DepthOfFieldSystem');

describe('Performance Tests', () => {
  let mockScene: THREE.Scene;
  let mockCamera: THREE.PerspectiveCamera;
  let mockRenderer: THREE.WebGLRenderer;

  beforeEach(() => {
    mockScene = new THREE.Scene();
    mockCamera = new THREE.PerspectiveCamera();
    mockRenderer = new THREE.WebGLRenderer();
    
    // Mock renderer domElement
    const mockCanvas = document.createElement('canvas');
    Object.defineProperty(mockRenderer, 'domElement', {
      value: mockCanvas,
      writable: false
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Helper function to generate test tracks
   */
  function generateTestTracks(count: number): ProcessedTrack[] {
    const genres = ['rock', 'metal', 'punk', 'jazz', 'electronic', 'pop', 'indie', 'classical'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: `track${i}`,
      name: `Test Song ${i}`,
      artist: `Test Artist ${i % 100}`, // Simulate some artists having multiple songs
      album: `Test Album ${i % 50}`,    // Simulate some albums having multiple songs
      genre: genres[i % genres.length],
      duration: 120 + (i % 300), // 2-7 minutes
      popularity: Math.floor(Math.random() * 100),
      color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
      imageUrl: `https://example.com/image${i}.jpg`,
      previewUrl: `https://example.com/preview${i}.mp3`
    }));
  }

  /**
   * Helper function to generate test crystal tracks
   */
  function generateTestCrystalTracks(count: number): CrystalTrack[] {
    const baseTracks = generateTestTracks(count);
    
    return baseTracks.map((track, i) => ({
      ...track,
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 100
      ),
      crystalGeometry: new THREE.BufferGeometry(),
      facetCount: 6 + (i % 12),
      roughnessLevel: 0.3 + Math.random() * 0.4,
      pulseSpeed: 0.5 + Math.random() * 2.0,
      pulseAmplitude: 0.05 + Math.random() * 0.15,
      pulsePhase: Math.random() * Math.PI * 2,
      genreColor: new THREE.Color(track.color),
      emissiveIntensity: 0.2 + Math.random() * 0.3,
      isFocused: false,
      isHovered: false,
      distanceFromCenter: 10 + Math.random() * 40
    }));
  }

  describe('CrystalTrackSystem Performance', () => {
    let crystalTrackSystem: CrystalTrackSystem;

    beforeEach(() => {
      crystalTrackSystem = new CrystalTrackSystem();
      crystalTrackSystem.initialize(mockScene, mockCamera);
    });

    afterEach(() => {
      crystalTrackSystem.dispose();
    });

    it('should handle 100 tracks efficiently', async () => {
      const tracks = generateTestTracks(100);
      
      const startTime = performance.now();
      await crystalTrackSystem.createCrystalCluster(tracks);
      const endTime = performance.now();
      
      const creationTime = endTime - startTime;
      
      // Should create 100 crystals in less than 500ms
      expect(creationTime).toBeLessThan(500);
      expect(crystalTrackSystem.getCrystalTracks()).toHaveLength(100);
      
      console.log(`✅ Created 100 crystals in ${creationTime.toFixed(2)}ms`);
    });

    it('should handle 500 tracks efficiently', async () => {
      const tracks = generateTestTracks(500);
      
      const startTime = performance.now();
      await crystalTrackSystem.createCrystalCluster(tracks);
      const endTime = performance.now();
      
      const creationTime = endTime - startTime;
      
      // Should create 500 crystals in less than 2 seconds
      expect(creationTime).toBeLessThan(2000);
      expect(crystalTrackSystem.getCrystalTracks()).toHaveLength(500);
      
      console.log(`✅ Created 500 crystals in ${creationTime.toFixed(2)}ms`);
    });

    it('should handle 1000 tracks efficiently', async () => {
      const tracks = generateTestTracks(1000);
      
      const startTime = performance.now();
      await crystalTrackSystem.createCrystalCluster(tracks);
      const endTime = performance.now();
      
      const creationTime = endTime - startTime;
      
      // Should create 1000 crystals in less than 5 seconds
      expect(creationTime).toBeLessThan(5000);
      expect(crystalTrackSystem.getCrystalTracks()).toHaveLength(1000);
      
      console.log(`✅ Created 1000 crystals in ${creationTime.toFixed(2)}ms`);
    });

    it('should maintain consistent update performance with large collections', async () => {
      const tracks = generateTestTracks(1000);
      await crystalTrackSystem.createCrystalCluster(tracks);
      
      const updateTimes: number[] = [];
      const deltaTime = 16; // 16ms frame time
      
      // Perform 100 updates and measure time
      for (let i = 0; i < 100; i++) {
        const startTime = performance.now();
        
        crystalTrackSystem.updatePulsation(deltaTime);
        crystalTrackSystem.rotateCluster(deltaTime);
        
        const endTime = performance.now();
        updateTimes.push(endTime - startTime);
      }
      
      const avgUpdateTime = updateTimes.reduce((sum, time) => sum + time, 0) / updateTimes.length;
      const maxUpdateTime = Math.max(...updateTimes);
      
      // Average update time should be less than 5ms for 1000 crystals
      expect(avgUpdateTime).toBeLessThan(5);
      
      // Maximum update time should be less than 20ms (to maintain 60fps)
      expect(maxUpdateTime).toBeLessThan(20);
      
      console.log(`✅ 1000 crystals: avg update ${avgUpdateTime.toFixed(2)}ms, max ${maxUpdateTime.toFixed(2)}ms`);
    });

    it('should handle memory efficiently with large collections', async () => {
      const tracks = generateTestTracks(1000);
      
      // Measure memory before
      const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;
      
      await crystalTrackSystem.createCrystalCluster(tracks);
      
      // Measure memory after
      const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryUsed = memoryAfter - memoryBefore;
      
      // Should use less than 100MB for 1000 crystals (if memory API is available)
      if (memoryUsed > 0) {
        expect(memoryUsed).toBeLessThan(100 * 1024 * 1024); // 100MB
        console.log(`✅ 1000 crystals used ${(memoryUsed / 1024 / 1024).toFixed(2)}MB`);
      }
      
      // Dispose and check memory cleanup
      crystalTrackSystem.dispose();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    });

    it('should scale linearly with collection size', async () => {
      const sizes = [100, 200, 500];
      const creationTimes: number[] = [];
      
      for (const size of sizes) {
        const tracks = generateTestTracks(size);
        
        const startTime = performance.now();
        await crystalTrackSystem.createCrystalCluster(tracks);
        const endTime = performance.now();
        
        creationTimes.push(endTime - startTime);
        
        // Clean up for next test
        crystalTrackSystem.dispose();
        crystalTrackSystem = new CrystalTrackSystem();
        crystalTrackSystem.initialize(mockScene, mockCamera);
      }
      
      // Check that scaling is roughly linear (within 2x factor)
      const ratio1 = creationTimes[1] / creationTimes[0]; // 200/100
      const ratio2 = creationTimes[2] / creationTimes[1]; // 500/200
      
      expect(ratio1).toBeLessThan(3); // Should not be more than 3x slower
      expect(ratio2).toBeLessThan(3); // Should not be more than 3x slower
      
      console.log(`✅ Scaling ratios: 200/100=${ratio1.toFixed(2)}x, 500/200=${ratio2.toFixed(2)}x`);
    });
  });

  describe('CrystalPulseSystem Performance', () => {
    let pulseSystem: CrystalPulseSystem;

    beforeEach(() => {
      pulseSystem = new CrystalPulseSystem();
    });

    afterEach(() => {
      pulseSystem.dispose();
    });

    it('should initialize large collections quickly', () => {
      const crystalTracks = generateTestCrystalTracks(1000);
      
      const startTime = performance.now();
      pulseSystem.initialize(mockScene, crystalTracks);
      const endTime = performance.now();
      
      const initTime = endTime - startTime;
      
      // Should initialize 1000 crystals in less than 1 second
      expect(initTime).toBeLessThan(1000);
      
      const stats = pulseSystem.getPulseStats();
      expect(stats.totalCrystals).toBe(1000);
      
      console.log(`✅ Initialized 1000 crystal pulse system in ${initTime.toFixed(2)}ms`);
    });

    it('should maintain 60fps update performance with large collections', () => {
      const crystalTracks = generateTestCrystalTracks(1000);
      pulseSystem.initialize(mockScene, crystalTracks);
      
      const updateTimes: number[] = [];
      const deltaTime = 16; // 16ms frame time
      
      // Perform 100 updates
      for (let i = 0; i < 100; i++) {
        const startTime = performance.now();
        pulseSystem.updatePulsation(deltaTime);
        const endTime = performance.now();
        updateTimes.push(endTime - startTime);
      }
      
      const avgUpdateTime = updateTimes.reduce((sum, time) => sum + time, 0) / updateTimes.length;
      const maxUpdateTime = Math.max(...updateTimes);
      
      // Should maintain 60fps (16.67ms budget)
      expect(avgUpdateTime).toBeLessThan(10); // Leave room for other systems
      expect(maxUpdateTime).toBeLessThan(16); // Never exceed frame budget
      
      console.log(`✅ 1000 crystals pulse: avg ${avgUpdateTime.toFixed(2)}ms, max ${maxUpdateTime.toFixed(2)}ms`);
    });

    it('should handle BPM calculations efficiently for large collections', () => {
      const crystalTracks = generateTestCrystalTracks(1000);
      pulseSystem.initialize(mockScene, crystalTracks);
      
      const startTime = performance.now();
      
      // Set BPM for all crystals
      crystalTracks.forEach((crystal, i) => {
        const bpm = 60 + (i % 180); // BPM range 60-240
        pulseSystem.setPulsationFromBPM(crystal, bpm);
      });
      
      const endTime = performance.now();
      const bpmTime = endTime - startTime;
      
      // Should calculate BPM for 1000 crystals in less than 100ms
      expect(bpmTime).toBeLessThan(100);
      
      console.log(`✅ Calculated BPM for 1000 crystals in ${bpmTime.toFixed(2)}ms`);
    });

    it('should efficiently manage sync groups', () => {
      // Create crystals with clustered BPM values to test sync group creation
      const crystalTracks = generateTestCrystalTracks(500);
      
      // Set clustered BPM values
      crystalTracks.forEach((crystal, i) => {
        const bpmCluster = Math.floor(i / 50) * 20 + 100; // Groups of 50 with similar BPM
        pulseSystem.setPulsationFromBPM(crystal, bpmCluster);
      });
      
      const startTime = performance.now();
      pulseSystem.initialize(mockScene, crystalTracks);
      const endTime = performance.now();
      
      const initTime = endTime - startTime;
      
      // Should handle sync group creation efficiently
      expect(initTime).toBeLessThan(500);
      
      const stats = pulseSystem.getPulseStats();
      expect(stats.syncGroups).toBeGreaterThan(0);
      
      console.log(`✅ Created sync groups for 500 crystals in ${initTime.toFixed(2)}ms`);
    });
  });

  describe('CinematicCameraController Performance', () => {
    let cameraController: CinematicCameraController;

    beforeEach(() => {
      cameraController = new CinematicCameraController(mockCamera, mockRenderer, mockScene);
    });

    afterEach(() => {
      cameraController.dispose();
    });

    it('should handle rapid mouse input efficiently', () => {
      const canvas = mockRenderer.domElement as HTMLCanvasElement;
      
      const startTime = performance.now();
      
      // Simulate rapid mouse movements (like a user quickly panning)
      canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: 0, clientY: 0 }));
      
      for (let i = 0; i < 1000; i++) {
        canvas.dispatchEvent(new MouseEvent('mousemove', {
          clientX: Math.sin(i * 0.1) * 100 + 200,
          clientY: Math.cos(i * 0.1) * 100 + 200
        }));
      }
      
      canvas.dispatchEvent(new MouseEvent('mouseup', { clientX: 200, clientY: 200 }));
      
      const endTime = performance.now();
      const inputTime = endTime - startTime;
      
      // Should handle 1000 mouse events in less than 100ms
      expect(inputTime).toBeLessThan(100);
      
      console.log(`✅ Handled 1000 mouse events in ${inputTime.toFixed(2)}ms`);
    });

    it('should maintain consistent update performance', () => {
      const updateTimes: number[] = [];
      const deltaTime = 0.016; // 16ms frame time
      
      // Perform 1000 updates
      for (let i = 0; i < 1000; i++) {
        const startTime = performance.now();
        cameraController.update(deltaTime);
        const endTime = performance.now();
        updateTimes.push(endTime - startTime);
      }
      
      const avgUpdateTime = updateTimes.reduce((sum, time) => sum + time, 0) / updateTimes.length;
      const maxUpdateTime = Math.max(...updateTimes);
      
      // Should maintain very fast updates
      expect(avgUpdateTime).toBeLessThan(2); // 2ms average
      expect(maxUpdateTime).toBeLessThan(10); // 10ms maximum
      
      console.log(`✅ Camera updates: avg ${avgUpdateTime.toFixed(3)}ms, max ${maxUpdateTime.toFixed(3)}ms`);
    });

    it('should handle inertia calculations efficiently', () => {
      // Create some inertia
      const canvas = mockRenderer.domElement as HTMLCanvasElement;
      canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: 100, clientY: 100 }));
      canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }));
      canvas.dispatchEvent(new MouseEvent('mouseup', { clientX: 200, clientY: 200 }));
      
      const updateTimes: number[] = [];
      
      // Update until inertia stops (or max 1000 updates)
      for (let i = 0; i < 1000; i++) {
        const startTime = performance.now();
        cameraController.updateInertia(0.016);
        const endTime = performance.now();
        updateTimes.push(endTime - startTime);
      }
      
      const avgInertiaTime = updateTimes.reduce((sum, time) => sum + time, 0) / updateTimes.length;
      const maxInertiaTime = Math.max(...updateTimes);
      
      // Inertia calculations should be very fast
      expect(avgInertiaTime).toBeLessThan(1); // 1ms average
      expect(maxInertiaTime).toBeLessThan(5); // 5ms maximum
      
      console.log(`✅ Inertia updates: avg ${avgInertiaTime.toFixed(3)}ms, max ${maxInertiaTime.toFixed(3)}ms`);
    });

    it('should handle focus animations efficiently', async () => {
      const mockCrystal: CrystalTrack = {
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
      
      const startTime = performance.now();
      
      // Perform multiple focus operations
      for (let i = 0; i < 10; i++) {
        await cameraController.focusOnCrystal(mockCrystal);
        await cameraController.returnToPreviousPosition();
      }
      
      const endTime = performance.now();
      const focusTime = endTime - startTime;
      
      // Should handle 10 focus/return cycles in reasonable time
      expect(focusTime).toBeLessThan(1000); // 1 second for 10 cycles
      
      console.log(`✅ 10 focus/return cycles in ${focusTime.toFixed(2)}ms`);
    });
  });

  describe('Integrated System Performance', () => {
    let crystalTrackSystem: CrystalTrackSystem;
    let pulseSystem: CrystalPulseSystem;
    let cameraController: CinematicCameraController;

    beforeEach(() => {
      crystalTrackSystem = new CrystalTrackSystem();
      pulseSystem = new CrystalPulseSystem();
      cameraController = new CinematicCameraController(mockCamera, mockRenderer, mockScene);
      
      crystalTrackSystem.initialize(mockScene, mockCamera);
    });

    afterEach(() => {
      crystalTrackSystem.dispose();
      pulseSystem.dispose();
      cameraController.dispose();
    });

    it('should handle complete system with 500 tracks at 60fps', async () => {
      const tracks = generateTestTracks(500);
      
      // Initialize complete system
      const initStartTime = performance.now();
      await crystalTrackSystem.createCrystalCluster(tracks);
      const crystalTracks = crystalTrackSystem.getCrystalTracks();
      pulseSystem.initialize(mockScene, crystalTracks);
      const initEndTime = performance.now();
      
      const initTime = initEndTime - initStartTime;
      expect(initTime).toBeLessThan(3000); // 3 seconds for complete initialization
      
      // Test frame performance
      const frameTimes: number[] = [];
      const deltaTime = 16; // 16ms frame time
      
      for (let frame = 0; frame < 100; frame++) {
        const frameStartTime = performance.now();
        
        // Simulate complete frame update
        crystalTrackSystem.updatePulsation(deltaTime);
        crystalTrackSystem.rotateCluster(deltaTime);
        pulseSystem.updatePulsation(deltaTime);
        cameraController.update(deltaTime / 1000); // Convert to seconds
        
        const frameEndTime = performance.now();
        frameTimes.push(frameEndTime - frameStartTime);
      }
      
      const avgFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
      const maxFrameTime = Math.max(...frameTimes);
      
      // Should maintain 60fps (16.67ms budget)
      expect(avgFrameTime).toBeLessThan(10); // Leave room for rendering
      expect(maxFrameTime).toBeLessThan(16); // Never exceed frame budget
      
      console.log(`✅ 500 tracks integrated: init ${initTime.toFixed(2)}ms, avg frame ${avgFrameTime.toFixed(2)}ms, max frame ${maxFrameTime.toFixed(2)}ms`);
    });

    it('should handle stress test with 1000 tracks', async () => {
      const tracks = generateTestTracks(1000);
      
      // Initialize system
      await crystalTrackSystem.createCrystalCluster(tracks);
      const crystalTracks = crystalTrackSystem.getCrystalTracks();
      pulseSystem.initialize(mockScene, crystalTracks);
      
      // Stress test: rapid interactions
      const stressStartTime = performance.now();
      
      // Simulate user interactions
      for (let i = 0; i < 50; i++) {
        // Update systems
        crystalTrackSystem.updatePulsation(16);
        crystalTrackSystem.rotateCluster(16);
        pulseSystem.updatePulsation(16);
        cameraController.update(0.016);
        
        // Simulate mouse movement
        crystalTrackSystem.updateMousePosition(
          Math.sin(i * 0.1) * 400 + 400,
          Math.cos(i * 0.1) * 300 + 300
        );
        
        // Occasionally simulate crystal clicks
        if (i % 10 === 0) {
          const randomCrystal = crystalTracks[Math.floor(Math.random() * crystalTracks.length)];
          await crystalTrackSystem.handleCrystalClick(randomCrystal.id);
        }
      }
      
      const stressEndTime = performance.now();
      const stressTime = stressEndTime - stressStartTime;
      
      // Should handle stress test in reasonable time
      expect(stressTime).toBeLessThan(5000); // 5 seconds for stress test
      
      console.log(`✅ 1000 tracks stress test completed in ${stressTime.toFixed(2)}ms`);
    });

    it('should demonstrate memory efficiency across system lifecycle', async () => {
      const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Create and destroy multiple collections
      for (let cycle = 0; cycle < 5; cycle++) {
        const tracks = generateTestTracks(200);
        
        await crystalTrackSystem.createCrystalCluster(tracks);
        const crystalTracks = crystalTrackSystem.getCrystalTracks();
        pulseSystem.initialize(mockScene, crystalTracks);
        
        // Run for a bit
        for (let i = 0; i < 10; i++) {
          crystalTrackSystem.updatePulsation(16);
          pulseSystem.updatePulsation(16);
          cameraController.update(0.016);
        }
        
        // Clean up
        pulseSystem.dispose();
        pulseSystem = new CrystalPulseSystem();
      }
      
      const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryGrowth = memoryAfter - memoryBefore;
      
      // Memory growth should be reasonable (if memory API is available)
      if (memoryGrowth > 0) {
        expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // 50MB growth max
        console.log(`✅ Memory growth over 5 cycles: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
      }
    });
  });

  describe('Performance Regression Tests', () => {
    it('should not regress in crystal creation performance', async () => {
      const tracks = generateTestTracks(500);
      const crystalTrackSystem = new CrystalTrackSystem();
      crystalTrackSystem.initialize(mockScene, mockCamera);
      
      // Baseline measurement
      const measurements: number[] = [];
      
      for (let run = 0; run < 5; run++) {
        const startTime = performance.now();
        await crystalTrackSystem.createCrystalCluster(tracks);
        const endTime = performance.now();
        
        measurements.push(endTime - startTime);
        
        // Clean up for next run
        crystalTrackSystem.dispose();
        crystalTrackSystem.initialize(mockScene, mockCamera);
      }
      
      const avgTime = measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
      const maxTime = Math.max(...measurements);
      const minTime = Math.min(...measurements);
      
      // Performance should be consistent
      const variance = maxTime - minTime;
      expect(variance).toBeLessThan(avgTime * 0.5); // Variance should be less than 50% of average
      
      // Performance should meet baseline (adjust these values based on your target hardware)
      expect(avgTime).toBeLessThan(2000); // 2 seconds average
      expect(maxTime).toBeLessThan(3000); // 3 seconds maximum
      
      console.log(`✅ Performance baseline: avg ${avgTime.toFixed(2)}ms, range ${minTime.toFixed(2)}-${maxTime.toFixed(2)}ms`);
      
      crystalTrackSystem.dispose();
    });

    it('should maintain update performance under load', () => {
      const crystalTracks = generateTestCrystalTracks(1000);
      const pulseSystem = new CrystalPulseSystem();
      pulseSystem.initialize(mockScene, crystalTracks);
      
      // Measure performance under sustained load
      const measurements: number[] = [];
      
      for (let batch = 0; batch < 10; batch++) {
        const batchStartTime = performance.now();
        
        // Simulate 60 frames (1 second at 60fps)
        for (let frame = 0; frame < 60; frame++) {
          pulseSystem.updatePulsation(16);
        }
        
        const batchEndTime = performance.now();
        measurements.push(batchEndTime - batchStartTime);
      }
      
      const avgBatchTime = measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
      const maxBatchTime = Math.max(...measurements);
      
      // Should maintain consistent performance under load
      expect(avgBatchTime).toBeLessThan(100); // 100ms for 60 frames (1.67ms per frame)
      expect(maxBatchTime).toBeLessThan(150); // 150ms maximum
      
      console.log(`✅ Sustained load: avg ${avgBatchTime.toFixed(2)}ms/60frames, max ${maxBatchTime.toFixed(2)}ms/60frames`);
      
      pulseSystem.dispose();
    });
  });
});