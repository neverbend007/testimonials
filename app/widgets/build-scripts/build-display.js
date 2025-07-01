const fs = require('fs');
const path = require('path');

// Simple build script for display widget
function buildDisplayWidget() {
  console.log('Building display widget...');

  try {
    // Read the source files
    const utilsPath = path.join(__dirname, '../src/shared/utils.js');
    const displayPath = path.join(__dirname, '../src/display/display-widget.js');
    
    let utilsContent = fs.readFileSync(utilsPath, 'utf8');
    let displayContent = fs.readFileSync(displayPath, 'utf8');

    // Remove ES6 import/export for browser compatibility
    // Convert to immediately invoked function expression (IIFE)
    
    // Remove imports from display widget and utils (more comprehensive)
    displayContent = displayContent.replace(/import\s+.*?from\s+['"].*?['"];?\s*/gs, '');
    displayContent = displayContent.replace(/import\s*\{[^}]*\}\s*from\s+['"].*?['"];?\s*/gs, '');
    utilsContent = utilsContent.replace(/export\s+/g, '');
    
    // Remove export from display widget
    displayContent = displayContent.replace(/export\s+default\s+TestimonialsDisplayWidget;?\s*$/m, '');

    // Create the bundled widget
    const bundledContent = `
(function() {
  'use strict';
  
  // === Shared Utilities ===
  ${utilsContent}
  
  // === Display Widget ===
  ${displayContent}
  
})();
`;

    // Ensure backend dist directory exists (where backend serves widgets from)
    const distDir = path.join(__dirname, '../../backend/dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    // Write the bundled file
    const outputPath = path.join(distDir, 'testimonials-display.js');
    fs.writeFileSync(outputPath, bundledContent);

    // Create minified version (safe, conservative minification)
    const minifiedContent = bundledContent
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/^\s*\/\/.*$/gm, '') // Remove line comments (only at start of line)
      .replace(/\n\s*/g, '\n') // Preserve newlines but remove indentation
      .replace(/[ \t]{2,}/g, ' ') // Replace multiple spaces/tabs with single space
      .trim();

    const minifiedPath = path.join(distDir, 'testimonials-display.min.js');
    fs.writeFileSync(minifiedPath, minifiedContent);

    console.log('✅ Display widget built successfully!');
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
  buildDisplayWidget();
}

module.exports = buildDisplayWidget;