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
    
    // Создаем компоненты сферы (без ауры)
    this.coreSphere = this.createCoreSphere();
    this.particleSystem = this.createParticleSystem();
    this.energyBeams = this.createEnergyBeams();
    this.orbitalParticles = this.createOrbitalParticles();
    
    // Добавляем все в группу (без ауры)
    this.sphereGroup.add(this.coreSphere);
    this.sphereGroup.add(this.particleSystem);
    this.sphereGroup.add(this.energyBeams);
    this.sphereGroup.add(this.orbitalParticles);
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
        uniform float time;
        uniform float pulseIntensity;
        uniform float bassLevel;
        uniform float trebleLevel;
        
        void main() {
          vPosition = position;
          vNormal = normal;
          vUv = uv;
          
          // Сохраняем идеальную сферическую форму
          vec3 pos = position;
          
          // Плавная но интенсивная пульсация
          float smoothPulse = sin(time * 3.0) * 0.5 + 0.5;  // Медленная плавная волна
          float bassScale = 1.0 + bassLevel * smoothPulse * 0.6;  // Более интенсивное увеличение по басам (до 60%)
          
          // Плавное дрожание высоких частот
          float trebleWave = sin(time * 8.0 + cos(time * 2.0)) * 0.5 + 0.5;
          float trebleJitter = 1.0 + trebleLevel * trebleWave * 0.3;  // Плавное дрожание
          
          // Основная пульсация с более интенсивным эффектом
          float mainPulse = sin(time * 4.0) * sin(time * 1.5) * 0.5 + 0.5;  // Сложная плавная волна
          float pulseScale = 1.0 + pulseIntensity * mainPulse * 0.8;  // Очень интенсивная пульсация (до 80%)
          
          // Дополнительные плавные волны для более богатого эффекта
          float secondaryPulse = cos(time * 2.5 + sin(time * 0.8)) * 0.3 + 0.7;  // Вторичная волна
          float bassWave = smoothstep(0.3, 1.0, bassLevel) * secondaryPulse * 0.4;  // Плавный переход басов
          float trebleWave2 = smoothstep(0.2, 1.0, trebleLevel) * sin(time * 6.0) * 0.2;  // Плавные высокие частоты
          
          // Комбинируем все масштабы плавно
          float totalScale = bassScale * trebleJitter * pulseScale + bassWave + trebleWave2;
          pos *= totalScale;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        uniform float time;
        uniform float pulseIntensity;
        uniform float bassLevel;
        uniform float trebleLevel;
        uniform vec3 genreColor;
        uniform float emissiveIntensity;
        
        void main() {
          vec3 normal = normalize(vNormal);
          
          // Однородный неоновый цвет без узоров
          vec3 color = genreColor;
          
          // Усиливаем яркость для неонового эффекта
          color *= 1.5;
          
          // Добавляем интенсивное свечение на основе музыки
          float musicIntensity = (bassLevel + trebleLevel + pulseIntensity) / 3.0;
          color += genreColor * musicIntensity * 2.0;  // Очень яркое свечение
          
          // Создаем мощный rim lighting эффект для неонового свечения
          float rimLight = 1.0 - abs(dot(normal, vec3(0.0, 0.0, 1.0)));
          rimLight = pow(rimLight, 1.5);  // Более мягкий переход
          color += genreColor * rimLight * 3.0;  // Очень яркий rim light
          
          // Динамическое эмиссивное свечение с высокой интенсивностью
          float emissive = emissiveIntensity * 2.0 + musicIntensity * 3.0;
          
          // Добавляем дополнительное свечение для неонового эффекта
          color += genreColor * 0.8;  // Базовое свечение
          
          gl_FragColor = vec4(color * emissive, 1.0);
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
        size: { value: 2.0 }
      },
      vertexShader: `
        attribute float particleId;
        attribute vec3 velocity;
        varying float vParticleId;
        varying vec3 vVelocity;
        uniform float time;
        uniform float pulseIntensity;
        uniform float bassLevel;
        uniform float trebleLevel;
        uniform float size;
        
        void main() {
          vParticleId = particleId;
          vVelocity = velocity;
          
          // Статичный размер частиц без музыкальной реактивности
          gl_PointSize = size;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying float vParticleId;
        varying vec3 vVelocity;
        uniform float time;
        uniform float pulseIntensity;
        uniform float bassLevel;
        uniform float trebleLevel;
        uniform vec3 genreColor;
        
        void main() {
          // Круглые частицы
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          if (dist > 0.5) discard;
          
          // Цвет с реактивностью
          vec3 color = genreColor;
          color += vec3(bassLevel * 0.3, trebleLevel * 0.2, pulseIntensity * 0.4);
          
          float alpha = (1.0 - dist * 2.0) * (0.7 + pulseIntensity * 0.3);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending
    });
  } 
 private createCoreSphere(): THREE.Mesh {
    const geometry = new THREE.IcosahedronGeometry(8, 3); // Детализированная сфера
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
      
      // Случайные позиции в сфере
      const radius = 15 + Math.random() * 10;
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
    
    // Создаем орбитальные кольца частиц
    for (let ring = 0; ring < 3; ring++) {
      const ringGroup = new THREE.Group();
      const radius = 20 + ring * 8;
      const particleCount = 50 + ring * 20;
      
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const particleIds = new Float32Array(particleCount);
      
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const i3 = i * 3;
        
        positions[i3] = Math.cos(angle) * radius;
        positions[i3 + 1] = (Math.random() - 0.5) * 4;
        positions[i3 + 2] = Math.sin(angle) * radius;
        
        particleIds[i] = i;
      }
      
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('particleId', new THREE.BufferAttribute(particleIds, 1));
      
      // Создаем шейдерный материал для орбитальных частиц
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          pulseIntensity: { value: 0 },
          bassLevel: { value: 0 },
          trebleLevel: { value: 0 },
          genreColor: { value: new THREE.Color(0x00FFCC) },
          size: { value: 1.5 + ring * 0.3 },
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
          
          void main() {
            vParticleId = particleId;
            
            // Статичный размер частиц без музыкальной реактивности
            gl_PointSize = size;
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
          
          void main() {
            // Круглые частицы
            vec2 center = gl_PointCoord - 0.5;
            float dist = length(center);
            if (dist > 0.5) discard;
            
            // Статичный цвет без музыкальной реактивности
            vec3 color = genreColor;
            
            // Различная интенсивность для разных колец (статичная)
            float ringIntensity = 0.6 + ringIndex * 0.2;
            float alpha = (1.0 - dist * 2.0) * ringIntensity;
            
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending
      });
      
      const points = new THREE.Points(geometry, material);
      ringGroup.add(points);
      ringGroup.userData.ring = ring;
      ringGroup.userData.radius = radius;
      ringGroup.userData.material = material; // Сохраняем ссылку на материал
      
      orbitalsGroup.add(ringGroup);
    }
    
    return orbitalsGroup;
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
    this.orbitalParticles.children.forEach(ringGroup => {
      const material = ringGroup.userData.material;
      if (material && material.uniforms && material.uniforms.genreColor) {
        material.uniforms.genreColor.value = genreColor;
      }
    });
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
      
      // Ограничиваем частицы в фиксированной сфере
      const distance = Math.sqrt(posArray[i] ** 2 + posArray[i + 1] ** 2 + posArray[i + 2] ** 2);
      if (distance > 25) {
        // Возвращаем частицу к центру
        const factor = 15 / distance;
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