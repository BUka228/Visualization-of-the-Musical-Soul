# Test Suite

This directory contains all test files for the Music Galaxy 3D project, organized by functionality.

## Structure

```
tests/
├── unit/                   # Unit tests for individual components
├── integration/            # Integration tests for system interactions
├── visual/                 # Visual tests for 3D rendering and effects
├── performance/            # Performance and optimization tests
├── audio/                  # Audio system tests
├── data/                   # Data loading and processing tests
├── ui/                     # User interface tests
├── verification/           # Verification scripts and utilities
└── utils/                  # Test utilities and helpers
```

## Test Categories

### Visual Tests
- Crystal geometry and materials
- Shader compilation and effects
- Camera controls and transitions
- Particle systems and environments
- Genre color systems

### Integration Tests
- Data processing workflows
- Task-specific feature tests
- System component interactions

### Performance Tests
- Rendering optimization
- Resource management
- Performance monitoring

### Audio Tests
- Audio playback systems
- Audio-visual synchronization

### Verification Tests
- Feature verification scripts
- System validation utilities

## Running Tests

Most tests are HTML files that can be opened directly in a browser. JavaScript verification files can be run with Node.js.

### Browser Tests
```bash
# Serve test files locally
npx http-server tests -p 8081
```

### Node.js Tests
```bash
# Run verification scripts
node tests/verification/verify-*.js
```