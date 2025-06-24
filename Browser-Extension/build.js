#!/usr/bin/env node

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Build configuration
const BUILD_DIR = 'dist';
const CHROME_V3_DIR = path.join(BUILD_DIR, 'chrome-v3');
const CHROME_V2_DIR = path.join(BUILD_DIR, 'chrome-v2');
const FIREFOX_DIR = path.join(BUILD_DIR, 'firefox');

// Files to copy
const FILES_TO_COPY = [
  'html/',
  'css/',
  'icons/',
  'js/browser-polyfill.js',
  'js/compat-utils.js',
  'js/content.js',
  'js/options.js',
  'js/popup.js',
  'js/utils/',
  'js/background-v2.js'
];

// Progress tracking
let currentStep = 0;
const totalSteps = 7;

/**
 * Log progress message
 * @param {string} message - Progress message
 */
function logProgress(message) {
  currentStep++;
  console.log(`[${currentStep}/${totalSteps}] ${message}`);
}

/**
 * Clean build directory
 */
async function cleanBuildDir() {
  logProgress('Cleaning build directory...');
  
  try {
    // Check if directory exists before trying to remove it
    try {
      await fs.access(BUILD_DIR);
      await fs.rm(BUILD_DIR, { recursive: true, force: true });
    } catch (error) {
      // Directory doesn't exist, which is fine
    }
    
    // Create directories
    await fs.mkdir(BUILD_DIR);
    await Promise.all([
      fs.mkdir(CHROME_V3_DIR),
      fs.mkdir(CHROME_V2_DIR),
      fs.mkdir(FIREFOX_DIR)
    ]);
  } catch (error) {
    console.error('Error cleaning build directory:', error);
    throw error;
  }
}

/**
 * Copy files recursively (async version)
 * @param {string} src - Source path
 * @param {string} dest - Destination path
 */
async function copyRecursive(src, dest) {
  try {
    const stats = await fs.stat(src);
    
    if (stats.isDirectory()) {
      // Create directory if it doesn't exist
      await fs.mkdir(dest, { recursive: true });
      
      // Read directory contents
      const items = await fs.readdir(src);
      
      // Copy all items in parallel
      await Promise.all(
        items.map(item => 
          copyRecursive(path.join(src, item), path.join(dest, item))
        )
      );
    } else {
      // Ensure destination directory exists
      const destDir = path.dirname(dest);
      await fs.mkdir(destDir, { recursive: true });
      
      // Copy file
      await fs.copyFile(src, dest);
    }
  } catch (error) {
    // Ignore missing source files
    if (error.code !== 'ENOENT') {
      console.warn(`Warning: Error copying ${src}:`, error.message);
    }
  }
}

/**
 * Copy common files to target directory
 * @param {string} targetDir - Target directory
 */
async function copyCommonFiles(targetDir) {
  console.log(`  Copying files to ${path.basename(targetDir)}...`);
  
  try {
    // Copy all files in parallel
    await Promise.all(
      FILES_TO_COPY.map(async (file) => {
        const src = path.join('.', file);
        const dest = path.join(targetDir, file);
        
        try {
          await fs.access(src);
          await copyRecursive(src, dest);
        } catch (error) {
          // File doesn't exist, skip it
        }
      })
    );
  } catch (error) {
    console.error(`Error copying files to ${targetDir}:`, error);
    throw error;
  }
}

/**
 * Build Chrome V3 version
 */
async function buildChromeV3() {
  logProgress('Building Chrome V3 extension...');
  
  try {
    // Validate required files exist
    const requiredFiles = ['manifest.json', 'js/background.js'];
    for (const file of requiredFiles) {
      try {
        await fs.access(file);
      } catch (error) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
    
    // Copy common files
    await copyCommonFiles(CHROME_V3_DIR);
    
    // Copy V3 specific files
    await Promise.all([
      fs.copyFile('manifest.json', path.join(CHROME_V3_DIR, 'manifest.json')),
      fs.copyFile('js/background.js', path.join(CHROME_V3_DIR, 'js/background.js'))
    ]);
    
    console.log('  Chrome V3 build complete!');
  } catch (error) {
    console.error('Error building Chrome V3:', error);
    throw error;
  }
}

/**
 * Build Chrome V2 version
 */
async function buildChromeV2() {
  logProgress('Building Chrome V2 extension...');
  
  try {
    // Validate required files exist
    try {
      await fs.access('manifest-v2.json');
    } catch (error) {
      throw new Error('Required file missing: manifest-v2.json');
    }
    
    // Copy common files
    await copyCommonFiles(CHROME_V2_DIR);
    
    // Copy V2 specific files
    await fs.copyFile('manifest-v2.json', path.join(CHROME_V2_DIR, 'manifest.json'));
    
    console.log('  Chrome V2 build complete!');
  } catch (error) {
    console.error('Error building Chrome V2:', error);
    throw error;
  }
}

/**
 * Build Firefox version
 */
async function buildFirefox() {
  logProgress('Building Firefox extension...');
  
  try {
    // Validate required files exist
    try {
      await fs.access('manifest-v2.json');
    } catch (error) {
      throw new Error('Required file missing: manifest-v2.json');
    }
    
    // Copy common files
    await copyCommonFiles(FIREFOX_DIR);
    
    // Copy V2 manifest (Firefox uses V2)
    await fs.copyFile('manifest-v2.json', path.join(FIREFOX_DIR, 'manifest.json'));
    
    console.log('  Firefox build complete!');
    console.log('  To load in Firefox: about:debugging → This Firefox → Load Temporary Add-on');
    console.log(`  Select: ${path.join(FIREFOX_DIR, 'manifest.json')}`);
  } catch (error) {
    console.error('Error building Firefox:', error);
    throw error;
  }
}

/**
 * Check if a command exists
 * @param {string} command - Command to check
 * @returns {Promise<boolean>}
 */
async function commandExists(command) {
  try {
    await execAsync(`which ${command}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create zip files for distribution
 */
async function createZipFiles() {
  logProgress('Creating zip files...');
  
  // Check if zip command is available
  const hasZip = await commandExists('zip');
  if (!hasZip) {
    console.log('  Zip command not found. Skipping zip file creation.');
    console.log('  To enable zip creation, install zip: brew install zip (macOS) or apt-get install zip (Linux)');
    return;
  }
  
  const zipConfigs = [
    { dir: CHROME_V3_DIR, output: 'tldw-assistant-chrome-v3.zip' },
    { dir: CHROME_V2_DIR, output: 'tldw-assistant-chrome-v2.zip' },
    { dir: FIREFOX_DIR, output: 'tldw-assistant-firefox.zip' }
  ];
  
  try {
    // Create all zip files in parallel
    await Promise.all(
      zipConfigs.map(async ({ dir, output }) => {
        const outputPath = path.join(BUILD_DIR, output);
        try {
          // Change to the directory and create zip
          await execAsync(`cd "${dir}" && zip -r "../${output}" ./*`);
          console.log(`  Created ${output}`);
        } catch (error) {
          console.error(`  Failed to create ${output}:`, error.message);
        }
      })
    );
  } catch (error) {
    console.error('Error creating zip files:', error);
    // Don't throw - zip creation is optional
  }
}

/**
 * Validate build results
 */
async function validateBuild() {
  logProgress('Validating build...');
  
  const requiredFiles = [
    path.join(CHROME_V3_DIR, 'manifest.json'),
    path.join(CHROME_V2_DIR, 'manifest.json'),
    path.join(FIREFOX_DIR, 'manifest.json'),
    path.join(CHROME_V3_DIR, 'js/popup.js'),
    path.join(CHROME_V3_DIR, 'html/popup.html')
  ];
  
  const results = await Promise.all(
    requiredFiles.map(async (file) => {
      try {
        await fs.access(file);
        return { file, exists: true };
      } catch {
        return { file, exists: false };
      }
    })
  );
  
  const missing = results.filter(r => !r.exists);
  if (missing.length > 0) {
    console.error('  Validation failed! Missing files:');
    missing.forEach(({ file }) => console.error(`    - ${file}`));
    throw new Error('Build validation failed');
  }
  
  console.log('  Build validation passed!');
}

/**
 * Main build function
 */
async function build() {
  console.log('🚀 Starting extension build process...\n');
  
  const startTime = Date.now();
  
  try {
    // Run build steps
    await cleanBuildDir();
    
    // Build all versions sequentially to handle errors properly
    const buildTasks = [
      { name: 'Chrome V3', fn: buildChromeV3 },
      { name: 'Chrome V2', fn: buildChromeV2 },
      { name: 'Firefox', fn: buildFirefox }
    ];
    
    const failedBuilds = [];
    
    for (const { name, fn } of buildTasks) {
      try {
        await fn();
      } catch (error) {
        console.error(`❌ ${name} build failed: ${error.message}`);
        failedBuilds.push(name);
      }
    }
    
    if (failedBuilds.length > 0) {
      throw new Error(`Build failed for: ${failedBuilds.join(', ')}`);
    }
    
    // Create zip files
    await createZipFiles();
    
    // Validate build
    await validateBuild();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n✅ Build complete! 🎉');
    console.log(`⏱️  Total time: ${duration}s`);
    console.log('\n📦 Extensions are in the dist/ directory:');
    console.log('  - Chrome V3: dist/chrome-v3/');
    console.log('  - Chrome V2: dist/chrome-v2/');
    console.log('  - Firefox: dist/firefox/');
    
    // Check if zip files were created
    try {
      const files = await fs.readdir(BUILD_DIR);
      const zips = files.filter(f => f.endsWith('.zip'));
      if (zips.length > 0) {
        console.log('\n📦 Zip files created:');
        zips.forEach(zip => console.log(`  - ${zip}`));
      }
    } catch {
      // Ignore errors
    }
    
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    console.error('\nPlease check the error messages above and try again.');
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

// Run build
build();