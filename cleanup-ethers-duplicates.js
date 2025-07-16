#!/usr/bin/env node

/**
 * Clean up duplicated ethers patterns caused by multiple runs of the fix script
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function cleanupEthersDuplicates(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const originalContent = content;

    // Clean up cascading duplications
    const cleanupPatterns = [
      // Triple duplications
      {
        pattern: /ethers\.providers\.ethers\.providers\.ethers\.providers\./g,
        replacement: 'ethers.providers.'
      },
      {
        pattern: /ethers\.utils\.ethers\.utils\.ethers\.utils\./g,
        replacement: 'ethers.utils.'
      },
      {
        pattern: /ethers\.constants\.ethers\.constants\.ethers\.constants\./g,
        replacement: 'ethers.constants.'
      },
      // Double duplications
      {
        pattern: /ethers\.providers\.ethers\.providers\./g,
        replacement: 'ethers.providers.'
      },
      {
        pattern: /ethers\.utils\.ethers\.utils\./g,
        replacement: 'ethers.utils.'
      },
      {
        pattern: /ethers\.constants\.ethers\.constants\./g,
        replacement: 'ethers.constants.'
      },
      // Double ethers patterns
      {
        pattern: /ethers\.ethers\.providers\./g,
        replacement: 'ethers.providers.'
      },
      {
        pattern: /ethers\.ethers\.utils\./g,
        replacement: 'ethers.utils.'
      },
      {
        pattern: /ethers\.ethers\.constants\./g,
        replacement: 'ethers.constants.'
      },
      {
        pattern: /ethers\.ethers\.Wallet/g,
        replacement: 'ethers.Wallet'
      }
    ];

    cleanupPatterns.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Cleaned duplicates in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      processDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      cleanupEthersDuplicates(fullPath);
    }
  }
}

// Process src directory
const srcPath = path.join(__dirname, 'src');
if (fs.existsSync(srcPath)) {
  console.log('Cleaning up ethers duplicates in src directory...');
  processDirectory(srcPath);
  console.log('Ethers duplicate cleanup completed!');
} else {
  console.error('src directory not found');
}
