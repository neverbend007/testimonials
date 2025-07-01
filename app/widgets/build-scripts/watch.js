const fs = require('fs');
const path = require('path');
const buildDisplay = require('./build-display');
const buildCollect = require('./build-collect');

console.log('👀 Watching for changes...');
console.log('Press Ctrl+C to stop');

// Watch src directory for changes
const srcDir = path.join(__dirname, '../src');

function watchDirectory(dir, callback) {
  fs.watch(dir, { recursive: true }, (eventType, filename) => {
    if (filename && (filename.endsWith('.js') || filename.endsWith('.css'))) {
      console.log(`\n📝 File changed: ${filename}`);
      callback();
    }
  });
}

function rebuildAll() {
  try {
    buildDisplay();
    buildCollect();
    console.log('✅ Rebuild complete!\n');
  } catch (error) {
    console.error('❌ Rebuild failed:', error.message);
  }
}

// Initial build
rebuildAll();

// Watch for changes
watchDirectory(srcDir, rebuildAll);

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n👋 Stopping watch mode...');
  process.exit(0);
});