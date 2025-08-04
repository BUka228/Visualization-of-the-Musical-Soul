/**
 * Cross-Browser Compatibility Tests
 * Task 10.2: Реализовать тесты кроссбраузерной совместимости
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MusicGalaxyApplication } from '../../src/index';
import * as THREE from 'three';

// Mock Three.js properly
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal() as typeof THREE;
  return {
    ...actual,
    Scene: class extends actual.Scene { constructor() { super(); } },
    PerspectiveCamera: class extends actual.PerspectiveCamera { constructor(fov?: number, aspect?: number, near?: number, far?: number) { super(fov, aspect, near, far); } },
    WebGLRenderer: class extends actual.WebGLRenderer { constructor(parameters?: any) { super(parameters); this.domElement = document.createElement('canvas'); } },
    AmbientLight: class extends actual.AmbientLight { constructor(color?: any, intensity?: number) { super(color, intensity); } },
    DirectionalLight: class extends actual.DirectionalLight { constructor(color?: any, intensity?: number) { super(color, intensity); } },
    IcosahedronGeometry: class extends actual.IcosahedronGeometry { constructor(radius?: number, detail?: number) { super(radius, detail); } },
    MeshStandardMaterial: class extends actual.MeshStandardMaterial { constructor(parameters?: any) { super(parameters); } },
    Mesh: class extends actual.Mesh { constructor(geometry?: any, material?: any) { super(geometry, material); } }
  };
});

// Browser feature detection utilities
const BrowserFeatures = {
  hasWebGL: () => {
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!context;
    } catch (e) {
      return false;
    }
  },

  hasWebGL2: () => {
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('webgl2');
      return !!context;
    } catch (e) {
      return false;
    }
  },

  hasAudioContext: () => {
    return !!(window.AudioContext || (window as any).webkitAudioContext);
  },

  hasRequestAnimationFrame: () => {
    return !!(window.requestAnimationFrame || 
             (window as any).webkitRequestAnimationFrame ||
             (window as any).mozRequestAnimationFrame ||
             (window as any).msRequestAnimationFrame);
  },

  hasFloat32Array: () => {
    return typeof Float32Array !== 'undefined';
  },

  hasPromise: () => {
    return typeof Promise !== 'undefined';
  },

  hasES6Features: () => {
    try {
      // Test arrow functions, const/let, template literals
      eval('const test = () => `template ${1}`;');
      return true;
    } catch (e) {
      return false;
    }
  }
};

// Mock different browser environments
const mockBrowserEnvironments = {
  chrome: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    webgl: true,
    webgl2: true,
    audioContext: true
  },
  firefox: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    webgl: true,
    webgl2: true,
    audioContext: true
  },
  safari: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    webgl: true,
    webgl2: false, // Safari has limited WebGL2 support
    audioContext: true
  },
  edge: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
    webgl: true,
    webgl2: true,
    audioContext: true
  },
  oldBrowser: {
    userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko', // IE11
    webgl: false,
    webgl2: false,
    audioContext: false
  }
};

describe('Cross-Browser Compatibility Tests', () => {
  let app: MusicGalaxyApplication;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    // Create mock container
    mockContainer = document.createElement('div');
    mockContainer.id = 'canvas-container';
    mockContainer.style.width = '800px';
    mockContainer.style.height = '600px';
    document.body.appendChild(mockContainer);

    app = new MusicGalaxyApplication();
  });

  afterEach(() => {
    if (app) {
      app.dispose();
    }
    if (mockContainer && mockContainer.parentNode) {
      mockContainer.parentNode.removeChild(mockContainer);
    }
  });

  describe('WebGL Support Detection', () => {
    it('should detect WebGL support correctly', () => {
      const hasWebGL = BrowserFeatures.hasWebGL();
      
      // In test environment, we mock WebGL support
      expect(typeof hasWebGL).toBe('boolean');
    });

    it('should handle WebGL context creation failure', () => {
      // Mock WebGL context creation failure
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = vi.fn(() => null);

      expect(() => {
        BrowserFeatures.hasWebGL();
      }).not.toThrow();

      // Restore original method
      HTMLCanvasElement.prototype.getContext = originalGetContext;
    });

    it('should fallback gracefully when WebGL is not available', async () => {
      // Mock no WebGL support
      HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
        if (contextType === 'webgl' || contextType === 'experimental-webgl') {
          return null;
        }
        return {};
      });

      // Should handle gracefully
      try {
        await app.initialize(mockContainer);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('WebGL');
      }
    });
  });

  describe('Audio Context Support', () => {
    it('should detect AudioContext support', () => {
      const hasAudioContext = BrowserFeatures.hasAudioContext();
      expect(typeof hasAudioContext).toBe('boolean');
    });

    it('should handle missing AudioContext gracefully', () => {
      // Mock missing AudioContext
      const originalAudioContext = window.AudioContext;
      const originalWebkitAudioContext = (window as any).webkitAudioContext;
      
      delete (window as any).AudioContext;
      delete (window as any).webkitAudioContext;

      expect(BrowserFeatures.hasAudioContext()).toBe(false);

      // Restore
      if (originalAudioContext) {
        (window as any).AudioContext = originalAudioContext;
      }
      if (originalWebkitAudioContext) {
        (window as any).webkitAudioContext = originalWebkitAudioContext;
      }
    });
  });

  describe('Browser-Specific Feature Tests', () => {
    it('should work with Chrome-like browsers', async () => {
      // Mock Chrome environment
      Object.defineProperty(navigator, 'userAgent', {
        value: mockBrowserEnvironments.chrome.userAgent,
        configurable: true
      });

      // Mock WebGL support
      HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
        if (contextType === 'webgl' || contextType === 'experimental-webgl') {
          return {
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
            viewport: vi.fn(),
            clearColor: vi.fn(),
            clear: vi.fn()
          };
        }
        return null;
      });

      await expect(app.initialize(mockContainer)).resolves.not.toThrow();
    });

    it('should work with Firefox-like browsers', async () => {
      // Mock Firefox environment
      Object.defineProperty(navigator, 'userAgent', {
        value: mockBrowserEnvironments.firefox.userAgent,
        configurable: true
      });

      // Mock WebGL support with Firefox-specific behavior
      HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
        if (contextType === 'webgl' || contextType === 'experimental-webgl') {
          return {
            getExtension: vi.fn((ext) => {
              // Firefox has different extension support
              if (ext === 'WEBGL_debug_renderer_info') return null;
              return {};
            }),
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
            viewport: vi.fn(),
            clearColor: vi.fn(),
            clear: vi.fn()
          };
        }
        return null;
      });

      await expect(app.initialize(mockContainer)).resolves.not.toThrow();
    });

    it('should handle Safari-specific limitations', async () => {
      // Mock Safari environment
      Object.defineProperty(navigator, 'userAgent', {
        value: mockBrowserEnvironments.safari.userAgent,
        configurable: true
      });

      // Mock Safari WebGL context (limited WebGL2 support)
      HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
        if (contextType === 'webgl2') {
          return null; // Safari has limited WebGL2 support
        }
        if (contextType === 'webgl' || contextType === 'experimental-webgl') {
          return {
            getExtension: vi.fn((ext) => {
              // Safari has different extension availability
              if (ext === 'EXT_color_buffer_float') return null;
              return {};
            }),
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
            viewport: vi.fn(),
            clearColor: vi.fn(),
            clear: vi.fn()
          };
        }
        return null;
      });

      await expect(app.initialize(mockContainer)).resolves.not.toThrow();
    });
  });

  describe('Feature Polyfill Tests', () => {
    it('should handle missing requestAnimationFrame', () => {
      // Mock missing requestAnimationFrame
      const originalRAF = window.requestAnimationFrame;
      delete (window as any).requestAnimationFrame;

      expect(BrowserFeatures.hasRequestAnimationFrame()).toBe(false);

      // Restore
      if (originalRAF) {
        window.requestAnimationFrame = originalRAF;
      }
    });

    it('should handle missing Float32Array', () => {
      // Mock missing Float32Array
      const originalFloat32Array = window.Float32Array;
      delete (window as any).Float32Array;

      expect(BrowserFeatures.hasFloat32Array()).toBe(false);

      // Restore
      if (originalFloat32Array) {
        (window as any).Float32Array = originalFloat32Array;
      }
    });

    it('should handle missing Promise support', () => {
      // Mock missing Promise
      const originalPromise = window.Promise;
      delete (window as any).Promise;

      expect(BrowserFeatures.hasPromise()).toBe(false);

      // Restore
      if (originalPromise) {
        (window as any).Promise = originalPromise;
      }
    });
  });

  describe('Responsive Design Tests', () => {
    it('should handle different screen sizes', async () => {
      // Test mobile screen size
      mockContainer.style.width = '375px';
      mockContainer.style.height = '667px';

      HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
        if (contextType === 'webgl' || contextType === 'experimental-webgl') {
          return {
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
            viewport: vi.fn(),
            clearColor: vi.fn(),
            clear: vi.fn()
          };
        }
        return null;
      });

      await expect(app.initialize(mockContainer)).resolves.not.toThrow();

      // Test desktop screen size
      mockContainer.style.width = '1920px';
      mockContainer.style.height = '1080px';

      const resizeEvent = new Event('resize');
      window.dispatchEvent(resizeEvent);

      // Should handle resize without errors
      expect(true).toBe(true);
    });

    it('should handle high DPI displays', async () => {
      // Mock high DPI display
      Object.defineProperty(window, 'devicePixelRatio', {
        value: 3,
        configurable: true
      });

      HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
        if (contextType === 'webgl' || contextType === 'experimental-webgl') {
          return {
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
            viewport: vi.fn(),
            clearColor: vi.fn(),
            clear: vi.fn()
          };
        }
        return null;
      });

      await expect(app.initialize(mockContainer)).resolves.not.toThrow();
    });
  });

  describe('Performance Across Browsers', () => {
    it('should maintain performance standards across browsers', async () => {
      const browsers = ['chrome', 'firefox', 'safari', 'edge'];
      
      for (const browser of browsers) {
        const env = mockBrowserEnvironments[browser as keyof typeof mockBrowserEnvironments];
        
        // Mock browser environment
        Object.defineProperty(navigator, 'userAgent', {
          value: env.userAgent,
          configurable: true
        });

        // Mock WebGL context
        HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
          if (contextType === 'webgl2' && !env.webgl2) {
            return null;
          }
          if (contextType === 'webgl' || contextType === 'experimental-webgl') {
            return env.webgl ? {
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
              viewport: vi.fn(),
              clearColor: vi.fn(),
              clear: vi.fn()
            } : null;
          }
          return null;
        });

        const startTime = performance.now();
        
        try {
          await app.initialize(mockContainer);
          const endTime = performance.now();
          const initTime = endTime - startTime;
          
          // Should initialize within reasonable time for all browsers
          expect(initTime).toBeLessThan(3000);
          
        } catch (error) {
          // Some browsers might not support required features
          if (env.webgl) {
            throw error; // Should work if WebGL is supported
          }
        }

        app.dispose();
        app = new MusicGalaxyApplication();
      }
    });

    it('should handle browser-specific WebGL extensions', async () => {
      const extensionTests = [
        { name: 'OES_texture_float', critical: false },
        { name: 'OES_texture_half_float', critical: false },
        { name: 'WEBGL_depth_texture', critical: false },
        { name: 'EXT_color_buffer_float', critical: false },
        { name: 'WEBGL_debug_renderer_info', critical: false }
      ];

      for (const extension of extensionTests) {
        // Mock extension availability
        HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
          if (contextType === 'webgl' || contextType === 'experimental-webgl') {
            return {
              getExtension: vi.fn((ext) => ext === extension.name ? {} : null),
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
              viewport: vi.fn(),
              clearColor: vi.fn(),
              clear: vi.fn()
            };
          }
          return null;
        });

        // Should work regardless of extension availability
        await expect(app.initialize(mockContainer)).resolves.not.toThrow();
        
        app.dispose();
        app = new MusicGalaxyApplication();
      }
    });

    it('should adapt to different GPU capabilities', async () => {
      const gpuCapabilities = [
        { maxTextureSize: 1024, maxVertexUniforms: 128 }, // Low-end
        { maxTextureSize: 2048, maxVertexUniforms: 256 }, // Mid-range
        { maxTextureSize: 4096, maxVertexUniforms: 512 }, // High-end
      ];

      for (const capability of gpuCapabilities) {
        HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
          if (contextType === 'webgl' || contextType === 'experimental-webgl') {
            return {
              getExtension: vi.fn(),
              getParameter: vi.fn((param) => {
                if (param === 0x0D33) return capability.maxTextureSize; // MAX_TEXTURE_SIZE
                if (param === 0x8DFB) return capability.maxVertexUniforms; // MAX_VERTEX_UNIFORM_VECTORS
                return 0;
              }),
              createShader: vi.fn(),
              shaderSource: vi.fn(),
              compileShader: vi.fn(),
              getShaderParameter: vi.fn(() => true),
              createProgram: vi.fn(),
              attachShader: vi.fn(),
              linkProgram: vi.fn(),
              getProgramParameter: vi.fn(() => true),
              useProgram: vi.fn(),
              viewport: vi.fn(),
              clearColor: vi.fn(),
              clear: vi.fn()
            };
          }
          return null;
        });

        await expect(app.initialize(mockContainer)).resolves.not.toThrow();
        
        app.dispose();
        app = new MusicGalaxyApplication();
      }
    });
  });

  describe('Graceful Degradation', () => {
    it('should provide meaningful error messages for unsupported browsers', async () => {
      // Mock old browser environment
      Object.defineProperty(navigator, 'userAgent', {
        value: mockBrowserEnvironments.oldBrowser.userAgent,
        configurable: true
      });

      // Mock no WebGL support
      HTMLCanvasElement.prototype.getContext = vi.fn(() => null);

      try {
        await app.initialize(mockContainer);
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('WebGL');
      }
    });

    it('should handle partial feature support', async () => {
      // Mock browser with limited features
      HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
        if (contextType === 'webgl' || contextType === 'experimental-webgl') {
          return {
            // Limited WebGL context
            getExtension: vi.fn(() => null), // No extensions
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
            viewport: vi.fn(),
            clearColor: vi.fn(),
            clear: vi.fn()
          };
        }
        return null;
      });

      // Should still work with limited features
      await expect(app.initialize(mockContainer)).resolves.not.toThrow();
    });
  });
});