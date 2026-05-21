import axiosInstance from './axios';

/**
 * Activity Log Service
 * Handles fetching activity logs
 */

export const activityService = {
  /**
   * Get all activity logs for current user
   * @returns {Promise<Object>} - { count, activities }
   */
  getActivities: async () => {
    try {
      const response = await axiosInstance.get('activity/');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch activities';
      throw new Error(errorMessage);
    }
  },
};

export default activityService;
