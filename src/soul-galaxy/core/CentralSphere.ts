import * as THREE from 'three';
import { CrystalTrack } from '../types';

/**
 * Центральная светящаяся сфера с динамическими визуальными эффектами
 * Реагирует на музыку и создает связи с кристаллами
 */
export class CentralSphere {
  private scene?: THREE.Scene;
  private sphereGroup: THREE.Group;
  private coreSphere: THREE.Mesh;
  private particleSystem: THREE.Points;
  private energyBeams: THREE.Group;
  private orbitalParticles: THREE.Group;
  private auraSystem: THREE.Group;
  private innerGlow: THREE.Mesh;
  private outerGlow: THREE.Mesh;
  
  // Аудио анализ
  private audioContext?: AudioContext;
  private analyser?: AnalyserNode;
  private dataArray?: Uint8Array;
  private currentTrack?: CrystalTrack;
  private audioSource?: MediaElementAudioSourceNode;
  private isAudioConnected: boolean = false;
  private fallbackInterval?: number;
  
  // Анимация
  private time: number = 0;
  private pulseIntensity: number = 0;
  private bassLevel: number = 0;
  private trebleLevel: number = 0;
  
  // Материалы
  private coreMaterial: THREE.ShaderMaterial;
  private particleMaterial: THREE.ShaderMaterial;
  
  constructor() {
    this.sphereGroup = new THREE.Group();
    this.sphereGroup.name = 'CentralSphere';
    
    // Создаем материалы (без ауры)
    this.coreMaterial = this.createCoreMaterial();
    this.particleMaterial = this.createParticleMaterial();
    
    // Создаем компоненты сферы с аурой
    this.coreSphere = this.createCoreSphere();
    this.particleSystem = this.createParticleSystem();
    this.energyBeams = this.createEnergyBeams();
    this.orbitalParticles = this.createOrbitalParticles();
    this.auraSystem = this.createAuraSystem();
    this.innerGlow = this.createInnerGlow();
    this.outerGlow = this.createOuterGlow();
    
    // Добавляем все в группу с правильным порядком рендеринга
    this.sphereGroup.add(this.outerGlow);
    this.sphereGroup.add(this.auraSystem);
    this.sphereGroup.add(this.orbitalParticles);
    this.sphereGroup.add(this.particleSystem);
    this.sphereGroup.add(this.innerGlow);
    this.sphereGroup.add(this.coreSphere);
    this.sphereGroup.add(this.energyBeams);
  }

  initialize(scene: THREE.Scene): void {
    this.scene = scene;
    scene.add(this.sphereGroup);
    
    // Инициализируем аудио контекст
    this.initializeAudioAnalysis();
    
    console.log('✨ Central Sphere initialized');
  }

  private initializeAudioAnalysis(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      
      console.log('🎵 Audio analysis initialized for Central Sphere');
    } catch (error) {
      console.warn('⚠️ Failed to initialize audio analysis:', error);
    }
  }

  private createCoreMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pulseIntensity: { value: 0 },
        bassLevel: { value: 0 },
        trebleLevel: { value: 0 },
        genreColor: { value: new THREE.Color(0x00FFCC) },
        emissiveIntensity: { value: 1.0 }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        uniform float time;
        uniform float pulseIntensity;
        uniform float bassLevel;
        uniform float trebleLevel;
        
        void main() {
          vPosition = position;
          vNormal = normal;
          vUv = uv;
          
          // Создаем сложную деформацию поверхности
          vec3 pos = position;
          
          // Многослойные волны для органичной деформации
          float wave1 = sin(pos.x * 0.1 + time * 2.0) * sin(pos.y * 0.1 + time * 1.5) * sin(pos.z * 0.1 + time * 1.8);
          float wave2 = cos(pos.x * 0.15 + time * 1.2) * cos(pos.y * 0.12 + time * 2.1) * cos(pos.z * 0.13 + time * 1.6);
          float wave3 = sin(pos.x * 0.08 + time * 0.8) * cos(pos.y * 0.09 + time * 1.1) * sin(pos.z * 0.11 + time * 0.9);
          
          // Комбинируем волны для создания сложной поверхности
          float surfaceDisplacement = (wave1 * 0.4 + wave2 * 0.3 + wave3 * 0.3) * 2.0;
          
          // Музыкальная реактивность с более сложными паттернами
          float bassWave = sin(time * 4.0 + length(pos) * 0.1) * bassLevel;
          float trebleWave = sin(time * 8.0 + dot(pos, vec3(1.0, 0.5, 0.8)) * 0.2) * trebleLevel;
          float pulseWave = sin(time * 6.0 + pos.x * pos.y * 0.01) * pulseIntensity;
          
          // Основная пульсация с органичными изменениями
          float mainPulse = sin(time * 3.0) * cos(time * 1.7) * 0.5 + 0.5;
          float bassScale = 1.0 + bassLevel * mainPulse * 0.4;
          
          // Высокочастотные вибрации
          float trebleJitter = 1.0 + trebleLevel * sin(time * 12.0 + length(pos) * 0.3) * 0.15;
          
          // Общая пульсация с более плавными переходами
          float pulseScale = 1.0 + pulseIntensity * (sin(time * 2.5) * 0.3 + 0.7) * 0.5;
          
          // Применяем деформации
          pos += normalize(pos) * (surfaceDisplacement + bassWave + trebleWave + pulseWave) * 3.0;
          pos *= bassScale * trebleJitter * pulseScale;
          
          vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        uniform float time;
        uniform float pulseIntensity;
        uniform float bassLevel;
        uniform float trebleLevel;
        uniform vec3 genreColor;
        uniform float emissiveIntensity;
        
        // Функция для создания красивых градиентов
        vec3 createGradient(vec3 baseColor, vec3 pos, float time) {
          float gradient1 = sin(pos.x * 0.1 + time * 1.5) * 0.5 + 0.5;
          float gradient2 = cos(pos.y * 0.12 + time * 1.8) * 0.5 + 0.5;
          float gradient3 = sin(pos.z * 0.08 + time * 2.1) * 0.5 + 0.5;
          
          vec3 color1 = baseColor;
          vec3 color2 = baseColor * 1.5 + vec3(0.2, 0.1, 0.3);
          vec3 color3 = baseColor * 0.8 + vec3(0.1, 0.3, 0.2);
          
          return mix(mix(color1, color2, gradient1), color3, gradient2 * gradient3);
        }
        
        // Функция для создания энергетических паттернов
        float createEnergyPattern(vec3 pos, float time) {
          float pattern1 = sin(pos.x * 0.2 + time * 3.0) * cos(pos.y * 0.15 + time * 2.5);
          float pattern2 = cos(pos.z * 0.18 + time * 1.8) * sin(length(pos.xy) * 0.1 + time * 2.2);
          float pattern3 = sin(dot(pos, vec3(0.1, 0.12, 0.08)) + time * 4.0);
          
          return (pattern1 + pattern2 + pattern3) * 0.33;
        }
        
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          
          // Создаем базовый цвет с градиентами
          vec3 baseColor = createGradient(genreColor, vPosition, time);
          
          // Энергетические паттерны
          float energyPattern = createEnergyPattern(vPosition, time);
          
          // Музыкальная реактивность цвета
          float musicIntensity = (bassLevel + trebleLevel + pulseIntensity) / 3.0;
          vec3 musicColor = baseColor + genreColor * musicIntensity * 1.5;
          
          // Добавляем энергетические паттерны
          musicColor += baseColor * energyPattern * 0.8;
          
          // Создаем многослойный rim lighting
          float rimPower1 = 1.0 - max(0.0, dot(normal, viewDir));
          float rimPower2 = pow(rimPower1, 2.0);
          float rimPower3 = pow(rimPower1, 0.5);
          
          vec3 rimColor1 = genreColor * rimPower2 * 2.5;
          vec3 rimColor2 = genreColor * 1.3 * rimPower3 * 1.8;
          vec3 rimColor3 = genreColor * 0.7 * rimPower1 * 3.0;
          
          // Комбинируем все эффекты
          vec3 finalColor = musicColor + rimColor1 + rimColor2 + rimColor3;
          
          // Добавляем динамическое свечение
          float dynamicGlow = sin(time * 5.0) * 0.3 + 0.7;
          finalColor += baseColor * dynamicGlow * 0.5;
          
          // Усиливаем яркость на основе музыки
          float totalIntensity = emissiveIntensity * (1.5 + musicIntensity * 2.0);
          
          // Добавляем пульсирующее внутреннее свечение
          float innerGlow = sin(time * 4.0 + length(vPosition) * 0.1) * 0.4 + 0.6;
          finalColor += genreColor * innerGlow * musicIntensity * 1.2;
          
          gl_FragColor = vec4(finalColor * totalIntensity, 1.0);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
  } 
  private createParticleMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pulseIntensity: { value: 0 },
        bassLevel: { value: 0 },
        trebleLevel: { value: 0 },
        genreColor: { value: new THREE.Color(0x00FFCC) },
        size: { value: 8.0 }
      },
      vertexShader: `
        attribute float particleId;
        attribute vec3 velocity;
        varying float vParticleId;
        varying vec3 vVelocity;
        varying vec3 vPosition;
        uniform float time;
        uniform float pulseIntensity;
        uniform float bassLevel;
        uniform float trebleLevel;
        uniform float size;
        
        void main() {
          vParticleId = particleId;
          vVelocity = velocity;
          vPosition = position;
          
          // Динамический размер частиц с музыкальной реактивностью
          float musicSize = size * (1.0 + pulseIntensity * 0.8 + bassLevel * 0.6);
          
          // Добавляем индивидуальную пульсацию для каждой частицы
          float individualPulse = sin(time * 3.0 + particleId * 0.1) * 0.3 + 0.7;
          musicSize *= individualPulse;
          
          gl_PointSize = musicSize;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying float vParticleId;
        varying vec3 vVelocity;
        varying vec3 vPosition;
        uniform float time;
        uniform float pulseIntensity;
        uniform float bassLevel;
        uniform float trebleLevel;
        uniform vec3 genreColor;
        
        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          
          // Создаем красивую форму частицы с мягкими краями
          float particleShape = 1.0 - smoothstep(0.3, 0.5, dist);
          if (particleShape < 0.01) discard;
          
          // Создаем внутреннее свечение
          float innerGlow = 1.0 - smoothstep(0.0, 0.2, dist);
          float outerGlow = 1.0 - smoothstep(0.2, 0.4, dist);
          
          // Базовый цвет с градиентами
          vec3 color = genreColor;
          
          // Музыкальная реактивность цвета
          float musicIntensity = (bassLevel + trebleLevel + pulseIntensity) / 3.0;
          color += genreColor * musicIntensity * 1.2;
          
          // Добавляем цветовые вариации для каждой частицы
          float colorVariation = sin(vParticleId * 0.1 + time * 2.0) * 0.3;
          color += vec3(colorVariation * 0.2, colorVariation * 0.15, colorVariation * 0.25);
          
          // Создаем многослойное свечение
          vec3 finalColor = color * innerGlow * 2.0 + color * outerGlow * 0.8;
          
          // Добавляем пульсирующее свечение
          float pulse = sin(time * 4.0 + vParticleId * 0.05) * 0.4 + 0.6;
          finalColor *= pulse;
          
          // Динамическая прозрачность
          float alpha = particleShape * (0.6 + musicIntensity * 0.4) * pulse;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
  } 
 private createCoreSphere(): THREE.Mesh {
    const geometry = new THREE.IcosahedronGeometry(40, 3); // Очень большая детализированная сфера
    return new THREE.Mesh(geometry, this.coreMaterial);
  }



  private createParticleSystem(): THREE.Points {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const particleIds = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Случайные позиции в сфере (увеличенные для большой центральной сферы)
      const radius = 50 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      particleIds[i] = i;
      
      // Случайные скорости
      velocities[i3] = (Math.random() - 0.5) * 0.1;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('particleId', new THREE.BufferAttribute(particleIds, 1));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    
    return new THREE.Points(geometry, this.particleMaterial);
  }

  private createEnergyBeams(): THREE.Group {
    const beamsGroup = new THREE.Group();
    beamsGroup.name = 'EnergyBeams';
    return beamsGroup;
  }

  private createOrbitalParticles(): THREE.Group {
    const orbitalsGroup = new THREE.Group();
    orbitalsGroup.name = 'OrbitalParticles';
    
    // Создаем орбитальные кольца частиц с улучшенными эффектами
    for (let ring = 0; ring < 4; ring++) {
      const ringGroup = new THREE.Group();
      const radius = 65 + ring * 25; // Увеличенные и более разнесенные радиусы колец
      const particleCount = 60 + ring * 30;
      
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const particleIds = new Float32Array(particleCount);
      
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const i3 = i * 3;
        
        // Добавляем небольшие вариации в радиус для более органичного вида
        const radiusVariation = radius + (Math.random() - 0.5) * 8;
        
        positions[i3] = Math.cos(angle) * radiusVariation;
        positions[i3 + 1] = (Math.random() - 0.5) * 6; // Больше вертикального разброса
        positions[i3 + 2] = Math.sin(angle) * radiusVariation;
        
        particleIds[i] = i;
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('particleId', new THREE.BufferAttribute(particleIds, 1));
      
      // Создаем улучшенный шейдерный материал для орбитальных частиц
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          pulseIntensity: { value: 0 },
          bassLevel: { value: 0 },
          trebleLevel: { value: 0 },
          genreColor: { value: new THREE.Color(0x00FFCC) },
          size: { value: 5.0 + ring * 1.2 },
          ringIndex: { value: ring }
        },
        vertexShader: `
          attribute float particleId;
          uniform float time;
          uniform float pulseIntensity;
          uniform float bassLevel;
          uniform float trebleLevel;
          uniform float size;
          uniform float ringIndex;
          varying float vParticleId;
          varying float vRingIndex;
          
          void main() {
            vParticleId = particleId;
            vRingIndex = ringIndex;
            
            // Музыкально-реактивный размер с индивидуальными вариациями
            float musicSize = size * (1.0 + pulseIntensity * 0.6 + bassLevel * 0.4);
            float individualPulse = sin(time * 2.5 + particleId * 0.08 + ringIndex) * 0.25 + 0.75;
            musicSize *= individualPulse;
            
            gl_PointSize = musicSize;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform float pulseIntensity;
          uniform float bassLevel;
          uniform float trebleLevel;
          uniform vec3 genreColor;
          uniform float ringIndex;
          varying float vParticleId;
          varying float vRingIndex;
          
          void main() {
            vec2 center = gl_PointCoord - 0.5;
            float dist = length(center);
            
            // Создаем красивую форму частицы с мягким свечением
            float particleShape = 1.0 - smoothstep(0.35, 0.5, dist);
            if (particleShape < 0.01) discard;
            
            // Внутреннее и внешнее свечение
            float innerGlow = 1.0 - smoothstep(0.0, 0.25, dist);
            float outerGlow = 1.0 - smoothstep(0.25, 0.45, dist);
            
            // Цвет с музыкальной реактивностью
            vec3 color = genreColor;
            float musicIntensity = (bassLevel + trebleLevel + pulseIntensity) / 3.0;
            color += genreColor * musicIntensity * 0.8;
            
            // Индивидуальные цветовые вариации для каждого кольца
            float ringColorShift = sin(time * 1.5 + vRingIndex * 2.0) * 0.2;
            color += vec3(ringColorShift * 0.15, ringColorShift * 0.1, ringColorShift * 0.2);
            
            // Пульсирующее свечение
            float pulse = sin(time * 3.5 + vParticleId * 0.06 + vRingIndex * 0.8) * 0.3 + 0.7;
            
            // Финальный цвет с многослойным свечением
            vec3 finalColor = color * innerGlow * 1.8 + color * outerGlow * 0.6;
            finalColor *= pulse;
            
            // Различная интенсивность для разных колец
            float ringIntensity = 0.5 + vRingIndex * 0.15 + musicIntensity * 0.3;
            float alpha = particleShape * ringIntensity * pulse;
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending
      });
      
      const points = new THREE.Points(geometry, material);
      ringGroup.add(points);
      ringGroup.userData.ring = ring;
      ringGroup.userData.radius = radius;
      ringGroup.userData.material = material;
      
      orbitalsGroup.add(ringGroup);
    }
    
    return orbitalsGroup;
  }

  private createAuraSystem(): THREE.Group {
    const auraGroup = new THREE.Group();
    auraGroup.name = 'AuraSystem';
    
    // Создаем несколько слоев ауры с разными размерами и эффектами
    for (let layer = 0; layer < 3; layer++) {
      const auraGeometry = new THREE.SphereGeometry(50 + layer * 15, 32, 32);
      const auraMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          pulseIntensity: { value: 0 },
          bassLevel: { value: 0 },
          trebleLevel: { value: 0 },
          genreColor: { value: new THREE.Color(0x00FFCC) },
          layerIndex: { value: layer },
          opacity: { value: 0.15 - layer * 0.04 }
        },
        vertexShader: `
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec3 vWorldPosition;
          uniform float time;
          uniform float pulseIntensity;
          uniform float bassLevel;
          uniform float trebleLevel;
          uniform float layerIndex;
          
          void main() {
            vPosition = position;
            vNormal = normal;
            
            // Деформация ауры на основе музыки
            vec3 pos = position;
            float layerOffset = layerIndex * 0.5;
            
            // Волнообразные деформации
            float wave1 = sin(pos.x * 0.05 + time * 1.8 + layerOffset) * sin(pos.y * 0.04 + time * 1.3);
            float wave2 = cos(pos.z * 0.06 + time * 2.1 + layerOffset) * cos(pos.x * 0.03 + time * 1.6);
            
            // Музыкальная реактивность
            float musicDeformation = (bassLevel * 0.6 + pulseIntensity * 0.4) * 8.0;
            float displacement = (wave1 + wave2) * 3.0 + musicDeformation;
            
            pos += normalize(pos) * displacement;
            
            vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec3 vWorldPosition;
          uniform float time;
          uniform float pulseIntensity;
          uniform float bassLevel;
          uniform float trebleLevel;
          uniform vec3 genreColor;
          uniform float layerIndex;
          uniform float opacity;
          
          void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(cameraPosition - vWorldPosition);
            
            // Создаем эффект ауры с rim lighting
            float rimPower = 1.0 - abs(dot(normal, viewDir));
            rimPower = pow(rimPower, 1.5 + layerIndex * 0.5);
            
            // Цвет ауры с музыкальной реактивностью
            vec3 auraColor = genreColor * 0.8;
            float musicIntensity = (bassLevel + trebleLevel + pulseIntensity) / 3.0;
            auraColor += genreColor * musicIntensity * 1.2;
            
            // Пульсирующий эффект
            float pulse = sin(time * 4.0 + layerIndex * 1.5) * 0.4 + 0.6;
            auraColor *= pulse;
            
            // Энергетические паттерны
            float energyPattern = sin(vPosition.x * 0.1 + time * 2.0) * cos(vPosition.y * 0.08 + time * 1.7);
            auraColor += genreColor * energyPattern * 0.3;
            
            float finalAlpha = opacity * rimPower * (0.8 + musicIntensity * 0.4) * pulse;
            
            gl_FragColor = vec4(auraColor, finalAlpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false
      });
      
      const auraMesh = new THREE.Mesh(auraGeometry, auraMaterial);
      auraMesh.userData.layer = layer;
      auraMesh.userData.material = auraMaterial;
      auraGroup.add(auraMesh);
    }
    
    return auraGroup;
  }

  private createInnerGlow(): THREE.Mesh {
    const glowGeometry = new THREE.SphereGeometry(42, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pulseIntensity: { value: 0 },
        bassLevel: { value: 0 },
        trebleLevel: { value: 0 },
        genreColor: { value: new THREE.Color(0x00FFCC) }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        uniform float time;
        uniform float pulseIntensity;
        uniform float bassLevel;
        
        void main() {
          vPosition = position;
          vNormal = normal;
          
          // Легкая деформация для внутреннего свечения
          vec3 pos = position;
          float pulse = sin(time * 3.0) * 0.5 + 0.5;
          float scale = 1.0 + (bassLevel + pulseIntensity) * pulse * 0.1;
          pos *= scale;
          
          vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        uniform float time;
        uniform float pulseIntensity;
        uniform float bassLevel;
        uniform float trebleLevel;
        uniform vec3 genreColor;
        
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          
          // Внутреннее свечение с мягким переходом
          float fresnel = 1.0 - dot(normal, viewDir);
          fresnel = pow(fresnel, 0.8);
          
          // Цвет с музыкальной реактивностью
          vec3 glowColor = genreColor * 1.2;
          float musicIntensity = (bassLevel + trebleLevel + pulseIntensity) / 3.0;
          glowColor += genreColor * musicIntensity * 1.5;
          
          // Пульсирующее свечение
          float pulse = sin(time * 5.0) * 0.3 + 0.7;
          glowColor *= pulse;
          
          float alpha = fresnel * 0.25 * (0.7 + musicIntensity * 0.5);
          
          gl_FragColor = vec4(glowColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    });
    
    const innerGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    innerGlow.name = 'InnerGlow';
    innerGlow.userData.material = glowMaterial;
    return innerGlow;
  }

  private createOuterGlow(): THREE.Mesh {
    const glowGeometry = new THREE.SphereGeometry(120, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pulseIntensity: { value: 0 },
        bassLevel: { value: 0 },
        trebleLevel: { value: 0 },
        genreColor: { value: new THREE.Color(0x00FFCC) }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        uniform float time;
        uniform float pulseIntensity;
        uniform float bassLevel;
        
        void main() {
          vPosition = position;
          vNormal = normal;
          
          // Большие волнообразные деформации для внешнего свечения
          vec3 pos = position;
          float wave = sin(length(pos) * 0.02 + time * 1.5) * 5.0;
          float musicWave = (bassLevel + pulseIntensity) * sin(time * 2.0) * 8.0;
          
          pos += normalize(pos) * (wave + musicWave);
          
          vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        uniform float time;
        uniform float pulseIntensity;
        uniform float bassLevel;
        uniform float trebleLevel;
        uniform vec3 genreColor;
        
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          
          // Очень мягкое внешнее свечение
          float fresnel = 1.0 - dot(normal, viewDir);
          fresnel = pow(fresnel, 2.5);
          
          // Расстояние от центра для градиента
          float distanceFromCenter = length(vPosition) / 120.0;
          float falloff = 1.0 - smoothstep(0.7, 1.0, distanceFromCenter);
          
          // Цвет с очень мягкой музыкальной реактивностью
          vec3 glowColor = genreColor * 0.6;
          float musicIntensity = (bassLevel + trebleLevel + pulseIntensity) / 3.0;
          glowColor += genreColor * musicIntensity * 0.8;
          
          // Медленное пульсирующее свечение
          float pulse = sin(time * 2.0) * 0.2 + 0.8;
          glowColor *= pulse;
          
          float alpha = fresnel * falloff * 0.08 * (0.5 + musicIntensity * 0.3);
          
          gl_FragColor = vec4(glowColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    });
    
    const outerGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    outerGlow.name = 'OuterGlow';
    outerGlow.userData.material = glowMaterial;
    return outerGlow;
  }

  // Методы для управления эффектами
  setCurrentTrack(track: CrystalTrack | undefined): void {
    this.currentTrack = track;
    
    if (track) {
      // Обновляем цвета на основе жанра трека
      const genreColor = new THREE.Color(track.color);
      this.coreMaterial.uniforms.genreColor.value = genreColor;
      this.particleMaterial.uniforms.genreColor.value = genreColor;
      
      // Обновляем цвета орбитальных частиц
      this.updateOrbitalParticleColors(genreColor);
      
      console.log(`🎵 Central Sphere adapted to track: ${track.name} (${track.genre})`);
    }
  }

  private updateOrbitalParticleColors(genreColor: THREE.Color): void {
    // Обновляем цвета орбитальных частиц
    this.orbitalParticles.children.forEach(ringGroup => {
      const material = ringGroup.userData.material;
      if (material && material.uniforms && material.uniforms.genreColor) {
        material.uniforms.genreColor.value = genreColor;
      }
    });
    
    // Обновляем цвета системы ауры
    this.auraSystem.children.forEach(auraMesh => {
      const material = auraMesh.userData.material;
      if (material && material.uniforms && material.uniforms.genreColor) {
        material.uniforms.genreColor.value = genreColor;
      }
    });
    
    // Обновляем цвета внутреннего и внешнего свечения
    if (this.innerGlow.userData.material && this.innerGlow.userData.material.uniforms.genreColor) {
      this.innerGlow.userData.material.uniforms.genreColor.value = genreColor;
    }
    
    if (this.outerGlow.userData.material && this.outerGlow.userData.material.uniforms.genreColor) {
      this.outerGlow.userData.material.uniforms.genreColor.value = genreColor;
    }
  }

  async connectAudioSource(audioElement: HTMLAudioElement): Promise<void> {
    if (!this.audioContext || !this.analyser) {
      console.warn('⚠️ Audio analysis not initialized');
      return;
    }

    try {
      // Проверяем, что аудио контекст не заблокирован
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('🎵 Audio context resumed');
      }

      // Если уже подключен, отключаем предыдущий источник
      if (this.audioSource) {
        try {
          this.audioSource.disconnect();
          console.log('🔌 Disconnected previous audio source');
        } catch (error) {
          console.warn('⚠️ Failed to disconnect previous audio source:', error);
        }
        this.audioSource = undefined;
      }

      // Пробуем создать новый источник
      try {
        // Проверяем, не подключен ли уже элемент к другому контексту
        if ((audioElement as any).audioSourceNode) {
          console.log('🔄 Audio element already has source node, using alternative approach');
          throw new Error('Audio element already connected');
        }

        this.audioSource = this.audioContext.createMediaElementSource(audioElement);
        
        // Сохраняем ссылку на источник в элементе для отслеживания
        (audioElement as any).audioSourceNode = this.audioSource;
        
        this.audioSource.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        this.isAudioConnected = true;
        
        console.log('🔗 Audio source connected to Central Sphere (MediaElementSource)');
        
        // Тестируем получение данных
        this.testAudioData();
        
      } catch (sourceError) {
        console.warn('⚠️ Cannot create MediaElementSource, using enhanced fallback:', sourceError);
        
        // Используем улучшенный fallback анализ
        this.isAudioConnected = true;
        this.startEnhancedFallbackAnalysis(audioElement);
        
        console.log('🔗 Using enhanced fallback audio analysis for Central Sphere');
      }
      
      console.log('🎵 Audio context state:', this.audioContext.state);
      console.log('🎵 Analyser frequency bin count:', this.analyser?.frequencyBinCount);
      console.log('🎵 Audio element duration:', audioElement.duration);
      console.log('🎵 Audio element current time:', audioElement.currentTime);
      console.log('🎵 Audio element paused:', audioElement.paused);
      console.log('🎵 Audio element volume:', audioElement.volume);
      
    } catch (error) {
      console.error('❌ Failed to connect audio source:', error);
      this.isAudioConnected = false;
    }
  }

  private testAudioData(): void {
    if (!this.analyser || !this.dataArray) return;
    
    // Тестируем получение аудио данных
    const testInterval = setInterval(() => {
      if (!this.analyser || !this.dataArray || !this.isAudioConnected) {
        clearInterval(testInterval);
        return;
      }
      
      const tempArray = new Uint8Array(this.dataArray.length);
      this.analyser.getByteFrequencyData(tempArray);
      
      const totalEnergy = tempArray.reduce((a, b) => a + b, 0);
      console.log(`🎵 Audio Data Test - Total Energy: ${totalEnergy}, Sample: [${tempArray.slice(0, 5).join(', ')}]`);
      
      if (totalEnergy > 0) {
        console.log('✅ Real audio data detected, stopping test');
        clearInterval(testInterval);
      }
    }, 1000);
    
    // Останавливаем тест через 5 секунд
    setTimeout(() => {
      clearInterval(testInterval);
    }, 5000);
  }

  private startEnhancedFallbackAnalysis(audioElement: HTMLAudioElement): void {
    console.log('🎵 Starting enhanced fallback audio analysis');
    
    // Очищаем предыдущий интервал если есть
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
    }
    
    this.fallbackInterval = window.setInterval(() => {
      if (audioElement.paused || audioElement.ended) {
        if (this.fallbackInterval) {
          clearInterval(this.fallbackInterval);
          this.fallbackInterval = undefined;
        }
        this.isAudioConnected = false;
        console.log('🎵 Enhanced fallback audio analysis stopped');
        return;
      }
      
      // Создаем более реалистичные псевдо-аудио данные
      const time = audioElement.currentTime;
      const volume = audioElement.volume;
      
      // Более сложные паттерны для имитации музыки
      const bassPattern1 = Math.sin(time * 1.2 + Math.sin(time * 0.3) * 2) * 0.5;
      const bassPattern2 = Math.sin(time * 2.1 + Math.cos(time * 0.7) * 1.5) * 0.3;
      const bassPattern3 = Math.sin(time * 0.9 + Math.sin(time * 1.1) * 0.8) * 0.4;
      
      // Комбинируем паттерны для басов
      this.bassLevel = Math.abs(bassPattern1 + bassPattern2 + bassPattern3) * volume * 0.8;
      
      // Высокие частоты с более быстрыми и хаотичными изменениями
      const treblePattern1 = Math.sin(time * 7.3 + Math.sin(time * 2.1) * 3) * 0.4;
      const treblePattern2 = Math.sin(time * 9.7 + Math.cos(time * 3.2) * 2) * 0.3;
      const treblePattern3 = Math.sin(time * 12.1 + Math.sin(time * 4.5) * 1.5) * 0.2;
      
      // Комбинируем паттерны для высоких частот
      this.trebleLevel = Math.abs(treblePattern1 + treblePattern2 + treblePattern3) * volume * 0.7;
      
      // Добавляем более реалистичную случайность
      const bassNoise = (Math.random() - 0.5) * 0.4 * volume;
      const trebleNoise = (Math.random() - 0.5) * 0.3 * volume;
      
      this.bassLevel = Math.max(0, Math.min(1, this.bassLevel + bassNoise));
      this.trebleLevel = Math.max(0, Math.min(1, this.trebleLevel + trebleNoise));
      
      // Общая интенсивность с более сложной формулой
      const midLevel = (this.bassLevel + this.trebleLevel) * 0.5;
      this.pulseIntensity = (this.bassLevel * 0.5 + midLevel * 0.3 + this.trebleLevel * 0.2);
      this.pulseIntensity = Math.max(0, Math.min(1, this.pulseIntensity));
      
      // Отладочная информация каждые 3 секунды
      if (Math.floor(time * 10) % 30 === 0 && Math.floor(time * 100) % 100 === 0) {
        console.log(`🎵 Enhanced Fallback - Bass: ${this.bassLevel.toFixed(3)}, Treble: ${this.trebleLevel.toFixed(3)}, Pulse: ${this.pulseIntensity.toFixed(3)}`);
      }
      
    }, 33); // Обновляем каждые 33мс (30 FPS для более плавной анимации)
  }

  private startFallbackAudioAnalysis(audioElement: HTMLAudioElement): void {
    // Оставляем старый метод для совместимости
    this.startEnhancedFallbackAnalysis(audioElement);
  }

  // Энергетические лучи убраны по запросу пользователя

  update(deltaTime: number): void {
    this.time += deltaTime * 0.001;
    
    // Анализируем аудио если доступно
    this.analyzeAudio();
    
    // Используем только реальные аудио данные для чистого эффекта
    
    // Обновляем униформы материалов
    this.updateMaterialUniforms();
    
    // Анимируем частицы
    this.animateParticles(deltaTime);
    
    // Анимируем орбитальные частицы
    this.animateOrbitalParticles(deltaTime);
    
    // Обновляем энергетические лучи
    this.updateEnergyBeams();
  }

  private analyzeAudio(): void {
    if (!this.isAudioConnected) return;
    
    // Если есть реальный анализатор, используем его
    if (this.analyser && this.dataArray && this.audioSource) {
      try {
        // Создаем временный массив с правильным типом
        const tempArray = new Uint8Array(this.dataArray.length);
        this.analyser.getByteFrequencyData(tempArray);
        
        // Проверяем, есть ли реальные данные
        const totalEnergy = tempArray.reduce((a, b) => a + b, 0);
        
        if (totalEnergy > 0) {
          // Копируем данные в наш массив
          for (let i = 0; i < tempArray.length; i++) {
            this.dataArray[i] = tempArray[i];
          }
          
          // Анализируем частоты с более широкими диапазонами
          const bassRange = this.dataArray.slice(0, 12);     // Низкие частоты (0-12)
          const lowMidRange = this.dataArray.slice(12, 30);  // Низкие средние (12-30)
          const midRange = this.dataArray.slice(30, 60);     // Средние частоты (30-60)
          const highMidRange = this.dataArray.slice(60, 90); // Высокие средние (60-90)
          const trebleRange = this.dataArray.slice(90, 128); // Высокие частоты (90-128)
          
          // Вычисляем средние значения с усилением для высоких частот
          const newBassLevel = bassRange.reduce((a, b) => a + b, 0) / (bassRange.length * 255);
          const newLowMidLevel = lowMidRange.reduce((a, b) => a + b, 0) / (lowMidRange.length * 255);
          const newMidLevel = midRange.reduce((a, b) => a + b, 0) / (midRange.length * 255);
          const newHighMidLevel = highMidRange.reduce((a, b) => a + b, 0) / (highMidRange.length * 255);
          const newTrebleLevel = trebleRange.reduce((a, b) => a + b, 0) / (trebleRange.length * 255);
          
          // Усиливаем высокие частоты, так как они обычно тише
          const amplifiedTreble = newTrebleLevel * 2.0; // Усиливаем в 2 раза
          const amplifiedHighMid = newHighMidLevel * 1.5; // Усиливаем в 1.5 раза
          
          // Комбинируем частоты для более выразительного эффекта
          const combinedBass = (newBassLevel * 0.8 + newLowMidLevel * 0.2);
          const combinedTreble = Math.min(1.0, (amplifiedHighMid * 0.3 + amplifiedTreble * 0.7));
          
          // Обновляем уровни с более быстрой реакцией (меньше сглаживания)
          this.bassLevel = this.bassLevel * 0.3 + combinedBass * 0.7;
          const midLevel = this.trebleLevel * 0.3 + newMidLevel * 0.7;
          this.trebleLevel = this.trebleLevel * 0.3 + combinedTreble * 0.7;
          
          // Общая интенсивность пульсации
          this.pulseIntensity = (this.bassLevel + midLevel + this.trebleLevel) / 3;
          
          // Отладочная информация каждые 60 кадров (примерно раз в секунду)
          if (Math.floor(this.time * 60) % 60 === 0) {
            console.log(`🎵 Real Audio Analysis - Bass: ${this.bassLevel.toFixed(3)}, Treble: ${this.trebleLevel.toFixed(3)}, Pulse: ${this.pulseIntensity.toFixed(3)}, Total Energy: ${totalEnergy}`);
            console.log(`🎵 Raw frequency data - Bass range: [${bassRange.slice(0, 3).join(', ')}], Treble range: [${trebleRange.slice(0, 3).join(', ')}]`);
            console.log(`🎵 Amplified values - HighMid: ${amplifiedHighMid.toFixed(3)}, Treble: ${amplifiedTreble.toFixed(3)}, Combined: ${combinedTreble.toFixed(3)}`);
          }
          
          return; // Успешно получили реальные данные
        }
      } catch (error) {
        console.warn('⚠️ Error in real audio analysis, fallback should handle this:', error);
      }
    }
    
    // Если мы здесь, значит используется fallback анализ
    // Fallback анализ обновляет bassLevel, trebleLevel и pulseIntensity напрямую
    // в методе startEnhancedFallbackAnalysis, поэтому здесь ничего не делаем
    
    // Отладочная информация для fallback режима каждые 60 кадров
    if (Math.floor(this.time * 60) % 60 === 0) {
      console.log(`🎵 Fallback Audio Analysis - Bass: ${this.bassLevel.toFixed(3)}, Treble: ${this.trebleLevel.toFixed(3)}, Pulse: ${this.pulseIntensity.toFixed(3)}`);
    }
  }

  private updateMaterialUniforms(): void {
    // Обновляем униформы для всех материалов
    const uniforms = {
      time: this.time,
      pulseIntensity: this.pulseIntensity,
      bassLevel: this.bassLevel,
      trebleLevel: this.trebleLevel
    };
    
    // Минимальная отладка только при необходимости
    if (this.isAudioConnected && Math.floor(this.time * 15) % 300 === 0) {
      console.log(`🎨 Central Sphere Audio Reactive - Bass: ${this.bassLevel.toFixed(2)}, Treble: ${this.trebleLevel.toFixed(2)}, Pulse: ${this.pulseIntensity.toFixed(2)}`);
    }
    
    // Обновляем основные материалы
    Object.entries(uniforms).forEach(([key, value]) => {
      if (this.coreMaterial.uniforms[key]) {
        this.coreMaterial.uniforms[key].value = value;
      }

      if (this.particleMaterial.uniforms[key]) {
        this.particleMaterial.uniforms[key].value = value;
      }
    });
    
    // Обновляем униформы орбитальных частиц
    this.updateOrbitalParticleUniforms(uniforms);
    
    // Обновляем униформы системы ауры
    this.updateAuraSystemUniforms(uniforms);
    
    // Обновляем униформы внутреннего и внешнего свечения
    this.updateGlowUniforms(uniforms);
  }

  private updateOrbitalParticleUniforms(uniforms: any): void {
    this.orbitalParticles.children.forEach(ringGroup => {
      const material = ringGroup.userData.material;
      if (material && material.uniforms) {
        Object.entries(uniforms).forEach(([key, value]) => {
          if (material.uniforms[key]) {
            material.uniforms[key].value = value;
          }
        });
      }
    });
  }

  private updateAuraSystemUniforms(uniforms: any): void {
    this.auraSystem.children.forEach(auraMesh => {
      const material = auraMesh.userData.material;
      if (material && material.uniforms) {
        Object.entries(uniforms).forEach(([key, value]) => {
          if (material.uniforms[key]) {
            material.uniforms[key].value = value;
          }
        });
      }
    });
  }

  private updateGlowUniforms(uniforms: any): void {
    // Обновляем внутреннее свечение
    if (this.innerGlow.userData.material && this.innerGlow.userData.material.uniforms) {
      Object.entries(uniforms).forEach(([key, value]) => {
        if (this.innerGlow.userData.material.uniforms[key]) {
          this.innerGlow.userData.material.uniforms[key].value = value;
        }
      });
    }
    
    // Обновляем внешнее свечение
    if (this.outerGlow.userData.material && this.outerGlow.userData.material.uniforms) {
      Object.entries(uniforms).forEach(([key, value]) => {
        if (this.outerGlow.userData.material.uniforms[key]) {
          this.outerGlow.userData.material.uniforms[key].value = value;
        }
      });
    }
  }

  private animateParticles(deltaTime: number): void {
    const positions = this.particleSystem.geometry.attributes.position;
    const velocities = this.particleSystem.geometry.attributes.velocity;
    
    if (!positions || !velocities) return;
    
    const posArray = positions.array as Float32Array;
    const velArray = velocities.array as Float32Array;
    
    for (let i = 0; i < posArray.length; i += 3) {
      // Простое базовое движение без музыкальной реактивности
      posArray[i] += velArray[i] * deltaTime;
      posArray[i + 1] += velArray[i + 1] * deltaTime;
      posArray[i + 2] += velArray[i + 2] * deltaTime;
      
      // Ограничиваем частицы в увеличенной сфере (соответствует большой центральной сфере)
      const distance = Math.sqrt(posArray[i] ** 2 + posArray[i + 1] ** 2 + posArray[i + 2] ** 2);
      if (distance > 90) {
        // Возвращаем частицу к центру
        const factor = 60 / distance;
        posArray[i] *= factor;
        posArray[i + 1] *= factor;
        posArray[i + 2] *= factor;
        
        // Обращаем скорость
        velArray[i] *= -0.5;
        velArray[i + 1] *= -0.5;
        velArray[i + 2] *= -0.5;
      }
    }
    
    positions.needsUpdate = true;
  }

  private animateOrbitalParticles(deltaTime: number): void {
    this.orbitalParticles.children.forEach((ringGroup, index) => {
      // Только базовое вращение без музыкальной реактивности
      const rotationSpeed = 0.001 + index * 0.0005;
      ringGroup.rotation.y += rotationSpeed * deltaTime;
      
      // Сбрасываем позицию и масштаб к базовым значениям
      ringGroup.position.set(0, 0, 0);
      ringGroup.scale.setScalar(1.0);
    });
  }

  private updateEnergyBeams(): void {
    this.energyBeams.children.forEach(beam => {
      if (beam instanceof THREE.Line && beam.material instanceof THREE.ShaderMaterial) {
        beam.material.uniforms.time.value = this.time;
        beam.material.uniforms.intensity.value = 1.0 + this.pulseIntensity * 0.5;
      }
    });
  }

  // Методы для создания цветовых волн по жанрам
  createGenreWave(genre: string, color: THREE.Color): void {
    // Создаем волну, распространяющуюся к кристаллам того же жанра
    const waveGeometry = new THREE.RingGeometry(0, 150, 32);
    const waveMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        waveStart: { value: this.time },
        color: { value: color },
        opacity: { value: 0.3 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float waveStart;
        uniform vec3 color;
        uniform float opacity;
        varying vec2 vUv;
        
        void main() {
          float dist = length(vUv - 0.5) * 2.0;
          float wave = time - waveStart;
          
          // Волна распространяется от центра
          float waveIntensity = 1.0 - abs(dist - wave * 0.5);
          waveIntensity = max(0.0, waveIntensity);
          waveIntensity = pow(waveIntensity, 3.0);
          
          float alpha = opacity * waveIntensity;
          if (alpha < 0.01) discard;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    
    const wave = new THREE.Mesh(waveGeometry, waveMaterial);
    wave.rotation.x = -Math.PI / 2; // Горизонтальная ориентация
    wave.name = `GenreWave_${genre}`;
    
    this.sphereGroup.add(wave);
    
    // Удаляем волну через 3 секунды
    setTimeout(() => {
      this.sphereGroup.remove(wave);
      waveGeometry.dispose();
      waveMaterial.dispose();
    }, 3000);
  }

  // Методы для управления размером и интенсивностью
  setSize(scale: number): void {
    this.sphereGroup.scale.setScalar(scale);
  }

  setIntensity(intensity: number): void {
    this.coreMaterial.uniforms.emissiveIntensity.value = intensity;
  }

  // Получение объекта для добавления в сцену
  getObject(): THREE.Group {
    return this.sphereGroup;
  }

  // Очистка ресурсов
  dispose(): void {
    console.log('🗑️ Disposing Central Sphere...');
    
    // Останавливаем fallback анализ
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = undefined;
    }
    
    // Отключаем аудио источник
    if (this.audioSource) {
      try {
        this.audioSource.disconnect();
      } catch (error) {
        console.warn('⚠️ Error disconnecting audio source:', error);
      }
      this.audioSource = undefined;
    }
    
    // Закрываем аудио контекст
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (error) {
        console.warn('⚠️ Error closing audio context:', error);
      }
    }
    
    // Освобождаем геометрии
    this.coreSphere.geometry.dispose();
    this.particleSystem.geometry.dispose();
    
    // Освобождаем материалы
    this.coreMaterial.dispose();
    this.particleMaterial.dispose();
    
    // Очищаем орбитальные частицы
    this.orbitalParticles.children.forEach(child => {
      if (child instanceof THREE.Group) {
        child.children.forEach(points => {
          if (points instanceof THREE.Points) {
            points.geometry.dispose();
            if (points.material instanceof THREE.Material) {
              points.material.dispose();
            }
          }
        });
      }
    });
    
    // Очищаем систему ауры
    this.auraSystem.children.forEach(auraMesh => {
      if (auraMesh instanceof THREE.Mesh) {
        auraMesh.geometry.dispose();
        if (auraMesh.material instanceof THREE.Material) {
          auraMesh.material.dispose();
        }
      }
    });
    
    // Очищаем внутреннее и внешнее свечение
    if (this.innerGlow) {
      this.innerGlow.geometry.dispose();
      if (this.innerGlow.material instanceof THREE.Material) {
        this.innerGlow.material.dispose();
      }
    }
    
    if (this.outerGlow) {
      this.outerGlow.geometry.dispose();
      if (this.outerGlow.material instanceof THREE.Material) {
        this.outerGlow.material.dispose();
      }
    }
    
    // Удаляем из сцены
    if (this.scene) {
      this.scene.remove(this.sphereGroup);
    }
    
    // Сбрасываем состояние
    this.isAudioConnected = false;
    this.bassLevel = 0;
    this.trebleLevel = 0;
    this.pulseIntensity = 0;
    
    console.log('✅ Central Sphere disposed');
  }
}