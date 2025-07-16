#!/usr/bin/env node

/**
 * Fix Ethers.js v5/v6 compatibility issues
 * This script updates all ethers imports to use the v5 API structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapping of v6 imports to v5 equivalents
const importMappings = {
  'JsonRpcProvider': 'providers.JsonRpcProvider',
  'BrowserProvider': 'providers.Web3Provider',
  'formatEther': 'utils.formatEther',
  'parseEther': 'utils.parseEther',
  'formatUnits': 'utils.formatUnits',
  'parseUnits': 'utils.parseUnits',
  'isAddress': 'utils.isAddress',
  'getAddress': 'utils.getAddress',
  'getBytes': 'utils.arrayify',
  'HDNodeWallet': 'utils.HDNode',
  'ZeroAddress': 'constants.AddressZero'
};

function fixEthersImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // First, clean up any existing duplicated ethers patterns
    const duplicatePatterns = [
      /ethers\.providers\.ethers\.providers\.ethers\.providers\./g,
      /ethers\.providers\.ethers\.providers\./g,
      /ethers\.utils\.ethers\.utils\.ethers\.utils\./g,
      /ethers\.utils\.ethers\.utils\./g,
      /ethers\.constants\.ethers\.constants\./g
    ];

    duplicatePatterns.forEach(pattern => {
      if (pattern.test(content)) {
        if (pattern.source.includes('providers')) {
          content = content.replace(pattern, 'ethers.providers.');
        } else if (pattern.source.includes('utils')) {
          content = content.replace(pattern, 'ethers.utils.');
        } else if (pattern.source.includes('constants')) {
          content = content.replace(pattern, 'ethers.constants.');
        }
        modified = true;
      }
    });

    // Fix import statements - but only if not already prefixed with ethers.
    Object.entries(importMappings).forEach(([v6Import, v5Import]) => {
      // Only replace if it's not already prefixed with ethers.
      const standaloneRegex = new RegExp(`(?<!ethers\\.)\\b${v6Import}\\b`, 'g');
      if (standaloneRegex.test(content)) {
        content = content.replace(standaloneRegex, `ethers.${v5Import}`);
        modified = true;
      }
    });

    // Fix specific constructor patterns
    if (content.includes('new JsonRpcProvider') && !content.includes('new ethers.providers.JsonRpcProvider')) {
      content = content.replace(/new JsonRpcProvider/g, 'new ethers.providers.JsonRpcProvider');
      modified = true;
    }

    if (content.includes('new BrowserProvider') && !content.includes('new ethers.providers.Web3Provider')) {
      content = content.replace(/new BrowserProvider/g, 'new ethers.providers.Web3Provider');
      modified = true;
    }

    // Fix constants
    if (content.includes('ZeroAddress') && !content.includes('ethers.constants.AddressZero')) {
      content = content.replace(/\bZeroAddress\b/g, 'ethers.constants.AddressZero');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
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
      fixEthersImports(fullPath);
    }
  }
}

// Process src directory
const srcPath = path.join(__dirname, 'src');
if (fs.existsSync(srcPath)) {
  console.log('Fixing ethers imports in src directory...');
  processDirectory(srcPath);
  console.log('Ethers import fixes completed!');
} else {
  console.error('src directory not found');
}
