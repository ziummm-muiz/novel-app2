const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (dirPath.includes('node_modules') || dirPath.includes('.next')) return;
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function replaceInFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Pattern: obj?.full_name || obj?.username => obj?.username
    content = content.replace(/([a-zA-Z0-9_\.\?]+)\.full_name\s*\|\|\s*([a-zA-Z0-9_\.\?]+)\.username/g, '$2.username');
    
    // Pattern: obj?.username || obj?.full_name => obj?.username
    content = content.replace(/([a-zA-Z0-9_\.\?]+)\.username\s*\|\|\s*([a-zA-Z0-9_\.\?]+)\.full_name/g, '$1.username');

    // Specific cases found in grep
    content = content.replace(/u\.full_name \|\| 'No Name'/g, "u.username || 'No Name'");
    content = content.replace(/\{user\.full_name && \([\s\S]*?\)\}/g, "");
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated', filePath);
    }
}

walkDir('./app', replaceInFile);
walkDir('./components', replaceInFile);
