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

    // Fix import statements
    Object.entries(importMappings).forEach(([v6Import, v5Import]) => {
      const importRegex = new RegExp(`\\b${v6Import}\\b`, 'g');
      if (content.includes(v6Import)) {
        content = content.replace(importRegex, `ethers.${v5Import}`);
        modified = true;
      }
    });

    // Fix specific patterns
    if (content.includes('new ethers.providers.JsonRpcProvider')) {
      // Already correct
    } else if (content.includes('new ethers.JsonRpcProvider')) {
      content = content.replace(/new ethers\.JsonRpcProvider/g, 'new ethers.providers.JsonRpcProvider');
      modified = true;
    }

    if (content.includes('new ethers.providers.Web3Provider')) {
      // Already correct
    } else if (content.includes('new ethers.BrowserProvider')) {
      content = content.replace(/new ethers\.BrowserProvider/g, 'new ethers.providers.Web3Provider');
      modified = true;
    }

    // Fix constants
    if (content.includes('ethers.constants.AddressZero')) {
      // Already correct
    } else if (content.includes('ethers.ZeroAddress')) {
      content = content.replace(/ethers\.ZeroAddress/g, 'ethers.constants.AddressZero');
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
