#!/usr/bin/env node

/**
 * ESLint Error Fix Script
 * Systematically fixes common ESLint errors in the DEX mobile application
 */

import fs from 'fs';
import path from 'path';

// Common patterns to fix
const fixes = [
  // Fix any types
  {
    pattern: /: any\b/g,
    replacement: ': unknown',
    description: 'Replace any with unknown'
  },
  
  // Fix catch error types
  {
    pattern: /catch \(error: any\)/g,
    replacement: 'catch (error: unknown)',
    description: 'Fix catch error types'
  },
  
  // Fix useless escape characters in regex
  {
    pattern: /\\(\(|\))/g,
    replacement: '$1',
    description: 'Remove useless escape characters'
  },
  
  // Fix const reassignment issues - more comprehensive patterns
  {
    pattern: /const (\w+) = ([^;]+);([^}]*?)\1\s*\+=/g,
    replacement: 'let $1 = $2;$3$1 +=',
    description: 'Fix const += reassignment by changing to let'
  },

  {
    pattern: /const (\w+) = ([^;]+);([^}]*?)\1\s*=/g,
    replacement: 'let $1 = $2;$3$1 =',
    description: 'Fix const reassignment by changing to let'
  },

  // Fix for loop const issues
  {
    pattern: /for \(const (\w+) = ([^;]+);([^;]+);([^)]+)\)/g,
    replacement: 'for (let $1 = $2;$3;$4)',
    description: 'Fix for loop const declarations'
  }
];

// Files to process (focusing on src/ directory)
const srcDir = './src';

function getAllTsFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    for (const fix of fixes) {
      const originalContent = content;
      content = content.replace(fix.pattern, fix.replacement);
      
      if (content !== originalContent) {
        changed = true;
        console.log(`✅ Applied fix "${fix.description}" to ${filePath}`);
      }
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Starting ESLint error fixes...');
  
  const files = getAllTsFiles(srcDir);
  console.log(`📁 Found ${files.length} TypeScript files to process`);
  
  let fixedFiles = 0;
  
  for (const file of files) {
    if (fixFile(file)) {
      fixedFiles++;
    }
  }
  
  console.log(`\n✨ Fixed ${fixedFiles} files out of ${files.length} total files`);
  console.log('🎯 Run npm run lint to check remaining errors');
}

main();
