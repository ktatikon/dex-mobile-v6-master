#!/usr/bin/env node

/**
 * Final comprehensive cleanup of all ethers duplication patterns
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function finalEthersCleanup(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const originalContent = content;

    // Comprehensive cleanup patterns - order matters!
    const cleanupPatterns = [
      // Fix the most complex duplications first
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
      // ethers.ethers patterns
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
      },
      {
        pattern: /ethers\.ethers\.Contract/g,
        replacement: 'ethers.Contract'
      },
      // Fix any remaining standalone patterns that should be prefixed
      {
        pattern: /new JsonRpcProvider/g,
        replacement: 'new ethers.providers.JsonRpcProvider'
      },
      {
        pattern: /new Web3Provider/g,
        replacement: 'new ethers.providers.Web3Provider'
      },
      {
        pattern: /\bformatEther\(/g,
        replacement: 'ethers.utils.formatEther('
      },
      {
        pattern: /\bparseEther\(/g,
        replacement: 'ethers.utils.parseEther('
      },
      {
        pattern: /\bisAddress\(/g,
        replacement: 'ethers.utils.isAddress('
      }
    ];

    cleanupPatterns.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    // Additional cleanup for any remaining issues
    if (content.includes('ethers.ethers.')) {
      content = content.replace(/ethers\.ethers\./g, 'ethers.');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Final cleanup applied to: ${filePath}`);
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
      finalEthersCleanup(fullPath);
    }
  }
}

// Process src directory
const srcPath = path.join(__dirname, 'src');
if (fs.existsSync(srcPath)) {
  console.log('Performing final ethers cleanup in src directory...');
  processDirectory(srcPath);
  console.log('Final ethers cleanup completed!');
} else {
  console.error('src directory not found');
}
