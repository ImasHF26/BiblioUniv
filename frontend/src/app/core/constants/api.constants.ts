export const API_BASE_URL = 'http://localhost:8000/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    ME:    `${API_BASE_URL}/auth/me`,
  },
  BOOKS:       `${API_BASE_URL}/books`,
  CATEGORIES:  `${API_BASE_URL}/categories`,
  USERS:       `${API_BASE_URL}/users`,
  BORROWINGS:  `${API_BASE_URL}/borrowings`,
  PENALTIES:   `${API_BASE_URL}/penalties`,
  DASHBOARD: {
    STATS:             `${API_BASE_URL}/dashboard/stats`,
    RECENT_BORROWINGS: `${API_BASE_URL}/dashboard/recent-borrowings`,
    TOP_BOOKS:         `${API_BASE_URL}/dashboard/top-books`,
  },
};
