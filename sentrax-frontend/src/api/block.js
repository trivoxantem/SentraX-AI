import axiosInstance from './axios';

/**
 * Block Rule Service
 * Handles blocking and unblocking websites
 */

export const blockService = {
  /**
   * Add a new block rule
   * @param {string} domain - Domain to block (e.g., facebook.com)
   * @returns {Promise<Object>} - { message, rule }
   */
  addBlockRule: async (domain) => {
    try {
      const response = await axiosInstance.post('block/', { domain });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to add block rule';
      throw new Error(errorMessage);
    }
  },

  /**
   * Get all active block rules for current user
   * @returns {Promise<Object>} - { count, rules }
   */
  getBlockRules: async () => {
    try {
      const response = await axiosInstance.get('block/');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch block rules';
      throw new Error(errorMessage);
    }
  },

  /**
   * Delete a block rule by ID
   * @param {number} id - Block rule ID
   * @returns {Promise<Object>} - { message }
   */
  deleteBlockRule: async (id) => {
    try {
      const response = await axiosInstance.delete(`block/${id}/`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to delete block rule';
      throw new Error(errorMessage);
    }
  },
};

export default blockService;
