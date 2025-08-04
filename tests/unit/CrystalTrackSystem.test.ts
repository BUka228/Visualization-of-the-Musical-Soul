import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CrystalTrackSystem } from '../../src/soul-galaxy/core/CrystalTrackSystem';
import { ProcessedTrack } from '../../src/types';
import { CrystalTrack } from '../../src/soul-galaxy/types';
import * as THREE from 'three';

// Mock dependencies
vi.mock('../../src/soul-galaxy/core/CrystalGeometryGenerator', () => ({
  CrystalGeometryGenerator: {
    generateCrystalGeometry: vi.fn(() => new THREE.BufferGeometry()),
    createAdvancedCrystalGeometry: vi.fn(() => ({
      geometry: new THREE.BufferGeometry(),
      facetCount: 8,
      roughnessLevel: 0.5
    }))
  }
}));

vi.mock('../../src/soul-galaxy/effects/CrystalPulseSystem', () => ({
  CrystalPulseSystem: vi.fn(() => ({
    initialize: vi.fn(),
    updatePulsation: vi.fn(),
    setPulsationFromBPM: vi.fn(),
    dispose: vi.fn()
  }))
}));

vi.mock('../../src/soul-galaxy/materials/CrystalShaderMaterial', () => ({
  CrystalShaderMaterial: {
    createForGenre: vi.fn(() => ({
      setFocused: vi.fn(),
      setEmissiveIntensity: vi.fn(),
      dispose: vi.fn()
    }))
  }
}));

vi.mock('../../src/soul-galaxy/materials/AlbumTextureManager', () => ({
  AlbumTextureManager: vi.fn(() => ({
    preloadTextures: vi.fn(() => Promise.resolve()),
    getAlbumTexture: vi.fn(() => Promise.resolve(new THREE.Texture())),
    getFallbackTexture: vi.fn(() => new THREE.Texture()),
    getCacheStats: vi.fn(() => ({
      cachedTextures: 0,
      loadingTextures: 0,
      fallbackTextures: 0,
      memoryUsage: 0
    })),
    dispose: vi.fn()
  }))
}));

vi.mock('../../src/soul-galaxy/materials/TextureClaritySystem', () => ({
  TextureClaritySystem: vi.fn(() => ({
    preloadHighQualityTextures: vi.fn(() => Promise.resolve()),
    transitionToHighQuality: vi.fn(() => Promise.resolve()),
    transitionToMediumQuality: vi.fn(() => Promise.resolve()),
    dispose: vi.fn()
  }))
}));

vi.mock('../../src/soul-galaxy/interaction/CrystalHoverSystem', () => ({
  CrystalHoverSystem: vi.fn(() => ({
    initialize: vi.fn(),
    setCrystalTracks: vi.fn(),
    update: vi.fn(),
    updateMousePosition: vi.fn(),
    getHoveredCrystal: vi.fn(),
    clearHover: vi.fn(),
    dispose: vi.fn()
  }))
}));

vi.mock('../../src/soul-galaxy/audio/SoulGalaxyAudioIntegration', () => ({
  SoulGalaxyAudioIntegration: vi.fn(() => ({
    initialize: vi.fn(),
    playTrackWithTransition: vi.fn(() => Promise.resolve()),
    stopCurrentTrack: vi.fn(() => Promise.resolve()),
    isTrackPlaying: vi.fn(() => false),
    getCurrentPlayingTrack: vi.fn(),
    setOnRotationStart: vi.fn(),
    setOnRotationStop: vi.fn(),
    dispose: vi.fn()
  }))
}));

vi.mock('../../src/soul-galaxy/effects/CrystalRotationSystem', () => ({
  CrystalRotationSystem: vi.fn(() => ({
    startRotation: vi.fn(),
    stopRotation: vi.fn(),
    dispose: vi.fn()
  }))
}));

describe('CrystalTrackSystem', () => {
  let crystalTrackSystem: CrystalTrackSystem;
  let mockScene: THREE.Scene;
  let mockCamera: THREE.Camera;
  let mockTracks: ProcessedTrack[];

  beforeEach(() => {
    crystalTrackSystem = new CrystalTrackSystem();
    mockScene = new THREE.Scene();
    mockCamera = new THREE.PerspectiveCamera();
    
    // Create mock tracks
    mockTracks = [
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
        position: new THREE.Vector3(0, 0, 0),
        imageUrl: 'https://example.com/image1.jpg',
        previewUrl: 'https://example.com/preview1.mp3'
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
        position: new THREE.Vector3(10, 0, 0),
        imageUrl: 'https://example.com/image2.jpg',
        previewUrl: 'https://example.com/preview2.mp3'
      }
    ];
  });

  afterEach(() => {
    crystalTrackSystem.dispose();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with scene and camera', () => {
      expect(() => {
        crystalTrackSystem.initialize(mockScene, mockCamera);
      }).not.toThrow();
    });

    it('should initialize with container element', () => {
      const mockContainer = document.createElement('div');
      expect(() => {
        crystalTrackSystem.initialize(mockScene, mockCamera, mockContainer);
      }).not.toThrow();
    });

    it('should not allow operations before initialization', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      await crystalTrackSystem.createCrystalCluster(mockTracks);
      
      expect(consoleSpy).toHaveBeenCalledWith('⚠️ Crystal Track System not initialized');
      consoleSpy.mockRestore();
    });
  });

  describe('Crystal Cluster Creation', () => {
    beforeEach(() => {
      crystalTrackSystem.initialize(mockScene, mockCamera);
    });

    it('should create crystal cluster from tracks', async () => {
      await crystalTrackSystem.createCrystalCluster(mockTracks);
      
      const crystalTracks = crystalTrackSystem.getCrystalTracks();
      expect(crystalTracks).toHaveLength(mockTracks.length);
    });

    it('should generate unique crystal geometry for each track', async () => {
      await crystalTrackSystem.createCrystalCluster(mockTracks);
      
      const crystalTracks = crystalTrackSystem.getCrystalTracks();
      
      // Each crystal should have unique geometry
      crystalTracks.forEach(crystal => {
        expect(crystal.crystalGeometry).toBeDefined();
        expect(crystal.facetCount).toBeGreaterThan(0);
        expect(crystal.roughnessLevel).toBeGreaterThan(0);
      });
    });

    it('should assign positions in spherical cluster formation', async () => {
      await crystalTrackSystem.createCrystalCluster(mockTracks);
      
      const crystalTracks = crystalTrackSystem.getCrystalTracks();
      
      crystalTracks.forEach(crystal => {
        expect(crystal.position).toBeInstanceOf(THREE.Vector3);
        expect(crystal.distanceFromCenter).toBeGreaterThan(0);
        
        // Position should be within reasonable cluster bounds
        expect(crystal.position.length()).toBeLessThan(100);
      });
    });

    it('should handle empty track array', async () => {
      await crystalTrackSystem.createCrystalCluster([]);
      
      const crystalTracks = crystalTrackSystem.getCrystalTracks();
      expect(crystalTracks).toHaveLength(0);
    });

    it('should clear previous cluster when creating new one', async () => {
      // Create first cluster
      await crystalTrackSystem.createCrystalCluster(mockTracks);
      const firstCluster = crystalTrackSystem.getCrystalCluster();
      
      // Create second cluster
      const newTracks = [mockTracks[0]]; // Single track
      await crystalTrackSystem.createCrystalCluster(newTracks);
      
      const secondCluster = crystalTrackSystem.getCrystalCluster();
      expect(secondCluster).not.toBe(firstCluster);
      expect(crystalTrackSystem.getCrystalTracks()).toHaveLength(1);
    });
  });

  describe('Crystal Geometry Generation', () => {
    beforeEach(() => {
      crystalTrackSystem.initialize(mockScene, mockCamera);
    });

    it('should generate crystal geometry for track', () => {
      const geometry = crystalTrackSystem.generateCrystalGeometry(mockTracks[0]);
      
      expect(geometry).toBeInstanceOf(THREE.BufferGeometry);
    });

    it('should generate different geometry for different tracks', () => {
      const geometry1 = crystalTrackSystem.generateCrystalGeometry(mockTracks[0]);
      const geometry2 = crystalTrackSystem.generateCrystalGeometry(mockTracks[1]);
      
      // Geometries should be different instances
      expect(geometry1).not.toBe(geometry2);
    });
  });

  describe('Pulsation System', () => {
    beforeEach(async () => {
      crystalTrackSystem.initialize(mockScene, mockCamera);
      await crystalTrackSystem.createCrystalCluster(mockTracks);
    });

    it('should update pulsation with delta time', () => {
      const deltaTime = 16; // 16ms frame time
      
      expect(() => {
        crystalTrackSystem.updatePulsation(deltaTime);
      }).not.toThrow();
    });

    it('should calculate correct pulse speed from BPM', () => {
      const track = mockTracks[0];
      const bpm = 120;
      
      crystalTrackSystem.setPulsationFromBPM(track, bpm);
      
      const crystalTracks = crystalTrackSystem.getCrystalTracks();
      const crystalTrack = crystalTracks.find(ct => ct.id === track.id);
      
      expect(crystalTrack?.pulseSpeed).toBeGreaterThan(0);
      expect(crystalTrack?.pulseAmplitude).toBeGreaterThan(0);
    });

    it('should handle missing BPM data gracefully', () => {
      const track = mockTracks[0];
      
      expect(() => {
        crystalTrackSystem.setPulsationFromBPM(track, undefined);
      }).not.toThrow();
    });

    it('should not update pulsation before initialization', () => {
      const uninitializedSystem = new CrystalTrackSystem();
      
      expect(() => {
        uninitializedSystem.updatePulsation(16);
      }).not.toThrow();
    });
  });

  describe('Cluster Rotation', () => {
    beforeEach(async () => {
      crystalTrackSystem.initialize(mockScene, mockCamera);
      await crystalTrackSystem.createCrystalCluster(mockTracks);
    });

    it('should rotate cluster with delta time', () => {
      const cluster = crystalTrackSystem.getCrystalCluster();
      const initialRotationY = cluster?.rotation.y || 0;
      
      crystalTrackSystem.rotateCluster(1000); // 1 second
      
      const newRotationY = cluster?.rotation.y || 0;
      expect(newRotationY).not.toBe(initialRotationY);
    });

    it('should allow setting cluster rotation speed', () => {
      const newSpeed = 0.005;
      crystalTrackSystem.setClusterRotationSpeed(newSpeed);
      
      expect(crystalTrackSystem.getClusterRotationSpeed()).toBe(newSpeed);
    });

    it('should handle rotation without cluster', () => {
      const emptySystem = new CrystalTrackSystem();
      emptySystem.initialize(mockScene, mockCamera);
      
      expect(() => {
        emptySystem.rotateCluster(16);
      }).not.toThrow();
    });
  });

  describe('Crystal Focus', () => {
    beforeEach(async () => {
      crystalTrackSystem.initialize(mockScene, mockCamera);
      await crystalTrackSystem.createCrystalCluster(mockTracks);
    });

    it('should focus on crystal', () => {
      const crystalTracks = crystalTrackSystem.getCrystalTracks();
      const crystal = crystalTracks[0];
      
      crystalTrackSystem.focusOnCrystal(crystal);
      
      expect(crystal.isFocused).toBe(true);
    });

    it('should handle focus on non-existent crystal', () => {
      const fakeCrystal = {
        ...mockTracks[0],
        id: 'non-existent',
        position: new THREE.Vector3(),
        crystalGeometry: new THREE.BufferGeometry(),
        facetCount: 8,
        roughnessLevel: 0.5,
        pulseSpeed: 1.0,
        pulseAmplitude: 0.1,
        pulsePhase: 0,
        genreColor: new THREE.Color(),
        emissiveIntensity: 0.3,
        isFocused: false,
        isHovered: false,
        distanceFromCenter: 10
      };
      
      expect(() => {
        crystalTrackSystem.focusOnCrystal(fakeCrystal);
      }).not.toThrow();
    });
  });

  describe('Mouse Interaction', () => {
    beforeEach(async () => {
      crystalTrackSystem.initialize(mockScene, mockCamera);
      await crystalTrackSystem.createCrystalCluster(mockTracks);
    });

    it('should update mouse position', () => {
      expect(() => {
        crystalTrackSystem.updateMousePosition(100, 200);
      }).not.toThrow();
    });

    it('should get hover system', () => {
      const hoverSystem = crystalTrackSystem.getHoverSystem();
      expect(hoverSystem).toBeDefined();
    });

    it('should clear hover state', () => {
      expect(() => {
        crystalTrackSystem.clearHover();
      }).not.toThrow();
    });
  });

  describe('Audio Integration', () => {
    beforeEach(async () => {
      crystalTrackSystem.initialize(mockScene, mockCamera);
      await crystalTrackSystem.createCrystalCluster(mockTracks);
    });

    it('should handle crystal click', async () => {
      const crystalTracks = crystalTrackSystem.getCrystalTracks();
      const trackId = crystalTracks[0].id;
      
      await expect(
        crystalTrackSystem.handleCrystalClick(trackId)
      ).resolves.not.toThrow();
    });

    it('should handle click on non-existent crystal', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      await crystalTrackSystem.handleCrystalClick('non-existent');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Crystal not found for track ID: non-existent')
      );
      consoleSpy.mockRestore();
    });

    it('should get audio integration', () => {
      const audioIntegration = crystalTrackSystem.getAudioIntegration();
      expect(audioIntegration).toBeDefined();
    });

    it('should check if track is playing', () => {
      const crystalTracks = crystalTrackSystem.getCrystalTracks();
      const trackId = crystalTracks[0].id;
      
      const isPlaying = crystalTrackSystem.isTrackPlaying(trackId);
      expect(typeof isPlaying).toBe('boolean');
    });

    it('should stop current playback', async () => {
      await expect(
        crystalTrackSystem.stopCurrentPlayback()
      ).resolves.not.toThrow();
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large collections efficiently', async () => {
      const largeTracks = Array.from({ length: 1000 }, (_, i) => ({
        id: `track${i}`,
        name: `Test Song ${i}`,
        artist: `Test Artist ${i}`,
        album: `Test Album ${i}`,
        genre: i % 2 === 0 ? 'rock' : 'metal',
        duration: 180 + i,
        popularity: Math.floor(Math.random() * 100),
        color: i % 2 === 0 ? '#0080FF' : '#FF0040',
        size: 1.0 + Math.random() * 0.5,
        position: new THREE.Vector3(Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50),
        imageUrl: `https://example.com/image${i}.jpg`,
        previewUrl: `https://example.com/preview${i}.mp3`
      }));

      crystalTrackSystem.initialize(mockScene, mockCamera);
      
      const startTime = performance.now();
      await crystalTrackSystem.createCrystalCluster(largeTracks);
      const endTime = performance.now();
      
      // Should complete within reasonable time (5 seconds for 1000 tracks)
      expect(endTime - startTime).toBeLessThan(5000);
      
      const crystalTracks = crystalTrackSystem.getCrystalTracks();
      expect(crystalTracks).toHaveLength(1000);
    });

    it('should properly dispose resources', () => {
      crystalTrackSystem.initialize(mockScene, mockCamera);
      
      expect(() => {
        crystalTrackSystem.dispose();
      }).not.toThrow();
      
      // After disposal, should not have any crystal tracks
      expect(crystalTrackSystem.getCrystalTracks()).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle texture loading errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock texture loading failure
      const tracksWithBadImages = mockTracks.map(track => ({
        ...track,
        imageUrl: 'invalid-url'
      }));
      
      crystalTrackSystem.initialize(mockScene, mockCamera);
      
      await expect(
        crystalTrackSystem.createCrystalCluster(tracksWithBadImages)
      ).resolves.not.toThrow();
      
      consoleSpy.mockRestore();
    });

    it('should handle geometry generation errors', () => {
      const invalidTrack = {
        ...mockTracks[0],
        genre: '', // Invalid genre
        duration: -1 // Invalid duration
      };
      
      expect(() => {
        crystalTrackSystem.generateCrystalGeometry(invalidTrack);
      }).not.toThrow();
    });
  });

  describe('Statistics and Logging', () => {
    beforeEach(async () => {
      crystalTrackSystem.initialize(mockScene, mockCamera);
      await crystalTrackSystem.createCrystalCluster(mockTracks);
    });

    it('should provide crystal tracks data', () => {
      const crystalTracks = crystalTrackSystem.getCrystalTracks();
      
      expect(Array.isArray(crystalTracks)).toBe(true);
      expect(crystalTracks.length).toBeGreaterThan(0);
      
      crystalTracks.forEach(crystal => {
        expect(crystal.id).toBeDefined();
        expect(crystal.name).toBeDefined();
        expect(crystal.artist).toBeDefined();
        expect(crystal.position).toBeInstanceOf(THREE.Vector3);
        expect(typeof crystal.pulseSpeed).toBe('number');
        expect(typeof crystal.pulseAmplitude).toBe('number');
      });
    });

    it('should provide cluster data', () => {
      const cluster = crystalTrackSystem.getCrystalCluster();
      
      expect(cluster).toBeInstanceOf(THREE.Group);
      expect(cluster?.children.length).toBe(mockTracks.length);
    });
  });
});