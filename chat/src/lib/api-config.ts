// API configuration
export const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:8000' 
  : ''

export const getApiUrl = (path: string) => `${API_BASE_URL}${path}`
