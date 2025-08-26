const fs = require('fs');
const path = require('path');

const SCRIPT_TAG = '<script src="/dashboard-console-capture.js"></script>';

// Recursively find HTML files in a directory
async function findHtmlFiles(dir) {
  const files = [];
  
  async function scanDirectory(currentDir) {
    try {
      const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`❌ Error reading directory ${currentDir}:`, error.message);
    }
  }
  
  await scanDirectory(dir);
  return files;
}

async function injectConsoleCapture() {
  const buildDir = path.join(process.cwd(), '.next');
  const distDir = path.join(process.cwd(), 'dist');
  const outDir = path.join(process.cwd(), 'out');
  
  // Check which build directory exists
  let targetDir = null;
  if (fs.existsSync(buildDir)) {
    targetDir = buildDir;
    console.log('📁 Found Next.js build directory');
  } else if (fs.existsSync(distDir)) {
    targetDir = distDir;
    console.log('📁 Found dist directory');
  } else if (fs.existsSync(outDir)) {
    targetDir = outDir;
    console.log('📁 Found out directory');
  }
  
  if (!targetDir) {
    console.log('⚠️  No build directory found. Skipping console capture injection.');
    return;
  }
  
  try {
    // Find all HTML files in build output
    const htmlFiles = await findHtmlFiles(targetDir);
    
    if (htmlFiles.length === 0) {
      console.log('⚠️  No HTML files found in build output.');
      return;
    }
    
    let injectedCount = 0;
    
    for (const file of htmlFiles) {
      try {
        let content = await fs.promises.readFile(file, 'utf8');
        
        // Skip if script is already injected
        if (content.includes('dashboard-console-capture.js')) {
          continue;
        }
        
        // Try to inject before closing head tag first
        if (content.includes('</head>')) {
          content = content.replace('</head>', `  ${SCRIPT_TAG}\n</head>`);
          injectedCount++;
        }
        // Fallback to inject after opening body tag
        else if (content.includes('<body>')) {
          content = content.replace('<body>', `<body>\n  ${SCRIPT_TAG}`);
          injectedCount++;
        }
        // Last resort: inject at the end of HTML
        else if (content.includes('</html>')) {
          content = content.replace('</html>', `${SCRIPT_TAG}\n</html>`);
          injectedCount++;
        }
        
        await fs.promises.writeFile(file, content);
        console.log(`✓ Injected console capture into: ${path.relative(process.cwd(), file)}`);
      } catch (error) {
        console.error(`✗ Error processing ${file}:`, error.message);
      }
    }
    
    console.log(`\n📊 Console capture injection complete! (${injectedCount}/${htmlFiles.length} files updated)`);
  } catch (error) {
    console.error('❌ Error during console capture injection:', error.message);
  }
}

// Run the injection
injectConsoleCapture().catch(error => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});