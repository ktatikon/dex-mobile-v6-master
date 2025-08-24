#!/usr/bin/env node

/**
 * Test using the exact format from Flutter documentation
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

async function testFlutterFormat() {
  console.log('🔍 Testing Exact Flutter Documentation Format...');
  console.log(`Base URL: ${API_CONFIG.baseURL}`);
  console.log(`API Key: ${API_CONFIG.apiKey.substring(0, 8)}...`);
  console.log('');

  // Test 1: Try the exact bank statement format from Flutter docs (adapted for PAN)
  console.log('1️⃣ Testing Flutter-style PAN Format...');
  
  const flutterStylePayload = {
    "task_id": "74f4c926-250c-43ca-9c53-453e87ceacd1",
    "group_id": "8e16424a-58fc-4ba4-ab20-5bc8e7c3c41e",
    "data": {
      "id_number": "ABCDE1234F"
    }
  };

  try {
    console.log('   Testing Flutter-style payload...');
    console.log(`   Payload: ${JSON.stringify(flutterStylePayload, null, 2)}`);
    
    const response = await axios.post(`${API_CONFIG.baseURL}/v3/tasks/sync/verify_with_source/ind_pan`, flutterStylePayload, {
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
    
    if (errorData) {
      console.log(`   Full Response: ${JSON.stringify(errorData, null, 2)}`);
    }
  }

  // Test 2: Try with different task_id and group_id (maybe they need to be valid UUIDs)
  console.log('\n2️⃣ Testing with Generated UUIDs...');
  
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  const uuidPayload = {
    "task_id": generateUUID(),
    "group_id": generateUUID(),
    "data": {
      "id_number": "ABCDE1234F"
    }
  };

  try {
    console.log('   Testing with generated UUIDs...');
    console.log(`   Payload: ${JSON.stringify(uuidPayload, null, 2)}`);
    
    const response = await axios.post(`${API_CONFIG.baseURL}/v3/tasks/sync/verify_with_source/ind_pan`, uuidPayload, {
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
    
    if (errorData) {
      console.log(`   Full Response: ${JSON.stringify(errorData, null, 2)}`);
    }
  }

  // Test 3: Try the bank statement endpoint to see if our credentials work there
  console.log('\n3️⃣ Testing Bank Statement Endpoint (from Flutter docs)...');
  
  const bankStatementPayload = {
    "task_id": generateUUID(),
    "group_id": generateUUID(),
    "data": {
      "bank_statement": "http://www.africau.edu/images/default/sample.pdf",
      "bank_name": "SBI",
      "account_type": "SAVING",
      "password": ""
    }
  };

  try {
    console.log('   Testing bank statement endpoint...');
    console.log(`   Payload: ${JSON.stringify(bankStatementPayload, null, 2)}`);
    
    const response = await axios.post(`${API_CONFIG.baseURL}/v3/tasks/async/verify_with_source/ind_bank_statement`, bankStatementPayload, {
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
    
    if (errorData) {
      console.log(`   Full Response: ${JSON.stringify(errorData, null, 2)}`);
    }
  }

  // Test 4: Try to get task status using the Flutter docs method
  console.log('\n4️⃣ Testing Task Status Endpoint...');
  
  try {
    console.log('   Testing task status endpoint...');
    
    const response = await axios.get(`${API_CONFIG.baseURL}/v3/tasks?request_id=test-request-id`, {
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
    
    if (status === 404) {
      console.log('   💡 404 is expected for invalid request_id');
    }
  }

  console.log('\n🎯 Flutter Format Testing Completed!');
}

testFlutterFormat().catch(console.error);
