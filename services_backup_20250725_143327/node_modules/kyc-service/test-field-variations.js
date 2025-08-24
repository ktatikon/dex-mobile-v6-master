#!/usr/bin/env node

/**
 * Test different field name variations for PAN verification
 */

require('dotenv').config();
const axios = require('axios');

const API_CONFIG = {
  baseURL: 'https://eve.idfy.com',
  apiKey: process.env.IDFY_API_KEY || 'e443e8cc-47ca-47e8-b0f3-da146040dd59',
  headers: {
    'api-key': process.env.IDFY_API_KEY || 'e443e8cc-47ca-47e8-b0f3-da146040dd59',
    'Content-Type': 'application/json'
  }
};

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testFieldVariations() {
  console.log('🔍 Testing Different Field Name Variations for PAN...');
  console.log(`Base URL: ${API_CONFIG.baseURL}`);
  console.log('');

  // Different field name variations to try
  const fieldVariations = [
    {
      name: 'pan_number',
      payload: {
        "task_id": generateUUID(),
        "group_id": generateUUID(),
        "data": {
          "pan_number": "ABCDE1234F"
        }
      }
    },
    {
      name: 'pan',
      payload: {
        "task_id": generateUUID(),
        "group_id": generateUUID(),
        "data": {
          "pan": "ABCDE1234F"
        }
      }
    },
    {
      name: 'document_number',
      payload: {
        "task_id": generateUUID(),
        "group_id": generateUUID(),
        "data": {
          "document_number": "ABCDE1234F"
        }
      }
    },
    {
      name: 'number',
      payload: {
        "task_id": generateUUID(),
        "group_id": generateUUID(),
        "data": {
          "number": "ABCDE1234F"
        }
      }
    },
    {
      name: 'source with id_number',
      payload: {
        "task_id": generateUUID(),
        "group_id": generateUUID(),
        "data": {
          "source": {
            "id_number": "ABCDE1234F"
          }
        }
      }
    },
    {
      name: 'source with pan',
      payload: {
        "task_id": generateUUID(),
        "group_id": generateUUID(),
        "data": {
          "source": {
            "pan": "ABCDE1234F"
          }
        }
      }
    },
    {
      name: 'document with id_number',
      payload: {
        "task_id": generateUUID(),
        "group_id": generateUUID(),
        "data": {
          "document": {
            "id_number": "ABCDE1234F"
          }
        }
      }
    },
    {
      name: 'input with id_number',
      payload: {
        "task_id": generateUUID(),
        "group_id": generateUUID(),
        "data": {
          "input": {
            "id_number": "ABCDE1234F"
          }
        }
      }
    }
  ];

  for (let i = 0; i < fieldVariations.length; i++) {
    const variation = fieldVariations[i];
    
    try {
      console.log(`${i + 1}️⃣ Testing field variation: ${variation.name}`);
      console.log(`   Payload: ${JSON.stringify(variation.payload, null, 2)}`);
      
      const response = await axios.post(`${API_CONFIG.baseURL}/v3/tasks/sync/verify_with_source/ind_pan`, variation.payload, {
        headers: API_CONFIG.headers,
        timeout: 15000
      });
      
      console.log(`   ✅ SUCCESS: Status ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      console.log(`   🎯 FOUND WORKING FIELD: ${variation.name}`);
      break; // Stop testing once we find a working format
      
    } catch (error) {
      const status = error.response?.status;
      const errorData = error.response?.data;
      
      console.log(`   ❌ Failed: Status ${status}`);
      console.log(`   Error: ${errorData?.message || error.message}`);
      
      // Show different error types
      if (errorData?.error === 'BAD_REQUEST') {
        console.log(`   💡 Still malformed request`);
      } else if (errorData?.error === 'VALIDATION_ERROR') {
        console.log(`   💡 Validation error - might be closer!`);
      } else if (status === 422) {
        console.log(`   💡 Unprocessable entity - field format might be correct but data invalid`);
      }
    }
    
    // Small delay to avoid rate limiting
    await delay(2000);
  }

  console.log('\n🎯 Field Variation Testing Completed!');
  
  // If none worked, try a completely different approach
  console.log('\n🔄 Trying Alternative Approach - Direct Fields...');
  
  const directFieldPayload = {
    "task_id": generateUUID(),
    "group_id": generateUUID(),
    "id_number": "ABCDE1234F" // Direct field, not nested in data
  };

  try {
    console.log('   Testing direct field approach...');
    console.log(`   Payload: ${JSON.stringify(directFieldPayload, null, 2)}`);
    
    const response = await axios.post(`${API_CONFIG.baseURL}/v3/tasks/sync/verify_with_source/ind_pan`, directFieldPayload, {
      headers: API_CONFIG.headers,
      timeout: 15000
    });
    
    console.log(`   ✅ SUCCESS: Status ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    
  } catch (error) {
    const status = error.response?.status;
    const errorData = error.response?.data;
    
    console.log(`   ❌ Failed: Status ${status}`);
    console.log(`   Error: ${errorData?.message || error.message}`);
  }
}

testFieldVariations().catch(console.error);
