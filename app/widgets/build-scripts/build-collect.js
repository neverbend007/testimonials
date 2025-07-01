const fs = require('fs');
const path = require('path');

// Build script for collection widget
function buildCollectWidget() {
  console.log('Building collection widget...');

  try {
    // Read the source files
    const utilsPath = path.join(__dirname, '../src/shared/utils.js');
    const collectPath = path.join(__dirname, '../src/collect/collect-widget.js');
    
    let utilsContent = fs.readFileSync(utilsPath, 'utf8');
    let collectContent = fs.readFileSync(collectPath, 'utf8');

    // Remove ES6 import/export for browser compatibility
    // Convert to immediately invoked function expression (IIFE)
    
    // Remove imports from collection widget and utils (more comprehensive)
    collectContent = collectContent.replace(/import\s+.*?from\s+['"].*?['"];?\s*/gs, '');
    collectContent = collectContent.replace(/import\s*\{[^}]*\}\s*from\s+['"].*?['"];?\s*/gs, '');
    utilsContent = utilsContent.replace(/export\s+/g, '');
    
    // Remove export from collection widget
    collectContent = collectContent.replace(/export\s+default\s+TestimonialsCollectWidget;?\s*$/m, '');

    // Create the bundled widget
    const bundledContent = `
(function() {
  'use strict';
  
  // === Shared Utilities ===
  ${utilsContent}
  
  // === Collection Widget ===
  ${collectContent}
  
})();
`;

    // Ensure backend dist directory exists (where backend serves widgets from)
    const distDir = path.join(__dirname, '../../backend/dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    // Write the bundled file
    const outputPath = path.join(distDir, 'testimonials-collect.js');
    fs.writeFileSync(outputPath, bundledContent);

    // Create minified version (safe, conservative minification)
    const minifiedContent = bundledContent
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/^\s*\/\/.*$/gm, '') // Remove line comments (only at start of line)
      .replace(/\n\s*/g, '\n') // Preserve newlines but remove indentation
      .replace(/[ \t]{2,}/g, ' ') // Replace multiple spaces/tabs with single space
      .trim();

    const minifiedPath = path.join(distDir, 'testimonials-collect.min.js');
    fs.writeFileSync(minifiedPath, minifiedContent);

    // Copy admin-preview.html to backend dist for widget testing
    const adminPreviewSrc = path.join(__dirname, '../src/admin-preview.html');
    const adminPreviewDest = path.join(distDir, 'admin-preview.html');
    if (fs.existsSync(adminPreviewSrc)) {
      fs.copyFileSync(adminPreviewSrc, adminPreviewDest);
      console.log(`📋 Admin preview copied: ${adminPreviewDest}`);
    }

    console.log('✅ Collection widget built successfully!');
    console.log(`📦 Output: ${outputPath}`);
    console.log(`📦 Minified: ${minifiedPath}`);
    console.log(`📏 Size: ${(bundledContent.length / 1024).toFixed(2)}KB (${(minifiedContent.length / 1024).toFixed(2)}KB minified)`);

  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  buildCollectWidget();
}

module.exports = buildCollectWidget;