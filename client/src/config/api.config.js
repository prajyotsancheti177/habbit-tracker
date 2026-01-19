/**
 * API Configuration
 * 
 * Centralized configuration for all API endpoints.
 * Change the API_BASE_URL to switch between development and production environments.
 */

// Production API URL
export const API_BASE_URL = 'https://habit-tracker.prajyot.online/api';

// For local development, uncomment the line below and comment out the production URL above:
// export const API_BASE_URL = 'http://localhost:5001/api';

// Upload endpoint base URL (for serving uploaded files)
export const UPLOADS_BASE_URL = API_BASE_URL.replace('/api', '/uploads');

export default {
  API_BASE_URL,
  UPLOADS_BASE_URL
};
