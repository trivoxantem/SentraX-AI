import axiosInstance from './axios';

/**
 * Dashboard Service
 * Handles fetching dashboard data and statistics
 */

export const dashboardService = {
  /**
   * Get dashboard data for current user
   * @returns {Promise<Object>} - {
   *   total_scans,
   *   safe_sites,
   *   dangerous_sites,
   *   threats_blocked,
   *   safety_score,
   *   recent_activity
   * }
   */
  getDashboardData: async () => {
    try {
      const response = await axiosInstance.get('dashboard/');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch dashboard data';
      throw new Error(errorMessage);
    }
  },
};

export default dashboardService;
