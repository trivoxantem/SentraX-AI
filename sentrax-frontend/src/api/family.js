import axiosInstance from './axios';

/**
 * Family Management Service
 * Handles family creation, child management, and member retrieval
 */

export const familyService = {
  /**
   * Create a new family
   * @param {string} name - Family name
   * @returns {Promise<Object>} - { message, family }
   */
  createFamily: async (name) => {
    try {
      const response = await axiosInstance.post('family/', { name });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to create family';
      throw new Error(errorMessage);
    }
  },

  /**
   * Add a new child to parent's family
   * @param {string} username - Child's username
   * @param {string} password - Child's password
   * @returns {Promise<Object>} - { message, child }
   */
  addChild: async (username, password) => {
    try {
      const response = await axiosInstance.post('family/add-child/', {
        username,
        password,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to add child';
      throw new Error(errorMessage);
    }
  },

  /**
   * Get all family members
   * @returns {Promise<Object>} - { count, family_name, members }
   */
  getFamilyMembers: async () => {
    try {
      const response = await axiosInstance.get('family/members/');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch family members';
      throw new Error(errorMessage);
    }
  },

  /**
   * Get activity logs for a specific child
   * @param {number} childId - ID of the child user
   * @returns {Promise<Object>} - { child_username, count, activities }
   */
  getChildActivity: async (childId) => {
    try {
      const response = await axiosInstance.get(`child/${childId}/activity/`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch child activity';
      throw new Error(errorMessage);
    }
  },
};

export default familyService;
