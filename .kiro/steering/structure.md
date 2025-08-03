# Project Structure

## Root Directory Organization

```
music-galaxy-3d/
├── src/                    # Source code
├── scripts/                # Python data collection scripts
├── dist/                   # Built application (generated)
├── .kiro/                  # Kiro IDE configuration and specs
├── node_modules/           # Node.js dependencies (generated)
└── test-*.html            # Integration test files
```

## Source Code Architecture (`src/`)

### Core Modules
- `index.ts` - Main application entry point and initialization
- `index.html` - HTML template with UI overlay structure
- `types/index.ts` - TypeScript interfaces and type definitions

### Feature Modules
```
src/
├── animation/              # Animation system
│   └── AnimationManager.ts
├── audio/                  # Audio playback system
│   └── AudioManager.ts
├── data/                   # Data loading and processing
│   ├── DataLoader.ts       # Load music data from files
│   ├── DataProcessor.ts    # Process and convert track data
│   └── *.json             # Music data files
├── effects/                # Visual effects system
│   ├── EffectsManager.ts
│   ├── LightingEffects.ts
│   └── ParticleSystem.ts
├── interaction/            # User interaction handling
│   └── InteractionManager.ts
├── performance/            # Performance optimization
│   ├── PerformanceOptimizer.ts
│   ├── PerformanceMonitor.ts
│   ├── ResourceManager.ts
│   ├── FrustumCullingManager.ts
│   └── InstancedRenderingManager.ts
├── scene/                  # 3D scene management
│   ├── SceneManager.ts     # Main scene controller
│   ├── TrackObject.ts      # Individual track 3D objects
│   └── test-scene.ts       # Scene testing utilities
└── ui/                     # User interface
    └── UIManager.ts
```

## Architecture Patterns

### Manager Pattern
Each major system has a dedicated Manager class:
- `SceneManager` - 3D scene and rendering
- `InteractionManager` - User input and camera controls
- `AudioManager` - Audio playback and effects
- `UIManager` - User interface updates
- `AnimationManager` - Animation loops and timing

### Data Flow
1. **Data Collection**: Python scripts → JSON files
2. **Data Processing**: DataLoader → DataProcessor → ProcessedTrack[]
3. **3D Rendering**: SceneManager creates TrackObject instances
4. **User Interaction**: InteractionManager handles input → updates scene
5. **UI Updates**: UIManager reflects application state

## File Naming Conventions

- **Classes**: PascalCase with descriptive suffixes (`SceneManager.ts`)
- **Interfaces**: PascalCase, defined in `types/index.ts`
- **Test files**: `test-*.html` for integration tests
- **Data files**: `snake_case.json` for data storage

## Import/Export Patterns

- Use ES6 modules with explicit imports
- Export main classes and interfaces from each module
- Global browser exports available via window object
- Type definitions centralized in `types/index.ts`