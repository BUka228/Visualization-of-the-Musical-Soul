// Core rendering components
export { SoulGalaxyRenderer } from './SoulGalaxyRenderer';
export { DeepSpaceEnvironment } from './DeepSpaceEnvironment';
export { CrystalTrackSystem } from './CrystalTrackSystem';
export { CrystalGeometryGenerator } from './CrystalGeometryGenerator';

// Error handling system
export { 
  SoulGalaxyErrorHandler, 
  ErrorType, 
  ErrorSeverity, 
  createSafeShaderMaterial 
} from './SoulGalaxyErrorHandler';

export { 
  ErrorHandlingIntegration,
  createSafeCrystalMaterial,
  createSafeCrystalMaterialForGenre,
  createSafeNebulaMaterial,
  createSafeDeepSpaceNebula,
  loadTextureWithFallback,
  createGeometryWithFallback
} from './ErrorHandlingIntegration';

// Types
export type { ErrorReport, PerformanceWarning } from './SoulGalaxyErrorHandler';