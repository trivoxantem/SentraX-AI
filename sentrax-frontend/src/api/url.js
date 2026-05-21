import axiosInstance from './axios';

/**
 * URL Scanning Service
 * Handles URL checking and threat analysis
 */

export const urlService = {
  /**
   * Check a URL for security threats
   * @param {string} url - The URL to scan
   * @returns {Promise<Object>} - { url, domain, status, risk_score, threat_type, message }
   */
  checkUrl: async (url) => {
    try {
      const response = await axiosInstance.post('check-url/', {
        url: url.trim(),
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to scan URL';
      throw new Error(errorMessage);
    }
  },
};

export default urlService;

