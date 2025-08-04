import { vi } from 'vitest';

// Mock Three.js for testing
vi.mock('three', () => ({
  Scene: vi.fn(() => ({
    add: vi.fn(),
    remove: vi.fn(),
    children: [],
    traverse: vi.fn((callback) => {
      // Mock traverse functionality
      const mockObjects = [
        {
          userData: { trackId: 'track1', isCrystal: true },
          material: {
            updateTime: vi.fn(),
            updateCameraPosition: vi.fn(),
            updateGlobalPulse: vi.fn()
          }
        }
      ];
      mockObjects.forEach(callback);
    }),
  })),
  PerspectiveCamera: vi.fn(() => ({
    position: { 
      x: 0, y: 0, z: 0,
      set: vi.fn(),
      copy: vi.fn(),
      add: vi.fn(),
      sub: vi.fn(),
      length: vi.fn(() => 10),
      multiplyScalar: vi.fn(),
      normalize: vi.fn(),
    },
    lookAt: vi.fn(),
    updateProjectionMatrix: vi.fn(),
    getWorldDirection: vi.fn((target) => {
      target.set(0, 0, -1);
      return target;
    }),
  })),
  WebGLRenderer: vi.fn(() => ({
    setSize: vi.fn(),
    render: vi.fn(),
    domElement: document.createElement('canvas'),
    dispose: vi.fn(),
  })),
  BufferGeometry: vi.fn(() => ({
    setAttribute: vi.fn(),
    setIndex: vi.fn(),
    computeVertexNormals: vi.fn(),
    dispose: vi.fn(),
    attributes: {
      position: { count: 100 },
      normal: { count: 100 },
      uv: { count: 100 }
    },
  })),
  IcosahedronGeometry: vi.fn((radius, detail) => ({
    setAttribute: vi.fn(),
    setIndex: vi.fn(),
    computeVertexNormals: vi.fn(),
    dispose: vi.fn(),
    attributes: {
      position: { count: 100 },
      normal: { count: 100 },
      uv: { count: 100 }
    },
  })),
  BufferAttribute: vi.fn(),
  Mesh: vi.fn(() => ({
    position: { 
      x: 0, y: 0, z: 0,
      set: vi.fn(),
      copy: vi.fn(),
      add: vi.fn(),
      sub: vi.fn(),
    },
    rotation: { 
      x: 0, y: 0, z: 0,
      set: vi.fn(),
      copy: vi.fn(),
    },
    scale: { 
      x: 1, y: 1, z: 1,
      set: vi.fn(),
      copy: vi.fn(),
    },
    material: {},
    geometry: {},
    castShadow: false,
    receiveShadow: false,
    userData: {},
  })),
  ShaderMaterial: vi.fn(() => ({
    uniforms: {},
    vertexShader: '',
    fragmentShader: '',
    dispose: vi.fn(),
    updateTime: vi.fn(),
    updateGlobalPulse: vi.fn(),
    updateCameraPosition: vi.fn(),
  })),
  Vector3: vi.fn(() => ({
    x: 0, y: 0, z: 0,
    set: vi.fn(),
    copy: vi.fn(),
    add: vi.fn(),
    sub: vi.fn(),
    normalize: vi.fn(),
    length: vi.fn(() => 0),
    distanceTo: vi.fn(() => 0),
  })),
  Color: vi.fn(() => ({
    r: 1, g: 1, b: 1,
    setHex: vi.fn(),
    setRGB: vi.fn(),
    getHSL: vi.fn((target) => {
      target.h = 0.5;
      target.s = 0.8;
      target.l = 0.6;
      return target;
    }),
    setHSL: vi.fn(),
  })),
  Euler: vi.fn(() => ({
    x: 0, y: 0, z: 0,
    set: vi.fn(),
    copy: vi.fn(),
  })),
  Vector2: vi.fn(() => ({
    x: 0, y: 0,
    set: vi.fn(),
    copy: vi.fn(),
    sub: vi.fn(),
  })),
  Quaternion: vi.fn(() => ({
    setFromAxisAngle: vi.fn(),
    multiply: vi.fn(),
  })),
  Spherical: vi.fn(() => ({
    phi: 0,
    theta: 0,
    radius: 1,
    setFromVector3: vi.fn(),
  })),
  MOUSE: {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2,
    ROTATE: 0,
    DOLLY: 1,
    PAN: 2,
  },
  Clock: vi.fn(() => ({
    getDelta: vi.fn(() => 0.016),
    getElapsedTime: vi.fn(() => 0),
  })),
  Raycaster: vi.fn(() => ({
    setFromCamera: vi.fn(),
    intersectObjects: vi.fn(() => []),
  })),
  Group: vi.fn(() => ({
    add: vi.fn(),
    remove: vi.fn(),
    children: [],
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
  })),
  Texture: vi.fn(() => ({
    image: { width: 256, height: 256 },
    dispose: vi.fn(),
  })),
  TextureLoader: vi.fn(() => ({
    load: vi.fn((url, onLoad) => {
      const mockTexture = { image: { width: 256, height: 256 } };
      if (onLoad) onLoad(mockTexture);
      return mockTexture;
    }),
  })),
  MathUtils: {
    lerp: vi.fn((a, b, t) => a + (b - a) * t),
    clamp: vi.fn((value, min, max) => Math.max(min, Math.min(max, value))),
    degToRad: vi.fn((degrees) => degrees * Math.PI / 180),
  },
}));

// Mock WebGL context
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => ({
    getExtension: vi.fn(),
    getParameter: vi.fn(),
    createShader: vi.fn(),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    createProgram: vi.fn(),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    useProgram: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    getUniformLocation: vi.fn(() => {}),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    uniform1f: vi.fn(),
    uniform3f: vi.fn(),
    uniformMatrix4fv: vi.fn(),
    createBuffer: vi.fn(),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    drawElements: vi.fn(),
    drawArrays: vi.fn(),
    viewport: vi.fn(),
    clearColor: vi.fn(),
    clear: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    blendFunc: vi.fn(),
    depthFunc: vi.fn(),
  })),
});

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now()),
} as any;

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

global.cancelAnimationFrame = vi.fn();

// Mock OrbitControls
vi.mock('three/examples/jsm/controls/OrbitControls', () => ({
  OrbitControls: vi.fn(() => ({
    enabled: true,
    enableDamping: true,
    dampingFactor: 0.05,
    enableZoom: true,
    enableRotate: true,
    enablePan: true,
    minDistance: 1,
    maxDistance: 1000,
    minPolarAngle: 0,
    maxPolarAngle: Math.PI,
    autoRotate: false,
    autoRotateSpeed: 2.0,
    target: { x: 0, y: 0, z: 0, set: vi.fn(), copy: vi.fn() },
    update: vi.fn(),
    dispose: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    mouseButtons: {
      LEFT: 0,
      MIDDLE: 1,
      RIGHT: 2,
    },
    rotateSpeed: 1,
    zoomSpeed: 1,
    panSpeed: 1,
    screenSpacePanning: false,
  })),
}));

// Mock FocusAnimationSystem
vi.mock('../src/soul-galaxy/camera/FocusAnimationSystem', () => ({
  FocusAnimationSystem: vi.fn(() => ({
    isFocused: vi.fn(() => false),
    isAnimating: vi.fn(() => false),
    getFocusedCrystal: vi.fn(() => undefined),
    focusOnCrystal: vi.fn(),
    returnToPreviousPosition: vi.fn(),
    update: vi.fn(),
    dispose: vi.fn(),
    setSettings: vi.fn(),
  })),
}));

// Mock DepthOfFieldSystem
vi.mock('../src/soul-galaxy/camera/DepthOfFieldSystem', () => ({
  DepthOfFieldSystem: vi.fn(() => ({
    update: vi.fn(),
    dispose: vi.fn(),
  })),
}));

// Mock CrystalGeometryGenerator
vi.mock('src/soul-galaxy/core/CrystalGeometryGenerator', () => ({
  CrystalGeometryGenerator: {
    generateCrystalGeometry: vi.fn(() => ({
      setAttribute: vi.fn(),
      setIndex: vi.fn(),
      computeVertexNormals: vi.fn(),
      dispose: vi.fn(),
      attributes: {
        position: { count: 100 },
        normal: { count: 100 },
        uv: { count: 100 }
      },
    })),
    createAdvancedCrystalGeometry: vi.fn(() => ({
      geometry: {
        setAttribute: vi.fn(),
        setIndex: vi.fn(),
        computeVertexNormals: vi.fn(),
        dispose: vi.fn(),
        attributes: {
          position: { count: 100 },
          normal: { count: 100 },
          uv: { count: 100 }
        },
      },
      facetCount: 20,
      roughnessLevel: 0.5,
    })),
  },
}));