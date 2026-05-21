import axiosInstance from './axios';

/**
 * Alerts Service
 * Handles fetching alerts and marking them as read
 */

export const alertsService = {
  /**
   * Get all alerts for the current parent user
   * @returns {Promise<Object>} - { count, unread_count, alerts }
   */
  getAlerts: async () => {
    try {
      const response = await axiosInstance.get('alerts/');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch alerts';
      throw new Error(errorMessage);
    }
  },

  /**
   * Mark an alert as read
   * @param {number} alertId - Alert ID
   * @returns {Promise<Object>} - { message, alert }
   */
  markAsRead: async (alertId) => {
    try {
      const response = await axiosInstance.patch(`alerts/${alertId}/read/`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to mark alert as read';
      throw new Error(errorMessage);
    }
  },
};

export default alertsService;
