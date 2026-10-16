import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for large model inference
});

// Response interceptor for consistent error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMsg = error.response?.data?.message || error.message || 'An unexpected error occurred.';
    console.error('[API Error]:', errorMsg);
    return Promise.reject(new Error(errorMsg));
  }
);

export const apiService = {
  // System Health
  getHealth: () => apiClient.get('/health'),

  // Recruiter Dashboard
  getDashboardStats: () => apiClient.get('/dashboard/stats'),

  // Job Management
  getJobs: () => apiClient.get('/jobs'),
  getJob: (id) => apiClient.get(`/jobs/${id}`),
  createJob: (jobData) => apiClient.post('/jobs', jobData),
  updateJob: (id, jobData) => apiClient.put(`/jobs/${id}`, jobData),
  deleteJob: (id) => apiClient.delete(`/jobs/${id}`),
  getJobScreenings: (id) => apiClient.get(`/jobs/${id}/screenings`),

  // Screening Pipeline
  startScreening: (formData, onProgress) => {
    return apiClient.post('/screenings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
  },
  getScreenings: () => apiClient.get('/screenings'),
  getScreening: (id) => apiClient.get(`/screenings/${id}`),
  getScreeningCandidates: (id, params = {}) => apiClient.get(`/screenings/${id}/candidates`, { params }),

  // Candidate Details & Comparison
  getCandidate: (id, sessionId = null) => apiClient.get(`/candidates/${id}`, { params: sessionId ? { session_id: sessionId } : {} }),
  compareCandidates: (resultIds = [], candidateIds = []) => {
    const params = {};
    if (resultIds.length > 0) params.result_ids = resultIds.join(',');
    if (candidateIds.length > 0) params.candidate_ids = candidateIds.join(',');
    return apiClient.get('/candidates/compare', { params });
  },

  // Research Evaluation
  getBenchmark: (k = 3) => apiClient.get('/evaluation/benchmark', { params: { k } }),

  // Configuration & Settings
  getSettings: () => apiClient.get('/settings'),
  updateSettings: (settingsData) => apiClient.put('/settings', settingsData),
  getTaxonomy: () => apiClient.get('/settings/taxonomy'),

  // Export URLs
  getExportUrl: (sessionId, format = 'csv') => `${API_BASE_URL}/screenings/${sessionId}/export?format=${format}`
};

export default apiService;
