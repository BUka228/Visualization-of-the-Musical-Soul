import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CrystalPulseSystem } from '../../src/soul-galaxy/effects/CrystalPulseSystem';
import { CrystalTrack } from '../../src/soul-galaxy/types';
import * as THREE from 'three';

describe('CrystalPulseSystem', () => {
  let pulseSystem: CrystalPulseSystem;
  let mockScene: THREE.Scene;
  let mockCrystalTracks: CrystalTrack[];

  beforeEach(() => {
    pulseSystem = new CrystalPulseSystem();
    mockScene = new THREE.Scene();
    
    // Create mock crystal tracks
    mockCrystalTracks = [
      {
        id: 'track1',
        name: 'Test Song 1',
        artist: 'Test Artist 1',
        album: 'Test Album 1',
        genre: 'rock',
        duration: 180,
        popularity: 75,
        color: '#0080FF',
        size: 1.0,
        imageUrl: 'https://example.com/image1.jpg',
        previewUrl: 'https://example.com/preview1.mp3',
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
      },
      {
        id: 'track2',
        name: 'Test Song 2',
        artist: 'Test Artist 2',
        album: 'Test Album 2',
        genre: 'metal',
        duration: 240,
        popularity: 85,
        color: '#FF0040',
        size: 1.2,
        imageUrl: 'https://example.com/image2.jpg',
        previewUrl: 'https://example.com/preview2.mp3',
        position: new THREE.Vector3(-10, 0, 0),
        crystalGeometry: new THREE.BufferGeometry(),
        facetCount: 12,
        roughnessLevel: 0.7,
        pulseSpeed: 1.2,
        pulseAmplitude: 0.15,
        pulsePhase: Math.PI,
        genreColor: new THREE.Color(0xFF0040),
        emissiveIntensity: 0.4,
        isFocused: false,
        isHovered: false,
        distanceFromCenter: 10
      }
    ];
  });

  afterEach(() => {
    pulseSystem.dispose();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with scene and crystal tracks', () => {
      expect(() => {
        pulseSystem.initialize(mockScene, mockCrystalTracks);
      }).not.toThrow();
    });

    it('should initialize pulsation parameters for all crystals', () => {
      pulseSystem.initialize(mockScene, mockCrystalTracks);
      
      mockCrystalTracks.forEach(crystal => {
        expect(crystal.pulseSpeed).toBeGreaterThan(0);
        expect(crystal.pulseAmplitude).toBeGreaterThan(0);
        expect(typeof crystal.pulsePhase).toBe('number');
      });
    });

    it('should handle empty crystal tracks array', () => {
      expect(() => {
        pulseSystem.initialize(mockScene, []);
      }).not.toThrow();
    });
  });

  describe('BPM-based Pulsation', () => {
    beforeEach(() => {
      pulseSystem.initialize(mockScene, mockCrystalTracks);
    });

    it('should set pulsation from BPM correctly', () => {
      const crystal = mockCrystalTracks[0];
      const bpm = 120;
      const originalSpeed = crystal.pulseSpeed;
      
      pulseSystem.setPulsationFromBPM(crystal, bpm);
      
      // Pulse speed should be calculated from BPM (120 BPM = 2 Hz)
      expect(crystal.pulseSpeed).toBeGreaterThan(0);
      expect(crystal.pulseSpeed).not.toBe(originalSpeed);
    });

    it('should handle different BPM values', () => {
      const crystal = mockCrystalTracks[0];
      
      // Test various BPM values
      const bpmValues = [60, 120, 180, 240];
      const pulseSpeedResults: number[] = [];
      
      bpmValues.forEach(bpm => {
        pulseSystem.setPulsationFromBPM(crystal, bpm);
        pulseSpeedResults.push(crystal.pulseSpeed);
      });
      
      // Higher BPM should generally result in higher pulse speed
      expect(pulseSpeedResults[3]).toBeGreaterThan(pulseSpeedResults[0]);
    });

    it('should clamp pulse speed to valid range', () => {
      const crystal = mockCrystalTracks[0];
      
      // Test extremely high BPM
      pulseSystem.setPulsationFromBPM(crystal, 1000);
      expect(crystal.pulseSpeed).toBeLessThanOrEqual(4.0); // Max pulse speed
      
      // Test extremely low BPM
      pulseSystem.setPulsationFromBPM(crystal, 10);
      expect(crystal.pulseSpeed).toBeGreaterThanOrEqual(0.5); // Min pulse speed
    });

    it('should fallback to energy-based pulsation when BPM is missing', () => {
      const crystal = mockCrystalTracks[0];
      const originalSpeed = crystal.pulseSpeed;
      
      pulseSystem.setPulsationFromBPM(crystal, undefined);
      
      // Should still have valid pulse speed based on energy/popularity
      expect(crystal.pulseSpeed).toBeGreaterThan(0);
      expect(typeof crystal.pulseSpeed).toBe('number');
    });

    it('should handle invalid BPM values', () => {
      const crystal = mockCrystalTracks[0];
      
      // Test negative BPM
      pulseSystem.setPulsationFromBPM(crystal, -60);
      expect(crystal.pulseSpeed).toBeGreaterThan(0);
      
      // Test zero BPM
      pulseSystem.setPulsationFromBPM(crystal, 0);
      expect(crystal.pulseSpeed).toBeGreaterThan(0);
    });
  });

  describe('Genre-based Modifiers', () => {
    beforeEach(() => {
      pulseSystem.initialize(mockScene, mockCrystalTracks);
    });

    it('should apply different modifiers for different genres', () => {
      const rockCrystal = mockCrystalTracks.find(c => c.genre === 'rock')!;
      const metalCrystal = mockCrystalTracks.find(c => c.genre === 'metal')!;
      
      pulseSystem.setPulsationFromBPM(rockCrystal, 120);
      pulseSystem.setPulsationFromBPM(metalCrystal, 120);
      
      // Metal should have higher speed multiplier than rock
      expect(metalCrystal.pulseSpeed).toBeGreaterThan(rockCrystal.pulseSpeed);
    });

    it('should handle unknown genres gracefully', () => {
      const crystal = { ...mockCrystalTracks[0], genre: 'unknown-genre' };
      
      expect(() => {
        pulseSystem.setPulsationFromBPM(crystal, 120);
      }).not.toThrow();
      
      expect(crystal.pulseSpeed).toBeGreaterThan(0);
    });

    it('should apply amplitude modifiers correctly', () => {
      const crystal = mockCrystalTracks[0];
      const originalAmplitude = crystal.pulseAmplitude;
      
      pulseSystem.setPulsationFromBPM(crystal, 120);
      
      // Amplitude should be modified based on genre and popularity
      expect(crystal.pulseAmplitude).toBeGreaterThan(0);
      expect(crystal.pulseAmplitude).toBeLessThanOrEqual(0.4); // Max amplitude
    });
  });

  describe('Pulsation Updates', () => {
    beforeEach(() => {
      pulseSystem.initialize(mockScene, mockCrystalTracks);
    });

    it('should update pulsation with delta time', () => {
      const deltaTime = 16; // 16ms frame time
      
      expect(() => {
        pulseSystem.updatePulsation(deltaTime);
      }).not.toThrow();
    });

    it('should not update when disabled', () => {
      pulseSystem.setEnabled(false);
      
      expect(() => {
        pulseSystem.updatePulsation(16);
      }).not.toThrow();
    });

    it('should handle empty crystal tracks during update', () => {
      const emptySystem = new CrystalPulseSystem();
      emptySystem.initialize(mockScene, []);
      
      expect(() => {
        emptySystem.updatePulsation(16);
      }).not.toThrow();
    });

    it('should calculate pulse values correctly', () => {
      // Mock a crystal mesh in the scene
      const mockMesh = new THREE.Mesh();
      mockMesh.userData = { trackId: 'track1', isCrystal: true };
      mockMesh.material = {
        updateTime: vi.fn(),
        updateCameraPosition: vi.fn(),
        updateGlobalPulse: vi.fn()
      };
      mockScene.add(mockMesh);
      
      pulseSystem.updatePulsation(16);
      
      // Should call material update methods
      expect(mockMesh.material.updateTime).toHaveBeenCalled();
      expect(mockMesh.material.updateGlobalPulse).toHaveBeenCalled();
    });
  });

  describe('Synchronization Groups', () => {
    it('should create sync groups for similar BPM tracks', () => {
      // Create tracks with similar BPM
      const syncTracks = [
        { ...mockCrystalTracks[0], id: 'sync1' },
        { ...mockCrystalTracks[0], id: 'sync2' },
        { ...mockCrystalTracks[0], id: 'sync3' }
      ];
      
      // Set similar BPM for all tracks
      syncTracks.forEach(track => {
        pulseSystem.setPulsationFromBPM(track, 120);
      });
      
      pulseSystem.initialize(mockScene, syncTracks);
      
      // Should create sync groups (tested indirectly through initialization)
      expect(() => {
        pulseSystem.updatePulsation(16);
      }).not.toThrow();
    });

    it('should handle tracks with different BPM ranges', () => {
      const diverseTracks = [
        { ...mockCrystalTracks[0], id: 'slow', genre: 'jazz' },
        { ...mockCrystalTracks[0], id: 'medium', genre: 'rock' },
        { ...mockCrystalTracks[0], id: 'fast', genre: 'punk' }
      ];
      
      pulseSystem.initialize(mockScene, diverseTracks);
      
      // Should handle diverse BPM ranges without errors
      expect(() => {
        pulseSystem.updatePulsation(16);
      }).not.toThrow();
    });
  });

  describe('Performance Controls', () => {
    beforeEach(() => {
      pulseSystem.initialize(mockScene, mockCrystalTracks);
    });

    it('should enable and disable pulsation system', () => {
      pulseSystem.setEnabled(false);
      expect(() => {
        pulseSystem.updatePulsation(16);
      }).not.toThrow();
      
      pulseSystem.setEnabled(true);
      expect(() => {
        pulseSystem.updatePulsation(16);
      }).not.toThrow();
    });

    it('should apply global speed multiplier', () => {
      const originalSpeeds = mockCrystalTracks.map(c => c.pulseSpeed);
      const multiplier = 1.5;
      
      pulseSystem.setGlobalSpeedMultiplier(multiplier);
      
      mockCrystalTracks.forEach((crystal, index) => {
        expect(crystal.pulseSpeed).toBeCloseTo(originalSpeeds[index] * multiplier, 5);
      });
    });

    it('should apply global amplitude multiplier', () => {
      const originalAmplitudes = mockCrystalTracks.map(c => c.pulseAmplitude);
      const multiplier = 1.2;
      
      pulseSystem.setGlobalAmplitudeMultiplier(multiplier);
      
      mockCrystalTracks.forEach((crystal, index) => {
        const expectedAmplitude = Math.min(0.4, originalAmplitudes[index] * multiplier);
        expect(crystal.pulseAmplitude).toBeCloseTo(expectedAmplitude, 5);
      });
    });

    it('should clamp amplitude to maximum value', () => {
      // Set very high amplitude multiplier
      pulseSystem.setGlobalAmplitudeMultiplier(10.0);
      
      mockCrystalTracks.forEach(crystal => {
        expect(crystal.pulseAmplitude).toBeLessThanOrEqual(0.4);
      });
    });
  });

  describe('Statistics and Monitoring', () => {
    beforeEach(() => {
      pulseSystem.initialize(mockScene, mockCrystalTracks);
    });

    it('should provide pulse statistics', () => {
      const stats = pulseSystem.getPulseStats();
      
      expect(stats).toHaveProperty('totalCrystals');
      expect(stats).toHaveProperty('syncGroups');
      expect(stats).toHaveProperty('enabled');
      expect(stats).toHaveProperty('avgPulseSpeed');
      expect(stats).toHaveProperty('avgAmplitude');
      
      expect(stats.totalCrystals).toBe(mockCrystalTracks.length);
      expect(typeof stats.avgPulseSpeed).toBe('number');
      expect(typeof stats.avgAmplitude).toBe('number');
      expect(typeof stats.enabled).toBe('boolean');
    });

    it('should calculate correct average values', () => {
      const stats = pulseSystem.getPulseStats();
      
      const expectedAvgSpeed = mockCrystalTracks.reduce((sum, c) => sum + c.pulseSpeed, 0) / mockCrystalTracks.length;
      const expectedAvgAmplitude = mockCrystalTracks.reduce((sum, c) => sum + c.pulseAmplitude, 0) / mockCrystalTracks.length;
      
      expect(stats.avgPulseSpeed).toBeCloseTo(expectedAvgSpeed, 5);
      expect(stats.avgAmplitude).toBeCloseTo(expectedAvgAmplitude, 5);
    });

    it('should handle empty tracks in statistics', () => {
      const emptySystem = new CrystalPulseSystem();
      emptySystem.initialize(mockScene, []);
      
      const stats = emptySystem.getPulseStats();
      
      expect(stats.totalCrystals).toBe(0);
      expect(stats.avgPulseSpeed).toBe(0);
      expect(stats.avgAmplitude).toBe(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle scene without camera', () => {
      const sceneWithoutCamera = new THREE.Scene();
      pulseSystem.initialize(sceneWithoutCamera, mockCrystalTracks);
      
      expect(() => {
        pulseSystem.updatePulsation(16);
      }).not.toThrow();
    });

    it('should handle crystals with invalid properties', () => {
      const invalidCrystal = {
        ...mockCrystalTracks[0],
        popularity: -1, // Invalid popularity
        duration: 0     // Invalid duration
      };
      
      expect(() => {
        pulseSystem.setPulsationFromBPM(invalidCrystal, 120);
      }).not.toThrow();
      
      expect(invalidCrystal.pulseSpeed).toBeGreaterThan(0);
      expect(invalidCrystal.pulseAmplitude).toBeGreaterThan(0);
    });

    it('should handle very large delta times', () => {
      pulseSystem.initialize(mockScene, mockCrystalTracks);
      
      expect(() => {
        pulseSystem.updatePulsation(10000); // 10 second delta
      }).not.toThrow();
    });

    it('should handle negative delta times', () => {
      pulseSystem.initialize(mockScene, mockCrystalTracks);
      
      expect(() => {
        pulseSystem.updatePulsation(-16);
      }).not.toThrow();
    });
  });

  describe('Memory Management', () => {
    it('should dispose properly', () => {
      pulseSystem.initialize(mockScene, mockCrystalTracks);
      
      expect(() => {
        pulseSystem.dispose();
      }).not.toThrow();
      
      // After disposal, statistics should show empty state
      const stats = pulseSystem.getPulseStats();
      expect(stats.totalCrystals).toBe(0);
      expect(stats.syncGroups).toBe(0);
      expect(stats.enabled).toBe(false);
    });

    it('should handle multiple disposals', () => {
      pulseSystem.initialize(mockScene, mockCrystalTracks);
      
      pulseSystem.dispose();
      
      expect(() => {
        pulseSystem.dispose(); // Second disposal
      }).not.toThrow();
    });

    it('should not update after disposal', () => {
      pulseSystem.initialize(mockScene, mockCrystalTracks);
      pulseSystem.dispose();
      
      expect(() => {
        pulseSystem.updatePulsation(16);
      }).not.toThrow();
    });
  });

  describe('Performance with Large Collections', () => {
    it('should handle large numbers of crystals efficiently', () => {
      const largeCrystalTracks = Array.from({ length: 1000 }, (_, i) => ({
        ...mockCrystalTracks[0],
        id: `track${i}`,
        genre: ['rock', 'metal', 'punk', 'jazz'][i % 4]
      }));
      
      const startTime = performance.now();
      pulseSystem.initialize(mockScene, largeCrystalTracks);
      const initTime = performance.now();
      
      pulseSystem.updatePulsation(16);
      const updateTime = performance.now();
      
      // Initialization should be reasonably fast (< 1 second for 1000 crystals)
      expect(initTime - startTime).toBeLessThan(1000);
      
      // Update should be very fast (< 50ms for 1000 crystals)
      expect(updateTime - initTime).toBeLessThan(50);
      
      const stats = pulseSystem.getPulseStats();
      expect(stats.totalCrystals).toBe(1000);
    });

    it('should maintain consistent performance over multiple updates', () => {
      pulseSystem.initialize(mockScene, mockCrystalTracks);
      
      const updateTimes: number[] = [];
      
      // Perform multiple updates and measure time
      for (let i = 0; i < 100; i++) {
        const startTime = performance.now();
        pulseSystem.updatePulsation(16);
        const endTime = performance.now();
        updateTimes.push(endTime - startTime);
      }
      
      // Calculate average update time
      const avgUpdateTime = updateTimes.reduce((sum, time) => sum + time, 0) / updateTimes.length;
      
      // Should maintain consistent performance (< 5ms average)
      expect(avgUpdateTime).toBeLessThan(5);
    });
  });
});