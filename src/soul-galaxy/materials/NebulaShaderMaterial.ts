import * as THREE from 'three';

// Vertex shader for nebula
const nebulaVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader for nebula with procedural noise
const nebulaFragmentShader = `
  uniform float time;
  uniform float intensity;
  uniform vec3 color1;
  uniform vec3 color2;
  uniform vec3 color3;
  uniform float driftSpeed;
  uniform float turbulence;
  uniform float layerIndex;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  
  // Simple noise function
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  // 2D Noise based on Morgan McGuire @morgan3d
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
  
  // Fractal Brownian Motion for more complex noise
  float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 0.0;
    
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(st);
      st *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
  
  void main() {
    vec2 st = vUv;
    
    // Create animated coordinates for drift effect
    vec2 driftOffset = vec2(
      time * driftSpeed * 0.1,
      time * driftSpeed * 0.05
    );
    
    // Add turbulence
    vec2 turbulentSt = st + driftOffset;
    turbulentSt += vec2(
      fbm(st * 2.0 + time * 0.01) * turbulence,
      fbm(st * 2.0 + time * 0.015) * turbulence
    );
    
    // Generate multiple noise layers for depth
    float noise1 = fbm(turbulentSt * 3.0);
    float noise2 = fbm(turbulentSt * 6.0 + vec2(100.0));
    float noise3 = fbm(turbulentSt * 12.0 + vec2(200.0));
    
    // Combine noise layers
    float combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
    
    // Create color gradient based on noise
    vec3 finalColor = mix(color1, color2, combinedNoise);
    finalColor = mix(finalColor, color3, noise2);
    
    // Add some variation based on layer index
    float layerVariation = sin(layerIndex * 2.0 + time * 0.1) * 0.1 + 0.9;
    finalColor *= layerVariation;
    
    // Calculate opacity with smooth falloff from center
    float distanceFromCenter = length(vUv - 0.5);
    float opacity = intensity * (1.0 - smoothstep(0.2, 0.8, distanceFromCenter));
    
    // Add noise-based opacity variation
    opacity *= (0.5 + combinedNoise * 0.5);
    
    // Ensure minimum visibility
    opacity = max(opacity, intensity * 0.1);
    
    gl_FragColor = vec4(finalColor, opacity);
  }
`;

export class NebulaShaderMaterial extends THREE.ShaderMaterial {
  constructor(config: {
    intensity?: number;
    colors?: THREE.Color[];
    driftSpeed?: number;
    turbulence?: number;
    layerIndex?: number;
  } = {}) {
    const {
      intensity = 0.3,
      colors = [
        new THREE.Color(0x000033), // Deep blue
        new THREE.Color(0x001122), // Dark teal  
        new THREE.Color(0x000011)  // Very dark blue
      ],
      driftSpeed = 0.001,
      turbulence = 0.1,
      layerIndex = 0
    } = config;

    super({
      vertexShader: nebulaVertexShader,
      fragmentShader: nebulaFragmentShader,
      uniforms: {
        time: { value: 0.0 },
        intensity: { value: intensity },
        color1: { value: colors[0] || new THREE.Color(0x000033) },
        color2: { value: colors[1] || new THREE.Color(0x001122) },
        color3: { value: colors[2] || new THREE.Color(0x000011) },
        driftSpeed: { value: driftSpeed },
        turbulence: { value: turbulence },
        layerIndex: { value: layerIndex }
      },
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }

  // Update time uniform for animation
  updateTime(time: number): void {
    this.uniforms.time.value = time;
  }

  // Update intensity
  setIntensity(intensity: number): void {
    this.uniforms.intensity.value = Math.max(0, Math.min(1, intensity));
  }

  // Update colors
  setColors(colors: THREE.Color[]): void {
    if (colors.length >= 1) this.uniforms.color1.value = colors[0];
    if (colors.length >= 2) this.uniforms.color2.value = colors[1];
    if (colors.length >= 3) this.uniforms.color3.value = colors[2];
  }

  // Update drift speed
  setDriftSpeed(speed: number): void {
    this.uniforms.driftSpeed.value = speed;
  }

  // Update turbulence
  setTurbulence(turbulence: number): void {
    this.uniforms.turbulence.value = turbulence;
  }

  // Set layer index for variation
  setLayerIndex(index: number): void {
    this.uniforms.layerIndex.value = index;
  }
}