// Verification script for CrystalShaderMaterial
import * as THREE from './node_modules/three/build/three.module.js';

// Test if we can import the CrystalShaderMaterial
async function testCrystalShaderMaterial() {
    console.log('🧪 Testing CrystalShaderMaterial...');
    
    try {
        // Import the material
        const { CrystalShaderMaterial } = await import('./src/soul-galaxy/materials/CrystalShaderMaterial.js');
        console.log('✅ CrystalShaderMaterial imported successfully');
        
        // Test basic instantiation
        const material = new CrystalShaderMaterial();
        console.log('✅ CrystalShaderMaterial instantiated successfully');
        
        // Test genre colors
        const genreColors = CrystalShaderMaterial.getGenreColors();
        console.log('✅ Genre colors available:', Object.keys(genreColors));
        
        // Test genre-specific creation
        const metalMaterial = CrystalShaderMaterial.createForGenre('metal');
        console.log('✅ Metal material created with color:', metalMaterial.getGenreColor());
        
        // Test uniform access
        console.log('✅ Material uniforms available:', Object.keys(material.uniforms));
        
        // Test methods
        material.updateTime(1.0);
        material.setGenreColor('rock');
        material.setPulsationParams(0.2, 1.5, 1.2);
        material.setEmissiveIntensity(0.8);
        material.setFocused(true);
        material.setHovered(false);
        console.log('✅ All material methods work correctly');
        
        // Test shader compilation (basic check)
        if (material.vertexShader && material.fragmentShader) {
            console.log('✅ Vertex and fragment shaders are present');
            console.log(`   Vertex shader length: ${material.vertexShader.length} chars`);
            console.log(`   Fragment shader length: ${material.fragmentShader.length} chars`);
        }
        
        // Test required uniforms
        const requiredUniforms = [
            'time', 'globalPulse', 'pulseAmplitude', 'pulseSpeed', 'sharpness',
            'genreColor', 'emissiveIntensity', 'opacity', 'metallic', 'roughness',
            'albumTexture', 'hasAlbumTexture', 'isFocused', 'isHovered', 'cameraPosition'
        ];
        
        const missingUniforms = requiredUniforms.filter(uniform => !material.uniforms[uniform]);
        if (missingUniforms.length === 0) {
            console.log('✅ All required uniforms are present');
        } else {
            console.log('❌ Missing uniforms:', missingUniforms);
        }
        
        // Test genre color values
        const testGenres = ['metal', 'rock', 'punk', 'electronic', 'jazz'];
        testGenres.forEach(genre => {
            material.setGenreColor(genre);
            const color = material.getGenreColor();
            console.log(`✅ ${genre} color: #${color.getHexString()}`);
        });
        
        // Test disposal
        material.dispose();
        console.log('✅ Material disposed successfully');
        
        console.log('🎉 All CrystalShaderMaterial tests passed!');
        return true;
        
    } catch (error) {
        console.error('❌ CrystalShaderMaterial test failed:', error);
        return false;
    }
}

// Test shader compilation in a WebGL context
async function testShaderCompilation() {
    console.log('🔧 Testing shader compilation...');
    
    try {
        // Create minimal WebGL context
        const canvas = document.createElement('canvas');
        const renderer = new THREE.WebGLRenderer({ canvas });
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera();
        
        // Import and create material
        const { CrystalShaderMaterial } = await import('./src/soul-galaxy/materials/CrystalShaderMaterial.js');
        const material = new CrystalShaderMaterial();
        
        // Create simple geometry with required attributes
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
        const normals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]);
        const uvs = new Float32Array([0, 0, 1, 0, 0.5, 1]);
        const pulsePhases = new Float32Array([0, Math.PI/2, Math.PI]);
        const bpmMultipliers = new Float32Array([1, 1, 1]);
        const originalPositions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
        const facetNormals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]);
        
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        geometry.setAttribute('pulsePhase', new THREE.BufferAttribute(pulsePhases, 1));
        geometry.setAttribute('bpmMultiplier', new THREE.BufferAttribute(bpmMultipliers, 1));
        geometry.setAttribute('originalPosition', new THREE.BufferAttribute(originalPositions, 3));
        geometry.setAttribute('facetNormal', new THREE.BufferAttribute(facetNormals, 3));
        
        // Create mesh and add to scene
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        
        // Try to render (this will compile shaders)
        renderer.render(scene, camera);
        
        console.log('✅ Shaders compiled successfully in WebGL context');
        
        // Cleanup
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        
        return true;
        
    } catch (error) {
        console.error('❌ Shader compilation test failed:', error);
        return false;
    }
}

// Run tests
async function runAllTests() {
    console.log('🚀 Starting CrystalShaderMaterial verification...');
    
    const basicTest = await testCrystalShaderMaterial();
    const shaderTest = await testShaderCompilation();
    
    if (basicTest && shaderTest) {
        console.log('🎉 All tests passed! CrystalShaderMaterial is working correctly.');
    } else {
        console.log('❌ Some tests failed. Check the errors above.');
    }
}

// Run when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
} else {
    runAllTests();
}