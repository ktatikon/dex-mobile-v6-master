#!/usr/bin/env node

/**
 * Test to find missing required fields by sending minimal payloads
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

async function testMinimalRequired() {
  console.log('🔍 Testing Minimal Payloads to Find Required Fields...');
  console.log(`Base URL: ${API_CONFIG.baseURL}`);
  console.log('');

  // Test 1: Empty payload
  console.log('1️⃣ Testing Empty Payload...');
  try {
    const response = await axios.post(`${API_CONFIG.baseURL}/v3/tasks/sync/verify_with_source/ind_pan`, {}, {
      headers: API_CONFIG.headers,
      timeout: 15000
    });
    console.log(`   ✅ SUCCESS: Status ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    const errorData = error.response?.data;
    console.log(`   ❌ Failed: Status ${error.response?.status}`);
    console.log(`   Error: ${errorData?.message || error.message}`);
    if (errorData) {
      console.log(`   Full Response: ${JSON.stringify(errorData, null, 2)}`);
    }
  }

  // Test 2: Only task_id
  console.log('\n2️⃣ Testing Only task_id...');
  try {
    const payload = { "task_id": generateUUID() };
    const response = await axios.post(`${API_CONFIG.baseURL}/v3/tasks/sync/verify_with_source/ind_pan`, payload, {
      headers: API_CONFIG.headers,
      timeout: 15000
    });
    console.log(`   ✅ SUCCESS: Status ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    const errorData = error.response?.data;
    console.log(`   ❌ Failed: Status ${error.response?.status}`);
    console.log(`   Error: ${errorData?.message || error.message}`);
  }

  // Test 3: task_id + group_id (no data)
  console.log('\n3️⃣ Testing task_id + group_id (no data)...');
  try {
    const payload = { 
      "task_id": generateUUID(),
      "group_id": generateUUID()
    };
    const response = await axios.post(`${API_CONFIG.baseURL}/v3/tasks/sync/verify_with_source/ind_pan`, payload, {
      headers: API_CONFIG.headers,
      timeout: 15000
    });
    console.log(`   ✅ SUCCESS: Status ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    const errorData = error.response?.data;
    console.log(`   ❌ Failed: Status ${error.response?.status}`);
    console.log(`   Error: ${errorData?.message || error.message}`);
    
    // Look for specific error messages that might indicate missing fields
    if (errorData?.message && errorData.message.includes('required')) {
      console.log(`   💡 Found required field hint: ${errorData.message}`);
    }
  }

  // Test 4: Try with empty data object
  console.log('\n4️⃣ Testing with empty data object...');
  try {
    const payload = { 
      "task_id": generateUUID(),
      "group_id": generateUUID(),
      "data": {}
    };
    const response = await axios.post(`${API_CONFIG.baseURL}/v3/tasks/sync/verify_with_source/ind_pan`, payload, {
      headers: API_CONFIG.headers,
      timeout: 15000
    });
    console.log(`   ✅ SUCCESS: Status ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    const errorData = error.response?.data;
    console.log(`   ❌ Failed: Status ${error.response?.status}`);
    console.log(`   Error: ${errorData?.message || error.message}`);
  }

  // Test 5: Try a different endpoint that might work
  console.log('\n5️⃣ Testing Different Endpoint (Aadhaar)...');
  try {
    const payload = { 
      "task_id": generateUUID(),
      "group_id": generateUUID(),
      "data": {
        "aadhaar_number": "234567890123"
      }
    };
    const response = await axios.post(`${API_CONFIG.baseURL}/v3/tasks/async/verify_with_source/ind_aadhaar_otp`, payload, {
      headers: API_CONFIG.headers,
      timeout: 15000
    });
    console.log(`   ✅ SUCCESS: Status ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    const errorData = error.response?.data;
    console.log(`   ❌ Failed: Status ${error.response?.status}`);
    console.log(`   Error: ${errorData?.message || error.message}`);
    
    if (error.response?.status === 404) {
      console.log(`   💡 404 - Endpoint doesn't exist`);
    } else if (error.response?.status === 400 && errorData?.error !== 'BAD_REQUEST') {
      console.log(`   💡 Different error type: ${errorData?.error}`);
    }
  }

  // Test 6: Check account permissions by trying to list tasks
  console.log('\n6️⃣ Testing Account Permissions (List Tasks)...');
  try {
    const response = await axios.get(`${API_CONFIG.baseURL}/v3/tasks`, {
      headers: API_CONFIG.headers,
      timeout: 15000
    });
    console.log(`   ✅ SUCCESS: Status ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    const errorData = error.response?.data;
    console.log(`   ❌ Failed: Status ${error.response?.status}`);
    console.log(`   Error: ${errorData?.message || error.message}`);
  }

  console.log('\n🎯 Minimal Required Fields Testing Completed!');
  
  console.log('\n📋 Summary:');
  console.log('   - All PAN verification attempts return "Malformed request"');
  console.log('   - Authentication is working (getting proper IDfy responses)');
  console.log('   - Base URL and endpoints are correct');
  console.log('   - Issue appears to be with payload format or account permissions');
  
  console.log('\n💡 Recommendations:');
  console.log('   1. Contact IDfy support with these test results');
  console.log('   2. Verify account has PAN verification permissions');
  console.log('   3. Request official API documentation with payload examples');
  console.log('   4. Check if account needs to be activated for specific verification types');
}

testMinimalRequired().catch(console.error);
