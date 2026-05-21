import axiosInstance from './axios';

// =========================
// AUTH SERVICE
// =========================

export const authService = {
  /**
   * Register a new user
   * @param {Object} data - { username, email, password, password2, role }
   * @returns {Promise}
   */
  registerUser: async (data) => {
    try {
      const response = await axiosInstance.post('auth/register/', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Registration failed' };
    }
  },

  /**
   * Login user
   * @param {Object} data - { username, password }
   * @returns {Promise}
   */
  loginUser: async (data) => {
    try {
      const response = await axiosInstance.post('auth/login/', data);
      const { access, refresh, user } = response.data;

      // Store tokens in localStorage
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));

      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Login failed' };
    }
  },

  /**
   * Get current user profile
   * @returns {Promise}
   */
  getUser: async () => {
    try {
      const response = await axiosInstance.get('auth/user/');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch user' };
    }
  },

  /**
   * Logout user
   * @returns {Promise}
   */
  logoutUser: async () => {
    try {
      await axiosInstance.post('auth/logout/');
      // Clear tokens from localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      return { message: 'Logged out successfully' };
    } catch (error) {
      // Even if the request fails, clear tokens locally
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      throw error.response?.data || { error: 'Logout failed' };
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  /**
   * Get stored user from localStorage
   * @returns {Object|null}
   */
  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Get access token
   * @returns {string|null}
   */
  getAccessToken: () => {
    return localStorage.getItem('access_token');
  },

  /**
   * Get refresh token
   * @returns {string|null}
   */
  getRefreshToken: () => {
    return localStorage.getItem('refresh_token');
  },
};

export default authService;
