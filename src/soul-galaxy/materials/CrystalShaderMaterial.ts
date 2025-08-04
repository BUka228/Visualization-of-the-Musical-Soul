import * as THREE from 'three';
import { GenreColorPalette } from '../types';
import { GenreColorUtils } from './GenreColorSystem';

// Vertex shader for crystal pulsation and deformation
const crystalVertexShader = `
  precision mediump float;
  
  // Attributes for pulsation
  attribute float pulsePhase;
  attribute float bpmMultiplier;
  attribute vec3 originalPosition;
  attribute vec3 facetNormal;
  
  // Uniforms
  uniform float time;
  uniform float globalPulse;
  uniform float pulseAmplitude;
  uniform float pulseSpeed;
  uniform float sharpness;
  uniform bool isFocused;
  uniform bool isHovered;
  
  // Varyings
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vPulse;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vDistanceFromCenter;
  varying vec3 vFacetNormal;
  
  // Noise function for organic deformation
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  
  void main() {
    // Calculate pulsation based on BPM and time
    float pulseTime = time * pulseSpeed * bpmMultiplier;
    float basePulse = sin(pulseTime + pulsePhase);
    
    // Apply sharpness for genre-specific pulse characteristics
    if (sharpness > 1.0) {
      basePulse = sign(basePulse) * pow(abs(basePulse), 1.0 / sharpness);
    }
    
    // Add harmonics for more complex pulsation
    float harmonic1 = sin(pulseTime * 2.0 + pulsePhase) * 0.5;
    float harmonic2 = sin(pulseTime * 3.0 + pulsePhase) * 0.2;
    float harmonic3 = sin(pulseTime * 0.5 + pulsePhase) * 0.3; // Slow wave for breathing effect
    float complexPulse = basePulse + harmonic1 + harmonic2 + harmonic3;
    
    // Normalize and apply amplitude
    vPulse = complexPulse * pulseAmplitude;
    
    // Calculate base scale from pulsation
    float pulseScale = 1.0 + vPulse;
    
    // Add focus and hover effects
    float focusScale = isFocused ? 1.2 : 1.0;
    float hoverScale = isHovered ? 1.1 : 1.0;
    float totalScale = pulseScale * focusScale * hoverScale;
    
    // Apply organic deformation using noise
    vec2 noiseCoord = originalPosition.xy * 0.5 + time * 0.1;
    float organicDeformation = noise(noiseCoord) * 0.05 * pulseAmplitude;
    
    // Calculate final position with deformation
    vec3 deformedPosition = originalPosition * totalScale;
    
    // Add organic variation along facet normals
    deformedPosition += facetNormal * organicDeformation * totalScale;
    
    // Add subtle breathing effect for focused crystals
    if (isFocused) {
      float breathe = sin(time * 0.5) * 0.02;
      deformedPosition += normal * breathe;
    }
    
    // Transform to world space
    vec4 worldPosition = modelMatrix * vec4(deformedPosition, 1.0);
    vWorldPosition = worldPosition.xyz;
    vPosition = deformedPosition;
    
    // Calculate distance from center for effects
    vDistanceFromCenter = length(worldPosition.xyz);
    
    // Transform normal
    vNormal = normalize(normalMatrix * normal);
    vFacetNormal = normalize(normalMatrix * facetNormal);
    
    // Pass UV coordinates
    vUv = uv;
    
    // Final position
    gl_Position = projectionMatrix * modelViewMatrix * vec4(deformedPosition, 1.0);
  }
`;

// Fragment shader for crystal rendering with glow effects
const crystalFragmentShader = `
  precision mediump float;
  
  // Uniforms
  uniform vec3 genreColor;
  uniform sampler2D albumTexture;
  uniform bool hasAlbumTexture;
  uniform float emissiveIntensity;
  uniform float time;
  uniform bool isFocused;
  uniform bool isHovered;
  uniform float opacity;
  uniform float metallic;
  uniform float roughness;
  uniform float textureClarity;
  uniform float focusTransition;
  
  // Varyings
  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vPulse;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vDistanceFromCenter;
  varying vec3 vFacetNormal;
  
  // Noise function for texture distortion
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  
  void main() {
    // Base genre color with neon intensity
    vec3 baseColor = genreColor;
    
    // Album texture overlay with dynamic clarity effect
    vec3 textureColor = baseColor;
    if (hasAlbumTexture) {
      // Calculate dynamic distortion based on clarity and focus transition
      float dynamicClarity = mix(textureClarity, 1.0, focusTransition);
      float distortionStrength = mix(0.15, 0.005, dynamicClarity);
      float aberrationStrength = mix(0.03, 0.001, dynamicClarity);
      
      // Create distorted UV coordinates for "memory" effect
      vec2 distortedUv = vUv + vec2(
        noise(vUv * 8.0 + time * 0.1) * distortionStrength,
        noise(vUv * 8.0 + time * 0.15 + 100.0) * distortionStrength
      );
      
      // Apply chromatic aberration based on clarity
      float r = texture2D(albumTexture, distortedUv + vec2(aberrationStrength, 0.0)).r;
      float g = texture2D(albumTexture, distortedUv).g;
      float b = texture2D(albumTexture, distortedUv - vec2(aberrationStrength, 0.0)).b;
      vec3 distortedTexture = vec3(r, g, b);
      
      // Get sharp texture for high clarity
      vec2 sharpUv = vUv + sin(vUv * 20.0 + time) * 0.002; // Minimal distortion
      vec3 sharpTexture = texture2D(albumTexture, sharpUv).rgb;
      
      // Interpolate between distorted and sharp texture based on clarity
      vec3 finalTexture = mix(distortedTexture, sharpTexture, dynamicClarity);
      
      // Blend with genre color - more texture visible at higher clarity
      float textureBlend = mix(0.15, 0.7, dynamicClarity);
      textureColor = mix(baseColor, finalTexture, textureBlend);
      
      // Add focus transition enhancement
      if (focusTransition > 0.0) {
        // During focus transition, enhance texture visibility
        float focusEnhancement = focusTransition * 0.3;
        textureColor = mix(textureColor, finalTexture, focusEnhancement);
      }
    }
    
    // Calculate fresnel effect for edge glow
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = 1.0 - max(0.0, dot(vNormal, viewDirection));
    fresnel = pow(fresnel, 2.0);
    
    // Facet-based fresnel for crystal-like appearance
    float facetFresnel = 1.0 - max(0.0, dot(vFacetNormal, viewDirection));
    facetFresnel = pow(facetFresnel, 1.5);
    
    // Combine fresnels
    float combinedFresnel = max(fresnel, facetFresnel * 0.7);
    
    // Pulsation-based intensity
    float pulseIntensity = (vPulse + 1.0) * 0.5; // Normalize to 0-1
    
    // Calculate emissive glow
    vec3 emissiveGlow = baseColor * emissiveIntensity * combinedFresnel;
    
    // Add pulsation to emissive - more dramatic effect
    emissiveGlow *= (1.0 + pulseIntensity * 1.2);
    
    // Hover effect - increase glow
    if (isHovered) {
      emissiveGlow *= 1.5;
      combinedFresnel *= 1.3;
    }
    
    // Focus effect - dramatic increase in glow and clarity
    if (isFocused) {
      emissiveGlow *= 2.0;
      combinedFresnel *= 1.5;
      
      // Add inner glow for focused crystals
      float innerGlow = 1.0 - length(vUv - 0.5) * 2.0;
      innerGlow = max(0.0, innerGlow);
      emissiveGlow += baseColor * innerGlow * 0.3;
    }
    
    // Calculate final color
    vec3 finalColor = textureColor + emissiveGlow;
    
    // Add subtle color variation based on position for organic feel
    vec3 positionVariation = vec3(
      noise(vPosition.xy * 0.5) * 0.1,
      noise(vPosition.yz * 0.5) * 0.1,
      noise(vPosition.xz * 0.5) * 0.1
    );
    finalColor += positionVariation * baseColor * 0.2;
    
    // Distance-based intensity falloff
    float distanceFactor = 1.0 / (1.0 + vDistanceFromCenter * 0.001);
    finalColor *= distanceFactor;
    
    // Ensure minimum visibility
    finalColor = max(finalColor, baseColor * 0.1);
    
    // Calculate final opacity
    float finalOpacity = opacity;
    
    // Add fresnel-based transparency for crystal effect
    finalOpacity *= (0.7 + combinedFresnel * 0.3);
    
    // Pulsation affects opacity more dramatically
    finalOpacity *= (0.8 + pulseIntensity * 0.4);
    
    gl_FragColor = vec4(finalColor, finalOpacity);
  }
`;

/**
 * Custom shader material for crystal tracks with pulsation and glow effects
 */
export class CrystalShaderMaterial extends THREE.ShaderMaterial {
  private static readonly DEFAULT_GENRE_COLORS: GenreColorPalette = {
    metal: new THREE.Color(0xFF0040),      // Насыщенный красный
    rock: new THREE.Color(0x0080FF),       // Холодный синий
    punk: new THREE.Color(0x00FF40),       // Ядовито-зеленый
    electronic: new THREE.Color(0x8000FF), // Электрический фиолетовый
    jazz: new THREE.Color(0xFFD700),       // Золотисто-желтый
    classical: new THREE.Color(0xE0E0FF),  // Серебристо-белый
    pop: new THREE.Color(0xFF0080),        // Розовый неон
    indie: new THREE.Color(0x00FFFF),      // Бирюзовый
    hiphop: new THREE.Color(0xFF8000),     // Оранжевый неон
    default: new THREE.Color(0xFFFFFF)     // Нейтральный белый
  };

  constructor(config: {
    genreColor?: THREE.Color;
    albumTexture?: THREE.Texture;
    emissiveIntensity?: number;
    pulseAmplitude?: number;
    pulseSpeed?: number;
    sharpness?: number;
    opacity?: number;
    metallic?: number;
    roughness?: number;
  } = {}) {
    const {
      genreColor = CrystalShaderMaterial.DEFAULT_GENRE_COLORS.default,
      albumTexture,
      emissiveIntensity = 0.5,
      pulseAmplitude = 0.35,
      pulseSpeed = 1.5,
      sharpness = 1.0,
      opacity = 0.9,
      metallic = 0.8,
      roughness = 0.2
    } = config;

    super({
      vertexShader: crystalVertexShader,
      fragmentShader: crystalFragmentShader,
      uniforms: {
        // Time and animation
        time: { value: 0.0 },
        globalPulse: { value: 0.0 },
        
        // Pulsation parameters
        pulseAmplitude: { value: pulseAmplitude },
        pulseSpeed: { value: pulseSpeed },
        sharpness: { value: sharpness },
        
        // Visual properties
        genreColor: { value: genreColor.clone() },
        emissiveIntensity: { value: emissiveIntensity },
        opacity: { value: opacity },
        metallic: { value: metallic },
        roughness: { value: roughness },
        
        // Texture
        albumTexture: { value: albumTexture || null },
        hasAlbumTexture: { value: !!albumTexture },
        textureClarity: { value: 0.5 }, // 0 = blurry, 1 = sharp
        focusTransition: { value: 0.0 }, // 0-1 transition progress
        
        // State
        isFocused: { value: false },
        isHovered: { value: false },
        
        // Camera
        cameraPosition: { value: new THREE.Vector3() }
      },
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      depthWrite: true,
      depthTest: true
    });

    // Enable vertex colors and custom attributes
    this.vertexColors = false;
  }

  /**
   * Updates the time uniform for animation
   */
  updateTime(time: number): void {
    this.uniforms.time.value = time;
  }

  /**
   * Updates the global pulse uniform
   */
  updateGlobalPulse(pulse: number): void {
    this.uniforms.globalPulse.value = pulse;
  }

  /**
   * Updates the camera position uniform for fresnel calculations
   */
  updateCameraPosition(cameraPosition: THREE.Vector3): void {
    this.uniforms.cameraPosition.value.copy(cameraPosition);
  }

  /**
   * Sets the genre color with neon intensity using the enhanced color system
   */
  setGenreColor(genre: string, intensity: number = 1.0): void {
    const color = GenreColorUtils.getColor(genre, intensity);
    this.uniforms.genreColor.value = color.clone();
  }

  /**
   * Sets dynamic intensity for the current genre
   */
  setGenreIntensity(genre: string, intensity: number): void {
    GenreColorUtils.setIntensity(genre, intensity);
    this.setGenreColor(genre, intensity);
  }

  /**
   * Sets a custom color
   */
  setCustomColor(color: THREE.Color): void {
    this.uniforms.genreColor.value = color.clone();
  }

  /**
   * Sets the album texture
   */
  setAlbumTexture(texture: THREE.Texture | null): void {
    this.uniforms.albumTexture.value = texture;
    this.uniforms.hasAlbumTexture.value = !!texture;
  }

  /**
   * Sets pulsation parameters
   */
  setPulsationParams(amplitude: number, speed: number, sharpness: number = 1.0): void {
    this.uniforms.pulseAmplitude.value = Math.max(0, Math.min(1, amplitude));
    this.uniforms.pulseSpeed.value = Math.max(0.1, Math.min(10, speed));
    this.uniforms.sharpness.value = Math.max(0.1, Math.min(5, sharpness));
  }

  /**
   * Sets emissive intensity
   */
  setEmissiveIntensity(intensity: number): void {
    this.uniforms.emissiveIntensity.value = Math.max(0, Math.min(2, intensity));
  }

  /**
   * Sets focus state
   */
  setFocused(focused: boolean): void {
    this.uniforms.isFocused.value = focused;
  }

  /**
   * Sets hover state
   */
  setHovered(hovered: boolean): void {
    this.uniforms.isHovered.value = hovered;
  }

  /**
   * Sets texture clarity level (0 = blurry, 1 = sharp)
   */
  setTextureClarity(clarity: number): void {
    this.uniforms.textureClarity.value = Math.max(0, Math.min(1, clarity));
  }

  /**
   * Sets focus transition progress (0-1)
   */
  setFocusTransition(progress: number): void {
    this.uniforms.focusTransition.value = Math.max(0, Math.min(1, progress));
  }

  /**
   * Gets current texture clarity level
   */
  getTextureClarity(): number {
    return this.uniforms.textureClarity.value;
  }

  /**
   * Gets current focus transition progress
   */
  getFocusTransition(): number {
    return this.uniforms.focusTransition.value;
  }

  /**
   * Sets material opacity
   */
  setOpacity(opacity: number): void {
    this.uniforms.opacity.value = Math.max(0, Math.min(1, opacity));
  }

  /**
   * Sets metallic and roughness properties
   */
  setMaterialProperties(metallic: number, roughness: number): void {
    this.uniforms.metallic.value = Math.max(0, Math.min(1, metallic));
    this.uniforms.roughness.value = Math.max(0, Math.min(1, roughness));
  }

  /**
   * Gets the current genre color
   */
  getGenreColor(): THREE.Color {
    return this.uniforms.genreColor.value.clone();
  }

  /**
   * Gets available genre colors
   */
  static getGenreColors(): GenreColorPalette {
    const colors: GenreColorPalette = {} as GenreColorPalette;
    
    Object.entries(CrystalShaderMaterial.DEFAULT_GENRE_COLORS).forEach(([genre, color]) => {
      colors[genre as keyof GenreColorPalette] = color.clone();
    });
    
    return colors;
  }

  /**
   * Creates a material configured for a specific genre using the enhanced color system
   */
  static createForGenre(genre: string, config: {
    albumTexture?: THREE.Texture;
    emissiveIntensity?: number;
    pulseAmplitude?: number;
    pulseSpeed?: number;
    sharpness?: number;
    intensity?: number;
  } = {}): CrystalShaderMaterial {
    const { intensity = 1.0, ...materialConfig } = config;
    const genreColor = GenreColorUtils.getColor(genre, intensity);

    return new CrystalShaderMaterial({
      genreColor,
      ...materialConfig
    });
  }

  /**
   * Disposes of the material and its resources
   */
  dispose(): void {
    // Dispose of textures if they exist
    if (this.uniforms.albumTexture.value) {
      this.uniforms.albumTexture.value.dispose();
    }
    
    super.dispose();
  }
}