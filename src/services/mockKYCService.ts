/**
 * Mock KYC Service for Development
 * Provides fallback when KYC microservices are not running
 */

export interface MockKYCResponse {
  success: boolean;
  message: string;
  data?: any;
}

class MockKYCService {
  private isEnabled = true;

  // Check if real services are available
  async checkServiceAvailability(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:4001/health', { 
        method: 'GET',
        timeout: 1000 
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Mock Aadhaar validation
  async validateAadhaar(aadhaarNumber: string): Promise<MockKYCResponse> {
    console.log('🎭 Using mock Aadhaar validation');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: 'Mock Aadhaar validation successful',
      data: {
        referenceId: 'MOCK_' + Date.now(),
        status: 'VALIDATED',
        name: 'Mock User',
        isValid: true
      }
    };
  }

  // Mock PAN validation
  async validatePAN(panNumber: string): Promise<MockKYCResponse> {
    console.log('🎭 Using mock PAN validation');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      success: true,
      message: 'Mock PAN validation successful',
      data: {
        referenceId: 'MOCK_PAN_' + Date.now(),
        status: 'VALIDATED',
        name: 'Mock User',
        isValid: true
      }
    };
  }

  // Mock AML check
  async performAMLCheck(userData: any): Promise<MockKYCResponse> {
    console.log('🎭 Using mock AML check');
    
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return {
      success: true,
      message: 'Mock AML check completed',
      data: {
        riskLevel: 'LOW',
        riskScore: 15,
        status: 'CLEARED',
        recommendations: ['User cleared for trading']
      }
    };
  }
}

export const mockKYCService = new MockKYCService();
