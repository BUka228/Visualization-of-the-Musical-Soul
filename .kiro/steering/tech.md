# Technology Stack

## Core Technologies

- **Three.js** - 3D rendering and WebGL abstraction
- **TypeScript** - Type-safe JavaScript development
- **Webpack** - Module bundling and build system
- **Python** - Data collection from Yandex Music API

## Build System

### Development Commands
```bash
# Start development server with hot reload
npm run dev

# Type checking without compilation
npm run type-check

# Collect music data from Yandex Music
npm run collect-data
# Alternative: python scripts/collect_yandex_music_data.py
```

### Production Commands
```bash
# Build for production
npm run build

# Serve built application
npm run serve
# Alternative: npx http-server dist -p 8080
```

## Dependencies

### Runtime Dependencies
- `three@^0.158.0` - 3D graphics library

### Development Dependencies
- `typescript@^5.3.0` - TypeScript compiler
- `webpack@^5.89.0` - Module bundler
- `ts-loader@^9.5.1` - TypeScript loader for Webpack
- `@types/three@^0.158.0` - TypeScript definitions for Three.js

### Python Dependencies
- `yandex-music>=2.1.1` - Unofficial Yandex Music API client

## Browser Requirements

- Modern browser with WebGL support
- ES2020 compatibility
- DOM and DOM.Iterable support

## Configuration Files

- `tsconfig.json` - TypeScript compiler configuration (strict mode enabled)
- `webpack.config.js` - Webpack bundling configuration
- `package.json` - Node.js project configuration
- `requirements.txt` - Python dependencies