/**
 * ParticleSystem - система частиц для создания визуальных эффектов
 * Включает звездное поле, частицы вокруг объектов и другие эффекты
 */

import * as THREE from 'three';
// TrackObject import removed - Soul Galaxy handles its own particle effects

export class ParticleSystem {
  private scene?: THREE.Scene;
  private camera?: THREE.Camera;
  
  // Звездное поле
  private starField?: THREE.Points;
  private starGeometry?: THREE.BufferGeometry;
  private starMaterial?: THREE.PointsMaterial;
  private starCount: number = 2000;
  
  // Частицы вокруг выбранного объекта
  private selectionParticles?: THREE.Points;
  private selectionGeometry?: THREE.BufferGeometry;
  private selectionMaterial?: THREE.PointsMaterial;
  private selectionParticleCount: number = 100;
  private selectedTrackId?: string;
  
  // Анимационные параметры
  private time: number = 0;
  private animationSpeed: number = 0.001;
  
  constructor() {
    console.log('✨ ParticleSystem создан');
  }

  initialize(scene: THREE.Scene, camera: THREE.Camera): void {
    this.scene = scene;
    this.camera = camera;
    
    this.createStarField();
    this.createSelectionParticles();
    
    console.log('✨ ParticleSystem инициализирован');
  }

  /**
   * Создает звездное поле на заднем плане
   */
  private createStarField(): void {
    if (!this.scene) return;

    // Создаем геометрию для звезд
    this.starGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.starCount * 3);
    const colors = new Float32Array(this.starCount * 3);
    const sizes = new Float32Array(this.starCount);

    // Генерируем случайные позиции звезд в сферическом пространстве
    for (let i = 0; i < this.starCount; i++) {
      const i3 = i * 3;
      
      // Сферическое распределение
      const radius = 200 + Math.random() * 300; // Звезды далеко от центра
      const theta = Math.random() * Math.PI * 2; // Азимутальный угол
      const phi = Math.acos(2 * Math.random() - 1); // Полярный угол
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      // Случайные цвета звезд (от белого до голубоватого)
      const colorVariation = 0.8 + Math.random() * 0.2;
      colors[i3] = colorVariation; // R
      colors[i3 + 1] = colorVariation; // G
      colors[i3 + 2] = Math.min(1, colorVariation + Math.random() * 0.3); // B (слегка голубоватый)
      
      // Случайные размеры звезд
      sizes[i] = Math.random() * 2 + 0.5;
    }

    this.starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Создаем материал для звезд
    this.starMaterial = new THREE.PointsMaterial({
      size: 1.5,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    // Создаем систему частиц для звезд
    this.starField = new THREE.Points(this.starGeometry, this.starMaterial);
    this.scene.add(this.starField);

    console.log(`⭐ Создано звездное поле с ${this.starCount} звездами`);
  }

  /**
   * Создает частицы для эффектов вокруг выбранного объекта
   */
  private createSelectionParticles(): void {
    if (!this.scene) return;

    // Создаем геометрию для частиц выбора
    this.selectionGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.selectionParticleCount * 3);
    const colors = new Float32Array(this.selectionParticleCount * 3);
    const sizes = new Float32Array(this.selectionParticleCount);
    const velocities = new Float32Array(this.selectionParticleCount * 3);

    // Инициализируем частицы (изначально невидимые)
    for (let i = 0; i < this.selectionParticleCount; i++) {
      const i3 = i * 3;
      
      // Начальные позиции (будут обновлены при выборе объекта)
      positions[i3] = 0;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = 0;
      
      // Золотистые цвета для частиц выбора
      colors[i3] = 1.0; // R
      colors[i3 + 1] = 0.8; // G
      colors[i3 + 2] = 0.2; // B
      
      // Размеры частиц
      sizes[i] = Math.random() * 1.5 + 0.5;
      
      // Случайные скорости
      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    this.selectionGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.selectionGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.selectionGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.selectionGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    // Создаем материал для частиц выбора
    this.selectionMaterial = new THREE.PointsMaterial({
      size: 2.0,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.0, // Изначально невидимые
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    // Создаем систему частиц для выбора
    this.selectionParticles = new THREE.Points(this.selectionGeometry, this.selectionMaterial);
    this.scene.add(this.selectionParticles);

    console.log(`✨ Создана система частиц выбора с ${this.selectionParticleCount} частицами`);
  }

  /**
   * Активирует частицы вокруг выбранного объекта
   */
  activateSelectionParticles(trackId: string): void {
    if (!this.selectionGeometry || !this.selectionMaterial) return;

    this.selectedTrackId = trackId;

    // Soul Galaxy renderer handles its own particle effects
    // Classic track object particle effects are no longer needed

    console.log(`✨ Активированы частицы вокруг трека: ${trackId}`);
  }

  /**
   * Деактивирует частицы выбора
   */
  deactivateSelectionParticles(): void {
    if (!this.selectionMaterial) return;

    this.selectedTrackId = undefined;
    this.selectionMaterial.opacity = 0.0;

    console.log('✨ Частицы выбора деактивированы');
  }

  /**
   * Обновляет анимацию частиц
   */
  update(deltaTime: number): void {
    this.time += deltaTime * this.animationSpeed;

    this.updateStarField();
    this.updateSelectionParticles(deltaTime);
  }

  /**
   * Обновляет анимацию звездного поля
   */
  private updateStarField(): void {
    if (!this.starField) return;

    // Медленное вращение звездного поля
    this.starField.rotation.y += 0.0001;
    this.starField.rotation.x += 0.00005;

    // Мерцание звезд
    if (this.starMaterial) {
      this.starMaterial.opacity = 0.6 + Math.sin(this.time * 2) * 0.2;
    }
  }

  /**
   * Обновляет частицы вокруг выбранного объекта
   */
  private updateSelectionParticles(deltaTime: number): void {
    if (!this.selectedTrackId || !this.selectionGeometry || !this.selectionMaterial) return;

    const positions = this.selectionGeometry.attributes.position as THREE.BufferAttribute;
    const velocities = this.selectionGeometry.attributes.velocity as THREE.BufferAttribute;
    const sizes = this.selectionGeometry.attributes.size as THREE.BufferAttribute;

    // Обновляем позиции частиц
    for (let i = 0; i < this.selectionParticleCount; i++) {
      const i3 = i * 3;
      
      // Получаем текущие позицию и скорость
      const pos = new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );
      
      const vel = new THREE.Vector3(
        velocities.getX(i),
        velocities.getY(i),
        velocities.getZ(i)
      );

      // Soul Galaxy renderer handles its own particle movement
      // Classic track object particle movement is no longer needed

      // Обновляем позицию
      pos.add(vel);
      positions.setXYZ(i, pos.x, pos.y, pos.z);

      // Пульсация размеров частиц
      const pulseFactor = 1 + Math.sin(this.time * 5 + i * 0.1) * 0.3;
      sizes.setX(i, (0.5 + Math.random() * 1.5) * pulseFactor);
    }

    positions.needsUpdate = true;
    sizes.needsUpdate = true;

    // Пульсация прозрачности
    this.selectionMaterial.opacity = 0.6 + Math.sin(this.time * 3) * 0.2;
  }

  /**
   * Создает эффект взрыва частиц
   */
  createExplosionEffect(position: THREE.Vector3, color: THREE.Color): void {
    if (!this.scene) return;

    const particleCount = 50;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Создаем частицы взрыва
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Начальная позиция - центр взрыва
      positions[i3] = position.x;
      positions[i3 + 1] = position.y;
      positions[i3 + 2] = position.z;
      
      // Случайные направления разлета
      const direction = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize();
      
      const speed = 0.1 + Math.random() * 0.2;
      velocities[i3] = direction.x * speed;
      velocities[i3 + 1] = direction.y * speed;
      velocities[i3 + 2] = direction.z * speed;
      
      // Цвет частиц
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 3.0,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const explosionParticles = new THREE.Points(geometry, material);
    this.scene.add(explosionParticles);

    // Анимация взрыва
    let explosionTime = 0;
    const explosionDuration = 2000; // 2 секунды

    const animateExplosion = () => {
      explosionTime += 16;
      const progress = explosionTime / explosionDuration;

      if (progress >= 1) {
        // Удаляем эффект после завершения
        this.scene?.remove(explosionParticles);
        geometry.dispose();
        material.dispose();
        return;
      }

      // Обновляем позиции частиц
      const positions = geometry.attributes.position as THREE.BufferAttribute;
      const velocities = geometry.attributes.velocity as THREE.BufferAttribute;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        positions.setX(i, positions.getX(i) + velocities.getX(i));
        positions.setY(i, positions.getY(i) + velocities.getY(i));
        positions.setZ(i, positions.getZ(i) + velocities.getZ(i));
        
        // Замедление частиц
        velocities.setX(i, velocities.getX(i) * 0.98);
        velocities.setY(i, velocities.getY(i) * 0.98);
        velocities.setZ(i, velocities.getZ(i) * 0.98);
      }

      positions.needsUpdate = true;
      
      // Затухание
      material.opacity = 1 - progress;

      requestAnimationFrame(animateExplosion);
    };

    animateExplosion();
  }

  /**
   * Получает количество звезд в звездном поле
   */
  getStarCount(): number {
    return this.starCount;
  }

  /**
   * Получает количество частиц выбора
   */
  getSelectionParticleCount(): number {
    return this.selectionParticleCount;
  }

  /**
   * Проверяет, активны ли частицы выбора
   */
  isSelectionParticlesActive(): boolean {
    return this.selectedTrackId !== undefined;
  }

  /**
   * Освобождение ресурсов
   */
  dispose(): void {
    console.log('✨ Освобождение ресурсов ParticleSystem...');

    // Удаляем звездное поле
    if (this.starField && this.scene) {
      this.scene.remove(this.starField);
    }
    if (this.starGeometry) {
      this.starGeometry.dispose();
    }
    if (this.starMaterial) {
      this.starMaterial.dispose();
    }

    // Удаляем частицы выбора
    if (this.selectionParticles && this.scene) {
      this.scene.remove(this.selectionParticles);
    }
    if (this.selectionGeometry) {
      this.selectionGeometry.dispose();
    }
    if (this.selectionMaterial) {
      this.selectionMaterial.dispose();
    }

    // Сброс ссылок
    this.scene = undefined;
    this.camera = undefined;
    this.starField = undefined;
    this.selectionParticles = undefined;
    this.selectedTrackId = undefined;

    console.log('✅ Ресурсы ParticleSystem освобождены');
  }
}