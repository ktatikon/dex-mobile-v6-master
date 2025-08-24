const { createClient } = require('@supabase/supabase-js');
const logger = require('./logger');

/**
 * Supabase client configuration for KYC/AML services
 */
class SupabaseManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.initialize();
  }

  /**
   * Initialize Supabase client
   */
  initialize() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase configuration - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
      }

      this.client = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        }
      });

      this.isConnected = true;
      logger.info('✅ Supabase client initialized successfully');

    } catch (error) {
      logger.error('❌ Failed to initialize Supabase client:', error);
      throw error;
    }
  }

  /**
   * Get Supabase client instance
   * @returns {Object} Supabase client
   */
  getClient() {
    if (!this.isConnected || !this.client) {
      throw new Error('Supabase client not initialized');
    }
    return this.client;
  }

  /**
   * Test database connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      const { data, error } = await this.client
        .from('kyc')
        .select('count')
        .limit(1);

      if (error) {
        logger.error('Supabase connection test failed:', error);
        return false;
      }

      logger.info('Supabase connection test successful');
      return true;
    } catch (error) {
      logger.error('Supabase connection test error:', error);
      return false;
    }
  }

  /**
   * Insert or update KYC record
   * @param {Object} kycData - KYC data to insert/update
   * @returns {Promise<Object>} Result
   */
  async upsertKYCRecord(kycData) {
    try {
      const { data, error } = await this.client
        .from('kyc')
        .upsert(kycData, {
          onConflict: 'user_id'
        })
        .select();

      if (error) {
        logger.error('Failed to upsert KYC record:', error);
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      logger.error('Error upserting KYC record:', error);
      throw error;
    }
  }

  /**
   * Get KYC record by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} KYC record
   */
  async getKYCRecord(userId) {
    try {
      const { data, error } = await this.client
        .from('kyc')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        logger.error('Failed to get KYC record:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error getting KYC record:', error);
      throw error;
    }
  }

  /**
   * Update KYC status
   * @param {string} userId - User ID
   * @param {string} status - New status
   * @param {Object} additionalData - Additional data to update
   * @returns {Promise<Object>} Result
   */
  async updateKYCStatus(userId, status, additionalData = {}) {
    try {
      const { data, error } = await this.client
        .from('kyc')
        .update({
          status,
          updated_at: new Date().toISOString(),
          ...additionalData
        })
        .eq('user_id', userId)
        .select();

      if (error) {
        logger.error('Failed to update KYC status:', error);
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      logger.error('Error updating KYC status:', error);
      throw error;
    }
  }

  /**
   * Insert audit log entry
   * @param {Object} auditData - Audit log data
   * @returns {Promise<Object>} Result
   */
  async insertAuditLog(auditData) {
    try {
      const { data, error } = await this.client
        .from('audit_logs')
        .insert({
          ...auditData,
          created_at: new Date().toISOString()
        })
        .select();

      if (error) {
        logger.error('Failed to insert audit log:', error);
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      logger.error('Error inserting audit log:', error);
      throw error;
    }
  }

  /**
   * Get PEP list data from storage
   * @param {string} fileName - PEP list file name
   * @returns {Promise<Object>} PEP list data
   */
  async getPEPListData(fileName) {
    try {
      const { data, error } = await this.client.storage
        .from('pep-list')
        .download(fileName);

      if (error) {
        logger.error('Failed to download PEP list:', error);
        throw error;
      }

      // Convert blob to text
      const text = await data.text();
      return JSON.parse(text);
    } catch (error) {
      logger.error('Error getting PEP list data:', error);
      throw error;
    }
  }

  /**
   * List files in PEP list storage bucket
   * @returns {Promise<Array>} List of files
   */
  async listPEPListFiles() {
    try {
      const { data, error } = await this.client.storage
        .from('pep-list')
        .list();

      if (error) {
        logger.error('Failed to list PEP files:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error listing PEP files:', error);
      throw error;
    }
  }

  /**
   * Health check for Supabase connection
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const isConnected = await this.testConnection();
      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        connected: isConnected
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        connected: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const supabaseManager = new SupabaseManager();

// Export both the manager and the client for convenience
module.exports = {
  supabaseManager,
  supabase: supabaseManager.getClient()
};
