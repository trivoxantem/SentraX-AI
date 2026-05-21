import axiosInstance from './axios';

/**
 * Settings Service
 * Handles all settings and profile management operations
 */

export const settingsService = {
  /**
   * Get user settings and profile information
   * @returns {Promise<Object>} - User settings data
   */
  getSettings: async () => {
    try {
      const response = await axiosInstance.get('settings/');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch settings';
      throw new Error(errorMessage);
    }
  },

  /**
   * Update user profile information
   * @param {Object} data - { username, email, profile_image }
   * @returns {Promise<Object>} - Updated user data
   */
  updateProfile: async (data) => {
    try {
      // If profile_image is included and it's a File object, use FormData
      if (data.profile_image instanceof File) {
        const formData = new FormData();
        if (data.username) formData.append('username', data.username);
        if (data.email) formData.append('email', data.email);
        formData.append('profile_image', data.profile_image);

        // Don't set Content-Type header - axios will handle it automatically
        const response = await axiosInstance.patch('settings/update/', formData);
        return response.data;
      } else {
        // Regular JSON request
        const response = await axiosInstance.patch('settings/update/', data);
        return response.data;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      throw new Error(errorMessage);
    }
  },

  /**
   * Change user password
   * @param {Object} data - { old_password, new_password, new_password_confirm }
   * @returns {Promise<Object>} - Success message
   */
  changePassword: async (data) => {
    try {
      const response = await axiosInstance.patch('settings/password/', data);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.error || errorData?.new_password?.[0] || errorData?.old_password?.[0] || 'Failed to change password';
      throw new Error(errorMessage);
    }
  },

  /**
   * Get privacy settings
   * @returns {Promise<Object>} - Privacy settings data
   */
  getPrivacySettings: async () => {
    try {
      const response = await axiosInstance.get('settings/privacy/');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch privacy settings';
      throw new Error(errorMessage);
    }
  },

  /**
   * Update privacy settings
   * @param {Object} data - { notifications_enabled }
   * @returns {Promise<Object>} - Updated settings data
   */
  updatePrivacy: async (data) => {
    try {
      const response = await axiosInstance.patch('settings/privacy/', data);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update privacy settings';
      throw new Error(errorMessage);
    }
  },
};

export default settingsService;
