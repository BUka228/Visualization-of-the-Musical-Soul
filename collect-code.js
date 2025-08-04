const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT_FILE = 'project-code.txt';
const INCLUDE_EXTENSIONS = ['.ts', '.js', '.html', '.json', '.py', '.md', '.txt'];
const EXCLUDE_DIRS = ['node_modules', 'dist', '.git', '__pycache__'];
const EXCLUDE_FILES = ['package-lock.json', 'project-code.txt'];

function shouldIncludeFile(filePath) {
    const ext = path.extname(filePath);
    const fileName = path.basename(filePath);
    
    // Check if extension is included
    if (!INCLUDE_EXTENSIONS.includes(ext)) return false;
    
    // Check if file is excluded
    if (EXCLUDE_FILES.includes(fileName)) return false;
    
    return true;
}

function shouldIncludeDir(dirName) {
    return !EXCLUDE_DIRS.includes(dirName);
}

function collectFiles(dir, basePath = '') {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(basePath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            if (shouldIncludeDir(item)) {
                files.push(...collectFiles(fullPath, relativePath));
            }
        } else if (shouldIncludeFile(fullPath)) {
            files.push({
                path: relativePath,
                fullPath: fullPath
            });
        }
    }
    
    return files;
}

function main() {
    console.log('Collecting project code...');
    
    const files = collectFiles('.');
    let output = `# Music Galaxy 3D - Project Code Collection\n`;
    output += `Generated on: ${new Date().toISOString()}\n`;
    output += `Total files: ${files.length}\n\n`;
    output += `${'='.repeat(80)}\n\n`;
    
    for (const file of files) {
        console.log(`Processing: ${file.path}`);
        
        output += `## File: ${file.path}\n\n`;
        
        try {
            const content = fs.readFileSync(file.fullPath, 'utf8');
            output += '```\n';
            output += content;
            output += '\n```\n\n';
        } catch (error) {
            output += `Error reading file: ${error.message}\n\n`;
        }
        
        output += `${'='.repeat(80)}\n\n`;
    }
    
    fs.writeFileSync(OUTPUT_FILE, output, 'utf8');
    console.log(`\nProject code collected successfully!`);
    console.log(`Output file: ${OUTPUT_FILE}`);
    console.log(`Total files processed: ${files.length}`);
}

main();