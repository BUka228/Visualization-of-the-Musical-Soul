import * as THREE from 'three';
import { SoulGalaxyErrorHandler } from './SoulGalaxyErrorHandler';
import { DevicePerformanceLevel } from '../materials/FallbackTextureManager';

/**
 * Geometry complexity levels
 */
export enum GeometryComplexity {
  ULTRA_LOW = 'ultra_low',    // Basic shapes, minimal vertices
  LOW = 'low',                // Simple shapes with basic detail
  MEDIUM = 'medium',          // Moderate detail
  HIGH = 'high',              // Full detail
  ULTRA_HIGH = 'ultra_high'   // Maximum detail
}

/**
 * Geometry type definitions
 */
export enum GeometryType {
  CRYSTAL = 'crystal',
  NEBULA_PLANE = 'nebula_plane',
  PARTICLE_SYSTEM = 'particle_system',
  ENVIRONMENT_SPHERE = 'environment_sphere'
}

/**
 * Geometry configuration for different complexity levels
 */
interface GeometryConfig {
  crystal: {
    baseVertices: number;
    subdivisions: number;
    facetComplexity: number;
    useVoronoi: boolean;
  };
  nebulaPlane: {
    widthSegments: number;
    heightSegments: number;
    layers: number;
  };
  particleSystem: {
    maxParticles: number;
    useInstancing: boolean;
    geometryDetail: number;
  };
  environmentSphere: {
    widthSegments: number;
    heightSegments: number;
    radius: number;
  };
}

/**
 * Fallback geometry manager that creates appropriate geometry based on device performance
 */
export class FallbackGeometryManager {
  private static instance: FallbackGeometryManager;
  private errorHandler: SoulGalaxyErrorHandler;
  private devicePerformanceLevel: DevicePerformanceLevel;
  private currentComplexity: GeometryComplexity;
  private geometryCache: Map<string, THREE.BufferGeometry> = new Map();
  private geometryConfigs: Record<GeometryComplexity, GeometryConfig>;

  private constructor() {
    this.errorHandler = SoulGalaxyErrorHandler.getInstance();
    this.devicePerformanceLevel = this.detectDevicePerformance();
    this.currentComplexity = this.getComplexityForDevice(this.devicePerformanceLevel);
    this.geometryConfigs = this.initializeGeometryConfigs();
    
    console.log(`Geometry complexity level: ${this.currentComplexity}`);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): FallbackGeometryManager {
    if (!FallbackGeometryManager.instance) {
      FallbackGeometryManager.instance = new FallbackGeometryManager();
    }
    return FallbackGeometryManager.instance;
  }

  /**
   * Detect device performance level
   */
  private detectDevicePerformance(): DevicePerformanceLevel {
    const capabilities = this.errorHandler.getWebGLCapabilities();
    
    // Performance indicators
    let score = 0;
    
    // WebGL version
    if (capabilities.hasWebGL2) score += 20;
    
    // Extensions
    if (capabilities.hasFloatTextures) score += 15;
    if (capabilities.hasDepthTextures) score += 10;
    
    // Limits
    if (capabilities.maxTextureSize >= 4096) score += 20;
    else if (capabilities.maxTextureSize >= 2048) score += 10;
    
    if (capabilities.maxVertexUniforms >= 256) score += 10;
    if (capabilities.maxFragmentUniforms >= 256) score += 10;
    
    // Hardware detection
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
        
        if (renderer.includes('nvidia') && (renderer.includes('gtx') || renderer.includes('rtx'))) {
          score += 25;
        } else if (renderer.includes('amd') && renderer.includes('radeon')) {
          score += 20;
        } else if (renderer.includes('intel')) {
          score += 5;
        }
      }
    }
    
    // Memory
    if ((navigator as any).deviceMemory) {
      const memory = (navigator as any).deviceMemory;
      if (memory >= 8) score += 15;
      else if (memory >= 4) score += 10;
      else if (memory >= 2) score += 5;
    }
    
    // Mobile detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) score -= 25;
    
    // Performance mode check
    if (this.errorHandler.isPerformanceMode()) score -= 30;
    
    // Determine performance level
    if (score >= 70) return DevicePerformanceLevel.HIGH;
    if (score >= 35) return DevicePerformanceLevel.MEDIUM;
    return DevicePerformanceLevel.LOW;
  }

  /**
   * Get geometry complexity for device performance level
   */
  private getComplexityForDevice(performanceLevel: DevicePerformanceLevel): GeometryComplexity {
    switch (performanceLevel) {
      case DevicePerformanceLevel.HIGH:
        return GeometryComplexity.HIGH;
      case DevicePerformanceLevel.MEDIUM:
        return GeometryComplexity.MEDIUM;
      case DevicePerformanceLevel.LOW:
        return GeometryComplexity.LOW;
    }
  }

  /**
   * Initialize geometry configurations for different complexity levels
   */
  private initializeGeometryConfigs(): Record<GeometryComplexity, GeometryConfig> {
    return {
      [GeometryComplexity.ULTRA_LOW]: {
        crystal: {
          baseVertices: 6,      // Octahedron
          subdivisions: 0,
          facetComplexity: 1,
          useVoronoi: false
        },
        nebulaPlane: {
          widthSegments: 2,
          heightSegments: 2,
          layers: 1
        },
        particleSystem: {
          maxParticles: 50,
          useInstancing: false,
          geometryDetail: 1
        },
        environmentSphere: {
          widthSegments: 8,
          heightSegments: 6,
          radius: 100
        }
      },
      
      [GeometryComplexity.LOW]: {
        crystal: {
          baseVertices: 12,     // Icosahedron
          subdivisions: 0,
          facetComplexity: 2,
          useVoronoi: false
        },
        nebulaPlane: {
          widthSegments: 4,
          heightSegments: 4,
          layers: 2
        },
        particleSystem: {
          maxParticles: 100,
          useInstancing: true,
          geometryDetail: 1
        },
        environmentSphere: {
          widthSegments: 12,
          heightSegments: 8,
          radius: 100
        }
      },
      
      [GeometryComplexity.MEDIUM]: {
        crystal: {
          baseVertices: 20,     // Detailed icosahedron
          subdivisions: 1,
          facetComplexity: 3,
          useVoronoi: true
        },
        nebulaPlane: {
          widthSegments: 8,
          heightSegments: 8,
          layers: 3
        },
        particleSystem: {
          maxParticles: 250,
          useInstancing: true,
          geometryDetail: 2
        },
        environmentSphere: {
          widthSegments: 16,
          heightSegments: 12,
          radius: 100
        }
      },
      
      [GeometryComplexity.HIGH]: {
        crystal: {
          baseVertices: 32,
          subdivisions: 2,
          facetComplexity: 4,
          useVoronoi: true
        },
        nebulaPlane: {
          widthSegments: 16,
          heightSegments: 16,
          layers: 4
        },
        particleSystem: {
          maxParticles: 500,
          useInstancing: true,
          geometryDetail: 3
        },
        environmentSphere: {
          widthSegments: 24,
          heightSegments: 16,
          radius: 100
        }
      },
      
      [GeometryComplexity.ULTRA_HIGH]: {
        crystal: {
          baseVertices: 64,
          subdivisions: 3,
          facetComplexity: 5,
          useVoronoi: true
        },
        nebulaPlane: {
          widthSegments: 32,
          heightSegments: 32,
          layers: 5
        },
        particleSystem: {
          maxParticles: 1000,
          useInstancing: true,
          geometryDetail: 4
        },
        environmentSphere: {
          widthSegments: 32,
          heightSegments: 24,
          radius: 100
        }
      }
    };
  }

  /**
   * Create geometry with automatic fallback based on device performance
   */
  public createGeometryWithFallback(
    type: GeometryType,
    options: {
      forceComplexity?: GeometryComplexity;
      trackData?: any;
      customParams?: any;
    } = {}
  ): THREE.BufferGeometry {
    const complexity = options.forceComplexity || this.currentComplexity;
    const cacheKey = `${type}_${complexity}_${JSON.stringify(options.customParams || {})}`;
    
    // Check cache first
    if (this.geometryCache.has(cacheKey)) {
      return this.geometryCache.get(cacheKey)!.clone();
    }

    try {
      let geometry: THREE.BufferGeometry;
      
      switch (type) {
        case GeometryType.CRYSTAL:
          geometry = this.createCrystalGeometry(complexity, options.trackData, options.customParams);
          break;
        
        case GeometryType.NEBULA_PLANE:
          geometry = this.createNebulaPlaneGeometry(complexity, options.customParams);
          break;
        
        case GeometryType.PARTICLE_SYSTEM:
          geometry = this.createParticleSystemGeometry(complexity, options.customParams);
          break;
        
        case GeometryType.ENVIRONMENT_SPHERE:
          geometry = this.createEnvironmentSphereGeometry(complexity, options.customParams);
          break;
        
        default:
          throw new Error(`Unknown geometry type: ${type}`);
      }
      
      // Cache the geometry
      this.geometryCache.set(cacheKey, geometry.clone());
      
      return geometry;
    } catch (error) {
      console.warn(`Geometry creation failed for ${type}, using fallback:`, error);
      
      // Report error
      this.errorHandler.handleGeometryGenerationError(type, error as Error, options.trackData);
      
      // Create simple fallback geometry
      const fallbackGeometry = this.createSimpleFallbackGeometry(type);
      
      return fallbackGeometry;
    }
  }

  /**
   * Create crystal geometry with varying complexity
   */
  private createCrystalGeometry(
    complexity: GeometryComplexity,
    trackData?: any,
    customParams?: any
  ): THREE.BufferGeometry {
    const config = this.geometryConfigs[complexity].crystal;
    
    if (config.useVoronoi && complexity !== GeometryComplexity.ULTRA_LOW && complexity !== GeometryComplexity.LOW) {
      return this.createVoronoiCrystalGeometry(config, trackData);
    } else {
      return this.createSimpleCrystalGeometry(config, trackData);
    }
  }

  /**
   * Create Voronoi-based crystal geometry for higher complexity levels
   */
  private createVoronoiCrystalGeometry(
    config: GeometryConfig['crystal'],
    trackData?: any
  ): THREE.BufferGeometry {
    // Start with a base icosahedron
    const baseGeometry = new THREE.IcosahedronGeometry(1, config.subdivisions);
    
    // Apply Voronoi-like distortion to create irregular facets
    const positions = baseGeometry.attributes.position.array as Float32Array;
    const normals = baseGeometry.attributes.normal.array as Float32Array;
    
    // Create seed for consistent randomization based on track data
    const seed = trackData ? this.hashTrackData(trackData) : Math.random();
    const rng = this.createSeededRandom(seed);
    
    // Distort vertices to create irregular crystal shape
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      
      // Calculate distance from center
      const distance = Math.sqrt(x * x + y * y + z * z);
      
      // Apply random distortion based on facet complexity
      const distortionFactor = 0.1 + (config.facetComplexity - 1) * 0.1;
      const distortion = (rng() - 0.5) * distortionFactor;
      
      // Apply distortion along the normal direction
      const normalX = normals[i];
      const normalY = normals[i + 1];
      const normalZ = normals[i + 2];
      
      positions[i] = x + normalX * distortion;
      positions[i + 1] = y + normalY * distortion;
      positions[i + 2] = z + normalZ * distortion;
    }
    
    // Recalculate normals after distortion
    baseGeometry.computeVertexNormals();
    
    // Add custom attributes for shader use
    this.addCrystalAttributes(baseGeometry, trackData, seed);
    
    return baseGeometry;
  }

  /**
   * Create simple crystal geometry for lower complexity levels
   */
  private createSimpleCrystalGeometry(
    config: GeometryConfig['crystal'],
    trackData?: any
  ): THREE.BufferGeometry {
    let geometry: THREE.BufferGeometry;
    
    // Choose base geometry based on vertex count
    if (config.baseVertices <= 8) {
      geometry = new THREE.OctahedronGeometry(1, 0);
    } else if (config.baseVertices <= 12) {
      geometry = new THREE.IcosahedronGeometry(1, 0);
    } else {
      geometry = new THREE.IcosahedronGeometry(1, config.subdivisions);
    }
    
    // Add custom attributes
    const seed = trackData ? this.hashTrackData(trackData) : Math.random();
    this.addCrystalAttributes(geometry, trackData, seed);
    
    return geometry;
  }

  /**
   * Add custom attributes to crystal geometry for shader use
   */
  private addCrystalAttributes(geometry: THREE.BufferGeometry, trackData?: any, seed?: number): void {
    const positions = geometry.attributes.position;
    const vertexCount = positions.count;
    
    // Create arrays for custom attributes
    const pulsePhases = new Float32Array(vertexCount);
    const bpmMultipliers = new Float32Array(vertexCount);
    const originalPositions = new Float32Array(vertexCount * 3);
    const facetNormals = new Float32Array(vertexCount * 3);
    
    const rng = this.createSeededRandom(seed || Math.random());
    const bpm = trackData?.bpm || 120;
    const energy = trackData?.energy || 0.5;
    
    // Fill attribute arrays
    for (let i = 0; i < vertexCount; i++) {
      // Random pulse phase for each vertex
      pulsePhases[i] = rng() * Math.PI * 2;
      
      // BPM-based multiplier
      bpmMultipliers[i] = (bpm / 120) * (0.8 + rng() * 0.4);
      
      // Store original positions
      originalPositions[i * 3] = positions.getX(i);
      originalPositions[i * 3 + 1] = positions.getY(i);
      originalPositions[i * 3 + 2] = positions.getZ(i);
      
      // Calculate facet normals (simplified)
      const normal = new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      ).normalize();
      
      facetNormals[i * 3] = normal.x;
      facetNormals[i * 3 + 1] = normal.y;
      facetNormals[i * 3 + 2] = normal.z;
    }
    
    // Add attributes to geometry
    geometry.setAttribute('pulsePhase', new THREE.BufferAttribute(pulsePhases, 1));
    geometry.setAttribute('bpmMultiplier', new THREE.BufferAttribute(bpmMultipliers, 1));
    geometry.setAttribute('originalPosition', new THREE.BufferAttribute(originalPositions, 3));
    geometry.setAttribute('facetNormal', new THREE.BufferAttribute(facetNormals, 3));
  }

  /**
   * Create nebula plane geometry
   */
  private createNebulaPlaneGeometry(
    complexity: GeometryComplexity,
    customParams?: any
  ): THREE.BufferGeometry {
    const config = this.geometryConfigs[complexity].nebulaPlane;
    
    const geometry = new THREE.PlaneGeometry(
      customParams?.width || 50,
      customParams?.height || 50,
      config.widthSegments,
      config.heightSegments
    );
    
    // Add wave distortion for higher complexity levels
    if (complexity !== GeometryComplexity.ULTRA_LOW) {
      this.addWaveDistortion(geometry, config.widthSegments, config.heightSegments);
    }
    
    return geometry;
  }

  /**
   * Add wave distortion to plane geometry
   */
  private addWaveDistortion(
    geometry: THREE.BufferGeometry,
    widthSegments: number,
    heightSegments: number
  ): void {
    const positions = geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      
      // Add wave distortion
      const waveX = Math.sin(x * 0.1) * 0.5;
      const waveY = Math.cos(y * 0.1) * 0.5;
      
      positions[i + 2] = waveX + waveY;
    }
    
    geometry.computeVertexNormals();
  }

  /**
   * Create particle system geometry
   */
  private createParticleSystemGeometry(
    complexity: GeometryComplexity,
    customParams?: any
  ): THREE.BufferGeometry {
    const config = this.geometryConfigs[complexity].particleSystem;
    const particleCount = customParams?.particleCount || config.maxParticles;
    
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    // Generate random particles
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Random positions in sphere
      const radius = Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      // Random colors
      colors[i3] = Math.random();
      colors[i3 + 1] = Math.random();
      colors[i3 + 2] = Math.random();
      
      // Random sizes
      sizes[i] = Math.random() * 2 + 0.5;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    return geometry;
  }

  /**
   * Create environment sphere geometry
   */
  private createEnvironmentSphereGeometry(
    complexity: GeometryComplexity,
    customParams?: any
  ): THREE.BufferGeometry {
    const config = this.geometryConfigs[complexity].environmentSphere;
    
    return new THREE.SphereGeometry(
      customParams?.radius || config.radius,
      config.widthSegments,
      config.heightSegments
    );
  }

  /**
   * Create simple fallback geometry when all else fails
   */
  private createSimpleFallbackGeometry(type: GeometryType): THREE.BufferGeometry {
    switch (type) {
      case GeometryType.CRYSTAL:
        return new THREE.OctahedronGeometry(1, 0);
      
      case GeometryType.NEBULA_PLANE:
        return new THREE.PlaneGeometry(10, 10, 1, 1);
      
      case GeometryType.PARTICLE_SYSTEM:
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array([0, 0, 0]);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        return geometry;
      
      case GeometryType.ENVIRONMENT_SPHERE:
        return new THREE.SphereGeometry(100, 8, 6);
      
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }

  /**
   * Hash track data for consistent randomization
   */
  private hashTrackData(trackData: any): number {
    const str = JSON.stringify({
      id: trackData.id,
      title: trackData.title,
      artist: trackData.artist
    });
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  }

  /**
   * Create seeded random number generator
   */
  private createSeededRandom(seed: number): () => number {
    let state = seed;
    
    return () => {
      state = (state * 9301 + 49297) % 233280;
      return state / 233280;
    };
  }

  /**
   * Set geometry complexity level
   */
  public setComplexityLevel(complexity: GeometryComplexity): void {
    this.currentComplexity = complexity;
    this.clearCache(); // Clear cache when complexity changes
  }

  /**
   * Get current complexity level
   */
  public getCurrentComplexity(): GeometryComplexity {
    return this.currentComplexity;
  }

  /**
   * Get device performance level
   */
  public getDevicePerformanceLevel(): DevicePerformanceLevel {
    return this.devicePerformanceLevel;
  }

  /**
   * Get geometry configuration for complexity level
   */
  public getGeometryConfig(complexity?: GeometryComplexity): GeometryConfig {
    return this.geometryConfigs[complexity || this.currentComplexity];
  }

  /**
   * Clear geometry cache
   */
  public clearCache(): void {
    this.geometryCache.forEach(geometry => geometry.dispose());
    this.geometryCache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStatistics(): {
    cachedGeometries: number;
    totalVertices: number;
    memoryEstimate: number;
  } {
    let totalVertices = 0;
    
    this.geometryCache.forEach(geometry => {
      if (geometry.attributes.position) {
        totalVertices += geometry.attributes.position.count;
      }
    });
    
    // Rough memory estimate (position + normal + uv + custom attributes)
    const memoryEstimate = totalVertices * 4 * 12; // 12 floats per vertex average
    
    return {
      cachedGeometries: this.geometryCache.size,
      totalVertices,
      memoryEstimate
    };
  }

  /**
   * Dispose of the geometry manager
   */
  public dispose(): void {
    this.clearCache();
  }
}