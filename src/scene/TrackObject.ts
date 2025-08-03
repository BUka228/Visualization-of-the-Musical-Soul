/**
 * TrackObject - класс для представления трека как 3D-объекта
 * Наследует THREE.Mesh и добавляет специфичную для треков функциональность
 */

import * as THREE from 'three';
import { ProcessedTrack, TrackObject as ITrackObject } from '../types';

export class TrackObject extends THREE.Mesh implements ITrackObject {
  public trackData: ProcessedTrack;
  public originalPosition: THREE.Vector3;
  public isSelected: boolean = false;
  public isHovered: boolean = false;

  // Дополнительные свойства для анимаций
  private originalScale: THREE.Vector3;
  private originalEmissiveIntensity: number;
  private rotationSpeed: THREE.Vector3;

  constructor(trackData: ProcessedTrack) {
    // Создаем геометрию в зависимости от жанра
    const geometry = TrackObject.createGeometryForGenre(trackData.genre, trackData.size);
    
    // Создаем материал с цветом жанра
    const material = TrackObject.createMaterialForTrack(trackData);
    
    super(geometry, material);
    
    this.trackData = trackData;
    this.originalPosition = trackData.position.clone();
    
    // Устанавливаем позицию
    this.position.copy(trackData.position);
    
    // Сохраняем оригинальные значения для анимаций
    this.originalScale = this.scale.clone();
    this.originalEmissiveIntensity = (this.material as THREE.MeshStandardMaterial).emissiveIntensity;
    
    // Случайная скорость вращения для каждого объекта
    this.rotationSpeed = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02
    );
    
    // Настройка теней
    this.castShadow = true;
    this.receiveShadow = true;
    
    // Добавляем userData для идентификации
    this.userData = {
      isTrackObject: true,
      trackId: trackData.id,
      genre: trackData.genre
    };
  }

  /**
   * Создает геометрию в зависимости от жанра трека
   */
  private static createGeometryForGenre(genre: string, size: number): THREE.BufferGeometry {
    const normalizedGenre = genre.toLowerCase();
    
    switch (normalizedGenre) {
      case 'metal':
      case 'rock':
      case 'punk':
        // Конусы для агрессивных жанров
        return new THREE.ConeGeometry(size * 0.8, size * 1.5, 6);
        
      case 'electronic':
      case 'dance':
        // Кубы для электронной музыки
        return new THREE.BoxGeometry(size, size, size);
        
      case 'jazz':
      case 'blues':
        // Цилиндры для джаза и блюза
        return new THREE.CylinderGeometry(size * 0.7, size * 0.7, size * 1.2, 8);
        
      case 'classical':
        // Октаэдры для классической музыки
        return new THREE.OctahedronGeometry(size);
        
      case 'hip-hop':
      case 'rap':
        // Додекаэдры для хип-хопа
        return new THREE.DodecahedronGeometry(size * 0.8);
        
      case 'pop':
      case 'pop-rock':
        // Сферы для поп-музыки
        return new THREE.SphereGeometry(size, 16, 12);
        
      case 'indie':
      case 'alternative':
      default:
        // Икосаэдры (кристаллы) для инди и остальных жанров
        return new THREE.IcosahedronGeometry(size, 1);
    }
  }

  /**
   * Создает материал для трека с учетом его характеристик
   */
  private static createMaterialForTrack(trackData: ProcessedTrack): THREE.MeshStandardMaterial {
    const color = new THREE.Color(trackData.color);
    
    // Настройки материала в зависимости от жанра
    const normalizedGenre = trackData.genre.toLowerCase();
    let metalness = 0.3;
    let roughness = 0.4;
    let emissiveIntensity = 0.1;
    
    switch (normalizedGenre) {
      case 'metal':
      case 'rock':
        metalness = 0.8;
        roughness = 0.2;
        emissiveIntensity = 0.15;
        break;
        
      case 'electronic':
      case 'dance':
        metalness = 0.1;
        roughness = 0.1;
        emissiveIntensity = 0.3;
        break;
        
      case 'jazz':
      case 'blues':
        metalness = 0.6;
        roughness = 0.6;
        emissiveIntensity = 0.05;
        break;
        
      case 'classical':
        metalness = 0.1;
        roughness = 0.8;
        emissiveIntensity = 0.02;
        break;
        
      case 'pop':
      case 'pop-rock':
        metalness = 0.2;
        roughness = 0.3;
        emissiveIntensity = 0.2;
        break;
    }
    
    // Создаем материал
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: metalness,
      roughness: roughness,
      emissive: color.clone().multiplyScalar(0.3),
      emissiveIntensity: emissiveIntensity,
      transparent: false,
      opacity: 1.0
    });
    
    return material;
  }

  /**
   * Обновляет анимацию объекта
   */
  public updateAnimation(deltaTime: number, globalTime: number): void {
    if (!this.isSelected) {
      // Вращение вокруг собственной оси
      this.rotation.x += this.rotationSpeed.x;
      this.rotation.y += this.rotationSpeed.y;
      this.rotation.z += this.rotationSpeed.z;
      
      // Орбитальное движение вокруг центра (только если не выбран)
      const radius = this.originalPosition.length();
      const angle = globalTime * 0.0001 + this.userData.trackId.charCodeAt(0) * 0.01;
      
      this.position.x = Math.cos(angle) * radius;
      this.position.z = Math.sin(angle) * radius;
      // Y-координата остается неизменной для сохранения высоты
    }
  }

  /**
   * Устанавливает состояние наведения
   */
  public setHovered(hovered: boolean): void {
    if (this.isHovered === hovered) return;
    
    this.isHovered = hovered;
    const material = this.material as THREE.MeshStandardMaterial;
    
    if (hovered) {
      // Увеличиваем свечение при наведении
      material.emissiveIntensity = this.originalEmissiveIntensity * 2;
      this.scale.setScalar(1.1);
    } else {
      // Возвращаем к исходному состоянию
      material.emissiveIntensity = this.originalEmissiveIntensity;
      this.scale.copy(this.originalScale);
    }
  }

  /**
   * Устанавливает состояние выбора
   */
  public setSelected(selected: boolean): void {
    if (this.isSelected === selected) return;
    
    this.isSelected = selected;
    const material = this.material as THREE.MeshStandardMaterial;
    
    if (selected) {
      // Эффекты для выбранного объекта
      material.emissiveIntensity = this.originalEmissiveIntensity * 3;
      this.scale.setScalar(1.3);
      
      // Добавляем пульсацию
      this.userData.pulsePhase = 0;
    } else {
      // Возвращаем к исходному состоянию
      material.emissiveIntensity = this.originalEmissiveIntensity;
      this.scale.copy(this.originalScale);
      
      // Возвращаем к исходной позиции
      this.position.copy(this.originalPosition);
    }
  }

  /**
   * Обновляет эффект пульсации для выбранного объекта
   */
  public updatePulse(globalTime: number): void {
    if (!this.isSelected) return;
    
    const pulseSpeed = 0.003;
    const pulseAmplitude = 0.1;
    const pulse = Math.sin(globalTime * pulseSpeed) * pulseAmplitude;
    
    this.scale.setScalar(1.3 + pulse);
  }

  /**
   * Получает информацию о треке для отображения
   */
  public getTrackInfo(): {
    name: string;
    artist: string;
    album: string;
    genre: string;
    duration: string;
    popularity: number;
  } {
    const minutes = Math.floor(this.trackData.duration / 60);
    const seconds = this.trackData.duration % 60;
    const durationString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    return {
      name: this.trackData.name,
      artist: this.trackData.artist,
      album: this.trackData.album,
      genre: this.trackData.genre,
      duration: durationString,
      popularity: this.trackData.popularity
    };
  }

  /**
   * Освобождает ресурсы объекта
   */
  public dispose(): void {
    this.geometry.dispose();
    
    if (this.material instanceof THREE.Material) {
      this.material.dispose();
    } else if (Array.isArray(this.material)) {
      this.material.forEach(material => material.dispose());
    }
  }

  /**
   * Создает копию объекта (для инстансинга)
   */
  public clone(recursive?: boolean): this {
    const cloned = new TrackObject(this.trackData);
    cloned.position.copy(this.position);
    cloned.rotation.copy(this.rotation);
    cloned.scale.copy(this.scale);
    return cloned as this;
  }

  /**
   * Возвращает расстояние до камеры (для сортировки прозрачных объектов)
   */
  public getDistanceToCamera(camera: THREE.Camera): number {
    return this.position.distanceTo(camera.position);
  }
}